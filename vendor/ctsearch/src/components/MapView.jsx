import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Source, Marker, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Delaunay } from "d3-delaunay";
import polygonClipping from "polygon-clipping";
import { DENSITY_BANDS } from "../utils/helpers/populationMapPoints";

// Module-level cache — worldGeojson is ~500KB, fetched once for the entire session
let _worldGeojsonCache = null;
let _worldGeojsonPromise = null;

// Module-level cache for US ZIP boundaries (ZCTA polygons keyed by 5-digit ZIP)
let _zipBoundaryCache = null; // Map<string, GeoJSON Polygon|MultiPolygon geometry>
let _zipBoundaryPromise = null;

function getBBox(geom) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const visit = (c) => {
    if (typeof c[0] === "number") {
      if (c[0] < minX) minX = c[0]; if (c[0] > maxX) maxX = c[0];
      if (c[1] < minY) minY = c[1]; if (c[1] > maxY) maxY = c[1];
    } else { for (const cc of c) visit(cc); }
  };
  visit(geom.coordinates);
  return [minX, minY, maxX, maxY];
}

async function fetchUSCountyFeatures() {
  if (_zipBoundaryCache) return _zipBoundaryCache;
  if (_zipBoundaryPromise) return _zipBoundaryPromise;
  // us-atlas counties topojson — real administrative boundaries, no ocean clipping issues
  _zipBoundaryPromise = fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json")
    .then((r) => r.json())
    .then((topo) => import("topojson-client").then(({ feature }) => {
      const fc = feature(topo, topo.objects.counties);
      // Pre-compute bounding boxes so point-in-polygon can skip most counties quickly
      _zipBoundaryCache = fc.features.map((f) => ({ ...f, _bbox: getBBox(f.geometry) }));
      return _zipBoundaryCache;
    }))
    .catch(() => {
      _zipBoundaryPromise = null;
      return null;
    });
  return _zipBoundaryPromise;
}

// Point-in-polygon ray-casting test
function pointInPolygonRing(ring, px, py) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (((yi > py) !== (yj > py)) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
function pointInFeature(feature, px, py) {
  const geom = feature.geometry;
  if (!geom) return false;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) {
    if (pointInPolygonRing(poly[0], px, py)) {
      let inHole = false;
      for (let h = 1; h < poly.length; h++) {
        if (pointInPolygonRing(poly[h], px, py)) { inHole = true; break; }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const MAPTILER_STYLES = {
  dataviz:   `https://api.maptiler.com/maps/dataviz/style.json?key=${MAPTILER_KEY}`,
  basic:     `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`,
  streets:   `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  satellite: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`,
  hybrid:    `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
};

const DEFAULT_INITIAL_VIEW_STATE = { longitude: 0, latitude: 20, zoom: 2 };

const NUMERIC_TO_ISO3 = {
  "004":"AFG","008":"ALB","012":"DZA","024":"AGO","032":"ARG","036":"AUS","040":"AUT",
  "050":"BGD","056":"BEL","068":"BOL","076":"BRA","100":"BGR","116":"KHM","120":"CMR",
  "124":"CAN","152":"CHL","156":"CHN","170":"COL","191":"HRV","192":"CUB","203":"CZE",
  "208":"DNK","218":"ECU","818":"EGY","231":"ETH","246":"FIN","250":"FRA","276":"DEU",
  "288":"GHA","300":"GRC","320":"GTM","348":"HUN","356":"IND","360":"IDN","364":"IRN",
  "368":"IRQ","372":"IRL","376":"ISR","380":"ITA","392":"JPN","400":"JOR","398":"KAZ",
  "404":"KEN","410":"KOR","414":"KWT","418":"LAO","428":"LVA","422":"LBN","434":"LBY",
  "440":"LTU","442":"LUX","458":"MYS","484":"MEX","498":"MDA","496":"MNG","504":"MAR",
  "508":"MOZ","104":"MMR","524":"NPL","528":"NLD","554":"NZL","566":"NGA","578":"NOR",
  "512":"OMN","586":"PAK","591":"PAN","600":"PRY","604":"PER","608":"PHL","616":"POL",
  "620":"PRT","634":"QAT","642":"ROU","643":"RUS","646":"RWA","682":"SAU","686":"SEN",
  "703":"SVK","705":"SVN","706":"SOM","710":"ZAF","724":"ESP","144":"LKA","729":"SDN",
  "752":"SWE","756":"CHE","760":"SYR","158":"TWN","762":"TJK","834":"TZA","764":"THA",
  "788":"TUN","792":"TUR","800":"UGA","804":"UKR","784":"ARE","826":"GBR","840":"USA",
  "858":"URY","860":"UZB","862":"VEN","704":"VNM","887":"YEM","894":"ZMB","716":"ZWE",
};

const ISO3_TO_NUMERIC = Object.fromEntries(
  Object.entries(NUMERIC_TO_ISO3).map(([num, iso3]) => [iso3, num])
);

// Fixed density-bucket palette (persons / km²) matching a standard population
// density choropleth: white → pale yellow → gold → orange → red.
// The intensity values produced by scaleIntensity (1,3,5,7,10) land on these
// stops so each density bin renders as its designated color.
//   intensity 1  (t=0.1)  0.01–5    near-white
//   intensity 3  (t=0.3)  5–10      pale yellow
//   intensity 5  (t=0.5)  10–50     gold
//   intensity 7  (t=0.7)  50–100    orange
//   intensity 10 (t=1.0)  100+      red
// OLD yellow→red ramp (kept for reference — do not delete)
// const COLOR_STOPS = [
//   { t: 0,    color: "rgba(255,251,235,1)" },  // faint cream (virtually zero population)
//   { t: 0.1,  color: "rgba(255,247,214,1)" },  // minimal — soft cream, still visible
//   { t: 0.3,  color: "rgba(255,235,178,1)" },  // low — pale yellow
//   { t: 0.5,  color: "rgba(253,204,102,1)" },  // 10–50    gold
//   { t: 0.7,  color: "rgba(241,140,45,1)"  },  // 50–100   orange
//   { t: 1.0,  color: "rgba(220,30,20,1)"   },  // 100+     red
// ];

// OLD: white + 3× green + 3× orange + 3× red — 10 stops (kept for reference — do not delete)
// const COLOR_STOPS = [
//   { t: 0,     color: "rgba(255,255,255,1)" },  // white              — virtually zero population
//   { t: 0.11,  color: "rgba(166,228,169,1)" },  // green light        — minimal
//   { t: 0.22,  color: "rgba(129,199,132,1)" },  // green mid          — very low
//   { t: 0.33,  color: "rgba(75,145,78,1)"   },  // green dark         — low
//   { t: 0.44,  color: "rgba(241,128,16,1)"  },  // orange light       — low-medium
//   { t: 0.55,  color: "rgba(193,102,13,1)"  },  // orange mid         — medium
//   { t: 0.66,  color: "rgba(145,77,10,1)"   },  // orange dark        — medium-high
//   { t: 0.78,  color: "rgba(241,87,87,1)"   },  // red light          — high
//   { t: 0.89,  color: "rgba(193,70,70,1)"   },  // red mid            — very high
//   { t: 1.0,   color: "rgba(145,52,52,1)"   },  // red dark           — extreme
// ];

// ACTIVE: Maximum Red Purple monochromatic ramp — 7 colors including white.
// The stop positions MUST match the discrete intensities produced by
// scaleIntensity (0, 1, 2, 4, 6, 8, 10 → t of 0, 0.1, 0.2, 0.4, 0.6, 0.8, 1.0);
// otherwise regions render as interpolated in-between shades that never
// appear in the legend. One stop per bucket = legend matches the map exactly.
const COLOR_STOPS = [
  { t: 0,    color: "rgba(255,255,255,1)" },  // white     — no data / zero population
  { t: 0.1,  color: "rgba(221,156,194,1)" },  // #DD9CC2   — minimal
  { t: 0.2,  color: "rgba(207,119,170,1)" },  // #CF77AA   — low
  { t: 0.4,  color: "rgba(194,81,147,1)"  },  // #C25193   — medium-low
  { t: 0.6,  color: "rgba(166,58,121,1)"  },  // #A63A79   — medium
  { t: 0.8,  color: "rgba(128,45,93,1)"   },  // #802D5D   — high
  { t: 1.0,  color: "rgba(90,32,66,1)"    },  // #5A2042   — very high
];

const NO_DATA_COLOR = "rgba(245,245,240,0.4)";

function intensityToColor(intensity) {
  const t = Math.max(0, Math.min(1, intensity / 10));
  // Linear interpolation between stops for smooth gradient
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    if (t <= COLOR_STOPS[i].t) {
      const prev = COLOR_STOPS[i - 1];
      const next = COLOR_STOPS[i];
      const ratio = (t - prev.t) / (next.t - prev.t);
      // Parse and interpolate rgba values
      const parseRgba = (s) => s.match(/[\d.]+/g).map(Number);
      const p = parseRgba(prev.color);
      const n = parseRgba(next.color);
      const r = Math.round(p[0] + (n[0] - p[0]) * ratio);
      const g = Math.round(p[1] + (n[1] - p[1]) * ratio);
      const b = Math.round(p[2] + (n[2] - p[2]) * ratio);
      return `rgba(${r},${g},${b},1)`;
    }
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1].color;
}
// keep old name as alias so all call-sites work without rename
const intensityToBlue = intensityToColor;

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v) && !Number.isNaN(v);
}

function normalizePoint(raw) {
  if (!raw || typeof raw !== "object") return null;
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;
  return {
    id: raw.id ?? `${lng},${lat}`,
    lat, lng,
    name: raw.name ?? "Unknown",
    intensity: isFiniteNumber(Number(raw.intensity)) ? Number(raw.intensity) : 0,
    caseCount: raw.caseCount ?? 0,
    caseRatio: raw.caseRatio ?? 0,
    population: raw.population ?? 0,
    area: raw.area ?? 0,
    density: raw.density ?? 0,
    zipcode: raw.zipcode ?? null,
    iso3: raw.iso3 ?? null,
    countryName: raw.countryName ?? null,
  };
}

// Douglas-Peucker line simplification — reduces coordinate count of country boundary
// dramatically (e.g. 8000 pts → 300 pts) making polygon-clipping 20x faster
function simplifyRing(ring, tolerance) {
  if (ring.length <= 4) return ring;
  const getSqDist = (p1, p2) => {
    const dx = p1[0] - p2[0], dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
  };
  const getSqSegDist = (p, p1, p2) => {
    let x = p1[0], y = p1[1], dx = p2[0] - x, dy = p2[1] - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = p2[0]; y = p2[1]; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    return (p[0] - x) ** 2 + (p[1] - y) ** 2;
  };
  const simplifyDPStep = (pts, first, last, sqTol, simplified) => {
    let maxSqDist = sqTol, index = -1;
    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDist(pts[i], pts[first], pts[last]);
      if (sqDist > maxSqDist) { index = i; maxSqDist = sqDist; }
    }
    if (index !== -1) {
      if (index - first > 1) simplifyDPStep(pts, first, index, sqTol, simplified);
      simplified.push(pts[index]);
      if (last - index > 1) simplifyDPStep(pts, index, last, sqTol, simplified);
    }
  };
  const sqTol = tolerance * tolerance;
  const last = ring.length - 1;
  const simplified = [ring[0]];
  simplifyDPStep(ring, 0, last, sqTol, simplified);
  simplified.push(ring[last]);
  return simplified;
}

function simplifyGeometry(geom, tolerance) {
  if (geom.type === "Polygon") {
    return { ...geom, coordinates: geom.coordinates.map(r => simplifyRing(r, tolerance)) };
  }
  if (geom.type === "MultiPolygon") {
    return { ...geom, coordinates: geom.coordinates.map(poly => poly.map(r => simplifyRing(r, tolerance))) };
  }
  return geom;
}

// Compute polygon area using the shoelace formula (in degree² units — only used for relative comparison)
function ringArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(area / 2);
}

function polygonArea(clipped) {
  let area = 0;
  for (const poly of clipped) {
    if (poly[0]) area += ringArea(poly[0]); // outer ring only
  }
  return area;
}

// Build Voronoi regions for city-level choropleth, clipped to a country polygon
function buildVoronoiFeatures(points, countryFeature) {
  if (!points.length || !countryFeature?.geometry) return [];

  const geom = countryFeature.geometry;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const collectCoords = (coords) => {
    if (typeof coords[0] === "number") {
      if (coords[0] < minX) minX = coords[0]; if (coords[0] > maxX) maxX = coords[0];
      if (coords[1] < minY) minY = coords[1]; if (coords[1] > maxY) maxY = coords[1];
    } else { for (const c of coords) collectCoords(c); }
  };
  collectCoords(geom.coordinates);

  const padX = Math.max((maxX - minX) * 0.25, 2);
  const padY = Math.max((maxY - minY) * 0.25, 2);
  const bounds = [minX - padX, minY - padY, maxX + padX, maxY + padY];

  const coords = points.map((p) => [p.lng, p.lat]);
  const delaunay = Delaunay.from(coords);
  const voronoi = delaunay.voronoi(bounds);

  const span = Math.max(maxX - minX, maxY - minY);
  const tolerance = span * 0.003;
  const simplifiedGeom = simplifyGeometry(geom, tolerance);

  const countryClip = simplifiedGeom.type === "Polygon"
    ? [simplifiedGeom.coordinates]
    : simplifiedGeom.coordinates;

  // Build clipped Voronoi cells
  const features = [];
  for (let i = 0; i < points.length; i++) {
    const cell = voronoi.cellPolygon(i);
    if (!cell || cell.length < 4) continue;
    let clipped;
    try { clipped = polygonClipping.intersection([[cell]], countryClip); }
    catch (_) { continue; }
    if (!clipped || !clipped.length) continue;

    const p = points[i];
    features.push({
      type: "Feature",
      properties: {
        cityId: p.id, name: p.name,
        intensity: p.intensity,
        caseCount: p.caseCount, caseRatio: p.caseRatio ?? 0, population: p.population,
        area: p.area ?? 0, density: p.density ?? 0,
        zipcode: p.zipcode ?? "", fillColor: intensityToBlue(p.intensity),
      },
      geometry: clipped.length === 1
        ? { type: "Polygon", coordinates: clipped[0] }
        : { type: "MultiPolygon", coordinates: clipped },
    });
  }
  return features;
}

// ─────────────────────────────────────────────────────────────────────────────
// Map markers (large, used for pins on the map itself)

function SiteMarkerIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_42194_15091)">
        <circle cx="20" cy="16" r="10" fill="#2666BE" />
        <circle cx="20" cy="16" r="9" stroke="white" strokeWidth="2" />
      </g>
      <defs>
        <filter id="filter0_d_42194_15091" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.510355 0 0 0 0 0.56139 0 0 0 0 0.663462 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_42194_15091" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_42194_15091" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}

function TrialMarkerIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_42194_15097)">
        <circle cx="20" cy="16" r="10" fill="#C14646" />
        <circle cx="20" cy="16" r="9.5" stroke="white" />
      </g>
      <line x1="11" y1="15.5" x2="29" y2="15.5" stroke="white" />
      <line x1="20.5" y1="7" x2="20.5" y2="25" stroke="white" />
      <defs>
        <filter id="filter0_d_42194_15097" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.510355 0 0 0 0 0.56139 0 0 0 0 0.663462 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_42194_15097" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_42194_15097" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}

// Small bullet dots used inline in popup titles (NOT the big map-pin icons above)
function SiteDot({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      style={{ flexShrink: 0 }}
    >
      {/* White outer circle */}
      <circle cx="6" cy="6" r="6" fill="#f3eeee" />

      {/* Blue inner circle */}
      <circle cx="6" cy="6" r="5" fill="#2666BE" />
    </svg>
  );
}

function TrialDot({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      style={{ flexShrink: 0 }}
    >
      {/* White outer circle */}
      <circle cx="6" cy="6" r="6" fill="#f3eeee" />

      {/* Red inner circle */}
      <circle cx="6" cy="6" r="5" fill="#C14646" />

      {/* White plus */}
      <line
        x1="2"
        y1="6"
        x2="10"
        y2="6"
        stroke="#fff"
        strokeWidth="1"
      />
      <line
        x1="6"
        y1="2"
        x2="6"
        y2="10"
        stroke="#fff"
        strokeWidth="1"
      />
    </svg>
  );
}


// ── Popup card layout — matches Figma: fixed 280px width, 12px padding,
// label/value rows that never overlap even when values wrap to 2 lines ──
function PopupShell({ children }) {
  return (
    <div style={{ fontFamily: "Rubik, sans-serif", width: 280, boxSizing: "border-box", padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      {children}
    </div>
  );
}

function PopupTitle({ dot, name }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <span style={{ marginTop: 4 }}>{dot}</span>
      <span style={{ fontSize: 16, fontWeight: 500, color: "#000000", lineHeight: "20px" }}>{name}</span>
    </div>
  );
}

function PopupRow({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span style={{ fontSize: 14, color: "#00000099", flexShrink: 0, lineHeight: '20px', fontWeight: 400 }}>{label}:</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "#000000CC", textAlign: "right", lineHeight: "20px", marginLeft: "auto" }}>{value}</span>
    </div>
  );
}

function SitePopupCard({ site }) {
  const rows = [
    ["Type", site.type],
    ["Network", site.network],
    ["Clinical Trials Unit", site.hasClinicalTrialsUnit ? "YES" : "NO"],
    ["Catchment Population", site.catchmentPopulation],
    ["Enrolled", site.enrolled],
    ["Site score", site.score != null ? `${site.score} pts` : null],
  ].filter(([, v]) => v != null && v !== "");

  return (
    <PopupShell>
      <PopupTitle dot={<SiteDot />} name={site.name} />
      {rows.map(([label, value]) => (
        <PopupRow key={label} label={label} value={value} />
      ))}
    </PopupShell>
  );
}

function TrialPopupCard({ trial }) {
  const rows = [
    ["Sponsor", trial.sponsor],
    ["Phase", trial.phase],
    ["Patient Focus", trial.patientFocus],
    ["Active Sites", trial.activeSites],
    ["Study Start", trial.studyStart],
  ].filter(([, v]) => v != null && v !== "");

  return (
    <PopupShell>
      <PopupTitle dot={<TrialDot />} name={trial.name} />

      {rows.map(([label, value]) => (
        <PopupRow key={label} label={label} value={value} />
      ))}

      {trial.detailsUrl && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #F0F6FE",
            textAlign: 'left'
          }}
        >
          <a
            href={trial.detailsUrl}
            style={{
              display: "inline-block",
              fontSize: 14,
              fontWeight: 500,
              color: "#2666BE",
              textDecoration: "none",
            }}
          >
            View Study Details
          </a>
        </div>
      )}
    </PopupShell>
  );
}

// ── Legend ──
function ColorCheckbox({ checked, onChange, color }) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(); } }}
      style={{
        width: 16,
        height: 16,
        borderRadius: 3,
        cursor: "pointer",
        flexShrink: 0,
        background: checked ? color : "#fff",
        border: checked ? "none" : "1.5px solid #CBD5E1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function LegendRow({ checked, onChange, checkboxColor, swatch, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}>
      <ColorCheckbox checked={checked} onChange={onChange} color={checkboxColor} />
      {swatch && (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16 }}>
          {swatch}
        </span>
      )}
      <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
    </label>
  );
}

export default function MapView({
  data = [],
  loading = false,
  initialViewState = DEFAULT_INITIAL_VIEW_STATE,
  mapStyle,
  cohortTotal = 0,
  legendTitle = "Population density",
  totalLabel = "cases per year",
  siteMarkers = [],   // [{ id, lat, lng, name, type, network, hasClinicalTrialsUnit, catchmentPopulation, enrolled, score }]
  trialMarkers = [],  // [{ id, lat, lng, name, sponsor, phase, patientFocus, activeSites, studyStart, detailsUrl }]
  variant = "population", // "population" (old, PopulationTab) | "sites" (new, ShortlistedSitesBlock)
}) {

  const [layerVisibility, setLayerVisibility] = useState({
    density: true,
    sites: true,
    trials: true,
  });
  const toggleLayer = (key) => setLayerVisibility((v) => ({ ...v, [key]: !v[key] }));

  // Two-tier popup state:
  //  - hoverPopup: shown while the cursor is over a marker (auto-clears on mouseleave)
  //  - pinnedPopup: set by clicking a marker; stays open until the user clicks outside it
  // pinnedPopup always wins so a click "locks" the card open for interaction (e.g. the
  // "View Study Details" link), while plain hovering still gives the lightweight preview.
  const [hoverPopup, setHoverPopup] = useState(null);
  const [pinnedPopup, setPinnedPopup] = useState(null);
  const activePopup = pinnedPopup || hoverPopup;
  const popupContentRef = useRef(null);

  // Click-outside-to-close for the pinned popup
  useEffect(() => {
    if (!pinnedPopup) return;
    function handleDocPointerDown(e) {
      if (popupContentRef.current && !popupContentRef.current.contains(e.target)) {
        setPinnedPopup(null);
      }
    }
    document.addEventListener("mousedown", handleDocPointerDown);
    return () => document.removeEventListener("mousedown", handleDocPointerDown);
  }, [pinnedPopup]);

  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [baseMap] = useState("basic");
  const [worldGeojson, setWorldGeojson] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  const resolvedMapStyle = mapStyle || MAPTILER_STYLES[baseMap] || MAPTILER_STYLES.dataviz;
  useEffect(() => { setIsMapReady(false); }, [resolvedMapStyle]);

  useEffect(() => {
    if (worldGeojson) return;
    // Use module-level cache to avoid re-fetching on every mount
    if (_worldGeojsonCache) { setWorldGeojson(_worldGeojsonCache); return; }
    if (_worldGeojsonPromise) { _worldGeojsonPromise.then(setWorldGeojson); return; }

    _worldGeojsonPromise = fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
      .then((r) => r.json())
      .then((topo) => import("topojson-client").then(({ feature }) => {
        const fc = feature(topo, topo.objects.countries);
        const clampLat = (lat) => Math.max(-85.051129, Math.min(85.051129, lat));

        // Fix antimeridian-crossing rings: unwrap longitude jumps > 180° so
        // MapLibre doesn't draw a line across the Atlantic for Russia/Alaska etc.
        const fixAntimeridianRing = (ring) => {
          const out = [];
          for (let i = 0; i < ring.length; i++) {
            let [x, y] = ring[i];
            y = clampLat(y);
            if (i > 0) {
              const prev = out[i - 1][0];
              const diff = x - prev;
              if (diff > 180) x -= 360;
              else if (diff < -180) x += 360;
            }
            out.push([x, y]);
          }
          return out;
        };

        const clampGeom = (geom) => {
          if (!geom) return geom;
          if (geom.type === "Polygon")
            return { ...geom, coordinates: geom.coordinates.map(fixAntimeridianRing) };
          if (geom.type === "MultiPolygon")
            return { ...geom, coordinates: geom.coordinates.map((poly) => poly.map(fixAntimeridianRing)) };
          return geom;
        };
        const result = {
          ...fc,
          features: fc.features.map((f) => ({ ...f, geometry: clampGeom(f.geometry) })),
        };
        _worldGeojsonCache = result;
        return result;
      }))
      .catch(() =>
        fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
          .then((r) => r.json())
          .then((result) => { _worldGeojsonCache = result; return result; })
      );
    _worldGeojsonPromise.then(setWorldGeojson).catch(console.error);
  }, []);

  const points = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map(normalizePoint).filter(Boolean);
  }, [data]);

  // ── Detect mode: global (each point = one country) vs country (each point = one city)
  const isGlobalMode = useMemo(() => {
    if (!points.length) return false;
    const hasCountryMode = points.some((p) => p.countryName &&
      p.name?.trim().toLowerCase() === p.countryName?.trim().toLowerCase());
    if (hasCountryMode) return true;
    const iso3s = points.map((p) => p.iso3).filter(Boolean);
    const uniqueIso3s = new Set(iso3s);
    return iso3s.length > 0 && uniqueIso3s.size >= Math.min(iso3s.length, points.length * 0.7) && uniqueIso3s.size > 1;
  }, [points]);

  // ── GLOBAL MODE: country choropleth — one filled polygon per country ──
  const globalChoroplethGeojson = useMemo(() => {
    if (!isGlobalMode || !worldGeojson) return null;

    const iso3ToPoint = {};
    for (const p of points) {
      if (p.iso3) iso3ToPoint[p.iso3] = p;
    }

    const features = worldGeojson.features.map((feat) => {
      const iso3 =
        feat.properties?.ISO_A3 ?? feat.properties?.iso_a3 ?? feat.properties?.ADM0_A3 ??
        (feat.id != null ? NUMERIC_TO_ISO3[String(feat.id).padStart(3, "0")] : null) ?? null;

      const pt = iso3 ? iso3ToPoint[iso3] : null;
      return {
        ...feat,
        properties: {
          iso3: iso3 ?? "",
          name: pt?.name ?? feat.properties?.ADMIN ?? feat.properties?.name ?? feat.properties?.NAME ?? iso3 ?? "",
          fillColor: pt ? intensityToBlue(pt.intensity) : NO_DATA_COLOR,
          hasData: !!pt,
          intensity: pt?.intensity ?? 0,
          caseCount: pt?.caseCount ?? 0,
          caseRatio: pt?.caseRatio ?? 0,
          population: pt?.population ?? 0,
          area: pt?.area ?? 0,
          density: pt?.density ?? 0,
        },
      };
    });
    return { type: "FeatureCollection", features };
  }, [isGlobalMode, worldGeojson, points]);

  // ── COUNTRY MODE: Voronoi choropleth — one filled region per city ──
  const activeIso3 = useMemo(() => {
    if (isGlobalMode) return null;
    const iso3s = [...new Set(points.map((p) => p.iso3).filter(Boolean))];
    return iso3s[0] ?? null;
  }, [isGlobalMode, points]);

  const activeCountryName = useMemo(() => {
    if (isGlobalMode) return null;
    const names = [...new Set(points.map((p) => p.countryName).filter(Boolean))];
    return names[0] ?? null;
  }, [isGlobalMode, points]);

  const countryFeature = useMemo(() => {
    if (!worldGeojson || (!activeIso3 && !activeCountryName)) return null;
    const numericId = activeIso3 ? ISO3_TO_NUMERIC[activeIso3] : null;
    const iso3ToName = {
      "JPN":"japan","IND":"india","CHN":"china","USA":"unitedstatesofamerica",
      "GBR":"unitedkingdom","DEU":"germany","FRA":"france","ITA":"italy",
      "RUS":"russia","ESP":"spain","CAN":"canada","AUS":"australia",
      "BRA":"brazil","KOR":"southkorea","NLD":"netherlands","POL":"poland",
      "CHE":"switzerland","TUR":"turkey","BEL":"belgium","SWE":"sweden",
      "NOR":"norway","DNK":"denmark","FIN":"finland","AUT":"austria",
      "PRT":"portugal","GRC":"greece","ROU":"romania","UKR":"ukraine",
      "HUN":"hungary","CZE":"czechia","SVK":"slovakia","HRV":"croatia",
      "BGR":"bulgaria","ARG":"argentina","MEX":"mexico","ZAF":"southafrica",
      "EGY":"egypt","NGA":"nigeria","KEN":"kenya","ETH":"ethiopia",
      "COL":"colombia","CHL":"chile","PER":"peru","VEN":"venezuela",
      "IDN":"indonesia","PAK":"pakistan","BGD":"bangladesh","THA":"thailand",
      "VNM":"vietnam","MYS":"malaysia","PHL":"philippines","IRN":"iran",
      "IRQ":"iraq","SAU":"saudiarabia","ARE":"unitedarabemirates","ISR":"israel",
    };
    const iso3NormalizedName = activeIso3 ? (iso3ToName[activeIso3] ?? null) : null;

    const found = worldGeojson.features.find((f) => {
      const fIso3 = f.properties?.ISO_A3 ?? f.properties?.iso_a3 ?? f.properties?.ADM0_A3 ?? null;
      if (fIso3 && activeIso3 && fIso3 === activeIso3) return true;
      if (numericId && f.id != null && String(f.id).padStart(3, "0") === numericId) return true;
      if (f.properties?.name) {
        const fn = f.properties.name.toLowerCase().replace(/[^a-z]/g, "");
        if (activeCountryName) {
          const an = activeCountryName.toLowerCase().replace(/[^a-z]/g, "");
          if (fn === an) return true;
        }
        if (iso3NormalizedName && fn === iso3NormalizedName) return true;
        if (iso3NormalizedName === "unitedstatesofamerica" && fn.includes("unitedstates")) return true;
        if (iso3NormalizedName === "unitedkingdom" && fn.includes("unitedkingdom")) return true;
        if (iso3NormalizedName === "southkorea" && (fn.includes("korea") && fn.includes("south"))) return true;
        if (iso3NormalizedName === "southafrica" && fn.includes("southafrica")) return true;
      }
      return false;
    }) ?? null;
    return found;
  }, [worldGeojson, activeIso3, activeCountryName]);

  const isUSMode = !isGlobalMode && activeIso3 === "USA";

  const [voronoiGeojson, setVoronoiGeojson] = useState(null);
  const voronoiKeyRef = useRef(null);
  useEffect(() => {
    if (isGlobalMode || !points.length || !worldGeojson) { setVoronoiGeojson(null); return; }

    // Include the value fields (caseCount/population/density) — not just
    // id/lat/lng/intensity — so applying a filter that changes a city's cases
    // but not its intensity bucket still rebuilds the geojson (and the hover
    // tooltip values). Otherwise filtered data comes back but the map/tooltip
    // keep showing the stale pre-filter numbers.
    const key = JSON.stringify(points.map(p => [p.id, p.lat, p.lng, p.intensity, p.caseCount, p.population, p.density])) + (countryFeature?.id ?? "") + (isUSMode ? "us" : "");
    if (voronoiKeyRef.current === key) return;
    voronoiKeyRef.current = key;

    if (isUSMode) {
      let cancelled = false;
      fetchUSCountyFeatures().then((countyFeatures) => {
        if (cancelled || !countyFeatures) return;
        const countyMap = {};
        for (const p of points) {
          for (const cf of countyFeatures) {
            const [bx0, by0, bx1, by1] = cf._bbox;
            if (p.lng < bx0 || p.lng > bx1 || p.lat < by0 || p.lat > by1) continue;
            if (pointInFeature(cf, p.lng, p.lat)) {
              const fips = cf.id;
              const existing = countyMap[fips];
              if (!existing || p.intensity > existing.point.intensity) {
                countyMap[fips] = { feature: cf, point: p };
              }
              break;
            }
          }
        }
        const features = Object.values(countyMap).map(({ feature: cf, point: p }) => ({
          type: "Feature",
          properties: {
            cityId: p.id, name: p.name, intensity: p.intensity,
            caseCount: p.caseCount, caseRatio: p.caseRatio ?? 0, population: p.population,
            area: p.area ?? 0, density: p.density ?? 0,
            zipcode: p.zipcode ?? "", fillColor: intensityToBlue(p.intensity),
          },
          geometry: cf.geometry,
        }));
        if (!cancelled) {
          if (features.length) {
            setVoronoiGeojson({ type: "FeatureCollection", features });
          } else if (countryFeature) {
            const vFeatures = buildVoronoiFeatures(points, countryFeature);
            setVoronoiGeojson(vFeatures.length ? { type: "FeatureCollection", features: vFeatures } : null);
          }
        }
      });
      return () => { cancelled = true; };
    }

    if (points.length === 1 && countryFeature) {
      const p = points[0];
      setVoronoiGeojson({
        type: "FeatureCollection",
        features: [{ ...countryFeature, properties: {
          cityId: p.id, name: p.name, intensity: p.intensity,
          caseCount: p.caseCount, caseRatio: p.caseRatio ?? 0, population: p.population,
          area: p.area ?? 0, density: p.density ?? 0,
          zipcode: p.zipcode ?? "", fillColor: intensityToBlue(p.intensity),
        }}],
      });
      return;
    }
    if (!countryFeature) { setVoronoiGeojson(null); return; }

    const id = setTimeout(() => {
      const features = buildVoronoiFeatures(points, countryFeature);
      setVoronoiGeojson(features.length ? { type: "FeatureCollection", features } : null);
    }, 0);
    return () => clearTimeout(id);
  }, [isGlobalMode, isUSMode, points, countryFeature, worldGeojson]);

  const [firstSymbolLayerId, setFirstSymbolLayerId] = useState(null);

  const handleMapLoad = useCallback((e) => {
    setIsMapReady(true);
    const map = e.target;

    const layers = map.getStyle().layers;
    const firstSymbol = layers.find((l) => l.type === "symbol");
    if (firstSymbol) setFirstSymbolLayerId(firstSymbol.id);

    layers.forEach((layer) => {
      if (layer.type === "line") {
        try {
          if (map.getPaintProperty(layer.id, "line-dasharray") != null) {
            map.setPaintProperty(layer.id, "line-dasharray", [1, 0]);
            map.setPaintProperty(layer.id, "line-color", "rgba(60,60,60,0.85)");
          }
        } catch (_) {}
      }
      if (layer.type === "symbol") {
        try {
          map.setPaintProperty(layer.id, "text-halo-width", 2);
          map.setPaintProperty(layer.id, "text-halo-color", "rgba(255,255,255,0.95)");
          map.setPaintProperty(layer.id, "text-halo-blur", 0);
        } catch (_) {}
      }
    });

    map.on("mousemove", "global-fill", (ev) => {
      map.getCanvas().style.cursor = "pointer";
      const feat = ev.features?.[0];
      if (!feat?.properties?.hasData) { setHoverInfo(null); return; }
      const p = feat.properties;
      setHoverInfo({
        x: ev.point.x, y: ev.point.y,
        name: p.name,
        caseCount: Number(p.caseCount),
        caseRatio: Number(p.caseRatio ?? 0),
        population: Number(p.population),
        area: Number(p.area ?? 0),
        density: Number(p.density ?? 0),
        intensity: Number(p.intensity),
        isCountry: true,
      });
    });
    map.on("mouseleave", "global-fill", () => {
      map.getCanvas().style.cursor = "";
      setHoverInfo(null);
    });

    map.on("mousemove", "voronoi-fill", (ev) => {
      map.getCanvas().style.cursor = "pointer";
      const feat = ev.features?.[0];
      if (!feat) { setHoverInfo(null); return; }
      const p = feat.properties;
      setHoverInfo({
        x: ev.point.x, y: ev.point.y,
        name: p.name,
        caseCount: Number(p.caseCount),
        caseRatio: Number(p.caseRatio ?? 0),
        population: Number(p.population),
        area: Number(p.area ?? 0),
        density: Number(p.density ?? 0),
        intensity: Number(p.intensity),
        zipcode: p.zipcode,
      });
    });
    map.on("mouseleave", "voronoi-fill", () => {
      map.getCanvas().style.cursor = "";
      setHoverInfo(null);
    });
  }, []);

  // Fit bounds
  useEffect(() => {
    if (!isMapReady || points.length === 0 || !mapRef.current) return;
    const map = mapRef.current.getMap?.();
    if (!map) return;
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const p of points) {
      if (p.lng < minLng) minLng = p.lng; if (p.lng > maxLng) maxLng = p.lng;
      if (p.lat < minLat) minLat = p.lat; if (p.lat > maxLat) maxLat = p.lat;
    }
    if (![minLng, maxLng, minLat, maxLat].every(isFiniteNumber)) return;
    if (isGlobalMode) {
      map.easeTo({ center: [0, 20], zoom: 1.8, duration: 600 });
    } else if (minLng === maxLng && minLat === maxLat) {
      map.easeTo({ center: [minLng, minLat], zoom: 5, duration: 600 });
    } else {
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: { top: 80, right: 220, bottom: 80, left: 80 },
        maxZoom: 6, duration: 700,
      });
    }
  }, [isMapReady, points, isGlobalMode]);

  const interactiveIds = useMemo(() => {
    const ids = [];
    if (isGlobalMode) ids.push("global-fill");
    if (voronoiGeojson) ids.push("voronoi-fill");
    return ids;
  }, [isGlobalMode, voronoiGeojson]);

  const showOverlayLoading = loading || !isMapReady
    || (!isGlobalMode && points.length > 0 && (!worldGeojson || !voronoiGeojson));

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", borderRadius: 12, background: "#EEF4FA", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 4px 20px rgba(2,6,23,0.07)" }}>

      {/* Popup chrome overrides — remove maplibre's default padding/tip/max-width so our
          fixed 280px card layout renders exactly, with no double-padding or arrow */}
      <style>{`
        .maplibregl-popup { max-width: none !important; }
        .maplibregl-popup-content { padding: 0 !important; border-radius: 8px !important; box-shadow: 0 4px 20px rgba(132,151,177,0.21) !important; }
        .maplibregl-popup-tip { display: none !important; }
      `}</style>

      {/* Zoom controls */}
      <div style={{ position: "absolute", top: 56, left: 12, zIndex: 10, display: "flex", flexDirection: "column", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(15,23,42,0.12)", background: "#fff", boxShadow: "0 2px 8px rgba(2,6,23,0.08)" }}>
        {[{ label: "+", delta: 1 }, { label: "−", delta: -1 }].map(({ label, delta }, i) => (
          <button key={label} type="button"
            onClick={() => { const m = mapRef.current?.getMap?.(); if (m) m.easeTo({ zoom: m.getZoom() + delta, duration: 250 }); }}
            style={{ appearance: "none", border: "none", borderBottom: i === 0 ? "1px solid rgba(15,23,42,0.08)" : "none", width: 32, height: 32, fontSize: 18, fontWeight: 400, lineHeight: "32px", textAlign: "center", cursor: "pointer", background: "#fff", color: "#374151", padding: 0, transition: "background 120ms" }}
            onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >{label}</button>
        ))}
      </div>

      <Map
        ref={mapRef}
        key={resolvedMapStyle}
        initialViewState={initialViewState}
        mapStyle={resolvedMapStyle}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        reuseMaps={false}
        dragRotate={false}
        renderWorldCopies={false}
        interactiveLayerIds={interactiveIds}
        onLoad={handleMapLoad}
      >
        {/* ── GLOBAL MODE: country choropleth — inserted below basemap labels ── */}
        {isMapReady && (variant === "population" || layerVisibility.density) && globalChoroplethGeojson && (
          <Source id="global-choropleth" type="geojson" data={globalChoroplethGeojson}>
            <Layer id="global-fill" type="fill"
              beforeId={firstSymbolLayerId || undefined}
              paint={{ "fill-color": ["get", "fillColor"], "fill-opacity": 0.80 }} />
            <Layer id="global-border" type="line"
              beforeId={firstSymbolLayerId || undefined}
              paint={{ "line-color": "#ffffff", "line-width": 0.7, "line-opacity": 0.8 }} />
          </Source>
        )}

        {/* ── COUNTRY MODE: Voronoi choropleth ── */}
        {isMapReady && (variant === "population" || layerVisibility.density) && voronoiGeojson && (
          <Source id="voronoi" type="geojson" data={voronoiGeojson}>
            <Layer id="voronoi-fill" type="fill"
              beforeId={firstSymbolLayerId || undefined}
              paint={{ "fill-color": ["get", "fillColor"], "fill-opacity": 0.92 }} />
            <Layer id="voronoi-border" type="line"
              beforeId={firstSymbolLayerId || undefined}
              paint={{
                "line-color": "#ffffff",
                "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.15, 7, 0.6, 10, 1.2],
                "line-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.15, 7, 0.5, 10, 0.85],
              }} />
          </Source>
        )}

        {/* ── Site / trial markers — hover shows a preview, click pins it open ── */}
        {variant === "sites" && layerVisibility.sites && siteMarkers?.map((site) => (
          <Marker key={site.id} longitude={site.lng} latitude={site.lat}>
            <div
              style={{ cursor: "pointer" }}
              onMouseEnter={() => { if (!pinnedPopup) setHoverPopup({ kind: "site", data: site }); }}
              onMouseLeave={() => { if (!pinnedPopup) setHoverPopup((cur) => (cur?.data?.id === site.id ? null : cur)); }}
              onClick={(e) => {
                e.stopPropagation();
                setHoverPopup(null);
                setPinnedPopup((cur) => (cur?.data?.id === site.id ? null : { kind: "site", data: site }));
              }}
            >
              <SiteMarkerIcon />
            </div>
          </Marker>
        ))}

        {variant === "sites" && layerVisibility.trials && trialMarkers?.map((trial) => (
          <Marker key={trial.id} longitude={trial.lng} latitude={trial.lat}>
            <div
              style={{ cursor: "pointer" }}
              onMouseEnter={() => { if (!pinnedPopup) setHoverPopup({ kind: "trial", data: trial }); }}
              onMouseLeave={() => { if (!pinnedPopup) setHoverPopup((cur) => (cur?.data?.id === trial.id ? null : cur)); }}
              onClick={(e) => {
                e.stopPropagation();
                setHoverPopup(null);
                setPinnedPopup((cur) => (cur?.data?.id === trial.id ? null : { kind: "trial", data: trial }));
              }}
            >
              <TrialMarkerIcon />
            </div>
          </Marker>
        ))}

        {variant === "sites" && activePopup && (
          <Popup
            longitude={activePopup.data.lng}
            latitude={activePopup.data.lat}
            closeButton={false}
            closeOnClick={false}
            closeOnMove={false}
            offset={16}
            anchor="bottom"
          >
            <div
              ref={popupContentRef}
              // Only auto-hide on mouse-leave for the lightweight hover preview;
              // a pinned (clicked) popup stays open until the outside-click handler closes it.
              onMouseEnter={() => { if (!pinnedPopup) setHoverPopup(activePopup); }}
              onMouseLeave={() => { if (!pinnedPopup) setHoverPopup(null); }}
            >
              {activePopup.kind === "site" ? (
                <SitePopupCard site={activePopup.data} />
              ) : (
                <TrialPopupCard trial={activePopup.data} />
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* ── Hover tooltip (population density) ── */}
      {hoverInfo && variant === "population" && (
        <div style={{
          position: "absolute",
          left: Math.min(hoverInfo.x + 14, window.innerWidth - 230),
          top: Math.max(hoverInfo.y - 10, 8),
          zIndex: 20, pointerEvents: "none",
          background: "rgba(255,255,255,0.97)",
          border: "1px solid #E2EAF4",
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.13)",
          padding: "10px 14px",
          minWidth: 185,
          fontFamily: "Rubik, sans-serif",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{hoverInfo.name}</div>
            <div style={{
              flexShrink: 0, padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700,
              background: intensityToColor(hoverInfo.intensity),
              // color: hoverInfo.intensity >= 5 ? "#fff" : "rgba(120,50,0,1)",  // old yellow→red scheme
              // color: hoverInfo.intensity >= 4 ? "#fff" : "rgba(30,70,32,1)",  // old green/orange/red scheme
              color: hoverInfo.intensity >= 6 ? "#fff" : "rgba(90,32,66,1)",
            }}>
              {/* thresholds track scaleIntensity's buckets: 1,2,4,6,8,10 */}
              {hoverInfo.intensity >= 10 ? "Very High"
                : hoverInfo.intensity >= 8 ? "High"
                : hoverInfo.intensity >= 6 ? "Medium"
                : hoverInfo.intensity >= 4 ? "Medium-Low"
                : hoverInfo.intensity >= 2 ? "Low"
                : "Minimal"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {hoverInfo.caseCount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontSize: 11, color: "#64748B" }}>New cases / yr</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(145,53,53,1)" }}>
                  {Number(hoverInfo.caseCount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
            {hoverInfo.population > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontSize: 11, color: "#64748B" }}>{hoverInfo.isCountry ? "Population" : "City population"}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#334155" }}>
                  {Number(hoverInfo.population).toLocaleString()}
                </span>
              </div>
            )}
            {hoverInfo.density > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontSize: 11, color: "#64748B" }}>Population density</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#334155" }}>
                  {Number(String(Number(hoverInfo.density).toExponential()).split("e")[0]).toFixed(5)}/km²
                </span>
              </div>
            )}
            {hoverInfo.area > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontSize: 11, color: "#64748B" }}>Land area</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#334155" }}>
                  {Number(hoverInfo.area).toLocaleString(undefined, { maximumFractionDigits: 2 })} km²
                </span>
              </div>
            )}
            {!hoverInfo.isCountry && hoverInfo.zipcode && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontSize: 11, color: "#64748B" }}>ZIP / Region</span>
                <span style={{ fontSize: 11, color: "#334155" }}>{hoverInfo.zipcode}</span>
              </div>
            )}
          </div>
          <div style={{ marginTop: 8, height: 5, borderRadius: 3, background: "rgba(235,225,225,0.6)", overflow: "hidden" }}>
            <div style={{ width: `${Math.round((hoverInfo.intensity / 10) * 100)}%`, height: "100%", background: `linear-gradient(90deg,rgba(230,190,190,1),${intensityToColor(hoverInfo.intensity)})`, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 3 }}>
            {hoverInfo.isCountry ? "relative to all countries" : "relative intensity within country"}
          </div>
        </div>
      )}

      {/* Loading */}
      {showOverlayLoading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(238,244,250,0.92)", zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: 999, border: "2px solid rgba(37,99,235,0.2)", borderTopColor: "#2563EB", animation: "ctsearch-spin 900ms linear infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Loading map…</span>
          </div>
          <style>{`@keyframes ctsearch-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* OLD legend — population density only, used by PopulationTab */}
      {variant === "population" && !showOverlayLoading && points.length > 0 && (
        <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 10, background: "rgba(255,255,255,0.97)", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.09)", padding: "12px 14px", minWidth: 165 }}>
          <div style={{ fontFamily: "Rubik, sans-serif" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{legendTitle}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Based on selected filters</div>
            {cohortTotal > 0 && (
              <>
                {/* old accents: rgba(145,53,53,1), rgba(145,52,52,1) */}
                <div style={{ fontSize: 20, fontWeight: 700, color: "rgba(166,58,121,1)", lineHeight: "24px", marginTop: 6 }}>
                  {cohortTotal.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{totalLabel}</div>
              </>
            )}
            <div style={{ borderTop: "1px solid #F1F5F9", marginTop: 8, paddingTop: 8 }} />
            <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 6 }}>By population density</div>
            {[
              // OLD yellow→red legend (kept for reference — do not delete)
              // { label: "Very High", color: "rgba(220,30,20,1)" },
              // { label: "High", color: "rgba(241,140,45,1)" },
              // { label: "Medium", color: "rgba(253,204,102,1)" },
              // { label: "Low", color: "rgba(255,235,178,1)", border: true },
              // { label: "Minimal", color: "rgba(255,247,214,1)", border: true },
              // OLD green/orange/red legend (kept for reference — do not delete)
              // { label: "Extreme", color: "rgba(145,52,52,1)" },
              // { label: "Very High", color: "rgba(193,70,70,1)" },
              // { label: "High", color: "rgba(241,87,87,1)" },
              // { label: "Medium-High", color: "rgba(145,77,10,1)" },
              // { label: "Medium", color: "rgba(193,102,13,1)" },
              // { label: "Low-Medium", color: "rgba(241,128,16,1)" },
              // { label: "Low", color: "rgba(75,145,78,1)" },
              // { label: "Very Low", color: "rgba(129,199,132,1)" },
              // { label: "Minimal", color: "rgba(166,228,169,1)" },
              // { label: "None", color: "rgba(255,255,255,1)", border: true },
              // Derived from the same DENSITY_BANDS the map colors by, so the
              // legend can never drift from what's actually painted. Darkest
              // band first; each swatch is intensityToColor of that band.
              ...[...DENSITY_BANDS].reverse().map((b) => ({
                label: b.label,
                color: intensityToColor(b.intensity),
                border: b.intensity <= 1,
              })),
              // Global mode paints unmatched countries NO_DATA_COLOR; country
              // mode leaves zero-density regions white.
              { label: "No data", color: isGlobalMode ? NO_DATA_COLOR : "rgba(255,255,255,1)", border: true },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: s.color, border: s.border ? "1px solid #BDD7EE" : "none", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#374151" }}>{s.label}</span>
              </div>
            ))}
            <div style={{ marginTop: 6, fontSize: 10, color: "#CBD5E1", borderTop: "1px solid #F1F5F9", paddingTop: 6 }}>
              {isGlobalMode ? "Hover country for details" : "Hover region for city details"}
            </div>
          </div>
        </div>
      )}

      {/* NEW legend — checkboxes matching Figma spec exactly:
          - Annual cancer cases: default checkbox + gradient swatch
          - Selected Sites: checkbox itself filled blue, no separate icon
          - Active competing trials: checkbox itself filled #C14646, no separate icon */}
      {variant === "sites" && !showOverlayLoading && (points.length > 0 || siteMarkers.length > 0 || trialMarkers.length > 0) && (
        <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 10, background: "rgba(255,255,255,0.97)", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.09)", padding: "12px 14px", minWidth: 190 }}>
          <div style={{ fontFamily: "Rubik, sans-serif" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Legend</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 39,
                  height: 13,
                  borderRadius: 2,
                  background: "linear-gradient(270deg, #F18010 0%, #914D0A 100%)",
                }}
              />
              <span style={{ fontSize: 13 }}>Annual cancer cases</span>
            </div>

            <LegendRow
              checked={layerVisibility.sites}
              onChange={() => toggleLayer("sites")}
              checkboxColor="#2563EB"
              label="Selected Sites"
            />
            <LegendRow
              checked={layerVisibility.trials}
              onChange={() => toggleLayer("trials")}
              checkboxColor="#C14646"
              label="Active competing trials"
            />
          </div>
        </div>
      )}

      {!loading && isMapReady && variant === "population" && points.length === 0 && (
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 10, padding: "12px 20px", borderRadius: 10, background: "rgba(255,255,255,0.95)", border: "1px solid rgba(15,23,42,0.08)", color: "#475569", fontSize: 13, fontWeight: 500 }}>
          No population data for the current filters.
        </div>
      )}
    </div>
  );
}
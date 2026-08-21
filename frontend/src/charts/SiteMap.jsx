import { useMemo, useState } from "react";
import Map, { Layer, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Minus, Plus } from "lucide-react";

/* Trial-site heat map.

   This is ctsearch's UsHeatMap with one substantive change: that component
   generated its points with Math.random() around a fixed centre (its own
   comment said "Replace this with your API coordinates later"). Here the
   features come from real oncosuite_gold facility_info rows -- 30,393 of
   31,222 facilities carry latitude/longitude -- passed in as `points`.

   The basemap, heatmap paint ramp, legend buckets and zoom controls are kept
   identical to the ctsearch version so the Figma styling is preserved. */

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const LEGEND = [
  { label: "0 to 2", color: "#8B2E2E" },
  { label: "2 to 6", color: "#A34545" },
  { label: "6 to 18", color: "#B87070" },
  { label: "18 to 45", color: "#CE9B9B" },
  
  { label: "45 to 90", color: "#E4C6C6" },
  { label: "90 and up", color: "#F0E0E0" },
];

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Mean of the supplied points, so the viewport frames whatever region the
// answer is about instead of a hardcoded US centre.
function centreOf(points) {
  if (!points.length) return { longitude: -95.3698, latitude: 37.0902, zoom: 3.2 };
  let lng = 0;
  let lat = 0;
  for (const p of points) {
    lng += p.longitude;
    lat += p.latitude;
  }
  return {
    longitude: lng / points.length,
    latitude: lat / points.length,
    zoom: points.length > 1 ? 3.4 : 8,
  };
}

export default function SiteMap({ points = [], title = "Site density", metric = "trial sites" }) {
  // Drop anything without usable coordinates rather than plotting (0, 0).
  const clean = useMemo(
    () =>
      (points || []).filter(
        (p) =>
          p &&
          Number.isFinite(Number(p.longitude)) &&
          Number.isFinite(Number(p.latitude)),
      ).map((p) => ({ ...p, longitude: Number(p.longitude), latitude: Number(p.latitude) })),
    [points],
  );

  const [viewState, setViewState] = useState(() => ({
    ...centreOf(clean),
    bearing: 0,
    pitch: 0,
  }));

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection",
      features: clean.map((p) => ({
        type: "Feature",
        properties: { value: Number(p.value) || 1, name: p.name || "" },
        geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
      })),
    }),
    [clean],
  );

  // Paint config copied from ctsearch's UsHeatMap so the visual match holds.
  const heatmapLayer = useMemo(
    () => ({
      id: "site-heat",
      type: "heatmap",
      source: "sites",
      maxzoom: 10,
      paint: {
        "heatmap-weight": ["interpolate", ["linear"], ["get", "value"], 0, 0, 100, 1],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 4, 0.8, 8, 2.2],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 4, 12, 8, 28],
        "heatmap-opacity": 0.78,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(255,255,255,0)",
          0.15, "rgba(252, 211, 77, 0.30)",
          0.35, "rgba(251, 191, 36, 0.45)",
          0.55, "rgba(249, 115, 22, 0.55)",
          0.75, "rgba(239, 68, 68, 0.65)",
          1, "rgba(220, 38, 38, 0.78)",
        ],
      },
    }),
    [],
  );

  if (!clean.length) {
    return (
      <div style={{ padding: 16, color: "rgba(0,0,0,0.45)", fontSize: 13 }}>
        No mapped sites for this query.
      </div>
    );
  }

  const zoomBy = (d) =>
    setViewState((s) => ({ ...s, zoom: clamp(s.zoom + d, 2, 12) }));

  return (
    <div style={{ position: "relative", height: 420, borderRadius: 10, overflow: "hidden" }}>
      <Map
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <Source id="sites" type="geojson" data={geojson}>
          <Layer {...heatmapLayer} />
        </Source>
      </Map>

      <div style={{ position: "absolute", top: 12, right: 12, display: "grid", gap: 4 }}>
        {[
          { icon: <Plus size={12} />, d: 0.35 },
          { icon: <Minus size={12} />, d: -0.35 },
        ].map((c, i) => (
          <button
            key={i}
            onClick={() => zoomBy(c.d)}
            style={{
              width: 26, height: 26, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6,
              background: "#fff", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            {c.icon}
          </button>
        ))}
      </div>

      <div
        style={{
          position: "absolute", right: 12, bottom: 12, background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: "10px 12px",
          fontSize: 12, boxShadow: "0 4px 14px rgba(16,24,40,.10)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>
        <div style={{ color: "rgba(0,0,0,0.5)", marginBottom: 8 }}>measured in: {metric}</div>
        {LEGEND.map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
            <span style={{ color: "rgba(0,0,0,0.65)" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

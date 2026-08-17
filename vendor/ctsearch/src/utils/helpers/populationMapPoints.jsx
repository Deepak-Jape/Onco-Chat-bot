// Shared transform: raw `new_cancer_cases_map` API node → MapView point shape.
// Used by both PopulationTab and ShortlistedSitesBlock so the two views never
// drift out of sync on how density/intensity/coordinates are derived.

const COUNTRY_CENTER_COORDS = {
  australia: { latitude: -25.2744, longitude: 133.7751 },
  belgium: { latitude: 50.5039, longitude: 4.4699 },
  brazil: { latitude: -14.235, longitude: -51.9253 },
  canada: { latitude: 56.1304, longitude: -106.3468 },
  china: { latitude: 35.8617, longitude: 104.1954 },
  france: { latitude: 46.2276, longitude: 2.2137 },
  germany: { latitude: 51.1657, longitude: 10.4515 },
  india: { latitude: 20.5937, longitude: 78.9629 },
  italy: { latitude: 41.8719, longitude: 12.5674 },
  japan: { latitude: 36.2048, longitude: 138.2529 },
  global: { latitude: 20, longitude: 0 },
  netherlands: { latitude: 52.1326, longitude: 5.2913 },
  poland: { latitude: 51.9194, longitude: 19.1451 },
  russia: { latitude: 61.524, longitude: 105.3188 },
  spain: { latitude: 40.4637, longitude: -3.7492 },
  switzerland: { latitude: 46.8182, longitude: 8.2275 },
  turkey: { latitude: 38.9637, longitude: 35.2433 },
  unitedstates: { latitude: 39.8283, longitude: -98.5795 },
  "united states": { latitude: 39.8283, longitude: -98.5795 },
  usa: { latitude: 39.8283, longitude: -98.5795 },
  unitedstatesofamerica: { latitude: 39.8283, longitude: -98.5795 },
  unitedkingdom: { latitude: 55.3781, longitude: -3.436 },
  "united kingdom": { latitude: 55.3781, longitude: -3.436 },
  uk: { latitude: 55.3781, longitude: -3.436 },
  "south korea": { latitude: 35.9078, longitude: 127.7669 },
  southkorea: { latitude: 35.9078, longitude: 127.7669 },
  korea: { latitude: 35.9078, longitude: 127.7669 },
  "new zealand": { latitude: -40.9006, longitude: 174.886 },
  newzealand: { latitude: -40.9006, longitude: 174.886 },
  argentina: { latitude: -38.4161, longitude: -63.6167 },
  mexico: { latitude: 23.6345, longitude: -102.5528 },
  "south africa": { latitude: -30.5595, longitude: 22.9375 },
  southafrica: { latitude: -30.5595, longitude: 22.9375 },
  egypt: { latitude: 26.8206, longitude: 30.8025 },
  nigeria: { latitude: 9.082, longitude: 8.6753 },
  indonesia: { latitude: -0.7893, longitude: 113.9213 },
  colombia: { latitude: 4.5709, longitude: -74.2973 },
  sweden: { latitude: 60.1282, longitude: 18.6435 },
  norway: { latitude: 60.472, longitude: 8.4689 },
  denmark: { latitude: 56.2639, longitude: 9.5018 },
  finland: { latitude: 61.9241, longitude: 25.7482 },
  austria: { latitude: 47.5162, longitude: 14.5501 },
  portugal: { latitude: 39.3999, longitude: -8.2245 },
  greece: { latitude: 39.0742, longitude: 21.8243 },
};

const CITY_COORDS = {
  beijing: { latitude: 39.9042, longitude: 116.4074 },
  shanghai: { latitude: 31.2304, longitude: 121.4737 },
  shenzhen: { latitude: 22.5431, longitude: 114.0579 },
  tianjin: { latitude: 39.3434, longitude: 117.3616 },
  guangzhou: { latitude: 23.1291, longitude: 113.2644 },
  chongqing: { latitude: 29.563, longitude: 106.5516 },
  chengdu: { latitude: 30.5728, longitude: 104.0668 },
};

const NAME_TO_ISO3 = {
  australia: "AUS", belgium: "BEL", brazil: "BRA", canada: "CAN", china: "CHN",
  france: "FRA", germany: "DEU", india: "IND", italy: "ITA", japan: "JPN",
  netherlands: "NLD", poland: "POL", russia: "RUS", spain: "ESP",
  switzerland: "CHE", turkey: "TUR", "united states": "USA", usa: "USA",
  "united kingdom": "GBR", uk: "GBR", "south korea": "KOR", korea: "KOR",
  argentina: "ARG", mexico: "MEX", "south africa": "ZAF", egypt: "EGY",
  nigeria: "NGA", kenya: "KEN", ethiopia: "ETH", ghana: "GHA",
  colombia: "COL", chile: "CHL", peru: "PER", venezuela: "VEN",
  indonesia: "IDN", pakistan: "PAK", bangladesh: "BGD", thailand: "THA",
  vietnam: "VNM", malaysia: "MYS", philippines: "PHL", iran: "IRN",
  iraq: "IRQ", "saudi arabia": "SAU", "united arab emirates": "ARE",
  israel: "ISR", sweden: "SWE", norway: "NOR", denmark: "DNK",
  finland: "FIN", austria: "AUT", portugal: "PRT", greece: "GRC",
  romania: "ROU", ukraine: "UKR", hungary: "HUN", czechia: "CZE",
  "czech republic": "CZE", slovakia: "SVK", croatia: "HRV",
  bulgaria: "BGR", serbia: "SRB", "new zealand": "NZL",
};

export function normalizeLocationKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function resolveCoordinates(locationName, countryName) {
  const locationKey = normalizeLocationKey(locationName);
  if (!locationKey) return null;

  if (CITY_COORDS[locationKey]) return CITY_COORDS[locationKey];
  if (COUNTRY_CENTER_COORDS[locationKey]) return COUNTRY_CENTER_COORDS[locationKey];

  const countryKey = normalizeLocationKey(countryName);
  if (countryKey && COUNTRY_CENTER_COORDS[countryKey]) {
    return COUNTRY_CENTER_COORDS[countryKey];
  }

  return null;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Population-density bands, keyed off the API's `density` field.
 *
 * The API returns `density` as a normalized 0–1 score, NOT persons/km²
 * (e.g. Waibstadt: population 5708, area 25.57 km², density 0.156 — while
 * 5708/25.57 = 223 persons/km²). Being pre-scaled, it buckets against fixed
 * thresholds, so a region's shade depends only on its own density and stays
 * stable no matter which filters are applied.
 *
 * `intensity` values MUST match the t-positions of COLOR_STOPS in MapView.jsx
 * (t = intensity / 10), or regions render as interpolated shades that never
 * appear in the legend. MapView imports this list to build the legend, so the
 * map and the legend cannot drift apart.
 */
export const DENSITY_BANDS = [
  { max: 0.1,      intensity: 1,  label: "Minimal" },
  { max: 0.25,     intensity: 2,  label: "Low" },
  { max: 0.45,     intensity: 4,  label: "Medium-Low" },
  { max: 0.65,     intensity: 6,  label: "Medium" },
  { max: 0.85,     intensity: 8,  label: "High" },
  { max: Infinity, intensity: 10, label: "Very High" },
];

/** Map an API density value (0–1) to its band intensity. 0 = no data → white. */
export function densityToIntensity(density) {
  if (!Number.isFinite(density) || density <= 0) return 0;
  return (DENSITY_BANDS.find((b) => density <= b.max) ?? DENSITY_BANDS[DENSITY_BANDS.length - 1]).intensity;
}

/**
 * Transform a raw `new_cancer_cases_map` API payload into the point shape
 * MapView expects ({ id, lat, lng, name, intensity, ... }).
 *
 * @param {object} mapRoot   The `new_cancer_cases_map` node from the API response
 *                           (has `.name` and `.children`).
 * @param {string} selectedCountry  Fallback country label if mapRoot has no name
 *                                  (e.g. "global").
 * @returns {Array} array of MapView-ready point objects
 */
export function buildPopulationMapPoints(mapRoot, selectedCountry) {
  const cityNodes = Array.isArray(mapRoot?.children) ? mapRoot.children : [];
  if (!mapRoot && !cityNodes.length) return [];

  const countryName = mapRoot?.name ?? selectedCountry ?? "global";

  // OLD: percentile bucketing — colored by a region's RANK within the current
  // result set rather than by its density value, so the same city changed
  // shade when the filters changed. Kept for reference — do not delete.
  // const nonZeroDensities = cityNodes
  //   .map((node) => Number(node?.density ?? 0))
  //   .filter((v) => Number.isFinite(v) && v > 0)
  //   .sort((a, b) => a - b);
  //
  // const pctValue = (q) => {
  //   if (!nonZeroDensities.length) return Infinity;
  //   const idx = Math.min(
  //     nonZeroDensities.length - 1,
  //     Math.max(0, Math.floor(q * (nonZeroDensities.length - 1))),
  //   );
  //   return nonZeroDensities[idx];
  // };
  //
  // const b1 = pctValue(0.4);
  // const b2 = pctValue(0.65);
  // const b3 = pctValue(0.8);
  // const b4 = pctValue(0.9);
  // const b5 = pctValue(0.97);

  // ACTIVE: absolute density coloring — see DENSITY_BANDS above.
  const scaleIntensity = densityToIntensity;

  const points = cityNodes.flatMap((node) => {
    const apiLat = toNumber(node?.latitude);
    const apiLng = toNumber(node?.longitude);
    const coordinates =
      apiLat !== null && apiLng !== null
        ? { latitude: apiLat, longitude: apiLng }
        : resolveCoordinates(node?.name, countryName);
    if (!coordinates) return [];

    const annualNewCases = Number(node?.annual_new_cases ?? 0);
    const population = Number(node?.population ?? 0);
    const area = Number(node?.area ?? 0);
    const density = Number(node?.density ?? 0);
    const displayName = node?.name ?? "Unknown";

    // Derive iso3 — for global view use node.name (the country), otherwise use countryName
    const isGlobal = countryName.trim().toLowerCase() === "global";
    const lookupName = isGlobal
      ? displayName.trim().toLowerCase()
      : countryName.trim().toLowerCase();
    const iso3 = NAME_TO_ISO3[lookupName] ?? null;

    return [
      {
        id: `${countryName}-${displayName}`,
        lat: coordinates.latitude,
        lng: coordinates.longitude,
        name: displayName,
        intensity: scaleIntensity(density),
        heatOnly: false,
        caseCount: annualNewCases,
        caseRatio: annualNewCases,
        population,
        area,
        density,
        zipcode: node?.zipcode ?? null,
        iso3,
        countryName: isGlobal ? displayName : countryName,
      },
    ];
  });

  const rootCoordinates = resolveCoordinates(countryName, countryName);
  if (rootCoordinates && points.length === 0) {
    points.push({
      id: `${countryName}-root`,
      lat: rootCoordinates.latitude,
      lng: rootCoordinates.longitude,
      name: countryName,
      intensity: 10,
    });
  }

  return points;
}
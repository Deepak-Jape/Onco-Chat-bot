import React, { useMemo, useRef, useState } from "react";
import Map, { Layer, Source } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Minus, Plus } from "lucide-react";

// CARTO "Voyager" basemap (more detailed, closer to the screenshot styling)
// If you want a lighter look, switch back to Positron:
// https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const legendItems = [
  { label: "0 to 2", color: "#8B2E2E", min: 0, max: 2 },
  { label: "2 to 6", color: "#A34545", min: 2, max: 6 },
  { label: "6 to 18", color: "#B87070", min: 6, max: 18 },
  { label: "18 to 45", color: "#CE9B9B", min: 18, max: 45 },
  { label: "45 to 90", color: "#E4C6C6", min: 45, max: 90 },
  { label: "90 and up", color: "#F0E0E0", min: 90, max: 500 },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomAround({ lng, lat }, spreadDeg, n) {
  // Generates points roughly around a center, used as placeholder.
  // Replace this with your API coordinates later.
  const points = [];
  for (let i = 0; i < n; i += 1) {
    const u = Math.random();
    const v = Math.random();
    const r = Math.sqrt(-2.0 * Math.log(u));
    const theta = 2.0 * Math.PI * v;
    const dx = r * Math.cos(theta) * spreadDeg;
    const dy = r * Math.sin(theta) * spreadDeg;

    const value = Math.floor(Math.random() * 110);
    points.push({
      type: "Feature",
      properties: { value },
      geometry: { type: "Point", coordinates: [lng + dx, lat + dy] },
    });
  }
  return points;
}

export default function UsHeatMap() {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: -95.3698, // Houston-ish to match screenshot focus
    latitude: 29.7604,
    zoom: 6,
    bearing: 0,
    pitch: 0,
  });

  const geojson = useMemo(() => {
    const center = { lng: -95.3698, lat: 29.7604 };
    return {
      type: "FeatureCollection",
      features: randomAround(center, 0.65, 650),
    };
  }, []);

  const heatmapLayer = useMemo(
    () => ({
      id: "population-heat",
      type: "heatmap",
      source: "population",
      maxzoom: 10,
      paint: {
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "value"],
          0,
          0,
          100,
          1,
        ],
        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          4,
          0.8,
          8,
          2.2,
        ],
        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          4,
          12,
          8,
          28,
        ],
        "heatmap-opacity": 0.78,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(255,255,255,0)",
          0.15,
          "rgba(252, 211, 77, 0.30)",
          0.35,
          "rgba(251, 191, 36, 0.45)",
          0.55,
          "rgba(249, 115, 22, 0.55)",
          0.75,
          "rgba(239, 68, 68, 0.65)",
          1,
          "rgba(220, 38, 38, 0.78)",
        ],
      },
    }),
    [],
  );

  const controls = [
    {
      icon: <Plus size={12} />,
      action: () =>
        setViewState((s) => ({
          ...s,
          zoom: clamp(s.zoom + 0.35, 2, 12),
        })),
    },
    {
      icon: <Minus size={12} />,
      action: () =>
        setViewState((s) => ({
          ...s,
          zoom: clamp(s.zoom - 0.35, 2, 12),
        })),
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "420px",
        background: "#fff",
        position: "relative",
        overflow: "hidden",
        borderRadius: "8px",
        border: "1px solid rgba(0,0,0,0.1)",
        fontFamily: "'Rubik', sans-serif",
      }}
    >
      {/* Zoom controls (Top Left) */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          zIndex: 10,
        }}
      >
        {controls.map((btn, i) => (
          <button
            key={i}
            type="button"
            onClick={btn.action}
            style={{
              width: "24px",
              height: "24px",
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        mapLib={maplibregl}
        attributionControl={false}
        dragRotate={false}
        touchZoomRotate={{ rotate: false }}
      >
        <Source id="population" type="geojson" data={geojson}>
          <Layer {...heatmapLayer} />
        </Source>
      </Map>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          background: "#FFFFFF",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.08)",
          border: "1px solid #F1F5F9",
          width: "190px",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "600",
            marginBottom: "4px",
            color: "#111827",
          }}
        >
          Population Density
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#6B7280",
            marginBottom: "16px",
          }}
        >
          measured in: population per square mile
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {legendItems.map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: item.color,
                }}
              />
              <span style={{ fontSize: "13px", color: "#374151" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

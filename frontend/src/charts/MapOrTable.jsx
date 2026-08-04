import { useMemo, useState } from "react";
import ChartBlock from "./ChartBlock";
import PanelTable from "./PanelTable.jsx";
import { C, FONT } from "./tokens";

/* Table View / Map View toggle for the geography charts (CaseBurdenMap,
   PopulationMap, SiteMap) -- same idea as ctsearch's List View / Map View
   segmented control (ShortlistedSitesBlock.jsx), rebuilt with this app's own
   PanelTable/tokens instead of pulling in MUI, since nothing else in the
   Analyst UI depends on it.

   The map component (MapView) already receives `props.data`, an array of
   plottable points -- Table View renders that SAME array through PanelTable
   instead of issuing a second query, so the two views can never disagree. */

const POINT_COLUMNS = [
  { key: "name", label: "Location" },
  { key: "countryName", label: "Country" },
  { key: "population", label: "Population" },
  { key: "caseCount", label: "Annual cases" },
  { key: "density", label: "Density (cases/km²)" },
];

function segmentButtonStyle(active) {
  return {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: FONT,
    border: `1px solid ${active ? "transparent" : C.border}`,
    borderRadius: 6,
    background: active ? "#111827" : "#fff",
    color: active ? "#fff" : C.headText,
    cursor: "pointer",
  };
}

export default function MapOrTable({ chart, props, onOpenSummary }) {
  const [view, setView] = useState("map");

  // Only the columns that actually have a value on at least one point --
  // e.g. `zipcode`/city-level fields don't exist on the country-level
  // choropleth points, and an all-empty column would just read as noise.
  const columns = useMemo(() => {
    const points = props?.data || [];
    return POINT_COLUMNS.filter((col) =>
      points.some((p) => p[col.key] !== null && p[col.key] !== undefined && p[col.key] !== ""));
  }, [props?.data]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 10 }}>
        <button type="button" style={segmentButtonStyle(view === "table")} onClick={() => setView("table")}>
          Table View
        </button>
        <button type="button" style={segmentButtonStyle(view === "map")} onClick={() => setView("map")}>
          Map View
        </button>
      </div>

      {view === "map" ? (
        <div style={{ height: 480 }}>
          <ChartBlock chart={chart} props={props} onOpenSummary={onOpenSummary} />
        </div>
      ) : (
        <PanelTable
          title={props?.legendTitle}
          columns={columns}
          data={props?.data || []}
          preview={10}
        />
      )}
    </div>
  );
}

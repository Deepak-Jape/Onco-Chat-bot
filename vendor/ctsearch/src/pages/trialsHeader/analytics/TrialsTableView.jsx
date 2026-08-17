import React from "react";
import { ArrowLeft, Download } from "lucide-react";

const FONT = "Rubik, sans-serif";

/* Build a CSS grid-template-columns string from the column defs.
   The "trial" (ID + name) column is wider; others share the rest. */
function gridTemplate(columns) {
  return columns
    .map((c) => (c.type === "trial" ? "minmax(220px, 2fr)" : "minmax(130px, 1fr)"))
    .join(" ");
}

/* Build a CSV string from columns + rows and trigger a browser download. */
export function downloadTrialsCsv({ title, columns, rows }) {
  const header = columns.map((c) => c.label);
  const cell = (row, col) =>
    col.type === "trial"
      ? `${row.oncoSuiteId} - ${row.trialName}`
      : row[col.key];
  const lines = rows.map((r) =>
    columns
      .map((c) => `"${String(cell(r, c) ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${String(title).replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* Reusable Download CSV button (used inline and in the drawer's right header). */
export function DownloadCsvButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid rgba(38,102,190,0.4)",
        background: "#ffffff",
        color: "#2666be",
        borderRadius: 6,
        padding: "8px 14px",
        fontSize: 14,
        fontWeight: 500,
        fontFamily: FONT,
        cursor: "pointer",
      }}
    >
      <Download style={{ height: 16, width: 16 }} />
      Download CSV
    </button>
  );
}

/**
 * Column-driven drill-down trial table.
 *
 * Props:
 *   title    – heading next to the back arrow (e.g. "Top Backbones")
 *   columns  – [{ key, label, type? }]; a column with type:"trial" renders the
 *              OncoSuite ID + blue trial name. Other columns render row[key].
 *   rows     – trial rows
 *   onBack / onDownloadCsv – callbacks
 *   hideHeader – when true, the surrounding drawer supplies the header
 */
export default function TrialsTableView({
  title = "",
  columns = [],
  rows = [],
  onBack,
  onDownloadCsv,
  hideHeader = false,
}) {
  const template = gridTemplate(columns);

  const handleDownload = () => {
    if (onDownloadCsv) return onDownloadCsv();
    downloadTrialsCsv({ title, columns, rows });
  };

  const renderCell = (row, col) => {
    if (col.type === "trial") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{row.oncoSuiteId}</span>
          <span style={{ color: "#2666be", fontWeight: 500 }}>{row.trialName}</span>
        </div>
      );
    }
    return <span style={{ color: "rgba(0,0,0,0.7)" }}>{row[col.key] ?? "—"}</span>;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: FONT,
      }}
    >
      {/* Header: back + title (left), Download CSV (right). Hidden when the
          drawer already renders its own header + download slot. */}
      {!hideHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={onBack}
              aria-label="Back"
              style={{
                display: "flex",
                alignItems: "center",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <ArrowLeft style={{ height: 20, width: 20, color: "rgba(0,0,0,0.7)" }} />
            </button>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "rgba(0,0,0,0.85)", margin: 0 }}>
              {title}
            </h3>
          </div>
          <DownloadCsvButton onClick={handleDownload} />
        </div>
      )}

      {/* Table — no overflow wrapper here: an overflow:auto ancestor would
          trap position:sticky and stop the header from pinning to the drawer's
          scroll area. */}
      <div style={{ width: "100%" }}>
        {/* Header row — sticks to the top of the drawer scroll area on scroll.
            The 16px white top padding restores the gap from the drawer header;
            it's part of the sticky block, so rows still can't peek above it. */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            background: "#ffffff",
            paddingTop: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: template,
              gap: 16,
              padding: "12px 20px",
              background: "#eef4fb",
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(0,0,0,0.55)",
            }}
          >
            {columns.map((c) => (
              <span key={c.key}>{c.label}</span>
            ))}
          </div>
        </div>

        {/* Data rows */}
        {rows.map((row, i) => (
          <div
            key={`${row.oncoSuiteId}-${i}`}
            style={{
              display: "grid",
              gridTemplateColumns: template,
              gap: 16,
              padding: "14px 20px",
              borderBottom: "1px solid #f1f5f9",
              fontSize: 14,
              alignItems: "start",
            }}
          >
            {columns.map((c) => (
              <React.Fragment key={c.key}>{renderCell(row, c)}</React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

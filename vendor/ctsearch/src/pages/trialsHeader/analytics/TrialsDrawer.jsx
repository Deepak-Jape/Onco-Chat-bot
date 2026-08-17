import { Drawer } from "@mui/material";
import { useState } from "react";
import Back from "../../../assets/icons/arrow_back.svg";
import download from "../../../assets/icons/download_4.svg";

export default function TrialsDrawer({
  open,
  onClose,
  title,
  data = [],
  columns = [],
}) {
  const [mode, setMode] = useState("study");
  const AgeSparkline = ({ values = [] }) => {
    if (!values.length) return <span>-</span>;

    return (
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
        {values.map((v, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: Math.max(4, v),
              background: "#2666BE",
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    );
  };
  const isAgeDrawer = title?.includes("Age");
  const showAgeDistribution = isAgeDrawer && mode === "results";

  const finalColumns = [
    ...columns.slice(0, 3),

    ...(showAgeDistribution
      ? [{ key: "ageDistribution", label: "Age Distribution" }]
      : []),

    columns.find((c) => c.key === "action"),
  ].filter(Boolean);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: "50vw",
          maxWidth: "80vw",
          background: "#fff",
        },
      }}
    >
      {/* HEADER */}
      <div style={{ padding: 15, borderBottom: "1px solid #E5E7EB" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Back / Close */}
          <div
            onClick={onClose}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img src={Back}></img>
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 500,
                fontFamily: "Rubik",
                color: "rgba(0, 0, 0, 0.8)",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(0,0,0,0.6)",
                fontFamily: "Rubik",
              }}
            >
              {/* {data?.length || 0} trials */}
            </div>
          </div>

          {/* Study / Results Toggle */}
          <div
            style={{
              display: "inline-flex",
              height: 36,
              border: "1px solid #B8D4F9",
              borderRadius: 4,
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            {["study", "results"].map((k) => {
              const isActive = mode === k;

              return (
                <div
                  key={k}
                  onClick={() => setMode(k)}
                  style={{
                    height: "100%",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",

                    backgroundColor: isActive ? "#2666BE" : "#FFFFFF",
                    color: isActive ? "#FFFFFF" : "rgba(0, 0, 0, 0.7)",

                    fontFamily: "Rubik",
                    fontSize: 13,
                    lineHeight: "20px",
                    fontWeight: 400,

                    whiteSpace: "nowrap",
                  }}
                >
                  {k === "study" ? "Study" : "Results"}
                </div>
              );
            })}
          </div>

          {/* Download CSV */}
          <div
            style={{
              border: "1px solid #2666BE",
              borderRadius: 6,
              padding: "0 15px",
              height: 36,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              color: "#2666BE",
              fontFamily: "Rubik",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <img src={download}></img>
            Download CSV
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ padding: 15 }}>
        {/* TABLE HEADER */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: finalColumns
              .map((c) =>
                typeof c.width === "number" ? `${c.width}px` : c.width || "1fr",
              )
              .join(" "),

            background: "#F0F6FE",
            padding: 15,
            fontSize: 12,
            fontFamily: "Rubik",
            color: "rgba(74, 85, 101, 1)",
            borderRadius: "4px 4px 0 0",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          {finalColumns.map((col) => (
            <div key={col.key}>{col.label}</div>
          ))}
        </div>

        {/* TABLE ROWS */}
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.05)",
            borderTop: "none",
          }}
        >
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.05)",
              borderTop: "none",
            }}
          >
            {data.map((trial) => (
              <div key={trial.id}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: finalColumns
                      .map((c) =>
                        typeof c.width === "number"
                          ? `${c.width}px`
                          : c.width || "1fr",
                      )
                      .join(" "),

                    padding: "15px",
                    alignItems: "center",
                    fontFamily: "Rubik",
                  }}
                >
                  {finalColumns.map((col) => {
                    if (col.key === "ageDistribution") {
                      return (
                        <AgeSparkline
                          key={col.key}
                          values={trial.ageDistribution || []}
                        />
                      );
                    }

                    if (col.key === "action") {
                      return (
                        <div
                          key={col.key}
                          style={{
                            color: "rgba(38, 102, 190, 1)",
                            fontWeight: 500,
                            fontSize: 14,
                            cursor: "pointer",
                          }}
                        >
                          View Summary
                        </div>
                      );
                    }

                    if (col.key === "name") {
                      return (
                        <div key={col.key}>
                          <div
                            style={{ fontSize: 12, color: "rgba(0,0,0,0.6)" }}
                          >
                            {trial.id}
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: "#1C4D8E",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              fontFamily: "Rubik",
                            }}
                          >
                            {trial.name}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={col.key}
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "rgba(0,0,0,0.7)",
                        }}
                      >
                        {trial[col.key] ?? "-"}
                      </div>
                    );
                  })}
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: "rgba(0,0,0,0.1)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

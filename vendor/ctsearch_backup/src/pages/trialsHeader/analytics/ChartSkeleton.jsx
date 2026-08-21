export const ScatterChartSkeleton = ({ height = 260 }) => {
  const columns = 7; // years
  const rows = 4; // grid rows

  return (
    <div
      style={{
        height,
        padding: "16px 24px 28px 48px",
        borderRadius: 6,
        border: "1px solid #E5E7EB",
        background: "#fff",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* GRID */}
      <div
        style={{
          position: "absolute",
          inset: "16px 24px 36px 48px",
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {/* Horizontal grid lines */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`h-${i}`}
            style={{
              gridColumn: `1 / -1`,
              borderTop: "1px dashed #E5E7EB",
            }}
          />
        ))}

        {/* Vertical grid lines */}
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`v-${i}`}
            style={{
              gridRow: `1 / -1`,
              borderLeft: "1px dashed #E5E7EB",
            }}
          />
        ))}
      </div>

      {/* DOTS */}
      <div
        style={{
          position: "absolute",
          inset: "16px 24px 36px 48px",
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {/* Observed */}
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "linear-gradient(90deg,#CBD5E1,#E5E7EB,#CBD5E1)",
                animation: "skeleton 1.4s infinite",
              }}
            />
            {/* Planned */}
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "linear-gradient(90deg,#E5E7EB,#F1F5F9,#E5E7EB)",
                animation: "skeleton 1.4s infinite",
              }}
            />
          </div>
        ))}
      </div>

      {/* Y-AXIS */}
      <div
        style={{
          position: "absolute",
          left: 48,
          top: 16,
          bottom: 36,
          width: 1,
          background: "#9CA3AF",
        }}
      />

      {/* X-AXIS */}
      <div
        style={{
          position: "absolute",
          left: 48,
          right: 24,
          bottom: 36,
          height: 1,
          background: "#9CA3AF",
        }}
      />
    </div>
  );
};

export const VerticalBarSkeleton = ({ height = 220 }) => (
  <div
    style={{
      height,
      padding: "16px",
      borderRadius: 6,
      border: "1px solid #E5E7EB",
      background: "#fff",
      display: "flex",
      alignItems: "flex-end",
      gap: 14,
    }}
  >
    {[40, 70, 55, 85, 60].map((h, i) => (
      <div
        key={i}
        style={{
          width: 20,
          height: `${h}%`,
          borderRadius: 4,
          background:
            "linear-gradient(180deg, #F0F0F3 25%, #E6E6EB 50%, #F0F0F3 75%)",
          animation: "skeleton 1.4s infinite",
        }}
      />
    ))}
  </div>
);
export const HorizontalBarSkeleton = ({ height = 220 }) => (
  <div
    style={{
      height,
      padding: "12px",
      borderRadius: 6,
      border: "1px solid #E5E7EB",
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}
  >
    {[1, 2, 3, 4, 5].map((_, i) => (
      <div
        key={i}
        style={{
          height: 12,
          width: `${70 - i * 8}%`,
          borderRadius: 6,
          background:
            "linear-gradient(90deg, #F0F0F3 25%, #E6E6EB 37%, #F0F0F3 63%)",
          animation: "skeleton 1.4s infinite",
        }}
      />
    ))}
  </div>
);
export const PieSkeleton = () => (
  <div
    style={{
      width: 160,
      height: 160,
      borderRadius: "50%",
      background:
        "conic-gradient(#F0F0F3 0deg, #E6E6EB 120deg, #F0F0F3 240deg)",
      animation: "skeleton-rotate 1.6s linear infinite",
    }}
  />
);

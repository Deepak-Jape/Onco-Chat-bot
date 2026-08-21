import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
// import {
//   VerticalBarSkeleton,
//   HorizontalBarSkeleton,
//   PieSkeleton,
// } from "./ChartSkeleton";

import { VerticalBarSkeleton,HorizontalBarSkeleton,PieSkeleton, } from "../../pages/trialsHeader/analytics/ChartSkeleton";

export const CustomHorizontalTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const { label, value } = payload[0].payload;

  return (
    <div
      style={{
        background: "#fff",
        padding: "8px 10px",
        borderRadius: 6,
        boxShadow: "0px 4px 16px rgba(0,0,0,0.1)",
        border: "1px solid #E5E7EB",
        fontFamily: "Rubik",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: "rgba(0,0,0,0.8)",
          fontFamily: "Rubik",
          marginBottom: 2,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 400,
          color: "rgba(0,0,0,0.6)",
          fontFamily: "Rubik",
        }}
      >
        N = {value}
      </div>
    </div>
  );
};

export const StudyResultsToggle = ({ mode, setMode }) => {
  return (
    <div
      style={{
        display: "inline-flex",
        height: "32px",
        border: "1px solid rgba(184, 212, 249, 1)", // Info/300
        borderRadius: "4px",
        background: "rgba(255, 255, 255, 1)", // White/1000
        overflow: "hidden",
      }}
    >
      {["observed", "planned"].map((key) => {
        const isActive = mode === key;

        return (
          <div
            key={key}
            onClick={() => setMode(key)}
            style={{
              height: "32px",
              padding: "0 12px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontFamily: "Rubik",
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: "32px",
              background: isActive
                ? "rgba(38, 102, 190, 1)" // Info/600
                : "rgba(255, 255, 255, 1)",
              color: isActive ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 0.7)",
              borderRadius: "4px",
              whiteSpace: "nowrap",
            }}
          >
            {key === "observed" ? "Study" : "Results"}
          </div>
        );
      })}
    </div>
  );
};

export const DemographicCard = ({
  title,
  trials,
  observedData = [],
  plannedData = [],
  isLoaded,
  children,
  chartType,
  mode,
  onTrialsClick,
}) => {
  // const [mode, setMode] = useState("observed");

  const dataToRender = mode === "observed" ? observedData : plannedData;
  const renderSkeleton = () => {
    switch (chartType) {
      case "verticalBar":
        return <VerticalBarSkeleton />;
      case "horizontalBar":
        return <HorizontalBarSkeleton />;
      case "pie":
        return <PieSkeleton />;
      default:
        return <HorizontalBarSkeleton />;
    }
  };

  return (
<div
  style={{
    background: "rgba(255, 255, 255, 1)",
    padding: 16,
    borderRadius: 6,
    border: "0.75px solid rgba(0, 0, 0, 0.1)",
    boxShadow: "1.5px 1.5px 7.51px 0px rgba(183, 192, 208, 0.05)",
  }}
>

      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 17,
              fontWeight: 500,
              color: "rgba(0, 0, 0, 0.8)",
              fontFamily: "Rubik",
            }}
          >
            {title}
          </div>
          {trials && (
            <div
              onClick={() => onTrialsClick?.()}
              style={{
                display: "inline-flex", // Hug width
                alignItems: "center",
                gap: "8px",
                height: "32px",
                padding: "0 8px",
                background: "rgba(240, 246, 254, 1)", // Info/100
                color: "rgba(38, 102, 190, 1)", // Info/600
                borderRadius: "4px",
                border: "1px solid rgba(220, 233, 252, 1)", // Info/200
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "Rubik",
                lineHeight: "32px",
                cursor: "pointer",
                userSelect: "none",
                whiteSpace: "nowrap",
              }}
            >
              {trials} Trials
            </div>
          )}
        </div>

        {/* Toggle */}
        {/* <div
          style={{
            marginTop: 6,
            display: "inline-flex",
            border: "1px solid #BFDBFE",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          {["observed", "planned"].map((key) => (
            <div
              key={key}
              onClick={() => setMode(key)}
              style={{
                padding: "4px 10px",
                cursor: "pointer",
                background:
                  mode === key
                    ? "rgba(38, 102, 190, 1)"
                    : "rgba(255, 255, 255, 1)",
                color:
                  mode === key
                    ? "rgba(255, 255, 255, 1)"
                    : "rgba(0, 0, 0, 0.7)",
                fontWeight: 400,
                fontFamily: "Rubik",
                fontSize: "12px",
              }}
            >
              
              {key === "observed" ? "Observed" : "Planned"}
            </div>
          ))} */}
        {/* </div> */}
      </div>

      {/* Render chart */}
      {/* Render chart */}

      {isLoaded
        ? typeof children === "function"
          ? children(dataToRender)
          : children
        : renderSkeleton()}

      {mode === "planned" && (
        <div
          style={{
            marginTop: 15,
            fontSize: 12,
            fontFamily: "Rubik",
            color: "rgba(0,0,0,0.6)",
          }}
        >
          Based on protocol inclusion criteria
        </div>
      )}
    </div>
  );
};

export const VerticalBar = ({ data }) => (
  <div style={{ height: 220 }}>
    <ResponsiveContainer>
      <BarChart
        data={data}
        barCategoryGap={40}
        margin={{ top: 0, right: 0, left: 1, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="4 4" vertical={false} />

        <XAxis
          dataKey="label"
          tickLine={false}
          // axisLine={false}
          tick={{
            fontFamily: "Rubik",
            fontSize: 12,
            fontWeight: 400,
            fill: "rgba(0, 0, 0, 0.7)",
            textAnchor: "middle",
            lineHeight: "100%",
          }}
        />

        <YAxis
          domain={[0, 200]}
          tickLine={false}
          width={30}
          // axisLine={false}
          tick={{
            fontFamily: "Rubik",
            fontSize: 12,
            fontWeight: 400,
            lineHeight: "100%",
            fill: "rgba(0, 0, 0, 0.7)",
            textAnchor: "end",
          }}
        />

        <Tooltip
          content={<CustomHorizontalTooltip />}
          cursor={{ fill: "transparent" }}
        />

        <Bar
          dataKey="value"
          fill="#2F80ED"
          radius={[6, 6, 0, 0]}
          barSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const GenderPie = ({ data }) => {
  const COLORS = ["#2F80ED", "#9CC3F7"];

  return (
    <div
      style={{
        height: 220,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* PIE */}
      <div style={{ width: 160, height: 160 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={70}
              startAngle={200}
              endAngle={-160}
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {data.map((item, index) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {/* DOT */}
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: COLORS[index],
                display: "inline-block",
              }}
            />

            {/* TEXT */}
            <span
              style={{
                fontFamily: "Rubik",
                fontSize: 12,
                fontWeight: index === 0 ? 400 : 400,
                color:
                  index === 0 ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.7)",
              }}
            >
              {item.label} {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

import { useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const BAR_HEIGHT = 53;
const CARD_HEIGHT = 292;
const CARD_PADDING = 15 * 2; // top + bottom
const TITLE_HEIGHT = 32; // "Trial sponsor graph"
const VIEWPORT_HEIGHT = CARD_HEIGHT - CARD_PADDING - TITLE_HEIGHT;
const CustomHorizontalTooltip = ({ active, payload }) => {
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
          marginBottom: 2,
          fontFamily: "Rubik",
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

export default function HorizontalBar({ data }) {
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const WrappedYAxisTick = ({ x, y, payload }) => {
    const MAX_CHARS = 10;
    const LINE_HEIGHT = 14;

    const words = payload.value.split(" ");

    let lines =
      words.length > 1
        ? [
            words[0],
            words.slice(1).join(" ").length > MAX_CHARS
              ? words.slice(1).join(" ").slice(0, MAX_CHARS) + "..."
              : words.slice(1).join(" "),
          ]
        : [
            words[0].length > MAX_CHARS
              ? words[0].slice(0, MAX_CHARS) + "..."
              : words[0],
          ];

    const blockOffset = (lines.length - 1) * LINE_HEIGHT;

    return (
      <g>
        <text
          x={x}
          y={y}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={12}
          fontFamily="Rubik"
          fontWeight={400}
          fill="rgba(0, 0, 0, 0.7)"
        >
          {lines.map((line, i) => (
            <tspan key={i} x={x} dy={i === 0 ? -blockOffset / 2 : LINE_HEIGHT}>
              {line}
            </tspan>
          ))}

          <tspan x={x + 8} dy={0}>
            -
          </tspan>
        </text>

        {/* tick line centered with bar */}
        {/* <line
        x1={x - 6}
        x2={x}
        y1={y}
        y2={y}
        stroke="#6B7280"
        strokeWidth={1}
      /> */}
      </g>
    );
  };

  const contentHeight = data.length * BAR_HEIGHT;
  const thumbHeight = Math.max(
    (VIEWPORT_HEIGHT / contentHeight) * VIEWPORT_HEIGHT,
    32,
  );

  const maxScroll = contentHeight - VIEWPORT_HEIGHT;
  const thumbTop =
    maxScroll > 0
      ? (scrollTop / maxScroll) * (VIEWPORT_HEIGHT - thumbHeight)
      : 0;

  return (
    <div style={{ position: "relative" }}>
      {/* SCROLL AREA */}
      <div
        ref={scrollRef}
        onScroll={(e) => setScrollTop(e.target.scrollTop)}
        style={{
          height: VIEWPORT_HEIGHT,
          overflowY: "auto",
          paddingRight: 12,
          scrollbarWidth: "none",
        }}
      >
        <div style={{ height: contentHeight }}>
          <ResponsiveContainer width="100%" height={contentHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 20, right: 25 }}
              barCategoryGap={29}
            >
              <CartesianGrid
                strokeDasharray="4 6"
                vertical
                horizontal={false}
                stroke="#E5E7EB"
              />

              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tickMargin={6}
                // tick={{ fill: "#6B7280", fontSize: 11 }}
                tick={{
                  fontFamily: "Rubik",
                  fontSize: 12,
                  fontWeight: 400,
                  fill: "rgba(0,0,0,0.7)",
                }}
              />

              <YAxis
                type="category"
                dataKey="label"
                width={68}
                tickMargin={3}
                tick={<WrappedYAxisTick />}
                axisLine={{
                  stroke: "#9CA3AF",
                  strokeWidth: 1,
                }}
                tickLine={false}
              />

              <Tooltip
                content={<CustomHorizontalTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Bar
                dataKey="value"
                fill="#2F80ED"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CUSTOM SCROLLBAR */}
      {contentHeight > VIEWPORT_HEIGHT && (
        <div
          style={{
            width: 4,
            height: VIEWPORT_HEIGHT,
            position: "absolute",
            right: -15,
            top: 0,
            borderRadius: 30,
            background: "#E8E8EC",
          }}
        >
          <div
            style={{
              width: 4,
              height: thumbHeight,
              position: "absolute",
              top: thumbTop,
              borderRadius: 30,
              background: "#CDCED6",
            }}
          />
        </div>
      )}
    </div>
  );
}

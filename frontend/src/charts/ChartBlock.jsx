import { Component, Suspense } from "react";
import { getChart } from "./registry";

/* Renders one {type:"chart", chart, props} block from the Python answer.

   Unknown or gated charts render nothing rather than throwing -- Python already
   filters to enabled charts, so this is a second line of defence for the case
   where a chart is disabled between the answer being built and the UI rendering
   it (e.g. a stale chat replayed from localStorage). */

class ChartErrorBoundary extends Component {
  constructor(p) {
    super(p);
    this.state = { failed: false, message: "" };
  }
  static getDerivedStateFromError(error) {
    return { failed: true, message: String(error?.message || error) };
  }
  componentDidCatch(error, info) {
    // Surface the real cause: a bare "could not be rendered" gives nothing to
    // debug when a vendored component throws deep inside its own tree.
    console.error(`[ChartBlock:${this.props.name}]`, error, info?.componentStack);
  }
  render() {
    if (this.state.failed) {
      return (
        <div
          style={{
            padding: 12, fontSize: 13, color: "#b42318",
            background: "#fef4f3", border: "1px solid #f3b4ae", borderRadius: 8,
          }}
        >
          <strong>{this.props.name}</strong> could not be rendered.
          <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: 12 }}>
            {this.state.message}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ChartBlock({ chart, props, onOpenSummary }) {
  const entry = getChart(chart);
  if (!entry) return null;
  const Component = entry.component;
  // Only the cohort table has clickable ids; passing the handler to every chart
  // would put an unused prop on components that do not expect one.
  const extra = chart === "CohortTable" ? { onOpenSummary } : null;
  return (
    <ChartErrorBoundary name={chart}>
      <Suspense
        fallback={
          <div style={{ padding: 16, fontSize: 13, color: "rgba(0,0,0,0.45)" }}>
            Loading {entry.label}…
          </div>
        }
      >
        <Component {...(props || {})} {...extra} />
      </Suspense>
    </ChartErrorBoundary>
  );
}

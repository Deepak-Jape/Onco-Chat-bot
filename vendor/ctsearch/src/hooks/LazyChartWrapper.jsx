import { useEffect } from "react";
import useChartVisibility from "./useChartVisibility";

export default function LazyChartWrapper({
  chartKey,
  loadedCharts,
  setLoadedCharts,
  hasUserScrolled,
  scrollRef,         
  children,
}) {

const { ref, isVisible, isInitiallyVisible } =
  useChartVisibility(scrollRef);
//   console.log(chartKey, {
//   isInitiallyVisible,
//   isVisible,
//   hasUserScrolled,
// });

useEffect(() => {
  if (isInitiallyVisible && !loadedCharts[chartKey]) {
    setLoadedCharts((p) => ({ ...p, [chartKey]: true }));
    return;
  }

  // (scroll OR layout reveal both allowed)
  if (isVisible && !loadedCharts[chartKey]) {
    setLoadedCharts((p) => ({ ...p, [chartKey]: true }));
  }
}, [isVisible, isInitiallyVisible]);


  return <div ref={ref}>{children}</div>;
}

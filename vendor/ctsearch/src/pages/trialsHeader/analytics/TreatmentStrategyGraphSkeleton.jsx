import React from "react";
import { analyticStyles } from "./style";

const TreatmentStrategiesSkeleton = () => {
  const classes = analyticStyles();

  return (
    <div className={classes.skeletonWrapper}>
      {/* Left Chart Card */}
      <div className={classes.chartCard2}>
        <div className={classes.chartTopRow2}>
          <div className={classes.skeletonTitle} />
          <div className={classes.skeletonBadge} />
        </div>

        <div className={classes.skeletonChartArea}>
          <div className={classes.skeletonYAxisLabel} />
          <div className={classes.skeletonGrid}>
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className={classes.skeletonBarGroup}>
                <div
                  className={classes.skeletonBar}
                  style={{
                    height: `${60 + index * 18}px`,
                  }}
                />
                <div className={classes.skeletonXAxisLabel} />
              </div>
            ))}
          </div>
          <div className={classes.skeletonXAxisTitle} />
        </div>
      </div>

      {/* Right Filter Card */}
      <div className={classes.filterCard}>
        <div className={classes.filterHeader}>
          <div className={classes.skeletonToggle} />
          <div className={classes.skeletonFilterTitle} />
        </div>

        <div className={classes.filterBody}>
          <div className={classes.filterColumn}>
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className={classes.filterRow}>
                <div className={classes.skeletonCheckbox} />
                <div className={classes.skeletonFilterText} />
              </div>
            ))}
          </div>

          <div className={classes.filterDivider} />

          {/* <div className={classes.filterColumn}>
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className={classes.filterRow}>
                <div className={classes.skeletonCheckbox} />
                <div className={classes.skeletonFilterTextSmall} />
              </div>
            ))}
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default TreatmentStrategiesSkeleton;

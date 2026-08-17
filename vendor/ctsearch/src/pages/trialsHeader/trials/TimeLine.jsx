import React from "react";
import { trialStyles } from "./style";

export default function ResponsiveTimeline({ data = [], noContainer = false }) {
  const toDate = (v) => (v && v !== 'None' ? new Date(v) : null);
  const today = new Date();
        const lastCompletedIndex = data.reduce((lastIdx, item, i) => {
    const date = toDate(item.value);
    return (date && date < today) ? i : lastIdx;
  }, -1);

  const futureIndex = data.findIndex((item) => {
    const date = toDate(item.value);
    return date && date > today;
  });

  const steps = data.map((item, i) => {
    const date = toDate(item.value);
    let color = "#3b82f6"; 
    let filled = false;
    let showIcon = false;

    if (lastCompletedIndex !== -1 && i <= lastCompletedIndex) {
      color = "#22c55e";
      filled = true;
      showIcon = true;
    }

    return {
      ...item,
      color,
      filled,
      showIcon,
      formattedDate: (item.value && item.value !== 'None')
        ? `${new Date(item.value).toLocaleString("default", { month: "short" })} ${new Date(item.value).getFullYear()}`
        : "",
    };
  });

  trialStyles();

  return (
    <div
      style={{
        fontFamily: "Rubik, sans-serif",
        width: "100%",
        ...(noContainer
          ? {}
          : {
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 10,
            }),
      }}
    >
      <style>{`
        .timeline-heading {
          font-family: "Rubik";
          font-weight: 500;
          font-size: 16px;
          line-height: 20px;
          letter-spacing: 0%;
          color: rgba(0, 0, 0, 0.8);
          margin: 0 0 8px 0;
          text-align: left;
        }
        .timeline-wrapper {
          display: flex;
          flex-direction: row;
          width: 100%;
          padding: 10px 0;
          overflow-x: hidden;
        }
        .timeline-wrapper.is-compact .step-item {
          min-width: 120px;
        }
        .timeline-wrapper.is-compact {
          gap: 28px;
        }
        .step-item {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 160px; /* Prevents overlap (e.g., Primary Completion / Completion) */
        }
        /* The Line */
        .step-item:not(:last-child)::after {
          content: "";
          position: absolute;
          top: 7.5px;
          left: 18px;
          right: 0;
          height: 4px;
          background-color: #e5e7eb;
          z-index: 1;
        }
        .timeline-wrapper.is-compact .step-item:not(:last-child)::after {
          right: -28px;
        }
        .step-item.path-complete:not(:last-child)::after {
          background-color: #22c55e;
        }
        .dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid;
          background: white;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          position: relative;
        }
        .dot.filled {
          background-color: currentColor;
        }
        .check-mark {
          color: white;
          font-size: 10px;
          line-height: 1;
        }
        .content-box {
          text-align: left;
        }
        .title {
          font-size: 14px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.8);
          margin-bottom: 2px;
          white-space: normal;
          max-width: 140px;
          line-height: 20px;
          letter-spacing: 0%;
        }
        .date {
          font-size: 14px;
          font-weight: 400;
          line-height: 18px;
          letter-spacing: 0%;
          color: rgba(0, 0, 0, 0.6);
        }
      `}</style>

      <div className="timeline-heading">Timeline</div>
      <div className={`timeline-wrapper${noContainer ? " is-compact" : ""}`}>
        {steps.length > 0 ? (
          steps.map((step, i) => {
            // A path is "complete" (green) if THIS step and the NEXT step are both completed
            const isPathComplete = i < lastCompletedIndex;

            return (
          <div 
            key={i} 
                className={`step-item ${isPathComplete ? "path-complete" : ""}`}
          >
                <div
                  className={`dot ${step.filled ? "filled" : ""}`}
                  style={{
                    color: step.color,
                    backgroundColor: step.filled ? undefined : "#e5e7eb",
                    borderColor: step.filled ? step.color : "#e5e7eb",
                  }}
                >
                  {step.showIcon && <span className="check-mark">✓</span>}
            </div>

            <div className="content-box">
              <div className="title">{step?.step || step?.title}</div>
                  <div className="date">
                    {step.formattedDate}
                  </div>
                  {step.subValue && (
                    <div className="date" style={{ color: '#3b82f6' }}>
                      {step.subValue}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p>No Timeline Data</p>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { trialStyles } from "./style";
import { Divider } from "@mui/material";

export default function ResultPrimaryEndpoint({ data }) {
  if (!data || !Array.isArray(data)) return null;

  const entry = data[0];
  const primaryEndpoint = entry?.primary_endpoint;
  const primaryOutcome = entry?.primary_outcome;
  const performance = entry?.intervention_performance_summary;
  const classes = trialStyles();
  return (
    <div className="w-full">
      {/* Primary Endpoint */}
      <div
        style={{ borderRadius: "4px" }}
        className="border p-4 mb-5 shadow-md"
      >
        <h2 className={classes.primaryendpoint_title}>
          {primaryEndpoint?.title}
        </h2>
        <p className={classes.primaryendpoint_value0}>
          {primaryEndpoint?.value[0]}
        </p>
        <p className={classes.primaryendpoint_value1}>
          {primaryEndpoint?.value[1]}
        </p>
      </div>

      {/* Primary Outcome Table */}
      <div
        style={{ borderRadius: "4px" }}
        className="border p-4 shadow-md mb-5"
      >
        <h2 className={classes.primaryoutcome_title}>{primaryOutcome?.title}</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className={classes.primaryoutcome_table_title}>
                Treatment Arm
              </th>
              <th className={classes.primaryoutcome_table_title}>Median PFS</th>
              <th className={classes.primaryoutcome_table_title}>95% CI</th>
              <th className={classes.primaryoutcome_table_title}>VS Control</th>
            </tr>
          </thead>
          <tbody>
            {primaryOutcome?.value?.map((row, idx) => (
              <tr key={idx} className={classes.primaryOutcomeRow}>
                <td className={classes.primaryoutcome_table_row}>
                  {row?.col_1.value}
                </td>
                <td className={classes.primaryoutcome_table_row}>
                  {row?.col_2.value} Months
                </td>
                <td className={classes.primaryoutcome_table_row}>
                  {row?.col_3.value}
                </td>
                <td className={classes.primaryoutcome_table_row}>
                  {row?.col_4.value} Months
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Intervention Summary */}

      <div
        style={{
          borderRadius: "4px",
        }}
        className="border rounded-2xl p-4 shadow-md mb-5"
      >
        <h2 className={classes.performance_title}>{performance?.title}</h2>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          {!performance?.value?.response_rates?.value[0] ===
            "Not Available" && (
            <div style={{ width: "50%" }}>
              {/* Response Rates */}

              <h3 className={classes.response_rate_title}>
                {performance?.value?.response_rates.title}
              </h3>
              <table className="w-full text-sm mb-2">
                <tbody>
                  {performance?.value?.response_rates?.value[0]?.map(
                    (rr, i) => (
                      <tr key={i}>
                        <td className={classes.rr_title}>{rr?.title}</td>
                        <td className={classes.rr_value}>{rr?.value}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
              <Divider style={{ margin: "10px 0px" }} />
              <div className={classes.best_control_text}>
                Best VS Control:{" "}
                <span style={{ paddingRight: "8px" }}>
                  {" "}
                  {performance?.value?.response_rates?.value[1]?.value}
                </span>
              </div>
            </div>
          )}

          {!performance?.value?.disease_control_rate?.value[0] ===
            "Not Available" && (
            <div style={{ width: "50%" }}>
              {/* DCR */}

              <h3 className={classes.response_rate_title}>
                {performance?.value?.disease_control_rate?.title}
              </h3>
              <table className="w-full text-sm mb-2">
                <tbody>
                  {performance?.value?.disease_control_rate?.value[0]?.map(
                    (rr, i) => (
                      <tr key={i}>
                        <td className={classes.rr_title}>{rr?.title}</td>
                        <td className={classes.rr_value}>{rr?.value}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
              <Divider style={{ margin: "10px 0px" }} />
              <div className={classes.best_control_text}>
                Best VS Control:{" "}
                <span style={{ paddingRight: "8px" }}>
                  {" "}
                  {performance?.value.disease_control_rate?.value[1]?.value}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

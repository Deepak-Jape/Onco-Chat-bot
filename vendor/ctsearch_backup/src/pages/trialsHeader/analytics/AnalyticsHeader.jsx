import { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { lazy, Suspense } from "react";
import CommonTabs from "../../../common/Tabs";
import Button from "@mui/material/Button";
import { analyticStyles } from "./style";
import { downloadIcon, helpIcon } from "../../../assets";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
const LandScapeTab = lazy(() => import("./LandScapeTab"));
// import LandScapeTab from "./LandScapeTab";
import {
  analyticsHeaderTabs,
  getCardSize,
} from "../../../utils/helpers/helper";
import EvidenceTab from "./EvidenceTab";
const FeasibilityTab = lazy(() => import("./FeasibilityTab"));
const OutcomesTab = lazy(() => import("./OutcomesTab"));
const ScoutingTab = lazy(() => import("./ScoutingTab"));
const OncoSignalTab = lazy(() => import("./OncoSignalTab"));
// import OutcomesTab from "./OutcomesTab";
// import ScoutingTab from "./ScoutingTab";
// import OncoSignalTab from "./OncoSignalTab";
import AnalyticsHeaderSkeleton from "./AnalyticsHeaderSkeleton";
import { getAnalytics } from "../../../services/analyticsService";
const RiskTab = lazy(() => import("./RiskTab"));
const PopulationTab = lazy(() => import("./PopulationTab"));

const TreatmentTab = lazy(() => import("./TreatmentTab"));
import { ANALYTICS_TABS } from "../../../utils/helpers/helper";
// import TreatmentStackedChart from "./Treatment";

export default function AnalyticsHeader({ analyticsData, loading }) {
  // const [activeTab, setActiveTab] = useState("Landscape");
  const [activeTab, setActiveTab] = useState("Population");
  const [outcomesTopData, setOutcomesTopData] = useState(null);
  const classes = analyticStyles();
  const [outcomesLoading, setOutcomesLoading] = useState(false);
  const scrollRef = useRef(null);

  const onChangeTab = (tab) => {
    setActiveTab(tab);
    if (tab === "Outcomes") {
      setOutcomesLoading(true); // show skeleton
      loadOutcomesData(); // trigger API fetch
    }
  };

  const loadOutcomesData = async () => {
    try {
      const res = await getAnalytics();
      setOutcomesTopData(res?.top_data);
    } catch (err) {
      console.error(err);
    } finally {
      setOutcomesLoading(false); // hide skeleton when loaded
    }
  };

  const tabMetrics = {
    Landscape: [
      {
        title: "Total Trials",
        value: (
          analyticsData?.top_data?.total_trial_count ?? 0
        ).toLocaleString(),
      },
      {
        title: "Active Trials",
        value: (
          analyticsData?.top_data?.active_trial_count ?? 0
        ).toLocaleString(),
      },
      {
        title: "Median Enrollment Size",
        value: `${(
          analyticsData?.top_data?.median_enrollment ?? 0
        ).toLocaleString()} Patients`,
      },
      {
        title: "Industry vs Academic",
        value: (
          analyticsData?.top_data?.ratio_pct_academic_industry ?? 0
        ).toLocaleString(),
      },
    ],

    Evidence: [
      { title: "Trials Using Biomarkers", value: "68% Trials" },
      { title: "Number of Endpoints", value: "4.2 Per trial" },
      { title: "Number of Arms", value: "2.7 Per trial" },
      { title: "Top Primary Endpoint", value: "PFS" },
      { title: "Evidence Strength", value: "74/100" },
    ],

    Feasibility: [
      { title: "Recruitment Rate", value: "10 Patients per month" },
      { title: "Dropout Rate", value: "4%" },
      { title: "Operational Feasibility", value: "79/100" },
    ],

    Risks: [
      { title: "% of Trials with ≥1 Amendment", value: "78%" },
      { title: "Changes in Enrollment Target", value: "3.7" },
      { title: "Changes in Protocol Design", value: "0.8" },
      { title: "Median Days to First Amendment", value: "45 Days" },
    ],
    Outcomes: [
      {
        title: "Completion Rate",
        value: `${outcomesTopData?.completion_rate ?? 0}%`,
      },
      {
        title: "Median PFS",
        value: `${outcomesTopData?.median_pfs_score ?? 0} Months`,
      },
      {
        title: "Median OS",
        value: `${outcomesTopData?.median_os_score ?? 0} Months`,
      },
      {
        title: "Positive Readout Rate",
        value: `${outcomesTopData?.positive_readout ?? 0}%`,
      },
      {
        title: "Median Grade ≥3 AE Rate",
        value: "18%", // still static
      },
      {
        title: "Primary Completion",
        value: `${outcomesTopData?.primary_completion ?? 0} Months`,
      },
    ],
  };

  const metrics = tabMetrics[activeTab] || [];

  return (
    <div style={{ width: "75%" }}>
      {loading ? (
        <AnalyticsHeaderSkeleton />
      ) : (
        <>
          {" "}
          <div className="h-screen  relative pb-40 z-30 font-sans bg-mainBlue text-left">
            <div
              style={{
                width: "100%",
              }}
              className="rounded-sm"
            >
              {/* Added new code for changing the tabs from line 149-205 */}
              <div
                style={{
                  width: "100%",
                  paddingTop: 16,
                  paddingLeft: 20,
                  paddingRight: 20,
                  background: "#F9F9FB",
                  boxShadow: "0px 4px 10px rgba(130,143,169,0.15)",
                  borderBottom: "1px solid #F0F0F3",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 15,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "flex-end",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                    background: "#F9F9FB",
                  }}
                >
                  {ANALYTICS_TABS.map((tab) => {
                    const isActive = activeTab === tab.value;
                    const isDisabled = tab.disabled;

                    return (
                      <div
                        key={tab.value}
                        onClick={() => onChangeTab(tab.value)}
                        style={{
                          minHeight: 32,
                          padding: "8px 15px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isActive ? "#DCE9FC" : "transparent",
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                          borderBottom: isActive
                            ? "3px solid #2666BE"
                            : "1px solid transparent",
                          opacity: isDisabled ? 0.4 : 1,
                          pointerEvents: isDisabled ? "none" : "auto",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Rubik",
                            fontSize: 14,
                            lineHeight: "20px",
                            fontWeight: isActive ? 500 : 400,
                            color: isActive ? "#2666BE" : "rgba(0,0,0,0.7)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tab.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex flex-col"
                style={{
                  overflowY: "auto",
                  maxHeight: "calc(100vh - 10rem)",
                  scrollbarWidth: "thin",
                }}
              >
                <div
                  style={{
                    padding: "0% 2%",
                  }}
                  className="flex items-center justify-between "
                >
                  <div className="flex space-x-8">
                    {/* <CommonTabs
                      tabs={analyticsHeaderTabs}
                      onChange={onChangeTab}
                      value={activeTab} // 🔥 required to move underline
                      defaultValue="Landscape"
                    /> */}
                  </div>
                  {/* <div className={classes.search_box}>
                    <Button variant="outlined" className={classes.download_btn}>
                      <img src={downloadIcon} width={12.5} height={15.8} />
                      Download PDF
                    </Button>
                    <div
                      style={{
                        width: "55%",
                      }}
                      className="relative"
                    >
                      <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search analytics view"
                        className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div> */}
                </div>

                <Grid
                  container
                  sx={{
                    m: 2,
                    display: "grid",
                    gap: "16px",
                    padding: "0% 0.5%",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: `repeat(${Math.min(metrics?.length, 2)}, 1fr)`,
                      md: `repeat(${Math.min(metrics?.length, 3)}, 1fr)`,
                      lg: `repeat(${metrics?.length}, 1fr)`,
                    },
                  }}
                >
                  {metrics?.map((item, index) => {
                    const { height } = getCardSize(activeTab);

                    let number = item?.value;
                    let unit = "";

                    if (typeof item?.value === "string") {
                      const parts = item.value.split(" ");
                      number = parts[0];
                      unit = parts.slice(1).join(" ");
                    }

                    return (
                      <Grid
                        key={index}
                        sx={{
                          height,
                          p: 2,
                        }}
                        className={classes.analytics_header_tab}
                      >
                        <Typography
                          sx={{
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            lineHeight: 1.2,
                          }}
                          className={classes.anaytics_header_title}
                        >
                          {item.title}
                          <img
                            src={helpIcon}
                            style={{ width: 14, cursor: "pointer" }}
                          />
                        </Typography>

                        <Typography
                          color="var(--Black-700, rgba(0,0,0,0.7))"
                          fontSize={30}
                          fontWeight={500}
                          display="flex"
                          alignItems="baseline"
                          gap={0.5}
                          fontFamily="Rubik"
                        >
                          {number}
                          {unit && (
                            <span style={{ fontSize: 12, fontWeight: 400 }}>
                              {unit}
                            </span>
                          )}
                        </Typography>
                      </Grid>
                    );
                  })}
                </Grid>
                <Suspense fallback={<div>Loading...</div>}>
                  {activeTab === "Landscape" && (
                    <LandScapeTab
                      trialVolumeByPhase={analyticsData?.trialsByPhase}
                      timeToPrimaryCompletion={analyticsData?.trialsByTTPE}
                      activeRecruitingTrialsByCountry={
                        analyticsData?.activeRecruitingTrialsByCountry
                      }
                    />
                  )}

                  {/* {activeTab === "Evidence" && <EvidenceTab />} */}

                  {/* {activeTab === "Feasibility" && <FeasibilityTab />} */}
                  {/* {activeTab === "Feasibility" && <FeasibilityTab />} */}
                  {activeTab === "Outcomes" && <OutcomesTab />}
                  {activeTab === "Scouting" && <ScoutingTab />}
                  {activeTab === "OncoSignal" && <OncoSignalTab />}

                  {activeTab === "Risks" && <RiskTab />}
                  {activeTab === "Population" && <PopulationTab />}
                  {activeTab === "Treatment" && <TreatmentTab />}
                </Suspense>
                {/* {activeTab === "Treatment" && <TreatmentStackedChart />} */}
              </div>
            </div>
            {/* <div className="geo"></div> */}
            {/* </div> */}
          </div>{" "}
        </>
      )}{" "}
    </div>
  );
}

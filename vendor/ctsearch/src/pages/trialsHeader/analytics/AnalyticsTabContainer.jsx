import { useEffect, useRef } from "react";
import Grid from "@mui/material/Grid";
import TimeToPrimaryEndpoint from "./Feasibility";
import OutcomesTab from "./OutcomesTab";
import ScoutingTab from "./ScoutingTab";
import OncoSignalTab from "./OncoSignalTab";
import AnalyticsHeaderSkeleton from "./AnalyticsHeaderSkeleton";
import RiskTab from "./RiskTab";
import PopulationTab from "./PopulationTab";
import TreatmentTab from "./TreatmentTab";
import NewTreatment from "./NewTreatment";

export default function AnalyticsTabContainer({
  activeSubTab,
  loading,
  sessionKey,
  onSessionKeyChange,
  session_keys
}) {

  // if(!activeSubTab) return;
  const scrollRef = useRef(null);

  // Tabs that need state preservation — keep them mounted always
  // const PERSISTENT_TABS = ["Population", "Treatment", "Feasibility"];

  useEffect(() => { 
    // Reset scroll position when switching tabs
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    scrollRef.current?.focus();
  }, [activeSubTab])

  return (
    <div style={{ width: "100%" }}>
      {loading ? (
        <AnalyticsHeaderSkeleton />
      ) : (
        <div className="relative z-30 font-sans bg-mainBlue text-left">
          <div style={{ width: "100%" }} className="rounded-sm">
            <div
              ref={scrollRef}
              className="flex flex-col app-scroll"
              style={{
                overflowY: "auto",
                maxHeight: "calc(100vh - var(--trials-search-header-height, 0px) - 48px)",
                paddingBottom: 24,
                scrollbarWidth: "thin",
                outline: 'none'
              }}
            >
              <Grid container sx={{ m: 0, display: "grid", gap: "16px", padding: "0% 0.5%" }} />

              {/* ── Persistent tabs — always mounted, hidden when inactive ── */}
              {/* Population */}
              <div
                style={{
                  display: activeSubTab === "Population" ? "block" : "none",
                  // Prevents hidden tabs from consuming layout space or
                  // capturing scroll/keyboard events while invisible
                  visibility: activeSubTab === "Population" ? "visible" : "hidden",
                  height: activeSubTab === "Population" ? "auto" : 0,
                  overflow: activeSubTab === "Population" ? "visible" : "hidden",
                }}
              >
                <PopulationTab activeSubTab={activeSubTab} session_keys={session_keys} />
              </div>

              {/* Treatment */}
              <div
                style={{
                  display: activeSubTab === "Treatment" ? "block" : "none",
                  visibility: activeSubTab === "Treatment" ? "visible" : "hidden",
                  height: activeSubTab === "Treatment" ? "auto" : 0,
                  overflow: activeSubTab === "Treatment" ? "visible" : "hidden",
                }}
              >
                {/* <TreatmentTab
                  activeSubTab={activeSubTab}
                  sessionKey={sessionKey}
                  onSessionKeyChange={onSessionKeyChange}
                  session_keys={session_keys}
                /> */}
                <NewTreatment sessionKey={sessionKey} />
              </div>

              {/* Feasibility */}
              <div
                style={{
                  display: activeSubTab === "Feasibility" ? "block" : "none",
                  visibility: activeSubTab === "Feasibility" ? "visible" : "hidden",
                  height: activeSubTab === "Feasibility" ? "auto" : 0,
                  overflow: activeSubTab === "Feasibility" ? "visible" : "hidden",
                }}
              >
                <TimeToPrimaryEndpoint
                  activeSubTab = {activeSubTab}
                  sessionKey={sessionKey}
                  onSessionKeyChange={onSessionKeyChange}
                  session_keys={session_keys}
                />
              </div>

              {/* ── Non-persistent tabs — mount on demand (lightweight) ── */}
              {activeSubTab === "Outcomes"   && <OutcomesTab />}
              {activeSubTab === "Scouting"   && <ScoutingTab />}
              {activeSubTab === "Risks"      && <RiskTab />}
              {activeSubTab === "OncoSignal" && <OncoSignalTab />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
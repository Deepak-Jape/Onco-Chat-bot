import { Box } from "@mui/material";
import { useState, useEffect } from "react";

import RegulatoryHeaderSection from "./RegulatoryHeaderSection";
import DrugListPanel from "./DrugListPanel";
import DrugDetailPanel from "./DrugDetailPanel";


import drugList from "./data/drugs.json";
import drugDetails from "./data/drugDetails.json";
import guidelineList from "./Guideline/data/guideline.json";
import GuidelineListPanel from "./Guideline/GuidelineListPanel";
import GuidelineDetailPanel from "./Guideline/GuidelineDetailPanel";
import guidelineDetails from "./Guideline/data/guidelineDetail.json";


export default function RegulatoryDrugDetail() {
  const [activeTab, setActiveTab] = useState("DRUG");
  const [loading, setLoading] = useState(true);

  const [selectedDrugId, setSelectedDrugId] = useState(
    drugList.results[0].id
  );
  const [selectedGuidelineId, setSelectedGuidelineId] = useState(
    guidelineList.results[0].id
  );

  const selectedDrugDetail = drugDetails.find(
    (drug) => drug.id === selectedDrugId
  );

const selectedGuidelineDetail = guidelineDetails.find(
  (g) => g.id === selectedGuidelineId
);


  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
      }}
    >
      {/* HEADER */}
      <RegulatoryHeaderSection
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* BODY */}
      <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* LEFT PANEL */}
        <Box
          sx={{
            width: 328,
            borderRight: "1px solid rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {activeTab === "DRUG" ? (
            <DrugListPanel
              selectedId={selectedDrugId}
              onSelectDrug={setSelectedDrugId}
              loading={loading}
            />
          ) : (
            <GuidelineListPanel
              selectedId={selectedGuidelineId}
              onSelectGuideline={setSelectedGuidelineId}
              loading={loading}
            />
          )}
        </Box>

        {/* RIGHT PANEL */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: 3,
            py: 2,
            bgcolor: "#F9FAFB",
          }}
        >
          {activeTab === "DRUG" ? (
            <DrugDetailPanel
              drug={selectedDrugDetail}
              loading={loading}
            />
          ) : (
            <GuidelineDetailPanel
              guideline={selectedGuidelineDetail}
              loading={loading}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

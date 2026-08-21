import React, { useState } from "react";
import { Box, Button } from "@mui/material";
// Correcting component names to match imports (SitesLists and SitePlans)
import SitesLists from "./SitesLists";
import SitePlans from "./SitePlans";

const SiteIntelligenceContainer = ({ filters, counts, clearTrigger, cohorts }) => {
  // 1. Initialized state to "Find" to match the button labels
  const [activeTab, setActiveTab] = useState("Find");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="w-full z-20 fixed transition-all duration-500">
      <Box
        sx={{
          width: "100%",
          backgroundColor: "#DCE9FC",
          // overflowY: "scroll",
        }}
      >
        {/* Tabs Container - Find / Plan */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end", // Aligns buttons to the bottom of the header bar
            gap: "10px",
            px: "10px",
            width: "95%",
            height: "48px",
            backgroundColor: "rgba(220, 233, 252, 1)", // Header bar background
          }}
        >
          {["Find", "Plan"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                disableRipple
                disableElevation
                sx={{
                  height: "36px",
                  padding: "0 24px",
                  display: "flex",
                  alignItems: "center",
                  textTransform: "none",

                  // Tab Shape: Rounded only at the top
                  borderTopLeftRadius: "6px",
                  borderTopRightRadius: "6px",
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,

                  fontSize: "15px",
                  fontFamily: "Rubik",
                  fontWeight: 500,

                  // Colors based on active state
                  backgroundColor: isActive ? "#2666BE" : "transparent",
                  color: isActive ? "#FFFFFF" : "rgba(0, 0, 0, 0.6)",
                  border: "1px solid transparent",

                  transition: "all 0.2s ease",
                  // "&:hover": {
                  //   backgroundColor: isActive ? "#1e529a" : "rgba(0, 0, 0, 0.05)",
                  // },
                }}
              >
                {tab}
              </Button>
            );
          })}
        </Box>
      </Box>

      
        {/* 2. Changed check from "List" to "Find" to match the Tab label */}
        {activeTab === "Find" && (
          <SitesLists
            clearTrigger={clearTrigger}
            filters={filters}
            counts={counts}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            cohorts={cohorts}
          />
        )}

        {/* 3. Ensured "Plan" matches the second tab */}
        {activeTab === "Plan" && (
          <SitePlans cohorts={cohorts} />
        )}
    </div>
  );
};

export default SiteIntelligenceContainer;
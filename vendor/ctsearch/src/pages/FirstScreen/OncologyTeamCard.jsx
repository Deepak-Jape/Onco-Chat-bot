import React, { useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { teamCardsData } from "./teamCardsData";

const OncologyTeamCard = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = teamCardsData[activeIndex];

  const renderTextWithLinks = (text) => {
    const parts = text.split(/(CT\.gov)/g);

    return parts.map((part, index) => {
      if (part === "CT.gov") {
        return (
          <Box
            key={index}
            component="a"
            // href="https://clinicaltrials.gov"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "rgba(0, 0, 0, 0.6)",
              textDecoration: "underline",
              // cursor: "pointer",
              "&:hover": {
                color: "rgba(0, 0, 0, 0.6)",
              },
            }}
          >
            {part}
          </Box>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <Box sx={{ padding: { xs: "7% 4%", md: "4% 7%" }, background: "#fff" }}>
      {/* HEADER */}
      <Stack spacing={2} textAlign="center" sx={{ mb: { xs: 2, md: 6 } }}>
        <Typography
          variant="h3"
          fontSize={{ xs: 26, sm: 32, md: 42 }}
          fontWeight={600}
          fontFamily="Rubik"
          lineHeight="120%"
        >
          Built for High-Impact Oncology Teams
        </Typography>

        <Typography
          fontSize={{ xs: 16, sm: 18 }}
          color="rgba(0,0,0,0.6)"
          fontFamily="Rubik"
          fontWeight="400"
          lineHeight="24px"
          padding={{ xs: "0% 4%", sm: "0% 12%" }}
        >
Clinical development, operations, and strategy teams need different insights but require a single source of truth.
OncoSuite answers role-specific questions instantly, eliminating internal friction and keeping your 
entire asset team aligned on a unified data layer.
        </Typography>
      </Stack>

      {/* MOBILE SCROLLABLE HEADER */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          overflowX: "auto",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: "10px 10px 0 0",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {teamCardsData.map((item, index) => {
          const isActive = index === activeIndex;
          const isLast = index === teamCardsData.length - 1;

          return (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* TAB */}
              <Box
                onClick={() => setActiveIndex(index)}
                sx={{
                  px: 3,
                  py: 2,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  borderBottom: isActive
                    ? "3px solid rgba(38,102,190,1)"
                    : "3px solid transparent",
                  background: isActive ? "rgba(240,246,254,1)" : "#fff",
                  "&:hover": {
                    background: isActive ? "rgba(240,246,254,1)" : "rgba(240, 240, 243, 1)",
                  },
                }}
              >
                <Typography
                  fontSize={16}
                  fontWeight={isActive ? 500: 400}
                  color={isActive ? "rgba(38,102,190,1)" : "rgba(0,0,0,0.68)"}
                  fontFamily="Rubik"
                >
                  {item.id === 0 ? "R&D & Clinical Development" : item.title}
                </Typography>
              </Box>

              {/* VERTICAL DIVIDER */}
              {!isLast && (
                <Box
                  sx={{
                    width: "1px",
                    height: "58px",
                    backgroundColor: "rgba(0,0,0,0.12)",
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* MAIN CONTAINER */}
      <Box
        sx={{
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: { xs: "0 0 10px 10px", md: "10px" },
          background: "#fff",
          boxShadow: "0px 6px 18px rgba(16, 24, 40, 0.08)",
          overflow: "hidden",
          borderTop: { xs: 0, md: "1px solid rgba(0,0,0,0.08)" },
        }}
      >
        {/* TOP TABS – DESKTOP */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          {teamCardsData.map((item, index) => {
            const isActive = index === activeIndex;
            const isLast = index === teamCardsData.length - 1;

            const renderDesktopTabTitle = () => {
              if (item.id === 0) return "R&D & Clinical Development";
              if (item.title === "CRO & Startup Teams") {
                return (
                  <>
                    CRO &
                    <br />
                    Startup Teams
                  </>
                );
              }
              if (item.title === "Portfolio, Asset & BD") {
                return (
                  <>
                    Portfolio, Asset
                    <br />
                    & BD
                  </>
                );
              }
              if (item.title === "Medical Affairs & CI") {
                return (
                  <>
                    Medical Affairs
                    <br />
                    & CI
                  </>
                );
              }
              return item.title;
            };

            return (
              <Box
                key={item.id}
                sx={{ display: "flex", alignItems: "stretch", flex: 1 }}
              >
                <Box
                  onClick={() => setActiveIndex(index)}
                  sx={{
                    flex: 1,
                    px: 2,
                    py: 2,
                    cursor: "pointer",
                    borderBottom: isActive
                      ? "3px solid rgba(38,102,190,1)"
                      : "3px solid transparent",
                    background: isActive ? "rgba(240,246,254,1)" : "#fff",
                    "&:hover": {
                      background: isActive ? "rgba(240,246,254,1)" : "rgba(240, 240, 243, 1)",
                    },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    fontFamily="Rubik"
                    fontWeight={isActive ? 600 : 400}
                    textAlign="center"
                    lineHeight="130%"
                    letterSpacing="0px"
                    color={isActive ? "rgba(38,102,190,1)" : "rgba(0,0,0,0.5)"}
                    sx={{ fontSize: "20px" }}
                  >
                    {renderDesktopTabTitle()}
                  </Typography>
                </Box>
                {!isLast && (
                  <Box
                    sx={{
                      width: "1px",
                      background: "rgba(0,0,0,0.08)",
                      alignSelf: "stretch",
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        {/* CONTENT */}
        <Box sx={{ padding: { xs: "24px", md: "32px" }, textAlign: "left" }}>
          <Typography
            fontSize={{ xs: 20, md: 28 }}
            fontWeight={600}
            lineHeight="120%"
            color="rgba(0,0,0,0.8)"
            mb={2.5}
            fontFamily="Rubik"
          >
            {activeItem.right_title}
          </Typography>

          {activeItem.bullets.map((bullet, i) => (
            <Box
              key={i}
              sx={{ display: "flex", alignItems: "flex-start", gap: "10px", mb: 1.5 }}
            >
              {/* checkmark */}
              <Box sx={{ flexShrink: 0, mt: "5px" }}>
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1.5 7L6.5 12L16.5 2"
                    stroke="rgba(38,102,190,1)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Box>
              <Typography
                fontSize={{ xs: 15, md: 17 }}
                color="rgba(0,0,0,0.65)"
                lineHeight="28px"
                fontFamily="Rubik"
                fontWeight={400}
              >
                <strong style={{ color: "rgba(0,0,0,0.8)", fontWeight: 600 }}>
                  {(() => {
                    const title = String(bullet.title || "").trimEnd();
                    if (!title) return "";
                    return title.endsWith(":") ? title : `${title}:`;
                  })()}
                </strong>{" "}
                {renderTextWithLinks(bullet.text)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default OncologyTeamCard;

import React, { useState } from "react";
import { Box, Grid, Chip, Typography, Button, IconButton, Paper } from "@mui/material";
import Alert from "../../assets/icons/Alert.svg";
import Delete from "../../assets/Delete_ic.svg";
import arrowRightSvg from "../../assets/icons/arrow-right.svg";

// ----------------- Card Component ------------------
function SavedSearchCard({ item, index, selectedIndex, setSelectedIndex }) {
  return (
    <Paper
      onClick={() => setSelectedIndex(index)}   // ⭐ highlight on click
      elevation={0}
      sx={{
        width: 340,
        borderRadius: "6px",

        // ⭐ ONLY border changes on selection
        border:
          selectedIndex === index
            ? "2px solid rgba(28, 77, 142, 1)"
            : "2px solid transparent",

        p: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        backgroundColor: "#fff",
        boxShadow: "1px 8px 34px rgba(137,148,164,0.2)",
        cursor: "pointer",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <img src={Alert} alt="" />

        <Typography
          sx={{
            fontFamily: "Rubik",
            fontSize: "16px",
            fontWeight: 500,
            lineHeight: "22px",
            color: "rgba(0,0,0,0.8)",
          }}
        >
          {item.title}
        </Typography>
      </Box>

      {/* Last Run */}
      <Typography
        sx={{
          fontFamily: "Rubik",
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: "14px",
          color: "rgba(0,0,0,0.7)",
          textAlign: "left",
        }}
      >
        Last run: {item.lastRun}
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography
          sx={{
            fontFamily: "Rubik",
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: "16px",
            color: "rgba(0,0,0,0.7)",
            textAlign: "left",
          }}
        >
          Filters Applied:
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {item.filters.slice(0, 3).map((f, idx) => (
            <Chip
              key={idx}
              label={f}
              size="small"
              sx={{
                height: "20px",
                borderRadius: "4px",
                px: "6px",
                fontSize: "12px",
                fontWeight: 400,
                lineHeight: "16px",
                color: "rgba(0,0,0,0.6)",
                backgroundColor: "rgba(240,246,254,1)",
              }}
            />
          ))}

          {item.filters.length > 3 && (
            <Chip
              label={`+${item.filters.length - 3}`}
              size="small"
              sx={{
                height: "20px",
                borderRadius: "4px",
                fontSize: "12px",
                backgroundColor: "rgba(240,246,254,1)",
                border: "1px solid #D4E4F5",
                color: "rgba(47,128,237,1)",
              }}
            />
          )}
        </Box>
      </Box>

      {/* Matching Trials */}
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 500,
          color: "rgba(0,0,0,0.8)",
          textAlign: "left",
        }}
      >
        {item.matches}{" "}
        <Box component="span" sx={{ fontWeight: 400, color: "rgba(0,0,0,0.7)" }}>
          matching trials
        </Box>
      </Typography>

      {/* Footer */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <IconButton sx={{ width: 54, height: 54, borderRadius: "6px" }}>
          <img src={Delete} alt="" />
        </IconButton>

        <Button
          variant="outlined"
          sx={{
            width: "251px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
            borderRadius: "8px",
            border: "1px solid rgba(38,102,190,1)",
            color: "rgba(38,102,190,1)",
            px: "15px",
            py: "4px",
            "&:hover": {
              border: "1px solid rgba(28,77,142,1)",
              backgroundColor: "transparent",
            },
          }}
          endIcon={
            <img
              src={arrowRightSvg}
              alt="arrow"
              style={{
                width: "15px",
                height: "40px",
                display: "block",
                marginLeft: "4px",
              }}
            />
          }
        >
          Run Search
        </Button>
      </Box>
    </Paper>
  );
}

// ----------------- Main Page ------------------
export default function SavedSearches() {
  const [selectedIndex, setSelectedIndex] = useState(null); // ⭐ highlight state

  const savedSearches = [
    {
      title: "Heart Attack",
      lastRun: "3 days ago",
      filters: ["Phase II", "Not Yet Recruiting", "Functional/PRO", "Neoadjuvant", "Standard Care"],
      matches: 42,
    },
    {
      title: "Oncology Immunotherapy",
      lastRun: "3 days ago",
      filters: ["Phase II", "Not Yet Recruiting", "Functional/PRO", "Neoadjuvant"],
      matches: 42,
    },
    {
      title: "Alzheimer's Disease",
      lastRun: "3 days ago",
      filters: ["Phase II", "Not Yet Recruiting", "Standard Care", "Neoadjuvant"],
      matches: 42,
    },
  ];

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={4}>
        {savedSearches.map((item, i) => (
          <Grid key={i} item xs={12} sm={6} md={4}>
            <SavedSearchCard
              item={item}
              index={i}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

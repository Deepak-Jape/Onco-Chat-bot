import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const scarcityRows = [
  { s: "Adenocarcinoma", i: "60% of NSCLC", a: "0.9" },
  { s: "EGFR Mutation", i: "15% of Adeno (West)", a: "0.7" },
  { s: "Stage II", i: "10-15% of Diagnosis", a: "0.6" },
  { s: "2nd Line (2L)", i: "40-50% Attrition from 1L", a: "0.6" },
];

const siteRows = [
  { s: "Patient Access", v: "+0.05", positive: true },
  { s: "Lack of Competition", v: "-0.04", positive: false },
  { s: "Experience & Capability", v: "+0.06", positive: true },
  { s: "Site Type", v: "+0.02", positive: true },
];

export default function AdjustmentFactorCard() {
  const [activeTab, setActiveTab] = useState("scarcity"); // "scarcity" | "site"

  const isScarcity = activeTab === "scarcity";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: "8px",
        border: "1px solid #F0F0F3",
        backgroundColor: "#F9FAFB",
      }}
    >
      <Typography
        sx={{ fontWeight: 700, fontSize: "15px", mb: 1.5, color: "#333" }}
      >
        Total Adjustment Factor
      </Typography>
      <Typography
        sx={{ fontSize: "24px", fontWeight: 700, mb: 2.5, color: "#333" }}
      >
        0.48x
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        {/* Scarcity Button */}
        <Box sx={{ position: "relative" }}>
          <Button
            variant="outlined"
            onClick={() => setActiveTab("scarcity")}
            sx={{
              borderRadius: "20px",
              textTransform: "none",
              px: 2,
              py: 0.5,
              fontSize: "14px",
              fontWeight: 500,
              borderColor: isScarcity ? "#2666BE" : "#DCE9FC",
              color: isScarcity ? "#2666BE" : "#000000B2",
              backgroundColor: "#FFFFFF",
              "&:hover": {
                borderColor: isScarcity ? "#2666BE" : "#DCE9FC",
                backgroundColor: "#FFFFFF",
              },
            }}
          >
            <strong style={{ marginRight: 4 }}>0.23x</strong>
            <span style={{fontWeight: 400}}>
              Scarcity Factor Adjustment
            </span>
          </Button>
          {/* Arrow only shows under active tab */}
          {isScarcity && (
            <Box
              sx={{
                position: "absolute",
                // bottom: -10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid #2666BE",
              }}
            />
          )}
        </Box>

        {/* Site-based Button */}
        <Box sx={{ position: "relative" }}>
          <Button
            variant="outlined"
            onClick={() => setActiveTab("site")}
            sx={{
              borderRadius: "20px",
              textTransform: "none",
              px: 2,
              py: 0.5,
              fontSize: "14px",
              fontWeight: 500,
              borderColor: !isScarcity ? "#2666BE" : "#DCE9FC",
              color: !isScarcity ? "#2666BE" : "#000000B2",
              backgroundColor: "#FFFFFF",
              "&:hover": {
                borderColor: !isScarcity ? "#2666BE" : "#DCE9FC",
                backgroundColor: "#FFFFFF",
              },
            }}
          >
            <strong style={{ marginRight: 4 }}>2.08x</strong> 
                        <span style={{fontWeight: 400}}>
                          Site-based
            Adjustment Factor
                          </span>
          </Button>
          {!isScarcity && (
            <Box
              sx={{
                position: "absolute",
                // bottom: -10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid #2666BE",
              }}
            />
          )}
        </Box>
      </Box>

      <TableContainer
        sx={{ border: "1px solid #F0F0F3", borderRadius: "8px" }}
      >
        <Table size="small">
          {isScarcity ? (
            <>
              <TableHead sx={{ bgcolor: "#FFFFFF" }}>
                <TableRow>
                  <TableCell
                    sx={{
                      color: "#000000CC",
                      fontWeight: 600,
                      fontSize: "14px",
                      py: 1.5,
                    }}
                  >
                    Scarcity
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "#000000CC",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    Impact on Pool
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "#000000CC",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    Adjustment Factor
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scarcityRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell
                      sx={{ fontSize: "14px", py: 1.5, color: "#4F4F4F" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        {row.s}{" "}
                        <HelpOutlineIcon
                          sx={{ fontSize: 16, color: "#BDBDBD" }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: "14px", color: "#4F4F4F" }}>
                      {row.i}
                    </TableCell>
                    <TableCell sx={{ fontSize: "14px", color: "#4F4F4F" }}>
                      {row.a}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "#FFFFFF" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: "14px", py: 2 }}>
                    Scarcity Adjustment Factor
                  </TableCell>
                  <TableCell />
                  <TableCell sx={{ fontWeight: 700, fontSize: "14px" }}>
                    0.23x
                  </TableCell>
                </TableRow>
              </TableBody>
            </>
          ) : (
            <>
              <TableHead sx={{ bgcolor: "#FFFFFF" }}>
                <TableRow>
                  <TableCell
                    sx={{
                      color: "#000000CC",
                      fontWeight: 600,
                      fontSize: "14px",
                      py: 1.5,
                    }}
                  >
                    Adjustment
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "#000000CC",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    Pts / Site / Month
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {siteRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell
                      sx={{ fontSize: "14px", py: 1.5, color: "#4F4F4F" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        {row.s}{" "}
                        <HelpOutlineIcon
                          sx={{ fontSize: 16, color: "#BDBDBD" }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: row.positive ? "#1F8B4D" : "#C14646",
                      }}
                    >
                      {row.v}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "#FFFFFF" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: "14px", py: 2 }}>
                    Total Site-Based Adjustment (Additive)
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: "14px", color: "#1F8B4D" }}
                  >
                    +0.09
                  </TableCell>
                </TableRow>
              </TableBody>
            </>
          )}
        </Table>
      </TableContainer>
    </Paper>
  );
}
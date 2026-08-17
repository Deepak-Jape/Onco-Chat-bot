import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  InputBase,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Checkbox,
  TableBody,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ScoreIndicator from "./ScoreIndicator";
import checkSmallIcon from "../../../assets/icons/check_small.svg";
import CohortFilter from "./CohortFilter";
import AdjustmentFactorCard from "./AdjustmentFactorCard";

// --- Sub-component: Score Ring Indicator (Matching image_d64a9b) ---
const ScoreRing = ({ score, size }) => (
  <ScoreIndicator size={size} score={score} showText={false} />
);

const commonButtonStyles = {
  textTransform: "none",
  height: "28px",
  px: "12px",
  justifyContent: "center",
  borderRadius: "6px",
  fontFamily: "Rubik",
  fontWeight: 400,
  letterSpacing: 0,
  boxShadow: "1px 4px 24px 0px #99A9BE33",

  "&:hover": {
    boxShadow: "0px 2px 12px rgba(153, 169, 190, 0.2)",
  },
};

const buttonVariants = {
  notShortlisted: {
    minWidth: "123px",
    border: "1px solid #0000001A",
    backgroundColor: "#FFFFFF",
    color: "#000000CC",
    fontSize: "14px",
    lineHeight: "20px",
  },

  shortlisted: {
    minWidth: "100px",
    border: "1px solid #B6E3C9",
    backgroundColor: "#DAF1E4",
    color: "#1F8B4D",
    fontSize: "12px",
    lineHeight: "18px",
  },
};


const CohortOverview = ({ cohorts = [] }) => {
  const [selectedCohort, setSelectedCohort] = useState("");
  const [cohortsNameList, setCohortsNameList] = useState(cohorts.cohorts)
  console.log("CohortOverview cohortsList", cohorts)
  console.log("CohortOverview cohortsList", cohorts.cohorts)
  const cohortsList = [
    {
      id: 1,
      name: "Breast Cancer, HER2+, 2L",
      score: 88,
      speed: "0.47 patients per month",
      access: "450 patients/year",
      status: "Shortlisted",
      color: "#27AE60",
    },
    {
      id: 2,
      name: "Breast Cancer, HER2+, 1L",
      score: 82,
      speed: "0.52 patients per month",
      access: "780 patients/year",
      status: "Shortlisted",
      color: "#27AE60",
    },
    {
      id: 3,
      name: "Breast Cancer, TNBC, 2L",
      score: 76,
      speed: "0.38 patients per month",
      access: "320 patients/year",
      status: "Not shortlisted",
      color: "#A6722E",
    },
    {
      id: 4,
      name: "Breast Cancer, HR+, 3L+",
      score: 71,
      speed: "0.31 patients per month",
      access: "210 patients/year",
      status: "Not shortlisted",
      color: "#A6722E",
    },
  ];

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography
        sx={{
          fontFamily: "Rubik",
          fontWeight: 500,
          fontSize: "24px",
          mb: 2,
          color: "rgba(0,0,0,0.8)",
        }}
      >
        Cohort Overview
      </Typography>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #E0E0E0", borderRadius: "12px" }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#F9FAFB" }}>
            <TableRow>
              <TableCell sx={{ color: "#4F4F4F", fontWeight: 600 }}>
                Cohort
              </TableCell>
              <TableCell sx={{ color: "#4F4F4F", fontWeight: 600 }}>
                Overall Score
              </TableCell>
              <TableCell sx={{ color: "#4F4F4F", fontWeight: 600 }}>
                Enrollment Speed
              </TableCell>
              <TableCell sx={{ color: "#4F4F4F", fontWeight: 600 }}>
                Patient Access
              </TableCell>
              <TableCell align="right">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    // justifyContent: "flex-end",
                    gap: 0.5,
                  }}
                >
                  <Checkbox size="small" sx={{ p: 0 }} />
                  <Typography
                    sx={{ fontSize: "14px", fontWeight: 600, color: "#4F4F4F" }}
                  >
                    Shortlist All
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cohortsList.map((row) => (
              <TableRow
                key={row.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell sx={{ color: "#666", fontSize: "15px" }}>
                  {row.name}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <ScoreRing score={row.score} color={row.color} />
                    <Typography
                      sx={{ fontWeight: 700, fontSize: "14px", color: "#333" }}
                    >
                      {row.score}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: "#666" }}>{row.speed}</TableCell>
                <TableCell sx={{ color: "#666" }}>{row.access}</TableCell>
                <TableCell align="right">
                  <Button
                    variant={row.status === "Shortlisted" ? "outlined" : "text"}
                    sx={{
                      textTransform: "none",
                      borderRadius: "4px",
                      fontSize: "13px",
                      width: "stretch",
                      px: 2,
                      py: 0.5,
                      border:
                        row.status === "Shortlisted"
                          ? "1px solid #B6E3C9"
                          : "1px solid #E0E0E0",
                      color:
                        row.status === "Shortlisted" ? "#1F8B4D" : "#828282",
                      bgcolor:
                        row.status === "Shortlisted"
                          ? "#DAF1E4"
                          : "transparent",
                      "&:hover": {
                        bgcolor:
                          row.status === "Shortlisted" ? "#B6E3C9" : "#F5F5F5",
                      },
                    }}
                  >
                    {row.status === "Shortlisted" && (
                      <span style={{ marginRight: "6px" }}>
                        <img
                          className="scorecard__iconImg"
                          src={checkSmallIcon}
                          alt=""
                          aria-hidden="true"
                        />
                      </span>
                    )}
                    {row.status}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bottom Dropdown Selector */}
      <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1, width: 380 }}>
        <Typography sx={{ color: "#4F4F4F", fontSize: "18px", width: 170 }}>
          View cohort:
        </Typography>
        <CohortFilter open={true} cohorts={cohorts} />
        {/* <Select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            size="small"
            displayEmpty
            sx={{
              minWidth: 200,
              borderRadius: "8px",
              bgcolor: "#FFF",
              "& .MuiSelect-select": {
                py: "8px",
                color: "#828282",
              },
            }}
          >
            <MenuItem value="" disabled>
              Select Cohort
            </MenuItem>

            {cohorts?.cohorts?.map((cohort) => (
              <MenuItem
                key={cohort.cohort_id}
                value={cohort.cohort_id}
              >
                {cohort.cohort_name}
              </MenuItem>
            ))}
          </Select> */}
      </Box>
    </Box>
  );
};
const IntelligenceCard = ({
  title,
  score,
  color,
  details = [],
  children,
  gap = "8px",
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      elevation={0}
      sx={{
        border: "1px solid rgba(0, 0, 0, 0.05)",
        borderRadius: "8px !important",
        boxShadow: "1px 8px 34px 0px #99A9BE1A",
        mb: 2,
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<KeyboardArrowDownIcon sx={{ fontSize: 28 }} />}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: "Rubik",
              fontWeight: 500,
              fontSize: "23px",
              color: "rgba(0,0,0,0.8)",
              mb: 1,
            }}
          >
            {title}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap }}>
            {score && <ScoreRing score={score} color={color} size={20} />}

            <Typography
              sx={{
                fontFamily: "Rubik",
                fontWeight: 500,
                fontSize: "14px",
                color: "rgba(0,0,0,0.6)",
              }}
            >
              {score}
              {title.includes("Trust") ? "%" : ""}
            </Typography>

            {details.map((item, index) => (
              <React.Fragment key={index}>
                <Typography
                  sx={{
                    color: "#0000004D",
                    fontSize: "18px",
                    lineHeight: 1,
                    fontFamily: "inter",
                    mx: "8px"
                  }}
                >
                  •
                </Typography>

                <Typography
                  sx={{
                    fontFamily: "Rubik",
                    fontSize: "14px",
                    color: "rgba(0,0,0,0.6)",
                  }}
                >
                  {item}
                </Typography>
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

// --- Sub-component: Experience Table ---
const ExperienceContent = () => (
  <Box>
    <TableContainer
      component={Box}
      sx={{ border: "1px solid #F0F0F3", borderRadius: "8px", mb: 3 }}
    >
      <Table size="small">
        <TableHead sx={{ bgcolor: "#F9F9FB" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Patient segment</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Completed trials</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>latest trial date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Planned patients</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            {
              segment: "Breast cancer",
              trials: "14",
              date: "2025",
              pts: "1,500",
            },
            { segment: "+ HER2+", trials: "4", date: "2024", pts: "590" },
            { segment: "+ 2L", trials: "2", date: "2024", pts: "120" },
          ].map((row, i) => (
            <TableRow key={i}>
              <TableCell sx={{ color: "#666" }}>{row.segment}</TableCell>
              <TableCell sx={{ color: "#2666BE", fontWeight: 700 }}>
                {row.trials}
              </TableCell>
              <TableCell sx={{ color: "#666" }}>{row.date}</TableCell>
              <TableCell sx={{ color: "#666" }}>{row.pts}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        background: "#F9F9FB",
        padding: "16px",
        borderRadius: "4px",
        border: "1px solid #F0F0F3",
      }}
    >
      <Typography sx={{ fontWeight: 600, mb: 0 }}>
        Testing & Operational Capabilities
      </Typography>
      <Typography> 

      {[
        "Multi Cohort Trials",
        "HER2 Testing",
        "Genomic Sequencing",
        "PET/CT Imaging",
        "Flow Cytometry",
        "Biomarker Screening",
        "Biobank Access",
        "Immunotherapy Lab",
        "NGS Testing",
      ].map((tag) => (
        <Chip
          key={tag}
          label={tag}
          variant="outlined"
          sx={{
            borderRadius: "50px",
            color: "#00000099",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--Info-200, #DCE9FC)",
            gap: 1,
            margin: "12px 12px 0 0",
          }}
        />
      ))}
      </Typography>
    </Box>
  </Box>
);

// --- Sub-component: Patient Access Funnel ---
const PatientAccessContent = () => (

  <Box sx={{ position: "relative", width: "100%", p: "16px", borderRadius: "4px", background: "#F9F9FB",
            border: "1px solid #F0F0F3",
   }}>
    {[
      { label: "Patient within 100km", val: "8.2M", width: "95%", sub: "", color: "#2C5F6E" },
      {
        label: "Breast cancer",
        val: "12,500",
        width: "80%",
        sub: "0.15%",
        color: "#607D8B"
      },
      {
        label: "NSCLC",
        val: "2,700",
        width: "65%",
        sub: "21.6%",
        color: "#913434"
      },
      {
        label: "HER2+",
        val: "900",
        width: "50%",
        sub: "0.9%",
        color: "#C14646"
      },
      { label: "Cancer stage", val: "450", width: "35%", sub: "16.7%", color: "#914D0A" },
      {
        label: "Line of therapy", val: "225", width: "20%", sub: "50%", color: "#C1660D"
      }
    ].map((item, i) => (
      <Box key={i} sx={{ position: "relative", mb: "12px" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* The Blue Progress Bar */}
          <Box
            sx={{
              bgcolor: item.color,
              color: "#FFF",
              p: "10px 16px",
              borderRadius: "8px",
              width: item.width,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Typography
              sx={{ fontSize: "14px", fontFamily: 'Rubik', fontWeight: 400 }}
            >
              {item.label}
            </Typography>
            <Typography sx={{ fontWeight: 500, fontSize: "16px", fontFamily: 'Rubik' }}>
              {item.val}
            </Typography>
          </Box>

          {/* The percentage sub-text */}
          <Typography
            sx={{ fontSize: "16px", color: "#00000099", minWidth: "45px",  fontFamily: 'Rubik' }}
          >
            {item.sub || ""}
          </Typography>
        </Box>

        {/* Curved Connector Arrows */}
        {i < 5 && (
          <Box
            sx={{
              position: "absolute",
              right: `calc(100% - ${item.width} - 40px)`,
              top: "50px",
              width: "115px",
              // height: "30px",
              zIndex: 0,
              opacity: 0.4,
            }}
          >
            <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M38.9719 0.00506774C38.6988 -0.0348468 38.4439 0.154597 38.4047 0.42755C38.3855 0.560803 36.327 13.8552 25.9296 21.566C19.7627 26.1393 11.9159 27.8594 2.59788 26.7017L4.28959 25.8696C4.53684 25.7473 4.63945 25.4486 4.51751 25.1998C4.39619 24.952 4.09611 24.8497 3.84842 24.9717L0.000335127 26.8648L3.16581 29.828C3.36684 30.0168 3.68355 30.0063 3.87218 29.8046C3.89897 29.7762 3.92143 29.7453 3.94043 29.7124C4.05393 29.5158 4.02159 29.2598 3.84897 29.0978L2.32805 27.6741C11.9733 28.9011 20.1122 27.1251 26.5254 22.369C30.2339 19.6188 32.9127 16.1829 34.833 12.8569C38.4675 6.56178 39.3807 0.661984 39.394 0.572055C39.4341 0.299602 39.2452 0.0456649 38.9719 0.00506774Z" fill="#B8D4F9" />
            </svg>
          </Box>
        )}
      </Box>
    ))}

    {/* Footer Summary Box */}
    <Paper
      variant="outlined"
      sx={{
        p: "16px 20px",
        mt: 4,
        display: "flex",
        justifyContent: "space-between",
        borderRadius: "8px",
        borderColor: "#DCE9FC",
        bgcolor: "#FFF",
      }}
    >
      <Typography sx={{ fontWeight: 700, color: "#000000CC", fontSize: "16px" }}>
        Estimated new cases per year within 100km
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: "16px", color: "#000000CC" }}>
        225
      </Typography>
    </Paper>
  </Box>
);
// --- Custom Box & Whisker Plot Component ---
const BoxWhiskerPlot = ({
  min = 0,
  max = 0.4,
  q1 = 0.11,
  median = 0.192,
  q3 = 0.22,
}) => {
  const scale = (val) => (val / max) * 100;
  return (
    <Box sx={{ width: "100%", position: "relative", pt: 4, pb: 4, px: 1 }}>
      {/* Main Horizontal Axis */}
      <Box
        sx={{
          position: "absolute",
          top: "24px",
          left: "0%",
          right: "0%",
          height: "1.5px",
          bgcolor: "#2666BE",
        }}
      />

      {/* End Caps (Ticks) */}
      <Box
        sx={{
          position: "absolute",
          top: "20px",
          left: "0%",
          width: "1.5px",
          height: "10px",
          bgcolor: "#2666BE",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "20px",
          left: "100%",
          width: "1.5px",
          height: "10px",
          bgcolor: "#2666BE",
        }}
      />

      {/* The Blue Box (Q1 to Q3) */}
      <Box
        sx={{
          position: "absolute",
          top: "15px",
          left: `${scale(q1)}%`,
          width: `${scale(q3 - q1)}%`,
          height: "20px",
          bgcolor: "#EAF2FD",
          border: "1.6px solid #2666BE",
          zIndex: 1,
        }}
      />

      {/* Median Line */}
      <Box
        sx={{
          position: "absolute",
          top: "16px",
          left: `${scale(median)}%`,
          width: "2px",
          height: "18px",
          bgcolor: "#2666BE",
          zIndex: 2,
        }}
      />

      {/* Labels under the axis */}
      {[0, 0.1, 0.2, 0.3, 0.4].map((val) => (
        <Typography
          key={val}
          sx={{
            position: "absolute",
            top: "40px",
            left: `${scale(val)}%`,
            transform: "translateX(-50%)",
            fontSize: "13px",
            color: "#4F4F4F",
          }}
        >
          {val}
        </Typography>
      ))}
    </Box>
  );
};

const EnrollmentSpeedContent = () => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
    {/* Benchmark Section */}
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
        sx={{ fontWeight: 700, fontSize: "16px", mb: 2, color: "#333", letterSpacing: "0%" }}
      >
        Benchmark
      </Typography>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 2 }}>
        <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#333" }}>
          0.38
        </Typography>
        <Typography sx={{ fontSize: "13px", color: "#828282" }}>
          pts/site/month
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, background: "#F9FAFB" }}>
        <Chip
          label="HER2+ Breast Cancer"
          variant="outlined"
          sx={{
            borderRadius: "44px",
            height: "32px",
            color: "#828282",
            borderColor: "#DCE9FC",
            background: '#FFFFFF'
          }}
        />
        <Chip
          label="United States"
          variant="outlined"
          sx={{
            borderRadius: "44px",
            height: "32px",
            color: "#828282",
            borderColor: "#DCE9FC",
            background: '#FFFFFF'
          }}
        />
        <Typography
          sx={{
            color: "#2666BE",
            fontSize: "13px",
            fontWeight: 600,
            ml: 1,
            cursor: "pointer",
          }}
        >
          Based on 31 comparable trials
        </Typography>
      </Box>
    </Paper>

    {/* Adjustment Factor Section */}
    <AdjustmentFactorCard/>
    {/* <Paper
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

      <Box sx={{ display: "flex", gap: 2, mb: 3, position: "relative" }}>
        <Box sx={{ position: "relative" }}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: "20px",
              textTransform: "none",
              px: 2,
              py: 0.5,
              borderColor: "#2666BE",
              color: "#2666BE",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            0.23x Scarcity Factor Adjustment
          </Button>
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
        </Box>
        <Button
          variant="text"
          sx={{
            borderRadius: "20px",
            border: "1px solid",
            textTransform: "none",
            color: "#828282",
            background: "#FFFFFF",
            fontSize: "14px",
            borderColor: "#DCE9FC"
          }}
        >
          <strong style={{ color: "#000000CC" }}>2.08x&nbsp;</strong>
          Site-based Adjustment Factor
        </Button>
      </Box>

      <TableContainer sx={{ border: "1px solid #F0F0F3", borderRadius: "8px" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#FFFFFF" }}>
            <TableRow>
              <TableCell
                sx={{
                  color: "#4F4F4F",
                  fontWeight: 700,
                  fontSize: "15px",
                  py: 1.5,
                }}
              >
                Scarcity
              </TableCell>
              <TableCell
                sx={{ color: "#4F4F4F", fontWeight: 600, fontSize: "12px" }}
              >
                Impact on Pool
              </TableCell>
              <TableCell
                sx={{ color: "#4F4F4F", fontWeight: 600, fontSize: "12px" }}
              >
                Adjustment Factor
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              { s: "Adenocarcinoma", i: "60% of NSCLC", a: "0.9" },
              { s: "EGFR Mutation", i: "15% of Adeno (West)", a: "0.7" },
              { s: "Stage II", i: "10-15% of Diagnosis", a: "0.6" },
              { s: "2nd Line (2L)", i: "40-50% Attrition from 1L", a: "0.6" },
            ].map((row, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ fontSize: "14px", py: 1.5, color: "#4F4F4F" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {row.s}{" "}
                    <HelpOutlineIcon sx={{ fontSize: 16, color: "#BDBDBD" }} />
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
        </Table>
      </TableContainer>
    </Paper> */}

    {/* Estimated Speed Plot Section */}
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: "8px",
        border: "1px solid #F0F0F3",
        backgroundColor: "#F9FAFB",
      }}
    >
      <Typography
        sx={{ fontWeight: 700, fontSize: "15px", mb: 2, color: "#333" }}
      >
        Estimated Enrollment Speed for This Site
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 4,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
            <Typography
              sx={{ fontSize: "22px", fontWeight: 700, color: "#333" }}
            >
              0.18
            </Typography>
            <Typography sx={{ fontSize: "14px", color: "#828282" }}>
              patients per month (median)
            </Typography>
          </Box>
          <BoxWhiskerPlot />
        </Box>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: "12px",
            borderColor: "#EAF2FD",
            minWidth: "220px",
          }}
        >
          <Box
            sx={{ display: "flex", justifyContent: "flex-start", mb: 1.5, gap: '4px' }}
          >
            <Typography
              sx={{ fontSize: "15px", fontWeight: 700, color: "#333" }}
            >
              0.12
            </Typography>
            <Typography sx={{ fontSize: "14px", color: "#828282" }}>
              25th percentile
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-start", gap: '4px' }}>
            <Typography
              sx={{ fontSize: "15px", fontWeight: 700, color: "#333" }}
            >
              0.21
            </Typography>
            <Typography sx={{ fontSize: "14px", color: "#828282" }}>
              75th percentile
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Paper>
  </Box>
);
const SiteDetailView = ({
  siteName = "Memorial Sloan Kettering Cancer Center",
  cohorts
}) => {
  const isShortlisted = false;
  return (
    <Box
      sx={{
        bgcolor: "#FFF",
        borderRadius: "8px",
        boxShadow: "0px 0px 20px 1px rgba(0,0,0,0.05)",
        p: "24px",
      }}
    >
      {/* HEADER SECTION */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: "Rubik",
              fontWeight: 500,
              fontSize: "28px",
              lineHeight: "36px",
              color: "rgba(0,0,0,0.9)",
              mb: 1.5,
            }}
          >
            {siteName}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ScoreRing size={24} score={89} />
              <Typography
                sx={{
                  fontFamily: "Rubik",
                  fontWeight: 500,
                  fontSize: "16px",
                  color: "rgba(0,0,0,0.6)",
                }}
              >
                89
              </Typography>
            </Box>

            <Typography sx={{ color: "rgba(0,0,0,0.3)" }}>•</Typography>
            <Typography
              sx={{
                fontFamily: "Rubik",
                fontSize: "16px",
                color: "rgba(0,0,0,0.6)",
              }}
            >
              New York, NY, United States
            </Typography>

            <Typography sx={{ color: "rgba(0,0,0,0.3)" }}>•</Typography>
            <Box
              sx={{
                border: "1px solid #DCE9FC",
                borderRadius: "44px",
                px: "12px",
                py: "2px",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Rubik",
                  fontSize: "14px",
                  color: "rgba(0,0,0,0.6)",
                }}
              >
                Academic Medical Center
              </Typography>
            </Box>

            <Typography sx={{ color: "rgba(0,0,0,0.3)" }}>•</Typography>
            <Typography
              sx={{
                fontFamily: "Rubik",
                fontSize: "16px",
                color: "#2666BE",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              mskcc.org <OpenInNewIcon sx={{ fontSize: 14 }} />
            </Typography>
          </Box>
        </Box>

        {/* <Button
          variant="outlined"
          startIcon={<BookmarkBorderIcon />}
          sx={{
            textTransform: "none",
            border: "1px solid #0A0A0A",
            borderRadius: "8px",
            px: 2,
            height: "36px",
            color: "#0A0A0A",
            fontWeight: 500,
            fontFamily: "Rubik",
            fontStyle: "Medium",
            fontSize: "14px",
            lineHeight: "20px",
            textAlign: "center",
            letterSpacing: "-0.15px",
          }}
        >
          Add to Shortlist
        </Button> */}
        <Button
          sx={{
            ...commonButtonStyles,
            ...(isShortlisted
              ? buttonVariants.shortlisted
              : buttonVariants.notShortlisted),
          }}
        >
          {isShortlisted && (
            <img
              src={checkSmallIcon}
              alt=""
              style={{ marginRight: 4 }}
            />
          )}
          {isShortlisted ? "Shortlisted" : "Not shortlisted"}
        </Button>
      </Box>
      {/* COHORT OVERVIEW SECTION */}
      {cohorts.length > 1 &&
        (
          <>
            <CohortOverview cohorts={cohorts} />
            {/* <hr
              style={{
                border: "none",
                borderTop: "1px solid #EEE",
                margin: "40px 0",
              }}
            /> */}
          </>
        )
      }


      {/* INTELLIGENCE CARDS SECTION */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <IntelligenceCard
          title="Experience & Capability"
          score="88"
          color="#27AE60"
          details={["12 exact match", "34 similar","11 years active"]}
          gap="4px"
        >
          <ExperienceContent />
        </IntelligenceCard>

        <IntelligenceCard
          title="Patient Access"
          score="88"
          color="#27AE60"
          details={["225 eligible patients/year", "8.2M population","100km catchment"]}
          gap="4px"
        >
          <PatientAccessContent />
        </IntelligenceCard>

        <IntelligenceCard
          title="Trial Congestion"
          score="72"
          color="#F18010"
          details=" • "
          details={["20 active trials", "2,223 total patients targeted"]}
          gap="4px"
        >
          {/* Data from image_e55962 */}
          <TableContainer
            sx={{ 
              border: "1px solid #F0F0F3", 
              borderRadius: "8px",
              overflow: "hidden" 
            }}
          >
            <Table 
              size="small" 
              sx={{ 
                borderCollapse: "collapse",
                // Remove default cell borders and add only inner gridlines
                "& .MuiTableCell-root": {
                  borderRight: "1px solid #F0F0F3",
                  borderBottom: "1px solid #F0F0F3",
                },
                // Remove rightmost borders so they don't fight with the container right wall
                "& tr > *:last-child": {
                  borderRight: "none",
                },
                // Remove bottommost borders so they don't fight with the container bottom wall
                "& tbody tr:last-child td": {
                  borderBottom: "none",
                }
              }}
            >
              <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                {/* Row 1: Segment + Group titles */}
                <TableRow>
                  <TableCell
                    rowSpan={2}
                    sx={{
                      fontWeight: 600,
                      verticalAlign: "center",
                    }}
                  >
                    Patient segment
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    align="center"
                    sx={{ fontWeight: 600 }}
                  >
                    Active Trials
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    align="center"
                    sx={{ fontWeight: 600 }}
                  >
                    Planned Patients
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    align="center"
                    sx={{ fontWeight: 600 }}
                  >
                    Annual Patient Share
                  </TableCell>
                </TableRow>

                {/* Row 2: Sub-columns */}
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600 }}
                  >
                    At Site
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600 }}
                  >
                    Catchment
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600 }}
                  >
                    At Site
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600 }}
                  >
                    Catchment
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600 }}
                  >
                    At Site
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600 }}
                  >
                    Catchment
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {[
                  {
                    s: "Breast cancer",
                    atSite: "3",
                    catchment: "12",
                    pAtSite: "350",
                    pCatchment: "1,980",
                    vAtSite: "12%",
                    vCatchment: "32%",
                  },
                  {
                    s: "+ HER2+",
                    atSite: "2",
                    catchment: "6",
                    pAtSite: "200",
                    pCatchment: "690",
                    vAtSite: "2%",
                    vCatchment: "12%",
                  },
                  {
                    s: "+ 2L",
                    atSite: "-",
                    catchment: "2",
                    pAtSite: "-",
                    pCatchment: "110",
                    vAtSite: "-",
                    vCatchment: "5%",
                  },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ color: "#00000099" }}>
                      {row.s}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: "#2666BE",
                        fontWeight: 700,
                      }}
                    >
                      {row.atSite}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: "#2666BE",
                        fontWeight: 700,
                      }}
                    >
                      {row.catchment}
                    </TableCell>
                    <TableCell align="center" sx={{ color: "#00000099" }}>{row.pAtSite}</TableCell>
                    <TableCell align="center" sx={{ color: "#00000099" }}>{row.pCatchment}</TableCell>
                    <TableCell align="center" sx={{ color: "#00000099" }}>{row.vAtSite}</TableCell>
                    <TableCell align="center" sx={{ color: "#00000099" }}>{row.vCatchment}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </IntelligenceCard>
        <IntelligenceCard
          title="Enrollment Speed"
          score="34"
          details={["0.17 patients per month", "Benchmark: 0.38","Confidence: Medium"]}
          color="#F15757"
          gap="4px"
        >
          <EnrollmentSpeedContent />
        </IntelligenceCard>
        <IntelligenceCard
          title="Sponsor Trust"
          score="92"
          color="#27AE60"
          details={["61% repeat sponsor rate"]}
          gap="4px"
        >
          {/* Table Container with Custom Scrollbar */}
          <TableContainer
            sx={{
              border: "1px solid #F0F0F3",
              borderRadius: "8px",
              mb: 3,
              maxHeight: "320px", // Matches Figma scroll height
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#E0E0E0",
                borderRadius: "10px",
              },
            }}
          >
            <Table size="small" stickyHeader
              sx={{
                "& tbody": {
                  display: "block",
                  maxHeight: 260,
                  overflowY: "auto",
                },
                "& thead, & tbody tr": {
                  display: "table",
                  width: "100%",
                  tableLayout: "fixed",
                },
              }}>
              <TableHead>
                <TableRow>
                  {[
                    "Repeat Sponsor",
                    "Number of Trials",
                    "Most Recent Trial",
                    "Therapeutic Area",
                  ].map((head) => (
                    <TableCell
                      key={head}
                      sx={{
                        bgcolor: "#F9FAFB",
                        fontWeight: 500,
                        color: "#000000CC",
                        fontSize: "14px",
                        borderBottom: "1px solid #F0F0F3",
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody 
              className="app-scroll"
              >
                {[
                  {
                    n: "Roche",
                    t: "4",
                    d: "2024",
                    a: "Breast Cancer, HER2+, 2L",
                  },
                  { n: "Pfizer", t: "3", d: "2023", a: "NSCLC, EGFR+, 1L" },
                  {
                    n: "AstraZeneca",
                    t: "2",
                    d: "2024",
                    a: "Ovarian Cancer, BRCA1/2, 3L",
                  },
                  {
                    n: "Novartis",
                    t: "2",
                    d: "2022",
                    a: "Melanoma, BRAF V600E, 1L",
                    hasBadge: true,
                  },
                  {
                    n: "Roche",
                    t: "4",
                    d: "2024",
                    a: "Breast Cancer, HER2+, 2L",
                  },
                  { n: "Pfizer", t: "3", d: "2023", a: "NSCLC, EGFR+, 1L" },
                  {
                    n: "AstraZeneca",
                    t: "2",
                    d: "2024",
                    a: "Ovarian Cancer, BRCA1/2, 3L",
                  },
                ].map((row, i) => (
                  <TableRow
                    key={i}
                    sx={{
                      "& td": { 
                        // py: 1.5,
                        fontSize: "13px", color: "#666" },
                    }}
                  >
                    <TableCell sx={{ position: "relative" }}>
                      <Typography
                        sx={{
                          color: "#2666BE",
                          fontWeight: 500,
                          fontSize: "14px",
                        }}
                      >
                        {row.n}
                      </Typography>
                    </TableCell>

                    <TableCell>{row.t}</TableCell>
                    <TableCell>{row.d}</TableCell>
                    <TableCell>{row.a}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Collaboration Summary Footer */}
          <Box
            sx={{
              bgcolor: "#F9FAFB",
              p: "20px 24px",
              borderRadius: "8px",
              border: "1px solid #F0F0F3",
            }}
          >
            <Typography
              sx={{ fontWeight: 700, fontSize: "16px", color: "#333", mb: 2 }}
            >
              Collaboration Summary
            </Typography>
            <Box sx={{ display: "flex", gap: 6 }}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: "21px" }}>
                  18
                </Typography>
                <Typography sx={{ fontSize: "14px", color: "#000000CC" }}>
                  Total trials conducted
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: "21px" }}>
                  11
                </Typography>
                <Typography sx={{ fontSize: "14px", color: "#000000CC" }}>
                  Trials with repeat sponsors
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: "21px" }}>
                  61%
                </Typography>
                <Typography sx={{ fontSize: "14px", color: "#000000CC" }}>
                  Repeat sponsor rate
                </Typography>
              </Box>
            </Box>
          </Box>
        </IntelligenceCard>

        <IntelligenceCard
          title="Lead Researchers"
          score="52%"
          color="#F18010"
          details={["Criteria: Breast Cancer, HER2+, 2L, Phase 2"]}
          gap="4px"
        >
          <TableContainer
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              bgcolor: "#FFF",
            }}
          >
            <Table size="small">
              <TableHead
                sx={{
                  bgcolor: "#F9FAFB",
                  color: "#000000CC",
                  fontWeight: 500,
                  fontSize: "14px",
                  py: 2,
                }}>
                <TableRow >
                  <TableCell>
                    #
                  </TableCell>
                  <TableCell>
                    Researcher Name
                  </TableCell>
                  <TableCell>
                    Relevance Score
                  </TableCell>
                  <TableCell>
                    Breast Cancer
                  </TableCell>
                  <TableCell>
                    HER2+
                  </TableCell>
                  <TableCell>
                    2L
                  </TableCell>
                  <TableCell>
                    Phase 2
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  {
                    name: "Dr. Jane Smith",
                    role: "Director, Breast Cancer Medicine",
                    rel: "19",
                    bc: "6",
                    h: "5",
                    l: "4",
                    p: "4",
                    hasBadge: true,
                  },
                  {
                    name: "Theresa Webb",
                    role: "Associate Attending Physician",
                    rel: "17",
                    bc: "5",
                    h: "4",
                    l: "4",
                    p: "4",
                  },
                  {
                    name: "Ralph Edwards",
                    role: "Director, Breast Cancer Medicine",
                    rel: "8",
                    bc: "3",
                    h: "1",
                    l: "3",
                    p: "3",
                  },
                  {
                    name: "Jane Cooper",
                    role: "Associate Attending Physician",
                    rel: "5",
                    bc: "1",
                    h: "-",
                    l: "3",
                    p: "2",
                  },
                  {
                    name: "Bessie Cooper",
                    role: "Director, Breast Cancer Medicine",
                    rel: "3",
                    bc: "1",
                    h: "0",
                    l: "2",
                    p: "1",
                  },
                ].map((row, i) => (
                  <TableRow
                    key={i}
                    sx={{
                      "& td": { py: 2, borderBottom: "1px solid #F0F0F3" },
                    }}
                  >
                    <TableCell sx={{ color: "#828282", fontSize: "13px" }}>
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: "14px",
                          color: "#2666BE",
                        }}
                      >
                        {row.name}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#828282" }}>
                        {row.role}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ position: "relative" }}>
                      <Typography sx={{ color: "#4F4F4F", fontSize: "14px" }}>
                        {row.rel}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "#4F4F4F", fontSize: "14px" }}>
                      {row.bc}
                    </TableCell>
                    <TableCell sx={{ color: "#4F4F4F", fontSize: "14px" }}>
                      {row.h}
                    </TableCell>
                    <TableCell sx={{ color: "#4F4F4F", fontSize: "14px" }}>
                      {row.l}
                    </TableCell>
                    <TableCell sx={{ color: "#4F4F4F", fontSize: "14px" }}>
                      {row.p}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: "#EAF2FD",
                            p: 0.8,
                            borderRadius: "4px",
                            display: "flex",
                            cursor: "pointer",
                          }}
                        >
                          <MailOutlineIcon
                            sx={{ fontSize: 18, color: "#2666BE" }}
                          />
                        </Box>
                        <Box
                          sx={{
                            bgcolor: "#EAF2FD",
                            p: 0.8,
                            borderRadius: "4px",
                            display: "flex",
                            cursor: "pointer",
                          }}
                        >
                          <PhoneOutlinedIcon
                            sx={{ fontSize: 18, color: "#2666BE" }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </IntelligenceCard>
      </Box>

      {/* CRO PARTNERSHIPS SECTION */}
      <Box sx={{
        mt: 5,
        border: "1px solid #F0F0F3",
        padding: "16px",
        borderRadius: "4px",
        display: "none" //Hide CRO Partnerships section - not in the poc
      }}
      >
        <Typography
          sx={{
            fontFamily: "Rubik",
            fontWeight: 500,
            fontSize: "23px",
            color: "rgba(0,0,0,0.8)",
            mb: 0.5,
          }}
        >
          CRO Partnerships
        </Typography>
        <Typography
          sx={{
            fontFamily: "Rubik",
            fontSize: "14px",
            color: "rgba(0,0,0,0.6)",
            mb: 3,
          }}
        >
          Sites with existing MSAs typically activate 4-6 weeks faster
        </Typography>

        {/* Partnership Rows */}
        {[
          {
            name: "IQVIA",
            stats: "5 prior activations • Median startup: 8.1 weeks",
          },
          {
            name: "Medpace",
            stats: "3 prior activations • Median startup: 9.4 weeks",
          },
          {
            name: "PPD",
            stats: "4 prior activations • Median startup: 7.9 weeks",
          },
        ].map((cro) => (
          <Paper
            key={cro.name}
            elevation={0}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: "16px 20px",
              mb: "12px",
              bgcolor: "#F9F9FB",
              border: "1px solid #F0F0F3",
              borderRadius: "4px",
            }}
          >
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  mb: 0.5,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Rubik",
                    fontWeight: 500,
                    fontSize: "17px",
                    color: "rgba(0,0,0,0.8)",
                  }}
                >
                  {cro.name}
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #DCE9FC",
                    borderRadius: "44px",
                    px: "12px",
                    py: "1px",
                    bgcolor: "#FFF",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Rubik",
                      fontSize: "14px",
                      color: "rgba(0,0,0,0.6)",
                    }}
                  >
                    MSA Active
                  </Typography>
                </Box>
              </Box>
              <Typography
                sx={{
                  fontFamily: "Rubik",
                  fontSize: "14px",
                  color: "rgba(0,0,0,0.6)",
                }}
              >
                {cro.stats}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              sx={{
                textTransform: "none",
                color: "#2666BE",
                borderColor: "#2666BE",
                borderRadius: "6px",
                fontWeight: 500,
                px: 3,
                height: "40px",
                borderWidth: "1.5px",
                "&:hover": { borderWidth: "1.5px" },
              }}
            >
              Request Proposal
            </Button>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default SiteDetailView;

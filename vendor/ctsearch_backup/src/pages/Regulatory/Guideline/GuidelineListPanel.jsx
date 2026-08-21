import { Box, Typography, TextField, Divider, Chip } from "@mui/material";

import { useState, useEffect } from "react";
import guidelineResponse from "./data/guideline.json";
import filter from "../../../assets/filter_icon.svg";
import SearchIconImg from "../../../assets/icons/search_icon.svg";
import InputAdornment from "@mui/material/InputAdornment";
import DrugListSkeleton from "../DrugListSkeleton";
import { ExternalLinkLine, LocationIcon } from "../../../assets";

const FOOTER_HEIGHT = 52;
const PAGE_SIZE = 5;

export default function GuidelineListPanel({ selectedId, onSelectGuideline }) {
  const [loading, setLoading] = useState(true);

  const drugs = guidelineResponse.results;
  const totalCount = guidelineResponse.count;
  const [search, setSearch] = useState("");
  const [drugClass, setDrugClass] = useState("");
  const [page, setPage] = useState(1);

  const [cancerType, setCancerType] = useState("");
  const [regulatory, setRegulatory] = useState("");
  const [phase, setPhase] = useState("");
  const [approvalPathway, setApprovalPathway] = useState("");

  const filteredDrugs = drugs.filter((drug) => {
    const title = (drug.title || "").toLowerCase();

    const matchesCancer =
      !cancerType || title.includes(cancerType.toLowerCase());

    const matchesRegulatory = !regulatory || drug.regulatory === regulatory;

    const matchesPhase = !phase || drug.phase === phase;

    const matchesPathway =
      !approvalPathway || drug.approvalPathway === approvalPathway;

    return matchesCancer && matchesRegulatory && matchesPhase && matchesPathway;
  });

  const totalPages = Math.ceil(filteredDrugs.length / PAGE_SIZE);

  const paginatedDrugs = filteredDrugs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DrugListSkeleton />;
  }

  return (
    <>
      <Box
        sx={{
          width: 328,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",

          bgcolor: "rgba(240,246,254,0.7)",
          borderRight: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: "#F9F9FB",
            borderBottom: "1px solid rgba(0,0,0,0.1)",
            flexShrink: 0,
          }}
        >
          <Typography
            fontSize={14}
            fontWeight={500}
            mb={1.5}
            fontFamily="Rubik"
            color="rgba(0, 0, 0, 0.8)"
            textAlign="left"
          >
            Find regulatory guidance
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Cancer Type"
            value={cancerType}
            onChange={(e) => {
              setCancerType(e.target.value);
              setPage(1);
            }}
            sx={{ mb: 1.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <img
                    src={SearchIconImg}
                    alt="search"
                    style={{ width: 18, height: 18, opacity: 0.6 }}
                  />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
            <TextField
              size="small"
              select
              fullWidth
              value={regulatory}
              onChange={(e) => {
                setRegulatory(e.target.value);
                setPage(1);
              }}
              SelectProps={{ native: true }}
            >
              <option value="">Regulatory</option>
              <option value="FDA">FDA</option>
              <option value="EMA">EMA</option>
              <option value="MHRA">MHRA</option>
            </TextField>

            <TextField
              size="small"
              select
              fullWidth
              value={phase}
              onChange={(e) => {
                setPhase(e.target.value);
                setPage(1);
              }}
              SelectProps={{ native: true }}
            >
              <option value="">Phase</option>
              <option value="Phase 1">Phase 1</option>
              <option value="Phase 2">Phase 2</option>
              <option value="Phase 3">Phase 3</option>
            </TextField>
          </Box>

          {/* Approval Pathway */}
          <TextField
            size="small"
            fullWidth
            select
            value={approvalPathway}
            onChange={(e) => {
              setApprovalPathway(e.target.value);
              setPage(1);
            }}
            SelectProps={{ native: true }}
            sx={{ mb: 1 }}
          >
            <option value="">Approval pathway</option>
            <option value="Accelerated Approval">Accelerated Approval</option>
            <option value="Priority Review">Priority Review</option>
            <option value="Breakthrough Therapy">Breakthrough Therapy</option>
            <option value="Standard Approval">Standard Approval</option>
          </TextField>

          <Divider
            sx={{ mx: "-16px", color: "rgba(0,0,0,0.1)", mb: 1, mt: 1 }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography fontSize={14} fontWeight={500} fontFamily="Rubik">
              {totalCount}+ Guidance Documents
            </Typography>

            <img src={filter}></img>
          </Box>
        </Box>

        <Box
          className="custom-scrollbar inner-shadow-top"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {paginatedDrugs.map((drug, index) => {
            const active = drug.id === selectedId;

            return (
              <Box key={drug.id}>
                <Box
                  onClick={() => onSelectGuideline(drug.id)}
                  sx={{
                    position: "relative",
                    p: 2,
                    cursor: "pointer",
                    bgcolor: active ? "#E8F1FF" : "transparent",
                  }}
                >
                  {/* LEFT BLUE BAR */}
                  {active && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 5,
                        height: "100%",
                        bgcolor: "#2666BE",
                      }}
                    />
                  )}

                  <Typography
                    fontSize={14}
                    fontWeight={600}
                    textAlign="left"
                    fontFamily="Rubik"
                    sx={{
                      color: active
                        ? "rgba(28, 77, 142, 1)"
                        : "rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    {drug.title}
                  </Typography>
                  <Typography
                    fontSize={14}
                    color="rgba(0,0,0,0.6)"
                    fontFamily="Rubik"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      mt: 1,
                    }}
                  >
                    <img
                      src={LocationIcon}
                      alt="updated"
                      style={{
                        width: 13,
                        height: 13,
                        opacity: 0.7,
                      }}
                    />
                    Updated {drug.updated}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                      fontFamily: "Rubik",
                    }}
                  >
                  </Box>
                </Box>
                {index !== paginatedDrugs.length - 1 && (
                  <Divider
                    sx={{
                      borderColor: "rgba(0,0,0,0.1)",
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
        <Box
          sx={{
            height: FOOTER_HEIGHT,
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            position: "relative",

            bgcolor: "#F0F0F3",
            borderTop: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <Typography
            fontSize={13}
            color="rgba(0,0,0,0.6)"
            fontFamily="Rubik"
            lineHeight="100%"
          >
            Page {page} of {totalPages}
          </Typography>

          <Box display="flex" gap={4} alignItems="center">
            <Typography
              fontSize={12}
              fontFamily="Rubik"
              lineHeight="100%"
              fontWeight={500}
              sx={{
                cursor: page === 1 ? "default" : "pointer",
                color: page === 1 ? "rgba(0,0,0,0.4)" : "#2666BE",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              onClick={() => page > 1 && setPage(page - 1)}
            >
              <span style={{ fontSize: 18, lineHeight: "12px" }}>‹</span>
              Previous
            </Typography>

            <Typography
              fontSize={12}
              fontFamily="Rubik"
              lineHeight="100%"
              fontWeight={500}
              sx={{
                cursor: page === totalPages ? "default" : "pointer",
                color:
                  page === totalPages
                    ? "rgba(0,0,0,0.4)"
                    : "rgba(38, 102, 190, 1)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              onClick={() => page < totalPages && setPage(page + 1)}
            >
              Next
              <span style={{ fontSize: 18, lineHeight: "12px" }}>›</span>
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}

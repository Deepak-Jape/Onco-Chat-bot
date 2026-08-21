import { Box, Typography, TextField, Divider, Chip } from "@mui/material";

import { useState, useEffect } from "react";
import drugResponse from "./data/drugs.json";
import filter from "../../assets/filter_icon.svg";
import SearchIconImg from "../../assets/icons/search_icon.svg";
import InputAdornment from "@mui/material/InputAdornment";
import DrugListSkeleton from "./DrugListSkeleton";

const FOOTER_HEIGHT = 52;
const PAGE_SIZE = 5;

export default function DrugListPanel({ selectedId, onSelectDrug }) {
  //   const [selectedId, setSelectedId] = useState(1);
  const [loading, setLoading] = useState(true);

  const drugs = drugResponse.results;
  const totalCount = drugResponse.count;
  const [search, setSearch] = useState("");
  const [drugClass, setDrugClass] = useState("");
  const [page, setPage] = useState(1);
  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch =
      drug.name.toLowerCase().includes(search.toLowerCase()) ||
      drug.brand.toLowerCase().includes(search.toLowerCase());

    const matchesClass = drugClass ? drug.class === drugClass : true;

    return matchesSearch && matchesClass;
  });
  const totalPages = Math.ceil(filteredDrugs.length / PAGE_SIZE);

  const paginatedDrugs = filteredDrugs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // simulate API delay

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
            mb={1}
            fontFamily="Rubik"
            color="rgba(0, 0, 0, 0.8)"
            textAlign="left"
          >
            Search Drugs
          </Typography>

          {/* Search */}
          <TextField
            size="small"
            fullWidth
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{ mb: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <img
                    src={SearchIconImg}
                    alt="search"
                    style={{ width: 20, height: 20, opacity: 0.6 }}
                  />
                </InputAdornment>
              ),
            }}
          />

          {/* Drug Class Filter */}
          <TextField
            size="small"
            fullWidth
            fontFamily="Rubik"
            select
            value={drugClass}
            onChange={(e) => {
              setDrugClass(e.target.value);
              setPage(1);
            }}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            <option value="">Drug Class</option>
            <option value="Immunotherapy">Immunotherapy</option>
            <option value="Antibody-Drug Conjugate">
              Antibody-Drug Conjugate
            </option>
            <option value="Tyrosine Kinase Inhibitor">
              Tyrosine Kinase Inhibitor
            </option>
          </TextField>

          <Divider sx={{ mb: 1, mx: "-16px", color: "rgba(0, 0, 0, 0.1)" }} />

          {/* Count Row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography fontSize={14} fontWeight={500} fontFamily="Rubik">
              {totalCount}+ Drugs
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
                  onClick={() => onSelectDrug(drug.id)}
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
                    {drug.name}
                  </Typography>
                  <Typography
                    fontSize={13}
                    color="rgba(0,0,0,0.6)"
                    textAlign="left"
                    fontFamily="Rubik"
                  >
                    {drug.brand}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                      fontFamily: "Rubik",
                    }}
                  >
                    <Chip
                      label={drug.class}
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: "#FDE9D6",
                        color: "#C1660D",
                        fontFamily: "Rubik",
                      }}
                    />
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

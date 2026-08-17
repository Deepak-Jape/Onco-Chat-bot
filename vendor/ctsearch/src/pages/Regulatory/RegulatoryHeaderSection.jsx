import { Box, Typography } from "@mui/material";

export default function RegulatoryHeaderSection({
  activeTab,
  onTabChange,
}) {
  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ===== PAGE TITLE ===== */}
      <Box
        sx={{
          px: "20px",
          pt: "17px",
          pb: "16px",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <Typography
          fontFamily="Rubik"
          fontSize="27px"
          fontWeight={500}
          color="rgba(0,0,0,0.8)"
        >
          Regulatory
        </Typography>
      </Box>

      {/* ===== TABS BAR ===== */}
      <Box
        sx={{
          px: "20px",
          pt: "8px",
          bgcolor: "#13335F",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <Box sx={{ height: "30px", display: "flex" }}>
          {/* DRUG TAB */}
          <Box
            onClick={() => onTabChange("DRUG")}
            sx={{
              minHeight: "26px",
              px: { xs: "14px", sm: "25px" },
              bgcolor: activeTab === "DRUG" ? "#FFFFFF" : "transparent",
              borderTopLeftRadius: "4px",
              borderTopRightRadius: "4px",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Typography
              fontFamily="Rubik"
              fontSize="15px"
              fontWeight={500}
              color={
                activeTab === "DRUG"
                  ? "#2666BE"
                  : "rgba(255,255,255,0.8)"
              }
            >
              Drug Database
            </Typography>
          </Box>

          {/* GUIDELINES TAB */}
          <Box
            onClick={() => onTabChange("GUIDELINES")}
            sx={{
              minHeight: "26px",
              px: "25px",
              bgcolor: activeTab === "GUIDELINES" ? "#FFFFFF" : "transparent",
              borderTopLeftRadius: "4px",
              borderTopRightRadius: "4px",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Typography
              fontFamily="Rubik"
              fontSize="15px"
              fontWeight={500}
              color={
                activeTab === "GUIDELINES"
                  ? "#2666BE"
                  : "rgba(255,255,255,0.8)"
              }
            >
              Guidelines
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

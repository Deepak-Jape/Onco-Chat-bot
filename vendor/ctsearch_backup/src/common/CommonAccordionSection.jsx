import React, { useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

const BulletIcon = () => (
  <Box
    component="img"
    src={BulletIcon}
    alt="bullet-icon"
    sx={{
      width: "18px",
      height: "18px",
      objectFit: "contain",
      mt: "5px",
    }}
  />
);

const colors = {
  info900: "rgba(12, 32, 59, 1)",
  info600: "#2563EB",
  black800: "rgba(0,0,0,0.8)",
  black700: "rgba(0,0,0,0.7)",
  black600: "rgba(0,0,0,0.6)",
  white100: "#FFFFFF",
};

// -----------------------------------------------------

const Section = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Accordion
      expanded={open}
      onChange={() => setOpen(!open)}
      sx={{
        width: "100%",
        background: "#FFFFFF",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "1px 8px 34px rgba(153,169,190,0.10)",
        border: "1px solid rgba(0,0,0,0.05)",
        mb: 3,
        "&:before": { display: "none" },

        // 🔥 FORCE MUI INTERNAL ELEMENTS TO RESPECT YOUR RADIUS
        "&.MuiAccordion-root": {
          borderRadius: "12px !important",
        },
        "&.MuiAccordion-root:first-of-type": {
          borderTopLeftRadius: "12px !important",
          borderTopRightRadius: "12px !important",
        },
        "&.MuiAccordion-root:last-of-type": {
          borderBottomLeftRadius: "12px !important",
          borderBottomRightRadius: "12px !important",
        },
      }}
    >
      <AccordionSummary
        expandIcon={null}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          px: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {open ? (
            <RemoveIcon sx={{ color: colors.info600, fontSize: 22 }} />
          ) : (
            <AddIcon sx={{ color: colors.black600, fontSize: 22 }} />
          )}

          <Typography
            sx={{
              fontFamily: "Rubik",
              fontSize: isMobile ? "18px" : "24px",
              lineHeight: "120%",
              fontWeight: 600,
              color: colors.black800,
            }}
          >
            {title}
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};



export default Section;

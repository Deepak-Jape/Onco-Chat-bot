// AdminSidebar.jsx
import React from "react";
import { Box, Divider, IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import LogoIcon from "../../assets/LogoIcon.png";
import { authService } from "../../auth/authService";

export default function AdminSidebar() {
  return (
    <Box
      sx={{
        width: "56px",
        bottom: 0,
        position: "fixed",
        top: 0,
        left: 0,
        bgcolor: "#13335F",
        py: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 1200,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Box
          component="img"
          src={LogoIcon}
          alt="OncoSuite"
          sx={{
            width: "28px",
            height: "28px",
            objectFit: "contain",
          }}
        />

        <Box
          sx={{
            width: "40px",
            height: "40px",
            bgcolor: "#2666BE",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SettingsIcon sx={{ color: "#fff" }} />
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Divider
          sx={{
            width: "32px",
            borderColor: "rgba(255,255,255,0.15)",
          }}
        />

        <IconButton
          sx={{
            color: "#FF6B6B",
            "&:hover": {
              bgcolor: "rgba(255,107,107,0.1)",
            },
          }}
          onClick={() => {
            authService.logout()
          }}
        >
          <LogoutIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

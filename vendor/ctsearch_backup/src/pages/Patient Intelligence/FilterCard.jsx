import { Box, Stack, Typography } from "@mui/material";

export default function FilterCard({ icon, title, desc }) {
    return (
        <Box
      sx={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        boxShadow: "4px 4px 20px rgba(130, 143, 169, 0.15)",
        borderRadius: "8px",
        padding: "24px", // Increased padding for better look
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%", // THIS IS KEY: Must be 100%
        height: "100%", // Ensures all cards in a row have same height
        boxSizing: "border-box",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: "52px",
            height: "52px",
            backgroundColor: "#F0F6FE",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontFamily: "Rubik",
            fontWeight: 500,
            fontSize: "20px",
            color: "rgba(0, 0, 0, 0.8)",
          }}
        >
          {title}
        </Typography>
      </Stack>
      <Typography
        sx={{
          fontFamily: "Rubik",
          fontSize: "16px",
          lineHeight: "24px",
          color: "rgba(0, 0, 0, 0.6)",
        }}
      >
        {desc}
      </Typography>
    </Box>
    );
}
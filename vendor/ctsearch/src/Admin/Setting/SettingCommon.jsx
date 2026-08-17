import { Box, Typography } from "@mui/material";

export const ReadField = ({ label, value, full, sx, color }) => (
  <Box
    sx={{
      gridColumn: full ? "1 / -1" : "auto",
      ...sx,
    }}
  >
    {/* LABEL */}
    <Typography
      sx={{
        fontFamily: "Rubik",
        fontWeight: 400,
        fontSize: "14px",
        lineHeight: "18px",
        color: "rgba(0,0,0,0.5)",
        mb: "4px",
        textAlign: "left",
      }}
    >
      {label}
    </Typography>

    {/* VALUE */}
    <Typography
      sx={{
        fontFamily: "Rubik",
        fontWeight: 500,
        fontSize: "15px",
        lineHeight: "20px",
        // color: "rgba(0,0,0,0.8)",
        textAlign: "left",
        minHeight: "20px",
        color: color || "rgba(0,0,0,0.8)",
      }}
    >
      {value}
    </Typography>
  </Box>
);

export const AvatarCircle = ({ text, src }) => (
  <Box
    sx={{
      width: 64,
      height: 64,
      borderRadius: "50%",
      bgcolor: "#13335F",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontSize: 24,
      overflow: "hidden", // Ensures the image doesn't bleed past the circle radius
    }}
  >
    {src ? (
      <Box
        component="img"
        src={src}
        alt="Avatar"
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover", // Keeps the aspect ratio correct
        }}
      />
    ) : (
      text
    )}
  </Box>
);

export const CardWrapper = ({ children, row, height }) => (
  <Box
    sx={{
      bgcolor: "#fff",
      borderRadius: 2,
      p: 3,
      boxShadow: "0px 4px 10px rgba(130,143,169,0.1)",
      display: row ? "flex" : "block",
      justifyContent: row ? "space-between" : "initial",
      alignItems: row ? "center" : "initial",
      border: "1px solid rgba(0, 0, 0, 0.05)",
      height: height ? height : "",
    }}
  >
    {children}
  </Box>
);

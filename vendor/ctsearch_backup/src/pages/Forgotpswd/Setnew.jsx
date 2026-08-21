import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import keyIcon from "../../assets/key.svg";
import leftArrow from "../../assets/leftarrow.svg";
import { OncoSuiteLogo, OncosuiteSvg } from "../../assets";
import { useNavigate } from "react-router-dom";

export default function SetNew({ onContinue, onBack }) {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        overflowX: "hidden",
        background: `
          linear-gradient(
            180deg,
            rgba(184, 212, 249, 1) 0%,
            rgba(184, 212, 249, 0.2) 100%
          )
        `,
      }}
    >
      {/*  HEADER  */}
      <Box
        sx={{
          width: "100%",
          height: "76px",
          px: { xs: "16px", md: "70px" },
          py: "16px",
          background: "rgba(255, 255, 255, 0.20)",
          boxShadow: "1px 8px 34px rgba(153, 169, 190, 0.10)",
          borderBottom: "1px solid #E8E8EC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src={OncoSuiteLogo}
          alt="OncoSuite"
          onClick={() => navigate("/")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/");
          }}
          role="button"
          tabIndex={0}
          sx={{ height: "32px", cursor: "pointer" }}
        />
      </Box>

      {/*  CONTENT */}
      <Box
        sx={{
          minHeight: "calc(100vh - 76px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "520px",
            minHeight: "470px",

            background: `
      linear-gradient(
        180deg,
        rgba(202, 225, 255, 1) 0%,
        rgba(255, 255, 255, 0.5) 100%
      )
    `,

         
            border: "1px solid rgba(255, 255, 255, 0.3)",

  
            boxShadow: "4px 4px 20px rgba(130, 143, 169, 0.1)",

            borderRadius: "16px",

            px: "32px",
            py: "40px",

            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",

           
            "@media (max-width: 600px)": {
              minHeight: "auto",
              px: "20px",
              py: "28px",
            },
          }}
        >
          {/* ICON */}
          <Box
            sx={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#FFFFFF",
              boxShadow: "0px 8px 20px rgba(0,0,0,0.08)",
              // outline: "10px solid rgba(255,255,255,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src={keyIcon}
              alt="Key Icon"
              sx={{ width: "24px", height: "24px" }}
            />
          </Box>

          {/* TEXT */}
          <Box textAlign="center">
            <Typography
              sx={{
                fontFamily: "Rubik",
                fontWeight: 500,
                fontSize: "42px",
                color: "rgba(0,0,0,0.8)",
                lineHeight: "120%",
              }}
            >
              Set new password
            </Typography>

            <Typography
              sx={{
                mt: 1,
                fontFamily: "Rubik",
                fontSize: "18px",
                color: "rgba(0,0,0,0.6)",
                lineHeight: "28px",
              }}
            >
              Your new password must be different to previously used passwords.
            </Typography>
          </Box>

          {/* INPUTS */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <TextField
              fullWidth
              placeholder="New password"
              type={showNew ? "text" : "password"}
              InputProps={{
                sx: {
                  height: "56px",
                  bgcolor: "rgba(255, 255, 255, 1)",
                  color: "rgba(0, 0, 0, 0.5)",
                  fontFamily: "Rubik",
                  fontSize: "16px",
                  lineHeight: "24px",
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(0, 0, 0, 0.1)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(0, 0, 0, 0.16)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(38,102,190,0.55)",
                    borderWidth: "1px",
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "4px 16px",
                    height: "100%",
                    boxSizing: "border-box",
                  },
                  "& input::placeholder": {
                    color: "rgba(0,0,0,0.45)",
                    opacity: 1,
                  },
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNew(!showNew)}
                      sx={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      {showNew ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              placeholder="Confirm new password"
              type={showConfirm ? "text" : "password"}
              InputProps={{
                sx: {
                  height: "56px",
                  bgcolor: "rgba(255, 255, 255, 1)",
                  color: "rgba(0, 0, 0, 0.5)",
                  fontFamily: "Rubik",
                  fontSize: "16px",
                  lineHeight: "24px",
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(0, 0, 0, 0.1)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(0, 0, 0, 0.16)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(38,102,190,0.55)",
                    borderWidth: "1px",
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "4px 16px",
                    height: "100%",
                    boxSizing: "border-box",
                  },
                  "& input::placeholder": {
                    color: "rgba(0,0,0,0.45)",
                    opacity: 1,
                  },
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm(!showConfirm)}
                      sx={{ color: "rgba(0,0,0,0.4)" }}
                    >
                      {showConfirm ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* BUTTON */}
          <Button
            fullWidth
            onClick={onContinue}
            sx={{
              height: "56px",
              textTransform: "none",
              bgcolor: "rgba(38,102,190,1)",
              borderRadius: "8px",
              fontFamily: "Rubik",
              fontSize: "18px",
              fontWeight: 500,
              color: "#FFFFFF",
              boxShadow: "0px 6px 14px rgba(38,102,190,0.35)",
              "&:hover": {
                bgcolor: "rgba(30,85,165,1)",
              },
            }}
          >
            Reset password
          </Button>

          {/* BACK */}
          <Box
            onClick={onBack}
            sx={{
              mt: 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <Box
              component="img"
              src={leftArrow}
              alt="Back"
              sx={{
                width: "14px",
                height: "14px",
                filter: "brightness(0) saturate(100%) opacity(0.6)",
              }}
            />

            <Typography
              sx={{
                fontFamily: "Rubik",
                fontSize: "15.16px",
                color: "rgba(0,0,0,0.4)",
              }}
            >
              Back to log in
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

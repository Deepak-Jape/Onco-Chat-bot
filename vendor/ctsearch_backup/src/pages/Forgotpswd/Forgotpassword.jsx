import { Box, Typography, Button, TextField } from "@mui/material";
import keyIcon from "../../assets/key.svg";
import Left from "../../assets/leftarrow.svg";
import { OncoSuiteLogo, OncosuiteSvg } from "../../assets";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword({ onContinue, onBack }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
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
          px: "70px",
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
                color: "rgba(0,0,0,0.80)",
                lineHeight: "120%",
              }}
            >
              Forgot Password
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
              No worries, we’ll send you reset instructions.
            </Typography>
          </Box>

          {/* INPUT + BUTTON */}
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
              placeholder="Your email address"
              InputProps={{
                sx: {
                  height: "56px",
                  bgcolor: "rgba(255, 255, 255, 1)",
                  borderRadius: "8px",
                  color: "rgba(0, 0, 0, 0.5)",
                  fontFamily: "Rubik",
                  fontSize: "16px",
                  lineHeight: "24px",
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
              }}
            />

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
                lineHeight: "25px",
                color: "rgba(240, 246, 254, 1)",
                boxShadow: "0px 6px 14px rgba(38,102,190,0.35)",
                transition: "background-color 160ms ease",
                "&:hover": {
                  bgcolor: "rgba(28, 77, 142, 1)",
                },
              }}
            >
              Reset password
            </Button>
          </Box>

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
              src={Left}
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

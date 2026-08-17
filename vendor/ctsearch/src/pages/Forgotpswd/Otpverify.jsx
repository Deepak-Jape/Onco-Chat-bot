import { Box, Typography, Button } from "@mui/material";
import mailIcon from "../../assets/mail_ps.svg";
import leftArrow from "../../assets/leftarrow.svg";
import { OncoSuiteLogo, OncosuiteSvg } from "../../assets";
import OtpInputs from "./OtpInputs";
import { useNavigate } from "react-router-dom";

export default function OtpVerification({ onContinue, onBack }) {
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

      {/*  CONTENT  */}
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
              src={mailIcon}
              alt="Mail Icon"
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
              OTP Verification
            </Typography>

            <Typography
              sx={{
                mt: 1,
                mb: 3,
                fontFamily: "Rubik",
                fontSize: "18px",
                color: "rgba(0,0,0,0.6)",
                fontWeight: 400,
              }}
            >
              Enter the code from the mail we sent to{" "}
              <span style={{ fontWeight: 400, color: "rgba(0,0,0,0.6)" }}>
                abcd123@gmail.com
              </span>
            </Typography>
          </Box>

          {/* OTP INPUTS */}
          <OtpInputs />

          {/* VERIFY BUTTON */}
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
              color: "rgba(240, 246, 254, 1)",
              boxShadow: "0px 6px 14px rgba(38,102,190,0.35)",
              "&:hover": {
                bgcolor: "rgba(30,85,165,1)",
              },
            }}
          >
            Verify
          </Button>

          {/* RESEND */}
          <Typography
            sx={{
              fontFamily: "Rubik",
              fontSize: "16px",
              color: "rgba(0,0,0,0.6)",
              lineHeight: "100%",
            }}
          >
            Didn’t receive the email?{" "}
            <span
              style={{
                color: "rgba(47, 128, 237, 1)",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "16px",
                lineHeight: "100%",
              }}
            >
              Click to resend
            </span>
          </Typography>

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

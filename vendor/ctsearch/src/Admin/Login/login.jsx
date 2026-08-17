import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../auth/authConfig";

import microsoftIcon from "../../assets/microsoft.svg.svg";
import oncoSuiteLogo from "../../assets/logo/onco_logo.png";

// Steps
import getUserProfile from "../../auth/getUserProfile";

export default function AdminLogin() {
  const [step, setStep] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const { instance } = useMsal();

  const handleLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup(loginRequest);

      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: loginResponse.account,
      });

      const userProfile = await getUserProfile(tokenResponse.accessToken);

      const userData = {
        firstName: userProfile.givenName,
        lastName: userProfile.surname,
        email: userProfile.mail || userProfile.userPrincipalName,
      };

      // console.log("User Data:", userData);
      // Optional: send to backend
      // await saveUserToBackend(userData);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const renderLoginForm = () => (
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
      {/* HEADER */}
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
          justifyContent: "space-between",
        }}
      >
        {/* LOGO */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            component="img"
            src={oncoSuiteLogo}
            alt="OncoSuite"
            sx={{ height: "32px", cursor: "pointer" }}
          />
        </Box>
      </Box>
      {/*  LOGIN CARD */}
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
            minHeight: "250px",

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
            gap: "28px",

            /* 📱 Responsive */
            "@media (max-width: 600px)": {
              minHeight: "auto",
              px: "20px",
              py: "28px",
            },
          }}
        >
          {/* TITLE */}
          <Box>
            <Typography
              sx={{
                fontFamily: "Rubik",
                fontSize: "42px",
                fontWeight: 600,
                textAlign: "center",
                color: "rgba(0, 0, 0, 0.8)",
                lineHeight: "120%",
              }}
            >
              Log in
            </Typography>

            <Typography
              sx={{
                fontFamily: "Rubik",
                fontSize: "18px",
                mt: 1,
                textAlign: "center",
                fontWeight: 400,
                lineHeight: "28px",
                color: "rgba(0,0,0,0.6)",
              }}
            >
              Welcome back! Please enter your details.
            </Typography>
          </Box>

          {/* INPUTS */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              placeholder="Your email address"
              InputProps={{
                sx: {
                  height: "48px",
                  // bgcolor: "rgba(255,255,255,0.9)",
                  borderRadius: "8px",
                  // border: "1px solid rgba(0,0,0,0.12)",
                },
              }}
            />

            <TextField
              fullWidth
              placeholder="Enter password"
              type={showPassword ? "text" : "password"}
              InputProps={{
                sx: {
                  height: "48px",
                  borderRadius: "8px",
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <FormControlLabel
                control={<Checkbox sx={{ color: "rgba(0,0,0,0.6)" }} />}
                label={
                  <Typography
                    sx={{
                      fontFamily: "Rubik",
                      fontSize: "15.16px",
                      color: "rgba(0,0,0,0.6)",
                      fontWeight: 400,
                    }}
                  >
                    Remember me
                  </Typography>
                }
              />

              <Link
                underline="none"
                sx={{
                  fontFamily: "Rubik",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "rgba(47, 128, 237, 1)",
                  cursor: "pointer",
                }}
                onClick={() => setStep("forgot")}
              >
                Forgot password
              </Link>
            </Box>

            <Button
              fullWidth
              variant="contained"
              sx={{
                height: "56px",
                bgcolor: "rgba(38, 102, 190, 1)",
                borderRadius: "8px",
                textTransform: "none",
                fontFamily: "Rubik",
                fontSize: "18px",
                fontWeight: 600,
                boxShadow: "0px 6px 14px rgba(38,102,190,0.35)",
                "&:hover": {
                  bgcolor: "rgba(30, 85, 160, 1)",
                },
              }}
              onClick={handleLogin}
            >
              Log In
            </Button>
          </Box>
          {/* 
          <Divider sx={{ color: "rgba(0,0,0,0.4)", fontSize: "14px" }}>
            Secure Login via Enterprise SSO
          </Divider> */}

          {/* <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={handleLogin}
              sx={{
                width: "140px",
                height: "56px",
                borderRadius: "12px",
                border: "1px solid rgba(0,0,0,0.15)",
                // backgroundColor: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "none",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <Box
                component="img"
                src={microsoftIcon}
                alt="Microsoft"
                sx={{ width: "92px", height: "20px" }}
              />
            </Button>
          </Box> */}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {step === "login" && renderLoginForm()}
      {/* {step === "forgot" && (
        <ForgotPassword
          onContinue={() => setStep("otp")}
          onBack={() => setStep("login")}
        />
      )}
      {step === "otp" && (
        <OtpVerification
          onContinue={() => setStep("setNew")}
          onBack={() => setStep("login")}
        />
      )}
      {step === "setNew" && (
        <SetNew
          onContinue={() => setStep("success")}
          onBack={() => setStep("login")}
        />
      )}
      {step === "success" && (
        <PasswordReset onFinish={() => setStep("login")} />
      )} */}
    </>
  );
}

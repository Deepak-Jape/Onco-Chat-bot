/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Modal,
  Backdrop,
  Fade,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
// import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../auth/authConfig";
import microsoftIcon from "../../assets/microsoft.svg.svg";
import logoSvg from "../../assets/logo/onco_logo.png";
import getUserProfile from "../../auth/getUserProfile";
import { useNavigate } from "react-router-dom";
import { authService } from "../../auth/authService";

export default function Login() {
  // const { login } = useAuth();
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    designation: "",
  });
  const navigate = useNavigate();
  // const { instance } = useMsal();

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem("incompleteProfile"));
    if (savedProfile) {
      setProfileForm(savedProfile);
      setShowModal(true);
    }
  }, []);

  // useEffect(() => {
  //   const trySSOLogin = async () => {
  //     try {
  //       const accounts = instance.getAllAccounts();

  //       if (accounts.length > 0) {
  //         // User already logged in (SSO)
  //         const tokenResponse = await instance.acquireTokenSilent({
  //           ...loginRequest,
  //           account: accounts[0],
  //         });

  //         await handlePostLogin(tokenResponse);
  //       }
  //     } catch (error) {
  //       console.log("Silent login failed, user must login manually");
  //     }
  //   };

  //   trySSOLogin();
  // }, []);

  const handlePostLogin = async (tokenResponse) => {
    const userProfile = await getUserProfile(tokenResponse.accessToken);

    const profile = {
      firstName: userProfile.givenName || "",
      lastName: userProfile.surname || "",
      email: userProfile.mail || userProfile.userPrincipalName,
      designation: "",
    };

    localStorage.setItem("userProfile", JSON.stringify(profile));

    if (!profile.firstName || !profile.lastName || !profile.designation) {
      localStorage.setItem("incompleteProfile", JSON.stringify(profile));
      navigate("/trials", { state: { openProfileModal: true } });
    } else {
      localStorage.removeItem("incompleteProfile");
      navigate("/trials");
    }
  };

  const handleLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup(loginRequest);

      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: loginResponse.account,
      });
      localStorage.setItem("accessToken", tokenResponse.accessToken);

      await handlePostLogin(tokenResponse);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleEmailLogin = () => {
    // UI-only for now; SSO login stays below.
    // Hook this to your API when ready.
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
          px: { xs: "16px", md: "70px" },
          py: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.2)",
          boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.1)",
          borderBottom: "1px solid rgba(232, 232, 236, 1)",
        }}
      >
        {/* LOGO */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            component="img"
            src={logoSvg}
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
                fontWeight: 500,
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                sx: {
                  height: "56px",
                  bgcolor: "rgba(255, 255, 255, 1)",
                  borderRadius: "8px",
                  fontFamily: "Rubik",
                  fontSize: "16px",
                  color: "rgba(0, 0, 0, 0.5)",
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

            <TextField
              fullWidth
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              InputProps={{
                sx: {
                  height: "56px",
                  bgcolor: "rgba(255, 255, 255, 1)",
                  borderRadius: "8px",
                  fontFamily: "Rubik",
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "rgba(0, 0, 0, 0.5)",
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
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      sx={{ color: "rgba(0, 0, 0, 0.4)" }}
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
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{ color: "rgba(0,0,0,0.6)" }}
                  />
                }
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
                  fontWeight: 500,
                  color: "rgba(47, 128, 237, 1)",
                  cursor: "pointer",
                  lineHeight: "24px",
                  userSelect: "none",
                }}
                onClick={() => navigate("/forgot-password")}
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
                fontWeight: 500,
                boxShadow: "0px 6px 14px rgba(38,102,190,0.35)",
                "&:hover": {
                  bgcolor: "rgba(30, 85, 160, 1)",
                },
              }}
              onClick={handleEmailLogin}
            >
              Log In
            </Button>
          </Box>

          <Divider
            sx={{
              "&::before, &::after": {
                borderColor: "rgba(0, 0, 0, 0.2)",
              },
              color: "rgba(0, 0, 0, 0.4)",
              fontFamily: "Rubik",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            Secure Login via Enterprise SSO
          </Divider>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={authService.login}
              sx={{
                width: "140px",
                height: "56px",
                borderRadius: "12px",
                border: "1px solid rgba(224, 225, 230, 1)",
                backgroundColor: "rgba(240, 240, 243, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "none",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
                "&:hover": {
                  backgroundColor: "rgba(240, 240, 243, 1)",
                  border: "1px solid rgba(224, 225, 230, 1)",
                },
              }}
            >
              <Box
                component="img"
                src={microsoftIcon}
                alt="Microsoft"
                sx={{ width: "92px", height: "20px" }}
              />
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return <>{renderLoginForm()}</>;
}

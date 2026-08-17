import React from "react";
import { InlineWidget } from "react-calendly";
import { Typography, Box } from "@mui/material";
import Logo from "../../assets/logo/onco_logo.jpg";
import { useNavigate } from "react-router-dom";

const HEADER_HEIGHT = 60;

const BookDemo = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
      }}
      className="app-scroll"
    >
      {/* Fixed Header */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: `${HEADER_HEIGHT}px`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.08)",
          backgroundColor: "#fff",
          zIndex: 1000,
        }}
      >
        <Box
          component="img"
          src={Logo}
          alt="Logo"
          sx={{
            height: 40,
            objectFit: "contain",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        />
      </Box>

      {/* Scrollable Content Box */}
      <Box
        sx={{
          marginTop: `${HEADER_HEIGHT}px`,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          overflowY: "auto",
          overflowX: "hidden",
          px: { xs: 1, md: 2 },
          pb: 2,
          scrollbarWidth: "thin",
        }}
      >
        {/* Heading */}
        <Box sx={{ mt: 2, px: 2 }}>
          <Typography
            sx={{
              fontSize: {
                xs: "32px",
                sm: "36px",
                md: "46px",
              },
              fontWeight: 600,
              color: "rgba(0, 0, 0, 0.8)",
              fontFamily: "Rubik",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            Book Your Live Demo
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: "14px",
                sm: "16px",
                md: "18px",
              },
              fontWeight: 400,
              color: "rgba(0, 0, 0, 0.6)",
              fontFamily: "Rubik",
              textAlign: "center",
              mt: 1,
              lineHeight: 1.6,
            }}
          >
            In this 30-minute technical session, we will apply OncoSuite’s
            Population, Trial, and Site
            <br />
            Intelligence to your specific indication or draft protocol.
          </Typography>
        </Box>

        {/* Calendly Box */}
        <Box
          sx={{
            marginTop: {
              xs: "20px",
              sm: "-40px",
              md: "-40px",
            },
          }}
        >
          <InlineWidget
            url="https://calendly.com/martin-at-saasstudio/30min"
            styles={{
              height: "700px",
              marginTop: "0px",
            }}
            pageSettings={{
              hideEventTypeDetails: false,
              hideLandingPageDetails: false,
              primaryColor: "#0066ff",
              textColor: "#000000",
              backgroundColor: "#ffffff",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default BookDemo;

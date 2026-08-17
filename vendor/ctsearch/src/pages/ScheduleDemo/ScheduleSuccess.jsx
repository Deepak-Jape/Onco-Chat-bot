import React from "react";
import { Box, Typography, Paper, Stack } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PublicIcon from "@mui/icons-material/Public";

import globe from "../../assets/globe_icon.svg";
import { OncosuiteSvg } from "../../assets/";
import { useLocation, useNavigate } from "react-router-dom";

const ScheduleSuccess = ({ state }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!state) return null;

  const { date, time, timezone, duration } = state;

  // date is already a Date object
  const startDateTime = new Date(date);

  // extract hours & minutes from "09:00"
  const [hours, minutes] = time.split(":").map(Number);

  // apply time to the date
  startDateTime.setHours(hours, minutes, 0, 0);

  // calculate end time
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

  const startTimeFormatted = startDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endTimeFormatted = endDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const getFriendlyTimezoneLabel = (tz) => {
    const now = new Date();

    const time = now.toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Friendly names mapping (extendable)
    const NAME_MAP = {
      "Europe/Berlin": "Central European Time",
      "Europe/Paris": "Central European Time",
      "Europe/Rome": "Central European Time",
      "Asia/Kolkata": "India Standard Time",
      "Asia/Calcutta": "India Standard Time",
      "America/New_York": "Eastern Time",
      "America/Los_Angeles": "Pacific Time",
    };

    const name = NAME_MAP[tz] || tz.split("/")[1].replace("_", " ");

    return `${name} (${time})`;
  };

  const handleRedirect = (path) => {
    if (location.pathname === path) return;
    navigate(path);
  };

  // UI remains exactly the same

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* HEADER */}
      <Box
        component="button"
        type="button"
        aria-label="Go to home page"
        sx={{
          height: 76,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #E8E8EC",
          border: 0,
          p: 0,
          background: "transparent",
        }}
        onClick={() => handleRedirect("/firstscreen")}
      >
        <img
          src={OncosuiteSvg}
          alt="OncoSuite logo"
          width={206}
          height={40}
          loading="eager"
          decoding="async"
        />
      </Box>

      {/* CONTENT */}
      <Box
        sx={{
          width: "100%",
          px: { xs: 2, md: 0 },
          display: "flex",
          justifyContent: "center",
          mt: 6,
        }}
      >
        <Box sx={{ maxWidth: 640, width: "100%" }}>
          <Typography
            textAlign="center"
            fontFamily="Rubik"
            fontSize={42}
            fontWeight={500}
            lineHeight="120%"
            color="rgba(0, 0, 0, 0.8)"
            mb={4}
          >
            You are scheduled
          </Typography>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              p: { xs: 3, md: 5 },
              border: "1px solid rgba(0,0,0,0.05)",
              textAlign: "center",
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 48, color: "#27AE60", mb: 2 }} />

            <Typography
              fontSize={32}
              fontWeight={500}
              fontFamily="Rubik"
              lineHeight="130%"
              color="rgba(0, 0, 0, 0.8)"
              mb={1}
            >
              Thank You!
            </Typography>

            <Typography
              fontSize={16}
              color="rgba(0,0,0,0.6)"
              mb={3}
              lineHeight="24px"
              fontWeight={400}
            >
              A calendar invitation has been sent to your email address.
            </Typography>

            {/* SCHEDULE CARD */}
            <Paper
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "rgba(240, 246, 254, 1)",
                borderRadius: 2,
                textAlign: "left",
              }}
            >
              <Typography
                fontWeight={500}
                fontFamily="Rubik"
                mb={1}
                fontSize="20px"
                lineHeight="130%"
              >
                Schedule
              </Typography>

              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarTodayIcon
                    fontSize="small"
                    sx={{ color: "rgba(0, 0, 0, 0.5)" }}
                  />

                  <Typography
                    fontSize={16}
                    fontFamily="Rubik"
                    lineHeight="24px"
                    fontWeight={500}
                    color="rgba(0, 0, 0, 0.6)"
                  >
                    {startTimeFormatted} – {endTimeFormatted}, {formattedDate}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <img
                    src={globe}
                    alt=""
                    width={20}
                    height={20}
                    loading="lazy"
                    decoding="async"
                  />
                  <Typography
                    fontSize={16}
                    fontFamily="Rubik"
                    lineHeight="24px"
                    fontWeight={500}
                    color="rgba(0, 0, 0, 0.6)"
                  >
                    {getFriendlyTimezoneLabel(timezone)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ScheduleSuccess;

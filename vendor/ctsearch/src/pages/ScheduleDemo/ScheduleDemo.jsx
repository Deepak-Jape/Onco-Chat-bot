import React from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Stack,
  IconButton,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import { Divider } from "@mui/material";
import globe from "../../assets/globe_icon.svg";
import { OncosuiteSvg } from "../../assets/";
import ScheduleSuccess from "./ScheduleSuccess";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useLocation, useNavigate } from "react-router-dom";

import PublicIcon from "@mui/icons-material/Public";

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const getMonthYearLabel = (date) =>
  date.toLocaleString("en-US", { month: "long", year: "numeric" });

const getCalendarMatrix = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Convert Sunday start → Monday start
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const calendar = [];
  let week = Array(offset).fill("");

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      calendar.push(week);
      week = [];
    }
  }

  if (week.length) {
    calendar.push([...week, ...Array(7 - week.length).fill("")]);
  }

  return calendar;
};

const StepCircle = ({ label, step, currentStep }) => {
  const completed = step < currentStep;
  const active = step === currentStep;

  return (
    <Stack alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          bgcolor: completed ? "#27AE60" : active ? "#F0F6FE" : "#FFFFFF",
          border: completed
            ? "2px solid #27AE60"
            : active
            ? "2px solid #2F80ED"
            : "2px solid #E0E0E0",
          color: completed ? "#fff" : "#2666BE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 500,
          fontFamily: "Rubik",
        }}
      >
        {completed ? "✓" : step}
      </Box>

      <Typography
        fontSize={14}
        fontFamily="Rubik"
        color={active ? "#2666BE" : "rgba(0,0,0,0.6)"}
      >
        {label}
      </Typography>
    </Stack>
  );
};

const StepConnector = ({ active }) => (
  <Box
    sx={{
      width: 115,
      height: 2,
      backgroundColor: active ? "#27AE60" : "rgba(0,0,0,0.15)",
      mt: "20px",
      flexShrink: 0,
    }}
  />
);

const StepItem = ({ label, step, currentStep, isLast }) => {
  const completed = step < currentStep;
  const active = step === currentStep;

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",

        minWidth: 140,

        "@media (max-width: 420px)": {
          minWidth: 106,
        },
      }}
    >
      {/* CIRCLE */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          bgcolor: completed ? "#27AE60" : active ? "#F0F6FE" : "#FFFFFF",
          border: completed
            ? "2px solid #27AE60"
            : active
            ? "2px solid #2F80ED"
            : "2px solid #E0E0E0",
          color: completed ? "#fff" : "#2666BE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 500,
          fontFamily: "Rubik",
          zIndex: 2,
        }}
      >
        {completed ? "✓" : step}
      </Box>

      {/* CONNECTOR */}
      {!isLast && (
        <Box
          sx={{
            position: "absolute",

            top: "30%",
            left: "53px",
            width: 140,
            height: "2.5px",

            "@media (max-width: 420px)": {
              left: "53px",
              width: 106,
              top: "30%",
            },

            backgroundColor: completed ? "#27AE60" : "rgba(0,0,0,0.15)",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
        />
      )}

      {/* LABEL */}
      <Typography
        mt={1}
        fontSize={14}
        fontFamily="Rubik"
        color={active ? "#2666BE" : "rgba(0,0,0,0.6)"}
        sx={{
          "@media (max-width: 375px)": {
            fontSize: 12,
            textAlign: "center",
          },
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

const TimeButton = ({ label, onClick }) => (
  <Button
    fullWidth
    variant="outlined"
    onClick={onClick}
    sx={{
      height: 40,
      minWidth: { xs: "136px", sm: "162px", md: "153px" },
      borderRadius: "8px",
      textTransform: "none",
      fontFamily: "Rubik",
      fontSize: "14px",
      fontWeight: 400,
      color: "rgba(0,0,0,0.7)",
      borderColor: "rgba(0,0,0,0.2)",
    }}
  >
    {label}
  </Button>
);

const ScheduleDemo = () => {
  const [isScheduled, setIsScheduled] = React.useState(false);
  const [scheduleData, setScheduleData] = React.useState(null);

  const currentStep = 3;
  const [currentDate, setCurrentDate] = React.useState(new Date(2025, 9, 1));
  const handlePrevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };
  const calendarDates = getCalendarMatrix(currentDate);
  const [selectedDate, setSelectedDate] = React.useState(null);

  const handleNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };
  const [timezoneAnchor, setTimezoneAnchor] = React.useState(null);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [timezone, setTimezone] = React.useState(userTimeZone);
  const open = Boolean(timezoneAnchor);

  const handleTimezoneClick = (event) => {
    setTimezoneAnchor(event.currentTarget);
  };

  const handleTimezoneClose = () => {
    setTimezoneAnchor(null);
  };
  const ALL_TIMEZONES = Intl.supportedValuesOf("timeZone");
  const formatTimezoneLabel = (tz) => {
    const now = new Date();

    const time = now.toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const name = tz.replace("_", " ").split("/").pop();

    return `${name} (${time})`;
  };
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
  const BUSINESS_HOURS = {
    start: 9, // 9 AM
    end: 17, // 5 PM
    slotMinutes: 30, // demo duration
  };

  const generateSlots = (date, timeZone) => {
    const slots = [];
    const { start, end, slotMinutes } = BUSINESS_HOURS;

    let current = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      start,
      0
    );

    while (current.getHours() < end) {
      const localTime = new Date(current.toLocaleString("en-US", { timeZone }));

      slots.push(
        localTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );

      current = new Date(current.getTime() + slotMinutes * 60000);
    }

    return slots;
  };

  const selectedDay = selectedDate
    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate)
    : new Date();

  const allSlots = generateSlots(selectedDay, timezone);

  const timeSlotsLeft = React.useMemo(
    () => allSlots.filter((_, i) => i % 2 === 0),
    [allSlots]
  );

  const timeSlotsRight = React.useMemo(
    () => allSlots.filter((_, i) => i % 2 !== 0),
    [allSlots]
  );

  const handleTimezoneSelect = (value) => {
    setTimezone(value);
    handleTimezoneClose();
  };
  const handleConfirmSchedule = (t) => {
    setScheduleData({
      date: selectedDay,
      time: t,
      timezone,
      duration: 30,
    });
    setIsScheduled(true);
  };

  const navigate = useNavigate();
  const location = useLocation();

  const handleRedirect = (path) => {
    if (location.pathname === path) return;
    navigate(path);
  };

  if (isScheduled && scheduleData) {
    return <ScheduleSuccess state={scheduleData} />;
  }

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "110vh" }}>
      {/* HEADER */}
      <Box
        component="button"
        type="button"
        aria-label="Go to home page"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          height: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #E8E8EC",
          boxShadow: "0px 8px 34px rgba(153,168,190,0.1)",
          bgcolor: "#fff",
          cursor: "pointer",
          border: 0,
          p: 0,
          width: "100%",
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
          maxWidth: { xs: "100%", md: 830 },
          mx: { xs: 0, md: "auto" },
          px: { xs: 0, md: 2 },
          mt: 5,
        }}
      >
        <Typography
          textAlign="center"
          fontFamily="Rubik"
          fontWeight={500}
          lineHeight="120%"
          mb={4}
          sx={{
            fontSize: { xs: 26, sm: 32, md: 42 },
          }}
        >
          Schedule Your Live Demo
        </Typography>

        <Paper
          elevation={3}
          sx={{
            borderRadius: { xs: 0, md: 4 },
            overflow: "hidden",
          }}
        >
          {/* STEPS */}

          <Stack
            direction="row"
            justifyContent="center"
            alignItems="flex-start"
            py={3}
            spacing={0}
            borderBottom="1px solid rgba(0,0,0,0.1)"
          >
            <StepItem label="Request Demo" step={1} currentStep={currentStep} />

            <StepItem
              label="Confirm Email"
              step={2}
              currentStep={currentStep}
            />

            <StepItem
              label="Schedule Demo"
              step={3}
              currentStep={currentStep}
              isLast
            />
          </Stack>

          <Grid container>
            {/* CALENDAR */}
            <Grid
              item
              xs={12}
              md={7}
              sx={{
                borderRight: { md: "1px solid rgba(0,0,0,0.1)" },
                p: 3,
              }}
            >
              <Typography
                fontSize={20}
                fontWeight={500}
                mb={3}
                fontFamily="Rubik"
                lineHeight="130%"
                textAlign="left"
              >
                Select a Date & Time
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={3}
              >
                {/* LEFT ARROW */}
                <IconButton
                  onClick={handlePrevMonth}
                  aria-label="Show previous month"
                  sx={{
                    width: 36,
                    height: 36,
                  }}
                >
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>

                {/* MONTH LABEL */}
                <Typography
                  fontWeight={500}
                  fontFamily="Rubik"
                  color="rgba(0,0,0,0.7)"
                >
                  {getMonthYearLabel(currentDate)}
                </Typography>

                {/* RIGHT ARROW (BLUE CIRCLE) */}
                <IconButton
                  onClick={handleNextMonth}
                  aria-label="Show next month"
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "#F0F6FE",
                    "&:hover": {
                      bgcolor: "#E3EEFD",
                    },
                  }}
                >
                  <ArrowForwardIosIcon
                    fontSize="small"
                    sx={{ color: "#2666BE" }}
                  />
                </IconButton>
              </Stack>

              {/* ================= MOBILE ONLY ================= */}
              <Box
                sx={{
                  display: { xs: "grid", sm: "none" },
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  columnGap: { xs: "18px", sm: 1 },
                }}
              >
                {days.map((day, colIndex) => (
                  <Box key={day}>
                    <Typography fontSize={12} textAlign="center" mb={1}>
                      {day}
                    </Typography>

                    <Stack spacing={1} alignItems="center">
                      {calendarDates.map((week, rowIndex) => {
                        const date = week[colIndex];
                        if (!date) return <Box key={rowIndex} height={44} />;

                        return (
                          <Box
                            key={rowIndex}
                            onClick={() => setSelectedDate(date)}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              bgcolor:
                                date === selectedDate
                                  ? "#2666BE"
                                  : date >= 23
                                  ? "#F0F6FE"
                                  : "transparent",
                              color:
                                date === selectedDate
                                  ? "#fff"
                                  : date >= 23
                                  ? "#2666BE"
                                  : "rgba(0,0,0,0.7)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {date}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Box>
              {/* ================= DESKTOP / TABLET ================= */}
              <Grid
                container
                spacing={1}
                sx={{ display: { xs: "none", sm: "flex" } }} // ✅ visible only on desktop
              >
                {days.map((day, colIndex) => (
                  <Grid item xs key={day}>
                    <Typography
                      fontSize={12}
                      color="rgba(0,0,0,0.6)"
                      textAlign="center"
                      mb={1}
                    >
                      {day}
                    </Typography>

                    <Stack spacing={1} alignItems="center">
                      {calendarDates.map((week, rowIndex) => {
                        const date = week[colIndex];
                        if (!date) return <Box key={rowIndex} height={44} />;

                        return (
                          <Box
                            key={rowIndex}
                            onClick={() => setSelectedDate(date)}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: "50%",
                              bgcolor:
                                date === selectedDate
                                  ? "#2666BE"
                                  : date >= 23
                                  ? "#F0F6FE"
                                  : "transparent",
                              color:
                                date === selectedDate
                                  ? "#fff"
                                  : date >= 23
                                  ? "#2666BE"
                                  : "rgba(0,0,0,0.7)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {date}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* TIME SLOTS */}
            <Grid item xs={12} md={5} p={3}>
              <Divider
                sx={{
                  mb: 2,
                  borderColor: "rgba(0,0,0,0.12)",
                  display: { xs: "block", md: "none", sm: "none" },
                }}
              />

              <Typography
                fontWeight={500}
                color="rgba(0,0,0,0.6)"
                fontFamily="Rubik"
                fontSize="16px"
                lineHeight="150%"
                textAlign="left"
              >
                Meeting duration
              </Typography>

              <Paper
                sx={{
                  mt: 1,
                  mb: 3,
                  px: 1,
                  py: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "7.98px",
                  bgcolor: "#F0F6FE",
                  borderRadius: "8px",

                  width: {
                    xs: "100%",
                    sm: "100%",
                  },
                }}
              >
                <AccessTimeIcon fontSize="small" />

                <Typography
                  sx={{
                    fontFamily: "Rubik",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "150%",
                    color: "rgba(0, 0, 0, 0.7)",
                  }}
                >
                  30 min
                </Typography>
              </Paper>

              <Typography
                fontWeight={500}
                color="rgba(0,0,0,0.6)"
                sx={{
                  fontFamily: "Rubik",
                  fontWeight: "500",
                  fontSize: "16px",
                  textAlign: "left",
                }}
              >
                What time works best?
              </Typography>
              <Typography
                mb={2}
                mt={1}
                sx={{
                  width: "100%",
                  textAlign: "left",
                  display: "block",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontFamily: "Rubik",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "150%",
                    color: "rgba(0, 0, 0, 0.7)",
                  }}
                >
                  Showing times for{" "}
                </Box>

                <Box
                  component="span"
                  sx={{
                    fontFamily: "Rubik",
                    fontWeight: 500,
                    fontSize: "16px",
                    lineHeight: "150%",
                    color: "rgba(0, 0, 0, 0.7)",
                  }}
                >
                  October 22, 2025
                </Box>
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                mb={2}
                sx={{ cursor: "pointer" }}
                onClick={handleTimezoneClick}
              >
                <img
                  src={globe}
                  alt=""
                  width={20}
                  height={20}
                  loading="lazy"
                  decoding="async"
                />

                <Typography color="#2666BE" fontWeight={400}>
                  {getFriendlyTimezoneLabel(timezone)}
                </Typography>

                <ArrowForwardIosIcon
                  sx={{
                    fontSize: 14,
                    color: "#2666BE",
                    transform: open ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "0.2s",
                  }}
                />
              </Stack>
              <Menu
                anchorEl={timezoneAnchor}
                open={open}
                onClose={handleTimezoneClose}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    minWidth: 260,
                  },
                }}
              >
                {ALL_TIMEZONES.map((tz) => (
                  <MenuItem
                    key={tz}
                    onClick={() => handleTimezoneSelect(tz)}
                    sx={{
                      fontFamily: "Rubik",
                      fontSize: 14,
                    }}
                  >
                    {formatTimezoneLabel(tz)}
                  </MenuItem>
                ))}
              </Menu>

              <Box
                sx={{
                  maxHeight: 220,
                  overflowY: "auto",
                  pr: 1,
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Stack spacing="10px">
                      {timeSlotsLeft.map((t) => (
                        <TimeButton
                          key={t}
                          label={t}
                          onClick={() => handleConfirmSchedule(t)}
                        />
                      ))}
                    </Stack>
                  </Grid>

                  <Grid item xs={6}>
                    <Stack spacing="10px">
                      {timeSlotsRight.map((t) => (
                        <TimeButton
                          key={t}
                          label={t}
                          onClick={() => handleConfirmSchedule(t)}
                        />
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default ScheduleDemo;

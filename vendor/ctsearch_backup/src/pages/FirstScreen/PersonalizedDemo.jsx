import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import { CalenderLine } from "../../assets";
import BluePointer from "../../assets/blue_pointer.svg";
import CountrySelect from "../../common/CountrySelect";
import { useFirstScreenStyles } from "./firstScreenStyles";

const BulletItem = ({ text }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      mb: "6px",
    }}
  >
    <Box
      component="img"
      src={BluePointer}
      alt="bullet"
      sx={{
        width: 18,
        height: 18,
        mt: "9px", // aligns pointer with text baseline
        flexShrink: 0, // prevents wrapping issues
      }}
    />

    <Typography
      sx={{
        fontSize: 18,
        fontWeight: 400,
        fontFamily: "Rubik",
        color: "rgba(255, 255, 255, 0.8)",
        lineHeight: "28px",
        textAlign: "left",
      }}
    >
      {text}
    </Typography>
  </Box>
);

const PersonalizedDemo = () => {
  const classes = useFirstScreenStyles();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [emailHelper, setEmailHelper] = useState("");
  const [country, setCountry] = useState("");
  const validateEmail = (value) => {
    if (!value) {
      // 🔑 EMPTY → no error
      setEmailError(false);
      setEmailHelper("");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      setEmailError(true);
      setEmailHelper("Please enter a valid email address.");
    } else {
      setEmailError(false);
      setEmailHelper("");
    }
  };

  return (
    <Box
      sx={{
        background: "rgba(12, 32, 59, 1)",
        color: "white",
        // p: { xs: 3, md: 6 },
        px: "7%",
        py: "4%",
      }}
    >
      <Grid
        container
        spacing={6}
        sx={{
          maxWidth: "100%",
          margin: "0 auto",
        }}
      >
        {/* LEFT CONTENT BLOCK */}
        <Grid item size={{ xs: 12, md: 6 }}>
          <Typography
            sx={{
              fontSize: { xs: "26px", md: "42px" },
              fontWeight: 500,
              fontFamily: "Rubik",
              mb: 2,
              color: "rgba(255, 255, 255, 1)",
              textAlign: "left",
              lineHeight: "120%",
            }}
          >
            Book Your Demo
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: "18px", md: "20px" },
              fontWeight: 400,
              fontFamily: "Rubik",
              color: "rgba(255, 255, 255, 0.8)",
              textAlign: "left",
              mb: 2,
              lineHeight: { xs: "26px", md: "30px" },
            }}
          >
            Discover how leading oncology teams make safer, faster trial
            decisions using structured evidence and instant cross-trial
            analytics.
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: "16px", md: "18px" },
              fontWeight: 400,
              fontFamily: "Rubik",
              color: "rgba(255, 255, 255, 0.8)",
              textAlign: "left",
              mb: 2,
              lineHeight: { xs: "24px", md: "28px" },
            }}
          >
            In this 30-minute session, we’ll walk through your indication,
            competitors, and draft protocol to show how OncoSuite helps teams:
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <BulletItem text="Identify protocol, population, and comparator risks before governance" />
            <BulletItem text="Benchmark endpoints, arms, and design choices against 100+ precedent studies" />
            <BulletItem text="Reveal competitor design shifts months before they appear in publications" />
            <BulletItem text="Strengthen feasibility with evidence-backed site and population insights" />
            <BulletItem text="Replace fragmented spreadsheets with harmonized oncology intelligence" />
          </Box>
          <Typography
            sx={{
              fontSize: { xs: "16px", md: "18px" },
              fontWeight: 400,
              fontFamily: "Rubik",
              color: "rgba(255, 255, 255, 0.8)",
              textAlign: "left",
              mb: 2,
              lineHeight: { xs: "24px", md: "28px" },
            }}
          >
            You’ll walk away with decision-ready insights for your exact
            program, not generic slides.
          </Typography>
        </Grid>

        {/* Small Feature Cards */}
        {/* FULL WIDTH INFO STRIP */}

        {/* RIGHT FORM BLOCK */}
        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={3}
            sx={{
              borderRadius: 3,
              p: 4,
            }}
          >
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  className={classes.textField}
                  fullWidth
                  placeholder="First Name *"
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  className={classes.textField}
                  fullWidth
                  placeholder="Last Name *"
                />
              </Grid>
              <Grid item size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  placeholder="Email *"
                  type="email"
                  value={email}
                  className={classes.textField}
                  error={emailError}
                  helperText={emailHelper || " "}
                  FormHelperTextProps={{
                    sx: { minHeight: "20px" }, // prevents layout jump
                  }}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => validateEmail(e.target.value)}
                />
              </Grid>

              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  className={classes.textField}
                  fullWidth
                  placeholder="Organization *"
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  className={classes.textField}
                  fullWidth
                  placeholder="Job Title *"
                />
              </Grid>

              <Grid item size={{ xs: 12 }}>
                <CountrySelect
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  label="Choose Country"
                  flag={true}
                  width="100%"
                />
              </Grid>

              <Grid width={"100%"} item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  className={classes.textField}
                  placeholder="Anything specific you'd like us to show?"
                />
              </Grid>
              <Typography
                sx={{
                  lineHeight: "20px",
                  fontSize: "14px",
                  fontFamily: "Rubik",
                  fontWeight: "400",
                  textAlign: "left",
                  color: "rgba(0, 0, 0, 0.7)",
                }}
              >
                OncoSuite Insights may contact you with updates on relevant
                research, features, and services. You can manage your
                communication preferences or opt out anytime through our
                Preference Center
              </Typography>
              <Typography
                sx={{
                  lineHeight: "20px",
                  fontSize: "14px",
                  fontFamily: "Rubik",
                  fontWeight: "400",
                  textAlign: "left",
                  color: "rgba(0, 0, 0, 0.7)",
                }}
              >
                Your information will be handled in accordance with our
                <strong
                  style={{
                    cursor: "pointer",
                    fontWeight: "500",
                    textDecoration: "underline",
                  }}
                >
                  {" "}
                  Privacy Policy.
                </strong>
              </Typography>

              <Grid width={"100%"} item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    background: "rgba(38, 102, 190, 1)",
                    py: 1.4,
                    fontSize: 18,
                    borderRadius: 2,
                    textAlign: "center",
                    textTransform: "capitalize",
                    fontFamily: "Rubik",
                    fontWeight: "400",
                    width: "100%",
                    gap: "10px",
                  }}
                >
                  <img
                    src={CalenderLine}
                    alt="calendar"
                    style={{ width: 18, height: 18, objectFit: "contain" }}
                  />{" "}
                  Schedule Your Personalized Demo
                </Button>
              </Grid>
              <Typography
                sx={{
                  lineHeight: "20px",
                  fontSize: "14px",
                  fontFamily: "Rubik",
                  fontWeight: "400",
                  textAlign: "center",
                  color: "rgba(0, 0, 0, 0.5)",
                }}
              >
                No pressure. No sales pitch. Just real insights tailored to your
                team.
              </Typography>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              maxWidth: "100%",
              mx: "auto",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "12px",
              px: { xs: 3, md: "4%" },
              py: { xs: 3, md: "4%" },
              boxShadow: "0px 8px 34px rgba(153,169,190,0.10)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "26px", md: "32px" },
                  fontFamily: "Rubik",
                  fontWeight: 400,
                  color: "#FFFFFF",
                  whiteSpace: { xs: "normal", md: "nowrap" },
                  lineHeight: "120%",
                }}
              >
                What You’ll Get
              </Typography>

              {/* HORIZONTAL LINE */}
              <Box
                sx={{
                  flex: 1,
                  height: "1px",
                  background: "rgba(255,255,255,0.15)",
                  display: { xs: "none", md: "block" },
                }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                alignItems: "stretch",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1px 1fr 1px 1fr",
                },
                columnGap: { xs: 0, md: 3 },
                rowGap: { xs: 0, md: 2 },
              }}
            >
              <Box>
                <Typography sx={titleStyle}>
                  Evidence for Design Decisions
                </Typography>
                <Typography sx={descStyle}>
                  Instant precedent analysis across endpoints, comparators,
                  arms, and eligibility.
                </Typography>
              </Box>
              <Box
                sx={{
                  display: { xs: "block", md: "none" },
                  height: "1px",
                  background: "rgba(255,255,255,0.15)",
                  my: 2,
                }}
              />

              <Box sx={dividerCol} />

              <Box>
                <Typography sx={titleStyle}>
                  Operational & Feasibility Intelligence
                </Typography>
                <Typography sx={descStyle}>
                  Site performance, enrollment risk, and population fit in one
                  structured view.
                </Typography>
              </Box>
              <Box
                sx={{
                  display: { xs: "block", md: "none" },
                  height: "1px",
                  background: "rgba(255,255,255,0.15)",
                  my: 2,
                }}
              />
              <Box sx={dividerCol} />

              <Box>
                <Typography sx={titleStyle}>
                  Competitive & Portfolio Insight
                </Typography>
                <Typography sx={descStyle}>
                  Cross-MoA trends, pipeline shifts, and early competitor
                  indicators.
                </Typography>
              </Box>
            </Box>

            {/* OUTCOMES */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mt: 5,
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "26px", md: "32px" },
                  fontFamily: "Rubik",
                  fontWeight: 400,
                  color: "#FFFFFF",
                  whiteSpace: { xs: "normal", md: "nowrap" },
                  lineHeight: "120%",
                  textAlign: "left",
                }}
              >
                Outcomes for Your Team
              </Typography>

              {/* HORIZONTAL LINE */}
              <Box
                sx={{
                  flex: 1,
                  height: "1px",
                  background: "rgba(255,255,255,0.15)",
                  display: { xs: "none", md: "block" },
                }}
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1px 1fr 1px 1fr",
                },

                columnGap: { xs: 0, md: 3 },
                rowGap: { xs: 0, md: 2 },
              }}
            >
              <Typography sx={titleStyle}>
                Fewer amendments and faster feasibility cycles
              </Typography>
              <Box
                sx={{
                  display: { xs: "block", md: "none" },
                  height: "1px",
                  background: "rgba(255,255,255,0.15)",
                  my: 2,
                }}
              />
              <Box sx={dividerCol} />

              <Typography sx={titleStyle}>
                Higher probability of Oncology trial success
              </Typography>
              <Box
                sx={{
                  display: { xs: "block", md: "none" },
                  height: "1px",
                  background: "rgba(255,255,255,0.15)",
                  my: 2,
                }}
              />
              <Box sx={dividerCol} />

              <Typography sx={titleStyle}>
                Earlier awareness of competitor activity
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
const titleStyle = {
  fontSize: "20px",
  fontFamily: "Rubik",
  fontWeight: 500,
  color: "rgba(255,255,255,0.95)",
  lineHeight: "130%",
  textAlign: "left",
};
const dividerCol = {
  width: "1px",
  background: "rgba(255,255,255,0.15)",
  display: { xs: "none", md: "block" },
};

const descStyle = {
  fontSize: "16px",
  fontFamily: "Rubik",
  fontWeight: 400,
  color: "rgba(255,255,255,0.75)",
  lineHeight: "24px",
  mt: 0.5,
  textAlign: "left",
};

export default PersonalizedDemo;

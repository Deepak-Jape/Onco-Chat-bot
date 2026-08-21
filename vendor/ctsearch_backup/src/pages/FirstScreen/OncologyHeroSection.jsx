import React from "react";
import { Box, Button, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { makeStyles } from "@mui/styles";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import {
  screenThumbnail,
  HomePageBottomImg1,
  HomePageBottomImg2,
  HomePageBottomImg3,
} from "../../assets";

const useStyles = makeStyles(() => ({
  root: {
    width: "100%",
    background: "#F7F7F8",
    overflow: "hidden",
  },

  container: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "72px 6% 64px",
    boxSizing: "border-box",
    "@media (max-width: 1200px)": {
      padding: "60px 5% 54px",
    },
    "@media (max-width: 900px)": {
      padding: "24px 16px 28px",
    },
    "@media (max-width: 600px)": {
      padding: "20px 12px 22px",
    },
  },

  gridRoot: {
    alignItems: "center",
  },

  leftCol: {
    display: "flex",
    alignItems: "center",
  },

  contentWrap: {
    width: "100%",
    maxWidth: "610px",
    "@media (max-width: 900px)": {
      maxWidth: "100%",
    },
  },

  eyebrow: {
    fontFamily: "Rubik, sans-serif !important",
    fontWeight: "600 !important",
    fontSize: "18px !important",
    lineHeight: "145% !important",
    color: "#2666BE",
    textTransform: "uppercase",
    marginBottom: "18px !important",
    "@media (max-width: 1200px)": {
      fontSize: "16px !important",
    },
    "@media (max-width: 600px)": {
      fontSize: "12px !important",
      lineHeight: "145% !important",
      marginBottom: "12px !important",
    },
  },

  title: {
    fontFamily: "Rubik, sans-serif !important",
    fontWeight: "600 !important",
    fontSize: "58px !important",
    lineHeight: "112% !important",
    letterSpacing: "-0.02em",
    color: "rgba(0,0,0,0.78)",
    marginBottom: "18px !important",
    "@media (max-width: 1200px)": {
      fontSize: "50px !important",
    },
    "@media (max-width: 1000px)": {
      fontSize: "44px !important",
    },
    "@media (max-width: 600px)": {
      fontSize: "28px !important",
      lineHeight: "118% !important",
      marginBottom: "12px !important",
    },
  },

  description: {
    fontFamily: "Rubik, sans-serif !important",
    fontWeight: "400 !important",
    fontSize: "18px !important",
    lineHeight: "170% !important",
    color: "rgba(0,0,0,0.60)",
    maxWidth: "610px",
    marginBottom: "26px !important",
    "@media (max-width: 1200px)": {
      fontSize: "17px !important",
    },
    "@media (max-width: 600px)": {
      fontSize: "15px !important",
      lineHeight: "165% !important",
      marginBottom: "18px !important",
    },
  },

  descStrong: {
    fontWeight: "600 !important",
    color: "rgba(0,0,0,0.72)",
  },

  buttonRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    "@media (max-width: 600px)": {
      flexDirection: "column",
      alignItems: "stretch",
      gap: "10px",
    },
  },

  primaryBtn: {
    minWidth: "180px",
    height: "56px",
    padding: "0 28px !important",
    background: "#2666BE !important",
    color: "#FFFFFF !important",
    borderRadius: "8px !important",
    fontFamily: "Rubik, sans-serif !important",
    fontWeight: "500 !important",
    fontSize: "18px !important",
    textTransform: "none !important",
    boxShadow: "none !important",
    whiteSpace: "nowrap",
    transition: "background-color 200ms ease",
    "&:hover": {
      background: "rgba(28, 77, 142, 1) !important",
      color: "#FFFFFF !important",
      boxShadow: "none !important",
    },
    "@media (max-width: 600px)": {
      width: "100%",
      minWidth: 0,
      height: "46px",
      fontSize: "15px !important",
    },
  },

  secondaryBtn: {
    minWidth: "278px",
    height: "56px",
    padding: "0 24px !important",
    border: "2px solid #2666BE !important",
    background: "#F0F6FE !important",
    color: "#2666BE !important",
    borderRadius: "8px !important",
    fontFamily: "Rubik, sans-serif !important",
    fontWeight: "500 !important",
    fontSize: "18px !important",
    textTransform: "none !important",
    boxShadow: "none !important",
    whiteSpace: "nowrap",
    "& .MuiButton-startIcon": {
      marginRight: "8px",
    },
    "&:hover": {
      background: "#E8F0FC !important",
      boxShadow: "none !important",
      border: "2px solid #2666BE !important",
    },
    "@media (max-width: 600px)": {
      width: "100%",
      minWidth: 0,
      height: "46px",
      fontSize: "15px !important",
      padding: "0 14px !important",
    },
  },

  rightCol: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 0,
  },

  /**
   * DESKTOP + MOBILE MEDIA AREA
   * This keeps the section visible on desktop
   * and avoids collapsing due to absolute children.
   */
  mediaShell: {
    width: "100%",
    maxWidth: "620px",
    position: "relative",
    flexShrink: 0,
    "@media (max-width: 900px)": {
      maxWidth: "100%",
      marginTop: "6px",
    },
  },

  desktopMediaArea: {
    position: "relative",
    width: "100%",
    height: "430px",
    display: "block",
    "@media (max-width: 1200px)": {
      height: "395px",
    },
    "@media (max-width: 900px)": {
      display: "none",
    },
  },

  mobileMediaArea: {
    display: "none",
    "@media (max-width: 900px)": {
      display: "block",
      position: "relative",
      width: "100%",
      paddingBottom: "54px",
    },
  },

  mainFrameDesktop: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "88%",
    maxWidth: "540px",
    borderRadius: "4px",
    overflow: "hidden",
    background: "#FFFFFF",
    border: "1px solid #D7E4F8",
    boxShadow: "0px 10px 28px rgba(0,0,0,0.08)",
    zIndex: 1,
  },

  mainFrameMobile: {
    position: "relative",
    width: "100%",
    borderRadius: "4px",
    overflow: "hidden",
    background: "#FFFFFF",
    border: "1px solid #D7E4F8",
    boxShadow: "0px 10px 28px rgba(0,0,0,0.08)",
    zIndex: 1,
  },

  thumbnailWrap: {
    position: "relative",
    width: "100%",
  },

  thumbnail: {
    display: "block",
    width: "100%",
    height: "auto",
    aspectRatio: "620 / 390",
    objectFit: "cover",
    background: "#fff",
  },

  playOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },

  playCircle: {
    width: "78px",
    height: "78px",
    borderRadius: "50%",
    background: "rgba(0,0,0,0.38)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "@media (max-width: 600px)": {
      width: "58px",
      height: "58px",
    },
  },

  /**
   * DESKTOP PREVIEW CARDS
   */
  desktopBarCard: {
    position: "absolute",
    left: "-2px",
    bottom: "8px",
    width: "44%",
    maxWidth: "235px",
    borderRadius: "4px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0px 12px 28px rgba(0,0,0,0.12)",
    zIndex: 4,
  },

  desktopScatterCard: {
    position: "absolute",
    right: "11%",
    bottom: "14px",
    width: "24%",
    maxWidth: "145px",
    borderRadius: "4px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0px 12px 28px rgba(0,0,0,0.12)",
    zIndex: 5,
  },

  desktopMiniCard: {
    position: "absolute",
    right: "-7%",
    bottom: "16px",
    width: "13%",
    maxWidth: "92px",
    borderRadius: "4px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0px 12px 28px rgba(0,0,0,0.10)",
    zIndex: 2,
  },

  /**
   * MOBILE PREVIEW CARDS
   */
  mobileBarCard: {
    position: "absolute",
    left: "2%",
    bottom: "-4px",
    width: "46%",
    borderRadius: "4px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0px 12px 28px rgba(0,0,0,0.12)",
    zIndex: 4,
  },

  mobileScatterCard: {
    position: "absolute",
    right: "8%",
    bottom: "0px",
    width: "25%",
    borderRadius: "4px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0px 12px 28px rgba(0,0,0,0.12)",
    zIndex: 5,
  },

  mobileMiniCard: {
    position: "absolute",
    right: "-2%",
    bottom: "2px",
    width: "14%",
    borderRadius: "4px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0px 12px 28px rgba(0,0,0,0.10)",
    zIndex: 2,
  },

  previewImg: {
    display: "block",
    width: "100%",
    height: "auto",
    objectFit: "cover",
    background: "#fff",
  },
}));

export default function OncologyHeroSection({
  onBookDemo,
  onWatchWalkthrough,
  pharmaText = "FOR PHARMA & BIOTECH: SOLID TUMORS • HEMATOLOGY • RARE CANCERS",
  primaryButtonText = "Book Your Demo",
  secondaryButtonText = "Watch 60-Second Walkthrough",
}) {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <Box className={classes.container}>
        <Grid container spacing={4} className={classes.gridRoot}>
          <Grid item xs={12} md={6} className={classes.leftCol}>
            <Box className={classes.contentWrap}>
              <Typography className={classes.eyebrow}>{pharmaText}</Typography>

              <Typography className={classes.title}>
                Better Oncology Intelligence.
                <br />
                Faster Time to Market.
              </Typography>

              <Typography className={classes.description}>
                Move past generic legacy datasets. OncoSuite unifies{" "}
                <Box component="span" className={classes.descStrong}>
                  Patient, Trial, and Site Intelligence
                </Box>{" "}
                into a deeply granular oncology taxonomy. From protocol design and
                site feasibility to competitive strategy, get pre-calculated analytics
                and{" "}
                <Box component="span" className={classes.descStrong}>
                  1-click traceable evidence
                </Box>{" "}
                to advance your pipeline with absolute certainty.
              </Typography>

              <Box className={classes.buttonRow}>
                <Button
                  variant="contained"
                  className={classes.primaryBtn}
                  onClick={onBookDemo}
                >
                  {primaryButtonText}
                </Button>

                <Button
                  variant="outlined"
                  className={classes.secondaryBtn}
                  startIcon={<PlayArrowIcon />}
                  onClick={onWatchWalkthrough}
                >
                  {secondaryButtonText}
                </Button>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6} className={classes.rightCol}>
            <Box className={classes.mediaShell}>
              {/* Desktop */}
              <Box className={classes.desktopMediaArea}>
                <Box className={classes.mainFrameDesktop}>
                  <Box className={classes.thumbnailWrap}>
                    <img
                      src={screenThumbnail}
                      alt="OncoSuite walkthrough"
                      className={classes.thumbnail}
                    />
                    <Box className={classes.playOverlay}>
                      <Box className={classes.playCircle}>
                        <svg
                          width="34"
                          height="34"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M8 5V19L18 12L8 5Z"
                            fill="#FFFFFF"
                            stroke="#FFFFFF"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        </svg>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box className={classes.desktopBarCard}>
                  <img
                    src={HomePageBottomImg1}
                    alt="Preview bar chart"
                    className={classes.previewImg}
                  />
                </Box>

                <Box className={classes.desktopScatterCard}>
                  <img
                    src={HomePageBottomImg2}
                    alt="Preview scatter chart"
                    className={classes.previewImg}
                  />
                </Box>

                <Box className={classes.desktopMiniCard}>
                  <img
                    src={HomePageBottomImg3}
                    alt="Preview mini chart"
                    className={classes.previewImg}
                  />
                </Box>
              </Box>

              {/* Mobile */}
              <Box className={classes.mobileMediaArea}>
                <Box className={classes.mainFrameMobile}>
                  <Box className={classes.thumbnailWrap}>
                    <img
                      src={screenThumbnail}
                      alt="OncoSuite walkthrough"
                      className={classes.thumbnail}
                    />
                    <Box className={classes.playOverlay}>
                      <Box className={classes.playCircle}>
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M8 5V19L18 12L8 5Z"
                            fill="#FFFFFF"
                            stroke="#FFFFFF"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        </svg>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box className={classes.mobileBarCard}>
                  <img
                    src={HomePageBottomImg1}
                    alt="Preview bar chart"
                    className={classes.previewImg}
                  />
                </Box>

                <Box className={classes.mobileScatterCard}>
                  <img
                    src={HomePageBottomImg2}
                    alt="Preview scatter chart"
                    className={classes.previewImg}
                  />
                </Box>

                <Box className={classes.mobileMiniCard}>
                  <img
                    src={HomePageBottomImg3}
                    alt="Preview mini chart"
                    className={classes.previewImg}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

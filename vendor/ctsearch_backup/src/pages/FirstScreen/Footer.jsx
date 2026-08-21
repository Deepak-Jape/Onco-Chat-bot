import { Box, Divider, Grid, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import FacebookLogo from "../../assets/logo/Facebook.svg";
import LinkedinLogo from "../../assets/logo/Linkedin.svg";
import OncoSuiteWhiteLogo from "../../assets/logo/footer_logo.png";
import TwitterLogo from "../../assets/logo/Twitter.svg";

const Footer = () => {
  const location = useLocation();

  const handleRedirect = (path) => {
    if (location.pathname === path) return;
    window.location.assign(path);
  };

  const sectionTitleStyle = {
    fontSize: 20,
    fontFamily: "Rubik",
    fontWeight: 500,
    lineHeight: "24px",
    letterSpacing: "0px",
    color: "rgba(255,255,255,1)",
    marginBottom: "12px",
  };

  const footerLinkStyle = {
    fontSize: 16,
    fontFamily: "Rubik",
    fontWeight: 400,
    letterSpacing: "0px",
    cursor: "pointer",
    color: "rgba(255,255,255,0.8)",
    lineHeight: "24px",
    "&:hover": { color: "#FFFFFF" },
  };

  const legalLinkStyle = {
    fontSize: 16,
    fontFamily: "Rubik",
    fontWeight: 400,
    letterSpacing: "0px",
    cursor: "pointer",
    color: "rgba(255,255,255,0.6)",
    lineHeight: "20px",
    "&:hover": { color: "rgba(255,255,255,0.8)" },
  };

  return (
    <Box
      component="footer"
      sx={{
        "@media (min-width: 1750px)": {
          padding: "0 5%",
        },
      }}
    >
      <Box
        sx={{
          color: "rgba(255, 255, 255, 0.8)",
          background: "rgba(12, 32, 59, 1)",
          position: "relative",
          boxShadow: "0 0 0 100vmax rgba(12, 32, 59, 1)",
          // Clip the side bleed only. A vertical inset of exactly 0 cuts the
          // spread shadow flush with the box's top edge, and that cut
          // antialiases into a faint light seam against the section above.
          // Extending the top of the clip region removes the edge entirely;
          // the bottom stays at 0 so the shadow can't spill past the footer.
          clipPath: "inset(-1px -100vmax 0)",
          px: { xs: "4%", md: "5%" },
          py: { xs: 4, md: 3 },
        }}
      >
        <Grid
          container
          spacing={4}
          justifyContent="space-between"
          sx={{ flexDirection: { xs: "column", lg: "row" } }}
        >
          <Grid item xs={12} md={12} lg={4}>
            <Box sx={{ textAlign: "left" }}>
              <img
                src={OncoSuiteWhiteLogo}
                alt="OncoSuite Logo"
                width={204}
                height={39.39}
                loading="lazy"
                decoding="async"
              />

              <Typography
                sx={{
                  mt: 2,
                  maxWidth: 520,
                  fontSize: 16,
                  fontFamily: "Rubik",
                  fontWeight: 400,
                  lineHeight: "26px",
                  textAlign: "left",
                  color: "rgba(255, 255, 255, 0.8)",
                }}
              >
                Empowering oncology teams to make faster, data-driven decisions
                backed by the most accurate, structured clinical trial
                intelligence.
              </Typography>

              <Box sx={{ display: "flex", gap: "14px", mt: 2 }}>
                <img
                  src={LinkedinLogo}
                  alt="LinkedIn"
                  width={32}
                  height={32}
                  loading="lazy"
                  decoding="async"
                />
                <img
                  src={TwitterLogo}
                  alt="Twitter"
                  width={32}
                  height={32}
                  loading="lazy"
                  decoding="async"
                />
                <img
                  src={FacebookLogo}
                  alt="Facebook"
                  width={32}
                  height={32}
                  loading="lazy"
                  decoding="async"
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={12} lg={2} sx={{ textAlign: "left" }}>
            <Typography sx={sectionTitleStyle}>Platform</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Typography
                sx={{
                  ...footerLinkStyle,
                  color:
                    location.pathname === "/patient-intelligence"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.8)",
                }}
                onClick={() => handleRedirect("/patient-intelligence")}
                role="button"
              >
                Patient Intelligence
              </Typography>
                             <Typography
                sx={{
                  ...footerLinkStyle,
                  color:
                    location.pathname === "/site-intelligence"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.8)",
                }}
                onClick={() => handleRedirect("/drug-intelligence")}
                role="button"
              >
                Drug Intelligence
              </Typography>
              <Typography
                sx={{
                  ...footerLinkStyle,
                  color:
                    location.pathname === "/trial-intelligence"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.8)",
                }}
                onClick={() => handleRedirect("/trial-intelligence")}
                role="button"
              >
                Trial Intelligence
              </Typography>
              <Typography
                sx={{
                  ...footerLinkStyle,
                  color:
                    location.pathname === "/site-intelligence"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.8)",
                }}
                onClick={() => handleRedirect("/site-intelligence")}
                role="button"
              >
                Site Intelligence
              </Typography>
                            <Typography
                sx={{
                  ...footerLinkStyle,
                  color:
                    location.pathname === "/site-intelligence"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.8)",
                }}
                onClick={() => handleRedirect("/ai-agents")}
                role="button"
              >
                AI Agents
              </Typography>

            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={12} lg={2} sx={{ textAlign: "left" }}>
            <Typography sx={sectionTitleStyle}>Solutions</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Typography
                sx={{
                  ...footerLinkStyle,
                  color:
                    location.pathname === "/clinical-development"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.8)",
                }}
                onClick={() => handleRedirect("/clinical-development")}
                role="button"
              >
                Clinical Development
              </Typography>
              <Typography
                sx={{
                  ...footerLinkStyle,
                  color:
                    location.pathname === "/clinical-operations"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.8)",
                }}
                onClick={() => handleRedirect("/clinical-operations")}
                role="button"
              >
                Clinical Operations
              </Typography>
              <Typography
                sx={{
                  ...footerLinkStyle,
                  color:
                    location.pathname === "/medical-affairs"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.8)",
                }}
                onClick={() => handleRedirect("/medical-affairs")}
                role="button"
              >
                Medical Affairs & CI
              </Typography>
              <Typography
                sx={{
                  ...footerLinkStyle,
                  color:
                    location.pathname === "/portfolio-management"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.8)",
                }}
                onClick={() => handleRedirect("/portfolio-management")}
                role="button"
              >
                Asset, Portfolio <br /> Strategy & BD
              </Typography>
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            sm={12}
            md={12}
            lg={2}
            sx={{ textAlign: "left" }}
          >
            <Typography sx={sectionTitleStyle}>Resources</Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                alignItems: "flex-start",
              }}
            >
              <Typography
                sx={{
                  ...footerLinkStyle,
                  color:
                    location.pathname === "/about"
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.8)",
                }}
                onClick={() => handleRedirect("/about")}
                role="button"
              >
                About Us
              </Typography>
              <Typography sx={footerLinkStyle}>Blog</Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,0.1)" }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: { xs: 3, md: 0 },
          }}
        >
          <Typography
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontFamily: "Rubik",
              fontWeight: 400,
              fontSize: 16,
              lineHeight: "20px",
            }}
          >
            © 2026 OncoSuite. All rights reserved.
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              alignItems: "center",
              color: "rgba(255,255,255,0.7)",
              fontFamily: "Rubik",
              fontSize: 13,
            }}
          >
            <Typography
              sx={{
                ...legalLinkStyle,
                color:
                  location.pathname === "/privacy"
                    ? "#FFFFFF"
                    : "rgba(255,255,255,0.6)",
              }}
              role="button"
              onClick={() => handleRedirect("/privacy")}
            >
              Privacy Policy
            </Typography>
            <Box
              aria-hidden="true"
              sx={{
                width: "1px",
                height: "20px",
                backgroundColor: "rgba(255,255,255,0.05)",
                mx: "6px",
              }}
            />
            <Typography
              sx={{
                ...legalLinkStyle,
                cursor: "default",
              }}
            >
              Terms of Service
            </Typography>
            <Box
              aria-hidden="true"
              sx={{
                width: "1px",
                height: "20px",
                backgroundColor: "rgba(255,255,255,0.05)",
                mx: "6px",
              }}
            />
            <Typography
              sx={{
                ...legalLinkStyle,
                cursor: "default",
              }}
            >
              Cookie Policy
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;

import { Box, Typography } from "@mui/material";
import { privacy_policy_colors } from "../../utils/helpers/helper";
import Section from "../../common/CommonAccordionSection";
import Footer from "../FirstScreen/Footer";
import MainHeaderOncoSuite from "../siteIntelligence/MainHeaderOncoSuite";
import AccordionContentRenderer from "./AccordionContentRenderer";  
import { privacyPolicyContent } from "./privacyPolicyContent";
export default function PrivacyPolicy() {
  return (
    <Box>
      {/* FULL PAGE WRAPPER */}
      <Box
        sx={{
          width: "100%",
          backgroundColor: privacy_policy_colors.white100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowX: "hidden",
        }}
      >
        {/* HEADER SECTION */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: privacy_policy_colors.info900,
          }}
        >
          <MainHeaderOncoSuite showSpacer />

          <Box
            sx={{
              px: { xs: 3, sm: 5, md: 8 },
              pt: { xs: "96px", sm: "104px", md: "112px" },
              pb: { xs: 3, sm: 4, md: 5 },
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
          <Typography
            sx={{
              fontFamily: "Rubik",
              fontSize: { xs: "26px", sm: "36px", md: "42px" },
              fontWeight: 600,
              color: "rgba(255, 255, 255, 1)",
              lineHeight: 1.2,
            }}
          >
            Privacy Policy
          </Typography>

          <Typography
            sx={{
              fontFamily: "Rubik",
              fontSize: { xs: "16px", sm: "16px", md: "18px" },
              fontWeight: 400,
              color: "rgba(255,255,255,0.8)",
              lineHeight: { xs: "24px", sm: "26px", md: "28px" },
              textAlign: "center",
              maxWidth: "1140px",
              mx: "auto",
            }}
          >
            OncoSuite (“we,” “our,” or “us”) respects your privacy and is
            committed to protecting your personal information. <br />
            This Privacy Notice explains how we collect, use, disclose, and
            protect personal data when you visit our websites, engage with our
            platform, or interact with us in any other way.
          </Typography>
          </Box>
        </Box>

        {/* MAIN CONTENT WRAPPER */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "1400px",
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 4, sm: 6, md: 8 },
          }}
        >
          {/* LAST UPDATED */}
          <Typography
            sx={{
              fontFamily: "Rubik",
              fontSize: { xs: "24px", sm: "22px", md: "24px" },
              fontWeight: 600,
              color: "rgba(0,0,0,0.8)",
              lineHeight: "120%",
              width: "100%",
              textAlign: "left",
              mb: 2,
            }}
          >
            Last updated October 17, 2025
          </Typography>

          {/* MAIN PARAGRAPH */}
          <Typography
            sx={{
              fontFamily: "Rubik",
              fontSize: { xs: "16px", sm: "16px", md: "18px" },
              fontWeight: 400,
              color: "rgba(0,0,0,0.6)",
              lineHeight: { xs: "24px", sm: "24px", md: "28px" },
              width: "100%",
              textAlign: "left",
              mb: 6,
            }}
          >
            At OncoSuite, we understand that the confidentiality and integrity
            of personal information are essential to the trust you place in us.
            Our mission is to empower oncology professionals with transparent,
            data-driven insights — and we apply the same level of care and rigor
            to how we handle your data. Whether you are visiting our website,
            requesting a demo, or engaging with our platform, we may collect and
            process limited personal information to provide you with an
            efficient, secure, and personalized experience. We use this data
            responsibly — to improve our products, communicate relevant updates,
            and support scientific and business collaboration in the oncology
            research ecosystem. OncoSuite follows strict global data protection
            principles and complies with applicable privacy laws and
            regulations, including the General Data Protection Regulation (GDPR)
            and other regional frameworks. We do not sell personal information,
            and we maintain administrative, technical, and organizational
            safeguards to ensure that your data remains protected at every stage
            of processing. <br />
            This Privacy Notice outlines the types of information we collect,
            how we use it, and the rights you have regarding your personal data.
          </Typography>

          {/* ALL ACCORDIONS (DYNAMIC) */}
          {privacyPolicyContent.sections.map((section, index) => (
            <Section key={index} title={section.title}>
              <AccordionContentRenderer section={section} />
            </Section>
          ))}
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}

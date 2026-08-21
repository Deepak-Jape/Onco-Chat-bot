import React, { Suspense, lazy, useEffect, useState, useRef } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import useScrollRestoration from "./utils/hooks/useScrollRestoration";
import heroBackground from "./assets/bg-1437.jpg";
import heroBackground828 from "./assets/bg-828.jpg";
import heroBackground1242 from "./assets/bg-1242.jpg";
import Footer from "./pages/FirstScreen/Footer";
import MainHeaderOncoSuite from "./pages/siteIntelligence/MainHeaderOncoSuite";

const AboutUsBody = lazy(() => import("./AboutUsBody"));

function AboutUsBodyFallback() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1280px",
        mx: "auto",
        px: { xs: 3, sm: 5, md: "70px" },
        py: { xs: 6, md: 8 },
        minHeight: { xs: "55vh", md: "70vh" },
      }}
    />
  );
}

export default function AboutUs() {
  const { navigateWithScrollSaved, hiddenWhileRestoring } =
    useScrollRestoration();
  const handleBookDemo = () => navigateWithScrollSaved("/book-demo");
  
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const [isZoom110, setIsZoom110] = useState(false);
  
  const isDesktop = useMediaQuery("(min-width:1200px)");
  const useCenteredStoryLayout = isZoomedOut || isDesktop;
  
  const timeoutRef = useRef(null);

  useEffect(() => {
    const updateZoomState = () => {
      if (typeof window === "undefined") return;

      const dpr = window.devicePixelRatio || 1;
      setIsZoomedOut(typeof dpr === "number" && dpr > 0 && dpr < 0.6);

      const viewportScale =
        typeof window.visualViewport?.scale === "number" && window.visualViewport.scale > 0
          ? window.visualViewport.scale
          : null;

      const outerInnerRatio =
        Number.isFinite(window.outerWidth) &&
        Number.isFinite(window.innerWidth) &&
        window.innerWidth > 0
          ? window.outerWidth / window.innerWidth
          : null;

      const zoom =
        viewportScale ??
        (outerInnerRatio && outerInnerRatio > 0.5 && outerInnerRatio < 3
          ? outerInnerRatio
          : dpr);

      setIsZoom110(Math.abs(zoom - 1.1) <= 0.04);
    };

    // Debounced handler to stop rendering spam during resize
    const handleResizeDebounced = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        updateZoomState();
      }, 150); // Updates 150ms after resizing finishes
    };

    // Initial check
    updateZoomState();

    window.addEventListener("resize", handleResizeDebounced);
    window.visualViewport?.addEventListener?.("resize", handleResizeDebounced);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("resize", handleResizeDebounced);
      window.visualViewport?.removeEventListener?.("resize", handleResizeDebounced);
    };
  }, []);

  return (
    <>
      <MainHeaderOncoSuite showSpacer />
      <Box
        style={hiddenWhileRestoring}
        sx={{
          width: "100%",
          fontFamily: "Rubik",
          bgcolor: "#fff",
          overflowX: "hidden",
        }}
      >
        {/* background */}
        <Box
          sx={{
            width: "100%",
            position: "relative",
            overflow: "hidden",
            minHeight: { md: "240px" },
          }}
        >
          <Box
            component="img"
            src={heroBackground}
            alt=""
            aria-hidden="true"
            srcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
            sizes="100vw"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: { xs: "center", md: "85% 100%" },
              zIndex: 0,
            }}
          />
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(12, 32, 59, 0.65) 0%, rgba(12, 32, 59, 0.65) 100%)",
              zIndex: 1,
            }}
          />
          {/* Main content container */}
          <Box
            sx={{
              width: "100%",
              maxWidth: "1280px",
              mx: "auto",
              px: { xs: 3, sm: 5, md: "70px" },
              pt: { xs: "132px", sm: "140px", md: "108px" },
              pb: { xs: "56px", md: "44px" },
              minHeight: { md: "240px" },
              position: "relative",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "24px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Rubik",
                fontSize: "15px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                lineHeight: "28px",
                color: "rgba(241, 128, 16, 1)",
                // Sit closer to the heading than the container's 24px gap.
                mb: "-12px",
              }}
            >
              ABOUT US
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 34, sm: 44, md: "56px" },
                fontWeight: 500,
                color: "rgba(255, 255, 255, 1)",
                fontFamily: "Rubik",
                lineHeight: "120%",
                letterSpacing: 0,
              }}
            >
              We Believe Better Evidence Leads
              <br />
              to Better Cancer Treatment
            </Typography>

            <Box
              sx={{
                maxWidth: "860px",
                mx: "auto",
                fontSize: { xs: "16px", sm: "16px", md: "18px" },
                fontWeight: 400,
                color: "rgba(255, 255, 255, 0.8)",
                lineHeight: { xs: "24px", md: "28px" },
                fontFamily: "Rubik",
                letterSpacing: 0,
              }}
            >
              OncoSuite transforms fragmented clinical trial data into structured,
              benchmarkable intelligence so oncology teams can make faster, more
              confident decisions.
            </Box>
          </Box>
        </Box>

        <Suspense fallback={<AboutUsBodyFallback />}>
          <AboutUsBody
            handleBookDemo={handleBookDemo}
            useCenteredStoryLayout={useCenteredStoryLayout}
            isZoom110={isZoom110}
            heroBackground={heroBackground}
            heroBackground828={heroBackground828}
            heroBackground1242={heroBackground1242}
          />
        </Suspense>
        
        {/* Footer moved outside Suspense so it renders instantly */}
        <Footer />
      </Box>
    </>
  );
}
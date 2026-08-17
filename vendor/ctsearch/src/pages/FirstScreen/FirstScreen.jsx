import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import useScrollRestoration from "../../utils/hooks/useScrollRestoration";
import MainHeaderOncoSuite from "../siteIntelligence/MainHeaderOncoSuite";
import mainImg900 from "../../assets/images/home_find.webp";
import previewBig from "../../assets/images/home_map.webp";
import previewMedium from "../../assets/images/home_box.webp";
import eyeIcon from "../../assets/icons/eye.svg";
import checkSmall from "../../assets/icons/check_small.svg";
import { useSnackbar } from "../../common/GlobalSnackbar";

const FirstScreenSections = lazy(() => import("./FirstScreenSections"));
const SiteIntelligenceHeroSection = lazy(() =>
  import("../siteIntelligence/SiteIntelligenceHeroSection"),
);
const FueledByBar = lazy(() => import("../siteIntelligence/FueledByBar"));
const ProblemSolutionSection = lazy(() => import("../siteIntelligence/ProblemSolutionSection"));
const OncologySiteScorecardSection = lazy(() =>
  import("../siteIntelligence/OncologySiteScorecardSection"),
);
const PredictOutcomeSection = lazy(() => import("../siteIntelligence/PredictOutcomeSection"));
const ValidationLoopSection = lazy(() => import("../siteIntelligence/ValidationLoopSection"));
const Footer = lazy(() => import("./Footer"));
const CustomerTrustSection = lazy(() => import("./CustomerTrustSection"));
const OncologyTeamCard = lazy(() => import("./OncologyTeamCard"));
const ComplexOncologyComparisonTable = lazy(
  () => import("./ComplexOncologyComparisonTable "),
);

const EagerSectionContext = React.createContext(false);

function SectionFallback({ minHeight = 240 }) {
  return <div style={{ minHeight }} />;
}

function DeferredSection({
  children,
  className = "",
  fallbackHeight = 240,
  id,
  rootMargin = "250px 0px",
}) {
  const mountEagerly = React.useContext(EagerSectionContext);
  const [isVisible, setIsVisible] = useState(mountEagerly);
  const sectionRef = useRef(null);
  useEffect(() => {
    if (isVisible) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <section id={id} ref={sectionRef} className={className}>
      {isVisible ? children : <SectionFallback minHeight={fallbackHeight} />}
    </section>
  );
}

export default function FirstScreen() {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const heroCardRowRef = useRef(null);

  const { navigateWithScrollSaved, shouldMountEagerly, hiddenWhileRestoring } =
    useScrollRestoration();

  const handleBookDemo = useCallback(() => {
    navigateWithScrollSaved("/book-demo");
  }, [navigateWithScrollSaved]);

  const heroCards = [
    {
      key: "patient",
      title: "Patient Intelligence",
      image: previewBig,
      alt: "Patient Intelligence preview",
    },
    {
      key: "trial",
      title: "Trial Intelligence",
      image: mainImg900,
      alt: "Trial Intelligence preview",
    },
    {
      key: "site",
      title: "Site Intelligence",
      image: previewMedium,
      alt: "Site Intelligence preview",
    },
  ];

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, []);

  const handleHeroCardClick = useCallback((key) => {
    if (key === "trial") {
      navigate("/trial-intelligence");
      return;
    }
    if (key === "site") {
      navigate("/site-intelligence");
      return;
    }
    if (key === "patient") {
      navigate("/patient-intelligence");
    }
  }, [navigate]);

  useEffect(() => {
    // /auth-error page
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");
    const code = params.get("code");
    if(message && code) {
      showSnackbar({
        message: message || "Error while login.",
        type: "error",
        duration: 5000
      });
      navigate("/", { replace: true });
    }
  }, [])


  useEffect(() => {
    const row = heroCardRowRef.current;
    if (!row) return undefined;

    const mediaQuery = window.matchMedia("(max-width: 600px)");
    let hasAutoCentered = false;

    const centerSecondCard = () => {
      if (hasAutoCentered) return;
      if (!mediaQuery.matches) return;
      if (!heroCardRowRef.current) return;

      const cards = heroCardRowRef.current.querySelectorAll(
        ".landing-hero-card",
      );
      const middleCard = cards[1];
      if (!middleCard) return;

      hasAutoCentered = true;

      // Wait a tick so layout/images settle before centering.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rowEl = heroCardRowRef.current;
          if (!rowEl) return;

          const targetLeft =
            middleCard.offsetLeft -
            (rowEl.clientWidth - middleCard.clientWidth) / 2;

          rowEl.scrollTo({ left: Math.max(0, targetLeft), behavior: "auto" });
        });
      });
    };

    centerSecondCard();

    const onChange = () => {
      if (!mediaQuery.matches) {
        hasAutoCentered = false;
        return;
      }
      centerSecondCard();
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  return (
    <EagerSectionContext.Provider value={shouldMountEagerly}>
      <MainHeaderOncoSuite />

      <main className="landing-shell" style={hiddenWhileRestoring}>
        <section className="landing-section">
          <div className="landing-hero-centered">
            {/* <p className="landing-pharma-text landing-pharma-text--center">
              SOLID TUMORS • HEMATOLOGY • RARE CANCERS
            </p> */}

            <h1 className="landing-hero-title landing-hero-title--center">
              <span className="semibold">Accelerate Oncology Drug Development</span>
              <br />
              <span className="bold">with Data Intelligence & AI</span>
            </h1>

            <p className="landing-hero-subtitle landing-hero-subtitle--center">
              OncoSuite unifies{" "}
              <span className="landing-hero-highlight">
                Patient, Drug, Trial, and Site Intelligence
              </span>{" "}
              into a single precision oncology platform.
            </p>

            <p className="landing-hero-description landing-hero-description--center">
              Delivered as a modern web application{" "}
              or an MCP-enabled data layer for internal AI agents,
              we empower biopharma teams with real-time analytics,{" "}
              <span className="landing-hero-highlight">1-click source traceability</span>,
              and <span className="landing-hero-highlight">predictive benchmarking</span>{" "}
              to de-risk decisions and accelerate oncology drug development.
            </p>

            <div className="landing-hero-stats">
              <span className= "landing-hero-stat">
                <img className="landing-hero-stat-check" src={checkSmall} alt="" aria-hidden="true" />
                34% Fewer Avoidable Protocol Amendments
              </span>
              <span className= "landing-hero-stat">
                <img className="landing-hero-stat-check" src={checkSmall} alt="" aria-hidden="true" />
                +7 Months Patent-Protected Revenue
              </span>
              <span className= "landing-hero-stat">
                <img className="landing-hero-stat-check" src={checkSmall} alt="" aria-hidden="true" />
                100% Evidence-Backed Traceability
              </span>
            </div>

            <div className="landing-button-row landing-button-row--center">
              <button
                type="button"
                className="landing-button landing-button--primary"
                onClick={handleBookDemo}
              >
                Book Your Demo
              </button>

              <button
                type="button"
                className="landing-button landing-button--secondary"
                aria-label="See what you get"
                onClick={() => {
                  const target = document.getElementById("platform");
                  target?.scrollIntoView?.({ behavior: "smooth", block: "start" });
                }}
              >
                <img src={eyeIcon} alt="" aria-hidden="true" width="22" height="22" />
                <span>See What You Get</span>
              </button>
            </div>

            <div
              ref={heroCardRowRef}
              className="landing-hero-card-row"
              aria-label="Product previews"
            >
              {heroCards.map((card) => (
                <div
                  key={card.key}
                  className="landing-hero-card"
                  role="link"
                  tabIndex={0}
                  onClick={() => handleHeroCardClick(card.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleHeroCardClick(card.key);
                    }
                  }}
                >
                  <div
                    className={`landing-hero-card-media${
                      card.key === "patient"
                        ? " landing-hero-card-media--smartfill"
                        : card.key === "site"
                          ? " landing-hero-card-media--sitefill"
                          : card.key === "trial"
                             ? " landing-hero-card-media--trialfill"
                        : ""
                    }`}
                    style={
                      card.key === "patient"
                        ? { "--preview-bg": `url(${card.image})` }
                        : undefined
                    }
                  >
                    <img
                      src={card.image}
                      alt={card.alt}
                      className={`landing-hero-card-img${
                        card.key === "site"
                          ? " landing-hero-card-img--site"
                          : card.key === "patient"
                             ? " landing-hero-card-img--population"
                             : card.key === "trial"
                               ? " landing-hero-card-img--trial"
                             : ""
                      }`}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                    />
                  </div>
                  <div className="landing-hero-card-label">{card.title}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-built-for-bar">
          <div className="landing-built-for-left">
            <span className="landing-built-for-label">
              Perfect for Pharma, Biotech, and CRO
            </span>
          </div>
          <div className="landing-built-for-right">
            <span className="landing-built-for-content">
              Clinical Development &amp; Operations · Medical Affairs ·
              Asset, Portfolio &amp; Business Development
            </span>
          </div>
        </section>

        {/* Site Intelligence landing-page sections should NOT render on the homepage.
            (They are rendered on `/site-intelligence` instead.) */}
        {/*
          <DeferredSection fallbackHeight={520} rootMargin="200px 0px">
            <Suspense fallback={<SectionFallback minHeight={520} />}>
              <SiteIntelligenceHeroSection onPrimaryCta={handleBookDemo} />
            </Suspense>
          </DeferredSection>

          <DeferredSection fallbackHeight={72} rootMargin="200px 0px">
            <Suspense fallback={<SectionFallback minHeight={72} />}>
              <FueledByBar />
            </Suspense>
          </DeferredSection>

          <DeferredSection fallbackHeight={360} rootMargin="200px 0px">
            <Suspense fallback={<SectionFallback minHeight={360} />}>
              <ProblemSolutionSection />
            </Suspense>
          </DeferredSection>

          <DeferredSection fallbackHeight={820} rootMargin="200px 0px">
            <Suspense fallback={<SectionFallback minHeight={820} />}>
              <OncologySiteScorecardSection />
            </Suspense>
          </DeferredSection>

          <DeferredSection fallbackHeight={760} rootMargin="200px 0px">
            <Suspense fallback={<SectionFallback minHeight={760} />}>
              <PredictOutcomeSection />
            </Suspense>
          </DeferredSection>

          <DeferredSection fallbackHeight={820} rootMargin="200px 0px">
            <Suspense fallback={<SectionFallback minHeight={820} />}>
              <ValidationLoopSection onBookDemo={handleBookDemo} />
            </Suspense>
          </DeferredSection>
        */}

        <DeferredSection
          id="features"
          fallbackHeight={1450}
          rootMargin="200px 0px"
        >
          <Suspense fallback={<SectionFallback minHeight={1450} />}>
            <FirstScreenSections onBookDemo={handleBookDemo} />
          </Suspense>
        </DeferredSection>

        <DeferredSection
          id="use-cases"
          className="landing-scroll-anchor"
          fallbackHeight={420}
        >
          <Suspense fallback={<SectionFallback minHeight={420} />}>
            <OncologyTeamCard />
          </Suspense>
        </DeferredSection>

        <DeferredSection fallbackHeight={520}>
          <Suspense fallback={<SectionFallback minHeight={520} />}>
            <ComplexOncologyComparisonTable
              onBookDemo={handleBookDemo}
              buttonText="Book Your Demo"
            />
          </Suspense>
        </DeferredSection>

        <DeferredSection
          id="testimonials"
          className="landing-scroll-anchor"
          fallbackHeight={420}
        >
          <Suspense fallback={<SectionFallback minHeight={420} />}>
            <CustomerTrustSection />
          </Suspense>
        </DeferredSection>
      </main>

      <div style={hiddenWhileRestoring}>
        <DeferredSection fallbackHeight={220}>
          <Suspense fallback={<SectionFallback minHeight={220} />}>
            <Footer />
          </Suspense>
        </DeferredSection>
      </div>
    </EagerSectionContext.Provider>
  );
}

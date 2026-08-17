import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../auth/authService";
import { useSaveScrollBeforeNavigate } from "../../utils/hooks/useScrollRestoration";
import OncosuiteLogoLight from "../../assets/logo/onco_logo.png";
import OncoSuiteWhiteLogo from "../../assets/logo/footer_logo.png";
import OncosuiteLogoDark from "../../assets/logo/onco_logo_dark.webp";

const LOGIN_URL = "https://oncosuite.com/user/auth/login";
// const LOGIN_URL = "http://localhost:8000/user/auth/login";
//  const LOGIN_URL = "https://thinkaiindia.com/user/auth/login";
//  const LOGIN_URL = "https://204.168.157.213.sslip.io/user/auth/login";

const navItems = [
  { label: "Platform", target: "platform" },
  { label: "Use Cases", target: "use-cases" },
  { label: "Testimonials", target: "testimonials" },
];

const MainHeader = ({ variant = "light", className = "", showSpacer = true }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("");
  const [showBookDemoCta, setShowBookDemoCta] = useState(true);
  const [activeTarget, setActiveTarget] = useState("");
  const activeTargetRef = useRef(activeTarget);
  const targetReachedRef = useRef(false);
  const navigate = useNavigate();
  const navigateWithScrollSaved = useSaveScrollBeforeNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isDark = variant === "dark";
  const extraHeaderClass = className ? ` ${className}` : "";

  const getHeaderOffset = () => {
    const header = document.querySelector(".landing-header");
    if (!header) return 0;
    const rect = header.getBoundingClientRect();
    // Add a small buffer so section headings never sit flush against the header.
    return Math.ceil(rect.height) + 8;
  };

  const setHeaderOffsetVar = () => {
    if (typeof document === "undefined") return;
    const offset = getHeaderOffset();
    if (!offset) return;
    document.documentElement.style.setProperty("--landing-header-offset", `${offset}px`);
  };

  useEffect(() => {
    activeTargetRef.current = activeTarget;
  }, [activeTarget]);

  useEffect(() => {
    setHeaderOffsetVar();
    window.addEventListener("resize", setHeaderOffsetVar);
    return () => window.removeEventListener("resize", setHeaderOffsetVar);
  }, []);

  useEffect(() => {
    if (isHomePage) return;
    setActiveNav("");
    setActiveTarget("");
    targetReachedRef.current = false;
  }, [isHomePage]);

  useEffect(() => {
    if (!isHomePage) return undefined;

    const update = () => {
      const target = activeTargetRef.current;
      if (!target) return;

      const section = document.getElementById(target);
      if (!section) {
        setActiveNav("");
        setActiveTarget("");
        targetReachedRef.current = false;
        return;
      }

      const rect = section.getBoundingClientRect();
      const anchorY = Math.round(window.innerHeight * 0.25);
      const isAnchorInside = rect.top <= anchorY && rect.bottom >= anchorY;

      // While smooth-scrolling to a clicked section, don't clear the active
      // state until we actually reach it once.
      if (isAnchorInside) {
        targetReachedRef.current = true;
        return;
      }

      if (targetReachedRef.current) {
        setActiveNav("");
        setActiveTarget("");
        targetReachedRef.current = false;
      }
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isHomePage]);

  useEffect(() => {
    if (!isHomePage) {
      setShowBookDemoCta(true);
      setActiveNav(""); // Reset active nav if we leave home
      return;
    }

    // 1. Existing Scroll/Resize logic for CTA
    const getThreshold = () => Math.round(window.innerHeight * 0.8);
    const updateCTA = () => {
      const threshold = getThreshold();
      setShowBookDemoCta(window.scrollY >= threshold);

      // Clear activeNav if we are back at the very top of the page
      if (window.scrollY < 100) {
        setActiveNav("");
      }
    };

    // 2. Intersection Observer to detect which section is in view
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px", // Trigger when section is in the top portion of viewport
      threshold: 0,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Find the label matching this element's ID
          const item = navItems.find((nav) => nav.target === entry.target.id);
          if (item) {
            setActiveNav(item.label);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all targets defined in navItems
    navItems.forEach((item) => {
      const el = document.getElementById(item.target);
      if (el) observer.observe(el);
    });

    // Listeners
    updateCTA();
    window.addEventListener("scroll", updateCTA, { passive: true });
    window.addEventListener("resize", updateCTA);

    return () => {
      window.removeEventListener("scroll", updateCTA);
      window.removeEventListener("resize", updateCTA);
      observer.disconnect();
    };
  }, [isHomePage]);

  const handleRedirect = (path) => {
    setDrawerOpen(false);
    if (path === "/") {
      // Force a fresh navigation so the homepage always loads from the top,
      // regardless of scroll restoration on the previous route.
      window.location.assign("/");
      return;
    }

    // Save the host page's scroll offset on the way to /book-demo so returning
    // lands back on the same section instead of the top of the page.
    if (path === "/book-demo") {
      navigateWithScrollSaved(path);
      return;
    }

    navigate(path);
  };

  const handleLogin = () => {
    setDrawerOpen(false);
    authService.login();
  };

  const handleScrollTo = (target, label) => {
    if (target === "top") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      setActiveNav(label);
      setActiveTarget("");
      targetReachedRef.current = false;
      setDrawerOpen(false);
      return;
    }

    const section = document.getElementById(target);
    if (!section) return;

    const headerOffset = getHeaderOffset();
    const top = section.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });

    setActiveNav(label);
    setActiveTarget(target);
    targetReachedRef.current = false;
    setDrawerOpen(false);
  };

  return (
    <>
      <header
        className={`landing-header${isDark ? " landing-header--dark" : ""}${extraHeaderClass}`}
      >
        <div
          className={`landing-header__inner${isHomePage && !showBookDemoCta ? " landing-header__inner--compact" : ""
            }`}
        >
          <button
            type="button"
            className="landing-logo-button"
            aria-label="Go to home page"
            onClick={() => handleRedirect("/")}
          >
            <img
              src={isDark ? OncoSuiteWhiteLogo : OncosuiteLogoLight}
              alt="OncoSuite Logo"
              className="landing-logo"
              loading="eager"
              decoding="async"
              width={155}
              height={30}
            />
          </button>

          <nav className="landing-header__nav" aria-label="Primary">
            {isHomePage &&
              navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`landing-nav-button${activeNav === item.label ? " is-active" : ""
                    }`}
                  onClick={() => handleScrollTo(item.target, item.label)}
                >
                  {item.label}
                </button>
              ))}
          </nav>

          <div className="landing-header__actions">
            <div className="landing-header__divider" />
            <button
              type="button"
              className="landing-header-pill"
              onClick={handleLogin}
            >
              Login
            </button>
            {showBookDemoCta ? (
              <button
                type="button"
                className="landing-header-primary"
                onClick={() => handleRedirect("/book-demo")}
              >
                Book Your Demo
              </button>
            ) : null}
          </div>

          <div className="landing-header__mobile">
            <button
              type="button"
              className="landing-header-mobile-cta"
              onClick={() => handleRedirect("/book-demo")}
            >
              Book Your Demo
            </button>
            <button
              type="button"
              className="landing-icon-button"
              aria-label="open menu"
              onClick={() => setDrawerOpen(true)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {showSpacer ? <div className="landing-header-spacer" /> : null}

      {drawerOpen && (
        <>
          <button
            type="button"
            className="landing-drawer-backdrop"
            aria-label="Close menu backdrop"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="landing-drawer" role="dialog" aria-modal="true">
            <div className="landing-drawer__top">
              <img
                src={OncosuiteLogoLight}
                alt="OncoSuite Logo"
                width={155}
                height={30}
                loading="eager"
                decoding="async"
              />

              <button
                type="button"
                className="landing-icon-button"
                aria-label="close menu"
                onClick={() => setDrawerOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {isHomePage && (
              <div className="landing-drawer__links">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`landing-drawer-link${activeNav === item.label ? " is-active" : ""
                      }`}
                    onClick={() => handleScrollTo(item.target, item.label)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className="landing-drawer__actions">
              <button
                type="button"
                className="landing-header-pill landing-header-pill--full"
                onClick={handleLogin}
              >
                Login
              </button>
              <button
                type="button"
                className="landing-header-primary landing-header-primary--full"
                onClick={() => handleRedirect("/book-demo")}
              >
                Book Your Demo
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MainHeader;

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../auth/authService";
import { useSaveScrollBeforeNavigate } from "../../utils/hooks/useScrollRestoration";
import "./MainHeaderOncoSuite.css";

import OncosuiteLogoLight from "../../assets/logo/onco_logo.png";
import OncoSuiteWhiteLogo from "../../assets/logo/footer_logo.png";
import OncosuiteLogoDark from "../../assets/logo/onco_logo_dark.webp";

const NAV = {
  platform: {
    label: "Platform",
    items: [
      { label: "Patient Intelligence", to: "/patient-intelligence" },
      { label: "Drug Intelligence", to: "/drug-intelligence" },
      { label: "Trial Intelligence", to: "/trial-intelligence" },
      { label: "Site Intelligence", to: "/site-intelligence" },
      { label: "AI Agents", to: "/ai-agents" },
    ],
  },
  solutions: {
    label: "Solutions",
    sections: [
      {
        heading: "By Function",
        items: [
          { label: "Clinical Development", to: "/clinical-development" },
          { label: "Clinical Operations", to: "/clinical-operations" },
          { label: "Medical Affairs & CI", to: "/medical-affairs" },
          { label: "Asset, Portfolio Strategy & BD", to: "/portfolio-management" },
        ],
      },
      {
        heading: "By Type",
        items: [
          { label: "Biotech", to: "/biotech" },
          { label: "Pharma", to: "/pharma" },
          { label: "CRO", to: "/cro" },
        ],
      },
    ],
  },
  about: {
    label: "About Us",
    to: "/about",
  },
  advisory: {
    label: "Advisory",
    to: null,
    disabled: true,
  },
  resources: {
    label: "Resources",
    items: [
      { label: "About Us", to: "/about" },
      { label: "Blog", to: null, disabled: true },
    ],
  },
};

const ChevronDown = ({ className = "" }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M7 10l5 5 5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronUp = ({ className = "" }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M7 14l5-5 5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function MainHeaderOncoSuite({
  variant = "light",
  className = "",
  showSpacer = true,
}) {
  const navigate = useNavigate();
  const navigateWithScrollSaved = useSaveScrollBeforeNavigate();
  const menuId = useId();
  const isDark = variant === "dark";
  const extraHeaderClass = className ? ` ${className}` : "";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState("");
  const [mobileSectionsOpen, setMobileSectionsOpen] = useState(() => new Set());
  const dropdownCloseTimer = useRef(null);
  const headerRef = useRef(null);
  const headerOffsetRef = useRef(0);
  const headerOffsetRaf = useRef(0);

  const logoSrc = useMemo(() => {
    if (isDark) return OncoSuiteWhiteLogo;
    return OncosuiteLogoLight;
  }, [isDark]);

  const closeAll = () => {
    setActiveDropdown("");
    setDrawerOpen(false);
    setMobileSectionsOpen(new Set());
  };

  const go = (to) => {
    closeAll();
    if (!to) return;
    // Save the host page's scroll offset on the way to /book-demo so returning
    // lands back on the same section instead of the top of the page.
    if (to === "/book-demo") {
      navigateWithScrollSaved(to);
      return;
    }
    navigate(to);
  };

  const handleLogin = () => {
    closeAll();
    authService.login();
  };

  const setHeaderOffsetVar = () => {
    const header = headerRef.current;
    if (!header) return;
    const rect = header.getBoundingClientRect();
    const offset = Math.ceil(rect.height);
    if (headerOffsetRef.current === offset) return;
    headerOffsetRef.current = offset;
    document.documentElement.style.setProperty(
      "--landing-header-offset",
      `${offset}px`,
    );
  };

  const scheduleHeaderOffsetVar = () => {
    if (headerOffsetRaf.current) return;
    headerOffsetRaf.current = window.requestAnimationFrame(() => {
      headerOffsetRaf.current = 0;
      setHeaderOffsetVar();
    });
  };

  useEffect(() => {
    scheduleHeaderOffsetVar();
    window.addEventListener("resize", scheduleHeaderOffsetVar);
    return () => {
      window.removeEventListener("resize", scheduleHeaderOffsetVar);
      if (headerOffsetRaf.current) {
        window.cancelAnimationFrame(headerOffsetRaf.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!activeDropdown) return;
      const header = headerRef.current;
      if (!header) return;
      if (header.contains(event.target)) return;
      setActiveDropdown("");
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [activeDropdown]);

  const scheduleCloseDropdown = () => {
    if (dropdownCloseTimer.current) clearTimeout(dropdownCloseTimer.current);
    dropdownCloseTimer.current = setTimeout(() => setActiveDropdown(""), 120);
  };

  const cancelCloseDropdown = () => {
    if (dropdownCloseTimer.current) clearTimeout(dropdownCloseTimer.current);
    dropdownCloseTimer.current = null;
  };

  const toggleDropdown = (key) => {
    setActiveDropdown((prev) => (prev === key ? "" : key));
  };

  const renderPlatformDropdown = () => (
    <div className="onco-nav__dropdown onco-nav__dropdown--platform" role="menu">
      <div className="onco-nav__platformItems">
        {NAV.platform.items.map((item) => (
          <button
            key={item.label}
            type="button"
            className="onco-nav__dropdownItem"
            role="menuitem"
            onClick={() => go(item.to)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <figure className="onco-nav__testimonial">
        <div className="onco-nav__testimonialStars" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="rgba(232, 161, 59, 1)"
              aria-hidden="true"
            >
              <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.51L10 14.13l-4.94 2.6.94-5.51-4-3.9 5.53-.8L10 1.5z" />
            </svg>
          ))}
        </div>
        <blockquote className="onco-nav__testimonialQuote">
          OncoSuite benchmarked our protocol against 142 studies, revealing three
          risks we missed. Avoiding one amendment saved over the annual license
          cost.
        </blockquote>
        <figcaption className="onco-nav__testimonialAuthor">
          <div className="onco-nav__testimonialName">Dr. Sarah Chen</div>
          <div className="onco-nav__testimonialRole">
            VP, Clinical Development, Top-20 Pharma
          </div>
        </figcaption>
      </figure>
    </div>
  );

  const renderResourcesDropdown = () => (
    <div className="onco-nav__dropdown" role="menu">
      {NAV.resources.items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`onco-nav__dropdownItem${item.disabled ? " is-disabled" : ""}`}
          role="menuitem"
          disabled={item.disabled}
          aria-disabled={item.disabled ? "true" : undefined}
          onClick={item.disabled ? undefined : () => go(item.to)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  const renderSolutionsDropdown = () => (
    <div className="onco-nav__dropdown onco-nav__dropdown--mega" role="menu">
      {NAV.solutions.sections.map((section) => (
        <div key={section.heading} className="onco-nav__megaCol">
          <div className="onco-nav__megaHeading">{section.heading}</div>
          {section.items.map((item) => (
            <button
              key={item.label}
              type="button"
              className="onco-nav__dropdownItem"
              role="menuitem"
              onClick={() => go(item.to)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  const mobileItems = useMemo(
    () => [
      {
        key: "platform",
        label: NAV.platform.label,
        kind: "items",
        items: NAV.platform.items,
      },
      {
        key: "solutions",
        label: NAV.solutions.label,
        kind: "sections",
        sections: NAV.solutions.sections,
      },
      {
        key: "about",
        label: NAV.about.label,
        kind: "link",
        to: NAV.about.to,
      },
      // {
      //   key: "advisory",
      //   label: NAV.advisory.label,
      //   kind: "link",
      //   to: NAV.advisory.to,
      //   disabled: NAV.advisory.disabled,
      // },
      // {
      //   key: "resources",
      //   label: NAV.resources.label,
      //   kind: "items",
      //   items: NAV.resources.items,
      // },
    ],
    [],
  );

  return (
    <>
      <header
        ref={headerRef}
        className={`onco-header${isDark ? " onco-header--dark" : ""}${extraHeaderClass}`}
      >
        <div className="onco-header__inner">
          <button
            type="button"
            className="onco-logoButton"
            aria-label="Go to home page"
            onClick={() => go("/")}
          >
            <img
              src={logoSrc}
              alt="OncoSuite Logo"
              className="onco-logo"
              loading="eager"
              decoding="async"
              width={155}
              height={30}
            />
          </button>

          <nav className="onco-nav" aria-label="Primary">
            <div
              className="onco-nav__group"
              onMouseLeave={scheduleCloseDropdown}
              onMouseEnter={cancelCloseDropdown}
            >
              <button
                type="button"
                className={`onco-nav__link${activeDropdown === "platform" ? " is-active" : ""}`}
                aria-haspopup="menu"
                aria-expanded={activeDropdown === "platform"}
                aria-controls={`${menuId}-platform`}
                onClick={() => toggleDropdown("platform")}
                onMouseEnter={() => setActiveDropdown("platform")}
              >
                {NAV.platform.label}{" "}
                <ChevronDown
                  className={`onco-nav__chev${
                    activeDropdown === "platform" ? " is-open" : ""
                  }`}
                />
              </button>
              {activeDropdown === "platform" ? (
                <div id={`${menuId}-platform`} className="onco-nav__panel">
                  {renderPlatformDropdown()}
                </div>
              ) : null}
            </div>

            <div
              className="onco-nav__group"
              onMouseLeave={scheduleCloseDropdown}
              onMouseEnter={cancelCloseDropdown}
            >
              <button
                type="button"
                className={`onco-nav__link${activeDropdown === "solutions" ? " is-active" : ""}`}
                aria-haspopup="menu"
                aria-expanded={activeDropdown === "solutions"}
                aria-controls={`${menuId}-solutions`}
                onClick={() => toggleDropdown("solutions")}
                onMouseEnter={() => setActiveDropdown("solutions")}
              >
                {NAV.solutions.label}{" "}
                <ChevronDown
                  className={`onco-nav__chev${
                    activeDropdown === "solutions" ? " is-open" : ""
                  }`}
                />
              </button>
              {activeDropdown === "solutions" ? (
                <div id={`${menuId}-solutions`} className="onco-nav__panel">
                  {renderSolutionsDropdown()}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className={`onco-nav__link${activeDropdown === "about" ? " is-active" : ""}`}
              onClick={() => go(NAV.about.to)}
              onMouseEnter={() => setActiveDropdown("about")}
            >
              {NAV.about.label}{" "}
            </button>

            {/*
            <button
              type="button"
              className={`onco-nav__link${NAV.advisory.disabled ? " is-disabled" : ""}`}
              disabled={NAV.advisory.disabled}
              aria-disabled={NAV.advisory.disabled ? "true" : undefined}
              onClick={NAV.advisory.disabled ? undefined : () => go(NAV.advisory.to)}
            >
              {NAV.advisory.label}
            </button>

            <div
              className="onco-nav__group"
              onMouseLeave={scheduleCloseDropdown}
              onMouseEnter={cancelCloseDropdown}
            >
              <button
                type="button"
                className={`onco-nav__link${activeDropdown === "resources" ? " is-active" : ""}`}
                aria-haspopup="menu"
                aria-expanded={activeDropdown === "resources"}
                aria-controls={`${menuId}-resources`}
                onClick={() => toggleDropdown("resources")}
                onMouseEnter={() => setActiveDropdown("resources")}
              >
                {NAV.resources.label}{" "}
                <ChevronDown
                  className={`onco-nav__chev${
                    activeDropdown === "resources" ? " is-open" : ""
                  }`}
                />
              </button>
              {activeDropdown === "resources" ? (
                <div id={`${menuId}-resources`} className="onco-nav__panel">
                  {renderResourcesDropdown()}
                </div>
              ) : null}
            </div>
            */}
          </nav>

          <div className="onco-actions">
            <button type="button" className="onco-actions__login" onClick={handleLogin}>
              Login
            </button>
            <button type="button" className="onco-actions__primary" onClick={() => go("/book-demo")}>
              Book Your Demo
            </button>
          </div>

          <div className="onco-mobile">
            <button
              type="button"
              className={`onco-actions__primary onco-actions__primary--mobile${
                drawerOpen ? " is-hidden" : ""
              }`}
              onClick={() => go("/book-demo")}
              aria-hidden={drawerOpen ? "true" : undefined}
              tabIndex={drawerOpen ? -1 : 0}
            >
              Book Your Demo
            </button>
            <button
              type="button"
              className={`onco-iconButton onco-iconButton--mobile${
                drawerOpen ? " is-open" : ""
              }`}
              aria-label={drawerOpen ? "close menu" : "open menu"}
              onClick={() =>
                setDrawerOpen((prev) => {
                  if (!prev) {
                    setActiveDropdown("");
                    setMobileSectionsOpen(new Set());
                  }
                  return !prev;
                })
              }
            >
              {drawerOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        {activeDropdown ? <div className="onco-nav__backdrop" /> : null}
      </header>

      {showSpacer ? <div className="onco-header-spacer" /> : null}

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="onco-drawerBackdrop"
            aria-label="Close menu backdrop"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="onco-drawer" role="dialog" aria-modal="true">
            <div className="onco-drawer__menu" aria-label="Mobile navigation">
              {mobileItems.map((entry) => {
                if (entry.kind === "link") {
                  return (
                    <div key={entry.key} className="onco-drawer__section">
                      <button
                        type="button"
                        className={`onco-drawer__link onco-drawer__link--root${
                          entry.disabled ? " is-disabled" : ""
                        }`}
                        disabled={entry.disabled}
                        aria-disabled={entry.disabled ? "true" : undefined}
                        onClick={entry.disabled ? undefined : () => go(entry.to)}
                      >
                        {entry.label}
                      </button>
                    </div>
                  );
                }

                const isOpen = mobileSectionsOpen.has(entry.key);
                return (
                  <div key={entry.key} className="onco-drawer__section">
                    <button
                      type="button"
                      className="onco-drawer__link onco-drawer__link--root"
                      onClick={() =>
                        setMobileSectionsOpen((prev) => {
                          const next = new Set(prev);
                          if (next.has(entry.key)) next.delete(entry.key);
                          else next.add(entry.key);
                          return next;
                        })
                      }
                      aria-expanded={isOpen}
                    >
                      <span>{entry.label}</span>
                      {isOpen ? <ChevronUp /> : <ChevronDown />}
                    </button>

                    {isOpen ? (
                      <div className="onco-drawer__sub">
                        {entry.kind === "items"
                          ? entry.items.map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                className={`onco-drawer__link onco-drawer__link--sub${
                                  item.disabled ? " is-disabled" : ""
                                }`}
                                disabled={item.disabled}
                                aria-disabled={item.disabled ? "true" : undefined}
                                onClick={item.disabled ? undefined : () => go(item.to)}
                              >
                                {item.label}
                              </button>
                            ))
                          : entry.sections.map((section) => (
                              <div key={section.heading} className="onco-drawer__subGroup">
                                <div className="onco-drawer__subHeading">{section.heading}</div>
                                {section.items.map((item) => (
                                  <button
                                    key={item.label}
                                    type="button"
                                    className="onco-drawer__link onco-drawer__link--sub"
                                    onClick={() => go(item.to)}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="onco-drawer__actions">
              <button
                type="button"
                className="onco-actions__login onco-actions__login--full"
                onClick={handleLogin}
              >
                Login
              </button>
              <button
                type="button"
                className="onco-actions__primary onco-actions__primary--full"
                onClick={() => go("/book-demo")}
              >
                Book Your Demo
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

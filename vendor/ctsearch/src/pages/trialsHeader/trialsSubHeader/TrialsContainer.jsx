import { useLayoutEffect, useState, useEffect, useRef } from "react";
import { mainHeaderTabs } from "../../../utils/helpers/helper";
import { headerStyles } from "./style";
import AnalyticsTabContainer from "../analytics/AnalyticsTabContainer";
import ListTabContainer from "../trials/ListTabContainer";
import { ANALYTICS_TABS } from "../../../utils/helpers/helper";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getAnalyticsPath,
  getAnalyticsTabFromPathname,
  getSessionKeyFromSearchParams,
  SESSION_KEY_QUERY_PARAM,
} from "../../../utils/trialsUrlState";

const TrialsContainer = ({ filters, counts, clearTrigger }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const reduxSessionKey = useSelector((state) => state.cards.sessionKey) || "";
  const analyticsSessionKey = useSelector((state) => state.cards.analyticsSessionKey) || "";
  const urlSessionKey = getSessionKeyFromSearchParams(searchParams);
  const urlShareId = searchParams.get("share_id") || "";
  // When a share link is open, the shared session (share_id) owns the tabs.
  // Only a key published by a sibling analytics tab after an explicit filter
  // (analyticsSessionKey) may override it — never the default/live redux search
  // session, which would otherwise refetch the whole (unfiltered) dataset.
  const currentSessionKey = urlShareId
    ? analyticsSessionKey || urlShareId
    : analyticsSessionKey || reduxSessionKey || urlSessionKey || "";
  const navigate = useNavigate();
  const location = useLocation();
  const { oncosuite_id } = useParams();
  const classes = headerStyles();
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredSubTab, setHoveredSubTab] = useState("");
  const [headerOffset, setHeaderOffset] = useState(0);
  const analyticsTabFromPath = getAnalyticsTabFromPathname(location.pathname);
  // const activeTab = analyticsTabFromPath ? "Analyze" : "Find";
  const [activeTab, setActiveTab] = useState(analyticsTabFromPath ? "Analyze" : "Find");
  // const activeSubTab = analyticsTabFromPath || "Population";
  const [activeSubTab, setActiveSubTab] = useState("")
  const [listURL, setListURL] = useState("");
  const [session_keys, set_session_key] = useState("");
  const lastTabRef = useRef("")
  const [shareId, setShareId] = useState("")

  useEffect(() => {
    const shareId = searchParams.get("share_id");
      const page = location.pathname.split("/").pop();
      const tab = ANALYTICS_TABS.find(x => x.value.toLocaleLowerCase() === page)?.value;
      if(tab) {
        navigateToAnalyticsTab(tab)
        setShareId(shareId)
      }
  }, [])

  useLayoutEffect(() => {
    const headerEl = document.querySelector('[data-trials-header="true"]');
    if (!headerEl) {
      setHeaderOffset(0);
      document.documentElement.style.removeProperty("--trials-search-header-height");
      return;
    }

    const update = () => {
      const next = headerEl.offsetHeight || 0;
      setHeaderOffset(next);
      document.documentElement.style.setProperty(
        "--trials-search-header-height",
        `${next}px`,
      );
    };
    update();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(headerEl);
      window.addEventListener("resize", update);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", update);
      };
    }

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [location.pathname]);

  const updateUrlSilently = (path, paramsString) => {
    const newUrl = paramsString ? `${path}?${paramsString}` : path;
    window.history.replaceState(null, "", newUrl);
    // currentSearchParamsRef.current = new URLSearchParams(paramsString);
  };


  // ── Navigate to Find — restore last URL if available ─────────
  const navigateToList = () => {
    // debugger
    const params = new URLSearchParams(searchParams);

    // Coming from a shared analytics session (share_id): carry the same session
    // into Find as a real session_key so the list view shows the shared/filtered
    // results. The Find flow keys off session_key, not share_id. Use React
    // Router navigate here (not replaceState) so the list's session_key watcher
    // fires and actually fetches the shared session.
    if (urlShareId && currentSessionKey) {
      params.delete("share_id");
      params.set(SESSION_KEY_QUERY_PARAM, currentSessionKey);
      const listPath = oncosuite_id ? `/trials/${oncosuite_id}` : "/trials";
      navigate(`${listPath}?${params.toString()}`);
      setActiveSubTab("");
      setActiveTab("Find");
      lastTabRef.current = activeSubTab;
      return;
    }

    // If listURL exists, reset to page 1
    if (listURL) {
      // params.set("page", "1");
      window.history.replaceState(null, "", listURL);
    }
    else {
      const nextPath = listURL
        ? listURL
        : oncosuite_id
          ? `/trials/${oncosuite_id}`
          : "/trials";

      updateUrlSilently(nextPath, params.toString());
    }
    
    setActiveSubTab("")
    setActiveTab("Find")
    lastTabRef.current = activeSubTab
    // setListURL("")
  };

  // ── Navigate to Analyze subtab — restore last URL if available
  const navigateToAnalyticsTab = (tabValue) => {
    // debugger
    console.log("listURL", listURL)
    setActiveTab("Analyze")
    let activeTab = ""
    if(lastTabRef.current) {
      setActiveSubTab(lastTabRef.current)
      activeTab = lastTabRef.current
      lastTabRef.current = ""
    } else {
      setActiveSubTab(tabValue)
      activeTab = tabValue
    }

    // Otherwise navigate to specific subtab normally
    const nextPath = getAnalyticsPath(activeTab);

    // Preserve the shared session across tab switches / reloads so a
    // share URL opened on one tab keeps working when the user moves to
    // another tab. Only carry the share_id — nothing else.
    const shareIdParam = searchParams.get("share_id");
    const nextParams = new URLSearchParams();
    if (shareIdParam) {
      nextParams.set("share_id", shareIdParam);
    }
    updateUrlSilently(nextPath, nextParams.toString());
    // navigate(
    //   `${nextPath}${nextParams.toString() ? `?${nextParams.toString()}` : ""}`
    // );
  };

  useEffect(() => {
    const handler = (e) => {
      // Guard: don't fire when user is typing (so Ctrl+A still selects text as expected)
      const tag = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      // Ctrl+A (Windows/Linux) or Cmd+A (Mac) — toggle Find ↔ Analyze
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (activeTab === 'Find') {
          navigateToAnalyticsTab(activeSubTab); // restores last Analyze URL
        } else {
          navigateToList();                     // → goes back to Find
        }
        return;
      }

      // Ctrl+M (Windows/Linux) or Cmd+M (Mac) — cycle through the Analyze sub-tabs
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        if (activeTab !== 'Analyze') return;
        e.preventDefault();
        const enabledTabs = ANALYTICS_TABS.filter((tab) => !tab.disabled);
        const currentIndex = enabledTabs.findIndex((tab) => tab.value === activeSubTab);
        const nextTab = enabledTabs[(currentIndex + 1) % enabledTabs.length];
        if (nextTab) navigateToAnalyticsTab(nextTab.value);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeTab, activeSubTab, navigateToList, navigateToAnalyticsTab]);

  return (
    <div
      className="z-20 fixed transition-all duration-500"
      style={{
        top: headerOffset,
        left: 68,
        right: 0,
      }}
    >
      <div style={{ background: "#DCE9FC" }} className="w-full z-20">
        {/* Added dynamic flex properties here to allow proper shrinking/wrapping behavior */}
        <div 
          className={classes.header_tab} 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            width: "100%",
            overflow: "hidden" 
          }}
        >
          <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
            {mainHeaderTabs?.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "Find") {
                    navigateToList();
                    return;
                  }
                  navigateToAnalyticsTab("Population");
                }}
                className={activeTab === tab ? "active" : ""}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Analyze" && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                alignSelf: "center",
                marginLeft: "16px",
                marginRight: "25px",
                // Enable scroll container behaviors for small viewports
                overflowX: "auto",
                whiteSpace: "nowrap",
                scrollbarWidth: "none", // Hide scrollbar in Firefox
                msOverflowStyle: "none", // Hide scrollbar in IE/Edge
                padding: "4px 0",
              }}
              // CSS rule injection to hide scrollbars on modern Webkit browsers
              className="hide-scrollbar"
            >
              {/* Extra style tag to safely ensure cross-browser scrollbar hiding */}
              <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              
              {ANALYTICS_TABS.map((tab) => {
                const isActive = activeSubTab === tab.value;
                const isDisabled = tab.disabled;
                const isHovered = hoveredSubTab === tab.value;

                return (
                  <div
                    key={tab.value}
                    onClick={() => {
                      if (!isDisabled) {
                        navigateToAnalyticsTab(tab.value);
                      }
                    }}
                    onMouseEnter={() => {
                      if (!isDisabled) setHoveredSubTab(tab.value);
                    }}
                    onMouseLeave={() => setHoveredSubTab("")}
                    style={{
                      padding: "4px 16px",
                      borderRadius: 8,
                      fontSize: 15,
                      whiteSpace: "nowrap",
                      fontWeight: isActive ? 500 : 400,
                      fontFamily: "Rubik",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.5 : 1,
                      display: "inline-block", // Guarantee text layout alignment inside scroll container
                      background: isHovered
                        ? "rgba(255, 255, 255, 0.5)"
                        : isActive
                          ? "#FFFFFF"
                          : "transparent",
                      border: "1px solid rgba(184, 212, 249, 1)",
                      boxShadow:
                        isHovered ? "0 2px 8px rgba(130, 143, 169, 0.18)" : "none",
                      borderColor: isHovered
                        ? "rgba(38, 102, 190, 0.45)"
                        : "rgba(184, 212, 249, 1)",
                      transition:
                        "background 140ms ease, color 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
                      color: isDisabled
                        ? "#9AA3B2"
                        : isActive
                          ? "rgba(38, 102, 190, 1)"
                          : "rgba(0, 0, 0, 0.7)",
                    }}
                  >
                    {tab.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div>
        {/* {activeTab === "Find" && (
          <ListTabContainer
            clearTrigger={clearTrigger}
            filters={filters}
            counts={counts}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )} */}

        <div
          style={{
            display: activeTab === "Find" ? "block" : "none",
            visibility: activeTab === "Find" ? "visible" : "hidden",
            height: activeTab === "Find" ? "auto" : 0,
            overflow: activeTab === "Find" ? "visible" : "hidden",
          }}
        >
          <ListTabContainer
            activeTabTrial={activeTab}
            clearTrigger={clearTrigger}
            filters={filters}
            counts={counts}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            setListURL={setListURL}
            set_session_key={set_session_key}
          />
        </div>

        <div
          style={{
            display: activeTab === "Analyze" ? "block" : "none",
            visibility: activeTab === "Analyze" ? "visible" : "hidden",
            height: activeTab === "Analyze" ? "auto" : 0,
            overflow: activeTab === "Analyze" ? "visible" : "hidden",
          }}
        >
          <AnalyticsTabContainer
            activeSubTab={activeSubTab}
            sessionKey={currentSessionKey}
            session_keys={session_keys}
            
          />
        </div>
        {/* {activeTab === "Analyze" && (
          <AnalyticsTabContainer
            activeTab={activeSubTab}
            sessionKey={currentSessionKey}
          />
        )} */}
      </div>
    </div>
  );
};

export default TrialsContainer;
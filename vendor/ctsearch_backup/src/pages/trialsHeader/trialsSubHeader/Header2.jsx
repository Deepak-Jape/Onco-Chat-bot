import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mainHeaderTabs } from "../../../utils/helpers/helper";
import { headerStyles } from "./style";
import { fetchCards } from "../../../redux/trialsDataSlice";
import AnalyticsTabContainer from "../analytics/AnalyticsTabContainer";
import ListTabContainer from "../trials/ListTabContainer";
import { ANALYTICS_TABS } from "../../../utils/helpers/helper";
import { Box } from "@mui/material";

const TrialsContainer = ({ filters, counts, clearTrigger }) => {
  const [activeTab, setActiveTab] = useState("Find");
  const { queryId } = useSelector((state) => state.conditionData);
  const [activeSubTab, setActiveSubTab] = useState("Population");

  const isFirstRender = useRef(true); // Track the initial state
  const classes = headerStyles();
  const [currentPage, setCurrentPage] = useState(1);
  const prevFiltersRef = useRef();
  const prevPageRef = useRef();
  const dispatch = useDispatch();
  const cardsPerPage = 10;

  const defaultQueryId = "0256ae9d-b8fc-4c11-a07c-04a908c638fb";

  useEffect(() => {
    const filtersChanged =
      JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
    const pageChanged = currentPage !== prevPageRef.current;
    const hasFilters =
      filters &&
      Object.keys(filters).some(
        (key) =>
          filters[key] !== null &&
          filters[key] !== undefined &&
          filters[key] !== "" &&
          (Array.isArray(filters[key]) ? filters[key].length > 0 : true),
      );
    if (filtersChanged) {
      if (hasFilters) {
        ("");
      } else {
        if (isFirstRender.current) {
          // 1st time: Send empty object
          // dispatch(fetchCards({}));
          isFirstRender.current = false; // Flip the flag
        } else {
          // All other times: Send the full filter payload
          dispatch(
            fetchCards({
              searchTerm: filters.searchTerm || "",
              flag: "main_filter",
              groupedFilters: filters.groupedFilters || {},
            }),
          );
        }
      }
      setCurrentPage(1);
      // Update refs
      prevFiltersRef.current = filters;
      prevPageRef.current = 1;
    }
    if (pageChanged && !filtersChanged) {
      if (hasFilters) {
        // 🔹 Filters exist → exclude queryId
        // dispatch(fetchTrials(filters, cardsPerPage, currentPage, queryId)).then(
        //   (res) => {
        //     setUpdateQueryId(res.query_id);
        //   }
        // );
        dispatch(
          fetchCards({
            groupedFilters: filters,
            page: currentPage,
          }),
        );
      } else {
        // 🔹 No filters → include queryId
        dispatch(
          fetchCards({
            groupedFilters: filters,
            page: currentPage,
          }),
        );
      }
      prevPageRef.current = currentPage;
    }
  }, [
    filters,
    currentPage,
    cardsPerPage,
    dispatch,
    queryId,
    defaultQueryId,
    activeTab,
  ]);

  return (
    <div className="w-full z-20 fixed transition-all duration-500">
      <div style={{ background: "#DCE9FC" }} className="w-full z-20">
        <div
          // style={{ padding: "0.5% 1% 0% 1%" }}
          className={classes.header_tab}
        >
          {/* LEFT: List / Analytics */}
          <div style={{ display: "flex", gap: 10 }}>
            {mainHeaderTabs?.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? "active" : ""}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* RIGHT: Analytics sub tabs (ONLY when Analytics active) */}
          {activeTab === "Analyze" && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                alignSelf: "center",
                marginLeft: "auto",
                marginRight: "26.5%",
              }}
            >
              {ANALYTICS_TABS.map((tab) => {
                const isActive = activeSubTab === tab.value;
                const isDisabled = tab.disabled;

                return (
                  <Box
                    key={tab.value}
                    onClick={() => {
                      if (!isDisabled) setActiveSubTab(tab.value);
                    }}
                    sx={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontSize: 15,
                      whiteSpace: "nowrap",
                      fontWeight: isActive ? 500 : 400,
                      fontFamily: "Rubik",

                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.5 : 1,

                      background: isActive ? "#FFFFFF" : "transparent",
                      border: "1px solid rgba(184, 212, 249, 1)",
                      color: isDisabled
                        ? "#9AA3B2"
                        : isActive
                          ? "rgba(38, 102, 190, 1)"
                          : "rgba(0, 0, 0, 0.7)",
                      transition:
                        "background 140ms ease, color 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
                      "&:hover": isDisabled
                        ? {}
                        : {
                            background: "rgba(255, 255, 255, 0.5)",
                            color: "rgba(38, 102, 190, 1)",
                            borderColor: "rgba(38, 102, 190, 0.45)",
                            boxShadow: "0 2px 8px rgba(130, 143, 169, 0.18)",
                          },
                    }}
                  >
                    {tab.label}
                  </Box>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div>
        {activeTab === "Find" && (
          <ListTabContainer
            clearTrigger={clearTrigger}
            filters={filters}
            counts={counts}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}
        {activeTab === "Analyze" && (
          <AnalyticsTabContainer activeTab={activeSubTab} />
        )}
      </div>
    </div>
  );
};

export default TrialsContainer;

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import RightCardSkeleton from "../trials/RightCardSkeleton";
import CommonTabs from "../../../common/Tabs";
import StudyDetailsTab from "../trials/StudyDetailsTab";
import ResultsTab from "../trials/ResultsTab";
import trialsSummary from "./trialsSummary.json";
import EvidenceHoverHeader from "../trials/EvidenceHoverCell";

import {
  getStatusColor,
  homepageTabs,
  prepareEligibilityRows,
  getTraceability as getTrace,
} from "../../../utils/helpers/helper";
import { helpIcon, DownloadWhiteIcon } from "../../../assets";
import { getExecutiveSummaryById } from "../../../api/Profile";
import {
  Box,
  Switch,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Divider,
  Tooltip,
} from "@mui/material";
import { toggleAlert } from "../../../redux/trialsSlice";
import Timeline from "../trials/TimeLine";
import { exportExecutiveSummaryPdf } from "../../../utils/pdfExport";

const SafeRender = ({ children, fallback = "" }) => {
  if (children === null || children === undefined) return fallback;
  if (typeof children === "string" || typeof children === "number")
    return children;
  if (Array.isArray(children)) return children.join(", ");
  return fallback;
};

const ExecuiteSummaryDrawer = ({ nctId, sessionKey }) => {
  const DropdownChevron = (props) => (
    <svg
      {...props}
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.5 7.5L10 13L15.5 7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="0" y="0" width="20" height="20" fill="transparent" />
    </svg>
  );

  const toDisplayTitleCase = (input) => {
    const text = String(input ?? "").trim();
    if (!text) return "";

    return text
      .split(/\s+/)
      .map((word) => {
        const raw = word.trim();
        if (!raw) return raw;

        if (raw.length > 1 && raw === raw.toUpperCase()) return raw; // acronyms (NSCLC)
        if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(raw)) return raw.toUpperCase(); // roman numerals
        if (/^\d/.test(raw)) return raw; // leading digit tokens (2L+)

        return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      })
      .join(" ");
  };

  const dispatch = useDispatch();
  const isAlertActive = useSelector((state) => state.trials.isAlertActive);

  const [selectedIdData, setSelectedIdData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Study Details");
  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");
  const [isCohortSelectOpen, setIsCohortSelectOpen] = useState(false);
  const [isPhaseSelectOpen, setIsPhaseSelectOpen] = useState(false);
  const [currentPhaseObj, setCurrentPhaseObj] = useState(null);
  const [studyDetails, setStudyDetails] = useState({});
  const [hoveredId, setHoveredId] = useState(false);
  const [statusPopoverStyle, setStatusPopoverStyle] = useState(null);

  const [isSticky, setIsSticky] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadCloseTimerRef = useRef(null);

  const scrollRef = useRef(null);
  const fullReportRef = useRef(null);
  const stickyRef = useRef(null);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    return () => {
      if (downloadCloseTimerRef.current) {
        clearTimeout(downloadCloseTimerRef.current);
        downloadCloseTimerRef.current = null;
      }
    };
  }, []);

  const documentsDetails = selectedIdData?.top_info?.value?.downloads || {};
  const downloadKeys = {
    "Study Protocol":
      "https://cdn.clinicaltrials.gov/large-docs/01/NCT02827201/Prot_000.pdf",
    "Statistical Analysis Plan":
      "https://cdn.clinicaltrials.gov/large-docs/01/NCT02827201/SAP_001.pdf",
  };
  const defaultItems = [
    "Study Protocol",
    "Statistical Analysis Plan",
    "Informed Consent Form",
    "Trial Results",
    "Executive Summary",
  ];
  const processedData = {};
  defaultItems.forEach((item) => {
    const apiKey = Object.keys(documentsDetails).find((key) =>
      key.toLowerCase().includes(item.toLowerCase()),
    );
    if (apiKey) processedData[item] = documentsDetails[apiKey];
    else if (downloadKeys[item]) processedData[item] = downloadKeys[item];
  });

  const handleDownload = async (item) => {
    setDownloadOpen(false);
    const oncosuite_id =
      selectedIdData?.top_info?.value?.oncosuite_id?.value || "Trial";

    if (item === "Executive Summary") {
      const element = fullReportRef.current;
      if (!element) return;
      try {
        await exportExecutiveSummaryPdf(
          element,
          `${item.replace(/\s+/g, "_")}_${oncosuite_id}.pdf`,
        );
      } catch (error) {
        console.error("PDF Capture Error:", error);
      }
      return;
    }

    try {
      const response = await fetch(item);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${item}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const DownloadWithMenu = () => (
    <div
      className="relative inline-block"
      onMouseEnter={() => {
        if (downloadCloseTimerRef.current) {
          clearTimeout(downloadCloseTimerRef.current);
          downloadCloseTimerRef.current = null;
        }
        setDownloadOpen(true);
      }}
      onMouseLeave={() => {
        if (downloadCloseTimerRef.current) {
          clearTimeout(downloadCloseTimerRef.current);
        }
        downloadCloseTimerRef.current = setTimeout(() => {
          setDownloadOpen(false);
        }, 150);
      }}
    >
      <button
        className="flex items-center justify-center gap-2 text-white rounded-md"
        style={{
          width: 170,
          height: 44,
          borderRadius: 6,
          paddingLeft: 10,
          paddingRight: 10,
          gap: 8,
          border: "1px solid rgba(0, 0, 0, 0.1)",
          background: "rgba(38, 102, 190, 1)",
          boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)",
          fontFamily: "Rubik",
          fontSize: 14,
          fontWeight: 600,
          flex: "0 0 auto",
        }}
        type="button"
      >
        <img
          src={DownloadWhiteIcon}
          style={{ width: 15, height: 15 }}
          alt="download icon"
        />
        <span className="font-semibold text-sm">Download</span>
      </button>

      {downloadOpen && (
        <div
          className="absolute left-0 mt-2 w-60 bg-white shadow-lg border rounded-lg p-2 z-50"
          onMouseEnter={() => {
            if (downloadCloseTimerRef.current) {
              clearTimeout(downloadCloseTimerRef.current);
              downloadCloseTimerRef.current = null;
            }
            setDownloadOpen(true);
          }}
          onMouseLeave={() => {
            if (downloadCloseTimerRef.current) {
              clearTimeout(downloadCloseTimerRef.current);
            }
            downloadCloseTimerRef.current = setTimeout(() => {
              setDownloadOpen(false);
            }, 150);
          }}
        >
          <p className="text-gray-400 text-xs px-2 mb-1">Available Documents</p>
          <ul className="text-sm">
            {defaultItems
              .filter((item) => Boolean(processedData[item]))
              .map((item, idx) => (
                <li
                  key={idx}
                  className="px-2 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-gray-800"
                  onClick={() => handleDownload(processedData[item])}
                >
                  {item}
                </li>
              ))}
            <li
              onClick={() => handleDownload("Executive Summary")}
              className="px-2 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-gray-800"
            >
              Download Summary
            </li>
          </ul>
        </div>
      )}
    </div>
  );

  const timelineArray = Array.isArray(
    selectedIdData?.top_info?.value?.status?.timeline?.value,
  )
    ? selectedIdData?.top_info?.value?.status?.timeline?.value
    : [];

  const customOrder = [
    "Commencement",
    "First Submission",
    "Primary Completion",
    "Completion",
    "Results Published",
  ];

  const sortedTimeline = [...timelineArray].sort((a, b) => {
    const indexA = customOrder.indexOf(a?.title);
    const indexB = customOrder.indexOf(b?.title);
    return indexA - indexB;
  });

  const openStatusPopover = (event) => {
    const rect = event?.currentTarget?.getBoundingClientRect?.();
    if (!rect) return;

    const popoverWidth = Math.min(820, Math.max(350, window.innerWidth - 24));
    const centerX = rect.left + rect.width / 2;
    const half = popoverWidth / 2;
    const clampedLeft = Math.min(
      window.innerWidth - 12 - half,
      Math.max(12 + half, centerX),
    );

    setStatusPopoverStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: clampedLeft,
      transform: "translateX(-50%)",
      width: popoverWidth,
      maxWidth: "calc(100vw - 24px)",
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getExecutiveSummaryById(nctId, sessionKey);
        setSelectedIdData(data);
      } catch {
        setSelectedIdData(trialsSummary);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [nctId, sessionKey]);

  useEffect(() => {
    if (!selectedIdData?.phases?.length) return;
    const defaultPhase = selectedIdData.phases[0]?.title || "";
    setSelectedPhase(defaultPhase);
    const phaseObj = selectedIdData.phases.find((p) => p.title === defaultPhase);
    setCurrentPhaseObj(phaseObj || null);
    const defaultCohort = phaseObj?.value?.[0]?.title || "";
    setSelectedCohort(defaultCohort);

    if (phaseObj?.value?.length > 0) {
      const cohortObj = phaseObj.value.find((c) => c.title === defaultCohort) || phaseObj.value[0];
      setStudyDetails({
        study_details: cohortObj?.study_details,
        endpoints: phaseObj?.endpoint,
        trial_contacts: selectedIdData?.trial_contacts,
        site_locations: selectedIdData?.site_locations,
        top_info: selectedIdData?.top_info,
        result_section: cohortObj?.result_section,
        phases: selectedIdData?.phases,
        source_date: selectedIdData?.source_date,
        version: selectedIdData?.version,
      });
    } else {
      setStudyDetails({});
    }
  }, [selectedIdData]);

  const handlePhaseChange = (phaseTitle) => {
    setSelectedPhase(phaseTitle);
    const phaseObj = selectedIdData?.phases?.find((p) => p.title === phaseTitle);
    setCurrentPhaseObj(phaseObj || null);
    const nextCohortTitle = phaseObj?.value?.[0]?.title || "";
    setSelectedCohort(nextCohortTitle);

    if (phaseObj?.value?.length > 0) {
      const cohortObj = phaseObj.value[0];
      setStudyDetails({
        study_details: cohortObj?.study_details,
        endpoints: phaseObj?.endpoint,
        trial_contacts: selectedIdData?.trial_contacts,
        site_locations: selectedIdData?.site_locations,
        top_info: selectedIdData?.top_info,
        result_section: cohortObj?.result_section,
        phases: selectedIdData?.phases,
        source_date: selectedIdData?.source_date,
        version: selectedIdData?.version,
      });
    } else {
      setStudyDetails({});
    }
  };

  const handleCohortChange = (cohortTitle) => {
    setSelectedCohort(cohortTitle);
    if (!currentPhaseObj?.value?.length) return;
    const cohortObj =
      currentPhaseObj.value.find((c) => c.title === cohortTitle) ||
      currentPhaseObj.value[0];
    setStudyDetails({
      study_details: cohortObj?.study_details,
      endpoints: currentPhaseObj?.endpoint,
      trial_contacts: selectedIdData?.trial_contacts,
      site_locations: selectedIdData?.site_locations,
      top_info: selectedIdData?.top_info,
      result_section: cohortObj?.result_section,
      phases: selectedIdData?.phases,
      source_date: selectedIdData?.source_date,
      version: selectedIdData?.version,
    });
  };

  // useEffect(() => {
  //   if (!nctId) return;
  //   setIsLoading(true);
  //   setTimeout(() => {
  //     setSelectedIdData(trialsSummary);
  //     setIsLoading(false);
  //   }, 300);
  // }, [nctId]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setIsSticky(el.scrollTop > 0);
    const total = el.scrollHeight - el.clientHeight;
    setScrollProgress((el.scrollTop / total) * 100);
  };

  const drawerData =
    studyDetails?.study_details ? studyDetails : selectedIdData;

  const steps =
    drawerData?.study_details?.study_design?.value?.timeline?.value || [];

  const source_date = drawerData?.source_date;
  const version = drawerData?.version;

  const eligibility =
    drawerData?.study_details?.patient_population?.value
      ?.eligibility_criteria?.value || {};

  const inclusion = eligibility?.inclusion?.value || [];
  const exclusion = eligibility?.exclusion?.value || [];

  const eligibilityRows = prepareEligibilityRows(exclusion, inclusion);

  const demographics =
    drawerData?.study_details?.patient_population?.value?.demographics
      ?.value;

  const patientDempgraphicRows = demographics
    ? Object.entries(demographics).map(([sex, obj]) => ({
        sex,
        age: obj?.value || obj,
      }))
    : [];

  const isResultDisabled =
    !drawerData?.result_section ||
    Object.keys(drawerData.result_section || {}).length === 0;

  if (isLoading) {
    return (
      <div className="flex-1 min-h-0">
        <RightCardSkeleton />
      </div>
    );
  }

  return (
    <div
      ref={(node) => {
        scrollRef.current = node;
        fullReportRef.current = node;
      }}
      onScroll={handleScroll}
      className="overflow-y-auto h-full px-3 pb-6"
    >
            <div className="sticky top-0 bg-white z-50 pt-0 -mx-3 px-3">
              {scrollProgress > 0 && (
                <div className="w-full h-1 bg-gray-200 rounded mb-2">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
              )}

              <div
                ref={stickyRef}
                style={{ padding: isSticky ? "10px 0" : "0 0 10px 0" }}
              >
                {!isSticky && (
                  <a
                    href={`https://clinicaltrials.gov/study/${selectedIdData?.top_info?.value?.nctid?.value}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline text-sm"
                  ></a>
                )}

                <h2
                  style={{
                    fontFamily: "Rubik",
                    color: "rgba(0, 0, 0, 0.9)",
                    fontWeight: 500,
                    fontSize: isSticky ? 17 : 28,
                    lineHeight: isSticky ? "24px" : "36px",
                    margin: 0,
                    whiteSpace: isSticky ? "nowrap" : "normal",
                    overflow: isSticky ? "hidden" : "visible",
                    textOverflow: isSticky ? "ellipsis" : "unset",
                  }}
                >
                  <SafeRender>
                    {selectedIdData?.top_info?.value?.study_title?.value}
                  </SafeRender> 
                </h2>
              </div>

              {/* Sticky action row (shows once user scrolls) */}
              {isSticky && (
                <div
                  style={{
                    overflow: downloadOpen ? "visible" : "hidden",
                    maxHeight: 120,
                    opacity: 1,
                    transform: "translateY(0)",
                    padding: "12px 0 10px 0",
                    pointerEvents: "auto",
                    transition:
                      "max-height 200ms ease, opacity 200ms ease, transform 200ms ease, padding 200ms ease",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0px 4px 8px rgba(130, 143, 169, 0.12)",
                  }}
                >
                  <div className="flex items-center gap-4">
                  {/* <DownloadWithMenu /> */}

                  {/* COHORT */}
                  {(currentPhaseObj?.value || []).filter(c => c?.title).length > 1 && <div
                    className="relative"
                    style={{
                      width: 170,
                      height: 44,
                      borderRadius: 6,
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      background: "rgba(255, 255, 255, 1)",
                      boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)",
                      flex: "0 0 auto",
                    }}
                  >
                    {(() => {
                      const normalizeLabel = (label) => {
                        const raw = String(label ?? "");
                        const fixedTypo = raw.replace(/cohot/gi, "cohort");
                        const trimmed = fixedTypo.trim();
                        const withoutSuffix = trimmed.replace(/\s+[A-Za-z]$/, "");
                        return toDisplayTitleCase(withoutSuffix);
                      };

                      const buildSortedOptions = (rawOptions, selectedValue) => {
                        const options = (rawOptions || [])
                          .map((opt) => ({
                            value: opt?.title ?? "",
                            label: normalizeLabel(opt?.title),
                          }))
                          .filter((opt) => opt.value);
                        const uniqueOptions = [
                          ...options
                            .reduce((acc, opt) => {
                              const key = opt.label.trim().toLowerCase();
                              if (!acc.has(key) || opt.value === selectedValue) {
                                acc.set(key, opt);
                              }
                              return acc;
                            }, new Map())
                            .values(),
                        ];

                        const sorted = [...uniqueOptions].sort((a, b) =>
                          a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
                        );

                        const selected =
                          sorted.find((o) => o.value === selectedValue) ||
                          (sorted.length === 1 ? sorted[0] : null);
                        const rest = selected
                          ? sorted.filter((o) => o.value !== selected.value)
                          : sorted;
                        return { selected, rest };
                      };

                      const menuProps = {
                        anchorOrigin: {
                          vertical: "bottom",
                          horizontal: "left",
                        },
                        transformOrigin: {
                          vertical: "top",
                          horizontal: "left",
                        },
                        PaperProps: {
                          sx: {
                            mt: 0.25,
                            borderRadius: "6px",
                            boxShadow: "0px 4px 20px rgba(130, 143, 169, 0.15)",
                            border: "1px solid rgba(0,0,0,0.06)",
                            minWidth: "100%",
                            p: "4px",
                            "& .MuiMenuItem-root.Mui-selected, & .MuiMenuItem-root.Mui-selected:hover, & .MuiMenuItem-root.Mui-selected.Mui-focusVisible": {
                              backgroundColor: "#FFFFFF !important",
                            },
                            "& .MuiMenuItem-root.Mui-focusVisible": {
                              backgroundColor: "transparent !important",
                            },
                          },
                        },
                        MenuListProps: { sx: { p: 0 } },
                      };

                      const { selected, rest } = buildSortedOptions(
                        currentPhaseObj?.value,
                        selectedCohort,
                      );
                      const hasSelectableCohorts = rest.length > 0;

                      return (
                        <>
                          <FormControl
                            variant="standard"
                            sx={{
                              width: "100%",
                              height: "100%",
                              "& .MuiInput-underline:before": { borderBottom: "none" },
                              "& .MuiInput-underline:after": { borderBottom: "none" },
                              "& .MuiInputBase-root": { height: "100%" },
                            }}
                          >
                            <Select
                              value={selected?.value || ""}
                              onChange={(e) => handleCohortChange(e.target.value)}
                              disableUnderline
                              MenuProps={menuProps}
                              renderValue={(val) => normalizeLabel(val)}
                              IconComponent={DropdownChevron}
                              open={hasSelectableCohorts && isCohortSelectOpen}
                              onOpen={() => {
                                if (hasSelectableCohorts) setIsCohortSelectOpen(true);
                              }}
                              onClose={() => setIsCohortSelectOpen(false)}
                              sx={{
                                height: "100%",
                                px: "10px",
                                pr: "34px",
                                fontFamily: "Rubik",
                                fontSize: "14px",
                                lineHeight: "20px",
                                letterSpacing: "0%",
                                fontWeight: 400,
                                color: "rgba(0,0,0,0.4)",
                                "& .MuiSelect-select": {
                                  display: "flex",
                                  alignItems: "center",
                                  height: "100%",
                                  padding: 0,
                                  backgroundColor: "transparent",
                                },
                                "&:hover .MuiSelect-select": {
                                  backgroundColor: "transparent",
                                },
                                "&.Mui-focused .MuiSelect-select": {
                                  backgroundColor: "transparent",
                                },
                                "& .MuiSelect-icon": {
                                  color: "rgba(0,0,0,0.3)",
                                  right: 10,
                                  pointerEvents: "none",
                                },
                              }}
                            >
                              {selected ? (
                                <MenuItem
                                  key={`selected-${selected.value}`}
                                  value={selected.value}
                                  sx={{
                                    width: "calc(100% - 8px)",
                                    mx: "4px",
                                    my: "6px",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    textAlign: "left",
                                    px: "8px",
                                    "& .MuiTypography-root": { flex: 1, textAlign: "left" },
                                    fontFamily: "Rubik",
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    lineHeight: "18px",
                                    letterSpacing: "0%",
                                    color: "rgba(0,0,0,0.85)",
                                    "&.Mui-selected": { backgroundColor: "rgba(38, 102, 190, 0.06) !important" },
                                    "&.Mui-selected:hover": { backgroundColor: "rgba(38, 102, 190, 0.1) !important" },
                                    "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: 6 }}>
                                    <path d="M2 7L5.5 10.5L12 3.5" stroke="rgba(38,102,190,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <span>{selected.label}</span>
                                </MenuItem>
                              ) : (
                                <MenuItem value="" disabled>
                                  No Cohorts Available
                                </MenuItem>
                              )}

                              {rest.map((cohort) => (
                                <MenuItem
                                  key={cohort.value}
                                  value={cohort.value}
                                  sx={{
                                    width: "calc(100% - 8px)",
                                    mx: "4px",
                                    my: "6px",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    textAlign: "left",
                                    px: "8px",
                                    "& .MuiTypography-root": { flex: 1, textAlign: "left" },
                                    fontFamily: "Rubik",
                                    fontWeight: 400,
                                    fontSize: "14px",
                                    lineHeight: "18px",
                                    letterSpacing: "0%",
                                    color: "rgba(0,0,0,0.6)",
                                    "&.Mui-selected": { backgroundColor: "transparent" },
                                    "&.Mui-selected:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                                    "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                                  }}
                                >
                                  <span style={{ width: 20, flexShrink: 0 }} />
                                  {cohort.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <button
                            type="button"
                            aria-label="Open cohort dropdown"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (!hasSelectableCohorts) return;
                              setIsCohortSelectOpen(true);
                            }}
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              height: "100%",
                              width: 34,
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              cursor: hasSelectableCohorts ? "pointer" : "default",
                            }}
                          />
                        </>
                      );
                    })()}
                  </div>}

                  {/* PHASE */}
                  {(selectedIdData?.phases || []).filter(p => p?.title).length > 1 && <div
                    className="relative"
                    style={{
                      width: 170,
                      height: 44,
                      borderRadius: 6,
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      background: "rgba(255, 255, 255, 1)",
                      boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)",
                      flex: "0 0 auto",
                    }}
                  >
                    {(() => {
                      const normalizeLabel = (label) => {
                        const raw = String(label ?? "");
                        const trimmed = raw.trim();
                        return toDisplayTitleCase(trimmed);
                      };

                      const options = (drawerData?.top_info?.value?.phase?.value?.value ||
                        drawerData?.top_info?.value?.phase?.value ||
                        drawerData?.top_info?.value?.phase ||
                        selectedIdData?.top_info?.value?.phase?.value) ?? [];

                      const phases = Array.isArray(options)
                        ? options.map((p) => ({ value: p?.title ?? p, label: normalizeLabel(p?.title ?? p) }))
                        : [];

                      const hasMultiplePhases = (selectedIdData?.phases || []).filter(p => p?.title).length > 1;

                      const menuProps = {
                        anchorOrigin: {
                          vertical: "bottom",
                          horizontal: "left",
                        },
                        transformOrigin: {
                          vertical: "top",
                          horizontal: "left",
                        },
                        PaperProps: {
                          sx: {
                            mt: 0.25,
                            borderRadius: "6px",
                            boxShadow: "0px 4px 20px rgba(130, 143, 169, 0.15)",
                            border: "1px solid rgba(0,0,0,0.06)",
                            minWidth: "100%",
                            p: "4px",
                            "& .MuiMenuItem-root.Mui-selected, & .MuiMenuItem-root.Mui-selected:hover, & .MuiMenuItem-root.Mui-selected.Mui-focusVisible": {
                              backgroundColor: "#FFFFFF !important",
                            },
                            "& .MuiMenuItem-root.Mui-focusVisible": {
                              backgroundColor: "transparent !important",
                            },
                          },
                        },
                        MenuListProps: { sx: { p: 0 } },
                      };

                      return (
                        <>
                          <FormControl
                            variant="standard"
                            sx={{
                              width: "100%",
                              height: "100%",
                              "& .MuiInput-underline:before": { borderBottom: "none" },
                              "& .MuiInput-underline:after": { borderBottom: "none" },
                              "& .MuiInputBase-root": { height: "100%" },
                            }}
                          >
                            <Select
                              value={selectedPhase}
                              onChange={(e) => handlePhaseChange(e.target.value)}
                              disableUnderline
                              MenuProps={menuProps}
                              IconComponent={DropdownChevron}
                              open={hasMultiplePhases && isPhaseSelectOpen}
                              onOpen={() => { if (hasMultiplePhases) setIsPhaseSelectOpen(true); }}
                              onClose={() => setIsPhaseSelectOpen(false)}
                              sx={{
                                height: "100%",
                                px: "10px",
                                pr: "34px",
                                fontFamily: "Rubik",
                                fontSize: "14px",
                                lineHeight: "20px",
                                letterSpacing: "0%",
                                fontWeight: 400,
                                color: "rgba(0,0,0,0.4)",
                                "& .MuiSelect-select": {
                                  display: "flex",
                                  alignItems: "center",
                                  height: "100%",
                                  padding: 0,
                                  backgroundColor: "transparent",
                                },
                                "& .MuiSelect-icon": {
                                  color: "rgba(0,0,0,0.3)",
                                  right: 10,
                                  pointerEvents: "none",
                                },
                              }}
                              renderValue={(val) => normalizeLabel(val || "Phase 1")}
                            >
                              {phases.length ? (
                                phases.map((phase) => {
                                  const isSelected = phase.value === selectedPhase;
                                  return (
                                    <MenuItem
                                      key={phase.value}
                                      value={phase.value}
                                      sx={{
                                        width: "calc(100% - 8px)",
                                        mx: "4px",
                                        my: "6px",
                                        borderRadius: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-start",
                                        textAlign: "left",
                                        px: "8px",
                                        "& .MuiTypography-root": { flex: 1, textAlign: "left" },
                                        fontFamily: "Rubik",
                                        fontWeight: isSelected ? 500 : 400,
                                        fontSize: "14px",
                                        lineHeight: "18px",
                                        letterSpacing: "0%",
                                        color: isSelected ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.6)",
                                        "&.Mui-selected": { backgroundColor: "rgba(38, 102, 190, 0.06) !important" },
                                        "&.Mui-selected:hover": { backgroundColor: "rgba(38, 102, 190, 0.1) !important" },
                                        "&:hover": { backgroundColor: "rgba(0,0,0,0.06) !important" },
                                      }}
                                    >
                                      {isSelected ? (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: 6 }}>
                                          <path d="M2 7L5.5 10.5L12 3.5" stroke="rgba(38,102,190,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      ) : (
                                        <span style={{ width: 20, flexShrink: 0 }} />
                                      )}
                                      {phase.label}
                                    </MenuItem>
                                  );
                                })
                              ) : (
                                <MenuItem
                                  value={selectedPhase || "Phase 1"}
                                  sx={{
                                    width: "calc(100% - 8px)",
                                    mx: "4px",
                                    my: "6px",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    textAlign: "left",
                                    px: "8px",
                                    fontFamily: "Rubik",
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    lineHeight: "18px",
                                    color: "rgba(0,0,0,0.85)",
                                    "&.Mui-selected": { backgroundColor: "rgba(38, 102, 190, 0.06) !important" },
                                    "&:hover": { backgroundColor: "rgba(0,0,0,0.06) !important" },
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: 6 }}>
                                    <path d="M2 7L5.5 10.5L12 3.5" stroke="rgba(38,102,190,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  {normalizeLabel(selectedPhase || "Phase 1")}
                                </MenuItem>
                              )}
                            </Select>
                          </FormControl>
                          <button
                            type="button"
                            aria-label="Open phase dropdown"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (!hasMultiplePhases) return;
                              setIsPhaseSelectOpen(true);
                            }}
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              height: "100%",
                              width: 34,
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              cursor: hasMultiplePhases ? "pointer" : "default",
                            }}
                          />
                        </>
                      );
                    })()}
                  </div>}

                  {/* DATA TRACEABILITY */}
                  <Box className="flex items-center gap-2">
                    <Switch
                      checked={isAlertActive || false}
                      onChange={(e) => dispatch(toggleAlert(e.target.checked))}
                      sx={{
                        width: 42,
                        height: 24,
                        padding: 0,
                        display: "flex",
                        "& .MuiSwitch-switchBase": {
                          padding: "2px",
                          "&.Mui-checked": {
                            transform: "translateX(18px)",
                            color: "#fff",
                            "& + .MuiSwitch-track": {
                              backgroundColor: "#2666BE",
                              opacity: 1,
                            },
                          },
                        },
                        "& .MuiSwitch-track": {
                          borderRadius: 12,
                          backgroundColor: "#E0E1E6",
                          opacity: 1,
                        },
                        "& .MuiSwitch-thumb": {
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontFamily: "Rubik",
                        fontWeight: 500,
                        color: "rgba(0,0,0,0.80)",
                        lineHeight: "100%",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Data Traceability
                    </Typography>
                  </Box>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-row flex-wrap items-center gap-x-2 text-[13px] text-gray-500 mb-6 w-full max-w-full" style={{ overflow: "visible", lineHeight: "1.6" }}>
              {selectedIdData?.top_info?.value
                ? (() => {
                    const formatLabelValue = (value) => {
                      if (!value) return "";
                      if (Array.isArray(value)) return value.join(", ");
                      if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
                        try {
                          return value.replace(/[\[\]']/g, "").split(",").map(i => i.trim()).join("+ ");
                        } catch (e) { return value; }
                      }
                      return value;
                    };

                    const getVal = (field) => {
                      const v = selectedIdData?.top_info?.value?.[field];
                      return v && typeof v === "object" && !Array.isArray(v) && "value" in v ? v.value : v;
                    };
                    const getData = (field) => {
                      const v = selectedIdData?.top_info?.value?.[field];
                      return v && typeof v === "object" && !Array.isArray(v) && "value" in v ? v : { value: v };
                    };

                    const cohortCount = (selectedIdData?.phases || []).reduce(
                      (acc, phase) => acc + (phase?.value || []).filter(c => c?.title).length, 0
                    ) || null;

                    const items = [
                      { key: "organ", label: formatLabelValue(getVal("organ")), data: getData("organ") },
                      { key: "phase", label: formatLabelValue(getVal("phase")), data: getData("phase") },
                      { key: "stage", label: formatLabelValue(getVal("stage")), data: getData("stage") },
                      { key: "histology", label: formatLabelValue(getVal("histology")), data: getData("histology") },
                      { key: "cohort_count", label: cohortCount ? `${cohortCount} Cohorts` : "", data: getData("cohort_count") },
                      { key: "line_of_therapy", label: formatLabelValue(getVal("line_of_therapy")), data: getData("line_of_therapy") },
                      { key: "trial_architecture", label: formatLabelValue(getVal("trial_architecture")), data: getData("trial_architecture") },  
                      { key: "regimen_combination", label: formatLabelValue(getVal("regimen_combination")), data: getData("regimen_combination") },
                      
                    ].filter(item => item.label && item.label !== "Not available");

                    return items.map((item, index) => {
                      const valuesArray = item.key === "cohort_count" ? item.label : item.data?.value;

                      return (
                        <React.Fragment key={item.key}>
                          {index > 0 && (
                            <span className="text-gray-400 shrink-0 mx-1 select-none flex-shrink-0" style={{ fontSize: "18px" }}>
                              •
                            </span>
                          )}
                          <div className="inline-block min-w-0 align-middle overflow-visible">
                            {(() => {
                              const rawValues = valuesArray;
                              const arr = Array.isArray(rawValues) ? rawValues : (rawValues === null || rawValues === undefined ? [] : [rawValues]);

                              if (arr.length <= 1) {
                                return (
                                  <span className="inline-flex items-center text-gray-500 font-normal truncate max-w-full" style={{ fontSize: "16px" }}>
                                    <EvidenceHoverHeader
                                      label={<span className="inline text-gray-500 truncate" style={{ fontSize: "16px" }}>{arr[0] || ""}</span>}
                                      evidence={{
                                        source_date: selectedIdData?.source_date,
                                        version: selectedIdData?.version,
                                        highlight: getTrace(item?.data)?.source_text,
                                        reasoning: getTrace(item?.data)?.reasoning || "No reasoning provided.",
                                        confidence: getTrace(item?.data)?.confidence_score || "0",
                                        source: getTrace(item?.data)?.source,
                                        source_link: getTrace(item?.data)?.source_link,
                                        nctId: selectedIdData?.top_info?.value?.nctid?.value,
                                      }}
                                    />
                                  </span>
                                );
                              }

                              const isStageKey = item.key === "stage";
                              const visibleValues = isStageKey ? arr.slice(0, 2) : arr;
                              const hiddenItems = isStageKey ? arr.slice(2) : [];

                              return (
                                <div className="inline-flex items-center min-w-0 max-w-full whitespace-nowrap align-middle overflow-visible">
                                  {visibleValues.map((val, idx) => (
                                    <span key={idx} className="inline-flex items-center text-gray-500 min-w-0 max-w-full whitespace-nowrap" style={{ fontSize: "16px" }}>
                                      {idx > 0 && <span className="text-gray-400 mx-1 select-none flex-shrink-0">+</span>}
                                      <div className="truncate max-w-full" style={{ display: "inline-flex", alignItems: "center" }}>
                                        <EvidenceHoverHeader
                                          label={<span className="text-gray-500 truncate max-w-full" style={{ fontSize: "16px", display: "inline-flex", alignItems: "center" }}>{val}</span>}
                                          evidence={{
                                            source_date: selectedIdData?.source_date,
                                            version: selectedIdData?.version,
                                            highlight: getTrace(item?.data)?.source_text,
                                            reasoning: getTrace(item?.data)?.reasoning || "No reasoning provided.",
                                            confidence: getTrace(item?.data)?.confidence_score || "0",
                                            source: getTrace(item?.data)?.source,
                                            source_link: getTrace(item?.data)?.source_link,
                                            nctId: selectedIdData?.top_info?.value?.nctid?.value,
                                          }}
                                        />
                                      </div>
                                    </span>
                                  ))}
                                  {hiddenItems.length > 0 && (
                                    <Tooltip
                                      placement="bottom-start"
                                      title={
                                        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: "8px", padding: "10px 12px", fontFamily: "Rubik, sans-serif", fontSize: "14px", fontWeight: 500, color: "rgba(107, 114, 128, 1)", whiteSpace: "nowrap" }}>
                                          {hiddenItems.map((val, idx) => (
                                            <React.Fragment key={idx}>
                                              {idx > 0 && <span className="text-gray-400 font-normal">+</span>}
                                              <div>{val}</div>
                                            </React.Fragment>
                                          ))}
                                        </div>
                                      }
                                      slotProps={{ tooltip: { sx: { backgroundColor: "white", boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.15)", borderRadius: "8px", padding: 0, maxWidth: "none" } } }}
                                    >
                                      <span style={{ height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", borderRadius: "4px", padding: "0 5px", background: "rgba(232, 232, 236, 1)", fontFamily: "Rubik", fontWeight: 500, fontSize: "11px", color: "rgba(0,0,0,0.8)", lineHeight: "18px", cursor: "pointer", marginLeft: "6px", flexShrink: 0 }}>
                                        +{hiddenItems.length}
                                      </span>
                                    </Tooltip>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()
                : ""}
            </div>
            {/* </div> */}

            <div className="gap-x-6 gap-y-2 text-sm text-gray-700 mt-2">
              {/* ROW 1 */}
              <div className="flex items-start text-sm text-gray-700">
                {/* Sponsor */}
                <div className="flex-1">
                  <span className="text-gray-500 block">
                    {selectedIdData?.top_info?.value?.sponsor?.title ||
                      "Sponsor"}
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      fontFamily: "Rubik",
                      fontWeight: 500,
                      color: "rgba(0,0,0,0.8)",
                    }}
                  >
                    <SafeRender>
                      {selectedIdData?.top_info?.value?.sponsor?.value || "-"}
                    </SafeRender>
                  </p>
                </div>

                <div className="h-10 border-l border-gray-300 mx-4" />

                {/* Study Lead */}
                <div className="flex-1">
                  <span className="text-gray-500 block">
                    {selectedIdData?.top_info?.value?.study_lead?.title ||
                      "Study Lead"}
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      fontFamily: "Rubik",
                      fontWeight: 500,
                      color: "rgba(0,0,0,0.8)",
                    }}
                  >
                    <SafeRender>
                      {selectedIdData?.top_info?.value?.study_lead?.value ||
                        "-"}
                    </SafeRender>
                  </p>
                </div>

                <div className="h-10 border-l border-gray-300 mx-4" />

                {/* Latest Update */}
                <div className="flex-1">
                  <span className="text-gray-500 block">
                    {selectedIdData?.top_info?.value?.latest_update?.title ||
                      "Latest Update"}
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      fontFamily: "Rubik",
                      fontWeight: 500,
                      color: "rgba(0,0,0,0.8)",
                    }}
                  >
                    <SafeRender>
                      {(() => {
                        const rawValue =
                          selectedIdData?.top_info?.value?.latest_update?.value ||
                          "-";
                        const iso =
                          typeof rawValue === "string" &&
                          /^\d{4}-\d{2}-\d{2}$/.test(rawValue.trim())
                            ? rawValue.trim()
                            : null;
                        if (!iso) return rawValue;

                        const [yyyy, mm, dd] = iso.split("-");
                        const monthIndex = Number(mm) - 1;
                        const months = [
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ];
                        const day = Number(dd);
                        const month = months[monthIndex] ?? mm;
                        return `${day} ${month} ${yyyy}`;
                      })()}
                    </SafeRender>
                  </p>
                </div>
              </div>

              <div className="flex items-start text-sm text-gray-700 mt-3">
                {/* Primary Completion */}
                <div className="flex-1">
                  <span className="text-gray-500 block">
                    {selectedIdData?.top_info?.value?.primary_completion
                      ?.title || "Primary Completion"}
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      fontFamily: "Rubik",
                      fontWeight: 500,
                      color: "rgba(0,0,0,0.8)",
                    }}
                  >
                    <SafeRender>
                      {(() => {
                        const rawValue =
                          selectedIdData?.top_info?.value?.primary_completion
                            ?.value || "-";
                        const iso =
                          typeof rawValue === "string" &&
                          /^\d{4}-\d{2}-\d{2}$/.test(rawValue.trim())
                            ? rawValue.trim()
                            : null;
                        if (!iso) return rawValue;

                        const [yyyy, mm, dd] = iso.split("-");
                        const monthIndex = Number(mm) - 1;
                        const months = [
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ];
                        const day = Number(dd);
                        const month = months[monthIndex] ?? mm;
                        return `${day} ${month} ${yyyy}`;
                      })()}
                    </SafeRender>
                  </p>
                </div>

                <div className="h-10 border-l border-gray-300 mx-4" />

                {/* Status */}
                <div className="flex-1">
                  <span className="text-gray-500 block">
                    {selectedIdData?.top_info?.value?.status?.title || "Status"}
                  </span>
                  <div className="flex items-center gap-1">
                    <p
                      style={{
                        fontSize: "13px",
                        fontFamily: "Rubik",
                        fontWeight: 500,
                        color: getStatusColor(
                          selectedIdData?.top_info?.value?.status?.value,
                        ),
                        margin: 0,
                      }}
                    >
                      <SafeRender>
                        {selectedIdData?.top_info?.value?.status?.value || "-"}
                      </SafeRender>
                    </p>
                    <div
                      className="relative inline-block"
                      onMouseEnter={(e) => {
                        setHoveredId("status");
                        openStatusPopover(e);
                      }}
                      onMouseLeave={() => {
                        setHoveredId(null);
                        setStatusPopoverStyle(null);
                      }}
                    >
                      <div className="cursor-pointer p-1">
                        <svg
                          className={`w-4 h-4 ${hoveredId === "status" ? "text-orange-600" : "text-orange-400"}`}
                          style={{
                            transition: "transform 0.2s ease",
                            transform: hoveredId === "status" ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>

                      {hoveredId === "status" && sortedTimeline?.length > 0 && (
                        <div
                          className="z-[9999] bg-white border animate-in fade-in zoom-in duration-200"
                          style={{
                            boxSizing: "border-box",
                            zIndex: "9999",
                            borderRadius: "4px",
                            borderColor: "rgba(0,0,0,0.05)",
                            padding: "15px",
                            boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.1)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            backgroundColor: "rgba(255, 255, 255, 1)",
                            overflowX: "hidden",
                            overflowY: "visible",
                            ...(statusPopoverStyle || {}),
                          }}
                        >
                          <Timeline data={sortedTimeline} noContainer />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-10 border-l border-gray-300 mx-4" />

                {/* Registry Source */}
                <div className="flex-1">
                  <span className="text-gray-500 block">Trial Identifiers</span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "2px",
                    }}
                  >
                    {(() => {
                      const registryValue =
                        selectedIdData?.top_info?.value?.registry_source;

                      const usingTitleAsPrimary =
                        typeof registryValue?.title === "string" &&
                        registryValue.title.trim().length > 0;

                      const registryIds = Array.isArray(registryValue)
                        ? registryValue
                        : Array.isArray(registryValue?.value)
                          ? registryValue.value
                          : Array.isArray(registryValue?.value?.value)
                            ? registryValue.value.value
                            : [];

                      const first = registryIds?.[0];

                      const pickText = (val) => {
                        if (typeof val === "string") return val;
                        if (val && typeof val === "object") {
                          return (
                            (typeof val.id === "string" && val.id) ||
                            (typeof val.title === "string" && val.title) ||
                            (typeof val.value === "string" && val.value) ||
                            ""
                          );
                        }
                        return "";
                      };

                      const registryCode = usingTitleAsPrimary
                        ? registryValue.title
                        : pickText(first) ||
                          pickText(registryValue?.id) ||
                          pickText(registryValue?.title) ||
                          pickText(registryValue?.value) ||
                          "";

                      const extraRegistryCodes = usingTitleAsPrimary
                        ? registryIds.map((entry) => pickText(entry)).filter(Boolean)
                        : registryIds
                            .slice(1)
                            .map((entry) => pickText(entry))
                            .filter(Boolean);

                      const extraCount = usingTitleAsPrimary
                        ? registryIds.length
                        : registryIds.length > 1
                          ? registryIds.length - 1
                          : 0;

                      const getRegistryUrl = (id) => {
                        const trimmed = id.trim();
                        if (/^NCT\d+$/i.test(trimmed))
                          return `https://clinicaltrials.gov/study/${trimmed}`;
                        if (/^EU\s?CTR\s?[\d-]+$/i.test(trimmed) || /^\d{4}-\d{6}-\d{2}(-\w+)?$/.test(trimmed))
                          return `https://www.clinicaltrialsregister.eu/ctr-search/search?query=${encodeURIComponent(trimmed)}`;
                        if (/^ChiCTR/i.test(trimmed))
                          return `https://www.chictr.org.cn/showproj.aspx?proj=${trimmed}`;
                        if (/^ISRCTN/i.test(trimmed))
                          return `https://www.isrctn.com/${trimmed}`;
                        if (/^ACTRN/i.test(trimmed))
                          return `https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?id=${trimmed.replace(/^ACTRN/i, "")}`;
                        if (/^CTRI/i.test(trimmed))
                          return `https://ctri.nic.in/Clinicaltrials/showallp.php?mid1=&EncHid=&userName=${encodeURIComponent(trimmed)}`;
                        if (/^DRKS/i.test(trimmed))
                          return `https://drks.de/search/en/trial/${trimmed}`;
                        if (/^jRCT/i.test(trimmed))
                          return `https://jrct.niph.go.jp/en-latest-detail/${trimmed}`;
                        if (/^UMIN/i.test(trimmed))
                          return `https://upload.umin.ac.jp/cgi-open-bin/ctr_e/ctr_view.cgi?recptno=${trimmed}`;
                        return null;
                      };

                      const RegistryLink = ({ code }) => {
                        const url = getRegistryUrl(code);
                        const baseStyle = {
                          fontSize: "14px",
                          fontFamily: "Rubik, sans-serif",
                          fontWeight: "500",
                          lineHeight: "20px",
                          textDecoration: "none",
                        };
                        return url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...baseStyle, color: "rgba(38, 102, 190, 1)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                          >
                            {code}
                          </a>
                        ) : (
                          <span style={{ ...baseStyle, color: "rgba(0,0,0,0.8)" }}>{code}</span>
                        );
                      };

                      return (
                        <>
                          <RegistryLink code={registryCode || "-"} />
                          {extraCount > 0 && (
                            <Tooltip
                              placement="bottom-start"
                              title={
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                    padding: "8px 10px",
                                    fontFamily: "Rubik, sans-serif",
                                  }}
                                >
                                  {extraRegistryCodes.map((code, idx) => (
                                    <div key={`${code}-${idx}`}>
                                      <RegistryLink code={code} />
                                    </div>
                                  ))}
                                </div>
                              }
                              slotProps={{
                                tooltip: {
                                  sx: {
                                    backgroundColor: "rgba(255,255,255,1)",
                                    boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.15)",
                                    borderRadius: "8px",
                                    padding: 0,
                                  },
                                },
                              }}
                            >
                              <span
                                style={{
                                  height: "20px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "4px",
                                  padding: "3px 6px",
                                  gap: "2px",
                                  background: "rgba(232, 232, 236, 1)",
                                  fontFamily: "Rubik",
                                  fontWeight: 500,
                                  fontSize: "12px",
                                  lineHeight: "16px",
                                  letterSpacing: "0%",
                                  color: "rgba(0,0,0,0.8)",
                                  cursor: "default",
                                }}
                              >
                                +{extraCount}
                              </span>
                            </Tooltip>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Enrollment & Sites Cards */}
            {(() => {
              const sd = drawerData?.study_details;
              const enrollmentValue =
                selectedIdData?.top_info?.value?.enrollment?.value ||
                sd?.enrollment?.value;
              const hasEnrollment =
                enrollmentValue?.Planned?.value || enrollmentValue?.Completed?.value;

              const siteSummary =
                selectedIdData?.top_info?.value?.sites ||
                sd?.sites || sd?.patient_population?.value?.sites;
              const siteSummaryValue = siteSummary?.value;
              const hasSites = (() => {
                if (!siteSummaryValue) return false;
                if (Array.isArray(siteSummaryValue)) return siteSummaryValue.length > 0;
                if (typeof siteSummaryValue === "object") return Object.keys(siteSummaryValue).length > 0;
                if (typeof siteSummaryValue === "string") return siteSummaryValue.trim().length > 0;
                return false;
              })();
              const siteSummaryDisplayValue =
                siteSummaryValue && typeof siteSummaryValue === "object"
                  ? siteSummaryValue.value
                  : siteSummaryValue;

              if (!hasEnrollment && !hasSites) return null;

              const cardStyle = {
                width: "100%",
                minHeight: "78px",
                padding: "15px",
                borderRadius: "4px",
                border: "1px solid rgba(0, 0, 0, 0.05)",
                boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.1)",
                gap: "0px",
                boxSizing: "border-box",
                background: "#fff",
              };

              const getEv = (item) => {
                const trace = getTrace(item);
                return {
                  source_date: drawerData?.source_date,
                  version: drawerData?.version,
                  nctId: selectedIdData?.top_info?.value?.nctid?.value,
                  highlight: trace?.source_text || [],
                  arm: item?.title || "Detail",
                  reasoning: trace?.reasoning,
                  confidence: trace?.confidence_score,
                  source: trace?.source,
                  source_link: trace?.source_link,
                };
              };

              const stripCountryCode = (str) =>
                typeof str === "string" ? str.replace(/\s*\(\s*[A-Z]{2,4}\s*\)/g, "").trim() : str;

              const SitesSummaryCard = () => {
                const [expanded, setExpanded] = React.useState(false);
                const contentRef = React.useRef(null);
                const [hasOverflow, setHasOverflow] = React.useState(false);

                React.useEffect(() => {
                  const el = contentRef.current;
                  if (!el) return;
                  setHasOverflow(el.scrollHeight > 44);
                }, [siteSummaryValue]);

                const textStyle = {
                  fontFamily: "Rubik",
                  fontSize: "16px",
                  color: "rgba(0,0,0,0.5)",
                  lineHeight: "20px",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: expanded ? "unset" : 2,
                };

                const renderContent = () => {
                  if (Array.isArray(siteSummaryValue)) {
                    return siteSummaryValue.map((site, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span style={{ color: "rgba(0,0,0,0.3)" }}>, </span>}
                        <span>{stripCountryCode(site?.value) || "N/A"}</span>
                      </React.Fragment>
                    ));
                  }
                  if (siteSummaryDisplayValue) {
                    return <span>{stripCountryCode(siteSummaryDisplayValue)}</span>;
                  }
                  if (siteSummaryValue?.countries) {
                    return <>Countries: <span>{stripCountryCode(siteSummaryValue.countries)}</span></>;
                  }
                  if (siteSummaryValue?.sites) {
                    return <>Sites: <span>{stripCountryCode(siteSummaryValue.sites)}</span></>;
                  }
                  return null;
                };

                return (
                  <div>
                    <div ref={contentRef} style={textStyle}>
                      {renderContent()}
                    </div>
                    {hasOverflow && (
                      <button
                        type="button"
                        onClick={() => setExpanded((prev) => !prev)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "4px",
                          fontFamily: "Rubik",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "rgba(38, 102, 190, 1)",
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        {expanded ? "Show less" : "Show all"}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(38, 102, 190, 1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}>
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              };

              const bothCards = hasEnrollment && hasSites;
              return (
                <div className={`grid ${bothCards ? "grid-cols-2" : "grid-cols-1"} gap-3 mt-5`}>
                  {hasEnrollment && (
                    <div style={cardStyle}>
                      <p style={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "16px", color: "rgba(0,0,0,0.7)", margin: 0 }}>
                        Enrollment
                      </p>
                      <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                        {enrollmentValue?.Planned?.value && (() => {
                          const rawValue = String(enrollmentValue.Planned.value ?? "N/A");
                          const match = rawValue.match(/(\d+)\s*\(([^)]+)\)/);
                          const number = match?.[1] || rawValue;
                          const text = match?.[2] || "";
                          return (
                            <span style={{ fontSize: "16px", fontFamily: "Rubik", color: "rgba(0,0,0,0.5)" }}>
                              <EvidenceHoverHeader
                                label={
                                  <>
                                    <strong style={{ fontSize: "16px", fontFamily: "Rubik", fontWeight: "500", color: "rgba(0,0,0,0.7)" }}>
                                      {number}
                                    </strong>
                                    {text && <>&nbsp;({text})</>}
                                  </>
                                }
                                evidence={getEv(enrollmentValue.Planned)}
                              />
                            </span>
                          );
                        })()}
                        {enrollmentValue?.Completed?.value && (() => {
                          const rawValue = String(enrollmentValue.Completed.value ?? "N/A");
                          const match = rawValue.match(/^([^\s(]+)\s*\(([^)]+)\)/);
                          const number = match?.[1] || rawValue;
                          const text = match?.[2] ? ` (${match[2]})` : "";
                          return (
                            <span style={{ fontSize: "16px", fontFamily: "Rubik", color: "rgba(0,0,0,0.5)" }}>
                              <EvidenceHoverHeader
                                label={
                                  <>
                                    <strong style={{ fontSize: "16px", fontFamily: "Rubik", fontWeight: "500", color: "rgba(0,0,0,0.7)" }}>
                                      {number}
                                    </strong>
                                    {text && <>&nbsp;{text}</>}
                                  </>
                                }
                                evidence={getEv(enrollmentValue.Completed)}
                              />
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  {hasSites && (
                    <div style={cardStyle}>
                      <p style={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "16px", color: "rgba(0,0,0,0.7)", margin: 0 }}>
                        {siteSummary?.title || "Sites"}
                      </p>
                      <div style={{ marginTop: "8px" }}>
                        <SitesSummaryCard />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Removed in drawer (not present in main executive summary): Evidence Strength / Operational Feasibility + Study Summary */}
            {activeCard === "__never__" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5 items-start">
              {[
                {
                  id: "evidence",
                  title: "Evidence Strength",
                  data: selectedIdData?.top_info?.value?.trial_quality_scores
                    ?.value?.evidence_strength,
                  footerNote:
                    "This score reflects the statistical robustness and design quality of the clinical trial.",
                },
                {
                  id: "operational",
                  title: "Operational Feasibility",
                  data: selectedIdData?.top_info?.value?.trial_quality_scores
                    ?.value?.operational_feasibility,
                  footerNote:
                    "Feasibility is calculated based on site distribution and enrollment rates.",
                },
              ].map((card) => {
                const hasData = !!card.data;
                const isPositive = card?.data?.benchmark >= 0;
                const scoreBreakdown = card.data?.value
                  ? Object.entries(card.data.value)
                  : [];
                const isHovered = hasData && activeCard === card.id;

                return (
                  <div
                    key={card.id}
                    onMouseEnter={() => hasData && setActiveCard(card.id)}
                    onMouseLeave={() => setActiveCard(null)}
                    className={`self-start h-fit border border-black/5 rounded-lg p-4 transition-all duration-500 ease-in-out
                      ${isHovered ? "bg-white" : "bg-gray-50"}
                      ${!hasData ? "opacity-80" : ""}`}
                  >
                    <div className="relative min-h-[105px] overflow-hidden">
                      {/* DEFAULT VIEW */}
                      {!isHovered && (
                        <div className="flex flex-col animate-out fade-out duration-300 ease-in-out">
                          {/* HEADER */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[14px] font-medium text-gray-800">
                              {card.title}
                            </span>
                            {/* ✅ Help icon preserved */}
                            <img
                              src={helpIcon}
                              alt="help"
                              className="w-4 h-4"
                            />
                          </div>

                          {/* SCORE ROW */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-baseline">
                              <span
                                className="font-semibold text-gray-800"
                                style={{
                                  fontSize: "30px",
                                  lineHeight: "32px",
                                  fontFamily: "Rubik",
                                }}
                              >
                                {hasData ? card.data?.score : "—"}
                              </span>
                              <span className="text-gray-400 text-[16px] ml-0.5">
                                /100
                              </span>
                            </div>

                            {hasData ? (
                              <span
                                className={`px-3 py-[2px] rounded-full border text-[13px]
                      ${
                        isPositive
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                                style={{ fontFamily: "Rubik" }}
                              >
                                {isPositive
                                  ? `+${card.data?.benchmark}`
                                  : card.data?.benchmark}{" "}
                                compared to benchmark
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Data not available
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* HOVER VIEW */}
                      {isHovered && hasData && (
                        <div className="flex flex-col space-y-1">
                          {scoreBreakdown.map(([key, detail], index) => (
                            <div
                              key={key}
                              className="animate-in fade-in slide-in-from-top-2 duration-500 ease-out"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <EvidenceHoverHeader
                                label={
                                  <div
                                    className={`flex items-center gap-3 py-1.5 cursor-pointer group
                          ${index % 2 === 1 ? "bg-gray-50/80 -mx-4 px-4" : ""}`}
                                  >
                                    <div
                                      className="flex items-center justify-center rounded"
                                      style={{
                                        width: 18,
                                        height: 18,
                                        background: "#f3f4f7",
                                      }}
                                    >
                                      <svg
                                        width="8"
                                        height="8"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="text-gray-400 group-hover:text-gray-600"
                                      >
                                        <path
                                          d="M9 5l7 7-7 7"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </div>

                                    <div className="flex justify-between w-full">
                                      <span className="text-[12px] text-gray-500 group-hover:text-gray-900">
                                        {detail?.title ||
                                          key.replace(/_/g, " ")}
                                      </span>
                                      <span className="text-[12px] font-medium text-gray-700">
                                        {detail?.score > 0
                                          ? `+ ${detail.score}`
                                          : detail?.score < 0
                                            ? `- ${Math.abs(detail.score)}`
                                            : "→ 0"}
                                      </span>
                                    </div>
                                  </div>
                                }
                                evidence={{
                                  source_date: selectedIdData?.source_date,
                                  version: selectedIdData?.version,
                                  highlight: getTrace(detail)?.source_text,
                                  reasoning:
                                    getTrace(detail)?.reasoning ||
                                    "No reasoning provided.",
                                  confidence: getTrace(detail)?.confidence_score || "0",
                                  source: getTrace(detail)?.source,
                                  source_link: getTrace(detail)?.source_link,
                                  nctId:
                                    selectedIdData?.top_info?.value?.nctid
                                      ?.value,
                                }}
                              />
                            </div>
                          ))}

                          {/* FOOTER */}
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[14px] font-bold text-gray-900">
                                Subtotal: {card.data?.score}
                              </span>
                              <span className="text-gray-300">→</span>
                              <span className="text-[14px] font-bold text-gray-900">
                                {card.data?.score <= 0 ? "0" : card.data?.score}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400">
                              {card.footerNote}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}


            {/* STUDY SUMMARY removed (per updated design) */}
            {activeCard === "__never__" && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: "8px",
                  marginTop: "16px",
                  padding: "16px",
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  columnGap: "24px",
                  alignItems: "stretch",
                }}
              />
            )}

            {!isSticky && (
              <div>
                <div className="mt-5 flex items-center gap-4">
              {/* <DownloadWithMenu /> */}

              {/* COHORT */}
              {(currentPhaseObj?.value || []).filter(c => c?.title).length > 1 && <div
                className="relative"
                style={{
                  width: 170,
                  height: 44,
                  borderRadius: 6,
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  background: "rgba(255, 255, 255, 1)",
                  boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)",
                  flex: "0 0 auto",
                }}
              >
                {(() => {
                  const normalizeLabel = (label) => {
                    const raw = String(label ?? "");
                    const fixedTypo = raw.replace(/cohot/gi, "cohort");
                    const trimmed = fixedTypo.trim();
                    const withoutSuffix = trimmed.replace(/\s+[A-Za-z]$/, "");
                    return toDisplayTitleCase(withoutSuffix);
                  };

                  const buildSortedOptions = (rawOptions, selectedValue) => {
                    const options = (rawOptions || [])
                      .map((opt) => ({
                        value: opt?.title ?? "",
                        label: normalizeLabel(opt?.title),
                      }))
                      .filter((opt) => opt.value);
                    const uniqueOptions = [
                      ...options
                        .reduce((acc, opt) => {
                          const key = opt.label.trim().toLowerCase();
                          if (!acc.has(key) || opt.value === selectedValue) {
                            acc.set(key, opt);
                          }
                          return acc;
                        }, new Map())
                        .values(),
                    ];

                    const sorted = [...uniqueOptions].sort((a, b) =>
                      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
                    );

                    const selected =
                      sorted.find((o) => o.value === selectedValue) ||
                      (sorted.length === 1 ? sorted[0] : null);
                    const rest = selected
                      ? sorted.filter((o) => o.value !== selected.value)
                      : sorted;
                    return { selected, rest };
                  };

                  const menuProps = {
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                    PaperProps: {
                      sx: {
                        mt: 0.25,
                        borderRadius: "6px",
                        boxShadow: "0px 4px 20px rgba(130, 143, 169, 0.15)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        minWidth: "100%",
                        p: "4px",
                        "& .MuiMenuItem-root.Mui-selected, & .MuiMenuItem-root.Mui-selected:hover, & .MuiMenuItem-root.Mui-selected.Mui-focusVisible": {
                          backgroundColor: "#FFFFFF !important",
                        },
                        "& .MuiMenuItem-root.Mui-focusVisible": {
                          backgroundColor: "transparent !important",
                        },
                      },
                    },
                    MenuListProps: { sx: { p: 0 } },
                  };

                  const { selected, rest } = buildSortedOptions(
                    currentPhaseObj?.value,
                    selectedCohort,
                  );
                  const hasSelectableCohorts = rest.length > 0;

                  return (
                    <>
                      <FormControl
                        variant="standard"
                        sx={{
                          width: "100%",
                          height: "100%",
                          "& .MuiInput-underline:before": { borderBottom: "none" },
                          "& .MuiInput-underline:after": { borderBottom: "none" },
                          "& .MuiInputBase-root": { height: "100%" },
                        }}
                      >
                        <Select
                          value={selected?.value || ""}
                          onChange={(e) => handleCohortChange(e.target.value)}
                          disableUnderline
                          MenuProps={menuProps}
                          renderValue={(val) => normalizeLabel(val)}
                          IconComponent={DropdownChevron}
                          open={hasSelectableCohorts && isCohortSelectOpen}
                          onOpen={() => {
                            if (hasSelectableCohorts) setIsCohortSelectOpen(true);
                          }}
                          onClose={() => setIsCohortSelectOpen(false)}
                          sx={{
                            height: "100%",
                            px: "10px",
                            pr: "34px",
                            fontFamily: "Rubik",
                            fontSize: "14px",
                            lineHeight: "20px",
                            letterSpacing: "0%",
                            fontWeight: 400,
                            color: "rgba(0,0,0,0.4)",
                            "& .MuiSelect-select": {
                              display: "flex",
                              alignItems: "center",
                              height: "100%",
                              padding: 0,
                              backgroundColor: "transparent",
                            },
                            "&:hover .MuiSelect-select": {
                              backgroundColor: "transparent",
                            },
                            "&.Mui-focused .MuiSelect-select": {
                              backgroundColor: "transparent",
                            },
                            "& .MuiSelect-icon": {
                              color: "rgba(0,0,0,0.3)",
                              right: 10,
                              pointerEvents: "none",
                            },
                          }}
                        >
                        {selected ? (
                          <MenuItem
                            key={`selected-${selected.value}`}
                            value={selected.value}
                            sx={{
                              width: "calc(100% - 8px)",
                              mx: "4px",
                              my: "6px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              textAlign: "left",
                              px: "8px",
                              "& .MuiTypography-root": { flex: 1, textAlign: "left" },
                              fontFamily: "Rubik",
                              fontWeight: 500,
                              fontSize: "14px",
                              lineHeight: "18px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.85)",
                              "&.Mui-selected": { backgroundColor: "rgba(38, 102, 190, 0.06) !important" },
                              "&.Mui-selected:hover": { backgroundColor: "rgba(38, 102, 190, 0.1) !important" },
                              "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: 6 }}>
                              <path d="M2 7L5.5 10.5L12 3.5" stroke="rgba(38,102,190,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>{selected.label}</span>
                          </MenuItem>
                        ) : (
                          <MenuItem value="" disabled>
                            No Cohorts Available
                          </MenuItem>
                        )}

                        {rest.map((cohort) => (
                          <MenuItem
                            key={cohort.value}
                            value={cohort.value}
                            sx={{
                              width: "calc(100% - 8px)",
                              mx: "4px",
                              my: "6px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              textAlign: "left",
                              px: "8px",
                              "& .MuiTypography-root": { flex: 1, textAlign: "left" },
                              fontFamily: "Rubik",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "18px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.6)",
                              "&.Mui-selected": { backgroundColor: "transparent" },
                              "&.Mui-selected:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                              "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                            }}
                          >
                            <span style={{ width: 20, flexShrink: 0 }} />
                            {cohort.label}
                          </MenuItem>
                        ))}
                        </Select>
                      </FormControl>

                      {/* Ensures the arrow area also opens the dropdown */}
                      <button
                        type="button"
                        aria-label="Open cohort dropdown"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!hasSelectableCohorts) return;
                          setIsCohortSelectOpen(true);
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          height: "100%",
                          width: 34,
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: hasSelectableCohorts ? "pointer" : "default",
                        }}
                      />
                    </>
                  );
                })()}
              </div>}

              {/* PHASE */}
              {(selectedIdData?.phases || []).filter(p => p?.title).length > 1 && <div
                className="relative"
                style={{
                  width: 170,
                  height: 44,
                  borderRadius: 6,
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  background: "rgba(255, 255, 255, 1)",
                  boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)",
                  flex: "0 0 auto",
                }}
              >
                {(() => {
                  const normalizeLabel = (label) => toDisplayTitleCase(label);

                  const buildSortedOptions = (rawOptions, selectedValue) => {
                    const options = (rawOptions || [])
                      .map((opt) => ({
                        value: opt?.title ?? "",
                        label: normalizeLabel(opt?.title),
                      }))
                      .filter((opt) => opt.value);

                    const sorted = [...options].sort((a, b) =>
                      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
                    );

                    const selected = sorted.find((o) => o.value === selectedValue);
                    const rest = sorted.filter((o) => o.value !== selectedValue);
                    return { selected, rest };
                  };

                  const menuProps = {
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                    PaperProps: {
                      sx: {
                        mt: 0.25,
                        borderRadius: "6px",
                        boxShadow: "0px 4px 20px rgba(130, 143, 169, 0.15)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        minWidth: "100%",
                        p: "4px",
                        "& .MuiMenuItem-root.Mui-selected, & .MuiMenuItem-root.Mui-selected:hover, & .MuiMenuItem-root.Mui-selected.Mui-focusVisible": {
                          backgroundColor: "#FFFFFF !important",
                        },
                        "& .MuiMenuItem-root.Mui-focusVisible": {
                          backgroundColor: "transparent !important",
                        },
                      },
                    },
                    MenuListProps: { sx: { p: 0 } },
                  };

                  const { selected, rest } = buildSortedOptions(
                    drawerData?.phases,
                    selectedPhase,
                  );

                  const hasMultiplePhases = (selectedIdData?.phases || []).filter(p => p?.title).length > 1;

                  return (
                    <>
                      <FormControl
                        variant="standard"
                        sx={{
                          width: "100%",
                          height: "100%",
                          "& .MuiInput-underline:before": { borderBottom: "none" },
                          "& .MuiInput-underline:after": { borderBottom: "none" },
                          "& .MuiInputBase-root": { height: "100%" },
                        }}
                      >
                        <Select
                          value={selectedPhase}
                          onChange={(e) => handlePhaseChange(e.target.value)}
                          disableUnderline
                          MenuProps={menuProps}
                          renderValue={(val) => normalizeLabel(val)}
                          IconComponent={DropdownChevron}
                          open={hasMultiplePhases && isPhaseSelectOpen}
                          onOpen={() => { if (hasMultiplePhases) setIsPhaseSelectOpen(true); }}
                          onClose={() => setIsPhaseSelectOpen(false)}
                          sx={{
                            height: "100%",
                            px: "10px",
                            pr: "34px",
                            fontFamily: "Rubik",
                            fontSize: "14px",
                            lineHeight: "20px",
                            letterSpacing: "0%",
                            fontWeight: 400,
                            color: "rgba(0,0,0,0.4)",
                            "& .MuiSelect-select": {
                              display: "flex",
                              alignItems: "center",
                              height: "100%",
                              padding: 0,
                              backgroundColor: "transparent",
                            },
                            "&:hover .MuiSelect-select": {
                              backgroundColor: "transparent",
                            },
                            "&.Mui-focused .MuiSelect-select": {
                              backgroundColor: "transparent",
                            },
                            "& .MuiSelect-icon": {
                              color: "rgba(0,0,0,0.3)",
                              right: 10,
                              pointerEvents: "none",
                            },
                          }}
                        >
                        {selected ? (
                          <MenuItem
                            key={`selected-${selected.value}`}
                            value={selected.value}
                            sx={{
                              width: "calc(100% - 8px)",
                              mx: "4px",
                              my: "6px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              textAlign: "left",
                              px: "8px",
                              "& .MuiTypography-root": { flex: 1, textAlign: "left" },
                              fontFamily: "Rubik",
                              fontWeight: 500,
                              fontSize: "14px",
                              lineHeight: "18px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.85)",
                              "&.Mui-selected": { backgroundColor: "rgba(38, 102, 190, 0.06) !important" },
                              "&.Mui-selected:hover": { backgroundColor: "rgba(38, 102, 190, 0.1) !important" },
                              "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: 6 }}>
                              <path d="M2 7L5.5 10.5L12 3.5" stroke="rgba(38,102,190,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span style={{ fontWeight: 500, color: "rgba(0,0,0,0.85)" }}>{selected.label}</span>
                          </MenuItem>
                        ) : (
                          <MenuItem value="" disabled>
                            No Phase Available
                          </MenuItem>
                        )}

                        {rest.length > 0 && (
                          <Divider sx={{ my: "4px", borderColor: "rgba(0,0,0,0.06)" }} />
                        )}

                        {rest.map((phase) => (
                          <MenuItem
                            key={phase.value}
                            value={phase.value}
                            sx={{
                              width: "calc(100% - 8px)",
                              mx: "4px",
                              my: "6px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              textAlign: "left",
                              px: "8px",
                              "& .MuiTypography-root": { flex: 1, textAlign: "left" },
                              fontFamily: "Rubik",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "18px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.6)",
                              "&.Mui-selected": { backgroundColor: "transparent" },
                              "&.Mui-selected:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                              "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                            }}
                          >
                            <span style={{ width: 20, flexShrink: 0 }} />
                            {phase.label}
                          </MenuItem>
                        ))}
                        </Select>
                      </FormControl>

                      {/* Ensures the arrow area also opens the dropdown */}
                      <button
                        type="button"
                        aria-label="Open phase dropdown"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!hasMultiplePhases) return;
                          setIsPhaseSelectOpen(true);
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          height: "100%",
                          width: 34,
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: hasMultiplePhases ? "pointer" : "default",
                        }}
                      />
                    </>
                  );
                })()}
              </div>}

              {/* DATA TRACEABILITY */}
              <Box className="flex items-center gap-2">
                <Switch
                  checked={isAlertActive || false}
                  onChange={(e) => dispatch(toggleAlert(e.target.checked))}
                  sx={{
                    width: 42,
                    height: 24,
                    padding: 0,
                    display: "flex",
                    "& .MuiSwitch-switchBase": {
                      padding: "2px",
                      "&.Mui-checked": {
                        transform: "translateX(18px)",
                        color: "#fff",
                        "& + .MuiSwitch-track": {
                          backgroundColor: "#2666BE",
                          opacity: 1,
                        },
                      },
                    },
                    "& .MuiSwitch-track": {
                      borderRadius: 12,
                      backgroundColor: "#E0E1E6",
                      opacity: 1,
                    },
                    "& .MuiSwitch-thumb": {
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 14,
                    fontFamily: "Rubik",
                    fontWeight: 500,
                    color: "rgba(0,0,0,0.80)",
                    lineHeight: "100%",
                    whiteSpace: "nowrap",
                  }}
                >
                  Data Traceability
                </Typography>
              </Box>
                </div>
              </div>
            )}

            <div className="mt-6">
              <CommonTabs
                tabs={homepageTabs}
                defaultValue="Study Details"
                onChange={setActiveTab}
                disabledTabs={isResultDisabled ? ["Results"] : []}
              />

              <div className="mt-4">
                {activeTab === "Study Details" && (
                  <div
                    style={{
                      fontFamily: "Rubik",
                      fontWeight: 500,
                      fontSize: 20,
                      lineHeight: "24px",
                      color: "rgba(0,0,0,0.8)",
                      marginBottom: 12,
                    }}
                  >
                    Eligibility Criteria
                  </div>
                )}
                {activeTab === "Study Details" && (
                  <StudyDetailsTab
                    selectedIdData={drawerData}
                    studyDetails={drawerData}
                    patientDempgraphicRows={patientDempgraphicRows}
                    eligibilityRows={eligibilityRows}
                    steps={steps}
                    nctId={nctId}
                    source_date={source_date}
                    version={version}
                    isDrawerView={true}
                  />
                )}

                {activeTab === "Results" && (
                  <ResultsTab
                    data={drawerData}
                    isResultDisabled={isResultDisabled}
                  />
                )}
              </div>
            </div>
    </div>
  );
};

export default ExecuiteSummaryDrawer;

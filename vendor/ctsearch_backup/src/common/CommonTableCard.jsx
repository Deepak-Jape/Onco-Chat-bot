/* eslint-disable react-hooks/rules-of-hooks */
import React, {
  useState,
  useRef,
  useLayoutEffect,
  isValidElement,
  cloneElement,
} from "react";
import EvidenceHoverHeader from "../pages/trialsHeader/trials/EvidenceHoverCell";
import { trialStyles } from "../pages/trialsHeader/trials/style";
import CustomScrollbar from "./CustomScrollbar";
import { useIsFullView } from "./fullViewContext";

const CommonTableCard = ({
  title = "Table",
  columns = [],
  data = [],
  nctId = "",
  isResultTab = false,
  isBorder = false,
  hideTitle = false,
  useFigmaStyles = false,
  cardVariant = "",
  noTopMargin = false,
  // When rendered inside the full-view overlay: show every row and drop the
  // "Show all" toggle (there's room, and the container scrolls). Falls back to
  // the FullViewWrapper context so callers don't have to thread the prop.
  isFullView: isFullViewProp,
}) => {
  if (!columns || columns.length === 0) return null;

  const isFullView = isFullViewProp ?? useIsFullView();
  const [showAll, setShowAll] = useState(false);
  const hasData = data && data.length > 0;

  // Measure the (multi-line) sticky header so the vertical scrollbar track can
  // start just below it, with equal gaps above and below the header.
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, [columns, data]);

  // Check if this table needs a sub-header (grouped columns)
  const isGroupedTable = columns.some((col) => col.isGroup);

  // Flat list of columns for rendering the <tbody>
  const renderColumns = isGroupedTable
    ? columns.flatMap((col) => (col.isGroup ? col.subColumns : [col]))
    : columns;

  const isMostCommonAeTable =
    isGroupedTable && isBorder && columns?.[0]?.key === "ae";
  const isPopulationCharacteristicsTable =
    !!isBorder && columns?.[0]?.key === "characteristic";
  const useBodyScroll = isMostCommonAeTable || isPopulationCharacteristicsTable;

  const visibleRows =
    useBodyScroll || isFullView || showAll ? data : data.slice(0, 5);
  const hiddenCount = data.length - 5;
  const colWidth = `${100 / renderColumns.length}%`;

  // Most Common Adverse Effects: with many arm/grade sub-columns the table must
  // be allowed to grow wider than the card and scroll horizontally (header +
  // body together), exactly like the Endpoint Outcomes table. Give each column
  // a pixel minimum and sum them for the content min-width that triggers the
  // horizontal scrollbar.
  const MCAE_FIRST_COL_MIN = 200;
  const MCAE_DATA_COL_MIN = 120;
  const mcaeMinWidth =
    MCAE_FIRST_COL_MIN +
    Math.max(renderColumns.length - 1, 0) * MCAE_DATA_COL_MIN;

  const isStudyArmsTable = String(cardVariant).toLowerCase() === "study_arms";
  const getColWidth = (idx) =>
    isStudyArmsTable && renderColumns.length === 2
      ? idx === 0
        ? "30%"
        : "70%"
      : colWidth;

  const formatEndpointCell = (cellValue, colIndex, colLabel) => {
    const looksLikeEndpointsTable =
      Array.isArray(columns) &&
      columns.some((c) => String(c?.key).toLowerCase() === "type_and_rationale");
    const isEndpointTable =
      !!useFigmaStyles &&
      ((typeof title === "string" && title.toLowerCase().trim() === "endpoints") ||
        looksLikeEndpointsTable);
    const isFirstEndpointCol =
      typeof colLabel === "string" &&
      (colLabel.toLowerCase() === "endpoint" ||
        colLabel.toLowerCase() === "endpoints");

    if (isEndpointTable && isFirstEndpointCol && isValidElement(cellValue)) {
      const originalText = cellValue.props?.label?.props?.children;
      if (typeof originalText === "string") {
        const parts = originalText.split(/(\(.*)/);
        if (parts.length > 1) {
          const newLabelText = (
            <>
              <span
                style={{
                  fontFamily: "Rubik",
                  fontWeight: 500,
                  fontSize: 16,
                  lineHeight: "20px",
                  letterSpacing: "0%",
                  color: "rgba(0, 0, 0, 0.8)",
                }}
              >
                {parts[0].trim()}
              </span>
              <span
                style={{
                  fontFamily: "Rubik",
                  fontWeight: 400,
                  fontSize: 16,
                  lineHeight: "20px",
                  letterSpacing: "0%",
                  color: "rgba(0, 0, 0, 0.8)",
                }}
              >
                {" "}
                {parts[1].trim()}
              </span>
            </>
          );
          const newInnerLabel = cloneElement(
            cellValue.props.label,
            {},
            newLabelText,
          );
          return cloneElement(cellValue, { label: newInnerLabel });
        }
      }
    }

    // Endpoints table: other columns use Figma regular body style (14 / 20, 0.6)
    if (isEndpointTable && !isFirstEndpointCol && isValidElement(cellValue)) {
      const existingLabel = cellValue.props?.label;
      if (isValidElement(existingLabel)) {
        const labelChildren = existingLabel.props?.children;
        const newInnerLabel = cloneElement(existingLabel, {
          className: "cursor-pointer",
          style: {
            ...(existingLabel.props?.style || {}),
            fontFamily: "Rubik",
            fontWeight: 400,
            fontSize: 16,
            lineHeight: "20px",
            letterSpacing: "0%",
            color: "rgba(0, 0, 0, 0.6)",
          },
          children: labelChildren,
        });
        return cloneElement(cellValue, { label: newInnerLabel });
      }
    }
    return cellValue;
  };

  const classes = trialStyles();
  const isFigmaCard = !!useFigmaStyles;
  const titleLower =
    typeof title === "string" ? title.trim().toLowerCase() : "";
  const emptyTitle = String(title ?? "table").toLowerCase();
  const isEndpointOutcomesTable = titleLower === "endpoint outcomes";
  const isHazardRatioTable = titleLower === "hazard ratio";
  const isSafetyTable = titleLower === "safety";
  const isStudyEndpointsTable = isFigmaCard && titleLower === "endpoints";
  const useSplitHeaderScroll =
    isMostCommonAeTable || isPopulationCharacteristicsTable;

  return (
    <div
      className={noTopMargin ? "" : isResultTab ? "mt-4" : "mt-8"}
      style={
        isFigmaCard
          ? {
              background: "rgba(255, 255, 255, 1)",
              border: "1px solid rgba(0, 0, 0, 0.05)",
              borderRadius: 4,
              padding: 15,
              boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.1)",
            }
          // :
          //  useSplitHeaderScroll
          //   ? {}
            : { boxShadow: "1px 8px 34px 0px #99A9BE1A" }
      }
    >
      {!hideTitle && !!title && (
        <p className={classes.table_header_main_title}>{title}</p>
      )}

      <div
        className={useSplitHeaderScroll ? "" : "overflow-x-auto"}
        style={{
          borderRadius: 4,
          overflow: useSplitHeaderScroll ? "hidden" : undefined,
          overflowX: useSplitHeaderScroll ? undefined : "auto",
          overflowY: useSplitHeaderScroll ? undefined : "hidden",
          border: isFigmaCard ? "0px" : "1px solid rgba(0, 0, 0, 0.05)",
          background: "rgba(255, 255, 255, 1)",
        }}
      >
        {useSplitHeaderScroll ? (
          // ONE scroll container (like the Endpoint Outcomes table): a sticky
          // <thead> keeps the header visible on vertical scroll, and (for the
          // AE table) CustomScrollbar's withHorizontal draws the bottom #CDCED6
          // bar. Both scrollbar tracks are pinned to the non-scrolling wrapper,
          // so neither drifts when scrolling horizontally.
          <CustomScrollbar
            height={410}
            useMaxHeight={isPopulationCharacteristicsTable}
            trackTop={(headerHeight || 60) + 8}
            trackBottom={8}
            trackRight={0}
            trackWidth={5}
            lockPageScroll={true}
            withHorizontal={isMostCommonAeTable}
            trackLeft={8}
            trackRightH={8}
            trackBottomH={0}
            style={{
              overflowX: isMostCommonAeTable ? "auto" : "hidden",
              borderTop: "0px",
              borderBottom: "0px",
            }}
          >
          <div
            style={{
              minWidth: isMostCommonAeTable ? `${mcaeMinWidth}px` : undefined,
            }}
          >
            <table
              className={`min-w-full ct-unified-table ct-scroll-table ${
                isMostCommonAeTable ? "ct-mcae-body-table " : ""
              }${
                isPopulationCharacteristicsTable ? "ct-population-body-table " : ""
              }${isBorder && !isFigmaCard ? "ct-figma-borders " : ""}`}
              style={{
                borderCollapse: "separate",
                borderSpacing: 0,
                tableLayout: "fixed",
                width: "100%",
              }}
            >
              <colgroup>
                {renderColumns.map((_, idx) => (
                  <col key={idx} style={{ width: colWidth }} />
                ))}
              </colgroup>
            <thead
              ref={headerRef}
              className={isResultTab && !isFigmaCard ? "bg-gray-50" : ""}
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                backgroundColor: isStudyArmsTable
                  ? "rgba(255, 255, 255, 1)"
                  : isStudyEndpointsTable
                  ? "rgba(255, 255, 255, 1)"
                  : "rgba(249, 249, 251, 1)",
                borderBottom: isPopulationCharacteristicsTable
                  ? "0px"
                  : "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
            {/* ROW 1: Main Labels */}
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  rowSpan={isGroupedTable && !col.isGroup ? 2 : 1}
                  colSpan={col.isGroup ? col.subColumns.length : 1}
                  className={
                    isBorder
                      ? `py-2 border break-words whitespace-normal`
                      : `py-2 ${isFigmaCard ? "" : "border-b border-gray-200"} break-words whitespace-normal`
                  }
                  style={{
                    borderBottomColor: isFigmaCard ? "rgba(0, 0, 0, 0.05)" : undefined,
                    borderColor: !isFigmaCard ? "rgba(0, 0, 0, 0.05)" : undefined,
                    position: undefined,
                    top: undefined,
                    left: undefined,
                    zIndex: undefined,
                    background: undefined,
                    minWidth:
                      idx === 0 &&
                        (title === "Patient Demographics" || title === "Eligibility Criteria")
                        ? "440px"
                        : "auto",
                    width: colWidth,
                    fontFamily: "Rubik",
                    paddingRight: "16px",
                    paddingLeft: isFigmaCard && idx === 0 ? "0px" : "16px",
                    paddingTop:
                      (isEndpointOutcomesTable ||
                        isHazardRatioTable ||
                        isSafetyTable) &&
                      !isFigmaCard
                        ? "18px"
                        : undefined,
                    paddingBottom:
                      (isEndpointOutcomesTable ||
                        isHazardRatioTable ||
                        isSafetyTable) &&
                      !isFigmaCard
                        ? "10px"
                        : undefined,
                    verticalAlign: idx === 0 ? "top" : "middle",
                    whiteSpace: "normal",
                    // ✅ First col left, rest center
                    textAlign: isFigmaCard
                      ? "left"
                      : idx !== 0 && isBorder
                        ? "center"
                        : "left",
                    // ✅ Header typography (match Figma for HR table too)
                    fontSize:
                      isFigmaCard || isHazardRatioTable ? "14px" : "14px",
                    lineHeight:
                      isFigmaCard || isHazardRatioTable ? "20px" : undefined,
                    fontWeight:
                      isFigmaCard || isHazardRatioTable ? 500 : 600,
                    letterSpacing:
                      isFigmaCard || isHazardRatioTable ? "0%" : undefined,
                    color:
                      isFigmaCard || isHazardRatioTable
                        ? "rgba(0, 0, 0, 0.8)"
                        : "#111827",
                  }}
                >
                  {/* Arm label e.g. "Arm A" */}
                  {/* Arm label — break at ( */}
                  <div
                    style={{
                      fontWeight: isFigmaCard || isHazardRatioTable ? 500 : 600,
                      color:
                        isFigmaCard || isHazardRatioTable
                          ? "rgba(0, 0, 0, 0.8)"
                          : "rgba(0, 0, 0, 0.8)",
                      fontSize: "14px",
                      lineHeight:
                        isFigmaCard || isHazardRatioTable ? "20px" : undefined,
                      letterSpacing:
                        isFigmaCard || isHazardRatioTable ? "0%" : undefined,
                    }}
                  >
                    {!isSafetyTable && col.label.includes("(")
                      ? <>
                        {col.label.split("(")[0].trim()}
                        <br />
                        <span style={{ fontWeight: 400, fontSize: "13px", lineHeight: "20px", color: "rgba(0, 0, 0, 0.6)" }}>
                          ({col.label.split("(")[1]}
                        </span>
                      </>
                      : col.label
                    }
                  </div>

                  {/* N value e.g. "N=356" — lighter, smaller */}
                  {col.nValue && (
                    <div
                      style={{
                        fontWeight: 400,
                        fontSize: "12px",
                        color: "rgba(0, 0, 0, 0.6)",       // ✅ gray, lighter than label
                        marginTop: "2px",
                      }}
                    >
                      {col.nValue}
                    </div>
                  )}
                </th>
              ))}
            </tr>

            {/* ROW 2: Sub-headers (All Grades / Grade 3-4) */}
            {isGroupedTable && (
              <tr>
                {columns
                  .filter((c) => c.isGroup)
                  .flatMap((group, gIdx) =>
                    group.subColumns.map((sub, sIdx) => (
                      <th
                        key={`${gIdx}-${sIdx}`}
                        className={
                          isBorder
                            ? "py-2 border break-words whitespace-normal"
                            : `py-2 ${isFigmaCard ? "" : "border-b border-gray-200"} break-words whitespace-normal`
                        }
                        style={{
                          fontFamily: "Rubik",
                          paddingLeft: "16px",
                          paddingRight: "16px",
                          position: undefined,
                          top: undefined,
                          zIndex: undefined,
                          background: undefined,
                          // ✅ Sub-headers centered, lighter weight
                          textAlign: "center",
                          fontSize: "14px",
                          lineHeight: "20px",
                          fontWeight: 400,
                          color: "rgba(0, 0, 0, 0.8)",     // ✅ gray to match Figma
                        }}
                      >
                        {sub.label}
                      </th>
                    )),
                  )}
              </tr>
            )}
          </thead>

          {/* <tbody className="divide-y divide-gray-200">
            {hasData ? (
              visibleRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="transition-colors"
                  style={{ fontFamily: "Rubik" }}
                >
                  {renderColumns.map((col, colIndex) => {
                    let cellValue =
                      row[col.key] && row[col.key] !== "Not Available"
                        ? row[col.key]
                        : "-";
                    cellValue = formatEndpointCell(
                      cellValue,
                      colIndex,
                      col.label,
                    );
                    const metadata = row[`${col.key}_metadata`];

                    return (
                      <td
                        key={colIndex}
                        className={`py-3 text-md text-gray-800 align-top break-words whitespace-normal leading-relaxed ${isGroupedTable && colIndex > 0 ? "text-center border-r last:border-r-0" : ""}`}
                        style={{
                          fontFamily: "Rubik",
                          width: colWidth,
                          maxWidth: colWidth,
                          paddingRight: "20px",
                        }}
                      >
                        {metadata &&
                        (metadata.source || metadata.source_text || metadata.reasoning) &&
                        cellValue !== "-" ? (
                          <div className="cursor-pointer inline-block">
                            <EvidenceHoverHeader
                              label={
                                <span className={classes.tableBody_values}>
                                  {cellValue}
                                </span>
                              }
                              evidence={{
                                highlight: metadata.source_text || "",
                                arm: col.label,
                                reasoning:
                                  metadata.reasoning ??
                                  "No reasoning provided.",
                                confidence: metadata.confidence_score ?? 0,
                                source: metadata?.source,
                                source_link:metadata?.source_link,
                                display_value: isValidElement(cellValue) ? undefined : cellValue,
                                nctId: nctId,
                                // Structured source-document snippet + terms to highlight in it.
                                snippet: metadata?.snippet,
                                keywords: metadata?.keywords,
                              }}
                            />
                          </div>
                        ) : (
                          <span className={classes.tableBody_values}>
                            {" "}
                            {cellValue}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={renderColumns.length}
                  className="py-10 text-center text-gray-500 italic text-md"
                >
                  No data found for {emptyTitle}.
                </td>
              </tr>
            )}
          </tbody> */}

          <tbody
            className={
              !isBorder && !isFigmaCard
                ? ""
                : isMostCommonAeTable || isPopulationCharacteristicsTable
                  ? ""
                  : "divide-y divide-gray-200"
            }
          >
            {hasData ? (
              visibleRows.map((row, rowIndex) => {
                // ✅ Section header row — bold, full-width, no data cells
                if (row._isSectionHeader) {
                  return (
                    <tr
                      key={rowIndex}
                      className={
                        isPopulationCharacteristicsTable && !isFigmaCard
                          ? "ct-pop-section-row border"
                          : `border ${
                              !isFigmaCard && isMostCommonAeTable
                                ? "ct-inset-row-divider"
                                : ""
                            }`
                      }
                    >
                      <td
                        colSpan={renderColumns.length}
                        style={{
                          fontFamily: "Rubik",
                          fontWeight: 700,
                          fontSize: "14px",
                          padding: isPopulationCharacteristicsTable
                            ? "12px 16px"
                            : "10px 20px 10px 10px",
                          color: "#111827"
                        }}

                      >
                        {row[renderColumns[0]?.key]}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={rowIndex}
                    className={`transition-colors ${
                      (!isFigmaCard && isMostCommonAeTable)
                        ? "ct-inset-row-divider"
                        : ""
                    } ${
                      isPopulationCharacteristicsTable && row?._isSectionHeader
                        ? "ct-pop-section-row"
                        : ""
                    }`}
                    style={{ fontFamily: "Rubik" }}
                  >
                    {renderColumns.map((col, colIndex) => {
                      let cellValue =
                        row[col.key] && row[col.key] !== "Not Available"
                          ? row[col.key]
                          : "-";
                      if (typeof col.render === "function") {
                        cellValue = col.render(cellValue, row);
                      }
                      if (
                        isPopulationCharacteristicsTable &&
                        row?._isSectionHeader &&
                        colIndex > 0
                      ) {
                        cellValue = "";
                      }
                      cellValue = formatEndpointCell(cellValue, colIndex, col.label);
                      const metadata =
                        isPopulationCharacteristicsTable &&
                        row?._isSectionHeader &&
                        colIndex > 0
                          ? null
                          : row[`${col.key}_metadata`];
                      const isEndpointOutcomesTableCol =
                        isEndpointOutcomesTable && !isFigmaCard;
                      const isHazardRatioCol = isHazardRatioTable && !isFigmaCard;
                      const isSafetyCol = isSafetyTable && !isFigmaCard;
                      const isStudyEndpointsOtherCol =
                        isStudyEndpointsTable && colIndex > 0;

                      const studyEndpointsValueStyle = isStudyEndpointsTable
                        ? {
                            fontFamily: "Rubik",
                            fontWeight: 400,
                            fontSize: "16px",
                            lineHeight: "20px",
                            letterSpacing: "0%",
                            color: "rgba(0, 0, 0, 0.6)",
                          }
                        : undefined;
                      const studyEndpointsOtherColValueStyle = isStudyEndpointsOtherCol
                        ? {
                            fontFamily: "Rubik",
                            fontWeight: 400,
                            fontSize: "16px",
                            lineHeight: "20px",
                            letterSpacing: "0%",
                            color: "rgba(0, 0, 0, 0.6)",
                          }
                        : undefined;
                      const endpointOutcomesValueStyle = isEndpointOutcomesTableCol
                        ? {
                            fontFamily: "Rubik",
                            fontWeight: 400,
                            fontSize: "14px",
                            lineHeight: "20px",
                            letterSpacing: "0%",
                            color:
                              colIndex === 0
                                ? "rgba(0,0,0,0.8)"
                                : "rgba(0,0,0,0.6)",
                          }
                        : undefined;

                      const hazardFirstColValueStyle =
                        isHazardRatioCol && colIndex === 0
                          ? {
                              fontFamily: "Rubik",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "20px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.8)",
                            }
                          : undefined;

                      const safetyFirstColValueStyle =
                        isSafetyCol && colIndex === 0
                          ? {
                              fontFamily: "Rubik",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "20px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.8)",
                            }
                          : undefined;

                      const safetyOtherColsValueStyle =
                        isSafetyCol && colIndex > 0
                          ? {
                              fontFamily: "Rubik",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "20px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.6)",
                            }
                          : undefined;

                      const endpointRoleText = String(row?.endpoint_role ?? "").trim();
                      const endpointChipNeeded =
                        isEndpointOutcomesTableCol &&
                        colIndex === 0 &&
                        endpointRoleText.length > 0;
                      const isPrimaryRole =
                        endpointRoleText.toLowerCase() === "primary";

                      const endpointChip = endpointChipNeeded ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            background: isPrimaryRole
                              ? "rgba(240, 246, 254, 1)"
                              : "#EEF0F4",
                            color: isPrimaryRole
                              ? "rgba(47, 128, 237, 1)"
                              : "#64748B",
                            fontFamily: "Rubik",
                            fontWeight: 500,
                            fontSize: "12px",
                            lineHeight: "18px",
                            letterSpacing: "0%",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {endpointRoleText}
                        </span>
                      ) : null;

                      const endpointOutcomesEndpointLabel =
                        isEndpointOutcomesTableCol && colIndex === 0 ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <span style={endpointOutcomesValueStyle}>
                              {row.endpoint_abbr ?? cellValue}
                            </span>
                            {endpointChip}
                          </span>
                        ) : null;

                      return (
                        <td
                          key={colIndex}
                          // className={`py-3 text-md text-gray-800 align-top break-words whitespace-normal leading-relaxed border-b border-gray-200`}
                          className={
                            isBorder
                              ? `py-3 text-md text-gray-800 align-top break-words whitespace-normal leading-relaxed ${
                                  isPopulationCharacteristicsTable && !isFigmaCard
                                    ? "border-x"
                                    : "border"
                                } ${
                                  isGroupedTable && colIndex > 0
                                    ? "text-center border-r last:border-r-0"
                                    : ""
                                }`
                              :
                            `py-3 text-md text-gray-800 align-top break-words whitespace-normal leading-relaxed ${!isFigmaCard ? "" : "border-b border-gray-200"}`}
                          style={{
                            fontFamily: "Rubik",
                            width: colWidth,
                            maxWidth: colWidth,
                            paddingRight: isMostCommonAeTable && colIndex > 0 ? "16px" : "20px",
                            paddingLeft:
                              isMostCommonAeTable && colIndex > 0
                                ? "16px"
                                : isFigmaCard && colIndex === 0
                                  ? "0px"
                                  : "16px",
                            paddingTop: isEndpointOutcomesTableCol ? "8px" : undefined,
                            paddingBottom: isEndpointOutcomesTableCol ? "8px" : undefined,
                            // paddingLeft: colIndex === 0 ? "16px" : "0px",
                            // ✅ Center align all columns except the first
                            textAlign: isMostCommonAeTable
                              ? colIndex === 0
                                ? "left"
                                : "center"
                              : "left",
                            borderBottomColor: "rgba(0, 0, 0, 0.05)",
                            borderColor: !isFigmaCard ? "rgba(0, 0, 0, 0.05)" : undefined,
                            position: undefined,
                            left: undefined,
                            zIndex: undefined,
                            background: undefined,
                            borderTop:
                              isMostCommonAeTable && !isFigmaCard ? "0px" : undefined,
                            borderBottom:
                              isMostCommonAeTable && !isFigmaCard
                                ? "0px"
                                : !isBorder && !isFigmaCard
                                  ? "none"
                                  : undefined,
                          }}
                        >
                          {metadata && cellValue !== "-" ? (
                            <div className="cursor-pointer inline-block">
                              <EvidenceHoverHeader
                                label={
                                  endpointOutcomesEndpointLabel ??
                                  (isValidElement(cellValue) ? (
                                    cellValue
                                  ) : (
                                    <span
                                      className={classes.tableBody_values}
                                      style={
                                        safetyFirstColValueStyle ??
                                        safetyOtherColsValueStyle ??
                                        hazardFirstColValueStyle ??
                                        studyEndpointsValueStyle ??
                                        studyEndpointsOtherColValueStyle ??
                                        endpointOutcomesValueStyle
                                      }
                                    >
                                      {cellValue}
                                    </span>
                                  ))
                                }
                                evidence={{
                                  highlight: metadata.source_text || "",
                                  arm: col.label,
                                  reasoning:
                                    metadata.reasoning ?? "No reasoning provided.",
                                  confidence: metadata.confidence_score ?? 0,
                                  source: metadata?.source,
                                  source_link: metadata?.source_link,
                                  display_value: isValidElement(cellValue) ? "" : cellValue,
                                  nctId: nctId,
                                  // Structured source-document snippet + terms to highlight in it.
                                  snippet: metadata?.snippet,
                                  keywords: metadata?.keywords,
                                }}
                              />
                            </div>
                          ) : (
                            (() => {
                              const contentNode =
                                endpointOutcomesEndpointLabel ?? cellValue;
                              if (isValidElement(contentNode)) return contentNode;
                              return (
                                <span
                                  className={classes.tableBody_values}
                                  style={
                                    safetyFirstColValueStyle ??
                                    safetyOtherColsValueStyle ??
                                    hazardFirstColValueStyle ??
                                    studyEndpointsValueStyle ??
                                    studyEndpointsOtherColValueStyle ??
                                    endpointOutcomesValueStyle
                                  }
                                >
                                  {contentNode}
                                </span>
                              );
                            })()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={renderColumns.length}
                  className="py-10 text-center text-gray-500 italic text-md"
                >
                  No data found for {emptyTitle}.
                </td>
              </tr>
            )}
          </tbody>
              </table>
          </div>
          </CustomScrollbar>
        ) : (
          <table
            className={`min-w-full ct-unified-table ${isBorder && !isFigmaCard ? "ct-figma-borders " : ""}`}
            style={
              isFigmaCard
                ? {
                    borderRadius: 4,
                    overflow: "hidden",
                    tableLayout: "fixed",
                    width: "100%",
                  }
                : {
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  borderRadius: 4,
                  overflow: "hidden",
                }
            }
          >
            {/* <table className="min-w-full border-collapse"> */}
            <thead
              className={isResultTab && !isFigmaCard ? "bg-gray-50" : ""}
              style={
                isFigmaCard
                  ? {
                      backgroundColor:
                        isStudyArmsTable || isStudyEndpointsTable
                        ? "rgba(255, 255, 255, 1)"
                        : "rgba(249, 249, 251, 1)",
                      borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                    }
                  : undefined
              }
            >
              {/* ROW 1: Main Labels */}
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    rowSpan={isGroupedTable && !col.isGroup ? 2 : 1}
                    colSpan={col.isGroup ? col.subColumns.length : 1}
                    className={
                      isBorder
                        ? `py-2 border break-words whitespace-normal`
                        : `py-2 ${isFigmaCard ? "" : "border-b border-gray-200"} break-words whitespace-normal`
                    }
                    style={{
                      borderBottomColor: isFigmaCard ? "rgba(0, 0, 0, 0.05)" : undefined,
                      borderColor: !isFigmaCard ? "rgba(0, 0, 0, 0.05)" : undefined,
                      borderRight:
                        isStudyArmsTable && idx < columns.length - 1
                          ? "1px solid rgba(0, 0, 0, 0.05)"
                          : undefined,
                      minWidth:
                        idx === 0 &&
                        (title === "Patient Demographics" || title === "Eligibility Criteria")
                          ? "440px"
                          : "auto",
                      width: getColWidth(idx),
                      fontFamily: "Rubik",
                      paddingRight: "16px",
                      paddingLeft: isFigmaCard && idx === 0 ? "0px" : "16px",
                      paddingTop:
                        (isEndpointOutcomesTable ||
                          isHazardRatioTable ||
                          isSafetyTable) &&
                        !isFigmaCard
                          ? "18px"
                          : undefined,
                      paddingBottom:
                        (isEndpointOutcomesTable ||
                          isHazardRatioTable ||
                          isSafetyTable) &&
                        !isFigmaCard
                          ? "10px"
                          : undefined,
                      whiteSpace: "normal",
                      textAlign: isFigmaCard
                        ? "left"
                        : idx !== 0 && isBorder
                          ? "center"
                          : "left",
                      fontSize: isStudyEndpointsTable || isStudyArmsTable ? "16px" : isFigmaCard || isHazardRatioTable ? "14px" : "14px",
                      lineHeight: isStudyEndpointsTable || isStudyArmsTable ? "20px" : isFigmaCard || isHazardRatioTable ? "20px" : undefined,
                      fontWeight: isFigmaCard || isHazardRatioTable ? 500 : 600,
                      letterSpacing: isFigmaCard || isHazardRatioTable ? "0%" : undefined,
                      color:
                        isFigmaCard || isHazardRatioTable
                          ? "rgba(0, 0, 0, 0.8)"
                          : "#111827",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: isFigmaCard || isHazardRatioTable ? 500 : 600,
                        color:
                          isFigmaCard || isHazardRatioTable
                            ? "rgba(0, 0, 0, 0.8)"
                            : "#111827",
                        fontSize: isStudyEndpointsTable || isStudyArmsTable ? "16px" : "14px",
                        lineHeight: isStudyEndpointsTable || isStudyArmsTable ? "20px" : isFigmaCard || isHazardRatioTable ? "20px" : undefined,
                        letterSpacing: isFigmaCard || isHazardRatioTable ? "0%" : undefined,
                      }}
                    >
                      {!isSafetyTable && col.label.includes("(") ? (
                        <>
                          {col.label.split("(")[0].trim()}
                          <br />
                          <span style={{ fontWeight: 400, fontSize: "12px", color: "#6B7280" }}>
                            ({col.label.split("(")[1]}
                          </span>
                        </>
                      ) : (
                        col.label
                      )}
                    </div>

                    {col.nValue && (
                      <div
                        style={{
                          fontWeight: 400,
                          fontSize: "12px",
                          color: "#6B7280",
                          marginTop: "2px",
                        }}
                      >
                        {col.nValue}
                      </div>
                    )}
                  </th>
                ))}
              </tr>

              {isGroupedTable && (
                <tr>
                  {columns
                    .filter((c) => c.isGroup)
                    .flatMap((group, gIdx) =>
                      group.subColumns.map((sub, sIdx) => (
                        <th
                          key={`${gIdx}-${sIdx}`}
                          className={
                            isBorder
                              ? "py-2 border break-words whitespace-normal"
                              : `py-2 ${isFigmaCard ? "" : "border-b border-gray-200"} break-words whitespace-normal`
                          }
                          style={{
                            fontFamily: "Rubik",
                            paddingLeft: "16px",
                            paddingRight: "16px",
                            textAlign: "center",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#6B7280",
                            borderColor: !isFigmaCard ? "rgba(0, 0, 0, 0.05)" : undefined,
                          }}
                        >
                          {sub.label}
                        </th>
                      )),
                    )}
                </tr>
              )}
            </thead>
            <tbody className={!isBorder && !isFigmaCard ? "" : isFigmaCard ? "" : "divide-y divide-gray-200"}>
              {hasData ? (
                visibleRows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`transition-colors ${
                      (!isFigmaCard && (!isBorder || isMostCommonAeTable))
                        ? "ct-inset-row-divider"
                        : ""
                    }`}
                    style={{ fontFamily: "Rubik" }}
                  >
                    {renderColumns.map((col, colIndex) => {
                      let cellValue =
                        row[col.key] && row[col.key] !== "Not Available"
                          ? row[col.key]
                          : "-";
                      if (typeof col.render === "function") {
                        cellValue = col.render(cellValue, row);
                      }
                      cellValue = formatEndpointCell(cellValue, colIndex, col.label);
                      const metadata = row[`${col.key}_metadata`];

                      const isEndpointOutcomesTableCol = isEndpointOutcomesTable && !isFigmaCard;
                      const isHazardRatioCol = isHazardRatioTable && !isFigmaCard;
                      const isSafetyCol = isSafetyTable && !isFigmaCard;

                      const endpointOutcomesValueStyle = isEndpointOutcomesTableCol
                        ? {
                            fontFamily: "Rubik",
                            fontWeight: 400,
                            fontSize: "14px",
                            lineHeight: "20px",
                            letterSpacing: "0%",
                            color: colIndex === 0 ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.6)",
                          }
                        : undefined;

                      const hazardFirstColValueStyle =
                        isHazardRatioCol && colIndex === 0
                          ? {
                              fontFamily: "Rubik",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "20px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.8)",
                            }
                          : undefined;

                      const safetyFirstColValueStyle =
                        isSafetyCol && colIndex === 0
                          ? {
                              fontFamily: "Rubik",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "20px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.8)",
                            }
                          : undefined;

                      const safetyOtherColsValueStyle =
                        isSafetyCol && colIndex > 0
                          ? {
                              fontFamily: "Rubik",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "20px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.6)",
                            }
                          : undefined;

                      const endpointRoleText = String(row?.endpoint_role ?? "").trim();
                      const endpointChipNeeded =
                        isEndpointOutcomesTableCol &&
                        colIndex === 0 &&
                        endpointRoleText.length > 0;
                      const isPrimaryRole =
                        endpointRoleText.toLowerCase() === "primary";

                      const endpointChip = endpointChipNeeded ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            background: isPrimaryRole
                              ? "rgba(240, 246, 254, 1)"
                              : "#EEF0F4",
                            color: isPrimaryRole
                              ? "rgba(47, 128, 237, 1)"
                              : "#64748B",
                            fontFamily: "Rubik",
                            fontWeight: 500,
                            fontSize: "12px",
                            lineHeight: "18px",
                            letterSpacing: "0%",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {endpointRoleText}
                        </span>
                      ) : null;

                      const endpointOutcomesEndpointLabel =
                        isEndpointOutcomesTableCol && colIndex === 0 ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                            <span style={endpointOutcomesValueStyle}>
                              {row.endpoint_abbr ?? cellValue}
                            </span>
                            {endpointChip}
                          </span>
                        ) : null;

                      return (
                        <td
                          key={colIndex}
                          className={
                            isBorder
                              ? `py-3 text-md text-gray-800 align-top break-words whitespace-normal leading-relaxed border ${
                                  isGroupedTable && colIndex > 0
                                    ? "text-center border-r last:border-r-0"
                                    : ""
                                }`
                              : `py-3 text-md text-gray-800 align-top break-words whitespace-normal leading-relaxed ${
                                  !isFigmaCard ? "" : "border-b border-gray-200"
                                }`
                          }
                          style={{
                            fontFamily: "Rubik",
                            width: getColWidth(colIndex),
                            maxWidth: getColWidth(colIndex),
                            paddingRight: "20px",
                            paddingLeft: isFigmaCard && colIndex === 0 ? "0px" : "16px",
                            paddingTop: isEndpointOutcomesTableCol ? "8px" : isStudyArmsTable ? "16px" : undefined,
                            paddingBottom: isEndpointOutcomesTableCol ? "8px" : isStudyArmsTable ? "16px" : undefined,
                            textAlign: isMostCommonAeTable
                              ? colIndex === 0
                                ? "left"
                                : "center"
                              : "left",
                            borderBottomColor: "rgba(0, 0, 0, 0.05)",
                            borderTop: isMostCommonAeTable && !isFigmaCard ? "0px" : undefined,
                            borderBottom:
                              isMostCommonAeTable && !isFigmaCard
                                ? "0px"
                                : !isBorder && !isFigmaCard
                                  ? "none"
                                  : undefined,
                            borderRight:
                              isStudyArmsTable && colIndex < renderColumns.length - 1
                                ? "1px solid rgba(0, 0, 0, 0.05)"
                                : undefined,
                            borderColor: !isFigmaCard ? "rgba(0, 0, 0, 0.05)" : undefined,
                          }}
                        >
                          {metadata && cellValue !== "-" ? (
                            <div className="cursor-pointer inline-block">
                              <EvidenceHoverHeader
                                label={
                                  endpointOutcomesEndpointLabel ??
                                  (isValidElement(cellValue) ? (
                                    cellValue
                                  ) : (
                                    <span
                                      className={classes.tableBody_values}
                                      style={
                                        safetyFirstColValueStyle ??
                                        safetyOtherColsValueStyle ??
                                        hazardFirstColValueStyle ??
                                        endpointOutcomesValueStyle
                                      }
                                    >
                                      {cellValue}
                                    </span>
                                  ))
                                }
                                evidence={{
                                  highlight: metadata.source_text || "",
                                  arm: col.label,
                                  reasoning: metadata.reasoning ?? "No reasoning provided.",
                                  confidence: metadata.confidence_score ?? 0,
                                  source: metadata?.source,
                                  source_link: metadata?.source_link,
                                  display_value: isValidElement(cellValue) ? "" : cellValue,
                                  nctId: nctId,
                                  // Structured source-document snippet + terms to highlight in it.
                                  snippet: metadata?.snippet,
                                  keywords: metadata?.keywords,
                                }}
                              />
                            </div>
                          ) : (
                            (() => {
                              const contentNode = endpointOutcomesEndpointLabel ?? cellValue;
                              if (isValidElement(contentNode)) return contentNode;
                              return (
                                <span
                                  className={classes.tableBody_values}
                                  style={
                                    safetyFirstColValueStyle ??
                                    safetyOtherColsValueStyle ??
                                    hazardFirstColValueStyle ??
                                    endpointOutcomesValueStyle
                                  }
                                >
                                  {contentNode}
                                </span>
                              );
                            })()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={renderColumns.length} className="py-10 text-center text-gray-500 italic text-md">
                    No data found for {emptyTitle}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {hasData && data.length > 5 && !useBodyScroll && !isFullView && (
        <div className="mt-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            {showAll ? "Show less" : `Show all ${hiddenCount} >`}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommonTableCard;

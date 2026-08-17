import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Box, Typography } from "@mui/material";
import Divider from "@mui/material/Divider";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Evidence from "../assets/Evidence.svg";
import { ConfidenceScore } from "../utils/helpers/ConfidenceScore";
import { normalizeSourceType } from "../utils/helpers/helper";
import { baseURL } from "../api/AxiosInstance";
import { Link } from "react-router-dom";
import "./snippetSource.css";
import "./patientFlowSource.css";
import "./baselineCharacteristicsSource.css";

// Traceability images live behind the authenticated `/files/…` endpoint. The
// backend sends a RELATIVE path (e.g. "traceability/<id>/foo.png"), so resolve
// it to "<baseURL>/files/<path>". Absolute URLs / data URIs are left untouched.
const resolveTraceabilityImageUrl = (source) => {
  const src = String(source ?? "").trim();
  if (!src) return "";
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return src;
  const base = String(baseURL || "").replace(/\/+$/, "");
  const path = src.replace(/^\/+/, "").replace(/^files\//, "");
  return `${base}/files/${path}`;
};

// The `/files/…` endpoint serves the image when the request carries the site's
// auth cookie. A plain <img> load sends that cookie automatically (unlike a
// cross-origin `fetch`, whose credentials the endpoint's CORS config strips),
// so render it directly. On error, fall back to the source text.
const TraceabilityImage = ({ url, alt }) => {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <Typography
        sx={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", fontFamily: "Rubik" }}
      >
        {alt || "Source evidence unavailable"}
      </Typography>
    );
  }
  return (
    <img
      src={url}
      alt={alt || "Source evidence"}
      onError={() => setFailed(true)}
      style={{
        maxWidth: "100%",
        height: "auto",
        display: "block",
        borderRadius: "2px",
      }}
    />
  );
};

/* ----------------------------------------------------------------------------
   SNIPPET SOURCE — renders a traceability entry's `snippet` as a mock of the
   source document (see snippetSource.css), so the popover shows the value the
   way it appeared on the CT.gov page instead of as plain text.

   snippet = { heading, sub_heading, values[] }; `keywords` are highlighted
   inside each value. Any of the three parts may be null/absent.
   -------------------------------------------------------------------------- */

// Split `text` on each keyword and wrap the hits in <mark>. Longest keywords
// first so a broader term can't pre-empt a more specific overlapping one.
const highlightKeywords = (text, keywords) => {
  const str = String(text ?? "");
  const terms = (Array.isArray(keywords) ? keywords : [keywords])
    .filter((k) => typeof k === "string" && k.trim())
    .sort((a, b) => b.length - a.length);

  if (!str || terms.length === 0) return str;

  const pattern = terms
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(`(${pattern})`, "gi");

  return str.split(regex).map((part, i) =>
    // Odd indices are the captured keyword hits; even ones are plain text.
    i % 2 === 1 ? (
      <mark key={i} className="snippet-source-mark">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const SnippetSource = ({ snippet, keywords }) => {
  const heading = String(snippet?.heading ?? "").trim();
  const subHeading = String(snippet?.sub_heading ?? "").trim();
  const values = (Array.isArray(snippet?.values) ? snippet.values : [])
    .filter((v) => v != null && String(v).trim() !== "");

  // Nothing renderable — let the caller fall back to its normal text path.
  if (!heading && !subHeading && values.length === 0) return null;

  // The CT.gov "Eligibility Criteria" card has its own layout: a grey title
  // bar, a "Description" label, then the criteria as a numbered list under an
  // "Inclusion/Exclusion Criteria:" group label. Driven by the heading so the
  // JSON decides which variant renders.
  if (heading.toLowerCase() === "eligibility criteria") {
    return (
      <div className="snippet-source snippet-source--eligibility">
        <div className="snippet-source-card-title">{heading}</div>
        <div className="snippet-source-body">
          <div className="snippet-source-title">Description</div>
          {subHeading && (
            <div className="snippet-source-group">
              {/* Source page writes these with a trailing colon. */}
              {subHeading.endsWith(":") ? subHeading : `${subHeading}:`}
            </div>
          )}
          {/* `start` keeps the criterion's real position on the source page, so
              a mid-list match renders as e.g. "4." rather than restarting at 1. */}
          <ol className="snippet-source-list" start={Number(snippet?.start) || 1}>
            {values.map((value, i) => (
              <li className="snippet-source-list-item" key={i}>
                {highlightKeywords(value, keywords)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  // The CT.gov "Baseline Characteristics" module: a heading, the blue group
  // banner (title + measure-type line), then a table whose sticky first column
  // holds the row label and whose remaining columns are the arms plus Total.
  // Styles live in baselineCharacteristicsSource.css.
  //
  // values = [ "<row label>", "<arm>: <figure>", … ]; sub_heading is the group
  // name ("Sex: Female, Male") and measure_type the line beneath it.
  if (heading.toLowerCase() === "baseline characteristics") {
    const rowLabel = values[0] ?? "";
    const measureType = String(snippet?.measure_type ?? "").trim();

    // Split "<arm>: 25 (9.19%)" into the column, its count and its percentage —
    // the source renders count and percent as separately styled spans.
    const armRows = values.slice(1).map((line) => {
      const text = String(line ?? "");
      const at = text.indexOf(":");
      const label = at === -1 ? text.trim() : text.slice(0, at).trim();
      const figure = at === -1 ? "" : text.slice(at + 1).trim();
      const pct = figure.match(/\(([^)]*%)\)\s*$/);
      return {
        label,
        count: pct ? figure.slice(0, pct.index).trim() : figure,
        pct: pct ? pct[1] : "",
      };
    });

    // A cell keyword may be the whole "<arm>: <figure>" line while the cell
    // renders count and percent separately, so match the pieces too.
    const cellKeywords = (Array.isArray(keywords) ? keywords : [keywords])
      .filter((k) => typeof k === "string" && k.trim())
      .flatMap((k) => {
        const after = k.split(":").pop().trim();
        const m = after.match(/\(([^)]*%)\)\s*$/);
        return m
          ? [k, after, after.slice(0, m.index).trim(), m[1]]
          : [k, after];
      });

    return (
      <div className="bc-source">
        <div className="bc-source-heading">
          Baseline Characteristics
          <i className="bc-source-heading-icon" aria-hidden="true">
            i
          </i>
        </div>
        {subHeading && (
          <div className="bc-source-group">
            <div className="bc-source-group-title">{subHeading}</div>
            {measureType && (
              <div className="bc-source-group-measure">{measureType}</div>
            )}
          </div>
        )}
        <table className="bc-source-table">
          <thead>
            <tr>
              <th className="bc-source-sticky-col">Arm/Group Title</th>
              {armRows.map((arm, i) => (
                <th key={i}>{highlightKeywords(arm.label, keywords)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="bc-source-sticky-col">
                {highlightKeywords(rowLabel, keywords)}
              </td>
              {armRows.map((arm, i) => (
                <td className="bc-source-data-cell" key={i}>
                  <span className="bc-source-cell-value">
                    {highlightKeywords(arm.count, cellKeywords)}
                  </span>
                  {arm.pct && (
                    <span className="bc-source-cell-pct">
                      {highlightKeywords(arm.pct, cellKeywords)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // The CT.gov "Participant Flow" module: a heading, the period banner, then a
  // table whose sticky first column holds the row label and whose remaining
  // columns are the arms. Styles live in patientFlowSource.css.
  //
  // values = [ "<row label>", "<arm>: <n>", … ]; sub_heading is either
  // "Period Title: <period>" (a flow row) or "Arm/Group Title" (a header cell).
  if (heading.toLowerCase() === "participant flow") {
    const rowLabel = values[0] ?? "";
    const armRows = values.slice(1).map((line) => {
      const text = String(line ?? "");
      const at = text.indexOf(":");
      return at === -1
        ? { label: text.trim(), figure: "" }
        : { label: text.slice(0, at).trim(), figure: text.slice(at + 1).trim() };
    });

    // "Period Title: Overall Study" -> banner label + bolded period name.
    const periodMatch = subHeading.match(/^Period Title:\s*(.*)$/i);
    const periodName = periodMatch?.[1]?.trim() || "";

    // A cell keyword may be the whole "<arm>: <n>" line while the cell renders
    // only the figure, so also match the part after the final colon.
    const cellKeywords = (Array.isArray(keywords) ? keywords : [keywords])
      .filter((k) => typeof k === "string" && k.trim())
      .flatMap((k) => [k, k.split(":").pop().trim()]);

    return (
      <div className="pf-source">
        <div className="pf-source-heading">
          Participant Flow
          <i className="pf-source-heading-icon" aria-hidden="true">
            i
          </i>
        </div>
        <table className="pf-source-table">
          <thead>
            <tr>
              <th className="pf-source-sticky-col">Arm/Group Title</th>
              {armRows.map((arm, i) => (
                <th key={i}>{highlightKeywords(arm.label, keywords)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodName ? (
              <tr className="pf-source-period">
                <td colSpan={armRows.length + 1}>
                  <span className="pf-source-group-title-text">
                    Period Title: <strong>{periodName}</strong>
                  </span>
                </td>
              </tr>
            ) : (
              subHeading && (
                <tr className="pf-source-subgroup">
                  <td colSpan={armRows.length + 1}>
                    <span className="pf-source-group-title-text">
                      {subHeading}
                    </span>
                  </td>
                </tr>
              )
            )}
            <tr>
              <td className="pf-source-sticky-col">
                {highlightKeywords(rowLabel, keywords)}
              </td>
              {armRows.map((arm, i) => (
                <td className="pf-source-data-cell" key={i}>
                  <span className="pf-source-cell-value">
                    {highlightKeywords(arm.figure, cellKeywords)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // The CT.gov "Adverse Events" results table: an "Adverse Events" title, a
  // Time Frame row, the blue group banner, then a table whose sticky first
  // column holds the event name and whose remaining columns are the arms.
  //
  // values = [ "<event name>", "<arm label>: <figure>", … ] — each arm line is
  // split on the first colon into the column header and its cell value.
  if (heading.toLowerCase() === "adverse events") {
    const eventName = values[0] ?? "";
    const armRows = values.slice(1).map((line) => {
      const text = String(line ?? "");
      const at = text.indexOf(":");
      return at === -1
        ? { label: text.trim(), figure: "" }
        : { label: text.slice(0, at).trim(), figure: text.slice(at + 1).trim() };
    });
    const timeFrame = String(snippet?.time_frame ?? "").trim();

    // A cell keyword may be the whole "<arm> — Serious: 3/271 (1.11%)" line
    // while the cell itself renders only the figure, so also match the part
    // after the final colon.
    const cellKeywords = (Array.isArray(keywords) ? keywords : [keywords])
      .filter((k) => typeof k === "string" && k.trim())
      .flatMap((k) => [k, k.split(":").pop().trim()]);

    return (
      <div className="snippet-source snippet-source--adverse">
        <div className="snippet-source-title">
          Adverse Events
          <i className="snippet-source-title-icon" aria-hidden="true">
            i
          </i>
        </div>
        <div className="snippet-source-body">
          {timeFrame && (
            <div className="snippet-source-timeframe">
              <div className="snippet-source-timeframe-label">Time Frame</div>
              <div className="snippet-source-timeframe-value">{timeFrame}</div>
            </div>
          )}
          <div className="snippet-source-group-title">
            Serious Adverse Events
          </div>
          <table className="snippet-source-table">
            <thead>
              <tr>
                <th className="snippet-source-sticky-col">Arm/Group Title</th>
                {armRows.map((arm, i) => (
                  <th key={i}>{highlightKeywords(arm.label, keywords)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* System Organ Class band, e.g. "Cardiac disorders". */}
              {subHeading && (
                <tr className="snippet-source-subgroup">
                  <td colSpan={armRows.length + 1}>{subHeading}</td>
                </tr>
              )}
              <tr>
                <td className="snippet-source-sticky-col">
                  {highlightKeywords(eventName, keywords)}
                  <span className="snippet-source-footnote">†1</span>
                </td>
                {armRows.map((arm, i) => (
                  <td className="snippet-source-data-cell" key={i}>
                    <span className="snippet-source-cell-value">
                      {highlightKeywords(arm.figure, cellKeywords)}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // The CT.gov "Study Plan" outcome block renders as the "What is the study
  // measuring?" accordion: a 3-column table (Outcome Measure | Measure
  // Description | Time Frame). The endpoint snippets carry exactly those three
  // values, in that order, with the latter two prefixed on the source page.
  if (heading.toLowerCase() === "study plan") {
    const stripPrefix = (text, prefix) => {
      const s = String(text ?? "");
      const re = new RegExp(`^\\s*${prefix}\\s*:\\s*`, "i");
      return s.replace(re, "");
    };
    const measure = values[0] ?? "";
    const description = stripPrefix(values[1] ?? "", "Measure Description");
    const timeFrame = stripPrefix(values[2] ?? "", "Time Frame");

    return (
      <div className="snippet-source snippet-source--outcome">
        <div className="snippet-source-accordion">
          What is the study measuring?
        </div>
        <div className="snippet-source-body">
          <div className="snippet-source-title">
            {/* sub_heading lets the JSON say Primary vs Secondary. */}
            {subHeading || "Primary Outcome Measures"}
            <i className="snippet-source-title-icon" aria-hidden="true">
              i
            </i>
          </div>
          <div className="snippet-source-table-scroll">
          <table className="snippet-source-table">
            <thead>
              <tr>
                <th className="snippet-source-col-measure">Outcome Measure</th>
                <th className="snippet-source-col-description">
                  Measure Description
                </th>
                <th className="snippet-source-col-timeframe">Time Frame</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="snippet-source-col-measure">
                  {highlightKeywords(measure, keywords)}
                </td>
                <td className="snippet-source-col-description">
                  {highlightKeywords(description, keywords)}
                </td>
                <td className="snippet-source-col-timeframe">
                  {highlightKeywords(timeFrame, keywords)}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="snippet-source">
      {heading && (
        <div className="snippet-source-title">
          {heading}
          {/* Decorative only — mirrors the ⓘ on the source page. */}
          <i className="snippet-source-title-icon" aria-hidden="true">
            i
          </i>
        </div>
      )}
      {subHeading && <div className="snippet-source-subtitle">{subHeading}</div>}
      {values.map((value, i) => (
        <p className="snippet-source-value" key={i}>
          {highlightKeywords(value, keywords)}
        </p>
      ))}
    </div>
  );
};

// True when a traceability entry carries a renderable `snippet` block.
const hasRenderableSnippet = (data) => {
  const s = data?.snippet;
  if (!s || typeof s !== "object") return false;
  const hasValues =
    Array.isArray(s.values) &&
    s.values.some((v) => v != null && String(v).trim() !== "");
  return (
    hasValues ||
    String(s.heading ?? "").trim() !== "" ||
    String(s.sub_heading ?? "").trim() !== ""
  );
};

// OncoSuite id(s) whose traceability image should be produced by rasterizing the
// `source_snippet_html` (via html2canvas) instead of loading the `source` image URL.
const HTML_SNIPPET_ONCOSUITE_IDS = ["wD7-VqO-nZf"];

const matchesHtmlSnippetId = (data) => {
  const haystack = String(
    [data?.source, data?.source_link].filter(Boolean).join(" ")
  );
  return HTML_SNIPPET_ONCOSUITE_IDS.some((id) => haystack.includes(id));
};

// Renders `source_snippet_html` off-screen, rasterizes it to a PNG with
// html2canvas, and shows the resulting image. Falls back to the source text on
// any failure. Used only for the whitelisted OncoSuite ids above.
const HtmlSnippetImage = ({ html, alt }) => {
  const containerRef = useRef(null);
  const [dataUrl, setDataUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDataUrl("");
    setFailed(false);

    const node = containerRef.current;
    if (!node || !html) {
      setFailed(true);
      return;
    }

    // Wait a tick so the injected HTML (and its @font-face rules) has a chance
    // to lay out before we snapshot it.
    const run = async () => {
      try {
        await new Promise((r) => setTimeout(r, 50));
        if (cancelled) return;
        // Wait for web fonts referenced by the snippet's @font-face rules so the
        // rasterized text matches the source screenshot instead of a fallback.
        if (document.fonts && document.fonts.ready) {
          try {
            await document.fonts.ready;
          } catch {
            /* font loading is best-effort */
          }
        }
        if (cancelled) return;
        const canvas = await html2canvas(node, {
          // Transparent so the snapshot blends into the card's cream highlight
          // box rather than painting its own opaque background over it.
          backgroundColor: null,
          scale: window.devicePixelRatio || 2,
          useCORS: true,
          logging: false,
        });
        if (cancelled) return;
        setDataUrl(canvas.toDataURL("image/png"));
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [html]);

  if (failed) {
    return (
      <Typography
        sx={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", fontFamily: "Rubik" }}
      >
        {alt || "Source evidence unavailable"}
      </Typography>
    );
  }

  return (
    <>
      {/* Off-screen render target for html2canvas. Positioned (not display:none)
          so it has real layout to snapshot. */}
      {/* Render the EXACT source_snippet_html (markup + its own <style>/inline
          CSS), adding nothing of our own — so tables, borders and fonts come
          out identical to the source. Only the mechanical bits html2canvas
          needs are set: off-screen position and an intrinsic width so the
          content lays out at its natural size instead of collapsing. */}
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: "-10000px",
          // width:max-content lets the snippet's own layout (incl. tables)
          // determine its size; capped so runaway lines still wrap.
          width: "max-content",
          maxWidth: "800px",
          pointerEvents: "none",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {dataUrl ? (
        // White "paper" block behind the snippet image, sitting on the card's
        // cream highlight box — mirrors how the source document looks.
        <Box
          sx={{
            backgroundColor: "#FFFFFF",
            p: "12px 14px",
            borderRadius: "4px",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <img
            src={dataUrl}
            alt={alt || "Source evidence"}
            style={{
              maxWidth: "100%",
              height: "auto",
              display: "block",
              borderRadius: "2px",
            }}
          />
        </Box>
      ) : (
        <Typography
          sx={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", fontFamily: "Rubik" }}
        >
          Rendering source evidence…
        </Typography>
      )}
    </>
  );
};

// Renders a single traceability record. All the original card body lives here so
// the outer component can swap which record is shown via chips + arrows.
const EvidenceTraceContent = ({ data, headerSlot = null }) => {
  const appendDisplayUnit = (sourceText, displayValue) => {
    const source = String(sourceText ?? "").trim();
    const display = String(displayValue ?? "").trim();

    if (!source || !display || display === "-" || source === display) {
      return source;
    }

    if (display.toLowerCase().startsWith(source.toLowerCase())) {
      return `${source}${display.slice(source.length)}`;
    }

    const sourceNumber = Number(source.replace(/,/g, ""));
    const displayNumberMatch = display.match(/^\s*(-?\d+(?:,\d{3})*(?:\.\d+)?)/);
    if (!Number.isFinite(sourceNumber) || !displayNumberMatch) {
      return source;
    }

    const displayNumberText = displayNumberMatch[1];
    const displayNumber = Number(displayNumberText.replace(/,/g, ""));
    if (!Number.isFinite(displayNumber) || displayNumber !== sourceNumber) {
      return source;
    }

    return `${source}${display.slice(displayNumberMatch[0].length)}`;
  };

  const rawSource = typeof data?.source === "string" ? data.source : "";
  // TESTING: when the traceability `source` is an image URL (e.g. the Lung/organ
  // histology screenshot), show the image inside the yellow highlight box
  // instead of the source_text.
  const isImageSource = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(rawSource);

  // For whitelisted OncoSuite ids, render the `source_snippet_html` as an image
  // (rasterized via html2canvas) instead of loading the `source` image URL.
  const snippetHtml =
    typeof data?.source_snippet_html === "string" ? data.source_snippet_html : "";
  const useHtmlSnippet = matchesHtmlSnippetId(data) && !!snippetHtml;

  // Structured `snippet` block -> render as a CSS mock of the source document.
  // This REPLACES the screenshot for records that carry a snippet: the whole
  // point of the snippet is to render as styled text rather than a PNG, so it
  // wins over `isImageSource`. Records without a snippet keep their image.
  const useSnippetSource = !useHtmlSnippet && hasRenderableSnippet(data);

  // The "Study Plan" and "Adverse Events" variants render wide, scaled-down
  // tables that need a taller container than the other snippet layouts.
  const snippetHeading = String(data?.snippet?.heading ?? "")
    .trim()
    .toLowerCase();
  const useOutcomeSnippet =
    useSnippetSource &&
    (snippetHeading === "study plan" ||
      snippetHeading === "adverse events" ||
      snippetHeading === "participant flow" ||
      snippetHeading === "baseline characteristics");

  const highlightedText = appendDisplayUnit(
    data?.source_text || data?.highlight,
    data?.display_value
  );
  const fullText =
    highlightedText ||
    (rawSource && rawSource.toLowerCase() !== "header" ? rawSource : "");
  const nctMatch = String(
    [
      data?.nctId,
      data?.nct_id,
      data?.source_link,
      data?.source,
      data?.source_text,
      data?.highlight,
    ]
      .filter(Boolean)
      .join(" ")
  ).match(/\bNCT\d{8}\b/i);
  const nctId = nctMatch?.[0]?.toUpperCase() || "";
  const sourceLink = data?.source_link || (nctId ? `https://clinicaltrials.gov/study/${nctId}` : "#");
  let sorce = data.confidence * 100
  // 2. HIGHLIGHT TERMS
  const highlightTerms = data?.highlight;
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 3. HIGHLIGHTING LOGIC
  const getHighlightedText = (text, highlightString) => {
    // Guard clause: if there's no text or no search string, return original text
    if (!text || typeof text !== "string" || !highlightString || typeof highlightString !== "string") {
      return text;
    }

    // Escape special characters to prevent regex breaking (e.g., if user types '?')
    const escapedHighlight = highlightString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create a global, case-insensitive regex
    const regex = new RegExp(`(${escapedHighlight})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          style={{
            backgroundColor: "rgba(253, 190, 0, 1)",
            padding: "0 2px",
            borderRadius: "2px",
            fontWeight: 600,
            color: "#000",
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const getProgressColor = (value) => {
    if (value >= 80) return '#4ade80'; // Green
    if (value >= 50) return '#fbbf24'; // Amber
    return '#f87171'; // Red
  };
  return (
    <>
      <Box mb={1}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between" // Pushes score to the far right
          mb={2}
          sx={{ width: '100%' }}
        >
          {/* Left Side: Icon and Title */}
          <Box display="flex" alignItems="center" gap={1}>
            <img
              src={Evidence}
              alt="Evidence Icon"
              style={{ width: 22, height: 22 }} // Adjusted to match Figma scale
            />
            <Typography
              fontFamily="Rubik"
              fontWeight={500} // Bolder per the image
              fontSize="16px"
              lineHeight={"18px"}
              color="#000000"
            >
              {data?.arm || "Data Traceability"}
            </Typography>
          </Box>

          {/* Right Side: Progress Component */}
          <ConfidenceScore score={sorce || 0} />
        </Box>
        <Divider sx={{ borderColor: "rgba(0, 0, 0, 0.2)" }} />
      </Box>

      {headerSlot}

      {(useHtmlSnippet || isImageSource || useSnippetSource || (!isImageSource && fullText)) && <Box
        sx={{
          // Main container
          backgroundColor: "#FFFBEB", // Very light yellow/cream background
          borderLeft: "4px solid #FACC15", // Bold yellow accent on the left
          // Spacious padding, trimmed for the outcome table so the scaled card
          // gets the popover's full width.
          p: useOutcomeSnippet ? "12px" : "16px 20px",
          mb: 1.5,
          // The outcome-measures table is a tall block (header + 3-column row of
          // prose); 300px clips it mid-row, so give that variant more room.
          maxHeight: useOutcomeSnippet
            ? "min(560px, calc(100vh - 220px))"
            : "min(300px, calc(100vh - 220px))",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          borderRadius: "2px", // Slight rounding on the right corners
        }}
      >
        {useHtmlSnippet ? (
          <HtmlSnippetImage
            html={snippetHtml}
            alt={fullText || "Source evidence"}
          />
        ) : useSnippetSource ? (
          // Checked before the image branch: a record carrying a snippet renders
          // as styled text instead of its screenshot.
          <SnippetSource snippet={data.snippet} keywords={data?.keywords} />
        ) : isImageSource ? (
          <TraceabilityImage
            url={resolveTraceabilityImageUrl(rawSource)}
            alt={fullText || "Source evidence"}
          />
        ) : (
        <Typography
          sx={{
            fontSize: "14px",
            lineHeight: "1.6",
            fontFamily: "'Rubik', sans-serif",
            color: "#374151", // Dark gray/charcoal for readability
            fontWeight: 400,
            letterSpacing: "0.01em",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            "& mark, & .highlight": {
              backgroundColor: "rgba(253, 190, 0, 1)",
              color: "#000",
              padding: "0 2px",
              fontWeight: 600, // Matching the "12.5 months" bolding in image
              borderRadius: "2px",
            }
          }}
        >
          {/* Ensure getHighlightedText wraps terms in <mark> 
        or a span with the class 'highlight' 
    */}
          {getHighlightedText(fullText, highlightTerms) || ""}
        </Typography>
        )}
      </Box>}

      <Box>
        <Box sx={{ pl: "16px" }}>
          {String(data?.reasoning ?? "").trim().length > 0 && (
            <Box mb={1.5}>
            <Typography
              fontFamily="Rubik"
              fontSize="12px"
              lineHeight="18px"
              letterSpacing="0%"
              fontWeight={400}
              color="rgba(0,0,0,0.4)"
              mb={0.5}
            >
              Reasoning
            </Typography>
            <Typography
              fontFamily="Rubik"
              fontSize="14px"
              lineHeight="18px"
              letterSpacing="0%"
              fontWeight={400}
              color="rgba(0,0,0,0.6)"
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {data?.reasoning}
            </Typography>
            </Box>
          )}

          <Box>
            <Typography
              fontFamily="Rubik"
              fontWeight={400}
              fontSize="12px"
              lineHeight="18px"
              letterSpacing="0%"
              mt={0.5}
            >
            <span style={{ fontFamily: "Rubik", color: "rgba(0,0,0,0.4)" }}>
              Source:&nbsp;
            </span>
            <Link
              to={sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "Rubik",
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "18px",
                letterSpacing: "0%",
                color: "rgba(38, 102, 190, 1)",
                textDecoration: "none",
              }}
            >
              {(() => {
                // Prefer the API-provided source_type; fall back to inferring
                // from the source/link when it's missing (legacy records).
                let sourceLabel;
                if (data?.source_type) {
                  sourceLabel = normalizeSourceType(data.source_type);
                } else {
                  const rawSource = String(data?.source ?? "").trim();
                  const rawSourceLower = rawSource.toLowerCase();
                  const link = String(sourceLink ?? "").toLowerCase();
                  const looksLikeInternalTrialId =
                    rawSource && !/\bNCT\d{8}\b/i.test(rawSource) && /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(rawSource);
                  const isClinicalTrialsSource =
                    rawSourceLower.includes("ct.gov") ||
                    rawSourceLower.includes("clinicaltrials.gov");
                  sourceLabel =
                    link.includes("pubmed") || link.includes("ncbi.nlm.nih.gov")
                      ? "PubMed"
                      : link.includes("clinicaltrials.gov") || isClinicalTrialsSource
                        ? "Clinical Trials"
                        : rawSource && rawSourceLower !== "header" && !looksLikeInternalTrialId
                          ? rawSource
                          : "Clinical Trials";
                }
                const pageText = String(
                  data?.source_text ?? data?.highlight ?? ""
                );
                const pageMatch = pageText.match(/page\s*(\d+)/i);
                const pageNo = pageMatch?.[1] ? pageMatch[1] : "";

                const parts = [];
                parts.push(sourceLabel);
                if (nctId) parts.push(`- ${nctId}`);
                if (pageNo) parts.push(`, Page ${pageNo}`);
                return ` ${parts.join(" ")}`.trim();
              })()}
            </Link>
            </Typography>
          </Box>
        </Box>

        <Divider
          sx={{ borderColor: "rgba(0, 0, 0, 0.5)", marginTop: "10px" }}
        />
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography fontSize={12} color="rgba(0,0,0,0.4)" fontFamily="Rubik">
          Source Date: {data?.source_date ?? ""}
        </Typography>
        <Typography fontSize={12} color="rgba(0,0,0,0.4)" fontFamily="Rubik">
          OncoSuite {(() => {
            const raw = String(data?.version ?? "").trim().replace(/^v/i, "");
            // Backend sends the literal "None"/empty when no version exists — fall back to 1.0.
            const isMissing = !raw || raw.toLowerCase() === "none";
            return `v${isMissing ? "1.0" : raw}`;
          })()}
        </Typography>
      </Box>
    </>
  );
};

const OUTER_SX = {
  width: "min(464px, calc(100vw - 32px))",
  maxWidth: "calc(100vw - 32px)",
  maxHeight: "calc(100vh - 32px)",
  height: "auto",
  bgcolor: "#fff",
  borderRadius: "6px",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0px 4px 10px rgba(130, 143, 169, 0.15)",
  p: 2,
  fontFamily: "Rubik",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

// Accepts either:
//   - `list`: an array of normalized traceability records (preferred), or
//   - `data`: a single record (legacy / backward compatible).
const EvidenceTraceCard = ({ data, list }) => {
  const records = useMemo(() => {
    const source = Array.isArray(list) ? list : data ? [data] : [];
    return source.filter((r) => r && typeof r === "object");
  }, [list, data]);

  // Distinct source types present, in a stable order (Clinical Trials first),
  // plus a count of how many evidence records each type has.
  const sourceTypes = useMemo(() => {
    const present = new Set(records.map((r) => normalizeSourceType(r?.source_type)));
    return ["Clinical Trials", "PubMed"].filter((t) => present.has(t));
  }, [records]);

  const sourceTypeCounts = useMemo(() => {
    return records.reduce((acc, r) => {
      const t = normalizeSourceType(r?.source_type);
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
  }, [records]);

  const showChips = sourceTypes.length > 1;
  const [activeType, setActiveType] = useState(sourceTypes[0] || "Clinical Trials");

  // Records for the currently selected source type. When there are no chips
  // (single type or legacy), fall back to every record.
  const visibleRecords = useMemo(() => {
    if (!showChips) return records;
    return records.filter(
      (r) => normalizeSourceType(r?.source_type) === activeType
    );
  }, [records, showChips, activeType]);

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(visibleRecords.length - 1, 0));
  const activeRecord = visibleRecords[safeIndex] || records[0] || data || {};

  const handleSelectType = (type) => {
    setActiveType(type);
    setIndex(0);
  };
  const goPrev = () =>
    setIndex((i) => (i - 1 + visibleRecords.length) % visibleRecords.length);
  const goNext = () => setIndex((i) => (i + 1) % visibleRecords.length);

  const showArrows = visibleRecords.length > 1;

  return (
    <Box sx={OUTER_SX}>
      {(() => {
      const chipToggle = showChips ? (
        <Box
          display="inline-flex"
          mb={1.5}
          mt={1.5}
          sx={{
            alignSelf: "flex-start",
            p: "3px",
            borderRadius: "20px",
            backgroundColor: "rgba(0,0,0,0.05)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {sourceTypes.map((type) => {
            const selected = type === activeType;
            const count = sourceTypeCounts[type] || 0;
            return (
              <Box
                key={type}
                component="button"
                onClick={() => handleSelectType(type)}
                sx={{
                  cursor: "pointer",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: selected ? "#fff" : "transparent",
                  color: selected ? "rgba(38,102,190,1)" : "rgba(0,0,0,0.55)",
                  boxShadow: selected ? "0px 1px 3px rgba(0,0,0,0.12)" : "none",
                  fontFamily: "Rubik",
                  fontSize: "12px",
                  fontWeight: selected ? 600 : 500,
                  borderRadius: "16px",
                  px: 1.5,
                  py: 0.5,
                  lineHeight: 1.4,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    color: selected ? "rgba(38,102,190,1)" : "rgba(0,0,0,0.75)",
                  },
                }}
              >
                {type}
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "16px",
                    height: "16px",
                    px: "4px",
                    borderRadius: "8px",
                    fontSize: "10px",
                    fontWeight: 600,
                    lineHeight: 1,
                    backgroundColor: selected
                      ? "rgba(38,102,190,0.12)"
                      : "rgba(0,0,0,0.1)",
                    color: selected ? "rgba(38,102,190,1)" : "rgba(0,0,0,0.5)",
                  }}
                >
                  {count}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : null;

      return (
        <EvidenceTraceContent data={activeRecord} headerSlot={chipToggle} />
      );
      })()}

      {showArrows && (
        <>
          <Divider sx={{ borderColor: "rgba(0,0,0,0.1)", mt: 1.5 }} />
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1.5}
            mt={1.5}
          >
            <Box
              component="button"
              onClick={goPrev}
              aria-label="Previous evidence"
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(0,0,0,0.15)",
                backgroundColor: "#fff",
                borderRadius: "50%",
                width: 28,
                height: 28,
                p: 0,
                color: "rgba(0,0,0,0.6)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </Box>
            <Typography
              fontFamily="Rubik"
              fontSize="12px"
              fontWeight={500}
              color="rgba(0,0,0,0.6)"
              sx={{ minWidth: 42, textAlign: "center" }}
            >
              {safeIndex + 1} / {visibleRecords.length}
            </Typography>
            <Box
              component="button"
              onClick={goNext}
              aria-label="Next evidence"
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(0,0,0,0.15)",
                backgroundColor: "#fff",
                borderRadius: "50%",
                width: 28,
                height: 28,
                p: 0,
                color: "rgba(0,0,0,0.6)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default EvidenceTraceCard;
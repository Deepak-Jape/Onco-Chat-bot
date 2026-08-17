import React, { useEffect, useState } from 'react';
import EvidenceHoverHeader from './EvidenceHoverCell';
import { getTraceability } from '../../../utils/helpers/helper';

export default function EndpointAnalysisCard({ 
  source_date, 
  version, 
  nctId,
  phaseEndpoints = [],
  selectedIdData 
}) {

  // console.log("phaseEndpoints", phaseEndpoints)
  console.log("selectedIdData :)", selectedIdData)
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(false);
  const [primaryEndpoints, setPrimaryEndpoints] = useState([]);
  const [secondaryEndpoints, setSecondaryEndpoints] = useState([]);
  const sharedEvidence = { source_date, version, nctId };
  useEffect(() => {
    if(selectedIdData.length == 0) return;
    const primaryData = selectedIdData.endpoints?.value.filter(x => x.endpoint_type == 'Primary')
    const secondaryData = selectedIdData.endpoints?.value.filter(x => x.endpoint_type == 'Secondary')
    setPrimaryEndpoints(primaryData)
    setSecondaryEndpoints(secondaryData)
  }, [selectedIdData])

  // --- STATIC ACCURATE DATA SET MATCHING FIGMA ---
  // const primaryEndpoints = [
  //   {
  //     endpoint: "PFS",
  //     measurement_and_criteria: "Progression-free survival per RECIST v1.1",
  //     timing_and_evaluator: "Assessed every 8 weeks; Blinded IRC"
  //   },
  //   {
  //     endpoint: "OS",
  //     measurement_and_criteria: "Time from randomization to death from any cause",
  //     timing_and_evaluator: "Continuous monitoring; Investigator"
  //   }
  // ];

  // const secondaryEndpoints = [
  //   {
  //     endpoint: "ORR",
  //     measurement_and_criteria: "Objective response rate (CR+PR per RECIST)",
  //     timing_and_evaluator: "Week 12 assessment; IRC"
  //   },
  //   {
  //     endpoint: "DOR",
  //     measurement_and_criteria: "Duration of response until progression or death",
  //     timing_and_evaluator: "Updated every scan; IRC"
  //   },
  //   {
  //     endpoint: "QoL",
  //     measurement_and_criteria: "Change in EORTC QLQ-C30 global health score",
  //     timing_and_evaluator: "Week 24; Patient-reported"
  //   },
  //   {
  //     endpoint: "Safety",
  //     measurement_and_criteria: "All-grade and Grade 3–5 TRAEs per CTCAE v5.0",
  //     timing_and_evaluator: "Collected continuously; Investigator"
  //   }
  // ];

  return (
    /* Outer Box Block (Set to full 100% width with no inner block padding to ensure flush fitting) */
    <div style={{ 
      width: '100%', 
      backgroundColor: '#FFFFFF', 
      border: '1px solid rgba(0, 0, 0, 0.08)', 
      boxShadow: '0px 4px 24px rgba(153, 169, 190, 0.12)', 
      borderRadius: '6px', 
      overflow: 'hidden',
      boxSizing: 'border-box', 
      textAlign: 'left' 
    }}>
      
      {/* Table Component taking up exactly 100% of the horizontal space */}
      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', margin: 0, padding: 0 }}>
        <colgroup>
          {/* Proportional fluid columns adding up to 100% without hardcoded widths */}
          <col style={{ width: '25%' }} />
          <col style={{ width: '45%' }} />
          <col style={{ width: '30%' }} />
        </colgroup>

        {/* Gray Header Backplate Background Styling */}
        <thead style={{ backgroundColor: '#F9F9FB', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
          <tr style={{ height: '42px' }}>
            <th style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 500, fontSize: '14px', color: 'rgba(0, 0, 0, 0.8)', padding: '0 16px', borderRight: '1px solid rgba(0, 0, 0, 0.05)', textAlign: 'left', boxSizing: 'border-box' }}>
              Endpoint
            </th>
            <th style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 500, fontSize: '14px', color: 'rgba(0, 0, 0, 0.8)', padding: '0 16px', borderRight: '1px solid rgba(0, 0, 0, 0.05)', textAlign: 'left', boxSizing: 'border-box' }}>
              Measurement & Criteria
            </th>
            <th style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 500, fontSize: '14px', color: 'rgba(0, 0, 0, 0.8)', padding: '0 16px', textAlign: 'left', boxSizing: 'border-box' }}>
              Timing & Evaluator
            </th>
          </tr>
        </thead>
        
        <tbody>
          {/* --- Primary Endpoints Group Header --- */}
          <tr style={{ height: '44px' }}>
            <td colSpan={3} style={{ padding: '12px 16px 4px 16px', verticalAlign: 'top', textAlign: 'left' }}>
              <span style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 500, fontSize: '14px', color: '#1C4D8E' }}>
                Primary endpoints
              </span>
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ padding: '0 16px' }}>
              <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }} />
            </td>
          </tr>
          {console.log("primaryEndpoints", primaryEndpoints)}
          {primaryEndpoints?.map((item, index) => (
            <React.Fragment key={`primary-row-${index}`}>
            <tr style={{ height: '52px' }}>
              {/* Column 1 */}
              <td style={{ padding: '10px 16px', borderRight: '1px solid rgba(0, 0, 0, 0.05)', verticalAlign: 'top', textAlign: 'left', boxSizing: 'border-box' }}>
                  <EvidenceHoverHeader
                    key={`endpoint-${index}`}
                    label={
                      <div
                    style={{
                        fontFamily: "Rubik",
                        fontWeight: 500,
                        fontSize: "16px",
                        lineHeight: "20px",
                        letterSpacing: "0%",
                        color: "rgba(0, 0, 0, 0.8)"
                    }}
                  >
                    {item.endpoint?.value && item.endpoint?.value.includes("(")
                      ? <>
                        {(item.endpoint?.value.match(/^[^(]+/) || [""])[0].trim()}
                        <br />
                        <span style={{ fontWeight: 400, fontSize: "16px", lineHeight: "20px", color: "rgba(0, 0, 0, 0.6)" }}>
                          {(item.endpoint?.value.match(/\(.*$/) || [""])[0].trim()}
                        </span>
                      </>
                      : item.endpoint?.value
                    }
                  </div>
                    // <span className="cursor-pointer text-gray-700">{item.endpoint?.value || "-"}
                    // </span>
                    }
                    evidence={{
                      source_date: source_date,
                      version: version,
                      highlight: getTraceability(item.endpoint)?.source_text,
                      source: getTraceability(item.endpoint)?.source || [],
                      arm: "Endpoint Details",
                      reasoning: getTraceability(item.endpoint)?.reasoning,
                      confidence: getTraceability(item.endpoint)?.confidence_score,
                      source_link: getTraceability(item.endpoint)?.source_link,
                      nctId: nctId,
                      source_snippet_html: getTraceability(item.endpoint)?.source_snippet_html,
                      // Structured source-document snippet + terms to highlight in it.
                      snippet: getTraceability(item.endpoint)?.snippet,
                      keywords: getTraceability(item.endpoint)?.keywords,
                    }}
                  />
              </td>
              {/* Column 2 */}
              <td style={{ padding: '10px 16px', borderRight: '1px solid rgba(0, 0, 0, 0.05)', verticalAlign: 'top', textAlign: 'left', boxSizing: 'border-box' }}>
                <EvidenceHoverHeader
                    key={`criteria-${index}`}
                    label={<span className="cursor-pointer text-gray-700">{item.measurement_and_criteria?.value || "-"}</span>}
                    evidence={{
                      source_date: source_date,
                      version: version,
                      highlight: getTraceability(item.measurement_and_criteria)?.source_text,
                      source: getTraceability(item.measurement_and_criteria)?.source || [],
                      arm: "Measurement Criteria",
                      reasoning: getTraceability(item.measurement_and_criteria)?.reasoning,
                      source_link: getTraceability(item.measurement_and_criteria)?.source_link,
                      confidence: getTraceability(item.measurement_and_criteria)?.confidence_score,
                      nctId: nctId,
                      source_snippet_html: getTraceability(item.measurement_and_criteria)?.source_snippet_html,
                      // Structured source-document snippet + terms to highlight in it.
                      snippet: getTraceability(item.measurement_and_criteria)?.snippet,
                      keywords: getTraceability(item.measurement_and_criteria)?.keywords,
                    }}
                  />
              </td>
              {/* Column 3 */}
              <td style={{ padding: '10px 16px', verticalAlign: 'top', textAlign: 'left', boxSizing: 'border-box' }}>
                  <EvidenceHoverHeader
                    key={`timing-${index}`}
                    label={<span className="cursor-pointer text-gray-700">{item.timing_and_evaluator?.value || "-"}</span>}
                    evidence={{
                      source_date: source_date,
                      version: version,
                      highlight: getTraceability(item.timing_and_evaluator)?.source_text,
                      source: getTraceability(item.timing_and_evaluator)?.source || [],
                      arm: "Timing & Evaluation",
                      reasoning: getTraceability(item.timing_and_evaluator)?.reasoning,
                      confidence: getTraceability(item.timing_and_evaluator)?.confidence_score,
                      source_link: getTraceability(item.timing_and_evaluator)?.source_link,
                      nctId: nctId,
                      source_snippet_html: getTraceability(item.timing_and_evaluator)?.source_snippet_html,
                      // Structured source-document snippet + terms to highlight in it.
                      snippet: getTraceability(item.timing_and_evaluator)?.snippet,
                      keywords: getTraceability(item.timing_and_evaluator)?.keywords,
                    }}
                  />
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ padding: '0 16px' }}>
                <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }} />
              </td>
            </tr>
            </React.Fragment>
          ))}

          {/* --- Secondary Endpoints Group Header --- */}
          {secondaryEndpoints?.length > 0 && (
          <tr style={{ height: '48px' }}>
            <td colSpan={3} style={{ padding: '14px 16px 4px 16px', verticalAlign: 'top', textAlign: 'left' }}>
              <div
                onClick={() => setIsSecondaryOpen(!isSecondaryOpen)}
                style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 500, fontSize: '14px', color: '#1C4D8E' }}>
                  {secondaryEndpoints.length} Secondary endpoints
                </span>
                <svg
                  style={{
                    width: '18px',
                    height: '18px',
                    color: '#1C4D8E',
                    fill: 'currentColor',
                    transform: isSecondaryOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                  viewBox="0 0 24 24"
                >
                  <path d="M7 10l5 5 5-5H7z"/>
                </svg>
              </div>
            </td>
          </tr>
          )}

          {/* Dynamic Secondary Rows */}
          {isSecondaryOpen && secondaryEndpoints?.map((item, index) => (
            <React.Fragment key={`secondary-row-${index}`}>
            <tr style={{ height: '52px' }}>
                            {/* Column 1 */}
              <td style={{ padding: '10px 16px', borderRight: '1px solid rgba(0, 0, 0, 0.05)', verticalAlign: 'top', textAlign: 'left', boxSizing: 'border-box' }}>
                  <EvidenceHoverHeader
                    key={`endpoint-${index}`}
                    label={<span className="cursor-pointer text-gray-700">{item.endpoint?.value || "-"}</span>}
                    evidence={{
                      source_date: source_date,
                      version: version,
                      highlight: getTraceability(item.endpoint)?.source_text,
                      source: getTraceability(item.endpoint)?.source || [],
                      arm: "Endpoint Details",
                      reasoning: getTraceability(item.endpoint)?.reasoning,
                      confidence: getTraceability(item.endpoint)?.confidence_score,
                      source_link: getTraceability(item.endpoint)?.source_link,
                      nctId: nctId,
                      source_snippet_html: getTraceability(item.endpoint)?.source_snippet_html,
                      // Structured source-document snippet + terms to highlight in it.
                      snippet: getTraceability(item.endpoint)?.snippet,
                      keywords: getTraceability(item.endpoint)?.keywords,
                    }}
                  />
              </td>
              {/* Column 2 */}
              <td style={{ padding: '10px 16px', borderRight: '1px solid rgba(0, 0, 0, 0.05)', verticalAlign: 'top', textAlign: 'left', boxSizing: 'border-box' }}>
                <EvidenceHoverHeader
                    key={`criteria-${index}`}
                    label={<span className="cursor-pointer text-gray-700">{item.measurement_and_criteria?.value || "-"}</span>}
                    evidence={{
                      source_date: source_date,
                      version: version,
                      highlight: getTraceability(item.measurement_and_criteria)?.source_text,
                      source: getTraceability(item.measurement_and_criteria)?.source || [],
                      arm: "Measurement Criteria",
                      reasoning: getTraceability(item.measurement_and_criteria)?.reasoning,
                      source_link: getTraceability(item.measurement_and_criteria)?.source_link,
                      confidence: getTraceability(item.measurement_and_criteria)?.confidence_score,
                      nctId: nctId,
                      source_snippet_html: getTraceability(item.measurement_and_criteria)?.source_snippet_html,
                      // Structured source-document snippet + terms to highlight in it.
                      snippet: getTraceability(item.measurement_and_criteria)?.snippet,
                      keywords: getTraceability(item.measurement_and_criteria)?.keywords,
                    }}
                  />
              </td>
              {/* Column 3 */}
              <td style={{ padding: '10px 16px', verticalAlign: 'top', textAlign: 'left', boxSizing: 'border-box' }}>
                  <EvidenceHoverHeader
                    key={`timing-${index}`}
                    label={<span className="cursor-pointer text-gray-700">{item.timing_and_evaluator?.value || "-"}</span>}
                    evidence={{
                      source_date: source_date,
                      version: version,
                      highlight: getTraceability(item.timing_and_evaluator)?.source_text,
                      source: getTraceability(item.timing_and_evaluator)?.source || [],
                      arm: "Timing & Evaluation",
                      reasoning: getTraceability(item.timing_and_evaluator)?.reasoning,
                      confidence: getTraceability(item.timing_and_evaluator)?.confidence_score,
                      source_link: getTraceability(item.timing_and_evaluator)?.source_link,
                      nctId: nctId,
                      source_snippet_html: getTraceability(item.timing_and_evaluator)?.source_snippet_html,
                      // Structured source-document snippet + terms to highlight in it.
                      snippet: getTraceability(item.timing_and_evaluator)?.snippet,
                      keywords: getTraceability(item.timing_and_evaluator)?.keywords,
                    }}
                  />
              </td>
            </tr>
            {index !== secondaryEndpoints.length - 1 && (
              <tr>
                <td colSpan={3} style={{ padding: '0 16px' }}>
                  <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }} />
                </td>
              </tr>
            )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
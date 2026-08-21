import React, { useState } from 'react';
import CountryFlag from '../../../common/GetFlags';

export default function LpiTimelineCard({
  sites = 24,
  plannedPatients = 200,
  timeToLPI = '11.2 months',
  cohortMode = 'single', // Options: 'single' | 'multiple'
  countryMode = 'multiple'  // Options: 'single' | 'multiple'
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatNumber = (num) => {
    if (num === 0 || num === '0') return '-';
    return Number(num).toLocaleString('en-US');
  };

  // --- Exact Figma Mock Datasets ---

  // State 2: Single Cohort + Multiple Countries (Screenshot 2)
  const singleCohortMultipleCountriesData = {
    headers: [
      { code: 'US', name: 'United States' },
      { code: 'UK', name: 'United Kingdom' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
      { code: 'IT', name: 'Italy' },
      { code: 'ES', name: 'Spain' },
      { code: 'CA', name: 'Canada' }
    ],
    rows: [
      {
        cohort: 'Breast Cancer, HER2+, 2L',
        total: { pts: '150 pts', sites: '44 sites', rate: '57.0 pts/mo', lpi: '12.5 mo' },
        countries: {
          US: { pts: '60 pts', sites: '4 sites', rate: '5.2 pts/mo', lpi: '11.5 mo' },
          UK: { pts: '40 pts', sites: '3 sites', rate: '3.6 pts/mo', lpi: '11.1 mo' },
          DE: { pts: '35 pts', sites: '2 sites', rate: '2.8 pts/mo', lpi: '12.5 mo' },
          FR: { pts: '55 pts', sites: '4 sites', rate: '4.8 pts/mo', lpi: '11.5 mo' },
          IT: { pts: '30 pts', sites: '2 sites', rate: '2.4 pts/mo', lpi: '12.5 mo' },
          ES: { pts: '250 pts', sites: '15 sites', rate: '22.3 pts/mo', lpi: '11.2 mo' },
          CA: { pts: '120 pts', sites: '8 sites', rate: '10.0 pts/mo', lpi: '12.0 mo' }
        }
      }
    ]
  };

  // State 3: Multiple Cohorts + Single Country (Screenshot 3)
  const multipleCohortsSingleCountryData = [
    { cohort: 'Breast Cancer, HER2+, 2L', code: "US", country: 'United States', patients: '60', sites: '4', enrollmentRate: '5.2 pts/mo', lpi: '11.5 mo' },
    { cohort: 'Breast Cancer, HER2+, 2L',  code: "US", country: 'United States', patients: '180', sites: '12', enrollmentRate: '17.0 pts/mo', lpi: '10.6 mo' },
    { cohort: 'Breast Cancer, HER2+, 2L',  code: "US", country: 'United States', patients: '150', sites: '10', enrollmentRate: '12.4 pts/mo', lpi: '12.1 mo' },
  ];

  // State 4: Multiple Cohorts + Multiple Countries (Screenshot 4)
  const multipleCohortsMultipleCountriesData = {
    headers: [
      { code: 'US', name: 'United States' },
      { code: 'UK', name: 'United Kingdom' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' }
    ],
    rows: [
      {
        cohort: 'Breast Cancer, HER2+, 2L',
        total: { pts: '150 pts', sites: '44 sites', rate: '57.0 pts/mo', lpi: '12.5 mo' },
        countries: {
          US: { pts: '60 pts', sites: '4 sites', rate: '5.2 pts/mo', lpi: '11.5 mo' },
          UK: { pts: '40 pts', sites: '3 sites', rate: '3.6 pts/mo', lpi: '11.1 mo' },
          DE: { pts: '35 pts', sites: '2 sites', rate: '2.8 pts/mo', lpi: '12.5 mo' },
          FR: { pts: '55 pts', sites: '4 sites', rate: '4.8 pts/mo', lpi: '11.5 mo' }
        }
      },
      {
        cohort: 'Breast Cancer, HER2+, 2L',
        total: { pts: '140 pts', sites: '34 sites', rate: '45.7 pts/mo', lpi: '12.8 mo' },
        countries: {
          US: { pts: '180 pts', sites: '12 sites', rate: '17.0 pts/mo', lpi: '10.6 mo' },
          UK: { pts: '95 pts', sites: '6 sites', rate: '8.3 pts/mo', lpi: '11.5 mo' },
          DE: { pts: '70 pts', sites: '5 sites', rate: '5.5 pts/mo', lpi: '12.8 mo' },
          FR: { pts: '50 pts', sites: '3 sites', rate: '4.5 pts/mo', lpi: '11.1 mo' }
        }
      },
      {
        cohort: 'Breast Cancer, HER2+, 2L',
        total: { pts: '110 pts', sites: '26 sites', rate: '32.2 pts/mo', lpi: '14.2 mo' },
        countries: {
          US: { pts: '150 pts', sites: '10 sites', rate: '12.4 pts/mo', lpi: '12.1 mo' },
          UK: { pts: '80 pts', sites: '5 sites', rate: '6.1 pts/mo', lpi: '13.2 mo' },
          DE: { pts: '45 pts', sites: '3 sites', rate: '3.2 pts/mo', lpi: '14.2 mo' },
          FR: { pts: '35 pts', sites: '2 sites', rate: '1.6 pts/mo', lpi: '11.7 mo' }
        }
      }
    ],
    summary: {
      total: { pts: '400 pts', sites: '104 sites', rate: '134.9 pts/mo', lpi: '14.5 mo' },
      countries: {
        US: { pts: '580 pts', sites: '37 sites', rate: '51.7 pts/mo', lpi: '11.2 mo' },
        UK: { pts: '295 pts', sites: '19 sites', rate: '24.4 pts/mo', lpi: '13.2 mo' },
        DE: { pts: '195 pts', sites: '14 sites', rate: '14.6 pts/mo', lpi: '14.2 mo' },
        FR: { pts: '145 pts', sites: '9 sites', rate: '12.7 pts/mo', lpi: '11.7 mo' }
      }
    }
  };

  const isSingleCohortSingleCountry = cohortMode === 'single' && countryMode === 'single';
  const showViewDetailsButton = !isSingleCohortSingleCountry;

  return (
    <div style={styles.container}>
      <div style={styles.headerWrapper}>
        <h3 style={styles.title}>Study Start to Last Patient In (LPI)</h3>
      </div>

      <div style={styles.mainContent}>
        {/* LEFT SIDE: Slider Graphic Track Bar */}
        <div style={styles.sliderWrapper}>
          <div style={styles.timelineContainer}>
            <div style={styles.axisTick} />
            <div style={styles.axisLine}>
              <div style={styles.rangeBar}>
                <div style={styles.medianLine} />
              </div>
            </div>
            <div style={styles.axisTick} />
          </div>

          <div style={styles.labelsWrapper}>
            <div style={{ ...styles.labelStack, left: '15%' }}>
              <span style={styles.labelValue}>8.6 mo</span>
              <span style={styles.labelText}>Optimistic (p25)</span>
            </div>

            <div style={{ ...styles.labelStack, left: '50%', transform: 'translateX(-50%)' }}>
              <span style={styles.labelValue}>11.2 mo</span>
              <span style={styles.labelText}>Estimated Median</span>
            </div>

            <div style={{ ...styles.labelStack, right: '15%' }}>
              <span style={styles.labelValue}>14.8 mo</span>
              <span style={styles.labelText}>Conservative (p75)</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Summary Metrics Sub-Card Panel */}
        <div style={styles.infoPanel}>
          <div style={styles.infoInnerWrapper}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Sites</span>
              <span style={styles.infoValue}>{formatNumber(sites)}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Planned Patients</span>
              <span style={styles.infoValue}>{formatNumber(plannedPatients)}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Time to LPI</span>
              <span style={styles.infoValue}>{timeToLPI}</span>
            </div>
          </div>

          {/* Action toggle for multi matrix tables */}
          {showViewDetailsButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={styles.viewDetailsBtn}
            >
              <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2666BE"
                strokeWidth="2.5"
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* --- DYNAMIC CONDITIONAL GRID TABLES PROTOTYPES --- */}
      {isExpanded && !isSingleCohortSingleCountry && (
        <div style={styles.matrixTableWrapper}>

          {/* CONDITION A: Single Cohort + Multiple Countries */}
          {cohortMode === 'single' && countryMode === 'multiple' && (
            <table style={styles.matrixTable}>
              <thead>
                <tr style={styles.matrixHeaderRow}>
                  <th style={{ ...styles.matrixTh, width: '180px', textAlign: 'left', paddingLeft: '16px' }}>Cohort</th>
                  <th style={{ ...styles.matrixTh, width: '110px' }}>Total</th>
                  {singleCohortMultipleCountriesData.headers.map(head => (
                    <th key={head.code} style={styles.matrixTh}>
                      <span style={styles.headerFlagLabel}>
                        <CountryFlag width={18} height={12} country={head.name} />
                        {head.code}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {singleCohortMultipleCountriesData.rows.map((row, idx) => (
                  <tr key={idx} style={styles.matrixBodyRow}>
                    <td style={{ ...styles.cohortCell, textAlign: 'left', paddingLeft: '16px' }}>{row.cohort}</td>
                    <td style={styles.subMetricCellStack}>
                      <div style={styles.stackItemBold}>{row.total.pts}</div><div>{row.total.sites}</div><div>{row.total.rate}</div><div>{row.total.lpi}</div>
                    </td>
                    {singleCohortMultipleCountriesData.headers.map(head => {
                      const cell = row.countries[head.code];
                      return (
                        <td key={head.code} style={styles.subMetricCellStack}>
                          <div>{cell.pts}</div><div>{cell.sites}</div><div>{cell.rate}</div><div>{cell.lpi}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* CONDITION B: Multiple Cohorts + Single Country */}
          {cohortMode === 'multiple' && countryMode === 'single' && (
            <table style={styles.matrixTable}>
              <thead>
                <tr style={styles.matrixHeaderRow}>
                  <th style={{ ...styles.matrixTh, textAlign: 'left', paddingLeft: '16px' }}>Cohort</th>
                  <th style={styles.matrixTh}>Country</th>
                  <th style={styles.matrixTh}>Patients (pts)</th>
                  <th style={styles.matrixTh}>Sites</th>
                  <th style={styles.matrixTh}>Enrollment Rate</th>
                  <th style={styles.matrixTh}>Time to LPI</th>
                </tr>
              </thead>
              <tbody>
                {multipleCohortsSingleCountryData.map((row, idx) => (
                  <tr key={idx} style={styles.matrixStandardRow}>
                    <td style={{ ...styles.cohortCell, textAlign: 'left', paddingLeft: '16px' }}>{row.cohort}</td>
                    <td style={styles.matrixTd}>
                      <span style={styles.headerFlagLabel}>
                        <CountryFlag width={20} height={14} country={row.country} />
                        {row.code}
                      </span>
                    </td>
                    <td style={styles.matrixTd}>{formatNumber(row.patients)}</td>
                    <td style={styles.matrixTd}>{formatNumber(row.sites)}</td>
                    <td style={styles.matrixTd}>{row.enrollmentRate}</td>
                    <td style={{ ...styles.matrixTd, fontWeight: '500' }}>{row.lpi}</td>
                  </tr>
                ))}
                <tr style={styles.matrixTotalRow}>
                  <td style={{ ...styles.cohortCell, fontWeight: '500', textAlign: 'left', paddingLeft: '16px', color: '#000000' }}>Total</td>
                  <td style={{ ...styles.matrixTd, fontWeight: '500' }}>
                    {/* <CountryFlag width={45} height={30} country="US" /> */}1
                  </td>
                  <td style={{ ...styles.matrixTd, fontWeight: '500' }}>580</td>
                  <td style={{ ...styles.matrixTd, fontWeight: '500' }}>37</td>
                  <td style={{ ...styles.matrixTd, fontWeight: '500' }}>51.7 pts/mo</td>
                  <td style={{ ...styles.matrixTd, fontWeight: '500' }}>12.1 mo</td>
                </tr>
              </tbody>
            </table>
          )}

          {/* CONDITION C: Multiple Cohorts + Multiple Countries */}
          {cohortMode === 'multiple' && countryMode === 'multiple' && (
            <table style={styles.matrixTable}>
              <thead>
                <tr style={styles.matrixHeaderRow}>
                  <th style={{ ...styles.matrixTh, width: '130px', textAlign: 'left', paddingLeft: '16px' }}>Cohort</th>
                  <th style={{ ...styles.matrixTh, width: 'auto' }}>Total</th>
                  {multipleCohortsMultipleCountriesData.headers.map(head => (
                    <th key={head.code} style={styles.matrixTh}>
                      <span style={styles.headerFlagLabel}>
                        <CountryFlag width={18} height={12} country={head.name} />
                        {head.code}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {multipleCohortsMultipleCountriesData.rows.map((row, idx) => (
                  <tr key={idx} style={styles.matrixBodyRow}>
                    <td style={{ ...styles.cohortCell, textAlign: 'left', paddingLeft: '16px' }}>{row.cohort}</td>
                    <td style={styles.subMetricCellStack}>
                      <div style={styles.stackItemBold}>{row.total.pts}</div><div>{row.total.sites}</div><div>{row.total.rate}</div><div>{row.total.lpi}</div>
                    </td>
                    {multipleCohortsMultipleCountriesData.headers.map(head => {
                      const cell = row.countries[head.code];
                      return (
                        <td key={head.code} style={styles.subMetricCellStack}>
                          <div>{cell.pts}</div><div>{cell.sites}</div><div>{cell.rate}</div><div>{cell.lpi}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Final Summary Matrix Row */}
                <tr style={styles.matrixTotalRow}>
                  <td style={{ ...styles.cohortCell, fontWeight: '500', textAlign: 'left', paddingLeft: '16px', color: '#000000' }}>Total</td>
                  <td style={styles.subMetricCellStack}>
                    <div style={styles.stackItemBold}>{multipleCohortsMultipleCountriesData.summary.total.pts}</div>
                    <div style={{ fontWeight: '500' }}>{multipleCohortsMultipleCountriesData.summary.total.sites}</div>
                    <div style={{ fontWeight: '500' }}>{multipleCohortsMultipleCountriesData.summary.total.rate}</div>
                    <div style={{ fontWeight: '500' }}>{multipleCohortsMultipleCountriesData.summary.total.lpi}</div>
                  </td>
                  {multipleCohortsMultipleCountriesData.headers.map(head => {
                    const cell = multipleCohortsMultipleCountriesData.summary.countries[head.code];
                    return (
                      <td key={head.code} style={styles.subMetricCellStack}>
                        <div style={styles.stackItemBold}>{cell.pts}</div>
                        <div style={{ fontWeight: '500' }}>{cell.sites}</div>
                        <div style={{ fontWeight: '500' }}>{cell.rate}</div>
                        <div style={{ fontWeight: '500' }}>{cell.lpi}</div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          )}

        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '20px',
    gap: '20px',
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #DCE9FC',
    boxShadow: '4px 4px 20px rgba(130, 143, 169, 0.15)',
    borderRadius: '8px',
    fontFamily: "'Rubik', sans-serif",
  },
  headerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '4px',
    width: '100%',
  },
  title: {
    margin: 0,
    fontWeight: '500',
    fontSize: '23px',
    lineHeight: '24px',
    color: 'rgba(0, 0, 0, 0.8)',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap',
    gap: '24px',
  },
  sliderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: '1 1 500px',
    minWidth: '280px',
  },
  timelineContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '40px',
    position: 'relative',
  },
  axisTick: {
    width: '2px',
    height: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  axisLine: {
    flexGrow: 1,
    height: '2px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  rangeBar: {
    position: 'absolute',
    left: '20%',
    width: '55%',
    height: '32px',
    background: 'linear-gradient(180deg, #913434 0%, #C14646 100%)',
    border: '2px solid rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medianLine: {
    width: '5px',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  labelsWrapper: {
    position: 'relative',
    width: '100%',
    height: '44px',
  },
  labelStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'absolute',
    textAlign: 'center',
  },
  labelValue: {
    fontWeight: '500',
    fontSize: '17px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.8)',
  },
  labelText: {
    fontWeight: '400',
    fontSize: '14px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.6)',
    whiteSpace: 'nowrap',
  },
  infoPanel: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 0px',
    gap: '10px',
    width: '280px',
    background: '#FFFFFF',
    border: '1px solid #DCE9FC',
    borderRadius: '8px',
    flexShrink: 0,
    margin: '0 auto',
  },
  infoInnerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px 12px',
    gap: '5px',
    width: '100%',
    boxSizing: 'border-box',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2px 0px',
    width: '100%',
  },
  infoLabel: {
    fontWeight: '400',
    fontSize: '14px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  infoValue: {
    fontWeight: '500',
    fontSize: '17px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.8)',
  },
  viewDetailsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    background: '#F0F6FF',
    color: '#2666BE',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    width: 'calc(100% - 24px)',
    marginTop: '4px'
  },

  /* Custom Matrix Structural View Tables Layouts */
  matrixTableWrapper: {
    width: '100%',
    // FIX (border not matching Figma): the table's header row background
    // (#F8FAFC) is a hard rectangle that spans the full table width. Without
    // `overflow: hidden` here, that rectangle bleeds straight past this
    // wrapper's rounded corners, so the border never actually reads as
    // rounded — this single property is what makes the whole table respect
    // the border radius, matching Figma's clean rounded-card look.
    // overflow: 'hidden',
    // border: '1px solid #E2E8F0',
    // borderRadius: '6px',
    marginTop: '10px'
  },
  matrixTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    textAlign: 'center'
  },
  matrixHeaderRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
    height: '42px'
  },
  matrixTh: {
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.7)',
    padding: '10px 6px',
    fontSize: '13px',
    verticalAlign: 'middle',
    border: "1px solid #E2E8F0"
  },
  // NEW: shared layout for a flag + country code/name sitting inline,
  // reused across every header cell and the Country column so flag
  // alignment stays consistent everywhere it appears.
  headerFlagLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'center',
  },
  matrixStandardRow: {
    borderBottom: '1px solid #F1F5F9',
    height: '52px'
  },
  matrixBodyRow: {
    borderBottom: '1px solid #F1F5F9',
    height: '102px'
  },
  matrixTotalRow: {
    backgroundColor: '#F2F2F6',
    // borderTop: '2px solid #E2E8F0',
    height: '102px'
  },
  cohortCell: {
    padding: '12px 8px',
    color: '#2666BE',
    fontWeight: '500',
    fontSize: '14px',
    verticalAlign: 'middle',
    border: "1px solid #E2E8F0"
  },
  matrixTd: {
    padding: '12px 6px',
    color: 'rgba(0, 0, 0, 0.8)',
    verticalAlign: 'middle',
    // border: "1px solid #E2E8F0"
  },
  subMetricCellStack: {
    padding: '10px 6px',
    fontSize: '13px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.6)',
    verticalAlign: 'middle',
    border: "1px solid #E2E8F0"
  },
  stackItemBold: {
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.8)'
  }
};
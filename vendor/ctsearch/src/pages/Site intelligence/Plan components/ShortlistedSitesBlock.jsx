import React, { useEffect, useMemo, useState } from 'react';
import MapImage from "../../../assets/siteIntentelligenceplanmap.png";
import CohortFilter from '../Common/CohortFilter';
import MapView from "../../../components/MapView";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { siteMarkers, trialMarkers } from '../../../utils/helpers/mapMarkersMockData';
import {
  Select,
  MenuItem,
} from "@mui/material";
import {
  getPopulationAnalytics,
} from "../../../api/analytics/population";
import { buildPopulationMapPoints } from '../../../utils/helpers/populationMapPoints';
import { resolveCoordinates } from '../../../utils/helpers/populationMapPoints';

export default function ShortlistedSitesBlock({ cohorts }) {
  const [activeView, setActiveView] = useState('list'); // Defaulting to map view to display changes instantly
  const [searchCountry, setSearchCountry] = useState('global');
  const [hoveredRegion, setHoveredRegion] = useState('Houston');

  // para for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; //hardcoded per request

  const [cohortSites, setCohortSites] = useState(0);
  const [sitesMapPoints, setSitesMapPoints] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const tableData = [
    { id: 1, name: 'Memorial Sloan Kettering Cancer Center', pi: 'Dr. Smith', score: 89, rate: 1.0, allocated: 10, timeToLPI: '10.0 mo', location: 'New York, NY' },
    { id: 2, name: 'MD Anderson Cancer Center', pi: 'Dr. Johnson', score: 88, rate: 0.5, allocated: 10, timeToLPI: '20.0 mo', location: 'Houston, TX' },
    { id: 3, name: 'Dana-Farber Cancer Institute', pi: 'Dr. Williams', score: 85, rate: 0.3, allocated: 6, timeToLPI: '20.0 mo', location: 'Boston, MA' },
    { id: 4, name: 'Stanford Cancer Institute', pi: 'Dr. Brown', score: 83, rate: 1.5, allocated: 9, timeToLPI: '6.0 mo', location: 'Stanford, CA' },
    { id: 5, name: 'Duke Cancer Institute', pi: 'Dr. Christopher', score: 82, rate: 1.5, allocated: 9, timeToLPI: '6.0 mo', location: 'Durham, NC' },
    { id: 6, name: 'Mayo Clinic Cancer Center', pi: 'Dr. Robert', score: 81, rate: 1.2, allocated: 12, timeToLPI: '9.2 mo', location: 'Rochester, MN' },
    { id: 7, name: 'Cleveland Clinic Taussig Cancer Institute', pi: 'Dr. Emily', score: 81, rate: 0.8, allocated: 8, timeToLPI: '13.5 mo', location: 'Cleveland, OH' },
    { id: 8, name: 'University of California San Francisco (UCSF) Cancer Center', pi: 'Dr. David', score: 81, rate: 0.6, allocated: 7, timeToLPI: '16.4 mo', location: 'San Francisco, CA' },
    { id: 9, name: 'Johns Hopkins Sidney Cancer Center', pi: 'Dr. Michael Lee', score: 80, rate: 1.0, allocated: 11, timeToLPI: '10.8 mo', location: 'Baltimore, MD' },
    { id: 10, name: 'Dana-Farber / Harvard Cancer Center', pi: 'Dr. Sarah Patel', score: 80, rate: 1.3, allocated: 12, timeToLPI: '8.4 mo', location: 'Boston, MA' },
  ];

  const countriesList = [
    "Italy",
    "France",
    "Japan",
    "Australia",
    "Brazil",
    "Russia",
    "China",
    "Switzerland",
    "United Kingdom",
    "Belgium",
    "Spain",
    "Netherlands",
    "Turkey",
    "United States",
    "Poland",
    "Germany",
    "India",
    "Global",
    "South Korea",
    "Canada"
  ];

  const regionsData = {
    Dallas: { id: 1, score: 142, position: { top: '23%', left: '46%' } },
    Waco: { id: 2, score: 89, position: { top: '51%', left: '41%' } },
    Houston: {
      id: 6,
      score: 64,
      position: { top: '59%', left: '57%' },
      title: 'Houston Region',
      patientRadius: '21,367,090',
      totalSites: 6,
      enrollmentTarget: 64,
      sites: [
        { name: 'MD Anderson', location: 'Houston, TX', pi: 'Dr. Johnson', score: '220 pts' },
        { name: 'Memorial Sloan', location: 'New York, NY', pi: 'Dr. Johnson', score: '200 pts' },
        { name: 'Dana-Farber', location: 'Boston, MA', pi: 'Dr. Johnson', score: '180 pts' }
      ]
    }
  };

  const formatNumber = (num) => {
    if (num === 0 || num === '0') return '-';
    return Number(num).toLocaleString('en-US');
  };

  const radius = 7;
  const strokeDasharray = 2 * Math.PI * radius;

  // Method for the Pagination...
  const totalPages = Math.ceil(tableData.length / pageSize);
  const paginatedData = tableData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // oncountry change
  useEffect(() => {
    let cancelled = false;

    async function getMapData() {
      setMapLoading(true);
      setSitesMapPoints([]);   // clear stale markers immediately on country change
      setCohortSites(0);

      try {
        const res = await getPopulationAnalytics({
          graph: ["new_cancer_cases_flow", "new_cancer_cases_map"],
          country_name: searchCountry.toLocaleLowerCase() || "",
          filters: {
            country: [],
            organ: [],
            histology: [],
            biomarkers: [],
            stage: [],
            line_intent: [],
          },
          session_key: 'search:RBNvo1WzZ4oRRq0W',
        });

        if (cancelled) return; // ignore stale responses if country changed again mid-flight

      const mapRoot = res.new_cancer_cases_map;
      setCohortSites(mapRoot?.population ?? 0);
      setSitesMapPoints(buildPopulationMapPoints(mapRoot, searchCountry));
      } catch (err) {
        console.error("Failed to load map data", err);
        if (!cancelled) {
          setSitesMapPoints([]);
          setCohortSites(0);
        }
      } finally {
        if (!cancelled) setMapLoading(false);
      }
    }

    getMapData();

    return () => {
      cancelled = true; // cleanup: avoid setting state from a stale request
    };
  }, [searchCountry]);

const siteMapInitialViewState = useMemo(() => {
  const coordinates = resolveCoordinates(searchCountry, searchCountry);
  if (coordinates) {
    return { longitude: coordinates.longitude, latitude: coordinates.latitude, zoom: 4.5 };
  }
  return { longitude: 0, latitude: 20, zoom: 2 };
}, [searchCountry]);

  return (
    <div style={styles.blockContainer}>
      <div style={styles.infoWrapper}>

        {/* Top Control Settings Bar */}
        <div style={styles.tableActionBar}>
          <h3 style={styles.blockTitle}>Short-listed Sites</h3>
          
          <div style={styles.filterGroup}>
            {/* <div style={styles.fieldDropdown}> */}
            {/* <span style={styles.dropdownLabel}>All Cohorts1</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg> */}
            <span style={{ height: "32px", width: "177px", display: "flex" }}>
              <CohortFilter open={true} cohorts={cohorts} />
            </span>
            {/* </div> */}

            <Select
              value={searchCountry}
              onChange={(e) => setSearchCountry(e.target.value)}
              displayEmpty
              IconComponent={ExpandMoreIcon}

              renderValue={() =>
                // selectedCohort === '' ? (
                //   <span style={{ color: 'rgba(0,0,0,0.4)' }}>Select Cohorts</span>
                // ) : (
                  <span
                    // title={searchCountry} // native tooltip shows full name on hover when truncated
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {searchCountry == 'global' ? 'All Countries' : searchCountry}
                  </span>
                // )
              }

              MenuProps={{
                PaperProps: {
                  className: "app-scroll",
                  sx: {
                    maxHeight: 250,
                  },
                },
              }}

              sx={{
                height: 32,
                width: 140,
                fontSize: 14,
                borderRadius: "6px",
                color: "#00000066",
                fontFamily: "Rubik",
                fontWeight: 400,

                border: "1px solid rgba(0,0,0,0.15)",

                "&:hover": {
                  borderColor: "rgba(0,0,0,0.3)",
                },

                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },

                "& .MuiSelect-select": {
                  padding: "0 14px",
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                },
              }}
            >
              <MenuItem value="global">
                All Countries
              </MenuItem>

              {[...countriesList]
                .sort((a, b) => a.localeCompare(b))
                .map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
            </Select>

            <div style={styles.toggleSegment}>
              <div
                onClick={() => setActiveView('list')}
                style={{ ...styles.segmentButton, ...(activeView === 'list' ? styles.segmentActive : {}) }}
              >
                List View
              </div>
              <div
                onClick={() => setActiveView('map')}
                style={{ ...styles.segmentButton, ...(activeView === 'map' ? styles.segmentActive : {}) }}
              >
                Map View
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic View Swapper */}
        {activeView === 'list' ? (
          <>
            <div style={styles.tableWrapper} className='app-scroll'>
              <table style={styles.nativeTable}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={{ ...styles.thElement, width: '320px', textAlign: 'left' }}>Site Name</th>
                    <th style={{ ...styles.thElement, width: '130px', textAlign: 'left' }}>PI</th>
                    <th style={{ ...styles.thElement, width: '90px', textAlign: 'left' }}>Score</th>
                    <th style={{ ...styles.thElement, width: '130px', textAlign: 'left' }}>Patients/Month</th>
                    <th style={{ ...styles.thElement, width: '140px', textAlign: 'left' }}>Patients Allocated</th>
                    <th style={{ ...styles.thElement, width: '100px', textAlign: 'left' }}>Time to LPI</th>
                    <th style={{ ...styles.thElement, width: '130px', textAlign: 'left' }}>Location</th>
                    <th style={{ ...styles.thElement, width: '50px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody style={{ textAlign: "left" }}>
                  {paginatedData.map((row) => {
                    const scoreRatio = row.score / 100;
                    const strokeDashoffset = strokeDasharray * (1 - scoreRatio);

                    return (
                      <tr key={row.id} style={styles.tableBodyRow}>
                        <td style={{ ...styles.tdElement, color: '#2666BE', fontWeight: '500' }}>{row.name}</td>
                        <td style={{ ...styles.tdElement, color: 'rgba(0, 0, 0, 0.7)' }}>{row.pi}</td>

                        <td style={styles.tdElement}>
                          <div style={styles.scoreContainer}>
                            <svg width="16" height="16" viewBox="0 0 18 18" style={styles.circularSvgMetric}>
                              <circle cx="9" cy="9" r={radius} fill="none" stroke="#DAF1E4" strokeWidth="2.5" />
                              <circle cx="9" cy="9" r={radius} fill="none" stroke="#27AE60" strokeWidth="2.5"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round" />
                            </svg>
                            <span style={styles.scoreValueText}>{formatNumber(row.score)}</span>
                          </div>
                        </td>

                        <td style={styles.tdElement}>
                          <div style={styles.inputSpinnerContainer}>
                            <div style={styles.spinnerValBox}>{row.rate}</div>
                            <div style={styles.spinnerActionBox}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                              </svg>
                            </div>
                          </div>
                        </td>

                        <td style={styles.tdElement}>
                          <div style={styles.inputSpinnerContainer}>
                            <div style={styles.spinnerValBox}>{formatNumber(row.allocated)}</div>
                            <div style={styles.spinnerActionBox}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                              </svg>
                            </div>
                          </div>
                        </td>

                        <td style={{ ...styles.tdElement, color: 'rgba(0, 0, 0, 0.7)' }}>{row.timeToLPI}</td>
                        <td style={{ ...styles.tdElement, color: 'rgba(0, 0, 0, 0.7)' }}>{row.location}</td>

                        <td style={{ ...styles.tdElement, textAlign: 'center' }}>
                          <button style={styles.deleteActionBtn}>
                            <svg width="11" height="14" viewBox="0 0 11 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.64286 4.66667V12.4444H2.35714V4.66667H8.64286ZM7.46429 0H3.53571L2.75 0.777778H0V2.33333H11V0.777778H8.25L7.46429 0ZM10.2143 3.11111H0.785714V12.4444C0.785714 13.3 1.49286 14 2.35714 14H8.64286C9.50714 14 10.2143 13.3 10.2143 12.4444V3.11111Z" fill="#C14646" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={styles.paginationWrapper}>
              <button
                style={styles.pagerControlBtn}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={
                    currentPage === pageNum
                      ? styles.pagerActiveNum
                      : { ...styles.pagerInertNum, cursor: 'pointer' }
                  }
                >
                  {pageNum}
                </div>
              ))}

              <button
                style={styles.pagerControlBtn}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </>
        ) : (
          /* Map Canvas Container with proper template background binding */
          // <div style={styles.mapContainerOuter}>
          //   <div style={{ ...styles.mapCanvasBackground, backgroundImage: `url(${MapImage})` }}>

          //     {/* Dynamic Coordinate Points Layers */}
          //     {Object.keys(regionsData).map((key) => {
          //       const region = regionsData[key];
          //       return (
          //         <div
          //           key={key}
          //           onClick={() => setHoveredRegion(key)}
          //           style={{
          //             ...styles.mapBadgeMarker,
          //             top: region.position.top,
          //             left: region.position.left,
          //             zIndex: hoveredRegion === key ? 10 : 2
          //           }}
          //         >
          //           <div style={styles.markerIdBox}>{region.id}</div>
          //           <div style={styles.markerPointsBox}>
          //             <span style={styles.markerPointsText}>{region.score}</span>
          //             <span style={styles.markerUnitText}>/pts</span>
          //           </div>
          //         </div>
          //       );
          //     })}

          //     {/* Houston Detailed Regions Popover Summary Panel */}
          //     {hoveredRegion && regionsData[hoveredRegion]?.sites && (
          //       <div style={{
          //         ...styles.mapDetailsPopover,
          //         top: `calc(${regionsData[hoveredRegion].position.top} - 80px)`,
          //         left: `calc(${regionsData[hoveredRegion].position.left} + 110px)`
          //       }}>
          //         <div style={styles.popoverMainTitle}>{regionsData[hoveredRegion].title}</div>

          //         <div style={styles.popoverDataLine}>
          //           <span style={styles.popoverLabelText}>Patient (100 miles):</span>
          //           <span style={styles.popoverValText}>{regionsData[hoveredRegion].patientRadius}</span>
          //         </div>
          //         <div style={styles.popoverDataLine}>
          //           <span style={styles.popoverLabelText}>Total Sites:</span>
          //           <span style={styles.popoverValText}>{regionsData[hoveredRegion].totalSites}</span>
          //         </div>
          //         <div style={styles.popoverDataLine}>
          //           <span style={styles.popoverLabelText}>Enrollment target:</span>
          //           <span style={styles.popoverValText}>{regionsData[hoveredRegion].enrollmentTarget}</span>
          //         </div>

          //         <div style={styles.popoverDividerLine} />

          //         {regionsData[hoveredRegion].sites.map((site, index) => (
          //           <div key={index} style={styles.popoverSiteContainer}>
          //             <div style={styles.popoverSiteHeader}>
          //               <span style={site.name.includes('MD Anderson') ? styles.sitePrimaryNameHighlight : styles.sitePrimaryName}>{site.name}</span>
          //               <span style={styles.siteMetaLocation}>{site.location}</span>
          //             </div>
          //             <div style={styles.popoverSiteMetaRow}>
          //               <span style={styles.siteMetaPi}>{site.pi}</span>
          //               <span style={styles.siteMetricScore}>{site.score}</span>
          //             </div>
          //           </div>
          //         ))}

          //         <div style={styles.popoverDividerLine} />

          //         <div style={styles.popoverFooterLayout}>
          //           <span style={styles.popoverMoreText}>More sites</span>
          //           <div style={styles.popoverPagerGroup}>
          //             <span style={styles.popoverPagerIndicator}>1/7</span>
          //             <div style={styles.verticalMiniDivider} />
          //             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="3" style={{ cursor: 'pointer' }}>
          //               <polyline points="15 18 9 12 15 6"></polyline>
          //             </svg>
          //             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2666BE" strokeWidth="3" style={{ cursor: 'pointer' }}>
          //               <polyline points="9 18 15 12 9 6"></polyline>
          //             </svg>
          //           </div>
          //         </div>
          //       </div>
          //     )}
          //   </div>
          // </div>
            <div style={{ minHeight: "260px", width: "100%" }}>
            <div style={{ height: "calc(100vh - 290px)", minHeight: 460, width: "100%", position: "relative" }}>
              <MapView
                key={searchCountry}
                data={sitesMapPoints} //population colored data in the map
                loading={mapLoading}
                initialViewState={siteMapInitialViewState}
                cohortTotal={cohortSites} //population colored data in the map
                siteMarkers={siteMarkers}
                trialMarkers={trialMarkers}
                variant="sites"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  blockContainer: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '15px',
    gap: '10px',
    width: '100%',
    maxWidth: '1450px', // Standard responsive constraint matching original Figma viewport
    background: '#FFFFFF',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    boxShadow: '1px 8px 34px rgba(153, 169, 190, 0.1)',
    borderRadius: '8px',
    fontFamily: "'Rubik', sans-serif",
  },
  infoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '20px',
    width: '100%',
    alignSelf: 'stretch',
  },
  tableActionBar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'wrap',
    gap: '12px'
  },
  blockTitle: {
    margin: 0,
    fontWeight: '500',
    fontSize: '23px',
    lineHeight: '24px',
    color: 'rgba(0, 0, 0, 0.8)',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
  },
  fieldDropdown: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0px 12px',
    width: '114px',
    height: '32px',
    border: '1px solid #D9D9E0',
    borderRadius: '6px',
    cursor: 'pointer',
    justifyContent: 'space-between',
  },
  dropdownLabel: {
    fontSize: '12px',
    fontWeight: '400',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  fieldSearch: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0px 12px',
    width: '140px',
    height: '32px',
    border: '1px solid #D9D9E0',
    borderRadius: '6px',
    background: '#FFFFFF',
  },
  unstyledInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '12px',
    color: 'rgba(0, 0, 0, 0.8)',
    fontFamily: 'inherit',
    padding: 0,
  },
  toggleSegment: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0px',
    width: '171px',
    height: '32px',
    background: '#FFFFFF',
    border: '1.5px solid #B8D4F9',
    boxShadow: '1px 8px 34px rgba(153, 169, 190, 0.1)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  segmentButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    height: '100%',
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.7)',
    cursor: 'pointer',
    userSelect: 'none',
  },
  segmentActive: {
    background: '#2666BE',
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
    height: "380px"
  },
  nativeTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    height: '30px',
    borderBottom: '1px solid #E2E8F0',
  },
  thElement: {
    fontWeight: '500',
    fontSize: '14px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.8)',
    padding: '5px 0px',
  },
  tableBodyRow: {
    height: '48px',
    borderBottom: '1px solid #E2E8F0',
  },
  tdElement: {
    fontSize: '14px',
    lineHeight: '20px',
    padding: '12px 0px',
  },
  scoreContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6px',
  },
  circularSvgMetric: {
    transform: 'rotate(-90deg)',
  },
  scoreValueText: {
    fontWeight: '500',
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  inputSpinnerContainer: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '66px',
    height: '26px',
    background: '#F0F0F3',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  spinnerValBox: {
    flex: 1,
    textAlign: 'center',
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  spinnerActionBox: {
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '26px',
    height: '26px',
    background: '#FFFFFF',
    cursor: 'pointer',
    borderLeft: '1px solid rgba(0, 0, 0, 0.05)',
  },
  deleteActionBtn: {
    width: '24px',
    height: '24px',
    background: '#FDE2E2',
    borderRadius: '4px',
    border: 'none',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  paginationWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '8px',
    gap: '8px',
    width: '100%',
  },
  pagerControlBtn: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0px 12px',
    gap: '4px',
    height: '32px',
    background: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.8)',
    cursor: 'pointer',
  },
  pagerActiveNum: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '32px',
    height: '32px',
    background: '#2666BE',
    color: '#FFFFFF',
    borderRadius: '4px',
    fontSize: '14px',
  },
  pagerInertNum: {
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '32px',
    height: '32px',
    background: '#FFFFFF',
    border: '1px solid #F1F1F1',
    color: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  pagerEllipsis: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '32px',
    height: '32px',
    color: 'rgba(0, 0, 0, 0.4)',
    fontSize: '14px',
  },
  disabledState: {
    pointerEvents: 'none',
    opacity: 0.5,
  },

  /* Map Canvas Workspace Configurations */
  mapContainerOuter: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  mapCanvasBackground: {
    width: '100%',
    height: '806px',
    position: 'relative',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#DDDDDD',
  },
  mapBadgeMarker: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: '36px',
    filter: 'drop-shadow(0px 4px 10px rgba(130, 143, 169, 0.15))',
    cursor: 'pointer'
  },
  markerIdBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '6px 12px',
    width: '36px',
    height: '36px',
    boxSizing: 'border-box',
    background: '#913535',
    borderRadius: '4px',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '600',
    fontSize: '16px'
  },
  markerPointsBox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: '4px 8px',
    height: '28px',
    background: '#FFFFFF',
    borderRadius: '0px 4px 4px 0px',
    boxSizing: 'border-box'
  },
  markerPointsText: {
    fontWeight: '600',
    fontSize: '16px',
    color: 'rgba(0, 0, 0, 0.8)',
    lineHeight: '21px'
  },
  markerUnitText: {
    fontWeight: '400',
    fontSize: '13px',
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: '16px',
    marginLeft: '2px'
  },
  mapDetailsPopover: {
    position: 'absolute',
    width: '280px',
    backgroundColor: '#FFFFFF',
    boxShadow: '2px 4px 20px rgba(132, 151, 177, 0.21)',
    borderRadius: '4px',
    padding: '12px',
    boxSizing: 'border-box',
    zIndex: '20',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  popoverMainTitle: {
    fontWeight: '500',
    fontSize: '16px',
    color: '#000000',
  },
  popoverDataLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  popoverLabelText: {
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.6)'
  },
  popoverValText: {
    fontWeight: '500',
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.8)'
  },
  popoverDividerLine: {
    width: '100%',
    height: '1px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  popoverSiteContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  popoverSiteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sitePrimaryName: {
    fontWeight: '500',
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.8)'
  },
  sitePrimaryNameHighlight: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#2666BE'
  },
  siteMetaLocation: {
    fontSize: '12px',
    color: 'rgba(0, 0, 0, 0.6)'
  },
  popoverSiteMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  siteMetaPi: {
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.6)'
  },
  siteMetricScore: {
    fontWeight: '500',
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.8)'
  },
  popoverFooterLayout: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popoverMoreText: {
    fontSize: '12px',
    color: 'rgba(0, 0, 0, 0.6)'
  },
  popoverPagerGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  popoverPagerIndicator: {
    fontSize: '12px',
    color: 'rgba(0, 0, 0, 0.6)'
  },
  verticalMiniDivider: {
    width: '1px',
    height: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)'
  }
};
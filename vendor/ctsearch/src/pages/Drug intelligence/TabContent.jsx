import React, { useState } from 'react';
import CountryFlag from '../../common/GetFlags';
import movingIcon from '../../assets/icons/moving.svg'
import arrowUpIcon from '../../assets/icons/arrow-up.svg'
import SearchIcon from '../../assets/icons/search_icon.svg'
import { ChevronDown } from "lucide-react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Stack,
  
} from "@mui/material";

const TabContent = ({ activeTab, data, formatNumber, formatMonth }) => {
    const [subTab, setSubTab] = useState('Trial Results');
    const countries = [
  { id: 1, name: "FDA", country: "United States" },
  { id: 2, name: "EMA", country: "China" },
  { id: 3, name: "MHRA", country: "United Kingdom" },
];
const [selected, setSelected] = useState(countries[0].id);
const [showSecondary, setShowSecondary] = useState(true);

    switch (activeTab) {
        case 'Trials':
            return (
                <div className="drug-table-wrapper">
                    <table className="drug-data-table">
                        <thead>
                            <tr>
                                <th>OncoSuite ID and Trial Name</th>
                                <th>Phase</th>
                                <th>Status</th>
                                <th>Indication</th>
                                <th>N</th>
                                <th>Completion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.trials.map((row, i) => (
                                <tr key={i}>
                                    <td>
                                        <span className="drug-id-sub">{row.id}</span><br />
                                        <span className="drug-title-main">{row.title}</span>
                                    </td>
                                    <td>{row.phase}</td>
                                    <td className={row.statusClass}>{row.status}</td>
                                    <td>{row.indication}</td>
                                    <td>{formatNumber(row.n)}</td>
                                    <td className="drug-completion-date">{formatMonth(row.completion)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case 'Results':
            const isTrial = subTab === 'Trial Results';

            // Directly access data based on your specific JSON structure
            // This will work for both trial and realWorld as they share the same keys
            const currentResults = isTrial ? data.results.trial : data.results.realWorld;

            // Safety check to ensure we have an object to read from
            const content = {
                primary: currentResults?.primary || [],
                secondary: currentResults?.secondary || []
            };

            return (
                <div className="drug-results-tab">
                    <div className="drug-sub-tabs">
                        <button
                            className={isTrial ? 'drug-active' : ''}
                            onClick={() => setSubTab('Trial Results')}
                        >
                            Trial Results
                        </button>
                        <button
                            className={!isTrial ? 'drug-active' : ''}
                            onClick={() => setSubTab('Real-World Results')}
                        >
                            Real-World Results
                        </button>
                    </div>

                    <div className="drug-table-wrapper drug-mt-4">
                        <table className="drug-data-table">
                            <thead>
                                <tr>
                                    <th>Endpoint</th>
                                    <th>ARM</th>
                                    <th>Value</th>
                                    {isTrial && <><th>Comparator</th><th>P-value</th></>}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Primary Endpoints Section */}
                                <tr className="drug-section-header">
                                    <td colSpan={isTrial ? 5 : 3} style={{ fontWeight: 'bold', padding: '10px 10px' }}>Primary endpoints</td>
                                </tr>
                                {content.primary.map((row, i) => (
                                    <tr key={`p-${i}`}>
                                        <td>{row.endpoint}</td>
                                        <td>{row.arm}</td>
                                        <td>{row.value}</td>
                                        {isTrial && <td>{row.comparator || '-'}</td>}
                                        {isTrial && <td>{row.pValue || '-'}</td>}
                                    </tr>
                                ))}

                                {/* Secondary Endpoints Section */}
                                <tr className="drug-section-header">
                                      <td
                                            colSpan={isTrial ? 5 : 3}
                                            style={{
                                            fontWeight: "bold",
                                            padding: "10px",
                                            cursor: "pointer",
                                            }}
                                            onClick={() => setShowSecondary(!showSecondary)}
                                        >
                                        <span style={{display: 'flex', gap: '8px'}}>    
                                        12 Secondary endpoints 
                                            <img src={arrowUpIcon} alt=""
                                                style={{
                                                    transform: showSecondary ? "rotate(0deg)" : "rotate(180deg)",
                                                    transition: "transform 0.2s ease",
                                                }}
                                            />
                                        </span>
                                    </td>
                                </tr>
                                { showSecondary && content.secondary.map((row, i) => (
                                    <tr key={`s-${i}`}>
                                        <td>{row.endpoint}</td>
                                        <td>{row.arm}</td>
                                        <td>{row.value}</td>
                                        {isTrial && <td>{row.comparator || '-'}</td>}
                                        {isTrial && <td>{row.pValue || '-'}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Section */}
                    <div className="drug-footer-note" style={{ border: '1px solid #ddd', padding: '10px', marginTop: '10px' }}>
                        <span style={{display: 'flex', gap: '12px'}}>
                        <img src={movingIcon} alt="" /> mOS gap of <b>3.6 months</b> (22.0 → 18.4) suggests real-world population differences. Open side-by-side comparison →
                        </span>
                    </div>
                </div>
            );

        case 'Patents Data':
            return (
                <div className="patent-table-wrapper">
                    <table className="patent-data-table">
                        <thead>
                            <tr>
                                <th>Country</th>
                                <th>Patent No.</th>
                                <th>Granted</th>
                                <th>Expiry</th>
                                <th>Status</th>
                                <th>Years Left</th>
                                <th>Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.patents.map((row, i) => (
                                <tr key={i}>
                                    <td className="country-cell">
                                        <CountryFlag width={25} height={15} country={row.country} />
                                        <span>{row.country} ( {row.code} )</span>
                                    </td>
                                    <td>{row.no}</td>
                                    <td>{row.granted}</td>
                                    <td>{row.expiry}</td>
                                    <td className={row.status === 'Active' ? 'patent-text-green' : 'patent-text-red'}>
                                        {console.log(row.status === 'Active' ? 'patent-text-green' : 'patent-text-red')}
                                        {row.status}
                                    </td>
                                    <td>{row.yearsLeft}</td>
                                    <td>
                                            <div className="tooltip-container">
                                                <span className='info-icon-circle'>i</span>
                                                <div className="tooltip-text">
                                                    EPO Escapement – Patent US{row.no}
                                                </div>
                                            </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case 'Approved Indications':
            // Helper to get badge class
            const getBadgeClass = (status) => {
                if (status === 'Approved') return 'badge-approved';
                if (status === 'Expanded') return 'badge-expanded';
                return 'badge-withdrawn';
            };

            return (
                <div className="approval-container">
                    {/* Header with Title and Dropdown */}
                    <div className="approval-header">
                        <h2 className="approval-title">Approval Timeline</h2>
                        {/* <div className="fda-dropdown">FDA 
                            <span style={{ marginTop: '6px', marginLeft: "5px", marginRight: '15px' }}>
                                <CountryFlag width={15} height={10} country={"United States"} />
                            </span>
                        ▾
                        </div> */}
                        <Select
                            value={selected}
                            onChange={(e) => setSelected(e.target.value)}
                            size="small"
                            sx={{
                                width: '140px',
                                height: '32px',
                                borderRadius: "6px",
                                border: '1px solid #D9D9E0',
                                '&:hover': {
                                    borderColor: 'rgba(0, 0, 0, 0.3)',
                                },
                                '&.Mui-focused': {
                                    borderColor: 'rgba(0, 0, 0, 0.4)',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                },
                                '& .MuiSelect-select': {
                                    padding: '0 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    minWidth: 0, // lets the truncatable <span> above actually shrink instead of overflowing
                                    overflow: 'hidden',
                                },
                            }}
                        >
                            {countries.map((item) => (
                                <MenuItem key={item.id} value={item.id}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <span>{item.name}</span>
                                        <CountryFlag width={18} height={12} country={item.country} />
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </div>

                    {/* Timeline Content */}
                    {data.indications.map((ind, i) => (
                        <div key={i} className="timeline-row">
                            <div className="timeline-line">
                                <div className="dot" style={{ backgroundColor: ind.dotColor }}></div>
                            </div>
                            <div className="timeline-content">
                                <div className="timeline-title">{ind.type}</div>
                                <div className="timeline-meta">
                                    <span>{ind.specs}</span>
                                    <span className={`status-tag ${ind.statusClass}`}>
                                        {ind.status}
                                    </span>
                                    <span>{ind.date}</span>

                                    {/* Hoverable Info Icon */}
                                    <div className="tooltip-container">
                                        <span className="info-icon-circle">i</span>
                                        <div className="tooltip-text">EPO Escapement – Patent US952</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );

        case 'Pricing':
            return (
                <div className="pricing-container">
                    {/* Controls */}
                    <div className="pricing-controls" style={{ marginBottom: '20px' }}>
                        <div className="search-box" style={{marginRight: "0"}}>
                            <img src={SearchIcon} alt="" className="search-icon" />
                            <input
                                type="text"
                                placeholder="Country / Region...."
                                // onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        {/* <img src={SearchIcon} alt="" className="search-icon" />
                        <input type="text" placeholder="Country / Region...." className="pricing-search" /> */}
                        <select className="pricing-year-filter"><option>Year 2025</option></select>
                    </div>

                    {/* Price Summary Row */}
                    <div className="pricing-summary">
                        <div className="summary-card">
                            <span className="summary-label">Jan 2025</span>
                            <span className="summary-value">$10,941</span>
                        </div>
                        <div className="pricing-separator"></div>
                        <div className="summary-card">
                            <span className="summary-label">Dec 2025</span>
                            <span className="summary-value">
                                $12,144 <span className="mom-positive">(+11.0%)</span>
                            </span>
                        </div>
                    </div>

                    {/* Price History Title */}
                    <h3 className="price-history-title">Price history</h3>

                    {/* Table */}
                    <span style={{border: '1px solid #0000000D', borderRadius: '4px', padding: '15px', gap: '10px'}}>
                    <div className="price-header">
                        <div className="col-month">Month</div>
                        <div className="col-wac">List / WAC</div>
                        <div className="col-net">Est. Net</div>
                        <div className="col-mom">MoM</div>
                        <div className="col-source">Source</div>
                    </div>
                    {data.pricing.map((row, i) => (
                        <div key={i} className="price-row">
                            <div className="col-month">{formatMonth(row.month)}</div>
                            <div className="col-wac">${formatNumber(row.wac)}</div>
                            <div className="col-net">${formatNumber(row.net)}</div>
                            <div className={`col-mom ${row.momClass}`}>{row.mom}</div>
                            <div className="col-source">
                                <div className="tooltip-container">
                                    <span className="info-icon-circle">i</span>
                                    <div className="tooltip-text">Medi-Span / RED BOOK (WAC)</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </span>
                </div>
            ); default:
            return null;
    }
};

export default TabContent;
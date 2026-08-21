import React, { useState } from 'react';
import './drugIntelligenceCss.css';
import TabContent from './TabContent';
import Sidebar from '../../layout/sidebar/Sidebar';
import TrialsFilterDrug from './TrialFilterDrug';
import { Box } from '@mui/material';
import { Menu, MenuItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import CheckIcon from '@mui/icons-material/Check';
import ChartIcon from "../../assets/icons/ChartIcon.svg";
import check_circle_icon from "../../assets/icons/check_circle.svg";
import LanguageIcon from "../../assets/icons/language.svg";
import SearchIcon from '../../assets/icons/search_icon.svg';
import { headerStyles } from "../trialsHeader/trialsSubHeader/style";

// Formats a numeric metric with thousands separators; returns "-" for 0/NaN.
const formatNumber = (value) => {
    const num = Number(value);
    if (isNaN(num) || num === 0) return '-';
    return num.toLocaleString('en-US');
};

const formatMonth = (dateString) => {
    if (!dateString) return "-";
    const parts = dateString.split(" ");
    if (parts.length >= 2 && parts[0].length >= 3) {
        return `${parts[0].substring(0, 3)} ${parts[1]}`;
    }
    return dateString;
};

const drugList = [
    { id: 1, name: "Pembrolizumab", subtitle: "Keytruda • Anti-PD-1", trials: 1240, approved: 38, patents: 64, active: true },
    { id: 2, name: "Ivonescimab", subtitle: "AK112 • Summit Therapeutics", trials: 38, approved: 38, patents: 64, active: false },
    { id: 3, name: "Sotorasib", subtitle: "Lumakras • Amgen", trials: 64, approved: 38, patents: 64, active: false },
    { id: 4, name: "Adagrasib", subtitle: "Adagrasib • Mirati / BMS", trials: 38, approved: 38, patents: 64, active: false },
    { id: 5, name: "Gemcitabine", subtitle: "Gemzar • Eli Lilly", trials: 64, approved: 38, patents: 64, active: false },
    { id: 6, name: "Datopotamab Deruxtecan", subtitle: "Dato-DXd • Daiichi Sankyo / AZ", trials: 38, approved: 38, patents: 64, active: false }
];

const pembrolizumabData = {
    header: {
        title: "Pembrolizumab",
        brand: "Keytruda",
        summary: [
            { label: "MOA", value: "Anti-PD-1" },
            { label: "Backbone", value: "Monoclonal Antibody" },
            { label: "Drug Class", value: "Checkpoint Inhibitor" },
            { label: "Sponsor", value: "Merck & Co." },
            { label: "Pipeline Status", value: "Approved", colorClass: "drug-text-green" },
            { label: "Target Indications", value: "NSCLC", badge: "+3" }
        ],
        metrics: [
            { label: "Trials", value: 1240, subtext: "sponsor-led" },
            { label: "Approved Indications", value: 38, subtext: "across regulators" },
            { label: "Patent Countries", value: 64, subtext: "active patents" }
        ]
    },
    tabs: ["Trials", "Results", "Patents Data", "Approved Indications", "Pricing"],
    trials: [
        { id: "03875092", title: "Pembrolizumab in KRAS G12C-Mutated Non-Small Cell Lung Cancer", phase: "Phase III", status: "Completed", indication: "NSCLC EGFR+", n: 492, completion: "Mar 2024", statusClass: "completed" },
        { id: "03875093", title: "Nivolumab plus Ipilimumab for Melanoma", phase: "Phase II", status: "Recruiting", indication: "NSCLC Non-Squamous", n: 492, completion: "Mar 2024", statusClass: "recruiting" },
        { id: "03875094", title: "Atezolizumab in Triple-Negative Breast Cancer", phase: "Phase III", status: "Not Yet Recruiting", indication: "Ovarian", n: 492, completion: "Mar 2024", statusClass: "pending" },
        { id: "03875095", title: "Durvalumab for NSCLC", phase: "Phase I", status: "Suspended", indication: "Cervical", n: 492, completion: "Mar 2024", statusClass: "suspended" },
        { id: "03875096", title: "Trastuzumab in HER2-Positive Breast Cancer", phase: "Phase III", status: "Terminated", indication: "NSCLC EGFR+", n: 492, completion: "Mar 2024", statusClass: "terminated" },
        { id: "03875097", title: "Rituximab in Non-Hodgkin Lymphoma", phase: "Phase III", status: "Not Yet Recruiting", indication: "NSCLC EGFR+", n: 492, completion: "Mar 2024", statusClass: "pending" },
        { id: "03875098", title: "Olaparib in BRCA-Mutated Ovarian Cancer", phase: "Phase III", status: "Completed", indication: "NSCLC Non-Squamous", n: 492, completion: "Mar 2024", statusClass: "completed" },
        { id: "03875099", title: "Vemurafenib in BRAF-Mutated Melanoma", phase: "Phase III", status: "Available", indication: "NSCLC EGFR+", n: 492, completion: "Mar 2024", statusClass: "available" },
        { id: "03875100", title: "Vemurafenib in BRAF-Mutated Melanoma", phase: "Phase III", status: "Completed", indication: "Cervical", n: 492, completion: "Mar 2024", statusClass: "completed" },
    ],
    results: {
        trial: {
            primary: [
                { endpoint: "PFS", arm: "Pembro + Chemo", value: "22.0 mo", comparator: "10.7 mo", pValue: "<0.001" },
                { endpoint: "OS", arm: "Pembro + Chemo", value: "9.0 mo", comparator: "4.9 mo", pValue: "<0.001" }
            ],
            secondary: [
                { endpoint: "ORR", arm: "Pembro + Chemo", value: "47.6%", comparator: "18.9%", pValue: "-" },
                { endpoint: "Grade ≥3 TRAEs", arm: "Pembro + Chemo", value: "67.2%", comparator: "65.8%", pValue: "-" }
            ]
        },
        realWorld: {
            primary: [
                { endpoint: "PFS", arm: "Pembro + Chemo", value: "18.4 mo" },
                { endpoint: "OS", arm: "Pembro + Chemo", value: "7.1 mo" }
            ],
            secondary: [
                { endpoint: "RW Discontinuation (irAE)", arm: "Pembro + Chemo", value: "14.8%" },
                { endpoint: "Time on Treatment (median)", arm: "Pembro mono", value: "5.6 mo" }
            ]
        }
    },
    patents: [
        { country: "United States", code: "US", flag: "🇺🇸", no: "952", granted: "10 Feb 2015", expiry: "29 Mar 2028", status: "Active", yearsLeft: "2y" },
        { country: "United Kingdom", code: "UK", flag: "🇬🇧", no: "959", granted: "10 Feb 2015", expiry: "29 Mar 2028", status: "Active", yearsLeft: "2y" },
        { country: "Germany", code: "DE", flag: "🇩🇪", no: "2008", granted: "10 Feb 2015", expiry: "29 Mar 2028", status: "Inactive", yearsLeft: "-" },
        { country: "France", code: "FR", flag: "🇫🇷", no: "762", granted: "10 Feb 2015", expiry: "29 Mar 2028", status: "Active", yearsLeft: "2y" },
        { country: "Italy", code: "IT", flag: "🇮🇹", no: "740", granted: "10 Feb 2015", expiry: "29 Mar 2028", status: "Inactive", yearsLeft: "-" },
        { country: "Spain", code: "ES", flag: "🇪🇸", no: "522", granted: "10 Feb 2015", expiry: "29 Mar 2028", status: "Active", yearsLeft: "2y" },
        { country: "Canada", code: "CA", flag: "🇨🇦", no: "691", granted: "10 Feb 2015", expiry: "29 Mar 2028", status: "Active", yearsLeft: "2y" }
    ],
    indications: [
        { type: "Skin · Melanoma", specs: "≥2L • Biomarker: - • Unresectable / Metastatic Stage", date: "04 Sep 2014", status: "Approved", statusClass: "tag-approved", dotColor: "#27AE60" },
        { type: "Lung · NSCLC", specs: "1L • PD-L1 ≥50% • Metastatic Stage", date: "02 Oct 2015", status: "Expanded", statusClass: "tag-expanded", dotColor: "#2666BE" },
        { type: "Pan-tumor · MSI-H / dMMR", specs: "≥2L • MSI-H • Advanced Stage", date: "10 May 2017", status: "Expanded", statusClass: "tag-expanded", dotColor: "#2666BE" },
        { type: "Kidney · RCC", specs: "1L • HER2+ • Advanced Stage", date: "13 Mar 2019", status: "Expanded", statusClass: "tag-expanded", dotColor: "#2666BE" },
        { type: "Skin · Melanoma", specs: "1L • PD-L1 CPS<10 • Metastatic Stage", date: "13 Nov 2020", status: "Withdrawn", statusClass: "tag-withdrawn", dotColor: "#F96969" },
        { type: "Cervix · Cervical", specs: "1L • PD-L1+ • FIGO III-IVA Stage", date: "13 Mar 2019", status: "Withdrawn", statusClass: "tag-withdrawn", dotColor: "#F96969" }
    ],
    pricing: [
        { month: "Dec 2025", wac: 12144, net: 8582, mom: "+1.38%", momClass: "drug-text-red" },
        { month: "Nov 2025", wac: 12069, net: 8465, mom: "+0.10%", momClass: "drug-text-red" },
        { month: "Oct 2025", wac: 11911, net: 8457, mom: "-0.51%", momClass: "drug-text-green" },
        { month: "Sep 2025", wac: 11972, net: 8500, mom: "+0.94%", momClass: "drug-text-red" },
        { month: "Aug 2025", wac: 11861, net: 8421, mom: "+1.17%", momClass: "drug-text-red" },
        { month: "Jul 2025", wac: 11724, net: 8324, mom: "-0.33%", momClass: "drug-text-green" },
        { month: "Jun 2025", wac: 11763, net: 8352, mom: "-0.18%", momClass: "drug-text-green" },
        { month: "May 2025", wac: 11784, net: 8367, mom: "+1.27%", momClass: "drug-text-red" },
        { month: "Apr 2025", wac: 11636, net: 8262, mom: "+0.76%", momClass: "drug-text-red" },
        { month: "Mar 2025", wac: 11548, net: 8199, mom: "-0.57%", momClass: "drug-text-green" },
        { month: "Feb 2025", wac: 11614, net: 8246, mom: "+0.28%", momClass: "drug-text-red" },
        { month: "Jan 2025", wac: 11581, net: 8223, mom: "-", momClass: "" },
    ]
};

const MainDrugIntelligencePage = () => {
    const classes = headerStyles();

    // Top-level nav (Find / Analyze)
    const [activeTab, setActiveTab] = useState('Find');

    // Drug detail sub-tabs (Trials / Results / Patents Data / ...).
    // Kept in its own state so switching it no longer clobbers `activeTab`
    // and hides the whole "Find" panel.
    const [activeDetailTab, setActiveDetailTab] = useState('Trials');

    const [sortAnchorEl, setSortAnchorEl] = useState(null);
    const [sortOption, setSortOption] = useState('Best Match');

    const [search, setSearch] = useState("");
    const [phase, setPhase] = useState("All");
    const [status, setStatus] = useState("All");
    const [sortBy, setSortBy] = useState("Relevance");

    const handleSortClick = (event) => {
        setSortAnchorEl(event.currentTarget);
    };

    const handleSortClose = (option) => {
        if (typeof option === 'string') {
            setSortOption(option);
        }
        setSortAnchorEl(null);
    };

    const getMetricIcon = (label) => {
        if (label.includes('Trials')) return ChartIcon;
        if (label.includes('Approved Indications')) return check_circle_icon;
        if (label.includes('Patent Countries')) return LanguageIcon;
        return ChartIcon;
    };

    return (
        <div className="app-container">
            {/* Sidebar (same pattern as SiteIntelligenceDetails) */}
            {/* <Sidebar activeTab="DRUG INTELLIGENCE" /> */}

            {/* Main content area sits next to the sidebar */}
            <main className="content-area">
                <Box
                    sx={{
                        background: "rgba(255, 255, 255, 1)",
                        display: "flex",
                        gap: "24px",
                        alignItems: "center",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                        flexWrap: "wrap",
                    }}
                >
                    <TrialsFilterDrug />
                </Box>

                <div
                    style={{
                        background: "rgba(255, 255, 255, 1)",
                        // Avoid content sitting underneath the fixed header (initial render fallback).
                        // paddingTop: "var(--trials-search-header-height, 0px)",
                    }}
                >
                        <div style={{ background: "#DCE9FC" }} className="w-full z-20">
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
                                    {["Find", "Analyze"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
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
                                            overflowX: "auto",
                                            whiteSpace: "nowrap",
                                            scrollbarWidth: "none",
                                            msOverflowStyle: "none",
                                            padding: "4px 0",
                                        }}
                                        className="hide-scrollbar"
                                    >
                                        <style>{`
                                                .hide-scrollbar::-webkit-scrollbar {
                                                display: none;
                                                }
                                            `}</style>
                                    </div>
                                )}
                            </div>
                        </div>

                    {activeTab === 'Find' && (

                        
                        <div className="content-area-body">
                            {/* Left Sidebar - Drug List */}
                                        <aside className="drug-sidebar">
                                            <div className="drug-sidebar-header">
                                                <h3><strong>81</strong> Drugs</h3>

                                                <IconButton
                                                    onClick={handleSortClick}
                                                    size="small"
                                                    className="drug-sort-btn"
                                                    disableRipple
                                                >
                                                    <SortIcon />
                                                </IconButton>

                                                <Menu
                                                    anchorEl={sortAnchorEl}
                                                    open={Boolean(sortAnchorEl)}
                                                    onClose={() => handleSortClose()}
                                                    classes={{ paper: 'drug-sort-menu' }}
                                                    elevation={2}
                                                    anchorOrigin={{
                                                        vertical: 'bottom',
                                                        horizontal: 'right',
                                                    }}
                                                    transformOrigin={{
                                                        vertical: 'top',
                                                        horizontal: 'right',
                                                    }}
                                                >
                                                    {['Best Match', 'Newest', 'Last Updated'].map((opt) => (
                                                        <MenuItem
                                                            key={opt}
                                                            onClick={() => handleSortClose(opt)}
                                                            className={sortOption === opt ? 'drug-sort-menu-item active-sort' : 'drug-sort-menu-item'}
                                                        >
                                                            <ListItemIcon className="drug-sort-menu-icon">
                                                                {sortOption === opt && <CheckIcon fontSize="small" />}
                                                            </ListItemIcon>
                                                            <ListItemText>{opt}</ListItemText>
                                                        </MenuItem>
                                                    ))}
                                                </Menu>
                                            </div>

                                            <div className="drug-list app-scroll">
                                                {drugList.map((drug) => (
                                                    <div key={drug.id} className={`drug-card ${drug.active ? 'drug-active' : ''}`}>
                                                        <h4>{drug.name}</h4>
                                                        <p>{drug.subtitle}</p>
                                                        <div className="drug-metrics">
                                                            <span className="metric-item">
                                                                <img src={ChartIcon} alt="" className='metric-img' />
                                                                {formatNumber(drug.trials)}
                                                            </span>
                                                            <span className="metric-item">
                                                                <img src={check_circle_icon} alt="" className='metric-img' />
                                                                {formatNumber(drug.approved)}
                                                            </span>
                                                            <span className="metric-item">
                                                                <img src={LanguageIcon} alt="" className='metric-img' />
                                                                {formatNumber(drug.patents)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </aside>

                                        {/* Right Panel - Detail View */}
                                        <section className="drug-detail-panel">
                                            <div className="drug-detail-header">
                                                {/* Title and Badge */}
                                                <div className="drug-title-row">
                                                    <h2>{pembrolizumabData.header.title}</h2>
                                                    <span className="drug-subtitle-badge">Keytruda</span>
                                                </div>

                                                {/* Summary Grid */}
                                                <div className="drug-summary-grid">
                                                    {pembrolizumabData.header.summary.map((item, index) => {
                                                        // Adds the vertical separator line to columns 2 and 3
                                                        const needsBorder = index % 3 !== 0;

                                                        return (
                                                            <div key={index} className={`drug-summary-item ${needsBorder ? 'with-divider' : ''}`}>
                                                                <span className="drug-summary-label">{item.label}</span>
                                                                <div className="drug-summary-value-wrapper">
                                                                    <span className={`drug-summary-value ${item.colorClass || ''}`}>
                                                                        {item.value || "-"}
                                                                    </span>
                                                                    {item.badge && <span className="drug-inline-badge">{item.badge}</span>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Metrics Cards */}
                                                <div className="drug-metrics-row">
                                                    {pembrolizumabData.header.metrics.map((metric, i) => (
                                                        <div key={i} className="drug-metric-card">
                                                            <div className="drug-metric-icon-wrapper">
                                                                <img src={getMetricIcon(metric.label)} alt="" />
                                                            </div>
                                                            <div className="drug-metric-content">
                                                                <span className="drug-metric-title">{metric.label}</span>
                                                                <div className="drug-metric-data">
                                                                    <strong>{formatNumber(metric.value)}</strong>
                                                                    {metric.subtext && <span className="drug-metric-subtext">{metric.subtext}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Navigation Tabs */}
                                            <div className="drug-detail-tabs">
                                                {pembrolizumabData.tabs.map((tab) => (
                                                    <button
                                                        key={tab}
                                                        className={`drug-tab-button ${activeDetailTab === tab ? 'drug-active' : ''}`}
                                                        onClick={() => setActiveDetailTab(tab)}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Dynamic Tab Content */}
                                            <div className="drug-tab-content-container">
                                                {activeDetailTab === 'Trials' ? (
                                                    <>
                                                        <div className="trial-filters">
                                                            <div className="search-box">
                                                                <img src={SearchIcon} alt="" className="search-icon" />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search..."
                                                                    value={search}
                                                                    onChange={(e) => setSearch(e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="filter-item">
                                                                <label>Phase:</label>
                                                                <select value={phase} onChange={(e) => setPhase(e.target.value)}>
                                                                    <option>All</option>
                                                                    <option>Phase I</option>
                                                                    <option>Phase II</option>
                                                                    <option>Phase III</option>
                                                                    <option>Phase IV</option>
                                                                </select>
                                                            </div>

                                                            <div className="filter-item">
                                                                <label>Status:</label>
                                                                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                                                    <option>All</option>
                                                                    <option>Completed</option>
                                                                    <option>Recruiting</option>
                                                                    <option>Not Yet Recruiting</option>
                                                                    <option>Suspended</option>
                                                                    <option>Terminated</option>
                                                                    <option>Available</option>
                                                                </select>
                                                            </div>

                                                            <div className="filter-item">
                                                                <label>Sort by:</label>
                                                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                                                    <option>Relevance</option>
                                                                    <option>Newest</option>
                                                                    <option>Oldest</option>
                                                                    <option>Completion Date</option>
                                                                    <option>Phase</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="drug-table-wrapper">
                                                            <table className="drug-data-table">
                                                                <thead style={{ boxShadow: '1px 8px 34px 0px #99A9BE1A' }}>
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
                                                                    {pembrolizumabData.trials
                                                                        .filter((trial) => {
                                                                            const matchesSearch = search
                                                                                ? trial.title.toLowerCase().includes(search.toLowerCase())
                                                                                : true;
                                                                            const matchesPhase = phase === "All" ? true : trial.phase === phase;
                                                                            const matchesStatus = status === "All" ? true : trial.status === status;
                                                                            return matchesSearch && matchesPhase && matchesStatus;
                                                                        })
                                                                        .map((trial) => (
                                                                            <tr key={trial.id}>
                                                                                <td>
                                                                                    <span className="drug-id-sub">{trial.id}</span><br />
                                                                                    <span className="drug-title-main" title={trial.title}>{trial.title}</span>
                                                                                </td>
                                                                                <td>{trial.phase || "-"}</td>
                                                                                <td className={'drug-status-' + trial.statusClass.toLowerCase()}>{trial.status || "-"}</td>
                                                                                <td>{trial.indication || "-"}</td>
                                                                                <td>{formatNumber(trial.n)}</td>
                                                                                <td className="drug-completion-date">{formatMonth(trial.completion)}</td>
                                                                            </tr>
                                                                        ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <TabContent
                                                        activeTab={activeDetailTab}
                                                        data={pembrolizumabData}
                                                        formatNumber={formatNumber}
                                                        formatMonth={formatMonth}
                                                    />
                                                )}
                                            </div>
                                        </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MainDrugIntelligencePage;
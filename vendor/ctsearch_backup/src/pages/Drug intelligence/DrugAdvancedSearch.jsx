import React, { useState, useRef } from 'react';
import {
    Box,
    TextField,
    Popper,
    Paper,
    ClickAwayListener,
    Checkbox,
    Typography,
    InputAdornment,
} from '@mui/material';
// import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import SearchIcon from '../../assets/icons/search_icon.svg'

/*
  DrugAdvancedSearch
  -------------------
  Plain search input (styled to match the reference pill) that opens a
  Popper-anchored filter panel on chevron click: left tab rail
  (Drug / Target Population / Approved Indication / Patent Data) +
  right-side checklist / field panel for whichever tab is active.

  This is a static, locally-controlled version — no async option fetching,
  no saved searches, no loading state — since we don't have that backend
  wiring yet. Swap FILTER_SECTIONS' option arrays for real data later.

  Usage:
    <DrugAdvancedSearch onApply={(filters) => console.log(filters)} />
*/

const FILTER_SECTIONS = [
    {
        title: 'Drug Profile',
        filters: [
            { key: 'drugName', label: 'Drug Name', type: 'checklist', options: ['Pembrolizumab', 'Ivonescimab', 'Sotorasib', 'Adagrasib', 'Gemcitabine', 'Datopotamab Deruxtecan'] },
            { key: 'moa', label: 'MOA', type: 'checklist', options: ['ATP-competitive inhibition', 'Non-ATP-binding modulation', 'Covalent target engagement', 'Ubiquitin-mediated degradation', 'Induced proximity inhibition', 'Chromatin remodeling'] },
            { key: 'backbone', label: 'Backbone', type: 'checklist', options: ['CE', 'Chemo', 'Targeted therapy', 'Cell therapy', 'Gene therapy'] },
            { key: 'drugClass', label: 'Class', type: 'checklist', options: ['Kinase Inhibitor', 'Biologic', 'Covalent Inhibitor', 'Protein Degrader', 'Epigenetic Modifier'] },
            { key: 'status', label: 'Status', type: 'checklist', options: ['Approved', 'Phase I', 'Phase II', 'Phase III', 'Phase IV'] },
            { key: 'sponsor', label: 'Sponsor', type: 'text', placeholder: 'Search sponsor name…' },
        ],
    },
    {
        title: 'Target Population',
        filters: [
            { key: 'targetIndication', label: 'Target Indication', type: 'checklist', options: ['NSCLC', 'Melanoma', 'Breast', 'CRC', 'RCC', 'HCC'] },
            { key: 'patient', label: 'Patient', type: 'checklist', options: ['Treatment-naive', 'Relapsed/Refractory', 'Pediatric', 'Adult', 'Elderly'] },
        ],
    },
    {
        title: 'Approved Indication',
        filters: [
            { key: 'approvedIndication', label: 'Approved Indication', type: 'checklist', options: ['NSCLC', 'Melanoma', 'Breast', 'CRC', 'RCC', 'HCC'] },
        ],
    },
    {
        title: 'Patent Data',
        filters: [
            { key: 'patentCountry', label: 'Country', type: 'select', options: ['United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Japan', 'China'] },
            { key: 'patentDateRange', label: 'Date Range', type: 'dateRange' },
            { key: 'patentStatus', label: 'Status', type: 'checklist', options: ['Active', 'Inactive'] },
        ],
    },
];

export default function DrugAdvancedSearch({ onApply }) {
    const [openFilterPanel, setOpenFilterPanel] = useState(false);
    const [activeSection, setActiveSection] = useState(FILTER_SECTIONS[0].title);
    const [inputValue, setInputValue] = useState('');
    const [selected, setSelected] = useState({}); // { [key]: string[] }
    const [textValues, setTextValues] = useState({}); // { [key]: string }
    const [dateRanges, setDateRanges] = useState({}); // { [key]: {start, end} }
    const anchorRef = useRef(null);

    const toggleOption = (key, option) => {
        setSelected((prev) => {
            const current = new Set(prev[key] || []);
            current.has(option) ? current.delete(option) : current.add(option);
            return { ...prev, [key]: Array.from(current) };
        });
    };

    const totalSelectedCount = () => {
        let count = Object.values(selected).reduce((sum, arr) => sum + arr.length, 0);
        count += Object.values(textValues).filter((v) => v && v.trim()).length;
        count += Object.values(dateRanges).filter((r) => r?.start || r?.end).length;
        return count;
    };

    const handleClear = () => {
        setSelected({});
        setTextValues({});
        setDateRanges({});
    };

    const handleApply = () => {
        onApply && onApply({ selected, text: textValues, dateRanges, search: inputValue });
        setOpenFilterPanel(false);
    };

    const renderFilter = (filter) => {
        if (filter.type === 'text') {
            return (
                <Box key={filter.key} mb={2}>
                    <Typography sx={{ fontFamily: 'Rubik', fontSize: 13, fontWeight: 600, mb: 1 }}>
                        {filter.label}
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={filter.placeholder}
                        value={textValues[filter.key] || ''}
                        onChange={(e) => setTextValues((p) => ({ ...p, [filter.key]: e.target.value }))}
                        sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Rubik', fontSize: 13 } }}
                    />
                </Box>
            );
        }

        if (filter.type === 'select') {
            return (
                <Box key={filter.key} mb={2}>
                    <Typography sx={{ fontFamily: 'Rubik', fontSize: 13, fontWeight: 600, mb: 1 }}>
                        {filter.label}
                    </Typography>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        SelectProps={{ native: true }}
                        value={(selected[filter.key] || [])[0] || ''}
                        onChange={(e) => setSelected((p) => ({ ...p, [filter.key]: e.target.value ? [e.target.value] : [] }))}
                        sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Rubik', fontSize: 13 } }}
                    >
                        <option value="">Select country…</option>
                        {filter.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </TextField>
                </Box>
            );
        }

        if (filter.type === 'dateRange') {
            const range = dateRanges[filter.key] || { start: '', end: '' };
            return (
                <Box key={filter.key} mb={2}>
                    <Typography sx={{ fontFamily: 'Rubik', fontSize: 13, fontWeight: 600, mb: 1 }}>
                        {filter.label}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField
                            label="Start date"
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={range.start}
                            onChange={(e) => setDateRanges((p) => ({ ...p, [filter.key]: { ...range, start: e.target.value } }))}
                            sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Rubik', fontSize: 13 } }}
                        />
                        <TextField
                            label="End date"
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={range.end}
                            onChange={(e) => setDateRanges((p) => ({ ...p, [filter.key]: { ...range, end: e.target.value } }))}
                            sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Rubik', fontSize: 13 } }}
                        />
                    </Box>
                </Box>
            );
        }

        // checklist (default)
        return (
            <Box key={filter.key} mb={2}>
                <Typography sx={{ fontFamily: 'Rubik', fontSize: 13, fontWeight: 600, mb: 1 }}>
                    {filter.label}
                </Typography>
                <Box sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 1, maxHeight: 180, overflowY: 'auto' }}>
                    {filter.options.map((opt) => {
                        const checked = (selected[filter.key] || []).includes(opt);
                        return (
                            <Box
                                key={opt}
                                onClick={() => toggleOption(filter.key, opt)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 1,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: '#F9F9FB' },
                                }}
                            >
                                <Checkbox
                                    size="small"
                                    checked={checked}
                                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                    checkedIcon={<CheckBoxIcon fontSize="small" sx={{ color: '#2666BE' }} />}
                                />
                                <Typography sx={{ fontFamily: 'Rubik', fontSize: 13, color: 'rgba(0,0,0,0.75)' }}>
                                    {opt}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    return (
        <ClickAwayListener onClickAway={() => setOpenFilterPanel(false)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                <Box sx={{ width: { xs: '100%', md: 480 }, minWidth: 0 }} ref={anchorRef}>
                    <TextField
                        fullWidth
                        placeholder="Drug name, MOA, backbone, sponsor, indication..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                fontSize: 14,
                                fontFamily: 'Rubik',
                                height: 36,
                                borderRadius: '6px',
                                paddingRight: 0,
                                '& fieldset': { borderColor: '#D9D9D9' },
                                '&:hover fieldset': { borderColor: '#D9D9D9' },
                                '&.Mui-focused fieldset': { borderColor: '#2666BE', borderWidth: '1px' },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {/* <SearchIcon sx={{ color: '#9e9e9e', fontSize: 18 }} /> */}
                                    <img src={SearchIcon} alt="" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end" sx={{ height: '100%', maxHeight: '100%', ml: 0 }}>
                                    <Box
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setOpenFilterPanel((prev) => !prev);
                                        }}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 50,
                                            height: '100%',
                                            cursor: 'pointer',
                                            borderLeft: '1px solid #D9D9D9',
                                            backgroundColor: 'rgba(243, 246, 251, 1)',
                                            borderTopRightRadius: '5px', // slightly less than outer radius
                                            borderBottomRightRadius: '5px',
                                            position: 'relative',
                                        }}
                                    >
                                        {totalSelectedCount() > 0 && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: -8,
                                                    right: 35,
                                                    background: '#2666BE',
                                                    color: '#fff',
                                                    fontFamily: 'Rubik',
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    borderRadius: '999px',
                                                    minWidth: 16,
                                                    height: 16,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    px: '4px',
                                                }}
                                            >
                                                {totalSelectedCount()}
                                            </Box>
                                        )}
                                        <ExpandMoreIcon
                                            sx={{
                                                color: 'rgba(0,0,0,0.6)',
                                                transform: openFilterPanel ? 'rotate(180deg)' : 'none',
                                                transition: 'transform 0.15s ease',
                                            }}
                                        />
                                    </Box>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Popper
                        open={openFilterPanel}
                        anchorEl={anchorRef.current}
                        placement="bottom-start"
                        sx={{ zIndex: 1300, width: anchorRef.current?.offsetWidth }}
                    >
                        <Paper
                            elevation={6}
                            sx={{
                                mt: 1,
                                display: 'flex',
                                height: 440,
                                borderRadius: 2,
                                overflow: 'hidden',
                            }}
                        >
                            {/* LEFT TABS */}
                            <Box
                                sx={{
                                    width: 160,
                                    flex: 'none',
                                    borderRight: '1px solid rgba(224,225,230,1)',
                                    padding: '16px 12px',
                                    overflowY: 'auto',
                                }}
                            >
                                {FILTER_SECTIONS.map((section) => (
                                    <Box
                                        key={section.title}
                                        onClick={() => setActiveSection(section.title)}
                                        sx={{
                                            cursor: 'pointer',
                                            fontFamily: 'Rubik',
                                            fontSize: 13,
                                            fontWeight: activeSection === section.title ? 600 : 400,
                                            padding: '10px 10px',
                                            borderRadius: 1,
                                            mb: '4px',
                                            background: activeSection === section.title ? '#E6F0FF' : 'transparent',
                                            color: activeSection === section.title ? '#2666BE' : 'rgba(0,0,0,0.55)',
                                        }}
                                    >
                                        {section.title}
                                    </Box>
                                ))}
                            </Box>

                            {/* RIGHT FILTER PANEL */}
                            <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
                                {FILTER_SECTIONS.find((s) => s.title === activeSection)?.filters.map((filter) =>
                                    renderFilter(filter)
                                )}
                            </Box>
                        </Paper>

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#fff',
                                borderTop: '1px solid rgba(0,0,0,0.08)',
                                px: 2,
                                py: 1.5,
                                borderRadius: '0 0 8px 8px',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                            }}
                        >
                            <Box
                                component="button"
                                onClick={handleClear}
                                sx={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontFamily: 'Rubik',
                                    fontWeight: 500,
                                    fontSize: 13,
                                    color: 'rgba(0,0,0,0.55)',
                                }}
                            >
                                Clear all
                            </Box>
                            <Box
                                component="button"
                                onClick={handleApply}
                                sx={{
                                    border: 'none',
                                    background: '#2666BE',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontFamily: 'Rubik',
                                    fontWeight: 500,
                                    fontSize: 13,
                                    padding: '8px 18px',
                                    borderRadius: '6px',
                                }}
                            >
                                Apply filters
                            </Box>
                        </Box>
                    </Popper>
                </Box>
            </Box>
        </ClickAwayListener>
    );
}
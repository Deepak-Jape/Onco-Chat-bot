// CreateProjectForm.jsx  — full API-integrated version
import React, { useEffect, useState } from 'react';
import { X, Upload, ChevronDown, Trash2 } from 'lucide-react';
import '../SiteDashboard.css';
import SparklesIcon from "../../../assets/icons/Sparkles.svg"
import * as API from "../../../api/Profile";
import { useSnackbar } from '../../../common/GlobalSnackbar';
// ─── constants ────────────────────────────────────────────────────────────────
const LINE_OF_THERAPY_OPTIONS = [
  '1L (First-line)', '2L (Second-line)', '3L+ (Third-line or later)',
  'Adjuvant', 'Neoadjuvant', 'Treatment-naive', 'Previously treated',
];
const CANCER_STAGE_OPTIONS = [
  'Early Stage', 'Locally Advanced / Advanced', 'Advanced / Metastatic',
  'Early + Potentially Resectable', 'Advanced / Unresectable',
];
const PHASE_OPTIONS = [
  'Phase I', 'Phase I/II', 'Phase II', 'Phase II/III', 'Phase III', 'Phase IV',
];

const EMPTY_COHORT = {
  cohort_name: '',
  organ: '',
  histology: '',
  biomarker_target: '',
  line_of_therapy: [],
  cancer_stage: [],
  phase: [],
  countries: [],
  duration_months: '',
  target_enrollment: '',
  target_sites: '',
};

// ─── constants (add at top with other constants) ───────────────────────────
const COUNTRY_OPTIONS = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Italy',
  'Spain', 'Canada', 'Australia', 'Japan', 'China', 'India', 'Brazil',
  'South Korea', 'Netherlands', 'Switzerland', 'Sweden', 'Belgium',
  'Austria', 'Denmark', 'Norway', 'Finland', 'Poland', 'Portugal',
  'Czech Republic', 'Hungary', 'Romania', 'Greece', 'Turkey', 'Israel',
  'Singapore', 'New Zealand', 'South Africa', 'Argentina', 'Mexico',
];

// ─── CountryDropdown sub-component ────────────────────────────────────────
const CountryDropdown = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = COUNTRY_OPTIONS.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCountry = (country) => {
    onChange(
      selected.includes(country)
        ? selected.filter((c) => c !== country)
        : [...selected, country]
    );
  };

  const removeCountry = (country, e) => {
    e.stopPropagation();
    onChange(selected.filter((c) => c !== country));
  };

  return (
    <div className="country-dropdown-wrapper" ref={dropdownRef}>

      {/* Trigger box */}
      <div
        className={`country-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((p) => !p)}
      >
        <div className="country-trigger-content">
          {selected.length === 0 ? (
            <span className="country-placeholder">Search Countries</span>
          ) : (
            <div className="selected-tags">
              {selected.map((c) => (
                <span key={c} className="country-tag">
                  {c}
                  <span className="country-tag-remove" onClick={(e) => removeCountry(c, e)}>×</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronDown size={16} className={`country-chevron ${open ? 'rotated' : ''}`} />
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="country-panel">
          <div className="country-search-wrapper">
            <input
              className="country-search-input"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <ul className="country-list">
            {filtered.length === 0 ? (
              <li className="country-empty">No countries found</li>
            ) : (
              filtered.map((country) => (
                <li
                  key={country}
                  className={`country-option ${selected.includes(country) ? 'checked' : ''}`}
                  onClick={() => toggleCountry(country)}
                >
                  <span className={`country-checkbox ${selected.includes(country) ? 'checked' : ''}`}>
                    {selected.includes(country) && '✓'}
                  </span>
                  {country}
                </li>
              ))
            )}
          </ul>

          {selected.length > 0 && (
            <div className="country-footer">
              <span>{selected.length} selected</span>
              <button className="country-clear-btn" onClick={() => onChange([])}>
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const toggleItem = (arr, item) =>
  arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

// ─── sub-component: single cohort card ───────────────────────────────────────
const CohortCard = ({ cohort, index, onChange, onRemove, isOnly }) => {
  const [expanded, setExpanded] = useState(true);

  const field = (key) => (e) => onChange(index, { ...cohort, [key]: e.target.value });
  const toggle = (key, item) => onChange(index, { ...cohort, [key]: toggleItem(cohort[key], item) });

  // ── Build collapsed summary from highlighted fields ──────────────────────
  const summaryParts = [
    cohort.organ,
    cohort.histology,
    cohort.biomarker_target,
    ...(cohort.line_of_therapy || []),
    ...(cohort.cancer_stage || []),
    ...(cohort.phase || []),
  ].filter(Boolean);   // remove empty strings

  return (
    <div className="cohort-card">
      <div className="cohort-card-header" onClick={() => setExpanded((p) => !p)}>
        <div className="cohort-card-header-left">
          <span className="cohort-card-title">
            {index + 1}. {cohort.cohort_name || 'New'} Cohort
          </span>

          {/* Summary row — only visible when collapsed */}
          {!expanded && summaryParts.length > 0 && (
            <div className="cohort-summary-row">
              {summaryParts.map((part, i) => (
                <React.Fragment key={i}>
                  <span className="cohort-summary-item">{part}</span>
                  {i < summaryParts.length - 1 && (
                    <span className="cohort-summary-dot">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="cohort-card-actions">
          {!isOnly && (
            <button
              className="btn-icon-danger"
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              title="Remove cohort"
            >
              <Trash2 size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`chevron-rotate ${expanded ? 'open' : ''}`}
          />
        </div>
      </div>

      {expanded && (
        <div className="cohort-card-body">
          <div className="input-group">
            <label className="input-label">Patient Population *</label>
            <input
              className="text-input"
              value={cohort.cohort_name}
              onChange={field('cohort_name')}
              placeholder="e.g., NSCLC"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Organ</label>
            <input className="text-input" value={cohort.organ} onChange={field('organ')} placeholder="e.g., Lung cancer" />
          </div>

          <div className="input-group">
            <label className="input-label">Histology</label>
            <input className="text-input" value={cohort.histology} onChange={field('histology')} placeholder="e.g., NSCLC" />
          </div>

          <div className="input-group">
            <label className="input-label">Biomarker / Target</label>
            <input className="text-input" value={cohort.biomarker_target} onChange={field('biomarker_target')} placeholder="e.g., EFGR exon 19 reduction" />
          </div>

          <div className="input-group">
            <label className="input-label">Line of Therapy</label>
            <div className="tag-cloud">
              {LINE_OF_THERAPY_OPTIONS.map((tag) => (
                <span
                  key={tag}
                  className={`pill-tag-outline ${cohort.line_of_therapy.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggle('line_of_therapy', tag)}
                >
                  {cohort.line_of_therapy.includes(tag) && '✓ '}{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Cancer Stage</label>
            <div className="tag-cloud">
              {CANCER_STAGE_OPTIONS.map((tag) => (
                <span
                  key={tag}
                  className={`pill-tag-outline ${cohort.cancer_stage.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggle('cancer_stage', tag)}
                >
                  {cohort.cancer_stage.includes(tag) && '✓ '}{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Phase *</label>
            <div className="tag-cloud">
              {PHASE_OPTIONS.map((tag) => (
                <span
                  key={tag}
                  className={`pill-tag-outline ${cohort.phase.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggle('phase', tag)}
                >
                  {cohort.phase.includes(tag) && '✓ '}{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="form-grid-row">
            <div className="input-group flex-1">
              <label className="input-label">Countries * (select one or more)</label>
              <CountryDropdown
                selected={cohort.countries}
                onChange={(updated) => onChange(index, { ...cohort, countries: updated })}
              />
            </div>
            <div className="input-group flex-1">
              <label className="input-label">Duration * (Study Start to LPI)</label>
              <input
                className="medical-select-input"
                placeholder="Enter the duration in month"
                value={cohort.duration_months}
                onChange={field('duration_months')}
                type="number"
                min="1"
              />
            </div>
          </div>

          <div className="form-grid-row">
            <div className="input-group flex-1">
              <label className="input-label">Target Enrollment (Total Patients) *</label>
              <input
                className="medical-select-input"
                placeholder="e.g., 300"
                value={cohort.target_enrollment}
                onChange={field('target_enrollment')}
                type="number"
                min="1"
              />
            </div>
            <div className="input-group flex-1">
              <label className="input-label">Target Number of Sites</label>
              <input
                className="medical-select-input"
                placeholder="e.g., 15"
                value={cohort.target_sites}
                onChange={field('target_sites')}
                type="number"
                min="1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
const CreateProjectForm = ({ isOpen, onClose, onSuccess, isEdit = false, projectId }) => {
  debugger
  const [projectName, setProjectName] = useState('');
  const [cohortInput, setCohortInput] = useState('');
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showSnackbar } = useSnackbar();
  const [projectStatus, setProjectStatus] = useState('Active');

  React.useEffect(() => {
    setProjectName('');
    setError('')
    setProjectStatus('Active');
    setCohorts([]);
    if (!projectId || !isEdit || !isOpen) return;
    getProjectDetails();
  }, [isOpen, projectId, isEdit]);

  if (!isOpen) return;

  const getProjectDetails = async () => {
    try {
      const res = await API.getProjectDetails(projectId);
      if (res?.project) {
        setProjectName(res.project.project_name || '');
        setProjectStatus(res.project.status || 'Active');
        setCohorts(res.project.cohorts || []);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  // ── cohort list operations ──
  const addCohort = () => {

    // if (!cohortInput.trim()) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setCohorts((prev) => [...prev, { ...EMPTY_COHORT, cohort_name: cohortInput.trim() }]);
    setCohortInput('');
  };

  const updateCohort = (index, updated) =>
    setCohorts((prev) => prev.map((c, i) => (i === index ? updated : c)));

  const removeCohort = (index) =>
    setCohorts((prev) => prev.filter((_, i) => i !== index));

  // ── validation ──
  const validate = () => {
    debugger
    if (!projectName.trim()) return 'Project Name is required.';
    if (!projectStatus.trim()) return 'Status is required.';
    // if(!cohorts.trim()) return 'Cohort name is required';
    if (cohorts.length < 1 && !cohortInput.trim()) return 'Patient population  is required'
    for (let i = 0; i < cohorts.length; i++) {
      if (!cohorts[i].cohort_name.trim()) return `Cohort ${i + 1} name is required.`;
      if (cohorts[i].phase.length < 1) return `Phase in  ${cohorts[i].cohort_name.trim()} Cohort is required.`;
      if (cohorts[i].countries.length < 1) return `Country in ${cohorts[i].cohort_name.trim()} Cohort is required.`;
      if (!cohorts[i].duration_months.trim()) return `Duration in ${cohorts[i].cohort_name.trim()} Cohort is required.`;
      if (!cohorts[i].target_enrollment.trim()) return `Target Enrollment in ${cohorts[i].cohort_name.trim()} Cohort is required.`;
    }
    return null;
  };

  // ── submit ──
  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);

    try {
      const payload = {
        project_name: projectName.trim(),
        study_synopsis: null,
        status: projectStatus.trim(),
        cohorts: cohorts.map((c) => ({
          ...c,
          duration_months: c.duration_months ? parseInt(c.duration_months) : null,
          target_enrollment: c.target_enrollment ? parseInt(c.target_enrollment) : null,
          target_sites: c.target_sites ? parseInt(c.target_sites) : null,
          is_deleted: false,
        })),
      };

      const response = isEdit
        ? await API.updateProject(projectId, JSON.stringify(payload))
        : await API.createNewProject(JSON.stringify(payload));

      if (!response.success) {
        throw new Error(response.detail || 'Something went wrong.');
      }

      showSnackbar({ message: response.message, type: "success", duration: 3000 });
      setCohorts([]);
      setProjectName("");
      onClose();
      onSuccess();
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} project. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // ── render ──
  return (
    <div className="modal-overlay">
      <div className="modal-container project-form-expanded">

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Project' : 'Create New Project'}</h2>
          <X className="close-icon" onClick={onClose} size={18} />
        </div>

        {/* Study Synopsis — UI kept, skipped in submit */}
        {/* Study Synopsis — hidden in edit mode */}
        {!isEdit && (
          <>
            <div className="synopsis-container">
              <div className="synopsis-label-row">
                <img className="scorecard__iconImg" src={SparklesIcon} alt="" aria-hidden="true" />
                <span className="synopsis-label">Study Synopsis</span>
              </div>
              <div className="synopsis-input-row">
                <div className="synopsis-input-wrapper">
                  <input type="text" className="synopsis-input" placeholder="Paste your study synopsis text here"  />
                </div>
                <button className="btn-upload" ><Upload size={18} /> Upload File</button>
                <button className="btn-autofill" >Auto-Fill</button>
              </div>
            </div>

            <div className="divider-row">
              <div className="divider-line" />
              <span className="divider-text">Or enter manually</span>
              <div className="divider-line" />
            </div>
            {/* Error message */}
            {error && <p className="form-error-msg">{error}</p>}
          </>
        )}

        {/* Scrollable body */}
        <div className="scrollable-form-content">

          {/* Project Name */}
          {/* Project Name + Status row */}
          <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>

            {/* 70% Width Column */}
            <div className="input-group" style={{ flex: 0.7 }}>
              <label className="input-label">Project Name *</label>
              <input
                className="text-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Drug I Phase II United States"
                style={{ width: "100%" }} // Ensures input fills the 70% container
              />
            </div>

            {/* 30% Width Column */}
            <div className="input-group" style={{ flex: 0.3 }}>
              <label className="input-label">Status *</label>
              <div className="select-wrapper">
                <select
                  className="medical-select-input status-select"
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  style={{ width: "100%" }} // Ensures select fills the 30% container
                >
                  <option value="" disabled>Select</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

          </div>

          {/* Add Cohort input */}
          <div className="input-group">
            <label className="input-label">Patient Population *</label>
            <div className="cohort-input-wrapper">
              <input
                type="text"
                className="text-input cohort-inner"
                value={cohortInput}
                onChange={(e) => setCohortInput(e.target.value)}
                placeholder="e.g. HER2+ breast cancer, NSCLC, colon cancer"
                onKeyDown={(e) => e.key === 'Enter' && addCohort()}
              />
              <button className="btn-add-primary" onClick={addCohort}>Add</button>
            </div>
          </div>

          {/* Cohort cards */}
          {cohorts.map((cohort, idx) => (
            <CohortCard
              key={idx}
              index={idx}
              cohort={cohort}
              onChange={updateCohort}
              onRemove={removeCohort}
              isOnly={cohorts.length === 1}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="modal-footer footer-border-top">
          <button
            className={`btn-submit ${!loading && cohorts.length != 0 ? 'active-submit' : ''}`}
            onClick={handleSubmit}
            disabled={loading || cohorts.length == 0}
          >
            {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Project & Find Sites' : 'Create Project & Find Sites')}
          </button>
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateProjectForm;
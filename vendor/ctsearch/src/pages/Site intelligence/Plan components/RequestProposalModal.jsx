import React, { useState } from 'react';

export default function RequestProposalModal({ isOpen = true, onClose, croName = 'Medpace' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    notes: ''
  });

  const [expandedCohorts, setExpandedCohorts] = useState({
    nsclc: true,
    abc: true // Both expanded by default to display the layout content cleanly
  });

  if (!isOpen) return null;

  const toggleCohort = (key) => {
    setExpandedCohorts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Proposal Request Submitted Data:', formData);
    if (onClose) onClose();
  };

  return (
    <div style={styles.modalOverlay}>
      {/* 💡 This injection allows your JavaScript hover styles to work instantly! */}
      <style>{`
        .hover-chip:hover {
          transition: ${styles['chipTagNeutral:hover'].transition} !important;
          color: ${styles['chipTagNeutral:hover'].color} !important;
        }
      `}</style>

      <div style={styles.modalScrollWrapper}>
        <div style={styles.popupCard}>

          {/* HEADER LAYER CONTAINER */}
          <div style={styles.headerContainer}>
            <div style={styles.headerTextGroup}>
              <h2 style={styles.headerTitle}>Request Proposal from {croName}</h2>
              <p style={styles.headerSubtitle}>Get proposal based on your current study setup</p>
            </div>
            <button onClick={onClose} style={styles.closeIconButton} aria-label="Close Modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* COHORT BLOCK A - NSCLC */}
          <div style={styles.cohortBoxContainer}>
            <div style={styles.cohortClickableHeader} onClick={() => toggleCohort('nsclc')}>
              <div style={styles.cohortTitleStack}>
                <div style={styles.cohortTitleRow}>
                  <span style={styles.cohortTitleText}>1. NSCLC Cohort</span>
                </div>
                <div style={styles.cohortTagsRow}>
                  <span>Lung cancer</span> <span style={styles.dotSeparator}>•</span>
                  <span>NSCLC</span> <span style={styles.dotSeparator}>•</span>
                  <span>EFGR exon 19 reduction</span> <span style={styles.dotSeparator}>•</span>
                  <span>1L (First-line)</span> <span style={styles.dotSeparator}>•</span>
                  <span>Early Stage</span> <span style={styles.dotSeparator}>•</span>
                  <span>Phase 1</span>
                </div>
              </div>
              <div style={{ ...styles.arrowIcon, transform: expandedCohorts.nsclc ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* COHORT BLOCK B - ABC */}
          <div style={styles.cohortBoxContainer}>
            <div style={styles.cohortClickableHeader} onClick={() => toggleCohort('abc')}>
              <div style={styles.cohortTitleStack}>
                <div style={styles.cohortTitleRow}>
                  <span style={styles.cohortTitleText}>2. ABC Cohort</span>
                </div>
                <div style={styles.cohortTagsRow}>
                  <span>Lung cancer</span> <span style={styles.dotSeparator}>•</span>
                  <span>NSCLC</span> <span style={styles.dotSeparator}>•</span>
                  <span>EFGR exon 19 reduction</span> <span style={styles.dotSeparator}>•</span>
                  <span>1L (First-line)</span> <span style={styles.dotSeparator}>•</span>
                  <span>Early Stage</span> <span style={styles.dotSeparator}>•</span>
                  <span>Phase 1</span>
                </div>
              </div>
              <div style={{ ...styles.arrowIcon, transform: expandedCohorts.abc ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* DIVIDER LINE */}
          <div style={styles.horizontalLineDivider} />

          {/* SHORTLISTED SITES CHIP TAG LABELS GROUP */}
          <div style={styles.sitesWrapperSection}>
            <h4 style={styles.sectionTitleLabel}>Shortlisted Sites</h4>
            <div style={styles.tagsFlexContainer}>
              {/* Added the className="hover-chip" to trigger the effect */}
              <div className="hover-chip" style={styles.chipTagNeutral}>Memorial Sloan Kettering Cancer Center</div>
              <div className="hover-chip" style={styles.chipTagNeutral}>MD Anderson Cancer Center</div>
              <div className="hover-chip" style={styles.chipTagNeutral}>Mayo Clinic Cancer Center</div>
              <div className="hover-chip" style={styles.chipTagNeutral}>MD Anderson Cancer Center</div>
              <div className="hover-chip" style={styles.chipTagNeutral}>Cleveland Clinic Taussig Cancer Institute</div>
              <div className="hover-chip" style={styles.chipTagActive}>+12 more sites</div>
            </div>
          </div>

          {/* DIVIDER LINE */}
          <div style={styles.horizontalLineDivider} />

          {/* DYNAMIC FORM FILL FIELDS SUBSECTION */}
          <form onSubmit={handleSubmit} style={styles.detailsFormGroup}>
            <div style={styles.formMetaHeader}>
              <h4 style={styles.sectionTitleLabel}>Your Details</h4>
              <p style={styles.sectionDescriptionLabel}>This information will be shared with {croName} to prepare your proposal</p>
            </div>

            {/* TWO COLUMN FLEX ELEMENT GRID (NAME AND EMAIL) */}
            <div style={styles.formRowDualColumn}>
              <div style={styles.inputStackUnit}>
                <label htmlFor="modalFormName" style={styles.fieldInputLabel}>Name</label>
                <div style={styles.inputWrapperContainerFrame}>
                  <input
                    id="modalFormName"
                    type="text"
                    name="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={handleChange}
                    style={styles.textInputElementUnstyled}
                    required
                  />
                </div>
              </div>
              <div style={styles.inputStackUnit}>
                <label htmlFor="modalFormEmail" style={styles.fieldInputLabel}>Email</label>
                <div style={styles.inputWrapperContainerFrame}>
                  <input
                    id="modalFormEmail"
                    type="email"
                    name="email"
                    placeholder="Enter your mail"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.textInputElementUnstyled}
                    required
                  />
                </div>
              </div>
            </div>

            {/* SINGLE COLUMN ENTRY FULL WIDTH (COMPANY) */}
            <div style={styles.inputStackFullWidth}>
              <label htmlFor="modalFormCompany" style={styles.fieldInputLabel}>Company</label>
              <div style={styles.inputWrapperContainerFrame}>
                <input
                  id="modalFormCompany"
                  type="text"
                  name="company"
                  placeholder="Company name"
                  value={formData.company}
                  onChange={handleChange}
                  style={styles.textInputElementUnstyled}
                  required
                />
              </div>
            </div>

            {/* SINGLE COLUMN ENTRY FULL WIDTH (TEXTAREA NOTES) */}
            <div style={styles.inputStackFullWidth}>
              <label htmlFor="modalFormNotes" style={styles.fieldInputLabel}>Additional Notes</label>
              <div style={styles.textareaWrapperContainerFrame}>
                <textarea
                  id="modalFormNotes"
                  name="notes"
                  placeholder="Write here"
                  value={formData.notes}
                  onChange={handleChange}
                  style={styles.textareaInputElementUnstyled}
                />
              </div>
            </div>

            {/* FORM ACTION FOOTER BUTTONS CONTROLS */}
            <div style={styles.actionControlsFooterBar}>
              <div style={styles.buttonsActionRow}>
                <button type="submit" style={styles.submitActionButtonLG}>
                  Send Request to {croName}
                </button>
                <button type="button" onClick={onClose} style={styles.cancelActionButton}>
                  Cancel
                </button>
              </div>
              <p style={styles.footerBottomNotice}>{croName} will contact you directly via email.</p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '20px',
    boxSizing: 'border-box'
  },
  modalScrollWrapper: {
    maxHeight: '100%',
    // overflowY: 'auto',
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  popupCard: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '32px',
    gap: '20px',
    position: 'relative',
    width: '860px',
    height: '650px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    fontFamily: "'Rubik', 'Inter', sans-serif",
    overflowX: "scroll",
    overflowX: "hidden"
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '796px',
    height: '48px',
  },
  headerTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    width: '778px',
    height: '48px',
  },
  headerTitle: {
    margin: 0,
    fontWeight: '500',
    fontSize: '21px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.8)'
  },
  headerSubtitle: {
    margin: 0,
    fontWeight: '400',
    fontSize: '14px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.6)'
  },
  closeIconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0px',
    width: '18px',
    height: '18px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cohortBoxContainer: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px',
    gap: '8px',
    width: '796px',
    height: '80px',
    background: '#F9F9FB',
    border: '1px solid #F0F0F3',
    borderRadius: '4px',
  },
  cohortClickableHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    cursor: 'pointer',
  },
  cohortTitleStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    width: '602px',
    height: '46px',
  },
  cohortTitleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    width: '136px',
    height: '18px',
  },
  cohortTitleText: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: '600',
    fontSize: '16px',
    lineHeight: '18px',
    letterSpacing: '-0.150391px',
    color: 'rgba(0, 0, 0, 0.9)'
  },
  cohortTagsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0px',
    gap: '8px',
    width: '700px',
    height: '20px',
    color: 'rgba(0, 0, 0, 0.6)'
  },
  dotSeparator: {
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center'
  },
  arrowIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
  },
  horizontalLineDivider: {
    width: '796px',
    height: '1px',
    background: 'rgba(0, 0, 0, 0.05)'
  },
  sitesWrapperSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '20px',
    width: '796px',
    height: '98px',
  },
  sectionTitleLabel: {
    margin: 0,
    fontFamily: "'Inter', sans-serif",
    fontWeight: '600',
    fontSize: '16px',
    lineHeight: '18px',
    letterSpacing: '-0.150391px',
    color: 'rgba(0, 0, 0, 0.9)'
  },
  sectionDescriptionLabel: {
    margin: 0,
    fontWeight: '400',
    fontSize: '14px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.6)'
  },
  tagsFlexContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    padding: '0px',
    gap: '8px',
    width: '796px',
    height: '60px',
  },
  chipTagNeutral: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0px 12px',
    gap: '2px',
    height: '26px',
    background: '#F9F9FB',
    border: '1px solid #F0F0F3',
    borderRadius: '44px',
    fontSize: '14px',
    lineHeight: '14px',
    color: 'rgba(0, 0, 0, 0.6)',
    cursor: "pointer"
  },
  'chipTagNeutral:hover': {
    transition: 'all 0.2s ease-in-out',
    color: 'rgba(0, 0, 0, 0.8)',
  },
  chipTagActive: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0px 12px',
    gap: '2px',
    width: '132px',
    height: '26px',
    background: '#F0F6FE',
    border: '1px solid #DCE9FC',
    borderRadius: '44px',
    fontSize: '14px',
    lineHeight: '14px',
    fontWeight: '500',
    color: '#2666BE',
  },
  detailsFormGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '24px',
    width: '796px',
    height: '479px',
  },
  formMetaHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '8px',
    width: '796px',
    height: '46px',
  },
  formRowDualColumn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '20px',
    width: '796px',
    height: '73px',
  },
  inputStackUnit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '12px',
    width: '388px',
    height: '73px',
    flexGrow: 1,
  },
  inputStackFullWidth: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '12px',
    width: '796px',
    height: '73px',
    margin: "0  0 30px 0"
  },
  fieldInputLabel: {
    width: 'auto',
    height: '17px',
    fontWeight: '500',
    fontSize: '14px',
    lineHeight: '17px',
    color: 'rgba(0, 0, 0, 0.6)'
  },
  inputWrapperContainerFrame: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0px 16px',
    gap: '8px',
    width: '100%',
    height: '44px',
    background: '#FFFFFF',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '1px 4px 24px rgba(153, 169, 190, 0.2)',
    borderRadius: '6px',
  },
  textareaWrapperContainerFrame: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '16px',
    gap: '8px',
    width: '796px',
    height: '100px',
    background: '#FFFFFF',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '1px 4px 24px rgba(153, 169, 190, 0.2)',
    borderRadius: '6px',
  },
  textInputElementUnstyled: {
    width: '100%',
    height: '20px',
    border: 'none',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.8)',
    padding: 0
  },
  textareaInputElementUnstyled: {
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    lineHeight: '20px',
    color: 'rgba(0, 0, 0, 0.8)',
    padding: 0,
    resize: 'none'
  },
  actionControlsFooterBar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0 0 20px 0',
    gap: '16px',
    width: '796px',
    height: '102px',
  },
  buttonsActionRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '16px',
    width: '796px',
    height: '44px',
  },
  submitActionButtonLG: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0px 15px',
    gap: '8px',
    width: '685px',
    height: '44px',
    background: '#2666BE',
    borderRadius: '6px',
    border: 'none',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500',
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '-0.150391px',
    color: '#FFFFFF',
    cursor: 'pointer',
    flexGrow: 1
  },
  cancelActionButton: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0px 24px',
    gap: '8px',
    width: '95px',
    height: '44px',
    background: '#FFFFFF',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    fontWeight: '500',
    fontSize: '14px',
    lineHeight: '17px',
    color: 'rgba(0, 0, 0, 0.8)',
    cursor: 'pointer'
  },
  footerBottomNotice: {
    margin: 0,
    // width: '796px',
    height: '22px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '400',
    fontSize: '16px',
    lineHeight: '22px',
    letterSpacing: '0.0703125px',
    color: 'rgba(0, 0, 0, 0.6)'
  },
  flagComponentWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  flagEmojiSpan: {
    fontSize: '18px',
    lineHeight: '1',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  flagCountryLabel: {
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.8)',
    fontWeight: '400'
  }
};
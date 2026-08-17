import React, { useState } from 'react';
import './FastTrackCrosBlock.css';
import RequestProposalModal from './RequestProposalModal';

const FastTrackCrosBlock = () => {
  const [selectedCro, setSelectedCro] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const croData = [
    {
      name: 'Medpace',
      status: 'MSA Active',
      statusType: 'active',
      coverage: '18 / 27 sites',
      studyStartup: '2.5 months',
      rampUpTime: '1.8 months',
      fullTimeToLpi: '9.8 months',
      lpiColor: 'green'
    },
    {
      name: 'ICON',
      status: 'MSA Active',
      statusType: 'active',
      coverage: '14 / 27 sites',
      studyStartup: '2.8 months',
      rampUpTime: '2.0 months',
      fullTimeToLpi: '10.2 months',
      lpiColor: 'green'
    },
    {
      name: 'Syneos',
      status: 'MSA Pending',
      statusType: 'pending',
      coverage: '8 / 27 sites',
      studyStartup: '3.2 months',
      rampUpTime: '2.2 months',
      fullTimeToLpi: '11.5 months',
      lpiColor: 'orange'
    }
  ];

  const handleOpenProposal = (croName) => {
    setSelectedCro(croName);
    setIsModalOpen(true);
  };

  return (
    <div className="fast-track-cro-block">
      {/* Header Section */}
      <div className="block-header">
        <h3>Fast Track CROs</h3>
        <div className="help-icon-wrapper" title="Help Information">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.36146 13.5848C9.54189 13.404 9.6321 13.1827 9.6321 12.9209C9.6321 12.6592 9.54174 12.4381 9.361 12.2577C9.18026 12.0774 8.95904 11.9872 8.69733 11.9872C8.43562 11.9872 8.21455 12.0776 8.03412 12.2584C7.85369 12.4391 7.76348 12.6603 7.76348 12.922C7.76348 13.1837 7.85385 13.4048 8.03458 13.5852C8.21532 13.7655 8.43654 13.8556 8.69825 13.8556C8.95996 13.8556 9.18103 13.7654 9.36146 13.5848ZM8.04902 10.5733H9.33946C9.35122 10.1221 9.4173 9.76166 9.53769 9.49185C9.65823 9.2222 9.95057 8.8647 10.4147 8.41935C10.8179 8.01617 11.1267 7.64385 11.341 7.3024C11.5555 6.96109 11.6627 6.55799 11.6627 6.09308C11.6627 5.30399 11.3793 4.6876 10.8123 4.24394C10.2452 3.80042 9.57443 3.57867 8.8 3.57867C8.03489 3.57867 7.40178 3.78285 6.90067 4.19123C6.3994 4.5996 6.04183 5.08055 5.82794 5.63406L7.0054 6.10638C7.11708 5.80204 7.30805 5.50558 7.57831 5.21698C7.84858 4.92853 8.24992 4.78431 8.78235 4.78431C9.3241 4.78431 9.72453 4.93266 9.98365 5.22935C10.2429 5.5262 10.3725 5.85261 10.3725 6.20858C10.3725 6.5201 10.2838 6.8051 10.1062 7.0636C9.92887 7.3221 9.70269 7.57182 9.42769 7.81275C8.8259 8.35572 8.44571 8.78885 8.28712 9.11212C8.12839 9.43525 8.04902 9.92231 8.04902 10.5733ZM8.70994 17.4167C7.50544 17.4167 6.37328 17.1881 5.31346 16.731C4.25364 16.2739 3.33178 15.6535 2.54787 14.8699C1.76397 14.0863 1.14331 13.1649 0.685896 12.1055C0.228632 11.0461 0 9.91428 0 8.70994C0 7.50544 0.228556 6.37328 0.685667 5.31346C1.14278 4.25364 1.76313 3.33178 2.54673 2.54787C3.33033 1.76397 4.25181 1.14331 5.31117 0.685896C6.37053 0.228632 7.50238 0 8.70673 0C9.91123 0 11.0434 0.228555 12.1032 0.685666C13.163 1.14278 14.0849 1.76313 14.8688 2.54673C15.6527 3.33033 16.2734 4.25181 16.7308 5.31117C17.188 6.37053 17.4167 7.50238 17.4167 8.70673C17.4167 9.91123 17.1881 11.0434 16.731 12.1032C16.2739 13.163 15.6535 14.0849 14.8699 14.8688C14.0863 15.6527 13.1649 16.2734 12.1055 16.7308C11.0461 17.188 9.91428 17.4167 8.70994 17.4167ZM8.70833 16.0417C10.7556 16.0417 12.4896 15.3312 13.9104 13.9104C15.3312 12.4896 16.0417 10.7556 16.0417 8.70833C16.0417 6.66111 15.3312 4.92708 13.9104 3.50625C12.4896 2.08542 10.7556 1.375 8.70833 1.375C6.66111 1.375 4.92708 2.08542 3.50625 3.50625C2.08542 4.92708 1.375 6.66111 1.375 8.70833C1.375 10.7556 2.08542 12.4896 3.50625 13.9104C4.92708 15.3312 6.66111 16.0417 8.70833 16.0417Z" fill="black" fillOpacity="0.4"/>
          </svg>
        </div>
      </div>

      {/* Cards Container */}
      <div className="cards-grid">
        {croData.map((cro, index) => (
          <div key={index} className="cro-card">
            {/* Card Header */}
            <div className="card-header">
              <span className="cro-name">{cro.name}</span>
              <div className={`status-badge ${cro.statusType}`}>
                <span className="badge-dot"></span>
                <span className="badge-text">{cro.status}</span>
              </div>
            </div>

            {/* Coverage Info */}
            <div className="coverage-row">
              <span className="label">MSA Coverage</span>
              <span className="value text-dark-muted">{cro.coverage}</span>
            </div>

            {/* Metrics Group */}
            <div className="metrics-group">
              <div className="metric-row">
                <span className="label">Study Startup:</span>
                <span className="value text-bold">{cro.studyStartup}</span>
              </div>
              <div className="metric-row">
                <span className="label">Ramp-up Time:</span>
                <span className="value text-bold">{cro.rampUpTime}</span>
              </div>
              <div className="metric-row lpi-row">
                <span className="label">Full time to LPI:</span>
                <span className={`value text-bold lpi-value ${cro.lpiColor}`}>
                  {cro.fullTimeToLpi}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button 
              className="proposal-btn" 
              onClick={() => handleOpenProposal(cro.name)}
            >
              Request proposal
            </button>
          </div>
        ))}
      </div>

      {/* Dynamic Popover Overlay Portal mount */}
      {isModalOpen && (
        <RequestProposalModal 
          croName={selectedCro} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default FastTrackCrosBlock;
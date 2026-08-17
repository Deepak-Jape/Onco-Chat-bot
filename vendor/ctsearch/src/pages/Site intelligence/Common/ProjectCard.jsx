import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Chip from "@mui/material/Chip";
import '../SiteDashboard.css';

const ProjectCard = ({ title, cohorts = [], status, project_id, onEdit, onDelete }) => {
  if (!project_id) return null;

  const navigate = useNavigate();
  const isActive = status?.toLowerCase() === 'active';
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleCohorts = cohorts.slice(0, 1);
  const overflowCount = cohorts.length - 2;

  useEffect(() => {
    debugger
    if (!menuOpen) return;

    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    // Use capture phase so this fires before the other card's toggleMenu click handler.
    // This ensures A8 closes BEFORE A7 evaluates its toggle, so A7 opens correctly.
    document.addEventListener('mousedown', handleOutsideClick, true);
    return () => document.removeEventListener('mousedown', handleOutsideClick, true);
  }, [menuOpen]);

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onEdit?.(project_id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete?.(project_id);
  };

  return (
    <div
      className={`project-card ${menuOpen ? 'menu-open' : ''}`}
      style={{ cursor: "pointer" }}
      onClick={() => { !menuOpen && navigate('/admin/site_intelligence_details?project_id=' + project_id); }}
    >
      <div className="card-header">
        <h3 className="card-title">
          <button>{title}</button>
        </h3>

        <div className="menu-wrapper" ref={menuRef}>
          <MoreVertical size={18} className="more-icon" onClick={handleToggleMenu} />

          {menuOpen && (
            <div className="card-menu">
              <button className="card-menu-item" onClick={handleEditClick}>Edit</button>
              <button className="card-menu-item card-menu-item-danger" onClick={handleDeleteClick}>Delete</button>
            </div>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="label">Cohorts:</span>
          <div className="tag-group">
            {visibleCohorts.map((c, i) => (
              <Chip
                key={i}
                label={c}
                size="small"
                sx={{
                  fontSize: "14px",
                  fontWeight: "400",
                  border: "1px solid #DCE9FC",
                  background: "transparent",
                  color: "#00000080",
                  cursor: "pointer",
                  "&:hover": { color: "#000000CC" },
                }}
              />
            ))}
            {overflowCount > 0 && (
              <Chip
                label={`+${overflowCount}`}
                size="small"
                sx={{
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "4px",
                  background: "#C7DFFF",
                  color: "#00000090",
                  cursor: "pointer",
                  "&:hover": { color: "#000000CC" },
                }}
              />
            )}
          </div>
        </div>

        <div className="info-row">
          <span className="label">Status:</span>
          <span className={`status-val ${isActive ? 'active' : 'completed'}`}>{status}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
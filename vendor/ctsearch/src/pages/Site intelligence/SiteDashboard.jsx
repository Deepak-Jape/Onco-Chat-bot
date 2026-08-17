import React, { useState, useEffect, useCallback } from 'react';
import ProjectCard from './Common/ProjectCard';
import './SiteDashboard.css';
import Sidebar from '../../layout/sidebar/Sidebar';
import CreateProjectModal from './Common/CreatePeojectForm';
import { Search, Plus, ChevronDown } from 'lucide-react';
import * as API from "../../api/Profile";
import { Box, Typography, Button, SvgIcon } from '@mui/material';

const SiteDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [recentProjects, setRecentProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0)
  const [counts, setCounts] = useState({ Active: 0, Completed: 0, All: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const [editProjectId, setEditProjectId] = useState(null);
  const [createdByFilter, setCreatedByFilter] = useState('Anyone');
  const [createdByMenuOpen, setCreatedByMenuOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const statusOptions = [
    { value: "All", label: "All Projects" },
    { value: "Active", label: "Active Projects" },
    { value: "Completed", label: "Completed Projects" },
  ];

  const createdByOptions = [
    { value: 'Anyone', label: 'Created by Anyone' },
    { value: 'Me', label: 'Created by Me' },
    { value: 'Others', label: 'Created by Others' },
  ];


  //   const CreateProjectIcon = ({ sx, ...props }) => (
  //   <Box component="svg" sx={sx} width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
  //     <mask id="mask0_30663_3609" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
  //       <rect width="20" height="20" fill="#D9D9D9" />
  //     </mask>
  //     <g mask="url(#mask0_30663_3609)">
  //       <path
  //         d="M4.375 17.9168C4.19792 17.9168 4.04951 17.8569 3.92979 17.737C3.80993 17.6172 3.75 17.4687 3.75 17.2916C3.75 17.1144 3.80993 16.966 3.92979 16.8464C4.04951 16.7267 4.19792 16.6668 4.375 16.6668H15.625C15.8021 16.6668 15.9505 16.7268 16.0702 16.8466C16.1901 16.9665 16.25 17.115 16.25 17.292C16.25 17.4693 16.1901 17.6177 16.0702 17.7372C15.9505 17.857 15.8021 17.9168 15.625 17.9168H4.375ZM9.99208 14.1989C9.87903 14.1989 9.76917 14.1738 9.6625 14.1235C9.55583 14.0734 9.46479 13.9981 9.38937 13.8977L5.665 9.04662C5.47806 8.79551 5.45347 8.52975 5.59125 8.24933C5.72903 7.96891 5.95451 7.8287 6.26771 7.8287H7.76438V2.83683C7.76438 2.62336 7.8366 2.44447 7.98104 2.30016C8.12535 2.15572 8.30424 2.0835 8.51771 2.0835H11.4744C11.6877 2.0835 11.8666 2.15572 12.011 2.30016C12.1553 2.44447 12.2275 2.62336 12.2275 2.83683V7.8287H13.7244C14.0374 7.8287 14.2628 7.96891 14.4006 8.24933C14.5384 8.52975 14.5138 8.79551 14.3269 9.04662L10.5946 13.8977C10.5193 13.9981 10.4283 14.0734 10.3215 14.1235C10.2148 14.1738 10.105 14.1989 9.99208 14.1989ZM9.99208 12.6443L12.6892 9.08662H10.9775V3.3335H9.01438V9.08662H7.30292L9.99208 12.6443Z"
  //         fill="white"
  //       />
  //     </g>
  //   </Box>
  // );

  const CreateProjectIcon = (props) => (
    <SvgIcon {...props}>
      {/* Your SVG paths go here, e.g., <path d="..." /> */}
      <path
        d="M4.375 17.9168C4.19792 17.9168 4.04951 17.8569 3.92979 17.737C3.80993 17.6172 3.75 17.4687 3.75 17.2916C3.75 17.1144 3.80993 16.966 3.92979 16.8464C4.04951 16.7267 4.19792 16.6668 4.375 16.6668H15.625C15.8021 16.6668 15.9505 16.7268 16.0702 16.8466C16.1901 16.9665 16.25 17.115 16.25 17.292C16.25 17.4693 16.1901 17.6177 16.0702 17.7372C15.9505 17.857 15.8021 17.9168 15.625 17.9168H4.375ZM9.99208 14.1989C9.87903 14.1989 9.76917 14.1738 9.6625 14.1235C9.55583 14.0734 9.46479 13.9981 9.38937 13.8977L5.665 9.04662C5.47806 8.79551 5.45347 8.52975 5.59125 8.24933C5.72903 7.96891 5.95451 7.8287 6.26771 7.8287H7.76438V2.83683C7.76438 2.62336 7.8366 2.44447 7.98104 2.30016C8.12535 2.15572 8.30424 2.0835 8.51771 2.0835H11.4744C11.6877 2.0835 11.8666 2.15572 12.011 2.30016C12.1553 2.44447 12.2275 2.62336 12.2275 2.83683V7.8287H13.7244C14.0374 7.8287 14.2628 7.96891 14.4006 8.24933C14.5384 8.52975 14.5138 8.79551 14.3269 9.04662L10.5946 13.8977C10.5193 13.9981 10.4283 14.0734 10.3215 14.1235C10.2148 14.1738 10.105 14.1989 9.99208 14.1989ZM9.99208 12.6443L12.6892 9.08662H10.9775V3.3335H9.01438V9.08662H7.30292L9.99208 12.6443Z"
        fill="white"
      />
    </SvgIcon>
  );

  // ── fetch recent (top 3) ──────────────────────────────────────────────────
  const fetchRecent = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const res = await API.getRecentProjects()
      if (!res.success) throw new Error('Failed to fetch recent projects');
      const data = await res.projects;
      setRecentProjects(data);
      setTotalCount(res.total_count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  // ── fetch all projects by status ──────────────────────────────────────────
  const fetchAll = useCallback(async (status, createdBy) => {
    setLoadingAll(true);
    try {
      const res = await API.getAllProjects(status, createdBy)
      if (!res.success) throw new Error('Failed to fetch projects');
      const data = await res.projects;
      setAllProjects(data);
      setCounts({ Active: res.active_count, Completed: res.completed_count, All: res.all_count });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAll(false);
    }
  }, []);

  // ── fetch counts for both tabs (Active + Completed) ───────────────────────
  // const fetchCounts = useCallback(async () => {
  //   try {
  //     const [activeRes, completedRes] = await Promise.all([
  //       fetch('/site_intelligence/all_projects?status=Active',    { credentials: 'include' }),
  //       fetch('/site_intelligence/all_projects?status=Completed', { credentials: 'include' }),
  //     ]);
  //     const activeData    = activeRes.ok    ? await activeRes.json()    : [];
  //     const completedData = completedRes.ok ? await completedRes.json() : [];
  //     setCounts({ Active: activeData.length, Completed: completedData.length });
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }, []);

  // ── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRecent();
    fetchAll(activeTab, createdByFilter);
    // fetchCounts();
  }, []);                              // eslint-disable-line react-hooks/exhaustive-deps

  // ── re-fetch all projects when tab changes ────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    fetchAll(tab, createdByFilter);
  };

  const handleCreatedByChange = (value) => {
    setCreatedByFilter(value);
    setCreatedByMenuOpen(false);
    fetchAll(activeTab, value);
  };

  // ── after a new project is created ───────────────────────────────────────
  const handleProjectCreated = () => {
    fetchRecent();
    fetchAll(activeTab, createdByFilter);
    // fetchCounts();
  };

  // ── client-side search filter ─────────────────────────────────────────────
  const filteredProjects = allProjects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const cohort_names = p.cohort_name ? p.cohort_name.split(",") : []
    return (
      p.project_name?.toLowerCase().includes(q) ||
      (cohort_names).some((c) => c?.toLowerCase().includes(q))
    );
  });

  // ── card shape adapter (API → ProjectCard props) ──────────────────────────
  const toCardProps = (p) => {
    // execution pauses here when DevTools is open

    return {
      title: p.project_name,
      // cohorts: (p.cohort_name || []).filter(Boolean),
      cohorts: p.cohort_name ? p.cohort_name.split(",") : [],
      status: p.status,
    };
  };

  const handleEdit = (project_id) => {
    setIsEdit(true)
    setEditProjectId(project_id);
    setIsModalOpen(true);
  };

  const openCreateNewProjectModel = () => {
    setIsEdit(false)
    setIsModalOpen(true);
  }

  const handleDelete = async (project_id) => {
    const confirmed = window.confirm('Are you sure you want to delete this project? This cannot be undone.');
    if (!confirmed) return;

    try {
      const res = await API.deleteProject(project_id);
      if (res?.success) {
        handleProjectCreated();
      } else {
        alert(res?.message || 'Failed to delete project.');
      }
    } catch (err) {
      alert(err?.response?.data?.detail || 'You are not authorized to delete this project.');
    }
  };


  return (
    <div className="app-container">
      {/* <Sidebar activeTab="SITE INTELLIGENCE" /> */}

      <main className="content-area">
        <header className="main-header">
          <h1>Sites</h1>
          <button className="btn-create" onClick={() => openCreateNewProjectModel()}>
            <Plus size={18} /> Create new project
          </button>
        </header>

        <section 
        // className="dashboard-content"
        >
          {
            totalCount > 0
              ? (
                <>
                  {/* ── Recent Projects ── */}
                  <h2 className="section-title">Recent projects</h2>
                  <div className="main-projects-grid">
                    {loadingRecent ? (
                      <p className="loading-text">Loading…</p>
                    ) : recentProjects.length === 0 ? (
                      <p className="empty-text">No recent projects.</p>
                    ) : (
                      recentProjects.map((p) => (
                        <ProjectCard
                          key={p.project_id} {...toCardProps(p)}
                          project_id={p.project_id}
                          unique_id={'R' + p.project_id}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          openMenuId={openMenuId}
                          setOpenMenuId={setOpenMenuId}
                        />
                      ))
                    )}
                  </div>

                  {/* ── All Projects ── */}
                  <div className="filter-controls">
                    <h2 className="all-projects-header">All projects</h2>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: '#00000099' }}>

                      {/* Active / Completed tabs */}
                      {/* <div className="tab-group">
                        {['All', 'Active', 'Completed'].map((tab) => (
                          <button
                            key={tab}
                            className={`tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab)}
                            style={{
                              borderRight: '1px solid #B8D4F9'
                            }}
                          >
                            {tab} ({counts[tab]})
                          </button>
                        ))}
                      </div> */}

                      <div className="dropdown">
                        <button
                          className="dropdown-trigger"
                          onClick={() => setStatusMenuOpen((prev) => !prev)}
                        >
                          <span>
                            {statusOptions.find(
                              (o) => o.value === activeTab
                            )?.label}
                            {" "}
                            ({counts[activeTab]})
                          </span>
                          <ChevronDown size={16} />
                        </button>

                        {statusMenuOpen && (
                          <>
                            <div
                              className="dropdown-backdrop"
                              onClick={() => setStatusMenuOpen(false)}
                            />

                            <div className="dropdown-menu">
                              {statusOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  className={`dropdown-menu-item ${activeTab === opt.value ? "selected" : ""
                                    }`}
                                  onClick={() => {
                                    handleTabChange(opt.value);
                                    setStatusMenuOpen(false);
                                  }}
                                >
                                  {opt.label} ({counts[opt.value]})
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="dropdown">
                        <button
                          className="dropdown-trigger"
                          onClick={() => setCreatedByMenuOpen((prev) => !prev)}
                        >
                          <span>
                            {createdByOptions.find(
                              (o) => o.value === createdByFilter
                            )?.label}
                          </span>
                          <ChevronDown size={16} />
                        </button>

                        {createdByMenuOpen && (
                          <>
                            <div
                              className="dropdown-backdrop"
                              onClick={() => setCreatedByMenuOpen(false)}
                            />

                            <div className="dropdown-menu">
                              {createdByOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  className={`dropdown-menu-item ${createdByFilter === opt.value ? "selected" : ""
                                    }`}
                                  onClick={() => handleCreatedByChange(opt.value)}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* <div className="created-by-dropdown">
                        <button
                          className="created-by-trigger"
                          onClick={() => setCreatedByMenuOpen((prev) => !prev)}
                        >
                          <span>{createdByOptions.find((o) => o.value === createdByFilter)?.label}</span>
                          <ChevronDown size={16} />
                        </button>

                        {createdByMenuOpen && (
                          <>
                            <div className="menu-backdrop" onClick={() => setCreatedByMenuOpen(false)} />
                            <div className="created-by-menu">
                              {createdByOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  className={`created-by-menu-item ${createdByFilter === opt.value ? 'selected' : ''}`}
                                  onClick={() => handleCreatedByChange(opt.value)}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div> */}


                      {/* Search */}
                      <div className="search-wrapper">
                        <Search size={14} className="search-icon" />
                        <input
                          type="text"
                          placeholder="Search..."
                          className="search-input"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                    </div>
                  </div>
                  <div style={{
                    overflowY: "auto",
                    overflowX: "hidden",
                    height: "51vh",
                    paddingTop: "12px"
                  }}>
                    <div className="main-projects-grid">
                      {console.log("filteredProjects", filteredProjects)}
                      {loadingAll ? (
                        <p className="loading-text">Loading…</p>
                      ) : filteredProjects.length === 0 ? (
                        <p className="empty-text">No {activeTab.toLowerCase()} projects found.</p>
                      ) : (
                        filteredProjects.map((p) => (
                          <ProjectCard
                            key={p.project_id} {...toCardProps(p)} project_id={p.project_id}
                            unique_id={'A' + p.project_id}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            openMenuId={openMenuId}
                            setOpenMenuId={setOpenMenuId}
                          />

                        ))
                      )}
                    </div>
                  </div>
                </>

              )
              :
              (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "80vh",
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                      {loadingAll && (
                        <Box
                          sx={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            border: "2px solid rgba(38, 102, 190, 0.2)", // Light background ring
                            borderTopColor: "rgba(38, 102, 190, 1)",                  // Sharp spinning accent
                            animation: "spin 0.8s linear infinite",
                            "@keyframes spin": {
                              "0%": { transform: "rotate(0deg)" },
                              "100%": { transform: "rotate(360deg)" },
                            },
                          }}
                        />
                      )}
                      <Typography sx={{ fontSize: 18, fontWeight: 700, fontFamily: "Rubik", mb: 1 }}>
                        Start with the right sites
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 14,
                          color: "rgba(0, 0, 0, 0.6)",
                          fontFamily: "Rubik",
                          lineHeight: 1.5,
                          mb: 2.5,
                        }}
                      >
                        Create a project to evaluate recruitment potential, competing trials,
                        <br />
                        and real patient availability.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => openCreateNewProjectModel()}
                        sx={{
                          backgroundColor: "#2666BE",
                          color: "#FFFFFF",
                          textTransform: "none",
                          fontFamily: "Rubik",
                          fontSize: 14,
                          fontWeight: 500,
                          borderRadius: "6px",
                          height: "44px",
                          px: "15px",
                          // gap: "8px", <-- Remove or comment this out
                          "&:hover": {
                            backgroundColor: "#1d52a0",
                          },
                        }}
                      >
                        <CreateProjectIcon style={{ width: 20, height: 20 }} /> Create Your First Project
                      </Button>
                    </Box>
                  </Box>
                </>
              )
          }
        </section>
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleProjectCreated}
          projectId={editProjectId}
          isEdit={isEdit}
        />
      </main>
    </div>
  );
};

export default SiteDashboard;
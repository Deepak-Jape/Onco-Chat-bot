/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Popper,
  Paper,
  Typography,
  Button,
  ClickAwayListener,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import { makeStyles } from "@mui/styles";
import * as API from "../../../api/Profile"
import editInfoIcon from "../../../assets/icons/editInfo.svg"
import CreateProjectForm from "./CreatePeojectForm";

// ── GLOBAL SELECTED PROJECT ID ──────────────────────────────────────────────
// Exported mutable reference so other modules can read the currently
// selected project without prop-drilling. See note at the bottom of this
// file regarding the limitations of this approach.
export let selectedProjectId = null;

// ── EDIT ICON (from provided SVG) ───────────────────────────────────────────
const EditIcon = ({ sx, ...props }) => (
  <Box component="svg" sx={sx} width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <path
      d="M8 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V8"
      stroke="black"
      strokeOpacity="0.6"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.2494 1.75015C12.5146 1.48493 12.8743 1.33594 13.2494 1.33594C13.6245 1.33594 13.9842 1.48493 14.2494 1.75015C14.5146 2.01537 14.6636 2.37508 14.6636 2.75015C14.6636 3.12522 14.5146 3.48493 14.2494 3.75015L8.24075 9.75948C8.08244 9.91765 7.88688 10.0334 7.67208 10.0962L5.75674 10.6562C5.69938 10.6729 5.63857 10.6739 5.58068 10.6591C5.5228 10.6442 5.46996 10.6141 5.42771 10.5719C5.38546 10.5296 5.35534 10.4768 5.34051 10.4189C5.32568 10.361 5.32668 10.3002 5.34341 10.2428L5.90341 8.32748C5.96643 8.11285 6.08243 7.91752 6.24075 7.75948L12.2494 1.75015Z"
      stroke="black"
      strokeOpacity="0.6"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Box>
);

const useStyles = makeStyles(() => ({
  trigger_field: {
    "& .MuiOutlinedInput-root": {
      fontSize: 14,
      fontFamily: "Rubik",
      cursor: "pointer",
      padding: "0px !important",
      paddingLeft: "14px !important",
      "& fieldset": { borderColor: "#D9D9D9" },
    },
    "& .MuiOutlinedInput-input": {
      cursor: "pointer",
      padding: "10px 0 !important",
    },
  },
  edit_icon_box: {
    display: "flex",
    alignItems: "center",
    paddingRight: "12px",
    cursor: "pointer",
    height: "38px",
    width: "32px",
    background: "#00000"
  },
  divider_line: {
    width: "1px",
    height: "stretch",
    backgroundColor: "#D9D9D9",
  },
  expand_more_box: {
    width: "44px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(243, 246, 251, 1)",
    cursor: "pointer",
    borderTopRightRadius: "4px",
    borderBottomRightRadius: "4px",
    flexShrink: 0,
  },
  panel_header: {
    padding: "14px 16px 8px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.5px",
    color: "rgba(0, 0, 0, 0.4)",
    fontFamily: "Rubik",
    textTransform: "uppercase",
  },
  dropdown_option_text: {
    padding: "12px 16px",
    fontFamily: "Rubik",
    fontSize: 14,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.04)",
    },
  },
  create_project_footer: {
    padding: "12px",
    color: "#2666BE",
    // border: "2px solid #2666BE",
    background: "#F0F6FE"
  },
}));

export default function ProjectDropdown({ onProjectChange, onCreateNewProject, projectId }) {
  console.log("projectId", projectId);
  const classes = useStyles();
  const anchorRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false)
  // const projectId = projectId

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      debugger
      const res = await API.getProjectsDropdownList()
      const data = await res;
      debugger
      if (data?.success && Array.isArray(data.projects)) {
        setProjects(data.projects);

        // Default to the first project if nothing is selected yet
        if (!selectedProject && data.projects.length > 0) {
          let row = data.projects.find(x => x.project_id == projectId)
          if(row) {
            handleSelect(row);
            selectedProjectId = row.project_id
          } else {
            handleSelect(data.projects[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (project) => {
    setSelectedProject(project);
    selectedProjectId = project.project_id; // update global var
    onProjectChange?.(project.project_id, project);
    setOpen(false);
    //silently update project_id in the url
    const params = new URLSearchParams(window.location.search);
    params.set("project_id", selectedProjectId);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  const openCreateNewProjectModel = () => {
    setOpen(false)
    setIsEdit(false)
    setIsModalOpen(true)
  }

  const openUpdateProjectModel = () => {
    setIsEdit(true)
    setIsModalOpen(true)
    setOpen(false)
  }

  return (
    <>
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ width: 560, position: "relative" }} ref={anchorRef}>
        {/* --- SELECTED PROJECT FIELD --- */}
        <TextField
          fullWidth
          className={classes.trigger_field}
          value={selectedProject?.project_name || ""}
          placeholder="Select a project"
          onClick={() => setOpen((prev) => !prev)}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Box sx={{ display: "flex", alignItems: "stretch", height: "stretch" }}>
                {selectedProject && (
                  <>
                    <Box
                      className={classes.edit_icon_box}
                      onClick={(e) => {
                        openUpdateProjectModel()
                        e.stopPropagation();
                        // hook up edit-project action here
                      }}
                    >
                      <EditIcon />
                          {/* <img
                            className="classes.edit_icon_box"
                            src={editInfoIcon}
                            alt=""
                            aria-hidden="true"
                          /> */}
                    </Box>
                  </>
                )}
                <Box className={classes.divider_line} sx={{ alignSelf: "center" }} />
                <Box className={classes.expand_more_box}>
                  <ExpandMoreIcon
                    sx={{
                      color: "rgba(0, 0, 0, 0.6)",
                      transform: open ? "rotate(180deg)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                  />
                </Box>
              </Box>
            ),
          }}
        />

        {/* --- DROPDOWN PANEL --- */}
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          style={{ zIndex: 10000, width: anchorRef.current?.offsetWidth }}
        >
          <Paper elevation={6} sx={{ mt: 1, borderRadius: 2, overflow: "hidden" }}>
            <Box className={classes.panel_header}>Your Projects</Box>

            <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
              {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress size={20} />
                </Box>
              )}

              {!loading && projects.length === 0 && (
                <Box sx={{ p: 2, fontSize: 13, color: "#999", textAlign: "center", fontFamily: "Rubik" }}>
                  No projects found
                </Box>
              )}

              {!loading &&
                projects.map((project) => {
                  const isSelected = selectedProject?.project_id === project.project_id;
                  return (
                    <Box
                      key={project.project_id}
                      className={classes.dropdown_option_text}
                      onClick={() => handleSelect(project)}
                      sx={{
                        backgroundColor: isSelected ? "rgba(38, 102, 190, 0.08)" : "transparent",
                        color: isSelected ? "#2666BE" : "rgba(0, 0, 0, 0.8)",
                        fontWeight: isSelected ? 500 : 400,
                      }}
                    >
                      {project.project_name}
                    </Box>
                  );
                })}
            </Box>

            {/* --- CREATE NEW PROJECT --- */}
            <Box className={classes.create_project_footer}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => openCreateNewProjectModel()}
                sx={{
                  fontFamily: "Rubik",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "6px",
                  textDecorationColor: "#2666BE",
                  py: 1,
                  border: "2px solid #2666BE",
                }}
              >
                Create new project
              </Button>
            </Box>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
            <CreateProjectForm
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={fetchProjects}
              isEdit = {isEdit}
              projectId={selectedProjectId}
            />
    </>
  );
}
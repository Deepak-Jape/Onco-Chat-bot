import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import Sidebar from '../../layout/sidebar/Sidebar'; // Imported Sidebar
import SiteIntelligenceSearch from './Common/SiteIntelligenceSearch';
import SiteIntelligenceContainer from './Common/SiteIntelligenceContainer';
import './SiteDashboard.css'; // Assuming you want to reuse the layout CSS
import MainLayout from '../../layout/mainLayout/MainLayout';
import * as API from '../../api/Profile'
import { useLocation } from "react-router-dom";

export default function SiteIntelligenceDetails() {
  debugger
  const [cohorts, setCohorts] = useState([])
  const [cohort_count, setCohorts_count] = useState(0)
  const [countries, setCountries] = useState([])
  const [countries_count, setCountries_count] = useState(0)
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const projectId = params.get("project_id");

  useEffect(() => {
    debugger
    if(!projectId) return;  
    onProjectChange(projectId, "")
  }, [projectId])

  const onProjectChange = async (project_id, project) => {
    console.log("project_id", project_id)
    console.log("project", project)

      try {
        const res = await API.getAllCohorts(project_id)
        debugger
        if (!res.success) throw new Error('Failed to fetch cohorts');
        const data = await res;
        console.log("response", res);
        setCohorts(data.cohorts);
        // setCohorts_count(data?.cohort_count);
        // setCountries(data?.countries)
        // setCountries_count(data?.country_count)
      } catch (err) {
        console.error(err);
      } finally {
        // setLoadingRecent(false);
      }
  }
  return (
    // <MainLayout>
    <div className="app-container">
      {/* 1. Added Sidebar with the active tab prop */}
      {/* <Sidebar activeTab={"SITE INTELLIGENCE"} /> */}

      {/* 2. Wrapped the content in a main area to allow the sidebar to sit next to it */}
      <main className="content-area" style={{ flexGrow: 1 }}>
        <Box
          sx={{
            background: "rgba(255, 255, 255, 1)",
            padding: "8px 14px",
            display: "flex",
            gap: "20px",
            alignItems: "center",
            borderBottom: "1px solid #eee" // Optional: adds definition below the header
          }}
        >
          <Typography
            fontSize={27}
            fontFamily={"Rubik"}
            fontWeight={500}
            color="rgba(0, 0, 0, 0.8)"
          >
            Site Intelligence
          </Typography>
          <SiteIntelligenceSearch projectId={projectId} onProjectChange={onProjectChange} />
        </Box>

        <div
          style={{
            background: "rgba(255, 255, 255, 1)",
            minHeight: "calc(100vh - 60px)", // Optional: ensures white background fills the screen
            zIndex: 1
          }}
        >
          <SiteIntelligenceContainer cohorts={cohorts} />
        </div>
      </main>
    </div>
    // </MainLayout>
  );
}

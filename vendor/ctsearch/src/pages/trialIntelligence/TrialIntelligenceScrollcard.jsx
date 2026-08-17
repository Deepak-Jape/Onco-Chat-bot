import React from "react";
import "./OncologySiteScorecardSection.css";

import ScorecardGrid from "../../component/ScorecardGrid/ScorecardGrid";

// import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import verifiedIcon from "../../assets/icons/Exp_icon.svg";
import GroupsOutlinedIcon from "../../assets/icons/patient_exp.svg";
import LayersOutlinedIcon from "../../assets/icons/multi_layer.svg";
import SpeedOutlinedIcon from "../../assets/icons/patient_speed.svg";
import HandshakeOutlinedIcon from "../../assets/icons/sponsor_trust.svg";
import PersonOutlineOutlinedIcon from "../../assets/icons/pi_bandwidth.svg";

const CARDS = [
  {
    title: "Experience & Capability",
    icon: verifiedIcon,
    body:
      "We don't just look for \"Oncology\" experience. We verify specific facility capabilities (e.g., CAR-T labs, specialized imaging) and \"Exact Match\" cohort history.",
    value:
      "Ensure the site has the physical and technical infrastructure to execute your specific protocol without delays.",
  },
  {
    title: "Patient Access",
    icon: GroupsOutlinedIcon,
    body:
      "Calculated using annual new cancer case estimates specifically within the site's catchment area.",
    value:
      "Move beyond national averages to a localized \"Patient Funnel\" backed by real-world epidemiology.",
  },
  {
    title: "Multi-Layer Trial Congestion",
    icon: LayersOutlinedIcon,
    body:
      "We audit active competing trials at the site and within the overlapping catchment area.",
    value:
      "Identify \"Recruitment Checkpoints\" where your target patients are already committed to other studies.",
  },
  {
    title: "Predicted Enrollment Speed",
    icon: SpeedOutlinedIcon,
    body:
      "We don't just look for \"Oncology\" experience. We verify specific facility capabilities (e.g., CAR-T labs, specialized imaging) and \"Exact Match\" cohort history.",
    value:
      "High-fidelity speed predictions that account for your trial's specific hurdles.",
  },
  {
    title: "Sponsor Trust",
    icon: HandshakeOutlinedIcon,
    body:
      "We calculate repeat-sponsor rates and visualize the top Pharma/Biotech companies currently utilizing the site.",
    value:
      "Identify \"Elite Partner\" sites that are institutionalized for high-quality data and predictable timelines.",
  },
  {
    title: "PI Suitability & Bandwidth",
    icon: PersonOutlineOutlinedIcon,
    body:
      "Lead Researchers are scored based on historical trial performance and current personal congestion risk.",
    value:
      "Match your protocol with the PIs who have the highest \"Headroom\" to prioritize your study.",
  },
];

export default function OncologySiteScorecardSection() {
  return (
    <ScorecardGrid
      ariaLabel="Oncology Site Scorecard"
      title="The Oncology Site Scorecard."
      subtitle={
        <>
          We help you find &amp; evaluate every site across six mission-critical
          dimensions to ensure they have the capacity and commitment to deliver your
          patients.
        </>
      }
      cards={CARDS}
    />
  );
}


import React from "react";
import "./css/ProblemSolutionSection.css";
import ProblemSolutionCards from "../../component/ProblemSolutionCards/ProblemSolutionCards";

export default function ProblemSolutionSection() {
  return (
    <ProblemSolutionCards
      className="ps-section--container7xl"
      problem={{
        kicker: "PROBLEM",
        title: "Generic AI Hallucinates. Static In-House Models Stagnate.",
        body: (
          <>
            Pharma teams are caught in a double bind. Off-the-shelf AI agents
            hallucinate high-stakes clinical data because they lack
            domain-specific grounding. At the same time, building custom
            internal LLMs requires millions of dollars, yet those models remain
            blind to daily-changing trial protocols, competitor pricing, and
            regulatory updates.
          </>
        ),
      }}
      solution={{
        kicker: "SOLUTION",
        title:
          "Traceable Oncology Intelligence, Built for Enterprise Workflows.",
        body: (
          <>
            OncoSuite bridges the gap between conversational AI and clinical
            rigor. Our AI Agent provides instant answers anchored to primary
            source documents. For enterprise R&D, our native Model Context
            Protocol (MCP) acts as a live data bridge, automatically feeding our
            daily-updated oncology datasets directly into your internal
            corporate AI tools.
          </>
        ),
      }}
    />
  );
}

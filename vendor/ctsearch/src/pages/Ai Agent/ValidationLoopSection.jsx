import React from "react";
import "./css/ValidationLoopSection.css";
import ValidationLoopBlock from "../../component/ValidationLoopBlock";

export default function ValidationLoopSection({ onBookDemo }) {
  return (
    <ValidationLoopBlock
      ariaLabel="Validation loop"
      className="vloop--container7xl"
      title="Primary Use Cases"
      cards={[
        {
          title: "Ad-Hoc Competitive Audits",
          body: (
            <>
Instantly query and synthesize competitor clinical landscapes, regulatory timelines, and multi-country trial variations during urgent strategy planning sessions.
            </>
          ),
        },
        {
          title: "Boosting Internal LLM Accuracy",
          body: (
            <>
Connect your internal corporate AI agents to OncoSuite's database via MCP. Empower your data science and R&D teams with secure access to live, high-fidelity oncology evidence.
            </>
          ),

        },
      ]}
      cta={{
        title: "Bring Clinical Truth to Your AI Strategy",
        subtitle:
          "Eliminate hallucinations and feed your internal models the hyper-granular, daily-updated oncology evidence they need.",
        buttonLabel: "Book Your Demo",
        buttonClassName: "landing-button landing-button--primary",
        onClick: onBookDemo,
      }}
    />
  );
}

import React from "react";
import "./ValidationLoopSection.css";
import ValidationLoopBlock from "../../component/ValidationLoopBlock";

export default function ValidationLoopSection({ onBookDemo }) {
  return (
    <ValidationLoopBlock
      ariaLabel="Validation loop"
      title="The OncoSuite Validation Loop"
      subtitle={
        <>
          We don&apos;t just trust the data; we verify it against the real-world
          landscape.
        </>
      }
      cards={[
        {
          title: "Cross-Referenced with Patient Intelligence",
          body: (
            <>
              We bridge the gap between &quot;Site Data&quot; and &quot;Patient
              Reality.&quot; We use ZIP-level epidemiology to verify that the target
              patient population physically resides within the catchment area of your
              selected sites.
            </>
          ),
          value: (
            <>
              No more &quot;Ghost Sites&quot; that have the equipment but lack the
              local patient density to recruit.
            </>
          ),
        },
        {
          title: "Stress-Tested by Trial Intelligence",
          body: (
            <>
              We audit the future competitive landscape. By tracking competitor trial
              start dates and protocol amendments in real-time, we ensure your PIs
              have the actual bandwidth—not just the reputation—to prioritize your
              study.
            </>
          ),
          value: (
            <>
              Protect your trial from being &quot;crowded out&quot; by a rival sponsor
              launching a similar study next door.
            </>
          ),
        },
      ]}
      cta={{
        title: "Hit Your Enrollment Targets, Every Time.",
        subtitle:
          "Join the Clinical Ops teams using OncoSuite to eliminate recruitment friction and accelerate time to market.",
        buttonLabel: "Book Your Demo",
        buttonClassName: "landing-button landing-button--primary",
        onClick: onBookDemo,
      }}
    />
  );
}


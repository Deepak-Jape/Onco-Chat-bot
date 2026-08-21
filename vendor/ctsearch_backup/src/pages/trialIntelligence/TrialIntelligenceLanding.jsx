import React, { lazy, Suspense, useCallback } from "react";

import MainHeaderOncoSuite from "../siteIntelligence/MainHeaderOncoSuite";
import useScrollRestoration from "../../utils/hooks/useScrollRestoration";

const TrialIntelligenceHeroSection = lazy(() =>
  import("./TrialIntelligenceHeroSection"),
);
const TrialIntelligenceBar = lazy(() => import("./Trialintelligencebar"));
const TrialIntelligenceProblemSolutionSection = lazy(() =>
  import("./TrialIntelligenceProblemSolutionSection"),
);
const TrialIntelligenceScorecardSection = lazy(() =>
  import("./TrialIntelligenceScorecardSection"),
);
const TrialIntelligenceUseCasesSection = lazy(() =>
  import("./TrialIntelligenceUseCasesSection"),
);
const TrialIntelligencePredictOutcomeSection = lazy(() =>
  import("./TrialIntelligencePredictOutcomeSection"),
);
const TrialIntelligenceValidationLoopSection = lazy(() =>
  import("./TrialIntelligenceValidationLoopSection"),
);
const Footer = lazy(() => import("../FirstScreen/Footer"));

function Fallback({ minHeight = 240 }) {
  return <div style={{ minHeight }} />;
}

export default function TrialIntelligenceLanding() {
  const { navigateWithScrollSaved, hiddenWhileRestoring } =
    useScrollRestoration();

  const handlePrimaryCta = useCallback(() => {
    navigateWithScrollSaved("/book-demo");
  }, [navigateWithScrollSaved]);

  return (
    <>
      <MainHeaderOncoSuite showSpacer={false} />

      <main className="landing-no-header-spacer" style={hiddenWhileRestoring}>
        <Suspense fallback={<Fallback minHeight={560} />}>
          <TrialIntelligenceHeroSection onPrimaryCta={handlePrimaryCta} />
        </Suspense>
        <Suspense fallback={<Fallback minHeight={72} />}>
          <TrialIntelligenceBar />
        </Suspense>
        <Suspense fallback={<Fallback minHeight={360} />}>
          <TrialIntelligenceProblemSolutionSection />
        </Suspense>
        <Suspense fallback={<Fallback minHeight={820} />}>
          <TrialIntelligenceScorecardSection />
        </Suspense>
        <Suspense fallback={<Fallback minHeight={820} />}>
          <TrialIntelligenceUseCasesSection />
        </Suspense>
        <Suspense fallback={<Fallback minHeight={760} />}>
          <TrialIntelligencePredictOutcomeSection />
        </Suspense>
        <Suspense fallback={<Fallback minHeight={820} />}>
          <TrialIntelligenceValidationLoopSection onBookDemo={handlePrimaryCta} />
        </Suspense>
      </main>

      <div style={hiddenWhileRestoring}>
        <Suspense fallback={<Fallback minHeight={220} />}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
}

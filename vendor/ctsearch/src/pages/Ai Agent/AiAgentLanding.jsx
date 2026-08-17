import React, { lazy, Suspense, useCallback } from "react";

import MainHeaderOncoSuite from "./MainHeaderOncoSuite";
import useScrollRestoration from "../../utils/hooks/useScrollRestoration";
const AiAgentHeroSection = lazy(() =>
  import("./AiAgentHeroSection"),
);
const FueledByBar = lazy(() => import("./FueledByBar"));
const ProblemSolutionSection = lazy(() => import("./ProblemSolutionSection"));
const OncologySiteScorecardSection = lazy(() =>
  import("./OncologySiteScorecardSection"),
);
// const PredictOutcomeSection = lazy(() => import("./PredictOutcomeSection"));
const ValidationLoopSection = lazy(() => import("./ValidationLoopSection"));
const Footer = lazy(() => import("../FirstScreen/Footer"));

function Fallback({ minHeight = 240 }) {
  return <div style={{ minHeight }} />;
}

export default function AiAgentLanding() {
  const { navigateWithScrollSaved, hiddenWhileRestoring } =
    useScrollRestoration();

  const handlePrimaryCta = useCallback(() => {
    navigateWithScrollSaved("/book-demo");
  }, [navigateWithScrollSaved]);

  return (
    <>
      <MainHeaderOncoSuite showSpacer />

      <main style={hiddenWhileRestoring}>
        <Suspense fallback={<Fallback minHeight={560} />}>
          <AiAgentHeroSection onPrimaryCta={handlePrimaryCta} />
        </Suspense>
        <Suspense fallback={<Fallback minHeight={72} />}>
          <FueledByBar />
        </Suspense>
        <Suspense fallback={<Fallback minHeight={360} />}>
          <ProblemSolutionSection />
        </Suspense>
        <Suspense fallback={<Fallback minHeight={820} />}>
          <OncologySiteScorecardSection />
        </Suspense>
        <Suspense fallback={<Fallback minHeight={820} />}>
          <ValidationLoopSection onBookDemo={handlePrimaryCta} />
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

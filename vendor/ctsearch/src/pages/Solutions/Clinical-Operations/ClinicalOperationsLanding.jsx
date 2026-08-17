import React, { lazy, Suspense, useCallback } from "react";

import MainHeaderOncoSuite from "../../siteIntelligence/MainHeaderOncoSuite";
import useScrollRestoration from "../../../utils/hooks/useScrollRestoration";

const ClinicalOperationsHeroSection = lazy(() =>
  import("./ClinicalOperationsHeroSection"),
);

const ClinicalOperationsProblemSolutionSection = lazy(() =>
  import("./ClinicalOperationsProblemSolutionSection"),
);
const ClinicalOperationsUseCasesSection = lazy(() =>
  import("./ClinicalOperationsUseCasesSection"),
);
const ClinicalOperationsWorkFlowSection = lazy(() =>
  import("./ClinicalOperationsWorkFlowSection"),
);
const ClinicalOperationsCtaSection = lazy(() =>
  import("./ClinicalOperationsCtaSection"),
);
const Footer = lazy(() => import("../../FirstScreen/Footer"));

function Fallback({ minHeight = 240 }) {
  return <div style={{ minHeight }} />;
}

export default function ClinicalOperationsLanding() {
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
          <ClinicalOperationsHeroSection onPrimaryCta={handlePrimaryCta} />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={360} />}>
          <ClinicalOperationsProblemSolutionSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={720} />}>
          <ClinicalOperationsUseCasesSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={500} />}>
          <ClinicalOperationsWorkFlowSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={520} />}>
          <ClinicalOperationsCtaSection onBookDemo={handlePrimaryCta} />
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

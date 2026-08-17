import React, { lazy, Suspense, useCallback } from "react";

import MainHeaderOncoSuite from "../../siteIntelligence/MainHeaderOncoSuite";
import useScrollRestoration from "../../../utils/hooks/useScrollRestoration";

const ClinicalIntelligenceHeroSection = lazy(() =>
  import("./ClinicalIntelligenceHeroSection"),
);
const ClinicalDevelopmentProblemSolutionSection = lazy(() =>
  import("./ClinicalDevelopmentProblemSolutionSection"),
);
const ClinicalDevelopmentUseCasesSection = lazy(() =>
  import("./ClinicalDevelopmentUseCasesSection"),
);
const ClinicalDevelopmentAuditLoopSection = lazy(() =>
  import("./ClinicalDevelopmentAuditLoopSection"),
);
const ClinicalDevelopmentCtaSection = lazy(() =>
  import("./ClinicalDevelopmentCtaSection"),
);
const Footer = lazy(() => import("../../FirstScreen/Footer"));

function Fallback({ minHeight = 240 }) {
  return <div style={{ minHeight }} />;
}

export default function ClinicalDevelopmentLanding() {
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
          <ClinicalIntelligenceHeroSection onPrimaryCta={handlePrimaryCta} />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={360} />}>
          <ClinicalDevelopmentProblemSolutionSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={720} />}>
          <ClinicalDevelopmentUseCasesSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={860} />}>
          <ClinicalDevelopmentAuditLoopSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={520} />}>
          <ClinicalDevelopmentCtaSection onBookDemo={handlePrimaryCta} />
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

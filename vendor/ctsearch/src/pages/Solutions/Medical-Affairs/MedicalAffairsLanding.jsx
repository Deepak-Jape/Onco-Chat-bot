import React, { lazy, Suspense, useCallback } from "react";

import MainHeaderOncoSuite from "../../siteIntelligence/MainHeaderOncoSuite";
import useScrollRestoration from "../../../utils/hooks/useScrollRestoration";

const MedicalAffairsHeroSection = lazy(() =>
  import("./MedicalAffairsHeroSection"),
);

const MedicalAffairsProblemSolutionSection = lazy(() =>
  import("./MedicalAffairsProblemSolutionSection"),
);
const MedicalAffairsUseCasesSection = lazy(() =>
  import("./MedicalAffairsUseCasesSection"),
);
const MedicalAffairsWorkFlowSection = lazy(() =>
  import("./MedicalAffairsWorkFlowSection"),
);
const MedicalAffairsCtaSection = lazy(() =>
  import("./MedicalAffairsCtaSection"),
);
const Footer = lazy(() => import("../../FirstScreen/Footer"));

function Fallback({ minHeight = 240 }) {
  return <div style={{ minHeight }} />;
}

export default function MedicalAffairsLanding() {
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
          <MedicalAffairsHeroSection onPrimaryCta={handlePrimaryCta} />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={360} />}>
          <MedicalAffairsProblemSolutionSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={720} />}>
          <MedicalAffairsUseCasesSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={500} />}>
          <MedicalAffairsWorkFlowSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={520} />}>
          <MedicalAffairsCtaSection onBookDemo={handlePrimaryCta} />
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

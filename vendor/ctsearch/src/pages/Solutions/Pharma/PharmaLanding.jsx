import React, { lazy, Suspense, useCallback } from "react";

import MainHeaderOncoSuite from "../../siteIntelligence/MainHeaderOncoSuite";
import useScrollRestoration from "../../../utils/hooks/useScrollRestoration";

const PharmaHeroSection = lazy(() =>
  import("./PharmaHeroSection"),
);

const PharmaProblemSolutionSection = lazy(() =>
  import("./PharmaProblemSolutionSection"),
);
const PharmaUseCasesSection = lazy(() =>
  import("./PharmaUseCasesSection"),
);
const PharmaWorkFlowSection = lazy(() =>
  import("./PharmaWorkFlowSection"),
);
const PharmaCtaSection = lazy(() =>
  import("./PharmaCtaSection"),
);
const Footer = lazy(() => import("../../FirstScreen/Footer"));

function Fallback({ minHeight = 240 }) {
  return <div style={{ minHeight }} />;
}

export default function PharmaLanding() {
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
          <PharmaHeroSection onPrimaryCta={handlePrimaryCta} />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={360} />}>
          <PharmaProblemSolutionSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={720} />}>
          <PharmaUseCasesSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={500} />}>
          <PharmaWorkFlowSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={520} />}>
          <PharmaCtaSection onBookDemo={handlePrimaryCta} />
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

import React, { lazy, Suspense, useCallback } from "react";

import MainHeaderOncoSuite from "../../siteIntelligence/MainHeaderOncoSuite";
import useScrollRestoration from "../../../utils/hooks/useScrollRestoration";

const BiotechHeroSection = lazy(() =>
  import("./Biotechherosection"),
);

const BiotechProblemSolutionSection = lazy(() =>
  import("./BiotechProblemSolutionSection"),
);

const BiotechUseCasesSection = lazy(() =>
  import("./BiotechUseCasesSection"),
);

const BiotechWorkflowSection = lazy(() =>
  import("./BiotechWorkflowSection"),
);

const BiotechCtaSection = lazy(() =>
  import("./BiotechCtaSection"),
);

const Footer = lazy(() => import("../../FirstScreen/Footer"));

function Fallback({ minHeight = 240 }) {
  return <div style={{ minHeight }} />;
}

export default function BiotechLanding() {
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
          <BiotechHeroSection onPrimaryCta={handlePrimaryCta} />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={360} />}>
          <BiotechProblemSolutionSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={720} />}>
          <BiotechUseCasesSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={420} />}>
          <BiotechWorkflowSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={340} />}>
          <BiotechCtaSection onBookDemo={handlePrimaryCta} />
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

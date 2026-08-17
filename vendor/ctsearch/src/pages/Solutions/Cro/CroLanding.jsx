import React, { lazy, Suspense, useCallback } from "react";

import MainHeaderOncoSuite from "../../siteIntelligence/MainHeaderOncoSuite";
import useScrollRestoration from "../../../utils/hooks/useScrollRestoration";

const CroHeroSection = lazy(() =>
  import("./CroHeroSection"),
);

const CroProblemSolutionSection = lazy(() =>
  import("./CroProblemSolutionSection"),
);
const CroUseCasesSection = lazy(() =>
  import("./CroUseCasesSection"),
);
const CroWorkFlowSection = lazy(() =>
  import("./CroWorkFlowSection"),
);
const CroCtaSection = lazy(() =>
  import("./CroCtaSection"),
);
const Footer = lazy(() => import("../../FirstScreen/Footer"));

function Fallback({ minHeight = 240 }) {
  return <div style={{ minHeight }} />;
}

export default function CroLanding() {
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
          <CroHeroSection onPrimaryCta={handlePrimaryCta} />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={360} />}>
          <CroProblemSolutionSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={720} />}>
          <CroUseCasesSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={500} />}>
          <CroWorkFlowSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={520} />}>
          <CroCtaSection onBookDemo={handlePrimaryCta} />
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

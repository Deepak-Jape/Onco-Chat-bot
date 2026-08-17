import React, { lazy, Suspense, useCallback } from "react";

import MainHeaderOncoSuite from "../../siteIntelligence/MainHeaderOncoSuite";
import useScrollRestoration from "../../../utils/hooks/useScrollRestoration";

const PortfolioManagementHeroSection = lazy(() =>
  import("./PortfoliomanagemnetHero"),
);

const PortfolioProblemSolutionSection = lazy(() =>
  import("./PortfolioProblemSolutionSection"),
);

const PortfolioUseCasesSection = lazy(() =>
  import("./PortfolioUseCasesSection"),
);

const PortfolioWorkflowSection = lazy(() =>
  import("./Portfolioworkflowsection"),
);

const PortfolioCtaSection = lazy(() => import("./PortfolioCtaSection"));

const Footer = lazy(() => import("../../FirstScreen/Footer"));

function Fallback({ minHeight = 240 }) {
  return <div style={{ minHeight }} />;
}

export default function PortfolioManagementLanding() {
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
          <PortfolioManagementHeroSection onPrimaryCta={handlePrimaryCta} />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={360} />}>
          <PortfolioProblemSolutionSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={720} />}>
          <PortfolioUseCasesSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={420} />}>
          <PortfolioWorkflowSection />
        </Suspense>

        <Suspense fallback={<Fallback minHeight={340} />}>
          <PortfolioCtaSection onBookDemo={handlePrimaryCta} />
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

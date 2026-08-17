import { useState } from "react";
import demographicsData from "./populationDemographicsData.json";
import HorizontalBar from "./HorizontalBar";

import LazyChartWrapper from "../../../hooks/LazyChartWrapper";
import TrialsDrawer from "./TrialsDrawer";
import {
  CustomHorizontalTooltip,
  StudyResultsToggle,
  DemographicCard,
  VerticalBar,
  GenderPie,
} from "../../../utils/helpers/Demographic.helpers";

export default function PopulationDemographics({
  loadedCharts,
  setLoadedCharts,
  hasUserScrolled,
  scrollRef,
}) {
  const [demoMode, setDemoMode] = useState("observed");
  const [eligibilityMode, setEligibilityMode] = useState("observed");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPayload, setDrawerPayload] = useState({
    title: "",
    data: [],
    columns: [],
  });

  const openTrialsDrawer = ({ title, columns, rows }) => {
    setDrawerPayload({
      title,
      data: rows,
      columns,
    });
    setDrawerOpen(true);
  };

  const handleTrialsClick = (title, trialsKey) => {
    openTrialsDrawer(
      `${title} – Trials`,
      trialsKey?.trials || [], // safe fallback
    );
  };
  const ageDrawerConfig = {
    title: `${demographicsData.trialsCount} Trials – Age`,
    type: "age",
    columns: [
      { key: "name", label: "OncoSuite ID and Name", width: "2fr" },
      { key: "n", label: "N" },
      { key: "ageRange", label: "Age Range" },
      { key: "action", label: "Action" },
    ],
    rows: demographicsData.age.trials,
  };

  const genderDrawerConfig = {
    title: `${demographicsData.trialsCount} Trials – Gender`,
    columns: [
      { key: "name", label: "OncoSuite ID and Name", width: "2fr" },
      { key: "n", label: "N" },
      { key: "female", label: "Female" },
      { key: "male", label: "Male" },
      { key: "action", label: "Action" },
    ],
    rows: demographicsData.gender.trials,
  };

  const countriesDrawerConfig = {
    title: `${demographicsData.trialsCount} Trials – Countries`,
    columns: [
      { key: "name", label: "OncoSuite ID and Name", width: "2fr" },
      { key: "n", label: "N" },
      { key: "countries", label: "Countries" },
      { key: "action", label: "Action" },
    ],
    rows: demographicsData.countries.trials,
  };

  return (
    <div style={{ marginTop: 32 }}>
      {/*  POPULATION DEMOGRAPHICS  */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontWeight: 500,
            fontSize: "23px",
            fontFamily: "Rubik",
            color: "rgba(0,0,0,0.8)",
            margin: 0,
          }}
        >
          Population Demographics
        </h3>

        <StudyResultsToggle mode={demoMode} setMode={setDemoMode} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <LazyChartWrapper
          chartKey="age"
          loadedCharts={loadedCharts}
          setLoadedCharts={setLoadedCharts}
          hasUserScrolled={hasUserScrolled}
          scrollRef={scrollRef}
        >
          <DemographicCard
            title="Age"
            trials={demographicsData.trialsCount}
            observedData={demographicsData.age.observed}
            plannedData={demographicsData.age.planned}
            chartType="verticalBar"
            isLoaded={loadedCharts.age}
            mode={demoMode}
            onTrialsClick={() => openTrialsDrawer(ageDrawerConfig)}
          >
            {(data) => <VerticalBar data={data} />}
          </DemographicCard>
        </LazyChartWrapper>
        <LazyChartWrapper
          chartKey="gender"
          loadedCharts={loadedCharts}
          setLoadedCharts={setLoadedCharts}
          hasUserScrolled={hasUserScrolled}
          scrollRef={scrollRef}
        >
          <DemographicCard
            title="Gender"
            trials={demographicsData.trialsCount}
            observedData={demographicsData.gender.observed}
            plannedData={demographicsData.gender.planned}
            chartType="pie"
            isLoaded={loadedCharts.gender}
            mode={demoMode}
            onTrialsClick={() => openTrialsDrawer(genderDrawerConfig)}
          >
            {(data) => <GenderPie data={data} />}
          </DemographicCard>
        </LazyChartWrapper>
        <LazyChartWrapper
          chartKey="countries"
          loadedCharts={loadedCharts}
          setLoadedCharts={setLoadedCharts}
          hasUserScrolled={hasUserScrolled}
          scrollRef={scrollRef}
        >
          <DemographicCard
            title="Countries"
            trials={demographicsData.trialsCount}
            observedData={demographicsData.countries.observed}
            plannedData={demographicsData.countries.planned}
            chartType="horizontalBar"
            mode={demoMode}
            isLoaded={loadedCharts.countries}
            onTrialsClick={() => openTrialsDrawer(countriesDrawerConfig)}
          >
            {(data) => <HorizontalBar data={data} />}
          </DemographicCard>
        </LazyChartWrapper>
        <LazyChartWrapper
          chartKey="ethnicity"
          loadedCharts={loadedCharts}
          setLoadedCharts={setLoadedCharts}
          hasUserScrolled={hasUserScrolled}
          scrollRef={scrollRef}
        >
          <DemographicCard
            title="Ethnicity"
            trials={demographicsData.trialsCount}
            observedData={demographicsData.ethnicity.observed}
            plannedData={demographicsData.ethnicity.planned}
            chartType="horizontalBar"
            isLoaded={loadedCharts.ethnicity}
            mode={demoMode}
            onTrialsClick={() =>
              handleTrialsClick("Ethnicity", demographicsData.ethnicity)
            }
          >
            {(data) => <HorizontalBar data={data} />}
          </DemographicCard>
        </LazyChartWrapper>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "32px 0 16px",
        }}
      >
        <h3
          style={{
            fontWeight: 500,
            margin: 0,
            fontSize: "23px",
            fontFamily: "Rubik",
            color: "rgba(0, 0, 0, 0.8)",
          }}
        >
          Eligibility Criteria
        </h3>

        <StudyResultsToggle
          mode={eligibilityMode}
          setMode={setEligibilityMode}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        <LazyChartWrapper
          chartKey="lineOfTherapy"
          loadedCharts={loadedCharts}
          setLoadedCharts={setLoadedCharts}
          hasUserScrolled={hasUserScrolled}
          scrollRef={scrollRef}
        >
          <DemographicCard
            title="Line of Therapy"
            trials={demographicsData.trialsCount}
            observedData={demographicsData.lineOfTherapy.observed}
            plannedData={demographicsData.lineOfTherapy.planned}
            chartType="horizontalBar"
            isLoaded={loadedCharts.lineOfTherapy}
            mode={eligibilityMode}
            onTrialsClick={() =>
              handleTrialsClick(
                "Line of Therapy",
                demographicsData.lineOfTherapy,
              )
            }
          >
            {(data) => <HorizontalBar data={data} />}
          </DemographicCard>
        </LazyChartWrapper>
        <LazyChartWrapper
          chartKey="cancerStage"
          loadedCharts={loadedCharts}
          setLoadedCharts={setLoadedCharts}
          hasUserScrolled={hasUserScrolled}
          scrollRef={scrollRef}
        >
          <DemographicCard
            title="Cancer Stage"
            trials={demographicsData.trialsCount}
            observedData={demographicsData.eligibility.cancerStage.observed}
            plannedData={demographicsData.eligibility.cancerStage.planned}
            chartType="horizontalBar"
            isLoaded={loadedCharts.cancerStage}
            mode={eligibilityMode}
            onTrialsClick={() =>
              handleTrialsClick(
                "Cancer Stage",
                demographicsData.eligibility.cancerStage,
              )
            }
          >
            {(data) => <HorizontalBar data={data} />}
          </DemographicCard>
        </LazyChartWrapper>

        <LazyChartWrapper
          chartKey="biomarkers"
          loadedCharts={loadedCharts}
          setLoadedCharts={setLoadedCharts}
          hasUserScrolled={hasUserScrolled}
          scrollRef={scrollRef}
        >
          <DemographicCard
            title="Biomarkers"
            trials={demographicsData.trialsCount}
            observedData={demographicsData.eligibility.biomarkers.observed}
            plannedData={demographicsData.eligibility.biomarkers.planned}
            chartType="horizontalBar"
            isLoaded={loadedCharts.biomarkers}
            mode={eligibilityMode}
            onTrialsClick={() =>
              handleTrialsClick(
                "Biomarkers",
                demographicsData.eligibility.biomarkers,
              )
            }
          >
            {(data) => <HorizontalBar data={data} />}
          </DemographicCard>
        </LazyChartWrapper>

        <LazyChartWrapper
          chartKey="coMorbidity"
          loadedCharts={loadedCharts}
          setLoadedCharts={setLoadedCharts}
          hasUserScrolled={hasUserScrolled}
          scrollRef={scrollRef}
        >
          <DemographicCard
            title="Co-morbidity"
            trials={demographicsData.trialsCount}
            observedData={demographicsData.eligibility.coMorbidity.observed}
            plannedData={demographicsData.eligibility.coMorbidity.planned}
            chartType="horizontalBar"
            isLoaded={loadedCharts.coMorbidity}
            mode={eligibilityMode}
            onTrialsClick={() =>
              handleTrialsClick(
                "Co-morbidity",
                demographicsData.eligibility.coMorbidity,
              )
            }
          >
            {(data) => <HorizontalBar data={data} />}
          </DemographicCard>
        </LazyChartWrapper>

        <LazyChartWrapper
          chartKey="priorTreatment"
          loadedCharts={loadedCharts}
          setLoadedCharts={setLoadedCharts}
          hasUserScrolled={hasUserScrolled}
          scrollRef={scrollRef}
        >
          <DemographicCard
            title="Prior Treatment"
            trials={demographicsData.trialsCount}
            observedData={demographicsData.eligibility.priorTreatment.observed}
            plannedData={demographicsData.eligibility.priorTreatment.planned}
            chartType="horizontalBar"
            isLoaded={loadedCharts.priorTreatment}
            mode={eligibilityMode}
            onTrialsClick={() =>
              handleTrialsClick(
                "Prior Treatment",
                demographicsData.eligibility.priorTreatment,
              )
            }
          >
            {(data) => <HorizontalBar data={data} />}
          </DemographicCard>
        </LazyChartWrapper>

        <LazyChartWrapper
          chartKey="ecog"
          loadedCharts={loadedCharts}
          setLoadedCharts={setLoadedCharts}
          hasUserScrolled={hasUserScrolled}
          scrollRef={scrollRef}
        >
          <DemographicCard
            title="ECOG"
            trials={demographicsData.trialsCount}
            observedData={demographicsData.eligibility.ecog.observed}
            plannedData={demographicsData.eligibility.ecog.planned}
            chartType="horizontalBar"
            isLoaded={loadedCharts.ecog}
            mode={eligibilityMode}
            onTrialsClick={() =>
              handleTrialsClick("ECOG", demographicsData.eligibility.ecog)
            }
          >
            {(data) => <HorizontalBar data={data} />}
          </DemographicCard>
        </LazyChartWrapper>
      </div>
      <TrialsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerPayload.title}
        data={drawerPayload.data}
        columns={drawerPayload.columns}
      />
    </div>
  );
}

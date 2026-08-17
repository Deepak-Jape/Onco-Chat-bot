import { Box, Typography, Chip, Divider } from "@mui/material";
import DrugDetailSkeleton from "../DrugDetailSkeleton";
import bulletIcon from "../../../assets/pointer.svg";
import CommonTableCard from "../../../common/CommonTableCard";
import GuidelineTableCard from "../../../common/GuidelineTableCard";

export default function GuidelineDetailPanel({ guideline, loading }) {
  if (loading) return <DrugDetailSkeleton />;

  if (!guideline) {
    return (
      <Box p={3}>
        <Typography color="rgba(0,0,0,0.6)">
          Select a guideline to view details
        </Typography>
      </Box>
    );
  }

  const {
    title = "",
    meta = {},
    regulatoryStance = {},
    endpointFramework = { columns: [], rows: [] },
    eligibilityPopulation = { sections: [] },
    biomarkerRequirements = { columns: [], rows: [] },
    comparatorExpectations = {
      regulatoryPrinciple: {},
      standardOfCare: [],
      placeboConsiderations: "",
    },
    safetyMonitoring = { summary: [], aesI: [] },
    regulatoryPrecedents = { columns: [], rows: [] },
  } = guideline || {};

  return (
    <Box sx={{ px: 3, py: 2, fontFamily: "Rubik" }}>
      {/*HEADER */}
      <Card>
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Typography
              fontSize={28}
              fontWeight={500}
              fontFamily="Rubik"
              color="rgba(0, 0, 0, 0.9)"
            >
              {title}
            </Typography>
            <Typography
              fontSize={16}
              color="rgba(0,0,0,0.6)"
              fontFamily="Rubik"
            >
              {meta?.regulatory || "—"} • {meta?.phase || "—"} •{" "}
              {meta?.approvalType || "—"}
            </Typography>
          </Box>

          <Chip
            label={`Updated ${meta?.updated || "—"}`}
            sx={{
              bgcolor: "#F0F0F3",
              color: "#80838D",
              fontSize: "14px",
              fontFamily: "Rubik",
            }}
          />
        </Box>

        {/* Regulatory Stance */}
        <Box
          mt={3}
          p={2}
          sx={{
            bgcolor: "rgba(254, 246, 238, 1)",
            borderRadius: "8px",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "1px 8px 34px rgba(153, 169, 190, 0.1)",
          }}
        >
          <Typography
            fontSize={17}
            fontWeight={500}
            color="rgba(193, 102, 13, 1)"
            fontFamily="Rubik"
          >
            {regulatoryStance.title}
          </Typography>

          <Typography fontSize={13} color="rgba(0,0,0,0.6)" fontFamily="Rubik">
            {regulatoryStance.description}
          </Typography>
        </Box>
      </Card>

      {/* ENDPOINT FRAMEWORK */}
      <SectionHeader>Endpoint Framework</SectionHeader>
      <Box
        sx={{
          // p: 2,
          mb: 3,
          color: "rgba(0, 0, 0, 0.8)",
          fontFamily: "Rubik",
          textAlign: "left",
        }}
      >
        <GuidelineTableCard
          title="Endpoint Framework"
          columns={[
            { label: "Endpoint", key: "endpoint" },
            { label: "Accepted as Primary", key: "primary" },
            { label: "Context", key: "context" },
            { label: "Precedent Strength", key: "strength" },
          ]}
          data={endpointFramework.rows}
        />
      </Box>

      {/* ELIGIBILITY  */}
      <SectionHeader>Eligibility & Population</SectionHeader>
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} rowGap={0}>
        {eligibilityPopulation.sections.map((item, i) => (
          <Card key={i}>
            <Typography
              fontSize={17}
              fontWeight={500}
              fontFamily="Rubik"
              color="rgba(0, 0, 0, 0.8)"
            >
              {item.title}
            </Typography>
            <Typography
              fontSize={14}
              color="rgba(0,0,0,0.6)"
              fontFamily="Rubik"
            >
              {item.summary}
            </Typography>
            <Box mt={1} p={1} bgcolor="#F9F9FB">
              <Typography
                fontSize={13}
                color="rgba(0,0,0,0.6)"
                fontFamily="Rubik"
              >
                {item.note}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {/*  BIOMARKERS */}
      <SectionHeader>Biomarker Requirements</SectionHeader>
      <GuidelineTableCard
        title="Biomarker Requirements"
        columns={[
          { label: "Biomarker", key: "biomarker" },
          { label: "Status", key: "status" },
          { label: "Usage", key: "usage" },
          { label: "Testing", key: "testing" },
          { label: "Notes", key: "notes" },
        ]}
        data={biomarkerRequirements.rows}
      />


      {/* COMPARATOR  */}
      <SectionHeader>Comparator & Standard of Care Expectations</SectionHeader>
      <Card>
        <Typography
          fontSize={17}
          fontWeight={500}
          fontFamily="Rubik"
          color="rgba(0, 0, 0, 0.8)"
        >
          Regulatory Principle
        </Typography>

        <Typography fontSize={14} color="rgba(0,0,0,0.6)" fontFamily="Rubik">
          {comparatorExpectations.regulatoryPrinciple?.description || "—"}
        </Typography>

        <Box p={1} mt={1} mb={1} bgcolor="#F9F9FB">
          <Typography
            fontSize={13}
            fontFamily="Rubik"
            color="rgba(0, 0, 0, 0.6)"
          >
            {comparatorExpectations.regulatoryPrinciple.note || "—"}
          </Typography>
        </Box>

        <Typography
          fontSize={17}
          fontWeight={500}
          fontFamily="Rubik"
          color="rgba(0, 0, 0, 0.8)"
        >
          Observed Standard of Care (from precedent trials)
        </Typography>

        <Box mt={2}>
          {(comparatorExpectations.standardOfCare || []).map((s, i) => (
            <Bullet key={i}>{s}</Bullet>
          ))}
        </Box>

        <Box mt={2} p={1} bgcolor="#F9F9FB">
          <Typography
            fontSize={17}
            fontWeight={500}
            fontFamily="Rubik"
            color="rgba(0, 0, 0, 0.8)"
          >
            Placebo Considerations
          </Typography>
          <Typography
            fontSize={14}
            color="rgba(0, 0, 0, 0.6)"
            fontFamily="Rubik"
          >
            {comparatorExpectations.placeboConsiderations || "—"}
          </Typography>
        </Box>
      </Card>

      {/* SAFETY */}
      <SectionHeader>Safety & Monitoring Requirements</SectionHeader>
      <Card>
        <Box display="grid" gridTemplateColumns="repeat(4,1fr)" gap={2}>
          {safetyMonitoring.summary.map((s, i) => (
            <GridItem key={i} label={s.label} value={s.value} />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography
          fontSize={14}
          fontWeight={500}
          fontFamily="Rubik"
          color="rgba(0, 0, 0, 0.8)"
          mb={1}
        >
          {safetyMonitoring.aesITitle}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, max-content)", 
            gap: "8px 12px",
            alignItems: "flex-start",
          }}
        >
          {safetyMonitoring.aesI.map((a, i) => (
            <Chip
              key={i}
              label={a}
              sx={{
                bgcolor: "#EAF2FF",
                color: "#2F80ED",
                fontFamily: "Rubik",
                fontSize: "13px",
                fontWeight: 500,
                height: "auto",
                py: "4px",
                borderRadius: "16px",

                whiteSpace: "nowrap",
                justifySelf: "start",
              }}
            />
          ))}
        </Box>

        <Box
          mt={3}
          p={2}
          sx={{
            bgcolor: "rgba(254, 246, 238, 1)",
            borderRadius: "8px",
            border: "1px solid rgba(0, 0, 0, 0.05)", 
            boxShadow: "1px 8px 34px rgba(153, 169, 190, 0.1)", 
          }}
        >
          <Typography
            fontSize={14}
            fontWeight={500}
            color="rgba(193, 102, 13, 1)"
            fontFamily="Rubik"
          >
            Stopping Rules
          </Typography>
          <Typography
            fontSize={13}
            fontFamily="Rubik"
            color="rgba(0, 0, 0, 0.6)"
          >
            {safetyMonitoring.stoppingRules}
          </Typography>
        </Box>
      </Card>

      {/* PRECEDENTS */}
      <SectionHeader>Regulatory Precedent Examples</SectionHeader>
      <GuidelineTableCard
        title="Regulatory Precedent Examples"
        columns={[
          { label: "Drug / Regimen", key: "drug" },
          { label: "Indication", key: "indication" },
          { label: "Approval Basis", key: "basis" },
          { label: "Significance", key: "significance" },
        ]}
        data={regulatoryPrecedents.rows}
      />
    </Box>
  );
}
const Card = ({ children }) => (
  <Box
    sx={{
      p: 2,
      mb: 3,
      borderRadius: 1,
      border: "1px solid rgba(0,0,0,0.05)",
      boxShadow: "1px 8px 34px rgba(153,168,190,0.1)",
      bgcolor: "#fff",
      color: "rgba(0, 0, 0, 0.8)",
      fontFamily: "Rubik",
      textAlign: "left",
    }}
  >
    {children}
  </Box>
);

const SectionHeader = ({ children }) => (
  <Typography
    fontSize={23}
    fontWeight={500}
    mb={1}
    fontFamily="Rubik"
    textAlign="left"
    mt={2}
  >
    {children}
  </Typography>
);

const GridItem = ({ label, value }) => (
  <Box>
    <Typography
      fontSize={13}
      color="rgba(0, 0, 0, 0.6)"
      fontFamily="Rubik"
      textAlign="left"
      mb={0.25}
    >
      {label}
    </Typography>

    <Typography
      fontSize={14}
      fontWeight={500}
      color="rgba(0, 0, 0, 0.8)"
      fontFamily="Rubik"
      textAlign="left"
    >
      {value}
    </Typography>
  </Box>
);

const Bullet = ({ children }) => (
  <Box display="flex" alignItems="flex-start" mb={1}>
    <Box
      component="img"
      src={bulletIcon} 
      alt="bullet"
      sx={{
        width: 18,
        height: 18,
        mt: "2px",
        mr: 1,
      }}
    />

    <Typography
      fontSize={14}
      color="rgba(0,0,0,0.6)"
      fontFamily="Rubik"
      lineHeight="20px"
    >
      {children}
    </Typography>
  </Box>
);

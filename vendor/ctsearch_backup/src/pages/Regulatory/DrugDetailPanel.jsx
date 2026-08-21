import { Box, Typography, Chip, Divider } from "@mui/material";
import ApprovalTimeline from "./ApprovalTimeline";
import bulletIcon from "../../assets/pointer.svg";
import DrugDetailSkeleton from "./DrugDetailSkeleton";
import { useState, useEffect } from "react";
import Download from "../../assets/icons/download_icon.svg";
import Share from "../../assets/icons/share_icon.svg";

export default function DrugDetailPanel({ drug, loading }) {
  if (loading) {
    return <DrugDetailSkeleton />;
  }
  if (!drug) {
    return (
      <Box p={3}>
        <Typography color="rgba(0,0,0,0.6)">
          Select a drug to view details
        </Typography>
      </Box>
    );
  }

  const reg = drug.regulatoryAcceptance;

  return (
    <Box sx={{ px: 3, py: 2, fontFamily: "Rubik" }}>
      {/* HEADER */}
      <Card>
        {/* HEADER ROW  */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              fontSize={28}
              fontWeight={500}
              lineHeight="34px"
              fontFamily="Rubik"
              color="rgba(0, 0, 0, 0.9)"
            >
              {drug.name}
            </Typography>
            <Typography
              fontSize={16}
              color="rgba(0,0,0,0.6)"
              fontFamily="Rubik"
              textAlign="left"
            >
              {drug.brand}
            </Typography>
          </Box>

          <Chip
            label={drug.class}
            sx={{
              bgcolor: "#FDE9D6",
              color: "#C1660D",
              height: 28,
              fontSize: 14,
              fontWeight: 400,
              fontFamily: "Rubik",
            }}
          />
        </Box>

        {/* MOLECULE */}
        <Box mt={2}>
          <Typography
            fontSize={13}
            color="rgba(0,0,0,0.6)"
            textAlign="left"
            fontFamily="Rubik"
          >
            Molecule
          </Typography>
          <Typography
            fontSize={14}
            fontWeight={500}
            color="rgba(0, 0, 0, 0.8)"
            fontFamily="Rubik"
            textAlign="left"
          >
            {drug.molecule}
          </Typography>
        </Box>

        {/*  REGULATORY ACCEPTANCE */}
        <Box
          mt={3}
          p={2}
          sx={{
            bgcolor: "#F9F9FB",
            borderRadius: "8px",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <Typography
            fontSize={16}
            fontWeight={500}
            mb={2}
            fontFamily="Rubik"
            color="rgba(0, 0, 0, 0.8)"
            textAlign="left"
          >
            Regulatory Acceptance Pattern
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 2,
            }}
          >
            <InfoBlock label="Approval type:" value={reg?.approvalType} />
            <InfoBlock
              label="Evidence archetype:"
              value={reg?.evidenceArchetype}
            />
            <InfoBlock
              label="Biomarker-defined:"
              value={reg?.biomarkerDefined}
            />
            <InfoBlock label="Line of therapy:" value={reg?.lineOfTherapy} />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography
            fontSize={13}
            color="rgba(0,0,0,0.6)"
            fontFamily="Rubik"
            textAlign="left"
          >
            Primary endpoints accepted:
          </Typography>
          <Typography
            fontSize={14}
            fontWeight={500}
            fontFamily="Rubik"
            textAlign="left"
          >
            {reg?.primaryEndpoints?.initial}{" "}
            <span
              style={{
                fontWeight: 400,
                color: "rgba(0,0,0,0.6)",
                fontFamily: "Rubik",
              }}
            >
              (initial)
            </span>
            &nbsp;&nbsp;&nbsp;
            {reg?.primaryEndpoints?.confirmatory?.join("/")}{" "}
            <span
              style={{
                fontWeight: 400,
                color: "rgba(0,0,0,0.6)",
                fontFamily: "Rubik",
              }}
            >
              (confirmatory)
            </span>
          </Typography>
        </Box>
        <Box
          sx={{
            mt: 3,
            p: 2,
            mb: 3,
            bgcolor: "#F0F6FE",
            borderRadius: "8px",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <Typography
            fontSize={17}
            fontWeight={500}
            mb={1}
            fontFamily="Rubik"
            textAlign="left"
          >
            Precedent Strength Rationale
          </Typography>
          <Typography
            fontSize={13}
            color="rgba(0,0,0,0.6)"
            fontFamily="Rubik"
            textAlign="left"
          >
            {drug.precedentStrengthRationale}
          </Typography>
        </Box>
      </Card>

      <Card>
        <SectionHeader>Approval Timeline & Evidence Evolution</SectionHeader>
        <ApprovalTimeline data={drug.approvalTimeline} />
      </Card>

      {/*  DESIGN PATTERNS */}
      <SectionHeader>Reusable Design Patterns</SectionHeader>
      {drug.reusableDesignPatterns?.map((p, i) => (
        <PatternCard key={i} pattern={p} />
      ))}

      {/*  PIVOTAL STUDIES */}
      <SectionHeader>Pivotal Clinical Studies</SectionHeader>
      <Card>
        <TableHeader />
        {drug.pivotalClinicalStudies?.map((s, i) => (
          <TableRow key={i} {...s} />
        ))}
      </Card>

      {/* DOSAGE */}
      <SectionHeader>Dosage & Administration Flexibility</SectionHeader>
      <Card>
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: "1fr",
            sm: "1fr 1fr",
          }}
          columnGap={6}
          rowGap={2}
        >
          <DosageItem
            label="Recommended dosage"
            value={drug.dosageAdministration?.recommendedDosage}
          />

          <DosageItem
            label="Administration"
            value={drug.dosageAdministration?.administration}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Label>Dose flexibility:</Label>
        <Value>{drug.dosageAdministration?.doseFlexibility}</Value>

        <Box mt={2} p={2} bgcolor="#FEF6EE" borderRadius={1}>
          <Label color="#C1660D">Post-approval modifications</Label>
          <Value>{drug.dosageAdministration?.postApprovalModification}</Value>
        </Box>
      </Card>

      {/*  ENABLEMENTS */}
      <SectionHeader>
        What This Drug Precedent Enables for Your Trial
      </SectionHeader>
      {drug.trialEnablements?.map((t, i) => (
        <Bullet key={i}>{t}</Bullet>
      ))}

      {/*  ACTION BUTTONS */}
      <Box mt={3} display="flex" gap={2} alignItems="center">
        <Box
          component="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "2px solid #2F80ED",
            background: "#fff",
            color: "rgba(38, 102, 190, 1)",
            fontFamily: "Rubik",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
          onClick={() => {
          }}
        >
          <img src={Download}></img>
          Download
        </Box>

        <Box
          component="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            background: "#EAF2FF",
            color: "#2F80ED",
            fontFamily: "Rubik",
            fontSize: "15px",
            fontWeight: 500,
            cursor: "pointer",
          }}
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
        >
          <img src={Share}></img>
          Copy Link
        </Box>
      </Box>
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
    mb={3}
    fontFamily="Rubik"
    textAlign="left"
  >
    {children}
  </Typography>
);

const Label = ({ children, color }) => (
  <Typography
    fontSize={14}
    fontWeight={500}
    color={color || "rgba(0, 0, 0, 0.8)"}
    fontFamily="Rubik"
    textAlign="left"
  >
    {children}
  </Typography>
);

const Value = ({ children }) => (
  <Typography
    fontSize={13}
    fontFamily="Rubik"
    color="rgba(0, 0, 0, 0.6)"
    textAlign="left"
  >
    {children}
  </Typography>
);


const PatternCard = ({ pattern }) => (
  <Card sx={{ p: 2, borderRadius: "12px" }}>
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      mb={0.5}
    >
      <Box>
        <Typography
          fontWeight={500}
          fontFamily="Rubik"
          fontSize={17}
          color="rgba(0, 0, 0, 0.85)"
          textAlign="left"
        >
          {pattern.indication}
        </Typography>

        <Typography
          fontWeight={500}
          fontFamily="Rubik"
          fontSize={14}
          color="rgba(0,0,0,0.6)"
          textAlign="left"
        >
          {pattern.line}
        </Typography>
      </Box>

      {pattern.studyType && (
        <Chip
          label={pattern.studyType}
          size="small"
          sx={{
            bgcolor: "#EAF2FF",
            color: "#2F80ED",
            fontSize: "13px",
            fontWeight: 400,
            fontFamily: "Rubik",
            height: "24px",
          }}
        />
      )}
    </Box>

    <Divider sx={{ my: 1 }} />

    <Box
      display="grid"
      gridTemplateColumns={{
        xs: "1fr",
        sm: "1fr 1fr",
        md: "1fr 1fr 1fr 1fr",
      }}
      columnGap={3}
      rowGap={2}
    >
      <GridItem label="Population" value={pattern.population} />

      <GridItem label="Sample size" value={pattern.sampleSize} />

      <GridItem label="Comparator" value={pattern.comparator} />

      <GridItem
        label="Primary endpoint"
        value={pattern.primaryEndpoint?.join(", ")}
      />
    </Box>

    <Box mt={1.5} p={1.5} bgcolor="#F9F9FB" borderRadius="8px">
      <Typography
        fontSize={14}
        fontWeight={500}
        color="rgba(0, 0, 0, 0.8)"
        fontFamily="Rubik"
        textAlign="left"
        mb={0.5}
      >
        Design takeaway:
      </Typography>

      <Typography
        fontSize={13}
        color="rgba(0, 0, 0, 0.6)"
        fontFamily="Rubik"
        textAlign="left"
      >
        {pattern.designTakeaway}
      </Typography>
    </Box>
  </Card>
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

const TableHeader = () => (
  <Box
    display="flex"
    fontWeight={500}
    mb={1}
    color="rgba(0, 0, 0, 0.6)"
    fontFamily="Rubik"
    fontSize="14px"
    textAlign="left"
  >
    <Box width="25%">Study Name</Box>
    <Box flex={1}>Phase</Box>
    <Box flex={1}>Study Type</Box>
    <Box flex={1}>Endpoint</Box>
    <Box width="30%">Regulatory Impact / Outcome</Box>
  </Box>
);

const TableRow = ({
  studyName,
  phase,
  studyType,
  endpoint,
  regulatoryOutcome,
}) => (
  <Box display="flex" py={1} borderTop="1px solid rgba(0,0,0,0.05)">
    <Box
      width="25%"
      color="rgba(0, 0, 0, 0.8)"
      fontFamily="Rubik"
      fontSize="14px"
      textAlign="left"
    >
      {studyName}
    </Box>
    <Box
      flex={1}
      color="rgba(0, 0, 0, 0.6)"
      fontFamily="Rubik"
      fontSize="14px"
      textAlign="left"
    >
      {phase}{" "}
    </Box>
    <Box
      flex={1}
      color="rgba(0, 0, 0, 0.6)"
      fontFamily="Rubik"
      fontSize="14px"
      textAlign="left"
    >
      {studyType}
    </Box>
    <Box
      flex={1}
      color="rgba(0, 0, 0, 0.6)"
      fontFamily="Rubik"
      fontSize="14px"
      textAlign="left"
    >
      {endpoint}
    </Box>
    <Box
      width="30%"
      color="rgba(0, 0, 0, 0.6)"
      fontFamily="Rubik"
      fontSize="14px"
      textAlign="left"
    >
      {regulatoryOutcome}
    </Box>
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

const InfoBlock = ({ label, value }) => (
  <Box>
    <Typography
      fontSize={13}
      color="rgba(0,0,0,0.6)"
      fontFamily="Rubik"
      textAlign="left"
    >
      {label}
    </Typography>
    <Typography
      fontSize={14}
      fontWeight={500}
      fontFamily="Rubik"
      color="rgba(0, 0, 0, 0.8)"
      textAlign="left"
    >
      {value}
    </Typography>
  </Box>
);

const DosageItem = ({ label, value }) => (
  <Box>
    <Typography
      fontSize={13}
      color="rgba(0, 0, 0, 0.6)"
      fontFamily="Rubik"
      mb={0.25}
      textAlign="left"
    >
      {label}
    </Typography>

    <Typography
      fontSize={14}
      fontWeight={500}
      color="rgba(0,0,0,0.80)"
      fontFamily="Rubik"
      textAlign="left"
    >
      {value}
    </Typography>
  </Box>
);

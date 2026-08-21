import {
  Box, Typography, Button, Chip, LinearProgress, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton
} from "@mui/material";
import ccard from "../../assets/credit_card.svg";
import { useState } from "react";
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined';
import moment from "moment";

// Helper to centralize seat computation and avoid duplicated logic
const getSeatInfo = (contractDetails, orgSeats) => {
  const orgUsed = orgSeats?.seats;
  const orgTotal = orgSeats?.number_of_seats;
  const contractUsed = contractDetails?.[0]?.seats;
  const contractTotal = contractDetails?.[0]?.number_of_seats;

  const usedSeats = orgUsed ?? contractUsed ?? 0;
  const TOTAL_SEATS = orgTotal ?? contractTotal ?? 0;
  const seatPercent = TOTAL_SEATS ? (usedSeats / TOTAL_SEATS) * 100 : 0;

  return { usedSeats, TOTAL_SEATS, seatPercent };
};

export default function SubscriptionsBilling({ paymentInfoDetails, CurrentContractDetails, subscriptionHistoryDetails, organizationSeats }) {
  const { usedSeats, TOTAL_SEATS, seatPercent } = getSeatInfo(CurrentContractDetails, organizationSeats);

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh", p: { xs: 2, md: 3 } }}>
      <Box sx={root}>
        <CurrentContract
          CurrentContractDetails={CurrentContractDetails}
          seatsInfo={{ usedSeats, TOTAL_SEATS, seatPercent }}
        />
        <PaymentInfo paymentInfoDetails={paymentInfoDetails} />
        <HistorySection historyData={subscriptionHistoryDetails} />
      </Box>
    </Box>
  );
} 

const CurrentContract = ({ CurrentContractDetails, seatsInfo = {} }) => {
  // Use centralized seats info; fall back to contract details for safety
  const usedSeats = seatsInfo.usedSeats ?? CurrentContractDetails?.[0]?.seats ?? 0;
  const TOTAL_SEATS = seatsInfo.TOTAL_SEATS ?? CurrentContractDetails?.[0]?.number_of_seats ?? 0;
  const seatPercent = seatsInfo.seatPercent ?? (TOTAL_SEATS ? (usedSeats / TOTAL_SEATS) * 100 : 0);

  return (
    <Box sx={card}>
      {/* Header */}
      <Box sx={header}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={title}>Current Contract</Typography>
            <Chip label="Pro Team" sx={planChip} />
          </Box>
          <Typography sx={subtitle}>
            Your annual contract details and renewal information
          </Typography>
        </Box>

        <Button sx={salesBtn}>Chat With Sales</Button>
      </Box>

      {/* Stats */}
      <Box sx={statsRow}>
        <StatBox label="Annual Contract Value">
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Typography sx={value}>${CurrentContractDetails?.[0]?.anuualcontractvalue || 0}</Typography>
            <Typography sx={muted}>per year</Typography>
          </Box>
        </StatBox>

        <StatBox label="Status">
          <Chip label={CurrentContractDetails?.[0]?.status || "pending"} sx={CurrentContractDetails?.[0]?.status ? activeChip : inactiveChip} />
        </StatBox>

        <StatBox label="Annually Renewal Date">
          <Typography sx={value}>{moment(CurrentContractDetails?.[0]?.annuallyrenewdate).format("MMM DD,YYYY")}
          </Typography>
        </StatBox>

        <Box
          sx={{
            ...statBox,
            width: { xs: "100%", lg: 284 },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={muted}>Seats Included</Typography>
            <Typography sx={value}>{usedSeats} / {TOTAL_SEATS}</Typography>
          </Box>

          <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, seatPercent))} sx={progress} />
        </Box>
      </Box>
    </Box>
  );
};

const PaymentInfo = ({ paymentInfoDetails }) => (
  <Box sx={paymentCardRoot}>
    {/* Title */}
    <Typography sx={sectionTitle}>Payment Info</Typography>
    <Typography sx={sectionSubtitle}>Your payment information</Typography>

    {/* Card Row */}
    <Box sx={paymentMethodRow}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box component="img" src={ccard} alt="Card" sx={cardIcon} />
        <Box>
          <Typography sx={cardNumber}>•••• •••• •••• 4242</Typography>
          <Typography sx={expiryText}>Expires 12/25</Typography>
        </Box>
      </Box>
    </Box>

    {/* Payment POC */}
    <Box sx={addressBlock}>
      <AddressLine label="Country" value={paymentInfoDetails?.[0]?.billing_country || "N/A"} />
      <AddressLine label="State/province/area" value={paymentInfoDetails?.[0]?.billing_state || "N/A"} />
      <AddressLine label="City" value={paymentInfoDetails?.[0]?.billing_city || "N/A"} />
      <AddressLine label="Zip code" value={paymentInfoDetails?.[0]?.billing_zip || "N/A"} />
      <AddressLine
        label="Street"
        value={paymentInfoDetails?.[0]?.street || "N/A"}
      />
      <AddressLine label="Phone number" value={paymentInfoDetails?.[0]?.phone || "N/A"} />
    </Box>

    {/* Billing Address */}
    <Box sx={infoRow}>
      <Typography sx={infoLabel}>Billing Address:</Typography>

      <Box sx={addressBlock}>
        <AddressLine label="Country" value={paymentInfoDetails?.[0]?.billing_country || "N/A"} />
        <AddressLine label="State/province/area" value={paymentInfoDetails?.[0]?.billing_state || "N/A"} />
        <AddressLine label="City" value={paymentInfoDetails?.[0]?.billing_city || "N/A"} />
        <AddressLine label="Zip code" value={paymentInfoDetails?.[0]?.billing_zip || "N/A"} />
        <AddressLine
          label="Street"
          value={paymentInfoDetails?.[0]?.street || "N/A"}
        />
        <AddressLine label="Phone number" value={paymentInfoDetails?.[0]?.phone || "N/A"} />
      </Box>
    </Box>
  </Box>
);

const HistorySection = ({ historyData }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Mock data if historyData is empty
  const rows = historyData || [];

  return (
    <Box sx={historyRoot}>
      <Typography sx={sectionTitle}>History</Typography>
      <Typography sx={sectionSubtitle}>Download your invoices and view payment history</Typography>

      <Box sx={tabWrapper}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={tabsStyle}>
          <Tab label="Subscription history" sx={tabItem} />
          <Tab label="Billing History" sx={tabItem} />
        </Tabs>
      </Box>

      <TableContainer sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={tableHeaderRow}>
              <TableCell sx={tableHeadCell}>Subscriptions ID</TableCell>
              <TableCell sx={tableHeadCell}>Start Date</TableCell>
              <TableCell sx={tableHeadCell}>End Date</TableCell>
              <TableCell sx={tableHeadCell}>Amount</TableCell>
              <TableCell sx={tableHeadCell}>Status</TableCell>
              <TableCell sx={tableHeadCell}>Paid Date</TableCell>
              <TableCell sx={tableHeadCell} align="right">Download</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id} sx={tableRowStyle}>
                  <TableCell sx={tableBodyCell}>{row.id}</TableCell>
                  <TableCell sx={tableBodyCellBold}>{moment(row.strat_date).format("MMM D, YYYY")}</TableCell>
                  <TableCell sx={tableBodyCellBold}>{moment(row.end_date).format("MMM D,YYYY")}</TableCell>
                  <TableCell sx={tableBodyCellBold}>{row.amount}</TableCell>
                  <TableCell sx={tableBodyCell}>
                    <Chip
                      label={row.status}
                      sx={row.status === 'Paid' ? statusPaid : statusOutstanding}
                    />
                  </TableCell>
                  <TableCell sx={tableBodyCellBold}>{moment(row.paiddate).format("MMM D,YYYY")}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" sx={{ color: '#2F80ED' }}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={tableBodyCell}>
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
const AddressLine = ({ label, value }) => (
  <Typography sx={addressText}>
    <Box component="span" sx={addressLabel}>
      {label}:
    </Box>
    {value}
  </Typography>
);

const StatBox = ({ label, children }) => (
  <Box sx={statBox}>
    <Typography sx={muted}>{label}</Typography>
    {children}
  </Box>
);

const InfoRow = ({ label, value }) => (
  <Box sx={infoRow}>
    <Typography sx={infoLabel}>{label}</Typography>
    <Typography sx={infoValue} whiteSpace="pre-line">
      {value}
    </Typography>
  </Box>
);
const historyRoot = {
bgcolor: "#fff",
  p: { xs: 2, md: "15px" },
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0px 4px 10px rgba(130,143,169,0.1)",
  mt:4
};

const tabWrapper = {
  borderBottom: '1px solid #F0F0F0',
  mt: 3,
  bgcolor: '#F8F9FB', // Light background for tab bar as seen in image
  borderRadius: '8px 8px 0 0'
};

const tabsStyle = {
  '& .MuiTabs-indicator': {
    backgroundColor: '#2F80ED',
    height: 3,
  },
};

const tabItem = {
  textTransform: 'none',
  fontFamily: 'Rubik',
  fontWeight: 500,
  fontSize: '14px',
  minWidth: 160,
  color: 'rgba(0,0,0,0.6)',
  '&.Mui-selected': {
    color: '#2F80ED',
    bgcolor: '#EBF3FF' // Light blue highlight for active tab
  },
};

const tableHeaderRow = {
  bgcolor: '#F8F9FB',
};

const tableHeadCell = {
  fontFamily: 'Rubik',
  fontSize: '13px',
  color: 'rgba(0,0,0,0.4)',
  borderBottom: '1px solid #F0F0F0',
  py: 1.5
};

const tableRowStyle = {
  '&:last-child td, &:last-child th': { border: 0 },
  height: '60px'
};

const tableBodyCell = {
  fontFamily: 'Rubik',
  fontSize: '14px',
  color: 'rgba(0,0,0,0.6)',
  borderBottom: '1px solid #F0F0F0',
};

const tableBodyCellBold = {
  ...tableBodyCell,
  fontWeight: 500,
  color: 'rgba(0,0,0,0.8)',
};

const statusPaid = {
  bgcolor: '#E6F7ED',
  color: '#27AE60',
  borderRadius: '4px',
  height: '24px',
  fontSize: '12px',
  fontWeight: 500
};

const statusOutstanding = {
  bgcolor: '#FFEBEB',
  color: '#EB5757',
  borderRadius: '4px',
  height: '24px',
  fontSize: '12px',
  fontWeight: 500
};

const root = {
  //   maxWidth: 1484,
  width: "100%",
  mx: "auto",
  p: 2,
};

const card = {
  bgcolor: "#fff",
  p: 2,
  mb: 3,
  borderRadius: 2,
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0px 4px 10px rgba(130,143,169,0.1)",
};

const header = {
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  justifyContent: "space-between",
  alignItems: { xs: "flex-start", sm: "center" },
  gap: { xs: 1.5, sm: 0 },
};

const title = {
  fontFamily: "Rubik",
  fontWeight: 500,
  fontSize: 21,
  lineHeight: "24px",
  color: "rgba(0,0,0,0.8)",
};

const subtitle = {
  fontFamily: "Rubik",
  fontSize: 14,
  color: "rgba(0,0,0,0.6)",
  mt: 0.5,
};

const planChip = {
  height: 24,
  bgcolor: "#D9D9E0",
  fontWeight: 600,
};

const salesBtn = {
  height: 44,
  px: 2,
  bgcolor: "#2666BE",
  color: "#F0F6FE",
  textTransform: "none",

  alignSelf: { xs: "center", sm: "flex-start" },

  mt: { xs: 1.5, sm: 0 },

  "&:hover": {
    bgcolor: "#2666BE",
  },
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "1fr 1fr",
    lg: "1fr 1fr 1fr 284px",
  },
  gap: 2,
  mt: 2,
  textAlign: "left",
};

const statBox = {
  flex: 1,
  p: 2,
  borderRadius: 2,
  border: "1px solid rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const value = {
  fontFamily: "Rubik",
  fontWeight: 500,
  fontSize: 15,
  color: "rgba(0,0,0,0.8)",
  mt: 1,
};

const muted = {
  fontFamily: "Rubik",
  fontSize: 12,
  color: "rgba(0,0,0,0.6)",
  mt: 1,
};

const activeChip = {
  bgcolor: "#DAF1E4",
  color: "#27AE60",
  height: 24,
  width: "62px",
};
const inactiveChip = {
  bgcolor: "#FFF4E5",
  color: "#F2C94C",
  height: 24,
  width: "82px",
};
const progress = {
  height: 12,
  borderRadius: 20,
  mt: 1,
  bgcolor: "#E8E8EC",
  "& .MuiLinearProgress-bar": {
    bgcolor: "#2F80ED",
    borderRadius: 20,
  },
};

// const paymentCard = {
//   mt: 2,
//   p: 2,
//   borderRadius: 2,
//   border: "1px solid rgba(0,0,0,0.05)",
// };

const paymentCardRoot = {
  bgcolor: "#fff",
  p: { xs: 2, md: "15px" },
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0px 4px 10px rgba(130,143,169,0.1)",
};

const sectionTitle = {
  color: "rgba(0,0,0,0.8)",
  fontWidth: 440,
  height: 24,
  angle: "0 deg",
  opacity: 1,
  fontFamily: "Family/Body",
  fontWeight: "Weight/Medium",
  fontStyle: "Medium",
  fontSize: "Size/Heading/H4",
  leadingTrim: "NONE",
  lineHeight: "Line-Height/LH-24",
  letterSpacing: "0%",
textAlign: "left",
};

const sectionSubtitle = {
  fontFamily: "Rubik",
  fontSize: "14px",
  
  lineHeight: "20px",
  color: "rgba(0,0,0,0.6)",
  mt: "4px",
  textAlign: "left",
};

const paymentMethodRow = {
  mt: "12px",
  p: "15px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.05)",
  display: "flex",
  alignItems: "center",
};

const cardIcon = {
  width: 32,
  height: 32,
  borderRadius: "4px",
  objectFit: "contain",
};

const cardNumber = {
  fontFamily: "Rubik",
  fontWeight: 500,
  fontSize: "15px",
  lineHeight: "18px",
  color: "rgba(0,0,0,0.8)",
  textAlign: "left",
};

const expiryText = {
  fontFamily: "Rubik",
  fontSize: "12px",
  lineHeight: "16px",
  color: "rgba(0,0,0,0.6)",
  textAlign: "left",
};

const infoRow = {
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  gap: "8px",
  mt: "12px",
  textAlign: "left",
};

const infoLabel = {
  width: { xs: "100%", sm: "160px" },
  fontFamily: "Rubik",
  fontWeight: 500,
  fontSize: "15px",
  lineHeight: "24px",
  color: "rgba(0,0,0,0.8)",
  textAlign: "left",
};
const infoValue = {
  fontFamily: "Rubik",
  fontSize: "15px",
  lineHeight: "24px",
  color: "rgba(0,0,0,0.6)",
  textAlign: "left",
};

const addressBlock = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  textAlign: "left",
};

const addressText = {
  fontFamily: "Rubik",
  fontSize: "15px",
  lineHeight: "24px",
  color: "rgba(0,0,0,0.6)",
};

const addressLabel = {
  fontWeight: 500,
};

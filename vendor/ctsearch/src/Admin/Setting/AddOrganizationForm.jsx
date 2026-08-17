import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  MenuItem,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { styled } from "@mui/material/styles";
import Sidebar from "../../layout/sidebar/Sidebar";

export default function AddOrganizatioForm() {
  const navigate = useNavigate();
  const emailRef = useRef(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState(null);
  const [inviteMsg, setInviteMsg] = useState(null);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        maxWidth: "auto",
        overflowX: "hidden",
      }}
    >
      <Sidebar />
      <Box
        sx={{ flex: 1, ml: "56px", display: "flex", flexDirection: "column" }}
      >
        {/* Header Nav */}
        <Box sx={UI.headerNav}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ color: "rgba(0,0,0,0.6)" }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography fontSize={27} color="rgba(0,0,0,0.6)">
            Settings /
          </Typography>
          <Typography fontSize={27} fontWeight={500}>
            Add New Organization
          </Typography>
        </Box>

        <Box sx={UI.pageWrapper}>
          <Box sx={UI.container}>
            {/* --- SECTION 1: ORGANIZATION INFORMATION --- */}
            <Paper sx={UI.card} elevation={0}>
              <Box sx={UI.headerSection}>
                <Typography sx={UI.title}>Organization Information</Typography>
                <Typography sx={UI.subtitle}>
                  Your organization information and profile settings
                </Typography>
              </Box>

              <Box sx={UI.avatarRow}>
                <Avatar sx={UI.avatar}>OR</Avatar>
                <Button variant="outlined" sx={UI.outlineBtn}>
                  Add Logo
                </Button>
              </Box>

              <Box sx={UI.gridTwoCol}>
                <StyledInput label="Organization Name" value="Oncolo" />
                <StyledInput label="Domain" value="www.oncolo.com" />
                <StyledInput label="Phone" value="+1-555-0100" />
                <StyledInput
                  label="Status"
                  value="Active"
                  select
                  options={["Active", "Inactive"]}
                />
                <StyledInput label="Country" value="India" />
                <StyledInput label="City" value="Delhi" />
                <StyledInput label="State" value="Delhi" />
                <StyledInput label="Zip" value="110055" />
                <Box sx={UI.fullWidthRow}>
                  <StyledInput
                    label="StreetAddress"
                    value="C 21, Chiniot Basti, Multani Dhanda, Pahar Ganj"
                  />
                </Box>
              </Box>
            </Paper>

            {/* --- SECTION 2: CURRENT CONTRACT & PAYMENT INFO --- */}
            <Paper sx={UI.card} elevation={0}>
              <Box sx={UI.flexBetween}>
                <Box sx={UI.headerSection}>
                  <Typography sx={UI.title}>Current Contract</Typography>
                  <Typography sx={UI.subtitle}>
                    Your annual contract details and renewal information
                  </Typography>
                </Box>
                <Button variant="contained" sx={UI.primaryBtn}>
                  Save
                </Button>
              </Box>

              <Box sx={UI.gridFourCol}>
                <StyledInput
                  label="Plan"
                  value="Pro Team"
                  select
                  options={["Pro Team", "Enterprise"]}
                />
                <StyledInput label="Annual Contract Value" value="$120,000" />
                <StyledInput
                  label="Annually Renewal Date"
                  value="January 1, 2025"
                />
                <StyledInput label="Seats" value="10" />
              </Box>

              <Box sx={{ mt: "40px" }}>
                <Box sx={UI.headerSection}>
                  <Typography sx={UI.title}>Payment Info</Typography>
                  <Typography sx={UI.subtitle}>
                    Your payment information
                  </Typography>
                </Box>

                <Box sx={UI.gridThreeCol}>
                  <StyledInput
                    label="Payment Poc Person"
                    value="Zenaida S. Barnes"
                  />
                  <StyledInput label="Phone number" value="+91 0112354214" />
                  <StyledInput label="Country" value="India" />
                  <StyledInput label="State/province/area" value="Delhi" />
                  <StyledInput label="City" value="Delhi" />
                  <StyledInput label="Zip code" value="110055" />
                </Box>
                <Box sx={{ mt: "24px" }}>
                  <StyledInput
                    label="Street"
                    value="C 21, Chiniot Basti, Multani Dhanda, Pahar Ganj"
                  />
                </Box>
              </Box>
            </Paper>

            {/* Invite Card Container */}
            <Paper sx={UI.card} elevation={0}>
              <CardTitle>Invite Team Members</CardTitle>
              <CardSubtitle>
                Add colleagues to your clinical trial research workspace
              </CardSubtitle>

              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <EmailInput
                  fullWidth
                  placeholder="Email address"
                  variant="outlined"
                  inputRef={emailRef}
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError(null);
                    setInviteMsg(null);
                  }}
                  error={!!inviteError}
                  helperText={inviteError ? inviteError : ""}
                />
              </Box>

              {inviteMsg && (
                <Typography
                  sx={{
                    color: "#059669",
                    mt: 2,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {inviteMsg}
                </Typography>
              )}
            </Paper>

            {/* ADDED: FINAL ADD ORGANIZATION BUTTON */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                mt: 2,
                pb: 4,
                width: "300px",
                gap: "16px", // Representing 'left' alignment
              }}
            >
              <Button
                variant="contained"
                sx={{ ...UI.primaryBtn, width: "240px" }}
              >
                Save
              </Button>
              <Button
                variant="text"
                onClick={() => navigate(-1)}
                sx={UI.secondaryBtn}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const StyledInput = ({ label, value, select, options = [] }) => (
  <Box sx={UI.inputGroup}>
    <Typography sx={UI.inputLabel}>{label}</Typography>
    <TextField
      select={select}
      fullWidth
      defaultValue={value}
      variant="outlined"
      size="small"
      SelectProps={{ IconComponent: KeyboardArrowDownIcon }}
      sx={UI.textField}
    >
      {select
        ? options.map((opt) => (
            <MenuItem key={opt} value={opt} sx={UI.menuItem}>
              {opt}
            </MenuItem>
          ))
        : null}
    </TextField>
  </Box>
);

const UI = {
  headerNav: {
    position: "fixed",
    top: 0,
    left: "56px",
    right: 0,
    height: 72,
    px: 3,
    display: "flex",
    alignItems: "center",
    gap: 1,
    bgcolor: "#fff",
    boxShadow: "0px 8px 20px rgba(138,160,190,0.15)",
    zIndex: 1100,
  },
  pageWrapper: {
    width: "100%",
    minHeight: "100vh",
    bgcolor: "#F9FBFF",
    pt: "92px",
    pb: "40px",
    display: "flex",
    justifyContent: "center",
    overflowX: "hidden", // Extra safety
  },
  container: {
    width: "95%", // Changed from 100% to allow breathing room and prevent scroll
    maxWidth: "1413px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  card: {
    p: "32px",
    borderRadius: "8px",
    border: "1px solid #E0E4EC",
    boxShadow: "none",
    textAlign: "left",
  },
  headerSection: {
    mb: "24px",
    textAlign: "left",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#1A1C1E",
    fontFamily: "'Rubik', sans-serif",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6C757D",
    fontFamily: "'Rubik', sans-serif",
    mt: "4px",
  },
  avatarRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    mb: "32px",
  },
  avatar: {
    bgcolor: "#0A2540",
    width: 64,
    height: 64,
    fontSize: "20px",
    fontWeight: 600,
  },
  outlineBtn: {
    textTransform: "none",
    borderRadius: "8px",
    border: "1px solid #E0E4EC",
    color: "#2666BE",
    fontWeight: 500,
    height: "40px",
    fontFamily: "'Rubik', sans-serif",
  },
  primaryBtn: {
    bgcolor: "#2666BE",
    textTransform: "none",
    px: "32px",
    height: "44px",
    borderRadius: "8px",
    fontWeight: 500,
    fontFamily: "'Rubik', sans-serif",
    "&:hover": { bgcolor: "#1A4A8E" },
  },
  secondaryBtn: {
    textTransform: "none",
    color: "#6C757D", // Neutral gray from Figma
    fontSize: "16px",
    fontWeight: 500,
    fontFamily: "'Rubik', sans-serif",
    px: "24px",
    height: "44px",
    borderRadius: "8px",
    "&:hover": {
      bgcolor: "rgba(108, 117, 125, 0.08)",
      color: "#1A1C1E",
    },
    border: "1px solid #D9D9E0",
  },
  gridTwoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  gridThreeCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "24px",
  },
  gridFourCol: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1.2fr 1.2fr 1fr",
    gap: "20px",
  },
  fullWidthRow: {
    gridColumn: "span 2",
  },
  flexBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  inputGroup: {
    textAlign: "left",
  },
  inputLabel: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#6C757D",
    mb: "8px",
    fontFamily: "'Rubik', sans-serif",
  },
  textField: {
    "& .MuiOutlinedInput-root": {
      height: "48px",
      borderRadius: "8px",
      bgcolor: "#FFFFFF",
      "& fieldset": { borderColor: "#E0E4EC" },
    },
    "& .MuiInputBase-input": {
      textAlign: "left",
      fontSize: "15px",
      fontFamily: "'Rubik', sans-serif",
    },
  },
  menuItem: {
    fontFamily: "'Rubik', sans-serif",
    fontSize: "14px",
  },
};

const CardTitle = styled(Typography)({
  fontSize: "1.25rem",
  fontWeight: 700,
  color: "#111827",
  marginBottom: "4px",
});

const CardSubtitle = styled(Typography)({
  fontSize: "0.875rem",
  color: "#6B7280",
  marginBottom: "24px",
});

const EmailInput = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#F9FAFB",
    height: "48px",
    "& fieldset": {
      borderColor: "#E5E7EB",
    },
    "&:hover fieldset": {
      borderColor: "#D1D5DB",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2563EB",
    },
  },
});

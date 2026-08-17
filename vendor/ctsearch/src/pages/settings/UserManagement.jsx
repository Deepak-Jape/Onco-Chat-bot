/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Divider,
} from "@mui/material";
import { deleteTeamMember, SentInvite } from "../../api/Profile";
import CloseIcon from "@mui/icons-material/Close";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import mail from "../../assets/mail-send.svg";
import moment from "moment";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuItem from "@mui/material/MenuItem";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  adminCloseIcon,
  emailInput,
  headerText,
  inviteBtn,
  inviteCard,
  inviteCard_management,
  memberCloseIcon,
  progress,
  row,
  rowMuted,
  rowName,
  seatsCard,
  seatsCount,
  seatsFooterLink,
  seatsFooterText,
  seatsLabel,
  seatsTitle,
  sectionTitle,
  subtitle,
  tableGrid,
  tableHeader,
  title,
} from "./style";
import { useSnackbar } from "../../common/GlobalSnackbar";
import TeamMembersTable from "../../Admin/Setting/TeamMembersTable";

export default function UserManagement({
  organizationSeats,
  teamMemberList,
  sentInvites,
  setApicall,
  organizationDetails
}) {
  const usedSeats = organizationSeats?.seats || 0;
  const TOTAL_SEATS = organizationSeats?.number_of_seats || 0;
  const seatPercent = (usedSeats / TOTAL_SEATS) * 100 || 0;

  // const removeMember = async (id) => {
  //   // setMembers((prev) => prev.filter((m) => m.id !== id));
  //   try {
  //     let res = await deleteTeamMember(id);
  //     if (res) {
  //       setApicall(true);
  //     }
  //   } catch (error) { }
  // };

  const { showSnackbar } = useSnackbar();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(3);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [localSentInvites, setLocalSentInvites] = useState(sentInvites || []);
  const emailRef = useRef(null);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSendInvite = async () => {
    setInviteMsg(null);
    setInviteError(null);

    if (!validateEmail(inviteEmail)) {
      setInviteError("Please enter a valid email address");
      return;
    }

    if (organizationSeats?.seats >= TOTAL_SEATS) {
      setInviteError("No available seats. Contact Sales to add more seats.");
      return;
    }
    if(!organizationDetails?.organization_id) {
      setInviteError("Organization ID not found. Please refresh the page or contact the administrator.");
      return;
    }

    try {
      setInviteLoading(true);
      let data = {
        invitedUserEmailAddress: inviteEmail
          ? inviteEmail
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
          : [],
        role_id: inviteRole,
        organization_id: organizationDetails?.organization_id
      }
      const res = await SentInvite(
        data
      );
      if (res?.message && (res.status === 200 || res.status === 201)) {
        showSnackbar({
          message: res?.message || "Invite sent successfully",
          type: "success",
        });
        setInviteSuccess(true);
        setLocalSentInvites((prev) => [
          {
            email: inviteEmail,
            status: "Invite sent",
            sent_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setInviteEmail("");
        setApicall(true);
      } else if (res.status != 200) {
        showSnackbar({
          message: res.response.data.detail.message,
          type: "error",
        });
        setInviteError("Failed to send invite. Please try again.");
        setInviteSuccess(false);
      }
    } catch (err) {
      setInviteError("Failed to send invite. Please try again.");
      setInviteSuccess(false);

      console.error(err);
    } finally {
      setInviteLoading(false);
    }
  };

  // Clear success message after 5 seconds
  useEffect(() => {
    if (!inviteSuccess) return;
    const t = setTimeout(() => {
      setInviteMsg(null);
      setInviteSuccess(false);
    }, 5000);
    return () => clearTimeout(t);
  }, [inviteSuccess]);

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        minHeight: "100vh",
        p: { xs: 2, md: "0px 24px 24px 24px" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: "20px",
          flexWrap: { xs: "wrap", lg: "nowrap" },
        }}
      >
        {/* Invite Card */}
        <Box sx={inviteCard_management}>
          <Typography sx={title}>Invite Team Members</Typography>
          <Typography sx={subtitle}>
            Add colleagues to your clinical trial research workspace
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mt: 2,
              mb: 3,
              alignItems: "normal", // Ensures everything aligns at the bottom if labels exist
            }}
          >
            {/* Email Input - Takes up the most space */}
            <Box sx={{ flex: 3 }}>
              <TextField
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
                InputProps={{
                  sx: { ...emailInput, height: "44px" }, // Force height consistency
                }}
              />
            </Box>

            {/* Role Selector - Takes up fixed/smaller space */}
            <Box sx={{ flex: 1.5, minWidth: "180px" }}>
              <Field
                placeholder="Select role"
                value={inviteRole} // Set to ID (3 for Member)
                select
                options={[
                  { label: "Member", value: 3 },
                  { label: "Super Admin", value: 2 },
                ]}
                onChange={(v) => setInviteRole(v)}
                sx={{ mb: 0 }} // Remove margin-bottom if Field component has one
              />
            </Box>

            {/* Send Invite Button */}
            <Button
              variant="contained"
              startIcon={
                <Box
                  component="img"
                  src={mail}
                  alt="Mail"
                  sx={{
                    width: 18,
                    height: 18,
                    objectFit: "contain",
                  }}
                />
              }
              sx={inviteBtn}
              onClick={handleSendInvite}
              disabled={
                inviteLoading || !inviteEmail || !validateEmail(inviteEmail)
              }
            >
              {inviteLoading ? "Sending..." : "Send Invite"}
            </Button>
          </Box>

          {inviteMsg && (
            <Typography sx={{ color: "#27AE60", mt: 1 }}>
              {inviteMsg}
            </Typography>
          )}

          {/* Recently sent invites */}
          {/* {localSentInvites?.length > 0 && (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                gap: 1,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {localSentInvites.slice(0, 5).map((inv, idx) => (
                <Chip
                  key={idx}
                  label={`${inv.email} • ${inv.status}`}
                  size="small"
                  sx={{ bgcolor: "#F8F9FB" }}
                />
              ))}
            </Box>
          )} */}
        </Box>

        {/* Seats Card */}
        <Box sx={seatsCard}>
          <Typography sx={seatsTitle}>Seats</Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography sx={seatsLabel}>Seats Included</Typography>
            <Typography sx={seatsCount}>
              {usedSeats} / {TOTAL_SEATS}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={seatPercent}
            sx={progress}
          />

          <Typography sx={seatsFooterText}>
            For more seats{" "}
            <Box component="span" sx={seatsFooterLink}>
              Contact Sales
            </Box>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography sx={sectionTitle}>Team Members</Typography>
        <Typography sx={subtitle}>
          Manage your team members and their permissions
        </Typography>

        <TeamMembersTable team_member_data={teamMemberList}  organization_id={organizationDetails?.organization_id} />
      </Box>
    </Box>
  );
}
const Field = ({
  label,
  value,
  onChange,
  full,
  sx,
  select = false,
  options = [],
}) => (
  <Box
    sx={{
      gridColumn: full ? "1 / -1" : "auto",
      ...sx,
    }}
  >
    {label && (
      <Typography
        sx={{
          fontFamily: "Rubik",
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "18px",
          color: "rgba(0,0,0,0.6)",
          mb: "4px",
          textAlign: "left",
        }}
      >
        {label}
      </Typography>
    )}

    <TextField
      fullWidth
      select={select}
      value={value}
      size="small"
      onChange={(e) => onChange?.(e.target.value)}
      SelectProps={{
        IconComponent: KeyboardArrowDownIcon,
      }}
      InputProps={{
        sx: {
          fontFamily: "Rubik",
          height: 44,
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: "18px",
          color: "rgba(0,0,0,0.6)",
          alignItems: "center",
          textAlign: "left",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            border: "1px solid #60545c",
          },
          "& .MuiOutlinedInput-input": {
            minHeight: "0px !important",
            padding: "12px 14px",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "18px",
            color: "rgba(0,0,0,0.6)",
            fontFamily: "Rubik",
          },

          // Required for Select to remove extra height
          "& .MuiSelect-select": {
            minHeight: "0px !important",
            display: "flex",
            alignItems: "center",
          },
        },
      }}
    >
      {select &&
        options.map((opt) => (
          <MenuItem
            sx={{
              fontFamily: "Rubik",
              fontWeight: 400,
              fontSize: "16px",
              color: "rgba(0,0,0,0.6)",
              alignItems: "center",
            }}
            key={opt.value}
            value={opt.value}
          >
            {opt.label}
          </MenuItem>
        ))}
    </TextField>
  </Box>
);

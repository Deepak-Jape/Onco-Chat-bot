import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  Select,
  CircularProgress,
} from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import mail from "../../assets/mail-send.svg";
import {
  getSingleOrganization,
  deleteTeamMember,
  updateTeamMember,
  SentInvite,
} from "../../api/Profile";
import { isValidEmail } from "../../utils/helpers/helper";
import { useSnackbar } from "../../common/GlobalSnackbar";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

const TOTAL_SEATS = 10;

export default function TeamMembersTable({ organization_id, team_member_data = [] }) {
  debugger
  console.log("organization_id", organization_id)
  const { showSnackbar } = useSnackbar();
  const USER_EMAIL = localStorage.getItem("userEmail") || "";
  const userData = JSON.parse(localStorage.getItem("UserData") || "{}");

  const [rows, setRows] = useState(team_member_data);
  const [loading, setLoading] = useState(true);
  // const [apiCall, setApiCall] = useState(false);

  const [editingRowId, setEditingRowId] = useState(null);
  const [draftRow, setDraftRow] = useState(null);
  const [rowLoader, setRowLoader] = useState(null);

  const [inviteRole, setInviteRole] = useState(2);
  const [invitesEmail, setInvitesEmail] = useState("");
  const [loader, setLoader] = useState("");

  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoder, setDeleteLoder] = useState(false);

  // ─── Fetch team members ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        setLoading(true);
        // const response = await getSingleOrganization(organization_id);
        // setRows(response.users);
        setRows(team_member_data)
      } catch (error) {
        console.error("Error fetching organization:", error);
      } finally {
        setLoading(false);
      }
    };

    if (organization_id) fetchOrgData();
  }, [organization_id, team_member_data]);

  // ─── Seats ────────────────────────────────────────────────────────────────
  const usedSeats = rows.filter((row) => row.user_status === "Active").length;
  const seatProgress = (usedSeats / TOTAL_SEATS) * 100;

  // ─── Row edit handlers ────────────────────────────────────────────────────
  const handleEditRow = (row) => {
    setEditingRowId(row.user_id);
    setDraftRow({ ...row });
  };

  const handleCancelRowEdit = () => {
    setEditingRowId(null);
    setDraftRow(null);
  };

  const handleSaveEdit = async () => {
    setRowLoader(draftRow.id);
    try {
      const res = await updateTeamMember(
        draftRow.user_id,
        draftRow.role_id,
        draftRow.user_status,
      );
      if (res?.message === "Team member updated successfully") {
        showSnackbar({ message: res.message, type: "success" });
        // setApiCall(true);
        setRows((prev) =>
          prev.map((row) =>
            row.user_id === draftRow.user_id
              ? { ...row, role_id: draftRow.role_id, user_status: draftRow.user_status }
              : row
          )
        );
        setRowLoader(null);
        handleCancelRowEdit();
      } else {
        showSnackbar({
          message: res?.response?.data?.message || "Failed to update team member",
          type: "error",
        });
        setRowLoader(null);
        handleCancelRowEdit();
      }
    } catch (_err) {
      showSnackbar({ message: "Something went wrong", type: "error" });
      setRowLoader(null);
      handleCancelRowEdit();
    }
  };

  // ─── Delete handler ───────────────────────────────────────────────────────
  const handleRemove = async (id, email) => {
    try {
      setOpenDeleteAlert(false);
      const res = await deleteTeamMember(id, email);
      if (res.message === "User deleted successfully") {
        setDeleteLoder(false)
        team_member_data = team_member_data.filter(x => x.user_id != id);
        setRows(team_member_data);
        showSnackbar({ message: "User deleted successfully", type: "success" });
        setDeleteTarget(null)
      }
    } catch (_error) {
      setDeleteLoder(false)
      showSnackbar({ message: "Failed to remove user", type: "error" });
      setDeleteTarget(null)
    }
  };

  // ─── Invite handler ───────────────────────────────────────────────────────
  // const InviteUser = async () => {
  //   setLoader("Invite");
  //   const data = {
  //     invitedUserEmailAddress: invitesEmail
  //       ? invitesEmail.split(",").map((item) => item.trim()).filter(Boolean)
  //       : [],
  //     invitedByUserEmailAddress: USER_EMAIL || userData?.primary_email,
  //     role_id: inviteRole,
  //     organization_id: organization_id,
  //   };
  //   try {
  //     const res = await SentInvite(data);
  //     if (
  //       res.message === "Organization updated successfully" ||
  //       res.message === "Invitation sent successfully"
  //     ) {
  //       setInvitesEmail([]);
  //       setLoader("");
  //       setInviteRole(2);
  //       setApiCall(true);
  //       showSnackbar({ message: "Invite Sent Successfully", type: "success" });
  //     } else if (res.status === 400) {
  //       showSnackbar({ message: res.response.data.detail.message, type: "error" });
  //       setInvitesEmail([]);
  //       setLoader("");
  //       setInviteRole(2);
  //     }
  //   } catch (_error) {
  //     setInvitesEmail([]);
  //     setLoader("");
  //     setInviteRole(2);
  //   }
  // };

  // const emailValid = isValidEmail(invitesEmail);
  // const isInviteDisabled = loader === "Invite" || !emailValid;

  if (loading) return <LinearProgress />;

  return (
    <>
      {/* ── Table ── */}
      <Box sx={{ overflowX: "auto", height:"55vh" }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F3F4F6", height: "52px" }}>
              {["Name", "Email Address", "Joined", "Role", "Status", "Action"].map((head) => (
                <TableCell
                  key={head}
                  sx={headerCellStyle}
                  align={head === "Action" ? "center" : "left"}
                >
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isEditing = editingRowId === row.user_id;
                const data = isEditing ? draftRow : row;

                return (
                  <TableRow key={row.user_id} hover>
                    {/* NAME */}
                    <TableCell sx={cellStyle}>
                      <Typography sx={nameText}>
                        {`${row.first_name} ${row.last_name}`}
                      </Typography>
                    </TableCell>

                    {/* EMAIL */}
                    <TableCell sx={cellStyle}>
                      <Typography sx={subText}>{row.primary_email?.trim()}</Typography>
                    </TableCell>

                    {/* JOINED */}
                    <TableCell sx={cellStyle}>
                      <Typography sx={subText}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "—"}
                      </Typography>
                    </TableCell>

                    {/* ROLE */}
                    <TableCell sx={cellStyle}>
                      {
                        // row.role_id === 2 ? (
                        //     <Typography sx={roleText}>Super Admin</Typography>
                        // ) : 
                        isEditing ? (
                          <FormControl variant="standard" sx={{ minWidth: 80 }}>
                            <Select
                              value={data.role_id}
                              disableUnderline
                              variant="standard"
                              onChange={(e) =>
                                setDraftRow((p) => ({ ...p, role_id: Number(e.target.value) }))
                              }
                              IconComponent={KeyboardArrowDownIcon}
                              sx={roleDropdownStyle}
                            >
                              <MenuItem sx={menutext} value={2}>Super Admin</MenuItem>
                              <MenuItem sx={menutext} value={3}>Team Member</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography sx={roleText}>
                            {row.role_id === 1 ? "Oncosuite Admin" : row.role_id === 2 ? "Super Admin" : "Team Member"}
                          </Typography>
                        )}
                    </TableCell>

                    {/* STATUS */}
                    <TableCell sx={cellStyle}>
                      {isEditing ? (
                        <FormControl variant="standard" sx={{ minWidth: 80 }}>
                          <Select
                            value={data.user_status}
                            disableUnderline
                            variant="standard"
                            onChange={(e) =>
                              setDraftRow((p) => ({ ...p, user_status: e.target.value }))
                            }
                            IconComponent={KeyboardArrowDownIcon}
                            sx={roleDropdownStyle}
                          >
                            <MenuItem sx={menutext} value="ACTIVE">Active</MenuItem>
                            <MenuItem sx={menutext} value="INACTIVE">Inactive</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip label={row.user_status} sx={statusChip(row.user_status)} />
                      )}
                    </TableCell>

                    {/* ACTION */}
                    <TableCell align="center">
                      {isEditing ? (
                        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", alignItems: "center" }}>
                          {rowLoader === row?.id ? (
                            <CircularProgress size={18} />
                          ) : (
                            <SaveIcon sx={editIcon(row?.user_status)} onClick={() => handleSaveEdit(row)} />
                          )}
                          <CancelIcon sx={cancelIcon} onClick={handleCancelRowEdit} />
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                          <EditIcon
                            sx={editIcon(row.user_status)}
                            onClick={() => {
                              if (row.user_status !== "INVITE_SENT") handleEditRow(row);
                            }}
                          />
                          {/* <IconButton
                                disabled={userData.role_id > 2}
                                onClick={() => handleRemove(row.user_id, row.primary_email)}
                                sx={{ p: 0 }}
                            >
                                <DeleteIcon sx={deleteIcon(row.role_id)} />
                            </IconButton> */}

                          <IconButton
                            disabled={userData?.role_id > 2}
                            onClick={() => {
                              setDeleteTarget({ user_id: row.user_id, primary_email: row.primary_email })
                              setOpenDeleteAlert(true)
                            }
                            }
                            sx={{ p: 0 }}
                          >
                            {deleteLoder && deleteTarget.user_id === row?.user_id ? (
                              <CircularProgress color="error" size={18} />
                            ) : (

                              <DeleteIcon sx={{
                                width: "24px",
                                height: "24px",
                                color: userData?.role_id <= 2 ? "rgba(193,70,70,1)" : "rgba(217,217,224,1)",
                              }} />
                            )
                            }
                          </IconButton>

                          <DeleteConfirmDialog
                            open={!!openDeleteAlert}
                            email={deleteTarget?.primary_email}
                            onCancel={() => {
                              setOpenDeleteAlert(false);
                              setDeleteTarget(null)
                            } 
                          }
                            onConfirm={() => {
                              setDeleteLoder(true)
                              handleRemove(deleteTarget.user_id, deleteTarget.primary_email);
                              // setDeleteTarget(null);
                            }}
                          />

                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Box>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const EmptyState = () => (
  <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
    <Box sx={{ textAlign: "center" }}>
      <InboxOutlinedIcon sx={{ fontSize: 40, color: "rgba(0,0,0,0.18)" }} />
      <Typography sx={{ fontFamily: "Rubik", fontWeight: 500 }}>
        No team members yet
      </Typography>
      <Typography sx={{ fontFamily: "Rubik", color: "rgba(0,0,0,0.6)" }}>
        We couldn't find any team members. Invite colleagues to your workspace.
      </Typography>
    </Box>
  </Box>
);

// ─── Styles (copied verbatim from AdminOrganizationSettings) ─────────────────

const headerCellStyle = {
  fontFamily: "Rubik",
  fontWeight: 500,
  fontSize: "14px",
  color: "rgba(0,0,0,0.5)",
  borderBottom: "none",
};

const cellStyle = {
  fontSize: 14,
  borderBottom: "1px solid #E5E7EB",
};

const nameText = {
  fontFamily: "Rubik",
  fontWeight: 500,
  color: "rgba(0,0,0,0.8)",
  fontSize: "14px",
};

const menutext = {
  fontFamily: "Rubik",
  fontWeight: 400,
  color: "rgba(0,0,0,0.8)",
  fontSize: "14px",
};

const subText = {
  fontFamily: "Rubik",
  color: "rgba(0,0,0,0.6)",
  fontSize: "14px",
};

const roleText = {
  fontFamily: "Rubik",
  fontWeight: 500,
  color: "rgba(0,0,0,0.7)",
  fontSize: "14px",
};

const editIcon = (status) => ({
  color: status === "INVITE_SENT" ? "rgba(0,0,0,0.26)" : "rgba(38,102,190,1)",
  fontSize: 20,
  cursor: "pointer",
});

const cancelIcon = {
  color: "rgba(193,70,70,1)",
  fontSize: 20,
  cursor: "pointer",
};

const deleteIcon = (roleId) => ({
  width: "24px",
  height: "24px",
  color: roleId > 2 ? "rgba(193,70,70,1)" : "rgba(217,217,224,1)",
});

const statusChip = (status) => ({
  height: "22px",
  borderRadius: "4px",
  px: "8px",
  fontFamily: "Rubik",
  fontSize: "14px",
  bgcolor: status === "Active" ? "rgba(218,241,228,1)" : "#ECEEF2",
  color: status === "Active" ? "#16A34A" : "#6B7280",
  "& .MuiChip-label": { px: 0 },
});

const emailInput = {
  height: "44px",
  borderRadius: "6px",
  paddingLeft: "10px",
  paddingRight: "10px",
  fontFamily: "Rubik",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: "rgba(0,0,0,0.6)",
  backgroundColor: "rgba(255,255,255,0.3)",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.2)" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.2)" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(38,102,190,1)",
    borderWidth: "1px",
  },
  "& input::placeholder": { color: "rgba(0,0,0,0.6)", opacity: 1 },
};

const inviteBtn = {
  height: "44px",
  minHeight: "32px",
  whiteSpace: "nowrap",
  px: "30px",
  borderRadius: "6px",
  gap: "8px",
  bgcolor: "rgba(38,102,190,1)",
  color: "rgba(240,246,254,1)",
  fontFamily: "Rubik",
  fontWeight: 500,
  fontSize: "14px",
  lineHeight: "100%",
  letterSpacing: "0%",
  textTransform: "none",
  boxShadow: "none",
  "&:hover": { bgcolor: "rgba(38,102,190,1)", boxShadow: "none" },
  "& .MuiButton-startIcon": { marginRight: "8px" },
  "& .MuiSvgIcon-root": { fontSize: "18px", color: "rgba(240,246,254,1)" },
};

const roleDropdownStyle = {
  width: "auto",
  fontSize: "14px",
  fontFamily: "Rubik",
  color: "rgba(0,0,0,0.7)",
  "& .MuiInputBase-root": { fontFamily: "Rubik", fontSize: "14px", fontWeight: 400, color: "rgba(0,0,0,0.7)", paddingRight: "16px" },
  "& .MuiSelect-select": { paddingLeft: 0, paddingRight: "32px", display: "flex", alignItems: "center" },
  "& .MuiSelect-icon": { right: "4px", fontSize: "18px", pointerEvents: "none" },
  "& .MuiInput-root:before": { borderBottom: "none !important" },
  "& .MuiInput-root:after": { borderBottom: "none !important" },
  "& .MuiInput-root:hover:not(.Mui-disabled):before": { borderBottom: "none !important" },
};

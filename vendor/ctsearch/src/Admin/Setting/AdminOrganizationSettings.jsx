import React, { useEffect, useRef, useState } from "react";

import {
  Box,
  Typography,
  TextField,
  Switch,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Divider,
  Avatar,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  Select,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import mail from "../../assets/mail-send.svg";
import MenuItem from "@mui/material/MenuItem";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useLocation, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import {
  getSingleOrganization,
  deleteTeamMember,
  updateOrganization,
  getOrganizationAudit,
  uploadUserPhoto,
  uploadOrgaPhoto,
  getOrgaPhotoUrl,
  updateTeamMember,
  SentInvite,
} from "../../api/Profile";
import { Contact } from "lucide-react";
import Sidebar from "../../layout/sidebar/Sidebar";
import OrganizationSkelton from "./OrganizationSkelton";
import moment from "moment/moment";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { isValidEmail, notAvailableText } from "../../utils/helpers/helper";
import { useSnackbar } from "../../common/GlobalSnackbar";
import { AvatarCircle, CardWrapper, ReadField } from "./SettingCommon";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import TeamMembersTable from "./TeamMembersTable";
import OrganizationInfoPanel from "./OrganizationIfnoPanel";

export default function AdminOrganizationSettings() {
  const { showSnackbar } = useSnackbar();
  const { orgName } = useParams(); // Ensure your route has orgName
  const navigate = useNavigate();
  const USER_EMAIL = localStorage.getItem("userEmail") || "";
  const [loading, setLoading] = React.useState(true);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [loader, setLoader] = useState("");
  const [rows, setRows] = React.useState(teamRows);
  const location = useLocation();
  const TOTAL_SEATS = 100;
  const [isEdit, setIsEdit] = React.useState(false);
  const [isEditOrg, setIsEditOrg] = React.useState(false);
  const [apiCall, setApiCall] = React.useState(false);
  const [inviteRole, setInviteRole] = React.useState(2);
  const [invitesEmail, setInvitesEmail] = React.useState("");
  // const [auditList, setAuditList] = React.useState([]);
  const [originalPhoto, setOriginalPhoto] = useState("");
  const [originalData, setOriginalData] = useState();
  const [cropImage, setCropImage] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);

  // const [rows, setRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [draftRow, setDraftRow] = useState(null);
  const [rowLoader, setRowLoader] = useState(null);

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
        showSnackbar({
          message: res.message || "Team member updated successfully",
          type: "success",
        });
        setApiCall(true);
        setRowLoader(null);
        handleCancelRowEdit();
      } else {
        showSnackbar({
          message:
            res?.response?.data?.message || "Failed to update team member",
          type: "error",
        });
        setRowLoader(null);
        handleCancelRowEdit();
      }
    } catch (_err) {
      showSnackbar({
        message: "Something went wrong",
        type: "error",
      });
      setRowLoader(null);
      handleCancelRowEdit();
    }
  };

  const usedSeats = rows.filter((row) => row.user_status === "ACTIVE").length;

  const seatProgress = (usedSeats / TOTAL_SEATS) * 100;
  // States
  const [org, setOrg] = React.useState({
    name: "",
    domain: "",
    phone: "",
    status: "",
    country: "",
    city: "",
    state: "",
    zip: "",
    street: "",
    ssoEnabled: false,
    logo: "",
  });

  const [paymentInfo, setPaymentInfo] = React.useState({
    pocPerson: "",
    phone: "",
    country: "",
    city: "",
    state: "",
    zip: "",
    street: "",
  });
  const [contract, setContract] = React.useState({
    plan: "",
    value: "",
    renewalDate: "",
    seats: "",
  });

  useEffect(() => {
    if (location.state?.mode === "edit") {
      setIsEditOrg(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Integration of getSingleOrganization
  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        debugger
        setLoading(true);
        const response = await getSingleOrganization(orgName);
        // const auditResponse = await getOrganizationAudit(orgName);
        // console.log(auditResponse.data)
        // Mapping API keys to Component State
        // setAuditList(auditResponse.data || []);
        // setOrg({
        //   ...response.organization,
        //   name: response.organization.organization_name || "",
        //   domain: response.organization.website || "",
        //   phone: response.organization.phone_number || "",
        //   status: response.organization.organization_status_id, // Adjust logic based on your status IDs
        //   country: response.organization.country || "",
        //   city: response.organization.city || "",
        //   state: response.organization.state || "",
        //   zip: response.organization.zip || "",
        //   street: response.organization.address || "",
        //   ssoEnabled: response.organization.sso_enabled,
        //   logo: response.organization.logo || "",
        // });
        console.log(response.organization)
        setOriginalPhoto(`${response.organization.logo}` || "");
        setOriginalData(response.organization);
        setRows(response.users);
        // If contract/payment info comes from same API, set them here too
      } catch (error) {
        console.error("Error fetching organization:", error);
      } finally {
        setLoading(false);
      }
    };
    if (apiCall) {
      setApiCall(false);
    }
    if (orgName) fetchOrgData();
  }, [orgName, apiCall]);

  // if (loading) return <LinearProgress />;
  const InviteUser = async () => {
    setLoader("Invite");
    // console.log("Inviting user:", invitesEmail, "with role ID:", inviteRole);
    let data = {
      "invitedUserEmailAddress": invitesEmail
        ? invitesEmail
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
        : [],
      "invitedByUserEmailAddress": USER_EMAIL || userData?.primary_email,
      "role_id": inviteRole,
      "organization_id": orgName
    };
    try {
      console.log(data, USER_EMAIL)
      let res = await SentInvite(data);
      if (res.message === "Organization updated successfully" || res.message === "Invitation sent successfully") {
        setInvitesEmail([]);
        setLoader("");
        setInviteRole(2);
        setApiCall(true);
        showSnackbar({
          message: "Invite Sent Successfully",
          type: "success",
        });
      } else if (res.status === 400) {
        showSnackbar({
          message: res.response.data.detail.message,
          type: "error",
        });
        setInvitesEmail([]);
        setLoader("");
        setInviteRole(2);
        // setInviteError("Failed to send invite. Please try again.");
        // setInviteSuccess(false);
      }
    } catch (_error) {
      setInvitesEmail([]);
      setLoader("");
      setInviteRole(2);
    }
  };


  const fileInputRef = useRef(null);

  const userData = JSON.parse(localStorage.getItem("UserData") || "{}");
  // const handlePhotoChange = async (e) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   try {
  //     // 1️⃣ Upload photo
  //     const formData = new FormData();
  //     formData.append("photo", file);

  //     const uploadRes = await uploadOrgaPhoto(
  //       userData?.organization_id,
  //       formData,
  //     );

  //     if (!uploadRes?.photo_url) {
  //       throw new Error("Photo upload failed");
  //     }

  //     // 2️⃣ Prepare final logo URL
  //     // const finalUrl = `https://204.168.157.213.sslip.io/files/org_logos/${uploadRes.photo_url}`;
  //     const finalUrl = `https://204.168.157.213.sslip.io/files/${uploadRes.photo_url}`;
  //     setOrg({ ...org, logo: finalUrl });
  //   } catch (err) {
  //     console.error("Photo upload / org update failed:", err);
  //   } finally {
  //     // Reset input so same file can be selected again
  //     e.target.value = "";
  //   }
  // };

  // const handleRemovePhoto = async () => {
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  //   setOrg({ ...org, logo: "" });
  // };
  // const handlePhotoChange = (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = () => {
  //     setCropImage(reader.result);
  //     setCropOpen(true);
  //   };
  //   reader.readAsDataURL(file);

  //   e.target.value = "";
  // };


  // 2. Update your save handler to keep UI rendering separate from API data state
  // const handleCroppedSave = async (croppedFile) => {
  //   try {
  //     setPhotoLoading("uploading");
  //     const organization_id = orgName ? orgName : userData?.organization_id;
  //     if (!organization_id) {
  //       alert("Organization ID not found while uploading the logo. Please log out, log back in, and try again.");
  //       return;
  //     }
  //     const fileToUpload =
  //       croppedFile instanceof File
  //         ? croppedFile
  //         : new File(
  //           [croppedFile],
  //           `org_logo_${organization_id || Date.now()}.png`,
  //           { type: croppedFile?.type || "image/png" }
  //         );

  //     // ✅ Set local UI preview ONLY (keeps blob out of the 'org' payload object)
  //     const localBlobUrl = URL.createObjectURL(fileToUpload);
  //     setOriginalPhoto(localBlobUrl);
  //     const formData = new FormData();
  //     formData.append("photo", fileToUpload);

  //     // Call your upload endpoint
  //     const res = await uploadOrgaPhoto(organization_id, formData);

  //     // Convert the response photo path into a server URL
  //     const finalServerUrl = getOrgaPhotoUrl(res?.photo_url);
  //     console.log(finalServerUrl)

  //     // ✅ Save the real server URL to the organization state payload
  //     setOrg((prev) => ({
  //       ...prev,
  //       logo: finalServerUrl || "",
  //     }));

  //   } catch (err) {
  //     console.error("Failed to upload organization logo:", err);
  //     showSnackbar({ message: "Failed to upload logo", type: "error" });
  //     // Clear preview if upload completely fails
  //     setOriginalPhoto("");
  //   } finally {
  //     setPhotoLoading(null);
  //     setCropOpen(false);
  //   }
  // };

  // const handleCroppedSave = async (croppedFile) => {
  //   try {
  //     setPhotoLoading("uploading");

  //     const formData = new FormData();
  //     formData.append("photo", croppedFile);

  //     const uploadRes = await uploadOrgaPhoto(
  //       userData?.organization_id,
  //       formData,
  //     );

  //     const finalUrl = getOrgaPhotoUrl(uploadRes?.photo_url);
  //     setOriginalPhoto(finalUrl);
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setPhotoLoading(null);
  //     setCropOpen(false);
  //   }
  // };

  // const handleRemovePhoto = async () => {
  //   try {
  //     setPhotoLoading("removing");
  //     // setFormData((prev) => ({
  //     //   ...prev,
  //     //   user_photo: accountDetails?.user_photo,
  //     // }));
  //     setOriginalPhoto("");
  //     setOrg((prev) => ({
  //       ...prev,
  //       logo: "",
  //     }));
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = "";
  //     }
  //   } catch (err) {
  //     console.error("Failed to remove photo:", err);
  //   } finally {
  //     setPhotoLoading(null);
  //   }
  // };

  const emailValid = isValidEmail(invitesEmail);
  const isInviteDisabled = loader === "Invite" || !emailValid;
  console.log(originalPhoto)
  const isNoPhoto = ["null", "undefined", null, undefined, ""].includes(originalPhoto);
  return (
    <>
      <Box sx={{ display: "flex", minHeight: "100vh", width: "100%", position: "fixed" }}>
        <Sidebar activeTab={"SETTINGS"} />
        <Box sx={{ height: "100vh", overflow: "hidden", flex: 1 }}>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: "73px",
              right: 0,
              height: 65,
              paddingLeft: "5px",
              paddingRight: "24px",
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "#fff",
              boxShadow: "0px 8px 20px rgba(138,160,190,0.15)",
              zIndex: 1100,
            }}
          >
            <IconButton
              onClick={() =>
                navigate("/settings", {
                  state: { activeTab: "Organization" },
                })
              }
              sx={{ color: "rgba(0,0,0,0.6)" }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              fontFamily={"Rubik"}
              fontSize={27}
              fontWeight={400}
              color="rgba(0,0,0,0.6)"
            >
              Settings /
            </Typography>
            <Typography
              fontFamily={"Rubik"}
              fontSize={27}
              fontWeight={400}
              color="rgba(0,0,0,0.8)"
            >
              {originalData?.organization_name}
            </Typography>
          </Box>
          {loading ? (
            <OrganizationSkelton />
          ) : (
            <Box
              sx={{
                p: 3,
                scrollbarWidth: "thin",
                height: "90vh",
                overflowY: "scroll",
                marginTop: "72px",
                // paddingLeft: "77px"
                width: "95vw"
              }}
              className="app-scroll"
            >
              <OrganizationInfoPanel organization_id={orgName} organization_data = {originalData} isEditOrg = {isEditOrg}/>

              {/* CURRENT CONTRACT */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Box sx={{ display: "none" }}>
                  <CardWrapper>
                    <SectionHeaderWithAction
                      title="Current Contract"
                      subtitle="Your annual contract details and renewal information"
                      isEdit={isEdit}
                      onEdit={() => setIsEdit(true)}
                      onSave={() => setIsEdit(false)}
                    />

                    {/*  EDIT MODE */}
                    {isEdit && (
                      <FormGrid>
                        <Field
                          label="Plan"
                          value={contract.plan}
                          select
                          options={[
                            { label: "Pro Team", value: 1 },
                            { label: "Free Demo", value: 2 },
                          ]}
                          onChange={(v) =>
                            setContract({ ...contract, plan: v })
                          }
                        />

                        <Field
                          label="Annual Contract Value"
                          value={contract.value}
                          onChange={(v) =>
                            setContract({ ...contract, value: v })
                          }
                        />

                        <Field
                          label="Annually Renewal Date"
                          value={contract.renewalDate}
                          onChange={(v) =>
                            setContract({ ...contract, renewalDate: v })
                          }
                        />

                        <Field
                          label="Seats"
                          value={contract.seats}
                          onChange={(v) =>
                            setContract({ ...contract, seats: v })
                          }
                        />
                      </FormGrid>
                    )}

                    {/* READ MODE  */}
                    {!isEdit && (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "1fr 1fr 1fr 1.2fr",
                          },
                          columnGap: "32px",
                          rowGap: "16px",
                          mt: 2,
                          alignItems: "flex-start",
                        }}
                      >
                        <ReadField label="Plan" value="Pro Team" />
                        <ReadField
                          label="Annual Contract Value"
                          value="$120,000"
                        />
                        <ReadField
                          label="Annually Renewal Date"
                          value="January 1, 2025"
                        />

                        {/* Seats Included */}
                        <Box sx={{ width: 370 }}>
                          <Box
                            sx={{
                              border: "1px solid rgba(0,0,0,0.05)",
                              borderRadius: "8px",
                              padding: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "3px",
                            }}
                          >
                            {/* HEADER ROW */}
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: "Rubik",
                                  fontWeight: 400,
                                  fontSize: "14px",
                                  lineHeight: "20px",
                                  color: "rgba(0,0,0,0.6)",
                                }}
                              >
                                Seats Included
                              </Typography>

                              <Typography
                                sx={{
                                  fontFamily: "Rubik",
                                  fontWeight: 500,
                                  fontSize: "15px",
                                  lineHeight: "24px",
                                  color: "rgba(0,0,0,0.8)",
                                }}
                              >
                                {usedSeats} / {TOTAL_SEATS}
                              </Typography>
                            </Box>

                            {/* PROGRESS BAR */}
                            <LinearProgress
                              variant="determinate"
                              value={seatProgress}
                              sx={{
                                height: 6,
                                borderRadius: 10,
                                bgcolor: "#E6ECF5",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor: "#2666BE",
                                  borderRadius: 10,
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{ display: Contact.plan === 1 ? "block" : "none" }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Rubik",
                          fontWeight: 500,
                          fontSize: "24px",
                          lineHeight: "24px",
                          letterSpacing: "0%",
                          color: "rgba(0,0,0,0.8)",
                          mb: "4px",
                          textAlign: "left",
                        }}
                      >
                        Payment Info
                      </Typography>

                      {/* SUBTITLE */}
                      <Typography
                        sx={{
                          fontFamily: "Rubik",
                          fontWeight: 400,
                          fontSize: "16px",
                          lineHeight: "20px",
                          letterSpacing: "0%",
                          color: "rgba(0,0,0,0.6)",
                          textAlign: "left",
                        }}
                      >
                        Your payment information
                      </Typography>

                      <FormGrid>
                        {isEdit ? (
                          <>
                            <Field
                              label="Payment Poc Person"
                              value={paymentInfo.pocPerson}
                              onChange={(v) =>
                                setPaymentInfo({ ...paymentInfo, pocPerson: v })
                              }
                            />

                            <Field
                              label="Phone number"
                              value={paymentInfo.phone}
                              onChange={(v) =>
                                setPaymentInfo({ ...paymentInfo, phone: v })
                              }
                            />

                            <Field
                              label="Country"
                              value={paymentInfo.country}
                              onChange={(v) =>
                                setPaymentInfo({ ...paymentInfo, country: v })
                              }
                            />

                            <Field
                              label="City"
                              value={paymentInfo.city}
                              onChange={(v) =>
                                setPaymentInfo({ ...paymentInfo, city: v })
                              }
                            />

                            <Field
                              label="State/province/area"
                              value={paymentInfo.state}
                              onChange={(v) =>
                                setPaymentInfo({ ...paymentInfo, state: v })
                              }
                            />

                            <Field
                              label="Zip code"
                              value={paymentInfo.zip}
                              onChange={(v) =>
                                setPaymentInfo({ ...paymentInfo, zip: v })
                              }
                            />

                            <Field
                              full
                              label="Street"
                              value={paymentInfo.street}
                              onChange={(v) =>
                                setPaymentInfo({ ...paymentInfo, street: v })
                              }
                            />
                          </>
                        ) : (
                          <>
                            <ReadField
                              label="Payment Poc Person"
                              value="Zenaida S. Barnes"
                            />
                            <ReadField
                              label="Phone number"
                              value="+91 0112354214"
                            />
                            <ReadField label="Country" value="India" />
                            <ReadField label="City" value="Delhi" />
                            <ReadField
                              label="State/province/area"
                              value="Delhi"
                            />
                            <ReadField label="Zip code" value="110055" />
                          </>
                        )}
                      </FormGrid>

                      {isEdit ? (
                        <Field
                          full
                          label="Street"
                          value="C 21, Chiniot Basti, Multani Dhanda, Pahar Ganj"
                          sx={{ mt: 2 }}
                        />
                      ) : (
                        <ReadField
                          full
                          label="Street"
                          value="C 21, Chiniot Basti, Multani Dhanda, Pahar Ganj"
                          sx={{ mt: 2 }}
                        />
                      )}
                    </Box>
                  </CardWrapper>
                </Box>
                {/* TEAM MEMBERS */}

                <CardWrapper>
                  {/* Header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <SectionHeader
                        title="Team Members"
                        subtitle="Manage your team members and their permissions"
                      />
                    </Box>

                    {/* Seats */}
                    <Box sx={{ width: 280 }}>
                      <Box
                        sx={{
                          border: "1px solid rgba(0,0,0,0.05)",
                          borderRadius: "8px",
                          padding: "8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                          height: "50px",
                          width: "280px",
                        }}
                      >
                        {/* HEADER ROW */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: "Rubik",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "20px",
                              color: "rgba(0,0,0,0.6)",
                            }}
                          >
                            Seats Included
                          </Typography>

                          <Typography
                            sx={{
                              fontFamily: "Rubik",
                              fontWeight: 500,
                              fontSize: "15px",
                              lineHeight: "24px",
                              color: "rgba(0,0,0,0.8)",
                            }}
                          >
                            {usedSeats} / {TOTAL_SEATS}
                          </Typography>
                        </Box>

                        {/* PROGRESS BAR */}
                        <LinearProgress
                          variant="determinate"
                          value={seatProgress}
                          sx={{
                            height: 6,
                            borderRadius: 10,
                            bgcolor: "#E6ECF5",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: "#2666BE",
                              borderRadius: 10,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Invite */}
                  <Typography
                    sx={{
                      fontFamily: "Rubik",
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "18px",
                      letterSpacing: "0%",
                      color: "rgba(0,0,0,0.6)",
                      mb: "8px",
                      textAlign: "left",
                    }}
                  >
                    Invite members to this organization
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      mt: 2,
                      mb: 3,
                      alignItems: "flex-end",
                    }}
                  >
                    {/* Email Input */}
                    <Box sx={{ flex: 3 }}>
                      <TextField
                        fullWidth
                        type="email"
                        placeholder="Email address"
                        variant="outlined"
                        value={invitesEmail}
                        onChange={(e) => setInvitesEmail(e.target.value)}
                        // Optional: Show error state if user has typed something invalid
                        error={invitesEmail.length < 0}
                        helperText={
                          invitesEmail.length < 0 ? "Invalid email format" : ""
                        }
                        InputProps={{
                          sx: { ...emailInput, height: "44px" },
                        }}
                      />
                    </Box>

                    {/* Role Selector */}
                    <Box sx={{ flex: 1.5, minWidth: "180px" }}>
                      <Field
                        placeholder="Select role"
                        // Change: Link this to your state variable instead of hardcoded 3
                        value={inviteRole}
                        select
                        options={[
                          { label: "Member", value: 3 },
                          { label: "Super Admin", value: 2 },
                        ]}
                        onChange={(v) => setInviteRole(v)}
                        sx={{ mb: 0 }}
                      />
                    </Box>

                    {/* Send Invite Button */}
                    <Button
                      variant="contained"
                      // Logic: Disable if email is empty, role is empty, or email format is wrong
                      disabled={isInviteDisabled}
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
                      sx={{
                        ...inviteBtn,
                        height: "44px",
                        flex: "0 0 auto",
                        // Gray out the button visually when disabled if your theme doesn't do it automatically
                        "&.Mui-disabled": {
                          backgroundColor: "rgba(0, 0, 0, 0.12)",
                          color: "rgba(0, 0, 0, 0.26)",
                        },
                      }}
                      onClick={() => {
                        InviteUser();
                      }}
                    >
                      {loader === "Invite"
                        ? "Sending Invite..."
                        : "Send Invite"}
                    </Button>
                  </Box>

                  {/* TABLE */}

                  <TeamMembersTable organization_id={orgName}  team_member_data = {rows} />
                </CardWrapper>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
}

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

/*REUSABLE COMPONENTS  */

const SectionHeader = ({ title, subtitle, size = "h4" }) => {
  const isH5 = size === "h5";

  return (
    <Box mb={0}>
      <Typography
        sx={{
          fontFamily: "Rubik",
          fontWeight: 500,
          fontSize: "21px",
          lineHeight: "24px",
          letterSpacing: "0%",
          color: "rgba(0,0,0,0.8)",
          mb: "4px",
          textAlign: "left",
          gap: 55,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontFamily: "Rubik",
          fontWeight: 400,
          fontSize: "14px",
          lineHeight: "20px",
          letterSpacing: "0%",
          color: "rgba(0,0,0,0.6)",
          textAlign: "left",
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  );
};

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
  color: roleId === 2 ? "rgba(217,217,224,1)" : "rgba(193,70,70,1)",
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

const teamRows = [];
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

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0,0,0,0.2)",
  },

  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0,0,0,0.2)",
  },

  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(38,102,190,1)",
    borderWidth: "1px",
  },

  "& input::placeholder": {
    color: "rgba(0,0,0,0.6)",
    opacity: 1,
  },
};
const HeaderWithSave = ({ title, subtitle }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      mb: 2,
    }}
  >
    <Box>
      {/* TITLE */}
      <Typography
        sx={{
          fontFamily: "Rubik",
          fontWeight: 500,
          fontSize: "24px",
          lineHeight: "24px",
          color: "rgba(0,0,0,0.8)",
          textAlign: "left",
        }}
      >
        {title}
      </Typography>

      {/* SUBTITLE */}
      <Typography
        sx={{
          mt: "4px",
          fontFamily: "Rubik",
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: "20px",
          color: "rgba(0,0,0,0.6)",
        }}
      >
        {subtitle}
      </Typography>
    </Box>

    <Button variant="contained">Save</Button>
  </Box>
);
const SectionHeaderWithAction = ({
  title,
  subtitle,
  isEdit,
  onEdit,
  onSave,
  saveLoading,
  onCancel,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      mb: 2,
    }}
  >
    {title && subtitle && (
      <Box>
        <Typography
          sx={{
            fontFamily: "Rubik",
            fontWeight: 500,
            fontSize: "21px",
            lineHeight: "24px",
            color: "rgba(0,0,0,0.8)",
            textAlign: "left",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            fontFamily: "Rubik",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "20px",
            color: "rgba(0,0,0,0.6)",
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    )}

    {isEdit ? (
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="text"
          onClick={onCancel}
          sx={{
            color: "#d32f2f", // MUI error red
            fontSize: "14px",
            fontWeight: 500,
            height: "36px",
            textTransform: "capitalize",
            fontFamily: "Rubik",
          }}
        >
          Cancel
        </Button>
        <Button
          sx={{
            color: "rgba(255, 255, 255, 1) !important",
            border: saveLoading
              ? ""
              : "1px solid rgba(38, 102, 190, 1) !important",
            fontSize: "14px !important",
            fontWeight: "500 !important",
            width: "75px",
            height: "36px",
            textTransform: "capitalize",
            fontFamily: "Rubik",
          }}
          variant="contained"
          onClick={onSave}
          disabled={saveLoading}
        >
          {saveLoading ? "Saving...." : "Save"}
        </Button>
      </Box>
    ) : (
      <Button
        sx={{
          color: "rgba(38, 102, 190, 1) !important",
          border: "1px solid rgba(38, 102, 190, 1) !important",
          fontSize: "14px !important",
          fontWeight: "500 !important",
          width: "75px",
          height: "36px",
          textTransform: "capitalize",
          fontFamily: "Rubik",
        }}
        variant="outlined"
        onClick={onEdit}
      >
        Edit
      </Button>
    )}
  </Box>
);
const FormGrid = ({ children }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "repeat(2, 1fr)",
        // md: "repeat(3, 1fr)",
      },
      columnGap: "48px",
      rowGap: "16px",
      mt: 2,
    }}
  >
    {children}
  </Box>
);

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
    <Typography
      sx={{
        fontFamily: "Rubik",
        fontWeight: 500,
        fontSize: "14px",
        lineHeight: "18px",
        color: "rgba(0,0,0,0.6)",
        mb: "4px",
        textAlign: "left",
      }}
    >
      {label}
    </Typography>

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
            style={{
              fontSize: "14px",
              fontFamily: "Rubik",
              color: "rgba(0,0,0,0.6)",
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

  "&:hover": {
    bgcolor: "rgba(38,102,190,1)",
    boxShadow: "none",
  },

  "& .MuiButton-startIcon": {
    marginRight: "8px",
  },

  "& .MuiSvgIcon-root": {
    fontSize: "18px",
    color: "rgba(240,246,254,1)",
  },
};

const AuditItem = ({ title, meta }) => (
  <Box sx={{ mb: 3 }}>
    <Typography
      sx={{
        fontFamily: "Rubik",
        fontWeight: 500,
        fontSize: "15px",
        lineHeight: "20px",
        color: "rgba(0,0,0,0.8)",
      }}
    >
      {title}
    </Typography>

    <Typography
      sx={{
        mt: "2px",
        fontFamily: "Rubik",
        fontWeight: 400,
        fontSize: "12px",
        lineHeight: "20px",
        color: "rgba(0,0,0,0.6)",
      }}
    >
      {meta}
    </Typography>
  </Box>
);

const TeamTable = () => (
  <Box sx={{ mt: 2 }}>
    <Divider />
    <Box sx={{ display: "flex", py: 2, alignItems: "center" }}>
      <Typography flex={1} fontWeight={500}>
        John Doe
      </Typography>
      <Chip label="Active" color="success" size="small" />
    </Box>
  </Box>
);

const roleDropdownStyle = {
  width: "auto",
  fontSize: "14px",
  fontFamily: "Rubik",
  color: "rgba(0,0,0,0.7)",

  "& .MuiInputBase-root": {
    fontFamily: "Rubik",
    fontSize: "14px",
    fontWeight: 400,
    color: "rgba(0,0,0,0.7)",
    paddingRight: "16px",
  },

  "& .MuiSelect-select": {
    paddingLeft: 0,
    paddingRight: "32px",
    display: "flex",
    alignItems: "center",
  },

  "& .MuiSelect-icon": {
    right: "4px",
    fontSize: "18px",
    pointerEvents: "none",
  },

  "& .MuiInput-root:before": {
    borderBottom: "none !important",
  },
  "& .MuiInput-root:after": {
    borderBottom: "none !important",
  },
  "& .MuiInput-root:hover:not(.Mui-disabled):before": {
    borderBottom: "none !important",
  },
  ".css-1fedph1-MuiInputBase-root-MuiInput-root-MuiSelect-root::before": {
    borderBottom: "none !important",
  },
  ".css-1fedph1-MuiInputBase-root-MuiInput-root-MuiSelect-root::after": {
    borderBottom: "none !important",
  },
};

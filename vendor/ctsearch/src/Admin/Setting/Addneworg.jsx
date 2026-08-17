import React, { useState, useRef } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Switch,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Divider,
  Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AdminSidebar from "./AdminSidebar";
import MenuItem from "@mui/material/MenuItem";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useParams, useNavigate } from "react-router-dom";
import {
  addNewOrganization,
  addNewOrganizationContract,
  uploadOrgaPhoto,
  uploadUserPhoto,
  getOrgaPhotoUrl,
} from "../../api/Profile";
import moment from "moment";
import Sidebar from "../../layout/sidebar/Sidebar";
import { useSnackbar } from "../../common/GlobalSnackbar";
import { useSelector } from "react-redux";
import ImageCropperModal from "../../common/ImageCropperModal";
import { isValidEmail } from "../../utils/helpers/helper";

export default function Addneworg() {
  const [rows, setRows] = useState(teamRows);
  const handleRemove = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const userData = JSON.parse(localStorage.getItem("UserData") || "{}");

  const TOTAL_SEATS = 10;
  const { showSnackbar } = useSnackbar();
  const [isEditOrg, setIsEditOrg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const usedSeats = rows.filter(
    (row) => row.organization_status_id === 1,
  ).length;

  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [paymentInfo, setPaymentInfo] = useState({
    pocPerson: "",
    phone_number: "",
    country: "",
    city: "",
    state: "",
    zip: "",
    address: "",
  });

  const [contract, setContract] = useState({
    subscription_id: 1,
    contract_status_id: 1,
    start_date: moment(new Date().toLocaleDateString("en-US")).format("YYYY-MM-DD"),
    end_date: moment(new Date().toLocaleDateString("en-US")).format("YYYY-MM-DD"),
    seats_used: 0,
    annual_contract_value: Number(0).toFixed(2),
    plan_id: 2,
  });

  const [org, setOrg] = useState({
    logo: "",
    organization_name: "",
    website: "",
    phone_number: "",
    organization_status_id: 1,
    country: "",
    city: "",
    state: "",
    zip: "",
    address: "",
    invitedUserEmailAddress: "",
    role_id: "3",
  });

  const [errors, setErrors] = useState({});

  const updateOrgField = (key, value) => {
    if (key === "phone_number") {
      const onlyDigits = value.replace(/\D/g, "");
      if (value !== onlyDigits) {
        setErrors((prev) => ({
          ...prev,
          phone_number: "Only numbers are allowed",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          phone_number: "",
        }));
      }
      value = onlyDigits;
    }

    setOrg((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const { orgName } = useParams();
  const navigate = useNavigate();

  const [cropImage, setCropImage] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  const fileInputRef = useRef(null);

  const SaveData = async () => {
    if (!org.organization_name || !org.website) {
      showSnackbar({
        message: "Organization Name and Website are required",
        type: "error",
      });
      return;
    }

    const emailInput = org.invitedUserEmailAddress?.trim();
    if (emailInput && !isValidEmail(emailInput)) {
      showSnackbar({
        message: "Invited user email is invalid",
        type: "error",
      });
      return;
    }

    setLoading(true);

    const orgData = {
      ...org,
      organization_id: 0,
      is_deleted: false,
      invitedUserEmailAddress: emailInput
        ? emailInput.split(",").map((item) => item.trim()).filter(Boolean)
        : [],
    };

    try {
      const result = await addNewOrganization(orgData);

      if (
        result?.message === "Organization created successfully" ||
        result?.message === "Organization created and user invited successfully"
      ) {
        setFeedback({ open: true, message: "Success!", severity: "success" });
        setOrg({
          logo: "",
          organization_name: "",
          website: "",
          phone_number: "",
          organization_status_id: 1,
          country: "",
          city: "",
          state: "",
          zip: "",
          address: "",
          invitedUserEmailAddress: "",
          role_id: "3",
        });

        showSnackbar({
          message: "Organization created successfully",
          type: "success",
        });

        navigate("/settings", {
          state: { activeTab: "Organization" },
        });
      } else {
        const errorMsg = result.response?.data?.detail || "Unexpected response from server.";
        setFeedback({ open: true, message: errorMsg, severity: "error" });
        showSnackbar({ message: errorMsg, type: "error" });
      }
    } catch (error) {
      console.error("Save Error:", error);
      showSnackbar({ message: "Failed to create organization.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  // 1. Add a separate state at the top of your Addneworg component for UI preview
  const [logoPreview, setLogoPreview] = useState("");

  // 2. Update your save handler to keep UI rendering separate from API data state
  const handleCroppedSave = async (croppedFile) => {
    try {
      setPhotoLoading("uploading");

      const fileToUpload =
        croppedFile instanceof File
          ? croppedFile
          : new File(
            [croppedFile],
            `org_logo_${userData?.organization_id || Date.now()}.png`,
            { type: croppedFile?.type || "image/png" }
          );

      // ✅ Set local UI preview ONLY (keeps blob out of the 'org' payload object)
      const localBlobUrl = URL.createObjectURL(fileToUpload);
      setLogoPreview(localBlobUrl);

      const formData = new FormData();
      formData.append("photo", fileToUpload);

      // Call your upload endpoint
      const res = await uploadOrgaPhoto(userData?.organization_id || 0, formData);

      // Convert the response photo path into a server URL
      const finalServerUrl = getOrgaPhotoUrl(res?.photo_url);

      // ✅ Save the real server URL to the organization state payload
      setOrg((prev) => ({
        ...prev,
        logo: finalServerUrl || "",
      }));

    } catch (err) {
      console.error("Failed to upload organization logo:", err);
      showSnackbar({ message: "Failed to upload logo", type: "error" });
      // Clear preview if upload completely fails
      setLogoPreview("");
    } finally {
      setPhotoLoading(null);
      setCropOpen(false);
    }
  };

  // 3. Update the clear/remove function to clean up both states
  const handleRemovePhoto = () => {
    setLogoPreview("");
    setOrg((prev) => ({
      ...prev,
      logo: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  return (
    <>
      <Box sx={{ display: "flex", minHeight: "100vh", width: "100%", position: "fixed" }}>
        <Sidebar activeTab={"SETTINGS"} />
        <Box sx={{ height: "100vh", overflow: "hidden", flex: 1 }}>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: "76px",
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
            <Typography fontFamily={"Rubik"} fontSize={27} fontWeight={400} color="rgba(0,0,0,0.6)">
              Settings /
            </Typography>
            <Typography fontFamily={"Rubik"} fontSize={27} fontWeight={400} color="rgba(0,0,0,0.8)">
              Add New Organization
            </Typography>
          </Box>

          <Box
            sx={{
              scrollbarWidth: "thin",
              height: "90vh",
              overflowY: "scroll",
              p: 3,
              marginTop: "72px",
              // paddingLeft: "77px",
              width: '95vw'
            }}
            className="app-scroll"
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr" },
                gap: 3,
                mb: 3,
                alignItems: "start",
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <CardWrapper>
                  <Box sx={{ display: "flex", justifyContent: "space-between", flexDirection: "row" }}>
                    <HeaderWithSave
                      title="Organization Information"
                      subtitle="Your organization information and profile settings"
                      isEdit={isEditOrg}
                      onEdit={() => setIsEditOrg(true)}
                      onSave={() => setIsEditOrg(false)}
                    />
                  </Box>

                  <Box
                    sx={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", alignContent: "center", gap: 2 }}>
                      <Avatar
                        src={logoPreview || `https://oncosuite.com/user/setting/organization/photo/${org.logo}` || undefined}
                        alt="Organization Logo"
                        sx={{
                          height: 69,
                          width: 69,
                          bgcolor: (logoPreview || org.logo) ? "transparent" : "rgba(19, 51, 95, 1)",
                          fontWeight: 400,
                          fontFamily: "Rubik",
                          fontSize: "28px",
                        }}
                      >
                        {!(logoPreview || org.logo) && "OR"}
                      </Avatar>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        style={{ display: "none" }}
                        accept="image/*"
                      />
                      <Box sx={{ display: "flex", flexDirection: "row", gap: "20px", alignItems: "center" }}>
                        <Button
                          variant="outlined"
                          onClick={handleButtonClick}
                          disabled={photoLoading === "uploading"}
                          sx={{
                            fontFamily: "Rubik",
                            fontWeight: 500,
                            fontSize: "12px",
                            lineHeight: "100%",
                            textTransform: "none",
                            color: "rgba(38,102,190,1)",
                            border: "1px solid rgba(38,102,190,1)",
                            borderRadius: "6px",
                            height: "32px",
                            px: "12px",
                            minWidth: "auto",
                            "&:hover": { backgroundColor: "rgba(38,102,190,0.04)" },
                          }}
                        >
                          {photoLoading === "uploading" ? "Uploading..." : "Add Logo"}
                        </Button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          style={{ fontSize: "12px", fontWeight: "500", color: "#F15757", background: "none", border: "none", cursor: "pointer" }}
                        >
                          Remove
                        </button>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: "16px" }}>
                      <Button
                        variant="contained"
                        disabled={loading}
                        onClick={() => SaveData()}
                        sx={{
                          height: "44px",
                          px: "24px",
                          borderRadius: "6px",
                          backgroundColor: "#2666BE",
                          fontFamily: "Rubik",
                          fontWeight: 500,
                          fontSize: "13px",
                          textTransform: "none",
                          boxShadow: "0px 2px 6px rgba(38, 102, 190, 0.3)",
                          "&:hover": {
                            backgroundColor: "#2666BE",
                            boxShadow: "0px 3px 8px rgba(38, 102, 190, 0.35)",
                          },
                        }}
                      >
                        {loading ? "Saving..." : "Save"}
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={() => {
                          navigate(-1);
                          setLoading(false);
                          setOrg({
                            logo: "",
                            organization_name: "",
                            website: "",
                            phone_number: "",
                            organization_status_id: 1,
                            country: "",
                            city: "",
                            state: "",
                            zip: "",
                            address: "",
                            invitedUserEmailAddress: "",
                            role_id: "3",
                          });
                        }}
                        sx={{
                          height: "44px",
                          px: "24px",
                          borderRadius: "6px",
                          fontFamily: "Rubik",
                          fontWeight: 500,
                          fontSize: "13px",
                          textTransform: "none",
                          color: "rgba(0,0,0,0.6)",
                          borderColor: "rgba(0,0,0,0.2)",
                          "&:hover": {
                            borderColor: "rgba(0,0,0,0.3)",
                            backgroundColor: "rgba(0,0,0,0.02)",
                          },
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>

                  <FormGrid>
                    <Field
                      label="Organization Name"
                      value={org.organization_name}
                      onChange={(v) => updateOrgField("organization_name", v)}
                    />
                    <Field
                      label="Domain"
                      value={org.website}
                      onChange={(v) => updateOrgField("website", v)}
                    />
                    <Field
                      label="Phone"
                      error={errors?.phone_number}
                      helperText={errors?.phone_number}
                      value={org.phone_number}
                      onChange={(v) => updateOrgField("phone_number", v)}
                    />
                    <Field
                      label="Status"
                      value={org.organization_status_id}
                      select
                      options={[
                        { label: "Active", value: 1 },
                        { label: "Inactive", value: 2 },
                      ]}
                      onChange={(v) => updateOrgField("organization_status_id", v)}
                    />
                    <Field
                      label="Country"
                      value={org.country}
                      onChange={(v) => updateOrgField("country", v)}
                    />
                    <Field
                      label="City"
                      value={org.city}
                      onChange={(v) => updateOrgField("city", v)}
                    />
                    <Field
                      label="State"
                      value={org.state}
                      onChange={(v) => updateOrgField("state", v)}
                    />
                    <Field
                      label="Zip"
                      value={org.zip}
                      onChange={(v) => updateOrgField("zip", v)}
                    />
                  </FormGrid>

                  <Field
                    full
                    label="Street Address"
                    value={org.address}
                    onChange={(v) => updateOrgField("address", v)}
                    sx={{ mt: 2 }}
                  />
                </CardWrapper>
              </Box>
            </Box>

            {/* TEAM MEMBERS SECTION */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <CardWrapper>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Box>
                    <SectionHeader
                      title="Team Members"
                      subtitle="Manage your team members and their permissions"
                    />
                  </Box>
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
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontFamily: "Rubik", fontWeight: 400, fontSize: "14px", color: "rgba(0,0,0,0.6)" }}>
                          Seats Included
                        </Typography>
                        <Typography sx={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "15px", color: "rgba(0,0,0,0.8)" }}>
                          0 / {TOTAL_SEATS}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={0}
                        sx={{
                          height: 6,
                          borderRadius: 10,
                          bgcolor: "#E6ECF5",
                          "& .MuiLinearProgress-bar": { bgcolor: "#2666BE", borderRadius: 10 },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Typography
                  sx={{
                    fontFamily: "Rubik",
                    fontWeight: 500,
                    fontSize: "14px",
                    color: "rgba(0,0,0,0.6)",
                    mb: "8px",
                    textAlign: "left",
                  }}
                >
                  Add Admin to this organization
                </Typography>

                <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 3, alignItems: "flex-end" }}>
                  <Box sx={{ flex: 3 }}>
                    <TextField
                      fullWidth
                      placeholder="Email address"
                      variant="outlined"
                      value={org.invitedUserEmailAddress}
                      onChange={(e) => updateOrgField("invitedUserEmailAddress", e.target.value)}
                      InputProps={{
                        sx: { ...emailInput, height: "44px" },
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1.5, minWidth: "180px" }}>
                    <Field
                      placeholder="Select role"
                      value={org.role_id}
                      select
                      options={[
                        { label: "Member", value: 3 },
                        { label: "Super Admin", value: 2 },
                      ]}
                      onChange={(v) => updateOrgField("role_id", v)}
                      sx={{ mb: 0 }}
                    />
                  </Box>
                </Box>
              </CardWrapper>
            </Box>
          </Box>
        </Box>
      </Box>

      <ImageCropperModal
        open={cropOpen}
        image={cropImage}
        aspect={1}
        onClose={() => setCropOpen(false)}
        onSave={handleCroppedSave}
      />
    </>
  );
}

/* REUSABLE COMPONENTS */
const CardWrapper = ({ children, row }) => (
  <Box
    sx={{
      bgcolor: "#fff",
      borderRadius: 2,
      p: 3,
      boxShadow: "0px 4px 10px rgba(130,143,169,0.1)",
      display: row ? "flex" : "block",
      justifyContent: row ? "space-between" : "initial",
      alignItems: row ? "center" : "initial",
      border: "1px solid rgba(0, 0, 0, 0.05)",
    }}
  >
    {children}
  </Box>
);

const SectionHeader = ({ title, subtitle }) => (
  <Box mb={0}>
    <Typography sx={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "21px", color: "rgba(0,0,0,0.8)", mb: "4px", textAlign: "left" }}>
      {title}
    </Typography>
    <Typography sx={{ fontFamily: "Rubik", fontWeight: 400, fontSize: "14px", color: "rgba(0,0,0,0.6)", textAlign: "left" }}>
      {subtitle}
    </Typography>
  </Box>
);

const teamRows = [
  { name: "John Doe", email: "john.doe@hospital.com", joined: "Jan 15, 2024", role: "Admin", status: "Active" },
  { name: "Mike Chen", email: "john.doe@hospital.com", joined: "Jan 15, 2024", role: "Member", status: "Active" },
];

const emailInput = {
  height: "44px",
  borderRadius: "6px",
  paddingLeft: "10px",
  paddingRight: "10px",
  fontFamily: "Rubik",
  fontSize: "14px",
  color: "rgba(0,0,0,0.6)",
  backgroundColor: "rgba(255,255,255,0.3)",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.2)" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.2)" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(38,102,190,1)", borderWidth: "1px" },
};

const HeaderWithSave = ({ title, subtitle }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
    <Box>
      <Typography sx={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "24px", color: "rgba(0,0,0,0.8)", textAlign: "left" }}>
        {title}
      </Typography>
      <Typography sx={{ mt: "4px", fontFamily: "Rubik", fontWeight: 400, fontSize: "14px", color: "rgba(0,0,0,0.6)" }}>
        {subtitle}
      </Typography>
    </Box>
  </Box>
);

const FormGrid = ({ children }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
      columnGap: "48px",
      rowGap: "16px",
      mt: 2,
    }}
  >
    {children}
  </Box>
);

const Field = ({ label, value, onChange, full, sx, select = false, options = [], disabled, helperText, error }) => (
  <Box sx={{ gridColumn: full ? "1 / -1" : "auto", ...sx }}>
    <Typography sx={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "14px", color: "rgba(0,0,0,0.6)", mb: "4px", textAlign: "left" }}>
      {label}
    </Typography>
    <TextField
      fullWidth
      select={select}
      value={value}
      size="small"
      onChange={(e) => onChange?.(e.target.value)}
      SelectProps={{ IconComponent: KeyboardArrowDownIcon }}
      error={!!error}
      helperText={helperText}
      disabled={disabled}
      InputProps={{
        sx: {
          fontFamily: "Rubik",
          height: 44,
          color: "rgba(0,0,0,0.6)",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#60545c" },
          "& .MuiOutlinedInput-input": { padding: "12px 14px", fontSize: "16px" },
          "& .MuiSelect-select": { display: "flex", alignItems: "center" },
        },
      }}
    >
      {select &&
        options?.map((opt) => (
          <MenuItem sx={{ fontSize: "14px", fontFamily: "Rubik", color: "rgba(0,0,0,0.6)" }} key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
    </TextField>
  </Box>
);
// ```</Avatar>
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Avatar,
  Button,
  Typography,
  TextField,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuItem from "@mui/material/MenuItem";
import moment from "moment/moment";
import { notAvailableText } from "../../utils/helpers/helper";
import { ReadField, CardWrapper } from "./SettingCommon";
import ImageCropperModal from "../../common/ImageCropperModal";
import {
  getSingleOrganization,
  updateOrganization,
  getOrganizationAudit,
  uploadOrgaPhoto,
  getOrgaPhotoUrl,
} from "../../api/Profile";
import { useSnackbar } from "../../common/GlobalSnackbar";
import { useNavigate } from "react-router-dom";

// ─── Usage ────────────────────────────────────────────────────────────────────
// <OrganizationInfoPanel organization_id={orgName} />
// ─────────────────────────────────────────────────────────────────────────────

export default function OrganizationInfoPanel({ organization_id, organization_data, isEditOrg = false, isInfoShow = false }) {
  // debugger
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const USER_EMAIL = localStorage.getItem("userEmail") || "";
  const userData = JSON.parse(localStorage.getItem("UserData") || "{}");
  const fileInputRef = useRef(null);

  // ─── State ──────────────────────────────────────────────────────────────────
  const [isEdit, setIsEdit] = useState(isEditOrg);
  const [saveLoading, setSaveLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [originalPhoto, setOriginalPhoto] = useState("");
  const [originalData, setOriginalData] = useState(null);
  const [auditList, setAuditList] = useState([]);
  const [cropImage, setCropImage] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);

  const FONT_RUBIK = "Rubik";

  const styles = {
  sectionTitle: {
    fontFamily: FONT_RUBIK,
    fontSize: "20px",
    fontWeight: 500,
    lineHeight: "24px",
    color: "rgba(0,0,0,0.8)",
    textAlign: "left",
  },

  sectionSubtitle: {
    fontFamily: FONT_RUBIK,
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "20px",
    color: "rgba(0,0,0,0.6)",
    textAlign: "left",
  },
};

  const Heading = ({ children }) => (
  <h2 style={styles.sectionTitle}>{children}</h2>
);

const SubText = ({ children, className = "", style = {} }) => (
  <p className={className} style={{ ...styles.sectionSubtitle, ...style }}>
    {children}
  </p>
);

  const [org, setOrg] = useState({
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

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!organization_id) return;
    setOrg({
      ...organization_data,
      name: organization_data.organization_name || "",
      domain: organization_data.website || "",
      phone: organization_data.phone_number || "",
      status: organization_data.organization_status_id,
      country: organization_data.country || "",
      city: organization_data.city || "",
      state: organization_data.state || "",
      zip: organization_data.zip || "",
      street: organization_data.address || "",
      ssoEnabled: organization_data.sso_enabled,
      logo: organization_data.logo || "",
    });
    setOriginalPhoto(`${organization_data.logo}` || "");
    setOriginalData(organization_data);
    fetchOrgData();
  }, [organization_data, organization_id]);

  const fetchOrgData = async () => {
    try {
      // const response = await getSingleOrganization(organization_id);
      const auditResponse = await getOrganizationAudit(organization_id);
      const organization = organization_data
      setAuditList(auditResponse.data || []);
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  };
  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleCancel = () => {
    navigate("/settings", { state: { activeTab: "Organization" } });
    setIsEdit(false);
    setOriginalPhoto(originalData?.logo || "");
    setOrg({
      ...originalData,
      name: originalData?.organization_name || "",
      domain: originalData?.website || "",
      phone: originalData?.phone_number || "",
      status: originalData?.organization_status_id,
      country: originalData?.country || "",
      city: originalData?.city || "",
      state: originalData?.state || "",
      zip: originalData?.zip || "",
      street: originalData?.address || "",
      ssoEnabled: originalData?.sso_enabled,
      logo: originalData?.logo || "",
    });
  };

  const handleSaveOrganization = async () => {
    try {
      setSaveLoading(true);
      const payload = {
        organization_id: org.organization_id,
        organization_name: org.name,
        website: org.domain,
        phone_number: org.phone,
        organization_status_id: org.status,
        country: org.country,
        city: org.city,
        state: org.state,
        zip: org.zip,
        address: org.street,
        logo: org.logo,
      };
      const res = await updateOrganization(USER_EMAIL, payload);
      showSnackbar({
        message: res?.message || "Organization updated successfully",
        type: "success",
      });
      navigate("/settings", { state: { activeTab: "Organization" } });
      setOriginalPhoto(org.logo || "");
      setIsEdit(false);
      setSaveLoading(false);
    } catch (error) {
      console.error("Failed to update organization:", error);
      setSaveLoading(false);
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

  const handleCroppedSave = async (croppedFile) => {
    try {
      setPhotoLoading("uploading");
      const orgId = organization_id || userData?.organization_id;
      if (!orgId) {
        alert("Organization ID not found. Please log out, log back in, and try again.");
        return;
      }
      const fileToUpload =
        croppedFile instanceof File
          ? croppedFile
          : new File(
            [croppedFile],
            `org_logo_${orgId || Date.now()}.png`,
            { type: croppedFile?.type || "image/png" }
          );

      const localBlobUrl = URL.createObjectURL(fileToUpload);
      setOriginalPhoto(localBlobUrl);

      const formData = new FormData();
      formData.append("photo", fileToUpload);

      const res = await uploadOrgaPhoto(orgId, formData);
      const finalServerUrl = getOrgaPhotoUrl(res?.photo_url);

      setOrg((prev) => ({ ...prev, logo: finalServerUrl || "" }));
    } catch (err) {
      console.error("Failed to upload organization logo:", err);
      showSnackbar({ message: "Failed to upload logo", type: "error" });
      setOriginalPhoto("");
    } finally {
      setPhotoLoading(null);
      setCropOpen(false);
    }
  };

  const handleRemovePhoto = () => {
    setOriginalPhoto("");
    setOrg((prev) => ({ ...prev, logo: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getFormattedMeta = (date, firstName, lastName) => {
    const dateString = moment(date).calendar(null, {
      sameDay: "[Today at] h:mm A",
      lastDay: "[Yesterday at] h:mm A",
      lastWeek: "MMMM D [at] h:mm A",
      sameElse: "MMMM D, YYYY [at] h:mm A",
    });
    const nameString = `${firstName}${lastName ? " " + lastName : ""}`;
    return `${dateString} by ${nameString}`;
  };

  const isNoPhoto = ["null", "undefined", null, undefined, ""].includes(originalPhoto);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 400px" },
          gap: 3,
          mb: 3,
          alignItems: "start",
        }}
      >
        {/* ── Left: Org Info Card ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <CardWrapper>
            {
              isInfoShow &&
              (
                <>
                <Heading>Organization Information</Heading>
                <SubText style={{ marginTop: 8, marginBottom: 12 }}>
                  Your organization information and profile settings
                </SubText>
                </>
              )
            }

            {/* READ MODE */}
            {!isEdit && (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between", flexDirection: "row", mb: 2 }}>
                  <Avatar
                    src={isNoPhoto ? undefined : originalPhoto}
                    alt="avatar"
                    sx={{
                      height: 69, width: 69,
                      bgcolor: isNoPhoto ? "rgba(19, 51, 95, 1)" : "transparent",
                      fontWeight: 400, fontFamily: "Rubik", fontSize: "28px",
                    }}
                  >
                    {isNoPhoto && "OR"}
                  </Avatar>

                  <Button
                    variant="outlined"
                    onClick={() => setIsEdit(true)}
                    sx={{
                      color: "rgba(38, 102, 190, 1) !important",
                      border: "1px solid rgba(38, 102, 190, 1) !important",
                      fontSize: "14px !important", fontWeight: "500 !important",
                      width: "75px", height: "36px",
                      textTransform: "capitalize", fontFamily: "Rubik",
                    }}
                  >
                    Edit
                  </Button>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: "48px", rowGap: "16px" }}>
                  <ReadField label="Organization Name" value={org.name || notAvailableText} />
                  <ReadField label="Domain" value={org.domain || notAvailableText} />
                  <ReadField label="Phone" value={org.phone || notAvailableText} />
                  <ReadField
                    label="Status"
                    value={org.organization_status_id === 1 ? "Active" : "Inactive"}
                    color={org.organization_status_id === 1 ? "#1F8B4D" : "#E02424"}
                  />
                  <ReadField label="Country" value={org.country || notAvailableText} />
                  <ReadField label="City" value={org.city || notAvailableText} />
                  <ReadField label="State" value={org.state || notAvailableText} />
                  <ReadField label="Zip" value={org.zip || notAvailableText} />
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <ReadField label="Street Address" value={org.street || notAvailableText} />
                  </Box>
                </Box>
              </>
            )}

            {/* EDIT MODE */}
            {isEdit && (
              <>
                {/* Logo row + Save/Cancel */}
                <Box sx={{ flexDirection: "row", justifyContent: "space-between", display: "flex", alignItems: "center", gap: 2 }}>
                  {/* Logo controls */}
                  <Box sx={{ flexDirection: "row", display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={originalPhoto || undefined}
                      alt="avatar"
                      sx={{
                        height: 69, width: 69,
                        bgcolor: originalPhoto ? "transparent" : "rgba(19, 51, 95, 1)",
                        fontWeight: 400, fontFamily: "Rubik", fontSize: "28px",
                      }}
                    >
                      {!originalPhoto && "OR"}
                    </Avatar>

                    <Button
                      variant="outlined"
                      onClick={() => fileInputRef?.current?.click()}
                      sx={{
                        fontFamily: "Rubik", fontWeight: 500, fontSize: "14px",
                        lineHeight: "100%", textTransform: "none",
                        color: "rgba(38,102,190,1)", border: "1px solid rgba(38,102,190,1)",
                        borderRadius: "6px", height: "32px", px: "12px", minWidth: "auto",
                        "&:hover": { backgroundColor: "rgba(38,102,190,0.04)" },
                      }}
                    >
                      Change Logo
                    </Button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} hidden />

                    <Typography
                      onClick={handleRemovePhoto}
                      sx={{
                        fontFamily: "Rubik", fontWeight: 500, fontSize: "14px",
                        lineHeight: "100%", color: "rgba(241,87,87,1)", cursor: "pointer",
                      }}
                    >
                      Remove
                    </Typography>
                  </Box>

                  {/* Save / Cancel */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="text"
                      onClick={handleCancel}
                      sx={{
                        color: "#d32f2f", fontSize: "14px", fontWeight: 500,
                        height: "36px", textTransform: "capitalize", fontFamily: "Rubik",
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveOrganization}
                      disabled={saveLoading}
                      sx={{
                        color: "rgba(255, 255, 255, 1) !important",
                        border: saveLoading ? "" : "1px solid rgba(38, 102, 190, 1) !important",
                        fontSize: "14px !important", fontWeight: "500 !important",
                        width: "75px", height: "36px",
                        textTransform: "capitalize", fontFamily: "Rubik",
                      }}
                    >
                      {saveLoading ? "Saving...." : "Save"}
                    </Button>
                  </Box>
                </Box>

                {/* Form fields */}
                <FormGrid>
                  <Field label="Organization Name" value={org.name} onChange={(v) => setOrg({ ...org, name: v })} />
                  <Field label="Domain" value={org.domain} onChange={(v) => setOrg({ ...org, domain: v })} />
                  <Field label="Phone" value={org.phone} onChange={(v) => setOrg({ ...org, phone: v })} />
                  <Field
                    label="Status"
                    value={org.status}
                    select
                    options={[
                      { value: 1, label: "Active" },
                      { value: 2, label: "Inactive" },
                    ]}
                    onChange={(v) => setOrg({ ...org, status: v })}
                  />
                  <Field label="Country" value={org.country} onChange={(v) => setOrg({ ...org, country: v })} />
                  <Field label="City" value={org.city} onChange={(v) => setOrg({ ...org, city: v })} />
                  <Field label="State" value={org.state} onChange={(v) => setOrg({ ...org, state: v })} />
                  <Field label="Zip" value={org.zip} onChange={(v) => setOrg({ ...org, zip: v })} />
                </FormGrid>

                <Field
                  full
                  label="Street Address"
                  value={org.street}
                  onChange={(v) => setOrg({ ...org, street: v })}
                  sx={{ mt: 2 }}
                />
              </>
            )}
          </CardWrapper>
        </Box>

        {/* ── Right: Audit Log Card ── */}
        <Box sx={{ width: { xs: "100%", md: 400 } }}>
          <CardWrapper height={isEdit ? "530px" : "auto"}>
            <Typography sx={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "21px", lineHeight: "24px", color: "rgba(0,0,0,0.8)", textAlign: "left" }}>
              Audit Log
            </Typography>
            <Typography sx={{ mt: "4px", fontFamily: "Rubik", fontWeight: 400, fontSize: "14px", lineHeight: "20px", color: "rgba(0,0,0,0.6)", textAlign: "left" }}>
              View organization activity and changes
            </Typography>

            <Box sx={{ mt: 2, maxHeight: 356, minHeight: 356, overflowY: "auto", pr: 1, textAlign: "left" }}>
              {auditList.map((item) => (
                <AuditItem
                  key={item.audit_id}
                  title={`${item.object_name?.charAt(0).toUpperCase() + item.object_name?.slice(1)} ${item.action.toLowerCase()}d: ${item.primary_email}`}
                  meta={getFormattedMeta(item.created_at, item.first_name, item.last_name)}
                />
              ))}
            </Box>
          </CardWrapper>
        </Box>
      </Box>

      {/* Cropper — lives here since cropOpen/cropImage are local */}
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

// ─── Local sub-components (copied verbatim from AdminOrganizationSettings) ────

const AuditItem = ({ title, meta }) => (
  <Box sx={{ mb: 3 }}>
    <Typography sx={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "15px", lineHeight: "20px", color: "rgba(0,0,0,0.8)" }}>
      {title}
    </Typography>
    <Typography sx={{ mt: "2px", fontFamily: "Rubik", fontWeight: 400, fontSize: "12px", lineHeight: "20px", color: "rgba(0,0,0,0.6)" }}>
      {meta}
    </Typography>
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

const Field = ({ label, value, onChange, full, sx, select = false, options = [] }) => (
  <Box sx={{ gridColumn: full ? "1 / -1" : "auto", ...sx }}>
    <Typography
      sx={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: "rgba(0,0,0,0.6)", mb: "4px", textAlign: "left" }}
    >
      {label}
    </Typography>
    <TextField
      fullWidth
      select={select}
      value={value}
      size="small"
      onChange={(e) => onChange?.(e.target.value)}
      SelectProps={{ IconComponent: KeyboardArrowDownIcon }}
      InputProps={{
        sx: {
          fontFamily: "Rubik", height: 44, fontWeight: 400, fontSize: "16px",
          lineHeight: "18px", color: "rgba(0,0,0,0.6)", alignItems: "center", textAlign: "left",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "1px solid #60545c" },
          "& .MuiOutlinedInput-input": { minHeight: "0px !important", padding: "12px 14px", fontSize: "16px", fontWeight: 400, lineHeight: "18px", color: "rgba(0,0,0,0.6)", fontFamily: "Rubik" },
          "& .MuiSelect-select": { minHeight: "0px !important", display: "flex", alignItems: "center" },
        },
      }}
    >
      {select && options.map((opt) => (
        <MenuItem style={{ fontSize: "14px", fontFamily: "Rubik", color: "rgba(0,0,0,0.6)" }} key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  </Box>
);

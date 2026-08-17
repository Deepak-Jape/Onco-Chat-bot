import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import UserManagement from "./UserManagement";
import {
  uploadOrgaPhoto,
  getOrgaPhotoUrl,
  updateOrganization,
} from "../../api/Profile";

import SettingsUserManagement from "../../Admin/Setting/SettingsUserManagement";
import { notAvailableText } from "../../utils/helpers/helper";
import {
  AvatarCircle,
  CardWrapper,
  ReadField,
} from "../../Admin/Setting/SettingCommon";
import { Box, Button, Grid, Switch, TextField, Typography } from "@mui/material";
import { useSnackbar } from "../../common/GlobalSnackbar";
import OrganizationInfoPanel from "../../Admin/Setting/OrganizationIfnoPanel";


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
/* ----------------------------- Presentational ----------------------------- */
const Heading = ({ children }) => (
  <h2 style={styles.sectionTitle}>{children}</h2>
);

const SubText = ({ children, className = "", style = {} }) => (
  <p className={className} style={{ ...styles.sectionSubtitle, ...style }}>
    {children}
  </p>
);

export default function OrganizationTab({
  organizationSeats,
  teamMemberList,
  sentInvites,
  setApicall,
  organizationDetails,
  auditLogs,
}) {
  // debugger
  const USER_ROLE = localStorage.getItem("userRole") || "";
  const { showSnackbar } = useSnackbar();
  // const USER_ROLE = "Super Admin";
  const isOncoSuiteAdmin = USER_ROLE === "OncoSuits Admin";
  const isSuperAdmin = USER_ROLE === "Super Admin";
  const isTeamAdmin = USER_ROLE === "Team Manager";
  const isGlobalAdmin = USER_ROLE === "Global Admin";
  const canEditOrganization = isGlobalAdmin || isSuperAdmin;
  const USER_EMAIL = localStorage.getItem("userEmail") || "";
  const fileInputRef = useRef(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [isEditOrg, setIsEditOrg] = useState(false);
  const [saveOrgLoading, setSaveOrgLoading] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [originalPhoto, setOriginalPhoto] = useState("");
  const [orgDraft, setOrgDraft] = useState({
    organization_name: "",
    website: "",
    phone_number: "",
    organization_status_id: "",
    country: "",
    city: "",
    state: "",
    zip: "",
    address: "",
  });

  const OrganizationLogo = organizationDetails?.logo || "";

  useEffect(() => {
    if (!organizationDetails || isEditOrg) return;
    setOrgDraft({
      organization_name: organizationDetails?.organization_name || "",
      website: organizationDetails?.website || "",
      phone_number: organizationDetails?.phone || "",
      organization_status_id: organizationDetails?.organization_status_id || "",
      country: organizationDetails?.country || "",
      city: organizationDetails?.city || "",
      state: organizationDetails?.state || "",
      zip: organizationDetails?.zip || "",
      address: organizationDetails?.address || "",
    });
  }, [organizationDetails, isEditOrg]);

  const handleCancelOrgEdit = () => {
    setIsEditOrg(false);
    setOrgDraft({
      organization_name: organizationDetails?.organization_name || "",
      website: organizationDetails?.website || "",
      phone_number: organizationDetails?.phone || "",
      organization_status_id: organizationDetails?.organization_status_id || "",
      country: organizationDetails?.country || "",
      city: organizationDetails?.city || "",
      state: organizationDetails?.state || "",
      zip: organizationDetails?.zip || "",
      address: organizationDetails?.address || "",
    });
  };

  // const handleSaveOrgEdit = async () => {
  //   if (!canEditOrganization) {
  //     showSnackbar({
  //       message: "Only Global Admin can update organization",
  //       type: "error",
  //     });
  //     return;
  //   }
  //   if (!organizationDetails?.organization_id) return;
  //   try {
  //     setSaveOrgLoading(true);
  //     const payload = {
  //       organization_id: organizationDetails.organization_id,
  //       organization_name: orgDraft.organization_name,
  //       website: orgDraft.website,
  //       phone_number: orgDraft.phone_number,
  //       organization_status_id: orgDraft.organization_status_id,
  //       country: orgDraft.country,
  //       city: orgDraft.city,
  //       state: orgDraft.state,
  //       zip: orgDraft.zip,
  //       address: orgDraft.address,
  //     };

  //     const res = await updateOrganization(USER_EMAIL, payload);
  //     showSnackbar({
  //       message: res?.message || "Organization updated successfully",
  //       type: "success",
  //     });
  //     setIsEditOrg(false);
  //     setApicall(true);
  //   } catch {
  //     showSnackbar({
  //       message: "Failed to update organization",
  //       type: "error",
  //     });
  //   } finally {
  //     setSaveOrgLoading(false);
  //   }
  // };

  // const getFormattedMeta = (date, firstName, lastName) => {
  //   const dateString = moment(date).calendar(null, {
  //     sameDay: "[Today at] h:mm A",
  //     lastDay: "[Yesterday at] h:mm A",
  //     lastWeek: "MMMM D [at] h:mm A",
  //     sameElse: "MMMM D, YYYY [at] h:mm A",
  //   });

  //   const nameString = `${firstName}${lastName ? " " + lastName : ""}`;
  //   return `${dateString} by ${nameString}`;
  // };

  const userData = JSON.parse(localStorage.getItem("UserData") || "{}");



  return (
    <>
      {/* {(isTeamAdmin || isSuperAdmin) && !isOncoSuiteAdmin && (
        <div className="p-6 flex flex-col lg:flex-row gap-6">
          {isTeamAdmin && (
            <div className="flex flex-col gap-6 w-full lg:w-1/2">
              <div className="bg-white rounded-xl shadow-md p-6">
                <Heading>Organization Information</Heading>

                <SubText style={{ marginTop: 8, marginBottom: 12 }}>
                  Your organization information and profile settings
                </SubText>

                <div className="flex items-center gap-4 mb-5">
                  <img
                    src={photoPreview || organizationDetails?.logo || Avatar}
                    className="w-16 h-16 rounded-full"
                    alt="avatar"
                  />
                  {isTeamAdmin && (
                    <div className="flex gap-3">
                      <button
                        className="px-4 py-2 rounded-md border border-blue-600"
                        style={{
                          fontFamily: FONT_RUBIK,
                          fontSize: "14px",
                          fontWeight: 500,
                          lineHeight: "14px",
                          color: "rgb(38,102,190)",
                        }}
                        onClick={() => fileInputRef.current.click()}
                        disabled={photoLoading === "uploading"}
                      >
                        {photoLoading === "uploading"
                          ? "Uploading..."
                          : "Change Logo"}
                      </button>

                      <button
                        style={{
                          fontFamily: FONT_RUBIK,
                          fontSize: "14px",
                          fontWeight: 400,
                          lineHeight: "14px",
                          color: "rgb(220,38,38)",
                        }}
                        onClick={handleRemovePhoto}
                        disabled={photoLoading === "removing"}
                      >
                        {photoLoading === "removing" ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    hidden
                  />
                </div>

                <style>
                  {`
                .input-wrapper input {
                  font-family: ${FONT_RUBIK};
                  font-size: 16px;
                  font-weight: 400;
                  line-height: 18px;
                  color: rgba(0,0,0,0.6);
                  padding: 12px;
                }

                .input-wrapper input::placeholder {
                  color: rgba(0,0,0,0.6);
                }
              `}
                </style>

                <div className="input-wrapper">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Company Name
                      </label>
                      <input
                        className="border rounded-md w-full"
                        placeholder="Your company name"
                        value={organizationDetails?.organization_name || ""}
                        readOnly={!isTeamAdmin}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        VAT ID
                      </label>
                      <input
                        className="border rounded-md w-full"
                        placeholder="VAT ID"
                        value={organizationDetails?.vat_id || ""}
                        readOnly={!isTeamAdmin}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Domain
                      </label>
                      <input
                        className="border rounded-md w-full"
                        placeholder="Domain"
                        value={organizationDetails?.website || ""}
                        readOnly={!isTeamAdmin}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Country
                      </label>
                      <input
                        className="border rounded-md w-full"
                        placeholder="Country"
                        value={organizationDetails?.country || ""}
                        readOnly={!isTeamAdmin}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        City
                      </label>
                      <input
                        className="border rounded-md w-full"
                        placeholder="City"
                        value={organizationDetails?.city || ""}
                        readOnly={!isTeamAdmin}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        State
                      </label>
                      <input
                        className="border rounded-md w-full"
                        placeholder="State"
                        value={organizationDetails?.state || ""}
                        readOnly={!isTeamAdmin}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        ZIP
                      </label>
                      <input
                        className="border rounded-md w-full"
                        placeholder="ZIP"
                        value={organizationDetails?.zip || ""}
                        readOnly={!isTeamAdmin}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Street Address
                      </label>
                      <input
                        className="border rounded-md w-full"
                        placeholder="Street Address"
                        value={organizationDetails?.address || ""}
                        readOnly={!isTeamAdmin}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )} */}

      {isTeamAdmin && (
        <>
          <Grid
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "65% 33%",
              },
            }}
            padding={"2%"}
            container
            spacing={3}
          >
            <Grid>
              <div
                style={{
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                }}
                className="flex flex-col gap-6 "
              >
                <div className="bg-white rounded-xl shadow-md p-6">
                  {/* <Heading>Organization Information</Heading>

                  <SubText style={{ marginTop: 8, marginBottom: 12 }}>
                    Your organization information and profile settings
                  </SubText> */}

                  <div className="flex items-center gap-4 mb-5">
                    <Box>
                      <AvatarCircle
                        src={OrganizationLogo || ""}
                        text={OrganizationLogo ? "" : "OR"}
                      />
                    </Box>
                  </div>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      columnGap: "48px",
                      rowGap: "16px",
                    }}
                  >
                    <ReadField
                      label="Organization Name"
                      value={
                        organizationDetails?.organization_name ||
                        notAvailableText
                      }
                    />
                    <ReadField
                      label="Domain"
                      value={organizationDetails?.website || notAvailableText}
                    />

                    <ReadField
                      label="Phone"
                      value={organizationDetails?.phone || notAvailableText}
                    />
                    <ReadField
                      label="Status"
                      value={
                        organizationDetails?.organization_status_id === 1
                          ? "Active"
                          : "Inactive"
                      }
                      color={
                        organizationDetails?.organization_status_id === 1
                          ? "#1F8B4D"
                          : "#E02424"
                      }
                    />

                    <ReadField
                      label="Country"
                      value={organizationDetails?.country || notAvailableText}
                    />
                    <ReadField
                      label="City"
                      value={organizationDetails?.city || notAvailableText}
                    />

                    <ReadField
                      label="State"
                      value={organizationDetails?.state || notAvailableText}
                    />
                    <ReadField
                      label="Zip"
                      value={organizationDetails?.zip || notAvailableText}
                    />

                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <ReadField
                        label="Street Address"
                        value={organizationDetails?.address || notAvailableText}
                      />
                    </Box>
                  </Box>
                </div>

                <style>
                  {`
                .input-wrapper input {
                  font-family: ${FONT_RUBIK};
                  font-size: 16px;
                  font-weight: 400;
                  line-height: 18px;
                  color: rgba(0,0,0,0.6);
                  padding: 12px;
                }

                .input-wrapper input::placeholder {
                  color: rgba(0,0,0,0.6);
                }
              `}
                </style>

                {/* <div className="input-wrapper">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Company Name
                      </label>
                      <input
                        className={`border rounded-md w-full ${
                          !isOncoSuiteAdmin
                            ? "pointer-events-none focus:outline-none focus:ring-0 focus:border-gray-300 cursor-default bg-gray-100"
                            : ""
                        }`}
                        placeholder="Your company name"
                        value={organizationDetails?.organization_name || ""}
                        readOnly={!isOncoSuiteAdmin}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        VAT ID
                      </label>
                      <input
                        className={`border rounded-md w-full ${
                          !isOncoSuiteAdmin
                            ? "pointer-events-none focus:outline-none focus:ring-0 focus:border-gray-300 cursor-default bg-gray-100"
                            : ""
                        }`}
                        placeholder="VAT ID"
                        value={organizationDetails?.vat_id || ""}
                        readOnly={!isOncoSuiteAdmin}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Domain
                      </label>
                      <input
                        className={`border rounded-md w-full ${
                          !isOncoSuiteAdmin
                            ? "pointer-events-none focus:outline-none focus:ring-0 focus:border-gray-300 cursor-default bg-gray-100"
                            : ""
                        }`}
                        placeholder="Domain"
                        value={organizationDetails?.website || ""}
                        readOnly={!isOncoSuiteAdmin}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Country
                      </label>
                      <input
                        className={`border rounded-md w-full ${
                          !isOncoSuiteAdmin
                            ? "pointer-events-none focus:outline-none focus:ring-0 focus:border-gray-300 cursor-default bg-gray-100"
                            : ""
                        }`}
                        placeholder="Country"
                        value={organizationDetails?.country || ""}
                        readOnly={!isOncoSuiteAdmin}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        City
                      </label>
                      <input
                        className={`border rounded-md w-full ${
                          !isOncoSuiteAdmin
                            ? "pointer-events-none focus:outline-none focus:ring-0 focus:border-gray-300 cursor-default bg-gray-100"
                            : ""
                        }`}
                        placeholder="City"
                        value={organizationDetails?.city || ""}
                        readOnly={!isOncoSuiteAdmin}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        State
                      </label>
                      <input
                        className={`border rounded-md w-full ${
                          !isOncoSuiteAdmin
                            ? "pointer-events-none focus:outline-none focus:ring-0 focus:border-gray-300 cursor-default bg-gray-100"
                            : ""
                        }`}
                        placeholder="State"
                        value={organizationDetails?.state || ""}
                        readOnly={!isOncoSuiteAdmin}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        ZIP
                      </label>
                      <input
                        className={`border rounded-md w-full ${
                          !isOncoSuiteAdmin
                            ? "pointer-events-none focus:outline-none focus:ring-0 focus:border-gray-300 cursor-default bg-gray-100"
                            : ""
                        }`}
                        placeholder="ZIP"
                        value={organizationDetails?.zip || ""}
                        readOnly={!isOncoSuiteAdmin}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Street Address
                      </label>
                      <input
                        className={`border rounded-md w-full ${
                          !isOncoSuiteAdmin
                            ? "pointer-events-none focus:outline-none focus:ring-0 focus:border-gray-300 cursor-default bg-gray-100"
                            : ""
                        }`}
                        placeholder="Street Address"
                        value={organizationDetails?.address || ""}
                        readOnly={!isOncoSuiteAdmin}
                      />
                    </div>
                  </div>
                </div> */}
              </div>

              {/* Personal API Tokens */}
              {/* </div> */}
            </Grid>
          </Grid>
        </>
      )}

      {isSuperAdmin && (
        <>
          <Grid
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                // lg: "65% 33%",
              },
            }}
            padding={"2%"}
            container
            spacing={3}
          >
            <Grid
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <OrganizationInfoPanel organization_id={organizationDetails?.organization_id} organization_data = {organizationDetails} isInfoShow={true} />
              {/* <CardWrapper row>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "Rubik",
                      fontWeight: 500,
                      fontSize: "19px",
                      lineHeight: "24px",
                      letterSpacing: "0%",
                      color: "rgba(0,0,0,0.8)",
                      mb: "4px",
                      textAlign: "left",
                    }}
                  >
                    SAML 2.0 SSO
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
                    Enable SAML-based single sign-on for your organization
                  </Typography>
                </Box>
                <Switch
                  checked={!!organizationDetails.ssoEnabled} // Ensures it's a boolean value
                  onChange={async (e) => {
                    const isChecked = e.target.checked;
                    // Destructure ssoEnabled out, and collect everything else into 'rest'
                    let data = {
                      sso_enabled: isChecked,
                      organization_id: organizationDetails.organization_id,
                    };
                    const res = await updateOrganization(USER_EMAIL, data);
                    if (res.message) {
                      showSnackbar({
                        message:
                          res.message ?? "Organization Updated Successfully",
                        type: "success",
                      });
                      setApicall(true);
                    } else if (res.status === 400) {
                      showSnackbar({
                        message: res.response.data.detail.message,
                        type: "error",
                      });
                    }
                  }}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#2666BE",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#2666BE",
                    },
                  }}
                />
              </CardWrapper> */}
            </Grid>
          </Grid>

          <UserManagement
            teamMemberList={teamMemberList}
            organizationSeats={organizationSeats}
            setApicall={setApicall}
            sentInvites={sentInvites}
            organizationDetails = {organizationDetails}
          />
        </>
      )}

      {isOncoSuiteAdmin && <SettingsUserManagement />}
    </>
  );
}
const AuditItem = ({ title, meta }) => (
  <div sx={{ mb: 3 }}>
    <p
      style={{
        fontFamily: FONT_RUBIK,
        fontSize: "16px",
        fontWeight: 500,
        lineHeight: "20px",
        color: "rgba(0,0,0,0.8)",
        textAlign: "left",
        marginBottom: "4px",
      }}
    >
      {title}
    </p>
    <SubText style={{ marginTop: 8, marginBottom: 12 }}>{meta}</SubText>
  </div>
);

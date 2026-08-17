/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
// import Avatar from "../../assets/Avatar.svg";
import Switch from "@mui/material/Switch";
import { styled } from "@mui/material/styles";
import { updateProfileDetails } from "../../api/Profile";
import { uploadUserPhoto, deleteUserPhoto } from "../../api/Profile";
import { accountStyles } from "./style";
import { Avatar, Box, Grid } from "@mui/material";
import { notAvailableText } from "../../utils/helpers/helper";
import { useSnackbar } from "../../common/GlobalSnackbar";
import ImageCropperModal from "../../common/ImageCropperModal";
import { baseURL } from "../../api/AxiosInstance.jsx";

const FONT_RUBIK = "Rubik";

const styles = {
  sectionTitle: {
    fontFamily: FONT_RUBIK,
    fontSize: "21px",
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

const FigmaSwitch = styled(Switch)(() => ({
  width: 40,
  height: 24,
  padding: 0,
  overflow: "visible",
  display: "flex",
  "& .MuiSwitch-switchBase": {
    padding: 2,
    top: 0,
    left: 0,
    transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(16px)",
      "& + .MuiSwitch-track": {
        backgroundColor: "rgba(38,102,190,1)",
        opacity: 1,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    width: 20,
    height: 20,
    backgroundColor: "#ffffff",
    borderRadius: "100px",
    boxShadow:
      "0px 3px 1px rgba(0,0,0,0.06), 0px 3px 8px rgba(0,0,0,0.15), 0px 0px 1px rgba(0,0,0,0.04)",
  },
  "& .MuiSwitch-track": {
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.2)",
    opacity: 1,
  },
}));

// "fetchLatestData" is the function passed from parent to re-fetch accountDetails
export default function AccountTab({ accountDetails, setApiCall }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef(null);
  const classes = accountStyles();
  const [originalPhoto, setOriginalPhoto] = useState("");
  const [photoSrc, setPhotoSrc] = useState("");
  const previewUrlRef = useRef("");
  const photoErrorAttemptsRef = useRef(new Map());
  const fetchedPhotoUrlRef = useRef("");
  const fetchedObjectUrlRef = useRef("");
  const [cropImage, setCropImage] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    is_email_notifications: false,
    is_new_trial_alerts: false,
    user_photo: "",
  });
  const { showSnackbar } = useSnackbar();

  const extractFilename = (value) => {
    if (!value) return "";
    const trimmed = String(value).trim();
    if (!trimmed) return "";

    try {
      const url = new URL(trimmed);
      const last = url.pathname.split("/").filter(Boolean).pop();
      return last || "";
    } catch {
      // Not a URL; treat as a filename/path-like string.
      const last = trimmed.split("/").filter(Boolean).pop();
      return last || "";
    }
  };

  const buildUserPhotoUrl = (photoValue) => {
    const filename = extractFilename(photoValue);
    if (!filename) return "";

    const filesBaseUrl =
      (typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env.VITE_FILES_BASE_URL) ||
      "";

    const base = String(filesBaseUrl || baseURL || "").replace(/\/+$/, "");
    if (!base) return `/user/setting/user/photo/${filename}`;
    return `${base}/user/setting/user/photo/${filename}`;
  };

  const resolvePhotoUrl = (photoUrl) => {
    if (!photoUrl) return "";

    const trimmed = String(photoUrl).trim();
    if (!trimmed) return "";

    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    // Preferred setup: backend stores just the filename in `user_photo` and serves it from:
    // `GET /user/setting/user/photo/<filename>`.
    return buildUserPhotoUrl(trimmed);
  };

  useEffect(() => {
    // Don't override a freshly uploaded local preview with a server URL that may 404.
    if (previewUrlRef.current) return;
    setPhotoSrc(originalPhoto || "");
  }, [originalPhoto]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
      if (fetchedObjectUrlRef.current) {
        URL.revokeObjectURL(fetchedObjectUrlRef.current);
        fetchedObjectUrlRef.current = "";
      }
    };
  }, []);

  useEffect(() => {
    // Some backend/proxy setups return image bytes with a non-200 status (e.g. 404),
    // which makes <img src="..."> fail. Try loading via fetch and display the blob.
    if (previewUrlRef.current) return;
    if (!originalPhoto) return;
    if (fetchedPhotoUrlRef.current === originalPhoto) return;

    fetchedPhotoUrlRef.current = originalPhoto;

    const controller = new AbortController();

    const sniffIsImage = async (blob) => {
      if (!blob) return false;
      if (blob.type && blob.type.startsWith("image/")) return true;

      try {
        const buf = await blob.slice(0, 8).arrayBuffer();
        const bytes = new Uint8Array(buf);
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        const isPng =
          bytes.length >= 8 &&
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47 &&
          bytes[4] === 0x0d &&
          bytes[5] === 0x0a &&
          bytes[6] === 0x1a &&
          bytes[7] === 0x0a;
        // JPEG: FF D8 FF
        const isJpeg =
          bytes.length >= 3 &&
          bytes[0] === 0xff &&
          bytes[1] === 0xd8 &&
          bytes[2] === 0xff;

        return isPng || isJpeg;
      } catch {
        return false;
      }
    };

    const load = async () => {
      try {
        const res = await fetch(originalPhoto, {
          credentials: "include",
          signal: controller.signal,
          cache: "no-store",
        });

        const blob = await res.blob();
        const isImage = await sniffIsImage(blob);
        if (!isImage || blob.size === 0) {
          // Don't swap to a known-bad URL if we already have a usable blob URL.
          // Keeping the last good `photoSrc` avoids flicker/loops when backend
          // intermittently returns empty 404 bodies.
          if (!photoSrc || photoSrc === originalPhoto) {
            setPhotoSrc(originalPhoto);
          }
          return;
        }

        if (fetchedObjectUrlRef.current) {
          URL.revokeObjectURL(fetchedObjectUrlRef.current);
        }
        fetchedObjectUrlRef.current = URL.createObjectURL(blob);
        setPhotoSrc(fetchedObjectUrlRef.current);
      } catch {
        if (!photoSrc || photoSrc === originalPhoto) {
          setPhotoSrc(originalPhoto);
        }
      }
    };

    load();

    return () => controller.abort();
  }, [originalPhoto, photoSrc]);

  const ClearFormData = () => {
    setFormData({
      first_name: "",
      last_name: "",
      is_email_notifications: accountDetails.is_email_notifications || false,
      is_new_trial_alerts: accountDetails.is_new_trial_alerts || false,
    });
  };

  const handleCancel = () => {
    setIsEditMode(false);
    if (accountDetails.user_photo) {
      setOriginalPhoto(resolvePhotoUrl(accountDetails.user_photo));
    }
    setFormData({
      first_name: accountDetails.first_name || "",
      last_name: accountDetails.last_name || "",
      primary_email: accountDetails.primary_email || "",
      user_status: accountDetails.user_status || "",
      designation: accountDetails.designation || "",
      user_photo: accountDetails.user_photo || "",
      organization_name: accountDetails.organization_name || "",
      is_email_notifications: accountDetails.is_email_notifications || false,
      is_new_trial_alerts: accountDetails.is_new_trial_alerts || false,
    });
  };

  useEffect(() => {
    if (accountDetails) {
      setFormData({
        first_name: accountDetails.first_name || "",
        last_name: accountDetails.last_name || "",
        primary_email: accountDetails.primary_email || "",
        user_status: accountDetails.user_status || "",
        designation: accountDetails.designation || "",
        user_photo: accountDetails.user_photo || "",
        organization_name: accountDetails.organization_name || "",
        is_email_notifications: accountDetails.is_email_notifications || false,
        is_new_trial_alerts: accountDetails.is_new_trial_alerts || false,
      });
      // Avoid wiping a locally-set photo when the backend returns `null`.
      if (accountDetails.user_photo) {
        setOriginalPhoto(resolvePhotoUrl(accountDetails.user_photo));
      }
    }
  }, [accountDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name) => (e) => {
    const checked = e.target.checked;
    const updatedData = { ...formData, [name]: checked };
    setFormData(updatedData);

    // Auto-save toggle if not in edit mode
    if (!isEditMode) {
      saveData(updatedData, { silent: true });
    }
  };

  const saveData = async (dataToSave, options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
    }
    try {
      // Include ID and Role in the payload as requested
      const payload = {
        ...dataToSave,
        id: accountDetails?.id,
        role: accountDetails?.role,
        // Store just the filename in the profile record (backend serves it from /user/setting/user/photo/<filename>).
        user_photo: extractFilename(dataToSave?.user_photo || originalPhoto),
      };
      // 1. Call your API
      const res = await updateProfileDetails(payload);
      if (res) {
        showSnackbar({
          message: res?.message || "User details saved successfully",
          type: "success",
        });
      }

      setApiCall(true);
      setIsEditMode(false);
      // 2. Fetch the latest data from the server
      setApiCall(true); // Trigger parent to re-fetch accountDetails

      setIsEditMode(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const OnSaveClick = () => {
    saveData(formData);
  };

  // const handlePhotoChange = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   const formData = new FormData();
  //   formData.append("photo", file);

  //   try {
  //     setPhotoLoading("uploading");

  //     const res = await uploadUserPhoto(accountDetails.user_id, formData);

  //     const finalUrl = `https://204.168.157.213.sslip.io/files/${res.photo_url}`;
  //     setOriginalPhoto(finalUrl);
  //     // setFormData((prev) => ({
  //     //   ...prev,
  //     //   user_photo: finalUrl,
  //     // }));
  //   } catch (err) {
  //     console.error("Failed to upload photo:", err);
  //   } finally {
  //     setPhotoLoading(null);

  //     e.target.value = "";
  //   }
  // };

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

      const formData = new FormData();
      const fileToUpload =
        croppedFile instanceof File
          ? croppedFile
          : new File(
              [croppedFile],
              `user_photo_${accountDetails?.user_id || "me"}.png`,
              { type: croppedFile?.type || "image/png" },
            );

      // Show immediately (even if backend serving is misconfigured / delayed).
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      previewUrlRef.current = URL.createObjectURL(fileToUpload);
      setPhotoSrc(previewUrlRef.current);

      formData.append("photo", fileToUpload);

      const res = await uploadUserPhoto(accountDetails.user_id, formData);

      if (!res?.photo_url) {
        throw new Error("Photo upload failed");
      }

      const filename = extractFilename(res.photo_url);
      const finalUrl = buildUserPhotoUrl(filename);
      const serverUrl = `${finalUrl}?t=${Date.now()}`;
      setOriginalPhoto(serverUrl);

      // Persist the clean (non-cachebusted) URL to the profile API so it shows up
      // in the Account API response after refresh.
      // Keep the filename in form state so Save persists it.
      setFormData((prev) => ({ ...prev, user_photo: filename }));

      // Only switch from local preview -> server URL if it actually loads.
      const probe = new Image();
      probe.onload = () => {
        if (!previewUrlRef.current) return;
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
        setPhotoSrc(serverUrl);
      };
      probe.onerror = () => {
        // Keep the local preview if server hosting returns 404.
      };
      probe.src = serverUrl;
      // Don't force a full account refetch here; it can kick the UI out of edit
      // mode (parent remount) and feels like a page reload. The main "Save"
      // action can refresh server state if needed.
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to upload photo. Please try again.", "error");
    } finally {
      setPhotoLoading(null);
      setCropOpen(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setPhotoLoading("removing");
      // setFormData((prev) => ({
      //   ...prev,
      //   user_photo: accountDetails?.user_photo,
      // }));
      setOriginalPhoto("");
      setFormData((prev) => ({
        ...prev,
        user_photo: "",
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Failed to remove photo:", err);
    } finally {
      setPhotoLoading(null);
    }
  };

  // const handlePhotoChange = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   setPhotoPreview(URL.createObjectURL(file));

  //   const formData = new FormData();
  //   formData.append("photo", file);
  //   const userid = accountDetails.user_id;
  //   try {
  //     setPhotoLoading("uploading");
  //     const res = await uploadUserPhoto(userid, formData);
  //     setFormData((prev) => ({
  //       ...prev,
  //       user_photo: `https://204.168.157.213.sslip.io/files/${res.photo_url}`,
  //     }));
  //     // setApiCall(true);
  //     setPhotoLoading(false);
  //   } catch (err) {
  //     console.error("Failed to upload photo:", err);
  //     setPhotoLoading(false);
  //   }
  // };

  // const handleRemovePhoto = async () => {
  //   try {
  //     setPhotoLoading("removing");
  //     // const res = await deleteUserPhoto(accountDetails.user_id);
  //     setFormData((prev) => ({
  //       ...prev,
  //       user_photo: "",
  //     }));
  //     // setPhotoPreview(null);
  //     // setApiCall(true);
  //     setPhotoLoading(false);
  //   } catch (err) {
  //     console.error("Failed to remove photo:", err);
  //     setPhotoLoading(false);
  //   }
  // };

  return (
    <>
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
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
              className="flex flex-col gap-6"
            >
              <div className="bg-white rounded-xl shadow-md p-6">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Heading>Profile Information</Heading>
                    <SubText style={{ marginTop: 8, marginBottom: 12 }}>
                      Your personal information and profile settings
                    </SubText>
                  </div>
                  <div className="flex gap-1">
                    {isEditMode && (
                      <button
                        onClick={() => handleCancel()}
                        disabled={loading}
                        style={{
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#F15757",
                          width: "75px",
                          height: "36px",
                        }}
                        className="text-[14px] font-normal"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() =>
                        isEditMode ? OnSaveClick() : setIsEditMode(true)
                      }
                      disabled={loading}
                      className="px-4 py-2 rounded-md border text-[14px] font-medium"
                      style={{
                        borderColor: "#2666BE",
                        backgroundColor: isEditMode ? "#2666BE" : "transparent",
                        color: isEditMode ? "#ffffff" : "#2666BE",
                        fontSize: "14px",
                        fontWeight: "500",
                        width: "85px",
                        height: "36px",
                        boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)"

                      }}
                    >
                      {loading ? "Saving..." : isEditMode ? "Save" : "Edit"}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    {/* <img
                    src={formData?.user_photo || Avatar}
                    className="rounded-full"
                    alt="avatar"
                    style={{
                      height: "69px",
                      width: "69px",
                    }}
                  /> */}
                    <Avatar
                      src={photoSrc || ""}
                      alt="avatar"
                      sx={{
                        height: 69,
                        width: 69,
                      }}
                      imgProps={{
                        onError: () => {
                          const current = photoSrc || "";
                          if (!current) return;

                          const attempts =
                            photoErrorAttemptsRef.current.get(current) || 0;
                          if (attempts >= 2) return;
                          photoErrorAttemptsRef.current.set(
                            current,
                            attempts + 1,
                          );

                          // Common backend variants:
                          // - legacy `/files/<name>` -> now served by `/user/setting/user/photo/<name>`
                          if (current.includes("/files/")) {
                            setPhotoSrc(
                              current.replace("/files/", "/user/setting/user/photo/"),
                            );
                            return;
                          }

                          if (current.endsWith(".blob")) {
                            setPhotoSrc(current.replace(/\.blob(\?.*)?$/, ".png$1"));
                            return;
                          }
                        },
                      }}
                    />
                    <div className={isEditMode ? "flex gap-3" : "hidden"}>
                      <button
                        className="px-4 py-2 rounded-md border border-blue-600  font-medium text-blue-600"
                        onClick={() => fileInputRef.current.click()}
                        disabled={photoLoading === "uploading"}
                        style={{
                          width: "112px",
                          height: "32px",
                          fontSize: "12px",
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {photoLoading === "uploading"
                          ? "Uploading..."
                          : "Change Photo"}
                      </button>
                      <button
                        className="text-[14px] font-normal text-danger"
                        onClick={handleRemovePhoto}
                        disabled={photoLoading === "removing"}
                        style={{
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {photoLoading === "removing" ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>

                <style>
                  {`
                        .input-wrapper input {
                          font-family: ${FONT_RUBIK};
                          font-size: 16px;
                          font-weight: 400;
                          line-height: 18px;
                          color: rgba(0,0,0,0.8);
                          padding: 12px;
                        }
                        .input-wrapper input:disabled {
                          background-color: rgba(240, 240, 243, 1);
                          color: rgba(0,0,0,0.4);
                        }
                        `}
                </style>

                {isEditMode ? (
                  <div className="input-wrapper">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={classes.account_label}>
                          First Name
                        </label>
                        <input
                          className={classes.name_field}
                          placeholder={
                            formData.first_name ? "" : notAvailableText
                          }
                          value={formData.first_name || ""}
                          onChange={handleInputChange}
                          name="first_name"
                        />
                      </div>
                      <div>
                        <label className={classes.account_label}>
                          Last Name
                        </label>
                        <input
                          className={classes.name_field}
                          placeholder={
                            formData.last_name ? "" : notAvailableText
                          }
                          name="last_name"
                          value={formData.last_name || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={classes.account_label}>
                          Email Address
                        </label>
                        <input
                          className={classes.name_field}
                          placeholder={"Email address"}
                          value={
                            accountDetails?.primary_email || notAvailableText
                          }
                          disabled
                        />
                      </div>
                      <div>
                        <label className={classes.account_label}>Status</label>
                        <input
                          className={classes.name_field}
                          placeholder={"Status"}
                          value={
                            accountDetails?.user_status || notAvailableText
                          }
                          disabled
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={classes.account_label}>
                          Designation
                        </label>
                        <input
                          className={classes.name_field}
                          placeholder={
                            accountDetails?.designation || "Designation"
                          }
                          disabled
                        />
                      </div>
                      <div>
                        <label className={classes.account_label}>
                          Organization Name
                        </label>
                        <input
                          className={classes.name_field}
                          placeholder="Organization Name"
                          value={
                            accountDetails?.organization_name ||
                            notAvailableText
                          }
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-6 gap-x-12 text-justify">
                    <div>
                      <p className={classes.account_label_edit}>First Name</p>
                      <p className="text-sm font-normal text-gray-900">
                        {accountDetails?.first_name || notAvailableText}
                      </p>
                    </div>
                    <div>
                      <p className={classes.account_label_edit}>Last Name</p>
                      <p className="text-sm font-normal text-gray-900">
                        {accountDetails?.last_name || notAvailableText}
                      </p>
                    </div>
                    <div>
                      <p className={classes.account_label_edit}>
                        Email address
                      </p>
                      <p className="text-sm font-normal text-gray-900">
                        {accountDetails?.primary_email || notAvailableText}
                      </p>
                    </div>
                    <div>
                      <p className={classes.account_label_edit}>Status</p>
                      <p
                        className={`text-sm font-normal ${
                          accountDetails?.user_status
                            ? "text-green-600"
                            : "text-yellow-600"
                        } rounded inline-block`}
                      >
                        {accountDetails?.user_status || "Pending"}
                      </p>
                    </div>
                    <div>
                      <p className={classes.account_label_edit}>
                        Organization Name
                      </p>
                      <p className="text-sm font-normal text-gray-900">
                        {accountDetails?.organization_name || notAvailableText}
                      </p>
                    </div>
                    <div>
                      <p className={classes.account_label_edit}>Designation</p>
                      <p className="text-sm font-normal text-gray-900">
                        {accountDetails?.designation || notAvailableText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Grid>

          {/* Right Section */}
          <Grid>
            <div
              style={{
                border: "1px solid rgba(0, 0, 0, 0.05)",
                borderRadius: "8px",
              }}
              className="flex flex-col gap-6"
            >
              <div className="bg-white rounded-xl shadow-md p-6 h-[220px]">
                <Heading>Notification Preferences</Heading>
                <SubText style={{ marginTop: 8, marginBottom: 12 }}>
                  Choose how you want to be notified about trial updates
                </SubText>

                <div className="flex justify-between mb-5">
                  <div style={{ textAlign: "left" }}>
                    <p
                      style={{
                        color: "rgba(0,0,0,0.8)",
                        fontSize: "15px",
                        fontWeight: "500",
                      }}
                    >
                      Email Notifications
                    </p>
                    <p
                      style={{
                        color: "rgba(0,0,0,0.6)",
                        fontSize: "12px",
                        fontWeight: "400",
                        marginTop: "6px",
                      }}
                    >
                      Receive updates via email
                    </p>
                  </div>
                  <div className="flex items-center">
                    <FigmaSwitch
                      checked={formData.is_email_notifications}
                      onChange={handleSwitchChange("is_email_notifications")}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <div style={{ textAlign: "left" }}>
                    <p
                      style={{
                        color: "rgba(0,0,0,0.8)",
                        fontSize: "15px",
                        fontWeight: "500",
                      }}
                    >
                      New trial Alerts
                    </p>
                    <p
                      style={{
                        color: "rgba(0,0,0,0.6)",
                        fontSize: "12px",
                        fontWeight: "400",
                        marginTop: "6px",
                      }}
                    >
                      Get notified for matching trials
                    </p>
                  </div>
                  <div className="flex items-center">
                    <FigmaSwitch
                      checked={formData.is_new_trial_alerts}
                      onChange={handleSwitchChange("is_new_trial_alerts")}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Grid>
        </Grid>
      </Box>
      <ImageCropperModal
        open={cropOpen}
        image={cropImage}
        aspect={1} // 👈 change anywhere (1, 16/9, 4/3 etc)
        onClose={() => setCropOpen(false)}
        onSave={handleCroppedSave}
      />
    </>
  );
}

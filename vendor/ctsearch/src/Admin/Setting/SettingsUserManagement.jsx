import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Skeleton,
  TableContainer,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AdminSidebar from "./AdminSidebar";
import { useNavigate } from "react-router-dom";
import { getAllOrganizations } from "../../api/Profile";
import Sidebar from "../../layout/sidebar/Sidebar";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import OrganizationRowSkeleton from "../../pages/settings/SettingsSkeleton/OrganizationRowSkeleton";
import { useSnackbar } from "../../common/GlobalSnackbar";

export default function SettingsUserManagement({ apiCall = false }) {
  const navigate = useNavigate();
  let logedInUser = localStorage.getItem("userEmail") || "";
  // State for API data, loading, and errors
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();
  const rows_per_page = 20;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrollError, setScrollError] = useState(false);
  const [totalPages, setTotalPages] = useState(null);

  const fetchOrganizations = async (pageNo = 1, append = false) => {
    try {
      if (pageNo === 1) setLoading(true);
      else setLoadingMore(true);

      setScrollError(false); // reset before call

      const response = await getAllOrganizations(pageNo, rows_per_page);

      if (response?.data) {
        setOrganizations((prev) =>
          append ? [...prev, ...response.data] : response.data,
        );
        setTotalPages(response.total_pages);
        if (page >= response.total_pages) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (error) {
      showSnackbar({
        message: "Failed to load more organizations",
        type: "error",
      });

      // 🔴 STOP further scroll calls
      setHasMore(false);
      setScrollError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrganizations(1, false);
  }, []);

  const handleScroll = (e) => {
    if (scrollError || loadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    const reachedBottom = scrollHeight - scrollTop <= clientHeight + 10;

    if (reachedBottom && page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrganizations(nextPage, true);
    }
  };

  // Fetch data from API
  // useEffect(() => {
  //   const fetchOrganizations = async () => {
  //     try {
  //       // Replace with your actual API endpoint
  //       const response = await getAllOrganizations(1, rows_per_page);
  //       if (response && response.data) {
  //         setOrganizations(response.data);
  //       }
  //     } catch (error) {
  //       showSnackbar({
  //         message: error,
  //         type: "error",
  //       });
  //       console.error("Error fetching organizations:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchOrganizations();
  // }, []);

  // Helper to format date strings
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        bgcolor: "#fff",
        overflowX: "hidden",
      }}
    >
      {/* <Sidebar /> */}

      <Box sx={{ width: "stretch", p: 3, position: "fixed" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "Rubik",
                fontSize: "21px",
                fontWeight: 500,
                color: "rgba(0,0,0,0.8)",
                textAlign: "left",
              }}
            >
              {/* User Management */}
              User Management
            </Typography>
            <Typography
              sx={{
                fontFamily: "Rubik",
                fontSize: "14px",
                color: "rgba(0,0,0,0.6)",
              }}
            >
              Manage organizations and administrators
            </Typography>
          </Box>

          <Button
            startIcon={<AddIcon />}
            onClick={() => navigate("/settings/add-new-organization")}
            sx={{
              height: "44px",
              px: 2,
              bgcolor: "#2666BE",
              color: "#F0F6FE",
              borderRadius: "6px",
              textTransform: "none",
              fontFamily: "Rubik",
              fontSize: "13px",
              fontWeight: 500,
              "&:hover": { bgcolor: "#1E55A0" },
            }}
          >
            Add New Organization
          </Button>
        </Box>

        <Box sx={{ borderRadius: "4px", overflow: "hidden" }}>
          <TableContainer
            onScroll={handleScroll}
            sx={{
              maxHeight: 520,
              borderRadius: "4px",
              overflow: "auto",
              pb: "40px"
            }}
            className="app-scroll hide-x-scroll"
          >
            <Table sx={{ minWidth: 1100, tableLayout: "fixed" }} stickyHeader>
              <colgroup>
                <col style={{ width: 40 }} />
                <col style={{ width: 260 }} />
                <col style={{ width: 260 }} />
                <col />
                <col />
                <col style={{ width: 130 }} />
                <col />
              </colgroup>
              <TableHead>
                <TableRow hover sx={{ bgcolor: "#F0F0F3" }}>
                  {[
                    "#",
                    "Organization",
                    "Domain",
                    "Created",
                    "Last modified",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      align={h === "Action" ? "center" : "left"}
                      sx={{
                        ...headerStyle,
                        ...(h === "#" && {
                          position: "sticky",
                          left: 0,
                          zIndex: 4,
                          background: "#F0F0F3",
                        }),
                        ...(h === "Organization" && {
                          position: "sticky",
                          left: 40,
                          zIndex: 4,
                          background: "#F0F0F3",
                        }),
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {loading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))
                  : organizations?.map((org, index) => (
                      <TableRow key={org.organization_id} hover>
                        {/* # */}
                        <TableCell sx={indexCell}>{index + 1}</TableCell>

                        {/* Organization */}
                        <TableCell sx={orgCell}>
                          <EllipsisWithTooltip text={org.organization_name} />
                        </TableCell>

                        {/* Domain */}
                        <TableCell sx={domainCell}>
                          <EllipsisWithTooltip text={org.website} />
                        </TableCell>

                        {/* Created */}
                        <TableCell sx={subCell}>
                          {formatDate(org.created_at)}
                        </TableCell>

                        {/* Last Modified */}
                        <TableCell sx={subCell}>
                          {formatDate(org.updated_at) || "Never"}
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={subCell}>
                          <Chip
                            label={
                              org?.organization_status_id === 1
                                ? "Active"
                                : "Inactive"
                            }
                            sx={statusChip(org?.organization_status_id)}
                          />
                        </TableCell>

                        {/* Action */}
                        <TableCell align="center" sx={actionCell}>
                          <EditIcon
                            sx={iconStyle}
                            onClick={() =>
                              navigate(
                                `/settings/admin/organization/${org.organization_id}`,
                                { state: { mode: "edit" } },
                              )
                            }
                          />
                          <VisibilityIcon
                            sx={iconStyle}
                            onClick={() =>
                              navigate(
                                `/settings/admin/organization/${org.organization_id}`,
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                {scrollError ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Button
                        onClick={() => {
                          setHasMore(true);
                          setScrollError(false);
                          fetchOrganizations(page, true);
                        }}
                      >
                        Retry loading more
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : loadingMore ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}

const SkeletonRow = () => (
  <TableRow>
    {Array.from({ length: 7 }).map((_, i) => (
      <TableCell key={i}>
        <Skeleton height={24} />
      </TableCell>
    ))}
  </TableRow>
);

const stickyBodyCell = (left) => ({
  position: "sticky",
  left,
  zIndex: 3,
  background: "#fff",
  transition: "background 0.2s ease",

  // 👇 THIS is the magic
  ".MuiTableRow-hover:hover &": {
    background: "rgba(240, 240, 243, 1)", // same as MUI row hover color
  },
});

const headerStyle = {
  fontFamily: "Rubik",
  fontSize: "14px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.5)",
  borderBottom: "none",
  background: "#F0F0F3",
};

// const indexCell = {
//   // width: "50px",
//   color: "rgba(0,0,0,0.6)",
//   borderBottom: "1px solid #E5E7EB",
//   fontFamily: "Rubik",
//   fontSize: "14px",
// };

// const indexCell = {
//   position: "sticky",
//   left: 0,
//   zIndex: 3,
//   background: "#fff",
//   color: "rgba(0,0,0,0.6)",
//   borderBottom: "1px solid #E5E7EB",
//   fontFamily: "Rubik",
//   fontSize: "14px",
// };

const indexCell = {
  ...stickyBodyCell(0),
  color: "rgba(0,0,0,0.6)",
  borderBottom: "1px solid #E5E7EB",
  fontFamily: "Rubik",
  fontSize: "14px",
};

const domainCell = {
  minWidth: "220px",
  color: "rgba(0,0,0,0.6)",
  borderBottom: "1px solid #E5E7EB",
  fontFamily: "Rubik",
  fontSize: "14px",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
  ".MuiTableRow-hover:hover &": {
    background: "rgba(240, 240, 243, 1)", // same as MUI row hover color
  },
};

// const orgCell = {
//   fontWeight: 500,
//   color: "rgba(0,0,0,0.8)",
//   borderBottom: "1px solid #E5E7EB",
//   fontFamily: "Rubik",
//   fontSize: "14px",
// };

// const orgCell = {
//   position: "sticky",
//   left: 40, // width of # column
//   zIndex: 3,
//   background: "#fff",
//   fontWeight: 500,
//   color: "rgba(0,0,0,0.8)",
//   borderBottom: "1px solid #E5E7EB",
//   fontFamily: "Rubik",
//   fontSize: "14px",
// };
const orgCell = {
  ...stickyBodyCell(40),
  fontWeight: 500,
  color: "rgba(0,0,0,0.8)",
  borderBottom: "1px solid #E5E7EB",
  fontFamily: "Rubik",
  fontSize: "14px",
};

const subCell = {
  color: "rgba(0,0,0,0.6)",
  borderBottom: "1px solid #E5E7EB",
  fontFamily: "Rubik",
  fontSize: "14px",
  ".MuiTableRow-hover:hover &": {
    background: "rgba(240, 240, 243, 1)",
  },
};

const actionCell = {
  width: "80px",
  borderBottom: "1px solid #E5E7EB",
  fontFamily: "Rubik",
  fontSize: "14px",
  ".MuiTableRow-hover:hover &": {
    background: "rgba(240, 240, 243, 1)",
  },
};

const iconStyle = {
  color: "rgba(38, 102, 190, 1)",
  fontSize: 20,
  cursor: "pointer",
  mx: 0.5,
};

const EllipsisWithTooltip = ({ text, sx }) => (
  <Tooltip
    title={text || ""}
    arrow
    placement="bottom"
    componentsProps={{
      tooltip: {
        sx: {
          bgcolor: "#ffffff", // white background
          color: "rgba(0, 0, 0, 0.6)", // red text
          fontSize: "13px",
          fontFamily: "Rubik",
          border: "1px solid #e0e0e0",
        },
      },
      arrow: {
        sx: {
          color: "#ffffff", // arrow matches tooltip bg
        },
      },
    }}
  >
    <Box
      sx={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "100%",
        ...sx,
      }}
    >
      {text || "N/A"}
    </Box>
  </Tooltip>
);

const statusChip = (enabled) => ({
  height: "22px",
  fontSize: "12px",
  backgroundColor: "transparent",
  color: enabled === 1 ? "#1F8B4D" : "#C14646",
  borderRadius: "4px",
  fontFamily: "Rubik",
});

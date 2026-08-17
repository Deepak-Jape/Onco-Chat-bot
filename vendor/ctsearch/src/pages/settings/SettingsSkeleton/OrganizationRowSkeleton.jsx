import { Box, Skeleton, Divider } from "@mui/material";
import React from "react";

const OrganizationRowSkeleton = () => {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          py: 1.5,
          alignItems: "center",
        }}
      >
        {/* # */}
        <Box sx={{ width: "50px", px: 2 }}>
          <Skeleton variant="text" width={20} height={20} />
        </Box>

        {/* Organization */}
        <Box sx={{ flex: 1, px: 2 }}>
          <Skeleton variant="text" width="60%" height={24} />
        </Box>

        {/* Domain */}
        <Box sx={{ width: "220px", px: 2 }}>
          <Skeleton variant="text" width="80%" height={24} />
        </Box>

        {/* Created */}
        <Box sx={{ flex: 1, px: 2 }}>
          <Skeleton variant="text" width="70%" height={24} />
        </Box>

        {/* Last modified */}
        <Box sx={{ flex: 1, px: 2 }}>
          <Skeleton variant="text" width="70%" height={24} />
        </Box>

        {/* Status chip */}
        <Box sx={{ flex: 1, px: 2 }}>
          <Skeleton
            variant="rounded"
            width={110}
            height={24}
            sx={{ borderRadius: "4px" }}
          />
        </Box>

        {/* Action icons */}
        <Box
          sx={{
            width: "80px",
            px: 2,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="circular" width={20} height={20} />
        </Box>
      </Box>
      <Divider />
    </>
  );
};

export default OrganizationRowSkeleton;

import React from 'react';
import { Box, Skeleton, Divider } from '@mui/material';

export default function OrganizationSkelton() {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: "#F8F9FA",
        p: 3,
        mt: "66px", // Space for fixed header
        boxSizing: "border-box",
        // paddingLeft: "77px"
      }}
    >
      {/* Main Layout Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 400px", // Exact width from your original code
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* Left Column Content */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          
          {/* 1. Organization Information Skeleton */}
          <SkeletonCard>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
              <Box sx={{ width: "50%" }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="85%" height={20} />
              </Box>
              <Skeleton variant="rectangular" width={64} height={32} sx={{ borderRadius: "6px" }} />
            </Box>

            <Skeleton variant="circular" width={64} height={64} sx={{ mb: 4 }} />

            {/* Internal 2-column Grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "48px",
                rowGap: "16px",
              }}
            >
              {[...Array(12)].map((_, i) => (
                <Box key={i}>
                  <Skeleton variant="text" width="35%" height={18} />
                  <Skeleton variant="text" width="70%" height={24} />
                </Box>
              ))}
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Skeleton variant="text" width="15%" height={18} />
                <Skeleton variant="text" width="45%" height={24} />
              </Box>
            </Box>
          </SkeletonCard>

          {/* 2. SSO Card Skeleton */}
          {/* <SkeletonCard row>
            <Box sx={{ width: "70%" }}>
              <Skeleton variant="text" width="30%" height={28} />
              <Skeleton variant="text" width="80%" height={20} />
            </Box>
            <Skeleton variant="rectangular" width={40} height={20} sx={{ borderRadius: 10 }} />
          </SkeletonCard> */}

          {/* 3. Team Members Card Skeleton */}
          <SkeletonCard>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4, alignItems: "center" }}>
              <Box sx={{ width: "40%" }}>
                <Skeleton variant="text" width="75%" height={32} />
                <Skeleton variant="text" width="95%" height={20} />
              </Box>
              {/* Seats Progress Section */}
              <Box sx={{ width: 370, border: "1px solid rgba(0,0,0,0.05)", borderRadius: "8px", p: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="15%" />
                </Box>
                <Skeleton variant="rectangular" width="100%" height={6} sx={{ borderRadius: 10 }} />
              </Box>
            </Box>

            {/* Invite Form Skeleton */}
            <Box sx={{ display: "flex", gap: 2, mb: 4, alignItems: "flex-end" }}>
              <Skeleton variant="rectangular" sx={{ flex: 3, height: 44, borderRadius: "6px" }} />
              <Skeleton variant="rectangular" sx={{ flex: 1.5, height: 44, borderRadius: "6px" }} />
              <Skeleton variant="rectangular" sx={{ flex: 1, height: 44, borderRadius: "6px" }} />
            </Box>

            {/* Table Header Placeholder */}
            <Box sx={{ display: "flex", bgcolor: "#F3F4F6", p: 1.5, borderRadius: "4px 4px 0 0" }}>
               <Skeleton variant="text" width="100%" height={25} />
            </Box>
            
            {/* Table Rows */}
            {[...Array(3)].map((_, i) => (
              <Box key={i}>
                <Box sx={{ display: "flex", justifyContent: "space-between", py: 2, px: 1 }}>
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="20%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="10%" />
                  <Skeleton variant="text" width="10%" />
                  <Skeleton variant="circular" width={24} height={24} />
                </Box>
                <Divider />
              </Box>
            ))}
          </SkeletonCard>
        </Box>

        {/* Right Audit Column */}
        <Box>
          <SkeletonCard>
            <Skeleton variant="text" width="55%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="90%" height={20} sx={{ mb: 4 }} />
            
            {[...Array(7)].map((_, i) => (
              <Box key={i} sx={{ mb: 3 }}>
                <Skeleton variant="text" width="95%" height={20} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="65%" height={16} />
              </Box>
            ))}
          </SkeletonCard>
        </Box>
      </Box>
    </Box>
  );
}

// Internal Wrapper Components
const SkeletonCard = ({ children, row }) => (
  <Box
    sx={{
      bgcolor: "#fff",
      borderRadius: "8px",
      p: 3,
      boxShadow: "0px 4px 10px rgba(130,143,169,0.1)", // Matches your UI shadow
      width: "100%",
      display: row ? "flex" : "block",
      justifyContent: row ? "space-between" : "initial",
      alignItems: row ? "center" : "initial",
      boxSizing: "border-box",
    }}
  >
    {children}
  </Box>
);
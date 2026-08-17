import React from 'react';
import { Box, Divider } from '@mui/material';

export default function UserManagementSkeleton() {
  return (
    <Box className="animate-pulse" sx={{ bgcolor: "#fff", minHeight: "100vh", p: { xs: 2, md: 3 } }}>
      
      {/* TOP CARDS SECTION */}
      <Box
        sx={{
          display: "flex",
          gap: "20px",
          flexWrap: { xs: "wrap", lg: "nowrap" },
        }}
      >
        {/* Invite Card Skeleton - Using your exact sx style */}
        <Box sx={{ ...inviteCard, bgcolor: "#fff" }}>
          <Box className="bg-gray-300 h-6 w-48 rounded mb-2" /> {/* Title */}
          <Box className="bg-gray-200 h-4 w-3/4 rounded mb-6" /> {/* Subtitle */}
          
          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Box className="bg-gray-100 h-11 w-full rounded-md border border-gray-200" /> {/* Input */}
            <Box className="bg-gray-300 h-11 w-32 rounded-md" /> {/* Button */}
          </Box>
        </Box>

        {/* Seats Card Skeleton - Using your exact sx style */}
        <Box sx={{ ...seatsCard, bgcolor: "#fff" }}>
          <Box className="bg-gray-300 h-6 w-16 mb-4" /> {/* Seats Title */}
          
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1, mb: 1 }}>
            <Box className="bg-gray-200 h-4 w-24" /> {/* Seats Included label */}
            <Box className="bg-gray-300 h-4 w-12" /> {/* Count */}
          </Box>

          {/* Progress Bar Skeleton */}
          <Box className="bg-gray-100 h-3 w-full rounded-full my-4" />

          <Box className="bg-gray-200 h-4 w-40" /> {/* Footer text */}
        </Box>
      </Box>

      {/* TEAM MEMBERS TABLE SECTION */}
      <Box sx={{ mt: 4 }}>
        <Box className="bg-gray-300 h-7 w-40 mb-2" /> {/* Section Title */}
        <Box className="bg-gray-200 h-4 w-80 mb-6" /> {/* Subtitle */}

        <Box
          sx={{
            mt: 2,
            borderRadius: 1,
            overflowX: "auto",
            width: "100%",
          }}
        >
          {/* Header Skeleton - Using your exact tableHeader and tableGrid */}
          <Box sx={tableHeader}>
            <Box sx={tableGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Box key={i} className="bg-gray-400 h-4 w-20 rounded opacity-50" />
              ))}
            </Box>
          </Box>

          {/* Rows Skeleton - Using your exact row and tableGrid */}
          {[1, 2, 3, 4, 5].map((rowItem) => (
            <React.Fragment key={rowItem}>
              <Box sx={row}>
                <Box sx={tableGrid}>
                  {/* Name column */}
                  <Box className="bg-gray-300 h-5 w-32 rounded" />
                  {/* Email column */}
                  <Box className="bg-gray-200 h-4 w-48 rounded" />
                  {/* Joined column */}
                  <Box className="bg-gray-200 h-4 w-24 rounded" />
                  {/* Role column */}
                  <Box className="bg-gray-200 h-4 w-20 rounded" />
                  {/* Status Chip column */}
                  <Box className="bg-gray-200 h-6 w-16 rounded-full" />
                  {/* Action column */}
                  <Box className="bg-gray-200 h-6 w-6 rounded-full" />
                </Box>
              </Box>
              <Divider />
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* PASTE YOUR EXISTING STYLE OBJECTS BELOW 
  (inviteCard, seatsCard, tableHeader, tableGrid, row, etc.) 
  to ensure the Skeleton uses the exact same spacing as your UI.
*/

const inviteCard = {
  width: { xs: "100%", lg: "100%" },
  minHeight: 141,
  p: 2.5,
  borderRadius: 2,
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0px 4px 10px rgba(130,143,169,0.1)",
};

const seatsCard = {
  width: { xs: "100%", lg: 584 },
  minHeight: 141,
  p: "16px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0px 4px 10px rgba(130,143,169,0.1)",
};

const tableHeader = {
  bgcolor: "#F0F0F3",
  px: 2,
  py: 1.5,
};

const tableGrid = {
  display: "grid",
  gridTemplateColumns: `2fr 3fr 2fr 1.5fr 1.5fr 0.7fr`,
  alignItems: "center",
  columnGap: "16px",
  width: "100%",
  minWidth: "900px",
  textAlign: "left",
};

const row = {
  px: 2,
  py: 2,
  alignItems: "center",
};
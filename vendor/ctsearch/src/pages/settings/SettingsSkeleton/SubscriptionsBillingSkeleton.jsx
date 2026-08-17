import React from 'react';
import { Box, Divider } from '@mui/material';

export default function SubscriptionsBillingSkeleton() {
  return (
    <Box className="animate-pulse" sx={{ bgcolor: "#fff", minHeight: "100vh", p: { xs: 2, md: 3 } }}>
      <Box sx={root}>
        
        {/* 1. CURRENT CONTRACT SKELETON */}
        <Box sx={card}>
          <Box sx={header}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box className="bg-gray-300 h-7 w-48 rounded" /> {/* Title */}
                <Box className="bg-gray-200 h-6 w-20 rounded-full" /> {/* Plan Chip */}
              </Box>
              <Box className="bg-gray-100 h-4 w-80 rounded mt-2" /> {/* Subtitle */}
            </Box>
            <Box className="bg-gray-300 h-11 w-40 rounded" /> {/* Sales Button */}
          </Box>

          {/* Stats Grid */}
          <Box sx={statsRow}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={statBox}>
                <Box className="bg-gray-200 h-3 w-32 mb-3" /> {/* Label */}
                <Box className="bg-gray-300 h-6 w-24" /> {/* Value */}
              </Box>
            ))}
            {/* Seats Progress StatBox */}
            <Box sx={{ ...statBox, width: { xs: "100%", lg: 284 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box className="bg-gray-200 h-3 w-24" />
                <Box className="bg-gray-300 h-3 w-10" />
              </Box>
              <Box className="bg-gray-100 h-3 w-full rounded-full mt-4" /> {/* Progress Bar */}
            </Box>
          </Box>
        </Box>

        {/* 2. PAYMENT INFO SKELETON */}
        <Box sx={paymentCardRoot}>
          <Box className="bg-gray-300 h-7 w-32 mb-1" /> {/* Section Title */}
          <Box className="bg-gray-200 h-4 w-48 mb-4" /> {/* Section Subtitle */}

          {/* Card Placeholder */}
          <Box sx={paymentMethodRow}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box className="bg-gray-200 h-8 w-12 rounded" /> {/* CC Icon */}
              <Box>
                <Box className="bg-gray-300 h-4 w-44 mb-1" /> {/* Card Number */}
                <Box className="bg-gray-100 h-3 w-20" /> {/* Expiry */}
              </Box>
            </Box>
          </Box>

          {/* POC and Address Rows */}
          {[1, 2].map((row) => (
            <Box key={row} sx={{ ...infoRow, mt: 3 }}>
              <Box className="bg-gray-300 h-5 w-40" /> {/* Label */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box className="bg-gray-200 h-5 w-64" /> 
                {row === 2 && ( // Simulate address lines for second row
                  <>
                    <Box className="bg-gray-100 h-4 w-48" />
                    <Box className="bg-gray-100 h-4 w-56" />
                  </>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {/* 3. HISTORY SECTION SKELETON */}
        <Box sx={historyRoot}>
          <Box className="bg-gray-300 h-7 w-20 mb-1" />
          <Box className="bg-gray-200 h-4 w-96 mb-6" />

          {/* Tabs Bar */}
          <Box sx={tabWrapper}>
             <Box sx={{ display: 'flex', gap: 4, px: 2, pt: 1.5 }}>
                <Box className="bg-gray-300 h-8 w-40 opacity-50 border-b-2 border-blue-400" />
                <Box className="bg-gray-200 h-8 w-40 opacity-50" />
             </Box>
          </Box>

          {/* Table Skeleton */}
          <Box sx={{ mt: 2, border: '1px solid #F0F0F0', borderRadius: 1 }}>
            {/* Table Head */}
            <Box sx={{ ...tableHeaderRow, p: 2, display: 'flex', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Box key={i} className="bg-gray-300 h-3 w-20 opacity-40" />
              ))}
            </Box>
            {/* Table Rows */}
            {[1, 2, 3, 4].map((row) => (
              <Box key={row} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F0F0F0' }}>
                <Box className="bg-gray-200 h-4 w-24" />
                <Box className="bg-gray-300 h-4 w-24" />
                <Box className="bg-gray-300 h-4 w-24" />
                <Box className="bg-gray-300 h-4 w-16" />
                <Box className="bg-gray-200 h-6 w-16 rounded" />
                <Box className="bg-gray-200 h-8 w-8 rounded-full" />
              </Box>
            ))}
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

// --- ALL STYLE CONSTANTS FROM YOUR CODE ---
const root = { width: "100%", mx: "auto", p: 2 };
const card = { bgcolor: "#fff", p: 2, mb: 3, borderRadius: 2, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0px 4px 10px rgba(130,143,169,0.1)" };
const header = { display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: { xs: 1.5, sm: 0 } };
const statsRow = { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 284px" }, gap: 2, mt: 2 };
const statBox = { flex: 1, p: 2, borderRadius: 2, border: "1px solid rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", justifyContent: "space-between" };
const paymentCardRoot = { bgcolor: "#fff", p: { xs: 2, md: "15px" }, borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0px 4px 10px rgba(130,143,169,0.1)" };
const paymentMethodRow = { mt: "12px", p: "15px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)", display: "flex", alignItems: "center" };
const infoRow = { display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: "8px", mt: "12px" };
const historyRoot = { mt: 4, textAlign: "left" };
const tabWrapper = { borderBottom: '1px solid #F0F0F0', mt: 3, bgcolor: '#F8F9FB', borderRadius: '8px 8px 0 0' };
const tableHeaderRow = { bgcolor: '#F8F9FB' };
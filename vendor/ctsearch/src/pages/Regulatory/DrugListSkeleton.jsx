import { Box, Skeleton, Divider } from "@mui/material";

const FOOTER_HEIGHT = 52;

export default function DrugListSkeleton() {
  return (
    <Box
      sx={{
        width: 328,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "rgba(240,246,254,0.7)",
        borderRight: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      {/* HEADER SKELETON */}
      <Box sx={{ p: 2, bgcolor: "#F9F9FB" }}>
        <Skeleton width={100} height={18} />
        <Skeleton variant="rectangular" height={36} sx={{ mt: 1 }} />
        <Skeleton variant="rectangular" height={36} sx={{ mt: 1 }} />
        <Divider sx={{ my: 1, mx: "-16px" }} />
        <Skeleton width={120} height={18} />
      </Box>

      {/* LIST SKELETON */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          px: 2,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Box key={i} sx={{ py: 2 }}>
            <Skeleton width="80%" height={18} />
            <Skeleton width="60%" height={14} sx={{ mt: 0.5 }} />
            <Skeleton width={120} height={22} sx={{ mt: 1 }} />
            {i !== 4 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </Box>

      {/* FOOTER SKELETON */}
      <Box
        sx={{
          height: FOOTER_HEIGHT,
          px: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#F0F0F3",
          borderTop: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <Skeleton width={80} height={14} />
        <Skeleton width={120} height={14} />
      </Box>
    </Box>
  );
}

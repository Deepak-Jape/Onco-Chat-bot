import { Box, Skeleton, Divider } from "@mui/material";

export default function DrugDetailSkeleton() {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Card>
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Skeleton width={260} height={36} />
            <Skeleton width={140} height={22} />
          </Box>
          <Skeleton width={120} height={32} borderRadius={16} />
        </Box>

        <Box mt={2}>
          <Skeleton width={80} height={18} />
          <Skeleton width={320} height={22} />
        </Box>

        <Box mt={3} p={2} bgcolor="" borderRadius={2}>
          <Skeleton width={260} height={28} mb={2} />

          <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i}>
                <Skeleton width={120} height={18} />
                <Skeleton width={180} height={22} />
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Skeleton width={220} height={18} />
          <Skeleton width={420} height={22} />
        </Box>
      </Card>

      <Box mt={3}>
        <Card>
          <Skeleton width={320} height={28} />
          <Skeleton width="100%" height={22} />
          <Skeleton width="90%" height={22} />
        </Card>
      </Box>
      <SectionHeaderSkeleton />
      <Card>
        <Skeleton height={120} />
      </Card>

      <SectionHeaderSkeleton />
      {[1, 2].map((i) => (
        <Card key={i}>
          <Skeleton width={220} height={26} />
          <Skeleton width={140} height={18} />

          <Divider sx={{ my: 1 }} />

          <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} height={40} />
            ))}
          </Box>

          <Box mt={2}>
            <Skeleton width="100%" height={44} />
          </Box>
        </Card>
      ))}
      <SectionHeaderSkeleton />
      <Card>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={40} />
        ))}
      </Card>

      <SectionHeaderSkeleton />
      <Card>
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={4}>
          <Skeleton height={42} />
          <Skeleton height={42} />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Skeleton width={160} height={18} />
        <Skeleton width={360} height={22} />

        <Box mt={2}>
          <Skeleton height={60} />
        </Box>
      </Card>
      <SectionHeaderSkeleton />
      <Card>
        {[1, 2, 3].map((i) => (
          <Box key={i} display="flex" gap={1} mb={1}>
            <Skeleton variant="circular" width={18} height={18} />
            <Skeleton width="90%" height={20} />
          </Box>
        ))}
      </Card>
    </Box>
  );
}
const Card = ({ children }) => (
  <Box
    sx={{
      p: 2,
      mb: 3,
      borderRadius: 1,
      border: "1px solid rgba(0,0,0,0.05)",
      bgcolor: "#fff",
      boxShadow: "1px 8px 34px rgba(153,168,190,0.1)",
    }}
  >
    {children}
  </Box>
);

const SectionHeaderSkeleton = () => (
  <Skeleton width={360} height={32} sx={{ mb: 2 }} />
);

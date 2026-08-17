import { Grid, Skeleton } from "@mui/material";

export default function AnalyticsHeaderSkeleton() {
  return (
    <div className="h-screen relative pb-40 z-30 font-sans bg-mainBlue text-left">
      <div
        style={{ width: "100%", height: "100vh", margin: "0 auto" }}
        className="shadow-md rounded-sm border border-gray-200 bg-white"
      >
        <div
          className="flex w-full flex-col"
          style={{
            overflow: "hidden",
            maxHeight: "calc(100vh - 10rem)",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              gap: 12,
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={90}
                height={32}
                sx={{ borderRadius: 1 }}
              />
            ))}
          </div>
          <div
            style={{
              margin: 20,
              padding: 20,
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Skeleton width={260} height={28} />

              <div style={{ display: "flex", gap: 10 }}>
                <Skeleton width={80} height={32} />
                <Skeleton width={90} height={32} />
                <Skeleton width={90} height={32} />
              </div>
            </div>

            {/* Chart */}
            <Skeleton
              variant="rectangular"
              height={320}
              width="100%"
              sx={{ borderRadius: 2 }}
            />
          </div>
          <div
            style={{
              margin: "0 20px 10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Skeleton width={260} height={26} />

            <div style={{ display: "flex", gap: 8 }}>
              <Skeleton width={70} height={32} />
              <Skeleton width={80} height={32} />
            </div>
          </div>
          <Grid
            container
            spacing={2}
            sx={{ px: 2, pb: 4 }}
          >
            {/* Age */}
            <Grid item xs={12} md={6}>
              <div
                style={{
                  padding: 16,
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Skeleton width={80} height={22} />
                  <Skeleton width={80} height={28} />
                </div>

                <Skeleton
                  variant="rectangular"
                  height={260}
                  width="100%"
                  sx={{ borderRadius: 2 }}
                />
              </div>
            </Grid>

            {/* Gender */}
            <Grid item xs={12} md={6}>
              <div
                style={{
                  padding: 16,
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Skeleton width={90} height={22} />
                  <Skeleton width={80} height={28} />
                </div>

                <Skeleton
                  variant="rectangular"
                  height={260}
                  width="100%"
                  sx={{ borderRadius: "50%" }}
                />
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    </div>
  );
}

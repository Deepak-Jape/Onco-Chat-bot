import { Grid } from "@mui/material";

export default function AccountSkeleton() {
  return (
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
            {/* Title and Subtitle */}
            <div className="h-6 w-48 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-80 bg-gray-200 rounded mb-6"></div>

            {/* Avatar Section */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-gray-300"></div>
              <div className="flex gap-3">
                <div className="h-9 w-28 bg-gray-200 rounded-md"></div>
                <div className="h-9 w-20 bg-gray-100 rounded-md"></div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-11 w-full bg-gray-100 border border-gray-200 rounded-md"></div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-11 w-full bg-gray-100 border border-gray-200 rounded-md"></div>
                </div>
              </div>

              {/* Full Width Inputs */}
              {[1].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-11 w-full bg-gray-100 border border-gray-200 rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Grid>

      <Grid>
        <div
          style={{
            border: "1px solid rgba(0, 0, 0, 0.05)",
            borderRadius: "8px",
          }}
          className="flex flex-col gap-6 "
        >
          <div
            className="bg-white rounded-xl shadow-md p-6"
            style={{ height: "220px" }}
          >
            {/* Title and Subtitle */}
            <div className="h-6 w-56 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-40 bg-gray-200 rounded mb-8"></div>

            {/* Toggle Row 1 */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col gap-2">
                <div className="h-5 w-40 bg-gray-300 rounded"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
              </div>
              <div className="h-6 w-10 bg-gray-300 rounded-full"></div>
            </div>

            {/* Toggle Row 2 */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <div className="h-5 w-36 bg-gray-300 rounded"></div>
                <div className="h-4 w-64 bg-gray-200 rounded"></div>
              </div>
              <div className="h-6 w-10 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </Grid>
    </Grid>
  );
}

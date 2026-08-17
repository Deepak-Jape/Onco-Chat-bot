import { Grid } from "@mui/material";
import React from "react";

export default function OrganizationSkeleton() {
  const USER_ROLE = localStorage.getItem("userRole") || "";
  const isTeamAdmin = USER_ROLE === "Team Manager";
  return (
    <div className="p-1 gap-6 ">
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
              <div className="h-6 w-56 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-72 bg-gray-200 rounded mb-6"></div>

              {/* Logo Section */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gray-300"></div>
                <div className="flex gap-3">
                  <div className="h-9 w-32 bg-gray-200 rounded-md"></div>
                  <div className="h-9 w-20 bg-gray-100 rounded-md"></div>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="flex flex-col gap-4">
                {/* Row 1: Company & VAT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-28 bg-gray-200 rounded"></div>
                    <div className="h-11 w-full bg-gray-100 border border-gray-100 rounded-md"></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    <div className="h-11 w-full bg-gray-100 border border-gray-100 rounded-md"></div>
                  </div>
                </div>

                {/* Row 2: Domain (Full Width) */}
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-11 w-full bg-gray-100 border border-gray-100 rounded-md"></div>
                </div>

                {/* Row 3: Country & City */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-11 w-full bg-gray-100 border border-gray-100 rounded-md"></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    <div className="h-11 w-full bg-gray-100 border border-gray-100 rounded-md"></div>
                  </div>
                </div>

                {/* Row 4: State & ZIP */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    <div className="h-11 w-full bg-gray-100 border border-gray-100 rounded-md"></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    <div className="h-11 w-full bg-gray-100 border border-gray-100 rounded-md"></div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </Grid>

        {!isTeamAdmin && (
          <Grid>
            <div
              style={{
                border: "1px solid rgba(0, 0, 0, 0.05)",
                borderRadius: "8px",
              }}
              className="flex flex-col gap-6"
            >
              <div
                style={{
                  height: "580px",
                }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                {/* Header */}
                <div className="h-6 w-32 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded mb-6"></div>

                {/* Scrollable List Container */}
                <div
                  className="mt-6 flex flex-col gap-6 overflow-hidden"
                  style={{ height: "484px" }}
                >
                  {[1, 2, 3, 4, 5,6].map((i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 border-b border-gray-50 pb-4"
                    >
                      {/* Event Description */}
                      <div className="h-5 w-3/4 bg-gray-300 rounded"></div>
                      {/* Timestamp and User */}
                      <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Grid>
        )}
      </Grid>
    </div>
  );
}

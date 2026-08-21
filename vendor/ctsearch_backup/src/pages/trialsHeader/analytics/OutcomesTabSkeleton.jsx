import { Skeleton } from "@mui/material";

export default function OutcomesTabSkeleton() {
  return (
    <div
      className="w-full flex flex-col gap-6"
      style={{ width: "99%", margin: "0 auto" }}
    >
      {/* ---------------- ROW 1 ---------------- */}
      <div className="flex flex-col lg:flex-row gap-4 ipad-content-fix">
        {/* LEFT : Endpoint Table */}
        <div
          className="w-full lg:w-1/2 bg-white rounded shadow outline outline-1 outline-gray-200/60 px-4 py-4 flex flex-col"
          style={{ height: "343px" }}
        >
          <Skeleton width={220} height={28} className="mb-4" />

          {/* Table Head */}
          <div className="overflow-x-auto w-full">
            <div className="inline-block min-w-max">
              <div className="flex mb-1">
                <Skeleton width={80} height={25} className="mr-2" />
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton
                    key={i}
                    width={60}
                    height={25}
                    className="mr-2"
                  />
                ))}
              </div>

              {/* Table Rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex mb-1">
                  <Skeleton width={80} height={28} className="mr-2" />
                  {[1, 2, 3, 4].map((cell) => (
                    <Skeleton
                      key={cell}
                      width={60}
                      height={28}
                      className="mr-2"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend Skeleton */}
          <div className="flex items-center gap-2 mt-4">
            <Skeleton width={70} height={20} />
            <Skeleton variant="circular" width={14} height={14} />
            <Skeleton variant="circular" width={14} height={14} />
            <Skeleton variant="circular" width={14} height={14} />
            <Skeleton variant="circular" width={14} height={14} />
          </div>
        </div>

        {/* RIGHT : Chart Card */}
        {/* <div
          className="w-full lg:w-1/2 bg-white rounded shadow outline outline-1 outline-gray-200/60 flex flex-col px-4 py-4"
          style={{ height: "343px" }}
        >
          <div className="flex justify-between items-center mb-4">
            <Skeleton width={160} height={28} /> */}

            {/* Toggle Buttons */}
            {/* <div className="flex gap-0 border rounded-lg overflow-hidden">
              <Skeleton width={90} height={35} />
              <Skeleton width={90} height={35} />
            </div>
          </div> */}

          {/* Chart Skeleton */}
          {/* <div className="flex-1 overflow-hidden">
            <Skeleton width={"100%"} height={"100%"} />
          </div>
        </div>
      </div> */}

      {/* ---------------- ROW 2 ---------------- */}
      {/* <div
        className="w-full lg:w-1/2 bg-white rounded shadow outline outline-1 outline-gray-200/60 px-4 py-4 flex flex-col mb-5"
        style={{ height: "343px" }}
      >
        <Skeleton width={200} height={28} className="mb-4" />

        <div className="flex-1 overflow-y-auto overflow-x-auto"> */}
          {/* Table header skeleton */}
          {/* <div className="flex mb-2 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} width={70} height={24} />
            ))}
          </div> */}

          {/* Table row skeletons */}
          {/* {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                <Skeleton key={col} width={70} height={20} />
              ))}
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
}

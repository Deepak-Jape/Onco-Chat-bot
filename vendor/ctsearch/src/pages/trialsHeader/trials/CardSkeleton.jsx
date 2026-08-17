export default function TrialSkeleton() {
  return (
    <div
      style={{
        width: "100%",
      }}
      className="animate-pulse flex gap-4"
    >
      {/* Left List Card Skeleton */}
      <div
        style={{
          paddingLeft: "1%",
          width: "25%",
        }}
        className="flex flex-col gap-4"
      >
        {[1, 2, 3].map((i) => (
          <div
            style={{
              height: "240px",
              //   width: "310px",
            }}
            key={i}
            className="border rounded-xl p-4 shadow-sm flex flex-col gap-3 bg-white"
          >
            <div className="h-4 w-32 bg-gray-300 rounded"></div>
            <div className="h-5 w-48 bg-gray-300 rounded"></div>

            <div className="flex gap-2 flex-wrap">
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>

            <div className="flex justify-between mt-3">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Right Details Skeleton */}
      <div
        style={{ width: "70%" }}
        className=" bg-white p-6 rounded-xl shadow-sm flex flex-col gap-6"
      >
        <div className="h-6 w-80 bg-gray-300 rounded"></div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-60 bg-gray-300 rounded" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-60 bg-gray-300 rounded" />
          </div>
        </div>

        {/* <div className="h-10 w-40 bg-gray-300 rounded" /> */}

        <div className="grid grid-cols-3 gap-6 mt-2">
          <div
            style={{ height: "60px" }}
            className="p-4 bg-gray-100 rounded-xl flex flex-col gap-3"
          >
            <div className="h-4 w-40 bg-gray-300 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>

          <div
            style={{ height: "60px" }}
            className="p-4 bg-gray-100 rounded-xl flex flex-col gap-3"
          >
            <div className="h-4 w-40 bg-gray-300 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
          <div
            style={{ height: "60px" }}
            className="p-4 bg-gray-100 rounded-xl flex flex-col gap-3"
          >
            <div className="h-4 w-40 bg-gray-300 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
          <div
            style={{ height: "60px" }}
            className="p-4 bg-gray-100 rounded-xl flex flex-col gap-3"
          >
            <div className="h-4 w-40 bg-gray-300 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
          <div
            style={{ height: "60px" }}
            className="p-4 bg-gray-100 rounded-xl flex flex-col gap-3"
          >
            <div className="h-4 w-40 bg-gray-300 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
          <div
            style={{ height: "60px" }}
            className="p-4 bg-gray-100 rounded-xl flex flex-col gap-3"
          >
            <div className="h-4 w-40 bg-gray-300 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-12">
          <div
            style={{
              height: "160px",
            }}
            className="p-4 bg-gray-100 rounded-xl flex flex-col gap-3"
          >
            <div className="h-4 w-40 bg-gray-300 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>

          <div className="p-4 bg-gray-100 rounded-xl flex flex-col gap-3">
            <div className="h-4 w-40 bg-gray-300 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

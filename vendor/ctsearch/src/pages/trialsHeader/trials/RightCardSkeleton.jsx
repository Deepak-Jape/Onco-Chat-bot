import React from "react";

const Bone = ({ w, h = "h-4", extra = "" }) => (
  <div className={`${h} ${w} bg-gray-200 rounded animate-pulse ${extra}`} />
);

const RightCardSkeleton = ({ style = {} }) => {
  return (
    <div
      className="h-full bg-white rounded-xl overflow-hidden"
      style={{ boxShadow: "0 0 10px rgba(130,143,169,0.15)", ...style }}
    >
      {/* scroll inner */}
      <div style={{ padding: "2% 3%", display: "flex", flexDirection: "column", gap: 0 }}>

        {/* ── Title (3 lines) ── */}
        <div className="flex flex-col gap-2 mb-4">
          <Bone w="w-full" h="h-6" />
          <Bone w="w-11/12" h="h-6" />
          <Bone w="w-3/4" h="h-6" />
        </div>

        {/* ── Breadcrumb row: Phase • Organ • Single Cohort • 1L • Stage +3 • N Cohorts ── */}
        <div className="flex items-center gap-2 mb-6">
          <Bone w="w-14" h="h-4" />
          <Bone w="w-1" h="h-1" extra="rounded-full" />
          <Bone w="w-10" h="h-4" />
          <Bone w="w-1" h="h-1" extra="rounded-full" />
          <Bone w="w-24" h="h-4" />
          <Bone w="w-1" h="h-1" extra="rounded-full" />
          <Bone w="w-6" h="h-4" />
          <Bone w="w-1" h="h-1" extra="rounded-full" />
          <Bone w="w-40" h="h-4" />
          <Bone w="w-7" h="h-5" extra="rounded" />
          <Bone w="w-1" h="h-1" extra="rounded-full" />
          <Bone w="w-20" h="h-4" />
        </div>

        {/* ── 3-col sponsor/studylead/update + primary/status/registry ── */}
        <div className="grid grid-cols-3 gap-y-5 gap-x-8 mb-6">
          {[
            { label: "w-14", value: "w-16" },
            { label: "w-20", value: "w-16" },
            { label: "w-24", value: "w-28" },
            { label: "w-32", value: "w-20" },
            { label: "w-12", value: "w-24" },
            { label: "w-16", value: "w-28" },
          ].map((item, i) => (
            <div key={i} className={`flex flex-col gap-1 ${i % 3 !== 0 ? "pl-8 border-l border-gray-100" : ""}`}>
              <Bone w={item.label} h="h-3" />
              <Bone w={item.value} h="h-5" />
            </div>
          ))}
        </div>

        {/* ── Enrollment + Sites cards (2-col) ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Enrollment */}
          <div style={{ border: "1px solid rgba(0,0,0,0.05)", borderRadius: 4, padding: 15, boxShadow: "1px 8px 34px 0px rgba(153,169,190,0.1)" }}>
            <Bone w="w-20" h="h-4" extra="mb-3" />
            <div className="flex gap-4">
              <Bone w="w-28" h="h-4" />
              <Bone w="w-24" h="h-4" />
            </div>
          </div>
          {/* Sites */}
          <div style={{ border: "1px solid rgba(0,0,0,0.05)", borderRadius: 4, padding: 15, boxShadow: "1px 8px 34px 0px rgba(153,169,190,0.1)" }}>
            <Bone w="w-12" h="h-4" extra="mb-3" />
            <Bone w="w-36" h="h-4" />
          </div>
        </div>

        {/* ── Action bar: 2 dropdowns + toggle ── */}
        <div className="flex items-center gap-3 mb-5">
          <div style={{ width: 170, height: 44, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 6 }} className="bg-gray-100 animate-pulse" />
          <div style={{ width: 170, height: 44, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 6 }} className="bg-gray-100 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-10 h-6 bg-gray-200 rounded-full animate-pulse" />
            <Bone w="w-28" h="h-4" />
          </div>
        </div>

        {/* ── Tabs row ── */}
        <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 20 }}>
          <div className="flex gap-6">
            <div style={{ borderBottom: "2px solid #d1d5db", paddingBottom: 10 }}>
              <Bone w="w-24" h="h-4" />
            </div>
            <div style={{ paddingBottom: 10 }}>
              <Bone w="w-14" h="h-4" />
            </div>
          </div>
        </div>

        {/* ── "Cohort" heading ── */}
        <Bone w="w-20" h="h-6" extra="mb-4" />

        {/* ── Eligibility Criteria card ── */}
        <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 6, padding: 16, marginBottom: 16 }}>
          <Bone w="w-36" h="h-5" extra="mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {/* Inclusion */}
            <div style={{ background: "#f3f4f6", borderRadius: 6, padding: 14 }}>
              <Bone w="w-20" h="h-4" extra="mb-3" />
              {["w-16", "w-14", "w-full", "w-3/4"].map((w, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <Bone w="w-4" h="h-4" extra="rounded-full flex-shrink-0" />
                  <Bone w={w} h="h-3" />
                </div>
              ))}
            </div>
            {/* Exclusion */}
            <div style={{ background: "#f3f4f6", borderRadius: 6, padding: 14 }}>
              <Bone w="w-20" h="h-4" extra="mb-3" />
              {["w-full", "w-full", "w-4/5", "w-full"].map((w, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <Bone w="w-4" h="h-4" extra="rounded-full flex-shrink-0" />
                  <Bone w={w} h="h-3" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RightCardSkeleton;

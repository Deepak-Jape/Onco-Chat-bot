import { analyticStyles } from "./style";
const PopulationSkeleton = () => {
    const classes = analyticStyles();

    const skeletonRows = [
        { width: "100%" },
        { width: "90%" },
        { width: "75%" },
        { width: "62%" },
        { width: "48%" },
        { width: "35%" },
    ];

    return (
        <div
            style={{
                display: "flex", flexDirection: "column", gap: "14px", width: "100%",
                background: "#fff",
                padding: 16,
                borderRadius: 6,
                border: "1px solid rgba(0, 0, 0, 0.1)",
                boxShadow: "2px 2px 10px 0px rgba(183, 192, 208, 0.05)",
            }}
        >

            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                // marginBottom: "24px",
                gap: "16px",
            }}>
                <div style={{
                    height: "38px",
                    width: "22%",
                    borderRadius: "8px",
                    background: '#f6f7f8',
                    backgroundSize: "800px 100%",
                    animation: "$shimmer 1.4s ease infinite",
                }} />
                    <div style={{
                        height: "44px",
                        width: "98px",
                        borderRadius: "8px",
                        background: '#f6f7f8',
                        animation: "$shimmer 1.4s ease infinite",
                    }} />
            </div>
            {/* 1. INJECT THE KEYFRAMES HERE */}
            <style>
                {`
                @keyframes shimmer {
                    0% { background-position: -800px 0; }
                    100% { background-position: 800px 0; }
                }
                `}
            </style>

            {skeletonRows.map((row, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>

                    {/* Main Bar Skeleton */}
                    <div
                        style={{
                            width: row.width,
                            height: "40px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 16px",
                            border: "1px solid #E5E7EB",
                            boxSizing: "border-box",
                            background: '#f6f7f8',
                            // 2. FIXED PERCENTAGE SYNTAX (Removed spaces)
                            backgroundImage: "linear-gradient(90deg, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%)",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "800px 100%",
                            animation: "shimmer 1.5s infinite linear",
                        }}
                    >
                        {/* Left Side: Icon and Label Placeholder */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: 18, height: 18, borderRadius: '4px', background: 'rgba(0,0,0,0.05)' }} />
                            <div style={{ width: '80px', height: '12px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)' }} />
                        </div>

                        {/* Right Side: Value Placeholder */}
                        <div style={{ width: '40px', height: '14px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)' }} />
                    </div>
                    {/* Connector Arrow & Percent Placeholder */}
                    {(index < skeletonRows.length && index > 0) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", opacity: 0.5 }}>

                            <svg width="40" height="24" viewBox="0 0 40 24" fill="none" style={{ marginTop: '-12px' }}>
                                <path d="M38 2C38 8 40 20 4 22" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M10 18L1 22L10 26" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div style={{ width: '30px', height: '12px', borderRadius: '4px', background: '#E5E7EB' }} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export const PatientDevelopmentSkeleton = () => {
    return (
        <>
            <style>{`
        @keyframes shimmer {
          0%   { background-position: -800px 0; }
          100% { background-position:  800px 0; }
        }
      `}</style>

            <div style={{
                background: "#fff",
                padding: "24px",
                borderRadius: 6,
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
                marginTop: "24px",
            }}>

                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div style={shimmer({ width: "280px", height: "24px", borderRadius: "8px" })} />
                    <div style={shimmer({ width: "90px", height: "32px", borderRadius: "6px" })} />
                </div>

                {/* Filter Tags */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                    {[80, 100, 70].map((w, i) => (
                        <div key={i} style={shimmer({ width: `${w}px`, height: "26px", borderRadius: "100px" })} />
                    ))}
                </div>

                {/* Table Header */}
                <div style={{ display: "flex", gap: "12px", paddingBottom: "10px", borderBottom: "1px solid #F3F4F6", marginBottom: "4px" }}>
                    {[60, 120, 100, 140, 100].map((w, i) => (
                        <div key={i} style={{ flex: i === 0 ? "0 0 60px" : 1 }}>
                            <div style={shimmer({ width: `${w}px`, height: "14px", borderRadius: "4px" })} />
                        </div>
                    ))}
                </div>

                {/* Table Rows */}
                {Array.from({ length: 5 }).map((_, rowIdx) => (
                    <div
                        key={rowIdx}
                        style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            padding: "14px 0",
                            borderBottom: rowIdx !== 4 ? "1px solid #F3F4F6" : "none",
                        }}
                    >
                        {[50, 110, 90, 130, 80].map((w, colIdx) => (
                            <div key={colIdx} style={{ flex: colIdx === 0 ? "0 0 60px" : 1 }}>
                                <div style={shimmer({
                                    width: `${w}px`,
                                    height: colIdx === 4 ? "24px" : "14px",
                                    borderRadius: colIdx === 4 ? "100px" : "4px",
                                })} />
                            </div>
                        ))}
                    </div>
                ))}

            </div>
        </>
    );
}

// ─── Shared shimmer style (matches PopulationSkeleton exactly) ────────────────
function shimmer({ width, height, borderRadius = "4px" }) {
    return {
        width,
        height,
        borderRadius,
        background: "#f6f7f8",
        backgroundImage: "linear-gradient(90deg, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.5s infinite linear",
    };
}

export default PopulationSkeleton;
import React from 'react'

const LeftCardSkeleton = () => {
    return (
        <div className="animate-pulse w-full flex gap-4">
            {/* Left List Card Skeleton */}
            <div
                style={{
                    padding: "3%",
                }}
                className="w-80 flex flex-col gap-4"
            >
                {[1, 2, 3].map((i) => (
                    <div
                        style={{
                            height: "240px",
                            width: "308px"
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
                        <div className="flex justify-between mt-3">
                            <div className="h-4 w-20 bg-gray-200 rounded"></div>
                            <div className="h-4 w-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div></div>
    )
}

export default LeftCardSkeleton

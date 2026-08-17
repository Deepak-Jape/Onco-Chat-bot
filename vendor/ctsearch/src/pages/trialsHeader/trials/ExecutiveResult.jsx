import React from "react";

export default function OperationalMetrics({ result, SafeRender }) {
    const metrics = [
        {
            title: "Recruitment Rate",
            value: <SafeRender>{`${result?.operational_metrics?.value?.recruitment_rate[0] ?? 0}`}</SafeRender>,
            valueUnit: "Patients/Month",
            valueColor: "text-orange-500",
            badgeColor: "text-red-500 bg-red-50",
            badgeText: <SafeRender>{`↓ ${result?.operational_metrics?.value?.recruitment_rate[1] ?? 0} % vs benchmark`}</SafeRender>,
        },
        {
            title: "Dropout Rate",
            value: <SafeRender>{`${result?.operational_metrics?.value?.dropout_rate[0] ?? 0}%`}</SafeRender>,
            valueUnit: "of Patients Discontinue",
            valueColor: "text-blue-600",
            badgeColor: "text-green-600 bg-green-50",
            badgeText: <SafeRender>{`↑ ${result?.operational_metrics?.value?.dropout_rate[1] ?? 0} % vs benchmark`}</SafeRender>,
        },
        {
            title: "Accrual",
            value: <SafeRender>{`${result?.operational_metrics?.value?.accrual[0] ?? 0}%`}</SafeRender>,
            valueUnit: "Actual vs Planned",
            valueColor: "text-green-600",
            badgeColor: "text-red-500 bg-red-50",
            badgeText: <SafeRender>{`↓ ${result?.operational_metrics?.value?.accrual[1] ?? 0} % vs benchmark`}</SafeRender>,
        },
        {
            title: "TTPE",
            value: <SafeRender>{`${result?.operational_metrics?.value?.ttpe[0] ?? 0} Days`}</SafeRender>,
            valueUnit: "to Primary Endpoint",
            valueColor: "text-limeGreen",
            badgeColor: "text-red-500 bg-red-50",
            badgeText: <SafeRender>{`↓ ${result?.operational_metrics?.value?.ttpe[1] ?? 0} % vs benchmark`}</SafeRender>,
        },
    ];

    const steps = [
        {
            label: 'Screened',
            value: 520,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-500',
            icon: '👥',
        },
        {
            label: 'Enrolled',
            value: 320,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-500',
            icon: '✂️',
        },
        {
            label: 'Intervention',
            value: 320,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-500',
            icon: '💊',
        },
        {
            label: 'Control',
            value: 160,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-500',
            icon: '📋',
        },
        {
            label: 'Analyzed',
            value: 305,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-500',
            icon: '📈',
        },
    ];

    const steps2 = [
        {
            label: 'Screened',
            value: 350,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-500',
            icon: '👥',
        },
        {
            label: 'Enrolled',
            value: 280,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-500',
            icon: '✂️',
        },
        {
            label: 'Intervention',
            value: 270,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-500',
            icon: '💊',
        },
        {
            label: 'Control',
            value: 200,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-500',
            icon: '📋',
        },
        {
            label: 'Analyzed',
            value: 300,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-500',
            icon: '📈',
        },
    ];

    return (
        <div className="bg-gray-50 py-4 sm:py-6 overflow-hidden">
            {/* Removed mx-auto and padding */}
            <div className="max-w-[1400px]">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 ">
                    <SafeRender>{result?.operational_metrics?.title}</SafeRender>
                </h2>

                {/* FLEX layout for one-line boxes on desktop */}
                <div className="flex flex-wrap md:flex-nowrap justify-center gap-3 md:gap-3 lg:gap-2">
                    {metrics.map((m, i) => (
                        <div
                            key={i}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm py-4 px-2 flex flex-col justify-between hover:shadow-md transition-all duration-200
              h-[140px] flex-1 min-w-[250px] sm:min-w-[300px] md:min-w-[320px] lg:min-w-[320px] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 font-medium leading-tight whitespace-nowrap">
                                    {m.title}
                                </span>
                                <span
                                    className="text-gray-400 text-xs cursor-pointer"
                                    title="More info"
                                >
                                    ?
                                </span>
                            </div>

                            {/* Value */}
                            <div className="mt-2 leading-tight">
                                <div
                                    className={`text-2xl md:text-3xl font-bold ${m.valueColor} whitespace-nowrap`}
                                >
                                    {m.value}
                                </div>
                                <div className="text-[13px] sm:text-sm text-gray-500 mt-0.5 whitespace-nowrap">
                                    {m.valueUnit}
                                </div>
                            </div>

                            {/* Badge */}
                            <div className="mt-2">
                                <div
                                    className={`inline-flex items-center text-[11px] sm:text-xs font-medium px-3 py-0.5 rounded-full ${m.badgeColor} whitespace-nowrap`}
                                >
                                    {m.badgeText}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full p-4 mt-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    <SafeRender>{result?.primary_endpoint_and_outcome?.title}</SafeRender>
                </h2>

                <div className=" rounded-md border border-gray-100 p-4">
                    {result?.primary_endpoint_and_outcome?.value.map((value, index) => (
                        <>

                            <p className="text-xs text-gray-500 mb-1">{value.primary_endpoint.title}</p>
                            <p className="text-base font-semibold text-gray-900">
                                {value.primary_endpoint.value[0]}
                            </p>
                            <p className="text-sm text-gray-600">
                                {value.primary_endpoint.value[1]}
                            </p>
                        </>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full max-w-3xl mt-4 p-4">
                {result?.primary_endpoint_and_outcome?.value.map((value, index) => (
                    <>

                        <p className="text-xs text-gray-500 mb-2">{value.primary_outcome.title}</p>

                    </>
                ))}

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="text-left border-b border-gray-200">
                                <th className="py-2 text-sm font-bold text-gray-700">Treatment ARM</th>
                                <th className="py-2 text-sm font-bold text-gray-700">Median PFS</th>
                                <th className="py-2 text-sm font-bold text-gray-700">95% CI</th>
                                <th className="py-2 text-sm font-bold text-gray-700">VS Control</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700">
                            {result?.primary_endpoint_and_outcome?.value.map((value, index) => (

                                value.primary_outcome.value.map((value) => (
                                    <tr className="border-b border-gray-100">

                                        <td className="py-2 text-gray-500 font-semibold">{value.col_1.value} </td>
                                        <td className="py-2 ">{value.col_2.value}</td>
                                        <td className="py-2">{value.col_3.value}</td>
                                        <td className="py-2 text-gray-400">{value.col_4.value}</td>
                                    </tr>
                                ))
                            ))}
                            {/* <tr className="border-b border-gray-100">
                                <td className="py-2 text-gray-500 font-semibold">Control (Placebo)</td>
                                <td className="py-2 ">4.2 Months</td>
                                <td className="py-2">3.1–5.8 Months</td>
                                <td className="py-2 text-gray-400">—</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-2 text-gray-500 font-semibold">Arm A (Low Dose)</td>
                                <td className="py-2 text-blue-600 font-medium">6.2 Months</td>
                                <td className="py-2">5.1–8.4 Months</td>
                                <td className="py-2 text-blue-600 font-medium">+2.6 Months</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-2 text-gray-500 font-semibold">Arm B (High Dose)</td>
                                <td className="py-2 text-green-600 font-medium">8.2 Months</td>
                                <td className="py-2">6.2–10.2 Months</td>
                                <td className="py-2 text-green-600 font-medium">+4.0 Months</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-gray-500 font-semibold">Arm C (Combination)</td>
                                <td className="py-2 text-green-600 font-medium">11.5 Months</td>
                                <td className="py-2">9.2–14.2 Months</td>
                                <td className="py-2 text-green-600 font-medium">+7.3 Months</td>
                            </tr> */}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full max-w-3xl mt-4 p-4">
                {result?.primary_endpoint_and_outcome?.value.map((value, index) => (
                    <>

                        <h2 className="text-base font-semibold text-gray-900 mb-3">{value.intervention_performance_summary.title}</h2>

                    </>
                ))}

                <div className="grid grid-cols-2 gap-6">
                    {/* Response Rates Section */}
                    <div>
                        <p className="text-sm text-gray-500 mb-2 font-medium">Response Rates</p>
                        {result?.primary_endpoint_and_outcome?.value.map((value, index) => (
                            <>

                                {value.intervention_performance_summary.value.response_rates.value.map((valll) => (
                                    <>
                                        <div className="space-y-1 text-sm  text-gray-600">
                                            <div className="flex justify-between ">
                                                <span> {valll.title}</span>
                                                <span className="font-semibold">{valll.value}</span>
                                            </div>
                                        </div>
                                    </>
                                )

                                )}

                            </>
                        ))}

                        {/* <div className="space-y-1 text-sm  text-gray-600">
                            <div className="flex justify-between ">
                                <span>Control (Placebo)</span>
                                <span className="font-semibold">18.4%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Arm A (Low Dose)</span>
                                <span className="text-blue-600 font-medium">32.1%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Arm B (High Dose)</span>
                                <span className="text-green-600 font-medium">42.1%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Arm C (Combination)</span>
                                <span className="text-green-600 font-medium">56.7%</span>
                            </div>
                        </div> */}

                        <div className="border-t border-gray-200 mt-3 pt-2 flex justify-between text-sm font-semibold">
                            <span>Best VS Control:</span>
                            <span className="text-green-600">+37.9%</span>
                        </div>
                    </div>

                    {/* Disease Control Section */}
                    <div>
                        <p className="text-sm text-gray-500 mb-2 font-medium">Disease Control (DCR)</p>
                        {result?.primary_endpoint_and_outcome?.value.map((value, index) => (
                            <>
                                {value.intervention_performance_summary.value.disease_control_rate?.value.map((valll) => (
                                    <>
                                        <div className="space-y-1 text-sm  text-gray-600">
                                            <div className="flex justify-between ">
                                                <span> {valll.title}</span>
                                                <span className="font-semibold">{valll.value}</span>
                                            </div>
                                        </div>
                                    </>
                                )

                                )}

                            </>
                        ))}

                        {/* <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Control (Placebo)</span>
                                <span className="font-semibold">71.3%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Arm A (Low Dose)</span>
                                <span className="text-blue-600 font-medium">82.1%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Arm B (High Dose)</span>
                                <span className="text-green-600 font-medium">89.9%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Arm C (Combination)</span>
                                <span className="text-green-600 font-medium">94.2%</span>
                            </div>
                        </div> */}

                        <div className="border-t border-gray-200 mt-3 pt-2 flex justify-between text-sm font-semibold">
                            <span>Best VS Control:</span>
                            <span className="text-green-600">+22.9%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    <SafeRender>{result?.secondary_endpoints_and_outcomes?.title}</SafeRender>
                </h2>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-3">
                        <SafeRender>{result?.secondary_endpoints_and_outcomes?.value.secondary_endpoints.title}</SafeRender>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {result?.secondary_endpoints_and_outcomes?.value.secondary_endpoints.value.map((value, index) => (
                            <div key={index}>
                                <p className="font-semibold text-gray-800">{value.title}</p>
                                <p className="text-sm text-gray-600">{value.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="py-0">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-4">
                        <SafeRender>{result?.secondary_endpoints_and_outcomes?.value?.secondary_outcomes.title}</SafeRender>
                    </p>


                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm text-gray-700">
                            <thead className="border-b border-gray-200 text-gray-500">
                                <tr>
                                    <th className="pb-2 pr-4">Treatment ARM</th>
                                    <th className="pb-2 pr-4">Median OS</th>
                                    <th className="pb-2 pr-4">ORR</th>
                                    <th className="pb-2">Median DoR</th>
                                </tr>
                            </thead>


                            <tbody className="divide-y divide-gray-200">
                                {result?.secondary_endpoints_and_outcomes?.value?.secondary_outcomes?.value.map((value, index) => {
                                    // Determine color based on row index or arm title
                                    const armTitle = String(value?.col_1?.value ?? "").toLowerCase();
                                    let colorClass = "text-gray-800"; // default

                                    if (armTitle.includes("arm a")) colorClass = "text-blue-600";
                                    else if (armTitle.includes("arm b")) colorClass = "text-green-600";
                                    else if (armTitle.includes("arm c")) colorClass = "text-green-600";
                                    else if (armTitle.includes("arm d")) colorClass = "text-pink-600";
                                    // you can extend this logic if more arms appear later

                                    return (
                                        <tr key={index}>
                                            {/* Arm Name */}
                                            <td className="py-3 pr-4">{value?.col_1?.value}</td>

                                            {/* Column 2 */}
                                            <td className="py-3 pr-4">
                                                <span className={`font-semibold ${colorClass}`}>{value?.col_2?.value?.[0]}</span>
                                                <br />
                                                <span className="text-xs text-gray-500">{value?.col_2?.value?.[1]}</span>
                                            </td>

                                            {/* Column 3 */}
                                            <td className="py-3 pr-4">
                                                <span className={`font-semibold ${colorClass}`}>{value?.col_3?.value?.[0]}</span>
                                                <br />
                                                <span className="text-xs text-gray-500">{value?.col_3?.value?.[1]}</span>
                                            </td>

                                            {/* Column 4 */}
                                            <td className="py-3">
                                                <span className={`font-semibold ${colorClass}`}>{value?.col_4?.value?.[0]}</span>
                                                <br />
                                                <span className="text-xs text-gray-500">{value?.col_4?.value?.[1]}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>




                            {/* <tbody className="divide-y divide-gray-200">
                                {result?.secondary_endpoints_and_outcomes?.value?.secondary_outcomes?.value.map((value, index)=>(
                                    <>
                           <tr>
                                    <td className="py-3 pr-4">{value.col_1.value}</td>
                                          <td className="py-3 pr-4">
                                        <span className="font-semibold"> {value.col_2.value[0]}</span><br />
                                        <span className="text-xs text-gray-500"> {value.col_2.value[1]}</span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span className="font-semibold">{value.col_3.value[0]}</span><br />
                                        <span className="text-xs text-gray-500">{value.col_3.value[1]}</span>
                                    </td>
                                    <td className="py-3">
                                        <span className="font-semibold">{value.col_4.value[0]}</span><br />
                                        <span className="text-xs text-gray-500">{value.col_4.value[1]}</span>
                                    </td>
                                </tr>
                                    </>
                        ))}

                                <tr>
                                    <td className="py-3 pr-4">Arm A (Low Dose)</td>
                                    <td className="py-3 pr-4">
                                        <span className="font-semibold text-blue-600">15.8 Months</span><br />
                                        <span className="text-xs text-gray-500">95% CI: 10.1–14.8</span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span className="font-semibold text-blue-600">32.1%</span><br />
                                        <span className="text-xs text-gray-500">p = 0.012</span>
                                    </td>
                                    <td className="py-3">
                                        <span className="font-semibold text-blue-600">8.7 Months</span><br />
                                        <span className="text-xs text-gray-500">95% CI: 6.9–10.8</span>
                                    </td>
                                </tr>

                                <tr>
                                    <td className="py-3 pr-4">Arm B (High Dose)</td>
                                    <td className="py-3 pr-4">
                                        <span className="font-semibold text-green-600">18.7 Months</span><br />
                                        <span className="text-xs text-gray-500">95% CI: 15.9–22.1</span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span className="font-semibold text-green-600">42.7%</span><br />
                                        <span className="text-xs text-gray-500">p &lt; 0.001</span>
                                    </td>
                                    <td className="py-3">
                                        <span className="font-semibold text-green-600">11.3 Months</span><br />
                                        <span className="text-xs text-gray-500">95% CI: 9.2–13.8</span>
                                    </td>
                                </tr>

                                <tr>
                                    <td className="py-3 pr-4">Arm C (Combination)</td>
                                    <td className="py-3 pr-4">
                                        <span className="font-semibold text-green-600">24.3 Months</span><br />
                                        <span className="text-xs text-gray-500">95% CI: 20.9–28.5</span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span className="font-semibold text-green-600">56.3%</span><br />
                                        <span className="text-xs text-gray-500">p &lt; 0.001</span>
                                    </td>
                                    <td className="py-3">
                                        <span className="font-semibold text-green-600">15.2 Months</span><br />
                                        <span className="text-xs text-gray-500">95% CI: 12.7–18.4</span>
                                    </td>
                                </tr>
                            </tbody> */}
                        </table>
                    </div>
                </div>
            </div>

            <div className="py-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    <SafeRender>{result?.safety_and_adverse_events?.title}</SafeRender>
                </h2>

                {/* Define color themes for each arm */}
                {result?.safety_and_adverse_events?.value && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.safety_and_adverse_events.value.map((value, index) => {
                            // Assign color based on index
                            const colorThemes = [
                                { bg: "bg-yellow-50", border: "border-orange-100", title: "text-yellow-700" },
                                { bg: "bg-blue-50", border: "border-blue-100", title: "text-blue-600" },
                                { bg: "bg-green-50", border: "border-green-100", title: "text-green-600" },
                                { bg: "bg-pink-50", border: "border-pink-100", title: "text-pink-600" },
                            ];

                            const theme = colorThemes[index % colorThemes.length]; // cycle through colors

                            return (
                                <div
                                    key={index}
                                    className={`${theme.bg} border ${theme.border} rounded-lg p-5`}
                                >
                                    {/* Arm Title */}
                                    <h3 className={`text-md font-semibold ${theme.title} mb-4`}>
                                        {value?.title || "Untitled Arm"}
                                    </h3>

                                    {/* Common Side Effects */}
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-800 mb-2">
                                            {value?.value?.common_side_effects?.title}
                                        </p>
                                        <div className="text-sm text-gray-700 space-y-1">
                                            {value?.value?.common_side_effects?.value?.map((side, i) => (
                                                <div key={i} className="flex justify-between">
                                                    <span>{side?.title}</span>
                                                    <span>{side?.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Serious Events */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 mb-2">
                                            {value?.serious_events?.title}
                                        </p>
                                        <div className="text-sm text-gray-700 space-y-1">
                                            {value?.serious_events?.value?.map((event, j) => (
                                                <div key={j} className="flex justify-between">
                                                    <span>{event?.title}</span>
                                                    <span>{event?.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


            {/* <div className="py-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                     <SafeRender>{result?.safety_and_adverse_events?.title}</SafeRender>
                </h2>
                {result?.safety_and_adverse_events?.value?.map((value)=>(
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-yellow-50 border border-orange-100 rounded-lg p-5">
                        <h3 className="text-md font-semibold text-yellow-700 mb-4">
                             {value.title}</h3>

                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-800 mb-2">
                                {value.value.common_side_effects.title}</p>
                                {value.value.common_side_effects.value.map((side, index)=>(
                                    <>
                                   <div className="text-sm text-gray-700 space-y-1 mb-2">
                                <div className="flex justify-between"><span>
                                  {side.title}</span><span>{side.value}</span></div>
                            </div>
                                    </>
                                ))}
                                <div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">
                                {value?.serious_events?.title}
                                </p>
                                 {value.serious_events?.value.map((side, index)=>(
                                    <>
                                   <div className="text-sm text-gray-700 space-y-1 mb-2">
                                <div className="flex justify-between"><span>
                                  {side.title}</span><span>{side.value}</span></div>
                            </div>
                                    </>
                                ))}
                        </div>
                        </div>
                    </div>
                </div>
                           </>
                                 
                ))}


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-yellow-50 border border-orange-100 rounded-lg p-5">
                        <h3 className="text-md font-semibold text-yellow-700 mb-4">Control Arm</h3>

                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-800 mb-2">Common Side Effects</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex justify-between"><span>Feeling tired</span><span>79%</span></div>
                                <div className="flex justify-between"><span>Nausea</span><span>65%</span></div>
                                <div className="flex justify-between"><span>Loss of appetite</span><span>53%</span></div>
                                <div className="flex justify-between"><span>Diarrhea</span><span>47%</span></div>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">Serious Events</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex justify-between"><span>Severe reactions (Grade 3+)</span><span>67%</span></div>
                                <div className="flex justify-between"><span>Stopped treatment due to side effects</span><span>11%</span></div>
                                <div className="flex justify-between"><span>Immune system reactions</span><span>24%</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                        <h3 className="text-md font-semibold text-blue-600 mb-4">Low Dose Arm</h3>

                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-800 mb-2">Common Side Effects</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex justify-between"><span>Feeling tired</span><span>72%</span></div>
                                <div className="flex justify-between"><span>Nausea</span><span>58%</span></div>
                                <div className="flex justify-between"><span>Loss of appetite</span><span>48%</span></div>
                                <div className="flex justify-between"><span>Diarrhea</span><span>41%</span></div>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">Serious Events</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex justify-between"><span>Severe reactions (Grade 3+)</span><span>52%</span></div>
                                <div className="flex justify-between"><span>Stopped treatment due to side effects</span><span>8%</span></div>
                                <div className="flex justify-between"><span>Immune system reactions</span><span>19%</span></div>
                            </div>
                        </div>
                    </div>


                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="bg-green-50 border border-orange-100 rounded-lg p-5">
                        <h3 className="text-md font-semibold text-green-600 mb-4">High Dose Arm</h3>

                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-800 mb-2">Common Side Effects</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex justify-between"><span>Feeling tired</span><span>79%</span></div>
                                <div className="flex justify-between"><span>Nausea</span><span>65%</span></div>
                                <div className="flex justify-between"><span>Loss of appetite</span><span>53%</span></div>
                                <div className="flex justify-between"><span>Diarrhea</span><span>47%</span></div>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">Serious Events</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex justify-between"><span>Severe reactions (Grade 3+)</span><span>67%</span></div>
                                <div className="flex justify-between"><span>Stopped treatment due to side effects</span><span>11%</span></div>
                                <div className="flex justify-between"><span>Immune system reactions</span><span>24%</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-pink-50 border border-blue-100 rounded-lg p-5">
                        <h3 className="text-md font-semibold text-pink-600 mb-4">Combination Arm</h3>

                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-800 mb-2">Common Side Effects</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex justify-between"><span>Feeling tired</span><span>72%</span></div>
                                <div className="flex justify-between"><span>Nausea</span><span>58%</span></div>
                                <div className="flex justify-between"><span>Loss of appetite</span><span>48%</span></div>
                                <div className="flex justify-between"><span>Diarrhea</span><span>41%</span></div>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">Serious Events</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex justify-between"><span>Severe reactions (Grade 3+)</span><span>52%</span></div>
                                <div className="flex justify-between"><span>Stopped treatment due to side effects</span><span>8%</span></div>
                                <div className="flex justify-between"><span>Immune system reactions</span><span>19%</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}

            <div className="max-w-3xl mx-auto py-4 bg-white space-y-4">
                <h2 className="text-2xl font-bold mb-4">
                    <SafeRender>{result?.study_population?.title}</SafeRender>
                </h2>

                <p className="text-sm text-gray-800 mb-2">
                    <span className="font-semibold"><SafeRender>{result?.study_population?.value?.condition?.title}</SafeRender>:</span> <SafeRender>{result?.study_population?.value?.condition?.value}</SafeRender>
                </p>

                <p className="text-sm text-gray-800 mb-2">
                    <span className="font-semibold"><SafeRender>{result?.study_population?.value?.population?.title}</SafeRender>:</span> <SafeRender>{result?.study_population?.value?.population?.value}</SafeRender>
                </p>

                <p className="text-sm text-gray-800 mb-2">
                    <span className="font-semibold"><SafeRender>{result?.study_population?.value?.baseline?.title}</SafeRender>:</span> <SafeRender>{result?.study_population?.value?.baseline?.value}</SafeRender>
                </p>

                <p className="text-sm text-gray-800 mb-2">
                    <span className="font-semibold"><SafeRender>{result?.study_population?.value?.geography?.title}</SafeRender>:</span> <SafeRender>{result?.study_population?.value?.geography?.value}</SafeRender>
                </p>

                <p className="text-sm text-gray-800">
                    <span className="font-semibold"><SafeRender>{result?.study_population?.value?.implication?.title}</SafeRender>:</span> <SafeRender>{result?.study_population?.value?.implication?.value}</SafeRender>
                </p>
            </div>

            {/* <div className=" rounded-lg border border-gray-200 shadow-sm w-full p-4 mt-4"> */}
            {/* <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Participant Flow
            </h2>
            <div className="border rounded-lg p-6 max-w-5xl mx-auto">
                <div className="text-sm text-gray-700 font-medium mb-6">Arm 1 (Main Drug):</div>

                <div className="relative flex items-center">
                    <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-300 z-0" />

                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col  text-center z-10" style={{ flex: 1 }}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.iconBg} ${step.iconColor} mb-2`}>
                                <span className="text-xl">{step.icon}</span>
                            </div>
                            <div className="text-base font-semibold -ml-20">{step.value}</div>
                            <div className="text-sm text-gray-500 -ml-20">{step.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border rounded-lg p-6 max-w-5xl mx-auto">
                <div className="text-sm text-gray-700 font-medium mb-6">Arm 2 (Control and Comparator):</div>
                <div className="relative flex items-center">
                    <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-300 z-0" />
                    {steps2.map((step, index) => (
                        <div key={index} className="flex flex-col  text-center z-10" style={{ flex: 1 }}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.iconBg} ${step.iconColor} mb-2`}>
                                <span className="text-xl">{step.icon}</span>
                            </div>
                            <div className="text-base font-semibold -ml-20">{step.value}</div>
                            <div className="text-sm text-gray-500 -ml-20">{step.label}</div>
                        </div>
                    ))}
                </div>
            </div> */}



        </div>


    );
}

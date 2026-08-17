import React from "react";
import { User } from "lucide-react";
import {
  ParticipantCompleteIcon,
  ParticipantFollowUpIcon,
  ParticipantLeaveIcon,
  ParticipationUserIcon,
  ShieldIcon,
} from "../../../assets";
import { trialStyles } from "./style";

export default function ParticipantFlow({ data = [] }) {
  const classes = trialStyles();
  const flowData = Array.isArray(data) ? data : [];

  const getDetails = (title) => {
    const t = String(title ?? "").toLowerCase();

    if (t.includes("start"))
      return { icon: ParticipationUserIcon, color: "rgba(47,128,237,1)" };

    if (
      t?.includes("progressive") ||
      t?.includes("doctor") ||
      t?.includes("withdrawn") ||
      t?.includes("stop")
    )
      return { icon: ShieldIcon, color: "rgba(241,128,16,1)" };

    if (t.includes("leave"))
      return { icon: ParticipantLeaveIcon, color: "rgba(241,87,87,1)" };

    if (t.includes("lost"))
      return { icon: ParticipantFollowUpIcon, color: "rgba(117,79,254,1)" };

    if (t.includes("complete"))
      return { icon: ParticipantCompleteIcon, color: "rgba(39,174,96,1)" };

    return { icon: <User size={22} />, color: "#D2D2D2" };
  };

  return (
    <div>
      {flowData.map((arm, index) => (
        <div
          key={index}
          style={{ padding: "2%", marginBottom: "20px" }}
          className="border rounded-xl bg-white shadow-sm"
        >
          <h3 className={classes.particpant_flow_title}>{arm.title}:</h3>

          {/* MAIN CONNECTOR LINE BEHIND ICONS */}
          <div className="relative mt-6 overflow-x-auto">
            {/* Full width line */}
            {/* <div
              style={{
                position: "absolute",
                top: "23px", // aligns line to icon center (46px height / 2)
                left: 0,
                right: 0,
                height: "1px",
                background: "#CFCFCF",
                zIndex: 0,
              }}
            ></div> */}

            {/* Icons & labels */}
            <div className="flex items-center gap-16 relative z-10">
              {(Array.isArray(arm?.value) ? arm.value : []).map((step, idx) => {
                const { icon, color } = getDetails(step.title);

                return (
                  <div key={idx} className="flex flex-col items-center">
                    {/* Icon sits on connection line */}
                    <div
                      style={{
                        background: "white",
                        padding: "4px",
                      }}
                    >
                      <img width={46} height={46} src={icon} />
                    </div>

                    <p className="text-lg font-semibold mt-2" style={{ color }}>
                      {step.value}
                    </p>

                    <p className="text-sm text-gray-600 text-center w-28 whitespace-nowrap">
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

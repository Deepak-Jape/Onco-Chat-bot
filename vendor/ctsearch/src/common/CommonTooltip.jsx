// CommonTooltip.jsx
import React from "react";
import Tooltip from "@mui/material/Tooltip";

const CommonTooltip = ({
    title,
    placement = "top",
    children,
    arrow = true,
    enterDelay = 200,
    leaveDelay = 100,
}) => {
    return (
        <Tooltip
            title={title}
            placement={placement}
            arrow={arrow}
            enterDelay={enterDelay}
            leaveDelay={leaveDelay}
        >
            <span style={{ display: "inline-block" }}>{children}</span>
        </Tooltip>
    );
};

export default CommonTooltip;

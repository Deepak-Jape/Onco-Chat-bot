import React from "react";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
  box: {
    background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
  },
  "@keyframes shimmer": {
    "0%": {
      backgroundPosition: "100% 0",
    },
    "100%": {
      backgroundPosition: "-100% 0",
    },
  },
}));

export default function ShimmerBox({
  width,
  height,
  radius = 6,
  style,
  className,
}) {
  const classes = useStyles();

  return (
    <div
      className={`${classes.box}${className ? ` ${className}` : ""}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}


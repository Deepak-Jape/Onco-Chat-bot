// MyRangePicker.jsx
import React from "react";
import { DateRange } from "react-date-range";
import { makeStyles } from "@mui/styles";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const useStyles = makeStyles(() => ({
  dateRange: {
    "--rdr-primary": "rgba(28, 77, 142, 1)",
    "--rdr-range": "rgba(240, 246, 254, 1)",
    fontFamily: "Rubik",
    overflow: "hidden",
    width: "100% !important",
    backgroundColor: "#fff",
    borderRadius: 12,
    "& .rdrDateDisplayWrapper": {
      display: "none",
    },
    "& .rdrMonthAndYearWrapper": {
      padding: "8px 10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 12,
    },
    "& .rdrWeekDays": {
      marginTop: 0,
    },
    "& .rdrMonthAndYearPickers span": {
      lineHeight: "24px",
    },
    "& .rdrMonthAndYearPickers": {
      margin: 0,
      display: "flex",
      justifyContent: "flex-start",
      flex: "1 1 auto",
    },
    "& .rdrMonthAndYearPickers span": {
      fontFamily: "Rubik",
      fontSize: 22,
      fontWeight: 700,
      color: "rgba(0, 0, 0, 0.9)",
    },
    "& .rdrNextPrevButton": {
      width: 24,
      height: 24,
      borderRadius: 12,
      background: "rgba(38, 102, 190, 0.10)",
      margin: 0,
      position: "relative",
    },
    // Put BOTH arrows on the right side (prev + next)
    "& .rdrPprevButton": {
      order: 2,
      marginLeft: "auto",
    },
    "& .rdrNextButton": {
      order: 3,
      marginLeft: 2,
    },
    "& .rdrNextPrevButton:hover": {
      background: "rgba(38, 102, 190, 0.16)",
    },
    // Replace default CSS-border chevrons with the exact Figma-style icon.
    "& .rdrNextPrevButton i": {
      display: "none",
    },
    "& .rdrPprevButton::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      margin: "auto",
      width: 10,
      height: 10,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "10px 10px",
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M12.5 3.5L6 10l6.5 6.5' fill='none' stroke='%232666BE' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
    },
    "& .rdrNextButton::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      margin: "auto",
      width: 10,
      height: 10,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "10px 10px",
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M7.5 3.5L14 10l-6.5 6.5' fill='none' stroke='%232666BE' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
    },
    "& .rdrMonths": {
      paddingTop: 0,
    },
    "& .rdrMonth": {
      width: "100%",
    },
    "& .rdrWeekDays": {
      padding: 0,
    },
    // Reduce overall vertical height
    "& .rdrWeekDay, & .rdrDayNumber span": {
      fontSize: 12,
    },
    "& .rdrDay": {
      position: "relative",
      height: "36px !important",
    },
    // Range strip (light) + endpoints are circles (dark) drawn via ::before on the day number.
    "& .rdrInRange, & .rdrStartEdge, & .rdrEndEdge": {
      backgroundColor: "var(--rdr-range) !important",
      left: 0,
      right: 0,
      height: 28,
      zIndex: 0,
    },
    "& .rdrSelected": {
      backgroundColor: "transparent !important",
      zIndex: 0,
    },
    "& .rdrStartEdge": {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      left: 16  ,
    },
    "& .rdrEndEdge": {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      right: 16,
    },
    // Single-day selection: react-date-range applies both start+end edges,
    // which can leave a visible light range strip behind the dark circle.
    "& .rdrStartEdge.rdrEndEdge": {
      backgroundColor: "transparent !important",
      left: 0,
      right: 0,
    },
    // Ensure range layer stays behind the day number/circle.
    "& .rdrDay .rdrInRange, & .rdrDay .rdrStartEdge, & .rdrDay .rdrEndEdge, & .rdrDay .rdrSelected": {
      top: "60%",
      transform: "translateY(-50%)",
    },
    "& .rdrDayNumber": {
      position: "relative",
      zIndex: 2,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    "& .rdrDayNumber span": {
      position: "relative",
      zIndex: 2,
      boxSizing: "border-box",
      padding: "0 !important",
      width: 32,
      height: 32,
      minWidth: 32,
      maxWidth: 32,
      minHeight: 32,
      maxHeight: 32,
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: "32px",
    },
    // In-range day numbers (bar) should be semi-dark.
    "& .rdrInRange ~ .rdrDayNumber span, & .rdrDay .rdrInRange ~ .rdrDayNumber span": {
      color: "rgba(0, 0, 0, 0.6) !important",
    },
    // Start/end selected circle overlay (keeps strip connected).
    "& .rdrStartEdge ~ .rdrDayNumber span, & .rdrEndEdge ~ .rdrDayNumber span, & .rdrSelected ~ .rdrDayNumber span": {
      backgroundColor: "var(--rdr-primary) !important",
      color: "rgba(255, 255, 255, 1) !important",
    },
    // Nudge the end-date circle slightly left so it doesn't feel "stuck" to the right edge.
    "& .rdrEndEdge:not(.rdrStartEdge) ~ .rdrDayNumber span": {
      transform: "translateX(-4px)",
    },
    // Remove the "today" underline/pseudo element when a day is selected/in range
    "& .rdrDayNumber span:after": {
      display: "none",
    },
    "& .rdrWeekDay": {
      paddingTop: 2,
      paddingBottom: 2,
    },
    "& .rdrDays": {
      paddingBottom: 2,
    },
    "& .rdrMonthName": {
      display: "none",
    },
  },
}));

export default function CustomDateRangeCalender({ value, onChange }) {
  const classes = useStyles();

  const handleSelect = (ranges) => {
    onChange && onChange(ranges.selection);
  };

//   const today = new Date();
//   const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div style={{ width: "100%", height: "360" }}>
      <DateRange
        ranges={value}
        onChange={handleSelect}
        showPreview={false}
        moveRangeOnFirstSelection={false}
        showMonthAndYearPickers={false}
        months={1}
        direction="horizontal"
        className={classes.dateRange}
        // minDate={firstDayOfMonth}
      />
    </div>
  );
}

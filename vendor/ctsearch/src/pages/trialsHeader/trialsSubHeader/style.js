import { makeStyles } from "@mui/styles";

export const headerStyles = makeStyles(() => ({
  filterHeader_title: {
    fontSize: "14px",
    fontFamily: "Rubik",
    fontWeight: "500",
    color: "rgba(0, 0, 0, 0.8)",
  },
  filtersection_heading_div: {
    background: "rgba(220, 233, 252, 1)",
    borderTopRightRadius: "4px",
    borderBottomRightRadius: "4px",
  },
  filtersection_heading: {
    fontSize: "14px",
    fontFamily: "Rubik",
    fontWeight: "500",
    color: "rgba(28, 77, 142, 1)",
  },
  filter_block_spacing: {
    marginTop: "20px",
    marginLeft: "20px",
  },
  trial_location_scroll: {
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(217, 217, 224, 1)",
      borderRadius: "3px",
      border: "1px solid rgba(217, 217, 224, 1)",
      minHeight: "40px !important",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "rgba(217, 217, 224, 1)",
    },

    /* For Firefox */
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(217, 217, 224, 1) transparent",
  },

  headerTitle: {
    fontSize: "27px",
    color: "rgba(0, 0, 0, 0.8)",
    fontFamily: "Rubik",
    textAlign: "left",
    fontWeight: "500",
  },
  header_tab: {
    display: "flex",
    alignItems: "flex-end",
    width: "95%",
    height: "48px",
    padding: "0 10px",
    background: "rgba(220,233,252,1)",

    "& button": {
      height: "36px",
      padding: "0 24px",
      display: "flex",
      marginTop: "12px",
      alignItems: "center",

      borderTopLeftRadius: "6px",
      borderTopRightRadius: "6px",
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,

      fontSize: "15px",
      fontWeight: 500,
      background: "transparent",
      color: "rgba(0,0,0,0.6)",
      border: "1px solid transparent",
      cursor: "pointer",
    },

    "& .active": {
      background: "#2666BE",
      color: "#FFFFFF",
    },
  },
}));

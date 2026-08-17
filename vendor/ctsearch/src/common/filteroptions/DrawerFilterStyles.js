import { makeStyles } from "@mui/styles";

export const DrawerFilterStyles = makeStyles(() => ({
  accordion_detail: {
    padding: "0px !important",
    display: "flex",
    gap: "12px",
    flexDirection: "column",
  },
  drawerContainer: {
    width: "100%",
    background: "rgba(255, 255, 255, 1)",
    height: "100vh",
    padding: "15px",
    borderRight: "1px solid rgba(0,0,0,0.1)",
    transition: "width 0.0000001s ease",
    position: "relative",
    zIndex: 1,
    overflow: "visible",
    "&:hover, &:focus-within": {
      width: "calc(20.5% + 5%)",
      position: "absolute",
      top: 0,
      zIndex: 9999,
    },
  },
  according_container: {
    overflowY: "scroll",
    maxHeight: "83%",
    scrollbarWidth: "none",
  },
  logo: {
    top: 1,
    margin: "8px 0px",
  },
  filterAutoComplete: {
    margin: "15px 0px 15px 0px",
  },
  accordionContainer: {
    boxShadow: "none !important",
    "& .MuiAccordionSummary-expandIconWrapper": {
      color: "rgba(19, 51, 95, 1)",
    },
    "& .MuiAccordionSummary-root": {
      padding: "0px !important",
    },
  },
  sectionTitle: {
    color: "rgba(19, 51, 95, 1)",
    fontFamily: "Rubik !important",
    fontSize: "16px !important",
    fontWeight: "500 !important",
  },
  filterField: {
    marginBottom: 12,
    "& .MuiOutlinedInput-root": {
      borderRadius: 10,
      height: 40,
    },
    "& .MuiButtonBase-root": {
      display: "none",
    },
  },
}));
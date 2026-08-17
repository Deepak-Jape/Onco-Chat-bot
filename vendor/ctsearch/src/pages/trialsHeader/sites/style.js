import { makeStyles } from "@mui/styles";

export const sitesStyles = makeStyles(() => ({
  stickyHeader: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: "#ffffff",
    flexShrink: 0,
    borderBottom: "1px solid #e5e7eb", // same as border-gray-200
    height: "54px",
  },
}));

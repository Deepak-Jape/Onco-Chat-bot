import { Drawer, Box, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { makeStyles } from "@mui/styles";

const useDrawerStyles = makeStyles(() => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 500,
    fontFamily:"Rubik",
    color:"rgba(0, 0, 0, 0.8)",
  },
}));

const CommonRightDrawer = ({
  open,
  onClose,
  title,
  onBack,
  children,
  width = 480,
  rightHeader,
  paperSx = {},
  onContentScroll,
  // Override the content area's padding (default p:2 = 16px). Pass e.g.
  // { pt: 0 } when the child renders its own sticky header at the top.
  contentSx = {},
}) => {
  const classes = useDrawerStyles();
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: width,
          backgroundColor: "#fff",
          ...paperSx,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          padding: "16px 33px 0px 10px",
        }}
      >
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon
            sx={{
              width: 18,
              height: 18,
              color: "rgba(38, 102, 190, 1)",
            }}
          />
        </IconButton>

        <div className={classes.header}>
          <div className={classes.headerLeft}>
            <div className={classes.title}>{title}</div>
          </div>

          <div className={classes.headerRight}>{rightHeader}</div>
        </div>
      </Box>

      {/* Content */}
      <Box
        sx={{
          p: 2,
          height: "100%",
          overflowY: "auto",
          ...contentSx,
        }}
        className="app-scroll"
        onScroll={onContentScroll}
      >
        {children}
      </Box>
    </Drawer>
  );
};

export default CommonRightDrawer;

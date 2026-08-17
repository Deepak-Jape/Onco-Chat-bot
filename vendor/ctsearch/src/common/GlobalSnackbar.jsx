/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Fade from "@mui/material/Fade";
import Slide from "@mui/material/Slide";
import Grow from "@mui/material/Grow";

const SnackbarContext = React.createContext(null);

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

const transitions = {
  fade: Fade,
  slide: SlideTransition,
  grow: Grow,
};

export const useSnackbar = () => React.useContext(SnackbarContext);

export const SnackbarProvider = ({ children }) => {
  const [snack, setSnack] = React.useState({
    open: false,
    message: "",
    type: "info",
    Transition: Fade,
  });

  const showSnackbar = ({
    message,
    type = "info", // success | error | warning | info
    transition = "slide", // fade | slide | grow
    duration = 2000,
  }) => {
    setSnack({
      open: true,
      message,
      type,
      Transition: transitions[transition],
      duration,
    });
  };

  const handleClose = () => {
    setSnack((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}

      <Snackbar
        open={snack.open}
        autoHideDuration={snack.duration}
        onClose={handleClose}
        slots={{ transition: snack.Transition }}
        key={snack.Transition?.name}
      >
        <Alert
          severity={snack.type}
          variant="filled"
          sx={{
            width: "100%",
            fontFamily: "Rubik",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

import "../index.css";
import { Provider } from "react-redux";
import { AuthProvider } from "../auth/authContext";
import { SnackbarProvider } from "../common/GlobalSnackbar";
import store from "../redux/store/store";

export default function ProtectedProviders({ children }) {
  return (
    <Provider store={store}>
      {/* <SnackbarProvider> */}
        <AuthProvider>{children}</AuthProvider>
      {/* </SnackbarProvider> */}
    </Provider>
  );
}

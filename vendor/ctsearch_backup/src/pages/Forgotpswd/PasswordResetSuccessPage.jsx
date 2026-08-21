import PasswordReset from "./Pswdrest";
import { useNavigate } from "react-router-dom";

export default function PasswordResetSuccessPage() {
  const navigate = useNavigate();

  return <PasswordReset onFinish={() => navigate("/login")} />;
}


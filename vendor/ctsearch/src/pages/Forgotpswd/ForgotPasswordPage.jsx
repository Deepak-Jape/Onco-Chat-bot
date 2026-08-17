import ForgotPassword from "./Forgotpassword";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <ForgotPassword
      onContinue={() => navigate("/otp-verify")}
      onBack={() => navigate("/login")}
    />
  );
}


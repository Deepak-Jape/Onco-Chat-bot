import SetNew from "./Setnew";
import { useNavigate } from "react-router-dom";

export default function SetNewPasswordPage() {
  const navigate = useNavigate();

  return (
    <SetNew
      onContinue={() => navigate("/password-reset-success")}
      onBack={() => navigate("/otp-verify")}
    />
  );
}


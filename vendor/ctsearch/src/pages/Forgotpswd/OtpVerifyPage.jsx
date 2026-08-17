import OtpVerification from "./Otpverify";
import { useNavigate } from "react-router-dom";

export default function OtpVerifyPage() {
  const navigate = useNavigate();

  return (
    <OtpVerification
      onContinue={() => navigate("/set-new-password")}
      onBack={() => navigate("/forgot-password")}
    />
  );
}


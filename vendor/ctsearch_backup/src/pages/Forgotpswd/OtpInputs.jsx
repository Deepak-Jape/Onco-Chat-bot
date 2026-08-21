import { Box, InputBase } from "@mui/material";
import { useState, useRef } from "react";

export default function OtpInputs() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const getDigits = (text) => String(text ?? "").replace(/\D/g, "");

  const handleChange = (value, index) => {
    const digits = getDigits(value);
    if (digits.length === 0 && value !== "") return; // non-digits attempted; ignore

    const newOtp = [...otp];
    newOtp[index] = digits.slice(0, 1);
    setOtp(newOtp);

    // Move to next input
    if (digits && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key?.length === 1 && !/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleBeforeInput = (e) => {
    const data = e?.data;
    if (data && !/^\d+$/.test(data)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e, index) => {
    const pasted = getDigits(e.clipboardData?.getData("text"));
    if (!pasted) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    const newOtp = [...otp];
    let cursor = index;

    for (const ch of pasted) {
      if (cursor > 5) break;
      newOtp[cursor] = ch;
      cursor += 1;
    }

    setOtp(newOtp);

    const nextIndex = Math.min(cursor, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        gap: { xs: "8px", sm: "12px", md: "20px" },
        mt: "-22px",
        flexWrap: "wrap",
      }}
    >
      {otp.map((val, i) => (
        <InputBase
          key={i}
          inputRef={(el) => (inputRefs.current[i] = el)}
          value={val}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          autoComplete="one-time-code"
          inputProps={{
            maxLength: 1,
            inputMode: "numeric",
            pattern: "[0-9]*",
            onBeforeInput: handleBeforeInput,
            onPaste: (e) => handlePaste(e, i),
            style: {
              textAlign: "center",
              fontSize: "22px",
              color: "rgba(0, 0, 0, 0.6)",
              width: "100%",
            },
          }}
          sx={{
            width: { xs: "42px", sm: "48px", md: "56px" },
            height: { xs: "42px", sm: "48px", md: "56px" },
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 1)",
            border: "1px solid rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      ))}
    </Box>
  );
}

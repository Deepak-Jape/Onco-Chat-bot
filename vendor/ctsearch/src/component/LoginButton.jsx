// import { useMsal } from "@azure/msal-react";
// import { loginRequest } from "../auth/authConfig";
// import { InteractionStatus } from "@azure/msal-browser";

// export default function LoginButton() {
//   const { instance, inProgress } = useMsal();

//   const handleLogin = async () => {
//     if (inProgress !== InteractionStatus.None) return;

//     try {
//       await instance.loginPopup(loginRequest);
//     } catch (error) {
//       console.error("Login failed:", error);
//     }
//   };

//   return <button onClick={handleLogin}>Sign In</button>;
// }

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/authConfig";
import { InteractionStatus } from "@azure/msal-browser";

export default function LoginButton() {
  const { instance, inProgress } = useMsal();

  const handleLogin = () => {
    if (inProgress !== InteractionStatus.None) return;

    instance.loginRedirect({
      ...loginRequest,
      redirectStartPage: "/home", // 👈 dynamic home redirect
    });
  };

  return <button onClick={handleLogin}>Sign In</button>;
}

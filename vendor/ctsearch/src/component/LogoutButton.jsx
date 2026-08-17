import { useMsal } from "@azure/msal-react";

export default function LogoutButton() {
  const { instance } = useMsal();

  return <button onClick={() => instance.logoutPopup()}>Sign Out</button>;
}

import { Configuration, LogLevel } from "@azure/msal-browser";

const redirectUri = window.location.origin;

export const msalConfig: Configuration = {
  auth: {
    clientId: "b9d8ffd9-b2a0-479b-8400-a454a5b6d791",
    authority:
      "https://login.microsoftonline.com/e5b88298-1f5a-4f66-86ba-6ef5d51b6ea4/v2.0",
    redirectUri: redirectUri,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (import.meta.env?.DEV && !containsPii) console.log(message);
      },
      logLevel: LogLevel.Info,
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};

import axios from "axios";
import { authService } from "../auth/authService";

export const baseURL = import.meta.env.VITE_API_BASE_URL || "https://oncosuite.com/";

const axiosInstance = axios.create({
  baseURL: baseURL, 
  // baseURL: "https://oncosuite.com/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://oncosuite.com/",
    "Access-Control-Allow-Credentials": true,
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // debugger
    const status = error.response?.status;
    if (status === 401 ||status === 403) {
      await authService.logout()
      if (window.location.pathname !== "/login" && status == 401) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

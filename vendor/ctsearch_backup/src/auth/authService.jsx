// frontend/src/services/authService.js
import axiosInstance, { baseURL } from "../api/AxiosInstance";

export const authService = {
  // Redirect to backend login endpoint
  login: async () => {
    window.location.href = `${baseURL}user/auth/login`;
  },

  // Logout
  logout: async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await axiosInstance.post(`user/auth/logout`);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get(`user/auth/user`);
      if (response.status == 200) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to get user:", error);
      return null;
    }
  },

  // Refresh token (called automatically when needed)
  refreshToken: async () => {
    try {
      const response = await axiosInstance.post(`/auth/refresh`);
      return response.ok;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  },
};
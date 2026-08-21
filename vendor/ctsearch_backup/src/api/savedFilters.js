import axios from "axios";
import axiosInstance, { baseURL } from "./AxiosInstance";

export const saveSavedFilter = async (payload) => {
  const response = await axiosInstance.post(
    "user/setting/saved_filters/save/",
    payload,
  );
  return response.data;
};

export const getSavedFilters = async ({ page = 1, page_size = 10 } = {}) => {
  const response = await axiosInstance.get("user/setting/saved_filters/get_filters", {
    params: { page, page_size },
  });
  return response.data;
};

export const deleteSavedFilter = async (id) => {
  const safeId = encodeURIComponent(String(id));
  // Use absolute URL to avoid any dev-server proxy / relative-path issues.
  const response = await axios.delete(
    `${String(baseURL || "").replace(/\/+$/, "")}/user/setting/saved_filters/delete_filter/${safeId}/`,
    { withCredentials: true },
  );
  return response.data;
};

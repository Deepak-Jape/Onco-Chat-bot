/* eslint-disable no-unused-vars */
import axiosInstance from "./AxiosInstance";
import { baseURL } from "./AxiosInstance.jsx";

export const getAccoutDetails = async () => {
    try {
        const response = await axiosInstance.get(`user/setting/account`);
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getOrganizationDetails = async (email) => {
    try {
        const response = await axiosInstance.get(
            `user/setting/organization_info`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getAuditLogDetails = async (email) => {
    try {
        const response = await axiosInstance.get(`user/setting/audit_log/${email}`);
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getTeamMemberDetails = async (email) => {
    try {
        const response = await axiosInstance.get(
            `user/setting/team_member/${email}`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const SentInvite = async (data) => {
    try {
        const response = await axiosInstance.post(`user/setting/invite_guest`, data);
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return error;
    }
};

export const getOrganizationSeatsDetails = async (email) => {
    try {
        const response = await axiosInstance.get(
            `user/setting/organization_seats`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getCurrentContractDetails = async (email) => {
    try {
        const response = await axiosInstance.get(
            `user/setting/current_contract/${email}`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getPaymentInfoDetails = async (email) => {
    try {
        const response = await axiosInstance.get(
            `user/setting/payment_info/${email}`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getSubscriptionHistoryDetails = async (email) => {
    try {
        const response = await axiosInstance.get(
            `user/setting/subscription_history/${email}`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const updateProfileDetails = async (profileData) => {
    try {
        const response = await axiosInstance.put(
            `user/setting/edit_logged_user`,
            profileData
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};
export const deleteTeamMember = async (id, email) => {
    try {
        const response = await axiosInstance.delete(
            `user/setting/team_member/delete/?id=${id}&current_user_email=${email}`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getAllOrganizations = async (page = 1, limit = 20) => {
    try {
        const response = await axiosInstance.get(
            `user/setting/global_admin/getAll_organizations/?page=${page}&limit=${limit}`

        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const addNewOrganization = async (orgData) => {
    try {
        const response = await axiosInstance.post(
            `user/setting/global_admin/addnew_organization/`,
            orgData
            // {
            //     headers: { "Content-Type": "multipart/form-data" }
            // }
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const updateOrganization = async (email, orgData) => {
    // console.log("orgData", orgData, "email", email);
    try {
        const response = await axiosInstance.put(
            `user/setting/global_admin/update_organization`,
            orgData,
            // { params: { current_user_email: `${encodeURIComponent(email)}` } }
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return error;
    }
};

export const addNewOrganizationContract = async (email, contractData) => {
    try {
        const response = await axiosInstance.post(
            `user/setting/global_admin/add_contract/`,
            contractData,
            {
                params: { current_user_email: email },
            }
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};
export const getSingleOrganization = async (id) => {
    try {
        const response = await axiosInstance.get(
            `user/setting/global_admin/getall_organizations_byID`,
            {
                params: { organization_id: id },
            }
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const updateOrganizationContract = async (email, contractData) => {
    try {
        const response = await axiosInstance.put(
            `user/setting/global_admin/update_contract/`,
            contractData,
            {
                params: { current_user_email: email },
            }
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};
export const getOrganizationAudit = async (id) => {
    try {
        const response = await axiosInstance.get(`user/setting/get_audit-log`, {
            params: { performed_by: id },
        });
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};



export const uploadUserPhoto = async (userId, formData) => {
    try {
        const response = await axiosInstance.post(`user/setting/${userId}/photo`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }

};

export const deleteUserPhoto = async (userId) => {
    try {
        const response = await axiosInstance.delete(`user/setting/${userId}/photo`);
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};



export const uploadOrgaPhoto = async (organization_id, formData) => {
    try {
        const response = await axiosInstance.post(`user/setting/${organization_id}/orga_photo`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }

};

export const getOrgaPhotoUrl = (photoName) => {
    const name = (photoName ?? "").toString().trim();
    if (!name) return "";
    const base = String(baseURL || "").replace(/\/+$/, "");
    return `${base}/user/setting/organization/photo/${name}`;
};

export const getUserPhotoUrl = (photoName) => {
    const name = (photoName ?? "").toString().trim();
    if (!name) return "";
    const base = String(baseURL || "").replace(/\/+$/, "");
    return `${base}/user/setting/user/photo/${name}`;
};

export const deleteOrgaPhoto = async (organization_id) => {
    try {
        const response = await axiosInstance.delete(`/setting/${organization_id}/remove_orga_photo`);
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const updateTeamMember = async (user_id, role_id, user_status) => {
    try {
        const response = await axiosInstance.put(
            `user/setting/global_admin/edit_org_member`,
            {
                user_id,
                role_id,
                user_status,
            }
        );

        return response.data;
    } catch (error) {
        console.error("API call error:", error?.response?.data.detail || error?.message);
        return error;
    }
};

export const getExecutiveSummaryById = async (oncosuite_id, session_key, signal) => {
    try {
        const response = await axiosInstance.get(
            `search/ExecutiveSummary`,
            {
                params: {
                    OncoSuiteId: oncosuite_id,
                    // OncoSuiteId: "ONCO-001",
                    ...(session_key ? { session_key } : {}),
                },
                ...(signal ? { signal } : {}),
            }
        );

        return response.data;

    } catch (error) {
        if (axiosInstance.isCancel?.(error) || error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
            return null;
        }
        console.error(
            "API call error:",
            error?.response?.data?.detail || error?.message
        );
        throw error;
    }
};


// ------------------------ SITE INTELLIGENCE API'S ----------------------------------------------------------------

export const createNewProject = async (payload) => {
    try {
        const response = await axiosInstance.post(
            `user/site_intelligence/create_project`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const updateProject = async (id, payload) => {
    try {
        const response = await axiosInstance.put(
            `user/site_intelligence/update_project/${id}`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getAllProjects = async (status = true, createdByFilter = "Anyone") => {
    try {
        const response = await axiosInstance.get(
            `user/site_intelligence/all_projects_by_status?status=${status}&created_by_filter=${createdByFilter}`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getRecentProjects = async () => {
    try {
        const response = await axiosInstance.get(
            `user/site_intelligence/recent_projects`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getProjectsDropdownList = async () => {
    try {
        const response = await axiosInstance.get(
            `user/site_intelligence/all_projects`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const deleteProject = async (id) => {
    try {
        const response = await axiosInstance.delete(
            `user/site_intelligence/project/delete/${id}`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getAllCohorts = async (id) => {
    try {
        const response = await axiosInstance.get(
            `user/site_intelligence/cohorts/${id}`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};

export const getProjectDetails = async (id) => {
    try {
        const response = await axiosInstance.get(
            `user/site_intelligence/project/${id}`
        );
        return response.data;
    } catch (error) {
        console.error("API call error:", error.response?.data || error.message);
        return null;
    }
};
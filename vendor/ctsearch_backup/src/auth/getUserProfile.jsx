import axios from "axios";

const graphMeEndpoint = "https://graph.microsoft.com/v1.0/me";

const getUserProfile = async (accessToken) => {
  const response = await axios.get(graphMeEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export default getUserProfile;

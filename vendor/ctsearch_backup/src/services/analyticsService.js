import axios from "axios";

const BASE_URL =
  "https://trialsearch-fbb8g2e0c2aqfee9.centralindia-01.azurewebsites.net";

// CACHE KEY & EXPIRY
const CACHE_KEY = "analytics_outcomes_cache";
const CACHE_EXPIRY_MINUTES = 10; // ⭐ cache valid for 10 minutes

export const getAnalytics = async () => {
  try {
    // 1️⃣ Check Cache
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      const parsed = JSON.parse(cached);
      const now = Date.now();

      // cache valid?
      if (now - parsed.timestamp < CACHE_EXPIRY_MINUTES * 60 * 1000) {
        return parsed.data;
      }
    }

    // 2️⃣ If no cache → Call API

    const payload = {
      graph: [
        "endpointFreqByPhase",
        "trialDuration",
        "timeToEndpoint",
        "mostActiveSponsors",
      ],
    };

    const queryId = "0256ae9d-b8fc-4c11-a07c-04a908c638fb";
    const page = "outcomes";

    const res = await axios.post(
      `${BASE_URL}/Analytics/?query_id=${queryId}&page=${page}`,
      payload
    );

    const data = res.data;

    // 3️⃣ Save to Cache
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );

    return data;
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return null;
  }
};

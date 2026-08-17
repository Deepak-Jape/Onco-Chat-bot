import axiosInstance from '../../api/AxiosInstance'
import { setFilterData } from '../trialsSlice';


//Conditions
export const FETCH_CONDITIONS_REQUEST = 'FETCH_CONDITIONS_REQUEST';
export const FETCH_CONDITIONS_SUCCESS = 'FETCH_CONDITIONS_SUCCESS';
export const FETCH_CONDITIONS_FAILURE = 'FETCH_CONDITIONS_FAILURE';
const fetchConditionsRequest = () => ({
  type: FETCH_CONDITIONS_REQUEST,
});
const fetchConditionsSuccess = (conditions) => ({
  type: FETCH_CONDITIONS_SUCCESS,
  payload: conditions,
});
const fetchConditionsFailure = (error) => ({
  type: FETCH_CONDITIONS_FAILURE,
  payload: error,
});
export const fetchConditions = (query = "") => {
  return async (dispatch) => {
    dispatch(fetchConditionsRequest());
    try {
      const response = await axiosInstance.get(`/conditions/`, {
        params: { q: query },
      });

      dispatch(fetchConditionsSuccess(response.data));
    } catch (error) {
      dispatch(fetchConditionsFailure(error.message || "Failed to fetch data"));
    }
  };
};


//Phases
export const FETCH_PHASES_REQUEST = 'FETCH_PHASES_REQUEST';
export const FETCH_PHASES_SUCCESS = 'FETCH_PHASES_SUCCESS';
export const FETCH_PHASES_FAILURE = 'FETCH_PHASES_FAILURE';
const fetchPhasesRequest = () => ({
  type: FETCH_PHASES_REQUEST,
});
const fetchPhasesSuccess = (Phases) => ({
  type: FETCH_PHASES_SUCCESS,
  payload: Phases,
});
const fetchPhasesFailure = (error) => ({
  type: FETCH_PHASES_FAILURE,
  payload: error,
});
export const fetchPhases = () => {
  return async (dispatch) => {
    dispatch(fetchPhasesRequest());
    try {
      const response = await axiosInstance.get("/phases/");
      dispatch(fetchPhasesSuccess(response.data));
    } catch (error) {
      dispatch(fetchPhasesFailure(error.message || "Failed to fetch phases"));
    }
  };
};


//Count
export const FETCH_COUNT_REQUEST = "FETCH_COUNT_REQUEST";
export const FETCH_COUNT_SUCCESS = "FETCH_COUNT_SUCCESS";
export const FETCH_COUNT_FAILURE = "FETCH_COUNT_FAILURE";
const fetchCountRequest = () => ({
  type: FETCH_COUNT_REQUEST,
});
const fetchCountSuccess = (count) => ({
  type: FETCH_COUNT_SUCCESS,
  payload: count,
});
const fetchCountFailure = (error) => ({
  type: FETCH_COUNT_FAILURE,
  payload: error,
});

export const fetchCount = (filters = {}) => {
  return async (dispatch) => {
    dispatch(fetchCountRequest());

    const url = "https://trialsearch-fbb8g2e0c2aqfee9.centralindia-01.azurewebsites.net/count/GetCount/";

    try {
      const requestBody = filters && Object.keys(filters).length > 0 ? filters : {};

      let response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // Retry if POST not allowed
      if (response.status === 405) {
        console.warn("POST not allowed, retrying with GET...");
        const params = new URLSearchParams(requestBody);
        response = await fetch(`${url}?${params.toString()}`, { method: "GET" });
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      // ✅ Determine if filters applied
      const isFiltered = Object.keys(filters).length > 0;

      dispatch(fetchCountSuccess({ isFiltered, data }));
    } catch (err) {
      console.error("fetchCount error:", err);
      dispatch(fetchCountFailure(err.message));
    }
  };
};


//TrialSearch
export const FETCH_TRIALS_REQUEST = "FETCH_TRIALS_REQUEST";
export const FETCH_TRIALS_SUCCESS = "FETCH_TRIALS_SUCCESS";
export const FETCH_TRIALS_FAILURE = "FETCH_TRIALS_FAILURE";
const fetchTrialsRequest = () => ({
  type: FETCH_TRIALS_REQUEST,
});
const fetchTrialsSuccess = (trials) => ({
  type: FETCH_TRIALS_SUCCESS,
  payload: {
    trials: trials.trials,
    queryId: trials.query_id,
  },
});
const fetchTrialsFailure = (error) => ({
  type: FETCH_TRIALS_FAILURE,
  payload: error,
});

export const fetchTrials = (filters = {}, page_size, page_number, queryId = null) => {
  return async (dispatch) => {
    dispatch(fetchTrialsRequest());

    try {
      // build query parameters dynamically
      const queryParams = new URLSearchParams({
        page_size: page_size.toString(),
        page_number: page_number.toString(),
      });

      // only add query_id if it exists
      if (queryId) {
        queryParams.append("query_id", queryId.toString());
      }

      const response = await fetch(
        `https://trialsearch-fbb8g2e0c2aqfee9.centralindia-01.azurewebsites.net/TrialSearch/?${queryParams}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filters),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchTrialsSuccess(data));
      dispatch(setFilterData(data));
      return Promise.resolve(data)
    } catch (error) {
      dispatch(fetchTrialsFailure(error.toString()));
      console.error("Fetch error:", error);
    }
  };
};



//Interventionals
export const FETCH_INTERVENTIONS_REQUEST = 'FETCH_INTERVENTIONS_REQUEST';
export const FETCH_INTERVENTIONS_SUCCESS = 'FETCH_INTERVENTIONS_SUCCESS';
export const FETCH_INTERVENTIONS_FAILURE = 'FETCH_INTERVENTIONS_FAILURE';
const fetchInterventionsRequest = () => ({
  type: FETCH_INTERVENTIONS_REQUEST,
});
const fetchInterventionsSuccess = (Interventions) => ({
  type: FETCH_INTERVENTIONS_SUCCESS,
  payload: Interventions,
});
const fetchInterventionsFailure = (error) => ({
  type: FETCH_INTERVENTIONS_FAILURE,
  payload: error,
});
export const fetchInterventions = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchInterventionsRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/interventions/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchInterventionsSuccess(data));
      return Promise.resolve(data)
    } catch (error) {
      dispatch(fetchInterventionsFailure(error.toString()));
    }
  };
};


//ComparativeTreatmentRequest
export const FETCH_COMPARATIVE_TREATMENT_REQUEST = 'FETCH_COMPARATIVE_TREATMENT_REQUEST';
export const FETCH_COMPARATIVE_TREATMENT_SUCCESS = 'FETCH_COMPARATIVE_TREATMENT_SUCCESS';
export const FETCH_COMPARATIVE_TREATMENT_FAILURE = 'FETCH_COMPARATIVE_TREATMENT_FAILURE';
const fetchComparativeTreatmentRequest = () => ({
  type: FETCH_COMPARATIVE_TREATMENT_REQUEST,
});
const fetchComparativeTreatmentSucces = (ComparativeTreatment) => ({
  type: FETCH_COMPARATIVE_TREATMENT_SUCCESS,
  payload: ComparativeTreatment,
});
const fetchComparativeTreatmentFailure = (error) => ({
  type: FETCH_COMPARATIVE_TREATMENT_FAILURE,
  payload: error,
});

export const fetchComparativeTreatment = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchComparativeTreatmentRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/comparative_treatment/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchComparativeTreatmentSucces(data));
    } catch (error) {
      dispatch(fetchComparativeTreatmentFailure(error.toString()));
    }
  };
};


//SearchLocation
export const FETCH_LOCATION_REQUEST = 'FETCH_LOCATION_REQUEST';
export const FETCH_LOCATION_SUCCESS = 'FETCH_LOCATION_SUCCESS';
export const FETCH_LOCATION_FAILURE = 'FETCH_LOCATION_FAILURE';
const fetchLocationRequest = () => ({
  type: FETCH_LOCATION_REQUEST,
});
const fetchLocationSucces = (Location) => ({
  type: FETCH_LOCATION_SUCCESS,
  payload: Location,
});
const fetchLocationFailure = (error) => ({
  type: FETCH_LOCATION_FAILURE,
  payload: error,
});
export const fetchLocation = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchLocationRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/locations/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchLocationSucces(data));
    } catch (error) {
      dispatch(fetchLocationFailure(error.toString()));
    }
  };
};


//SearchLocation
export const FETCH_FACILITY_REQUEST = 'FETCH_FACILITY_REQUEST';
export const FETCH_FACILITY_SUCCESS = 'FETCH_FACILITY_SUCCESS';
export const FETCH_FACILITY_FAILURE = 'FETCH_FACILITY_FAILURE';
const fetchFacilityRequest = () => ({
  type: FETCH_FACILITY_REQUEST,
});
const fetchFacilitySucces = (Facility) => ({
  type: FETCH_FACILITY_SUCCESS,
  payload: Facility,
});
const fetchFacilityFailure = (error) => ({
  type: FETCH_FACILITY_FAILURE,
  payload: error,
});
export const fetchFacility = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchFacilityRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/facility_names/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchFacilitySucces(data));
    } catch (error) {
      dispatch(fetchFacilityFailure(error.toString()));
    }
  };
};

//LeadSponsers
export const FETCH_LEAD_SPONSERS_REQUEST = 'FETCH_LEAD_SPONSERS_REQUEST';
export const FETCH_LEAD_SPONSERS_SUCCESS = 'FETCH_LEAD_SPONSERS_SUCCESS';
export const FETCH_LEAD_SPONSERS_FAILURE = 'FETCH_LEAD_SPONSERS_FAILURE';
const fetchLeadSponsersRequest = () => ({
  type: FETCH_LEAD_SPONSERS_REQUEST,
});
const fetchLeadSponsersSucces = (LeadSponsers) => ({
  type: FETCH_LEAD_SPONSERS_SUCCESS,
  payload: LeadSponsers,
});
const fetchLeadSponsersFailure = (error) => ({
  type: FETCH_LEAD_SPONSERS_FAILURE,
  payload: error,
});
export const fetchLeadSponsers = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchLeadSponsersRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/lead_sponsors/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchLeadSponsersSucces(data));
    } catch (error) {
      dispatch(fetchLeadSponsersFailure(error.toString()));
    }
  };
};


//LeadResercher
export const FETCH_LEAD_RESERCHER_REQUEST = 'FETCH_LEAD_RESERCHER_REQUEST';
export const FETCH_LEAD_RESERCHER_SUCCESS = 'FETCH_LEAD_RESERCHER_SUCCESS';
export const FETCH_LEAD_RESERCHER_FAILURE = 'FETCH_LEAD_RESERCHER_FAILURE';
const fetchLeadResercherRequest = () => ({
  type: FETCH_LEAD_RESERCHER_REQUEST,
});
const fetchLeadResercherSucces = (LeadResercher) => ({
  type: FETCH_LEAD_RESERCHER_SUCCESS,
  payload: LeadResercher,
});
const fetchLeadResercherFailure = (error) => ({
  type: FETCH_LEAD_RESERCHER_FAILURE,
  payload: error,
});
export const fetchLeadResercher = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchLeadResercherRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/lead_researcher/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchLeadResercherSucces(data));
    } catch (error) {
      dispatch(fetchLeadResercherFailure(error.toString()));
    }
  };
};



//Biomarker
export const FETCH_BIOMARKER_REQUEST = 'FETCH_BIOMARKER_REQUEST';
export const FETCH_BIOMARKER_SUCCESS = 'FETCH_BIOMARKER_SUCCESS';
export const FETCH_BIOMARKER_FAILURE = 'FETCH_BIOMARKER_FAILURE';
const fetchBiomarkerRequest = () => ({
  type: FETCH_BIOMARKER_REQUEST,
});
const fetchBiomarkerSucces = (Biomarker) => ({
  type: FETCH_BIOMARKER_SUCCESS,
  payload: Biomarker,
});
const fetchBiomarkerFailure = (error) => ({
  type: FETCH_BIOMARKER_FAILURE,
  payload: error,
});
export const fetchBiomarker = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchBiomarkerRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/biomarkers_name/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchBiomarkerSucces(data));
    } catch (error) {
      dispatch(fetchBiomarkerFailure(error.toString()));
    }
  };
};


//Response-Criteria
export const FETCH_RESPONSE_CRITERIA_REQUEST = 'FETCH_RESPONSE_CRITERIA_REQUEST';
export const FETCH_RESPONSE_CRITERIA_SUCCESS = 'FETCH_RESPONSE_CRITERIA_SUCCESS';
export const FETCH_RESPONSE_CRITERIA_FAILURE = 'FETCH_RESPONSE_CRITERIA_FAILURE';
const fetchResponseCriteriaRequest = () => ({
  type: FETCH_RESPONSE_CRITERIA_REQUEST,
});
const fetchResponseCriteriaSucces = (ResponseCriteria) => ({
  type: FETCH_RESPONSE_CRITERIA_SUCCESS,
  payload: ResponseCriteria,
});
const fetchResponseCriteriaFailure = (error) => ({
  type: FETCH_RESPONSE_CRITERIA_FAILURE,
  payload: error,
});
export const fetchResponseCriteria = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchResponseCriteriaRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/response_criteria_name/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchResponseCriteriaSucces(data));
    } catch (error) {
      dispatch(fetchResponseCriteriaFailure(error.toString()));
    }
  };
};

//Combination-Backbone
export const FETCH_BACKBONE_REQUEST = 'FETCH_BACKBONE_REQUEST';
export const FETCH_BACKBONE_SUCCESS = 'FETCH_BACKBONE_SUCCESS';
export const FETCH_BACKBONE_FAILURE = 'FETCH_BACKBONE_FAILURE';
const fetchBackboneRequest = () => ({
  type: FETCH_BACKBONE_REQUEST,
});
const fetchBackboneSucces = (Backbone) => ({
  type: FETCH_BACKBONE_SUCCESS,
  payload: Backbone,
});
const fetchBackboneFailure = (error) => ({
  type: FETCH_BACKBONE_FAILURE,
  payload: error,
});
export const fetchBackbone = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchBackboneRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/combination_backbone/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchBackboneSucces(data));
    } catch (error) {
      dispatch(fetchBackboneFailure(error.toString()));
    }
  };
};


//nctID
export const FETCH_NCT_ID_REQUEST = 'FETCH_NCT_ID_REQUEST';
export const FETCH_NCT_ID_SUCCESS = 'FETCH_NCT_ID_SUCCESS';
export const FETCH_NCT_ID_FAILURE = 'FETCH_NCT_ID_FAILURE';
const fetchNctIdRequest = () => ({
  type: FETCH_NCT_ID_REQUEST,
});
const fetchNctIdSucces = (NctId) => ({
  type: FETCH_NCT_ID_SUCCESS,
  payload: NctId,
});
const fetchNctIdFailure = (error) => ({
  type: FETCH_NCT_ID_FAILURE,
  payload: error,
});
export const fetchNctId = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchNctIdRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/nct_id/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchNctIdSucces(data));
    } catch (error) {
      dispatch(fetchNctIdFailure(error.toString()));
    }
  };
};



//MoaComparator
export const FETCH_MOA_INTERVENTION_REQUEST = 'FETCH_MOA_INTERVENTION_REQUEST';
export const FETCH_MOA_INTERVENTION_SUCCESS = 'FETCH_MOA_INTERVENTION_SUCCESS';
export const FETCH_MOA_INTERVENTION_FAILURE = 'FETCH_MOA_INTERVENTION_FAILURE';
const fetchMoaInterventionRequest = () => ({
  type: FETCH_MOA_INTERVENTION_REQUEST,
});
const fetchMoaInterventionSucces = (MoaIntervention) => ({
  type: FETCH_MOA_INTERVENTION_SUCCESS,
  payload: MoaIntervention,
});
const fetchMoaInterventionFailure = (error) => ({
  type: FETCH_MOA_INTERVENTION_FAILURE,
  payload: error,
});
export const fetchMoaIntervention = (query = '') => {
  return async (dispatch) => {
    dispatch(fetchMoaInterventionRequest());
    try {
      const response = await fetch(
        `https://clinicaltrialsautocomplete-bbgkaycserhtcxgq.centralindia-01.azurewebsites.net/moa/?q=${query}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(fetchMoaInterventionSucces(data));
    } catch (error) {
      dispatch(fetchMoaInterventionFailure(error.toString()));
    }
  };
};


//MoaComparator
export const FETCH_MOA_COMPARATOR_SUCCESS = 'FETCH_MOA_COMPARATOR_SUCCESS';
export const FETCH_MOA_COMPARATOR_REQUEST = 'FETCH_MOA_COMPARATOR_REQUEST';
export const FETCH_MOA_COMPARATOR_FAILURE = 'FETCH_MOA_COMPARATOR_FAILURE';
const fetchMoaComparatorRequest = () => ({
  type: FETCH_MOA_COMPARATOR_REQUEST,
});
const fetchMoaComparatorSucces = (MoaComparator) => ({
  type: FETCH_MOA_COMPARATOR_SUCCESS,
  payload: MoaComparator,
});
const fetchMoaComparatorFailure = (error) => ({
  type: FETCH_MOA_COMPARATOR_FAILURE,
  payload: error,
});

export const fetchMoaComparator = (query = "") => {
  return async (dispatch) => {
    dispatch(fetchMoaComparatorRequest());
    try {
      const response = await axiosInstance.get(`/moa_comparator/`, {
        params: { q: query },
      });

      dispatch(fetchMoaComparatorSucces(response.data));
    } catch (error) {
      dispatch(fetchMoaComparatorFailure(error.message || "Failed to fetch MOA Comparator"));
    }
  };
};



//SiteSearch
export const FETCH_SITES_REQUEST = "FETCH_SITES_REQUEST";
export const FETCH_SITES_SUCCESS = "FETCH_SITES_SUCCESS";
export const FETCH_SITES_FAILURE = "FETCH_SITES_FAILURE";
const fetchSitesRequest = () => ({
  type: FETCH_SITES_REQUEST,
});
const fetchSitesSuccess = (sites) => ({
  type: FETCH_SITES_SUCCESS,
  payload: sites,
});
const fetchSitesFailure = (error) => ({
  type: FETCH_SITES_FAILURE,
  payload: error,
});

export const fetchSites = (filters = {}, page_size, page_number) => {
  return async (dispatch) => {
    dispatch(fetchSitesRequest());

    try {
      const queryParams = new URLSearchParams({
        page_size: page_size.toString(),
        page_number: page_number.toString(),
      });

      const response = await fetch(
        `https://trialsearch-fbb8g2e0c2aqfee9.centralindia-01.azurewebsites.net/SiteSearch/?${queryParams}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filters), // filters like { study_type: ["INTERVENTIONAL"], study_phase: ["1","2"] }
        }
      );

      if (!response.ok) {
        // handle non-2xx HTTP statuses
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      dispatch(fetchSitesSuccess(data.data));
    } catch (error) {
      dispatch(fetchSitesFailure(error.toString()));
      console.error("Fetch error:", error);
    }
  };
};


//SiteCount
export const FETCH_SITE_COUNT_REQUEST = "FETCH_SITE_COUNT_REQUEST";
export const FETCH_SITE_COUNT_SUCCESS = "FETCH_SITE_COUNT_SUCCESS";
export const FETCH_SITE_COUNT_FAILURE = "FETCH_SITE_COUNT_FAILURE";
const fetchSiteCountRequest = () => ({
  type: FETCH_SITE_COUNT_REQUEST,
});
const fetchSiteCountSuccess = (count) => ({
  type: FETCH_SITE_COUNT_SUCCESS,
  payload: count,
});
const fetchSiteCountFailure = (error) => ({
  type: FETCH_SITE_COUNT_FAILURE,
  payload: error,
});
export const fetchSiteCount = (filters = {}) => {
  return async (dispatch) => {
    dispatch(fetchSiteCountRequest());

    const baseUrl = "https://trialsearch-fbb8g2e0c2aqfee9.centralindia-01.azurewebsites.net/SiteCount/";

    try {
      let response;

      // Determine if filters exist
      const hasFilters = Object.keys(filters).length > 0;

      if (hasFilters) {
        // ✅ Try GET with query params directly
        const params = new URLSearchParams(filters);
        response = await fetch(`${baseUrl}?${params.toString()}`, {
          method: "GET",
        });
      } else {
        // ✅ No filters: simple GET request
        response = await fetch(baseUrl, { method: "GET" });
      }

      // Handle error response
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      dispatch(
        fetchSiteCountSuccess({
          isFiltered: hasFilters,
          data,
        })
      );
    } catch (err) {
      console.error("fetchSiteCount error:", err);
      dispatch(fetchSiteCountFailure(err.message));
    }
  };
};
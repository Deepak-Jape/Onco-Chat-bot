import {
  FETCH_CONDITIONS_REQUEST,
  FETCH_CONDITIONS_SUCCESS,
  FETCH_CONDITIONS_FAILURE,
  FETCH_PHASES_REQUEST,
  FETCH_PHASES_SUCCESS,
  FETCH_PHASES_FAILURE,
  FETCH_COUNT_REQUEST,
  FETCH_COUNT_SUCCESS,
  FETCH_COUNT_FAILURE,
  FETCH_TRIALS_REQUEST,
  FETCH_TRIALS_SUCCESS,
  FETCH_TRIALS_FAILURE,
  FETCH_INTERVENTIONS_REQUEST,
  FETCH_INTERVENTIONS_SUCCESS,
  FETCH_INTERVENTIONS_FAILURE,
  FETCH_COMPARATIVE_TREATMENT_REQUEST,
  FETCH_COMPARATIVE_TREATMENT_SUCCESS,
  FETCH_COMPARATIVE_TREATMENT_FAILURE,
  FETCH_LOCATION_REQUEST,
  FETCH_LOCATION_SUCCESS,
  FETCH_LOCATION_FAILURE,
  FETCH_FACILITY_REQUEST,
  FETCH_FACILITY_SUCCESS,
  FETCH_FACILITY_FAILURE,
  FETCH_LEAD_SPONSERS_REQUEST,
  FETCH_LEAD_SPONSERS_SUCCESS,
  FETCH_LEAD_SPONSERS_FAILURE,
  FETCH_LEAD_RESERCHER_REQUEST,
  FETCH_LEAD_RESERCHER_SUCCESS,
  FETCH_LEAD_RESERCHER_FAILURE,
  FETCH_BIOMARKER_REQUEST,
  FETCH_BIOMARKER_SUCCESS,
  FETCH_BIOMARKER_FAILURE,
  FETCH_RESPONSE_CRITERIA_REQUEST,
  FETCH_RESPONSE_CRITERIA_SUCCESS,
  FETCH_RESPONSE_CRITERIA_FAILURE,
  FETCH_BACKBONE_REQUEST,
  FETCH_BACKBONE_SUCCESS,
  FETCH_BACKBONE_FAILURE,
  FETCH_NCT_ID_REQUEST,
  FETCH_NCT_ID_SUCCESS,
  FETCH_NCT_ID_FAILURE,
  FETCH_MOA_INTERVENTION_REQUEST,
  FETCH_MOA_INTERVENTION_SUCCESS,
  FETCH_MOA_INTERVENTION_FAILURE,
  FETCH_MOA_COMPARATOR_SUCCESS,
  FETCH_MOA_COMPARATOR_REQUEST,
  FETCH_MOA_COMPARATOR_FAILURE,
  FETCH_SITES_REQUEST,
  FETCH_SITES_SUCCESS,
  FETCH_SITES_FAILURE,
  FETCH_SITE_COUNT_REQUEST,
  FETCH_SITE_COUNT_SUCCESS,
  FETCH_SITE_COUNT_FAILURE
} from '../actions/searchAction';

const initialState = {
  conditions: [],
  loading: false,
  error: null,
  phases: [],
  interventions: [],
  comparativeTreatment: [],
  locations: [],
  facility: [],
  leadSponsers: [],
  leadResearcher: [],
  biomarker: [],
  responseCriteria: [],
  backbone: [],
  nctId: [],
  moaIntervention: [],
  moaComparator: [],
  loadingPhases: false,
  errorPhases: null,
  count: null,
  conditionCount: null,
  studyPhaseCount: null,
  studyTypeCount: null,
  studyStatusCount: null,
  readoutCount: null,
  loadingCount: false,
  errorCount: null,
  trials: [],
  queryId: null,
  loadingTrials: false,
  errorTrials: null,
  sites: [],
  loadingSites: false,
  errorSites: null,
  siteCount: null,
  loadingSiteCount: false,
  errorSiteCount: null,
};
const conditionReducer = (state = initialState, action) => {
  switch (action.type) {
    //Conditions
    case FETCH_CONDITIONS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_CONDITIONS_SUCCESS:
      return { ...state, loading: false, conditions: action.payload, error: null };
    case FETCH_CONDITIONS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //Interventions
    case FETCH_INTERVENTIONS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_INTERVENTIONS_SUCCESS:
      return { ...state, loading: false, interventions: action.payload, error: null };
    case FETCH_INTERVENTIONS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //Phases
    case FETCH_PHASES_REQUEST:
      return { ...state, loadingPhases: true, errorPhases: null };
    case FETCH_PHASES_SUCCESS:
      return { ...state, loadingPhases: false, phases: action.payload };
    case FETCH_PHASES_FAILURE:
      return { ...state, loadingPhases: false, errorPhases: action.payload };
    //Trials
    case FETCH_TRIALS_REQUEST:
      return { ...state, loadingTrials: true, errorTrials: null };
    case FETCH_TRIALS_SUCCESS:
      return {
        ...state, loadingTrials: false, trials: action.payload.trials,
        queryId: action.payload.queryId,
      };
    case FETCH_TRIALS_FAILURE:
      return { ...state, loadingTrials: false, errorTrials: action.payload };
    //Count
    case FETCH_COUNT_SUCCESS: {
      const { isFiltered, data } = action.payload;
      return {
        ...state,
        loadingCount: false,
        count: !isFiltered ? data?.trial_count || 0 : state.count,
        conditionCount: isFiltered ? data?.trial_count || 0 : 0,
      };
    }
    //ComparativeTreatment
    case FETCH_COMPARATIVE_TREATMENT_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_COMPARATIVE_TREATMENT_SUCCESS:
      return { ...state, loading: false, comparativeTreatment: action.payload, error: null };
    case FETCH_COMPARATIVE_TREATMENT_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //Locations
    case FETCH_LOCATION_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_LOCATION_SUCCESS:
      return { ...state, loading: false, locations: action.payload, error: null };
    case FETCH_LOCATION_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //Facility
    case FETCH_FACILITY_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_FACILITY_SUCCESS:
      return { ...state, loading: false, facility: action.payload, error: null };
    case FETCH_FACILITY_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //LeadSponsers
    case FETCH_LEAD_SPONSERS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_LEAD_SPONSERS_SUCCESS:
      return { ...state, loading: false, leadSponsers: action.payload, error: null };
    case FETCH_LEAD_SPONSERS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //LeadResercher
    case FETCH_LEAD_RESERCHER_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_LEAD_RESERCHER_SUCCESS:
      return { ...state, loading: false, leadResearcher: action.payload, error: null };
    case FETCH_LEAD_RESERCHER_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //Biomarker
    case FETCH_BIOMARKER_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_BIOMARKER_SUCCESS:
      return { ...state, loading: false, biomarker: action.payload, error: null };
    case FETCH_BIOMARKER_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //ResponseCriteria
    case FETCH_RESPONSE_CRITERIA_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_RESPONSE_CRITERIA_SUCCESS:
      return { ...state, loading: false, responseCriteria: action.payload, error: null };
    case FETCH_RESPONSE_CRITERIA_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //CombinationBackbone
    case FETCH_BACKBONE_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_BACKBONE_SUCCESS:
      return { ...state, loading: false, backbone: action.payload, error: null };
    case FETCH_BACKBONE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //NctId
    case FETCH_NCT_ID_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_NCT_ID_SUCCESS:
      return { ...state, loading: false, nctId: action.payload, error: null };
    case FETCH_NCT_ID_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //MoaIntervention
    case FETCH_MOA_INTERVENTION_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_MOA_INTERVENTION_SUCCESS:
      return { ...state, loading: false, moaIntervention: action.payload, error: null };
    case FETCH_MOA_INTERVENTION_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //MoaComparator
    case FETCH_MOA_COMPARATOR_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_MOA_COMPARATOR_SUCCESS:
      return { ...state, loading: false, moaComparator: action.payload, error: null };
    case FETCH_MOA_COMPARATOR_FAILURE:
      return { ...state, loading: false, error: action.payload };
    //Sites
    case FETCH_SITES_REQUEST:
      return { ...state, loadingSites: true, errorSites: null };
    case FETCH_SITES_SUCCESS:
      return { ...state, loadingSites: false, sites: action.payload };
    case FETCH_SITES_FAILURE:
      return { ...state, loadingSites: false, errorSites: action.payload };
    //SiteCount
    case FETCH_SITE_COUNT_SUCCESS: {
      const { isFiltered, data } = action.payload;
      return {
        ...state,
        loadingCount: false,
        siteCount: action.payload?.data?.site_count || 0,
      };
    }

    default:
      return state;
  }
};

export default conditionReducer;

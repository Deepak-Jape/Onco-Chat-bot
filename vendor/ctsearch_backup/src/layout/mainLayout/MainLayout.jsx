import { useMemo } from "react";
import DrawerFilter from "../../common/DrawerFilter";
import Sidebar from "../sidebar/Sidebar";
import ProfileSetting from "../../pages/settings/ProfileSetting";
import { useLocation, useNavigate } from "react-router-dom";
import RegulatoryDrugDetail from "../../pages/Regulatory/RegulatoryDrugDetail";
import SiteDashboard from "../../pages/Site intelligence/SiteDashboard";
import MainDrugIntelligencePage from "../../pages/Drug intelligence/MainDrugIntelligencePage";

const MainLayout = ({ children, onFilterChange, filters = {}, setFilters }) => {
  // const [activeTab, setActiveTab] = useState("TRIALS");

  const TAB_ROUTE_MAP = {
    TRIALS: "/",
    SETTINGS: "/settings",
    ORGANIZATIONS: "/admin/users",
    "SITE INTELLIGENCE": "/admin/site_intelligence",
    "DRUG INTELLIGENCE": "/admin/drug_intelligence",
  };

  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = useMemo(() => {
    const entry = Object.entries(TAB_ROUTE_MAP).find(
      ([, path]) => path === location.pathname,
    );
    return entry ? entry[0] : "TRIALS";
  }, [location.pathname]);

  const handleMenuChange = (item) => {
    // setActiveTab(item.tab);
    navigate(item.link);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        // Sidebar is `position: fixed` and doesn't take layout space; reserve it here.
        // paddingLeft: 68,
      }}
    >
      {/* <Sidebar activeTab={activeTab} onMenuChange={handleMenuChange} /> */}
      {activeTab === "TRIALS" && (
        <>
          {/* <div
            style={{
              width: "20.5%",
            }}
          >
            <DrawerFilter
              onFilterChange={onFilterChange}
              filters={filters}
              setFilters={setFilters}
            />
          </div> */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
            className="bg-gray-50"
          >
            {children}
          </div>
        </>
      )}
      {activeTab === "SETTINGS" && <ProfileSetting />}
      {activeTab === "SECURITY" && (
        <div style={{ flex: 1, minWidth: 0 }} className="bg-gray-50">
          <RegulatoryDrugDetail />
        </div>
      )}
      {activeTab === "SITE INTELLIGENCE" && (
        <div style={{ flex: 1, minWidth: 0 }} className="bg-gray-50">
          {<SiteDashboard />}
        </div>
      )}
      {activeTab === "DRUG INTELLIGENCE" && (
        <div style={{ flex: 1, minWidth: 0 }} className="bg-gray-50">
          {<MainDrugIntelligencePage />}
        </div>
      )}
    </div>
  );
};

export default MainLayout;

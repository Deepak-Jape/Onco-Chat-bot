// src/layouts/AppLayout.jsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, Suspense } from "react";
import Sidebar from "./sidebar/Sidebar";

const TAB_ROUTE_MAP = {
  TRIALS: "/trials",
  SETTINGS: "/settings",
  ORGANIZATIONS: "/admin/users",
  "SITE INTELLIGENCE": "/admin/site_intelligence",
  "DRUG INTELLIGENCE": "/admin/drug_intelligence",
};

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Figure out which sidebar tab is active based on current URL
  const activeTab = useMemo(() => {
    const entry = Object.entries(TAB_ROUTE_MAP).find(([, path]) =>
      location.pathname.startsWith(path)
    );
    return entry ? entry[0] : "TRIALS";
  }, [location.pathname]);

  const handleMenuChange = (item) => navigate(item.link);

  return (
    <div style={{ display: "flex", flexDirection: "row", width: "100%", paddingLeft: 68 }}>
      {/* Sidebar renders ONCE here and never unmounts during navigation between child routes */}
      <Sidebar activeTab={activeTab} onMenuChange={handleMenuChange} />

      <div style={{ flex: 1, minWidth: 0 }} className="bg-gray-50">
        {/* Outlet is the "hole" where React Router injects the matched child page.
            Only THIS part swaps on navigation — sidebar stays mounted. */}
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}

export default AppLayout;
import { useState, lazy, Suspense, useReducer, useCallback } from "react";
import Sidebar from "../sidebar/Sidebar";
import Header from "../../pages/findTrials/findTrialHeader/Header";
import FilterAll from "../../pages/findTrials/allFilters/FilterAll";
import Header2 from "../../pages/trialsHeader/trialsSubHeader/Header2";

function TrialsLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [filters, setFilters] = useState({});
  const [counts, setCounts] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = (newFilters, count) => {
    setFilters(newFilters);
    setCounts(count);
  };

  return (
    <div>
      <div className="flex overflow-hidden">
        {/* <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} /> */}
        <Header collapsed={collapsed} onFilterChange={handleFilterChange} />
      </div>

      <FilterAll
        isFilterOpen={isFilterOpen}
        onFilterClose={() => setIsFilterOpen(false)}
        onFilterChange={handleFilterChange}
      />

      {/* <Header2
        collapsed={collapsed}
        filters={filters}
        counts={counts}
        onFilterChange={handleFilterChange}
      /> */}
    </div>
  );
}

export default TrialsLayout;

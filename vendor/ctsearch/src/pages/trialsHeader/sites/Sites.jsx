import { useState } from "react";
import CommonTabs from "../../../common/Tabs";
import LeadResearcher from "./LeadResearcher";
import Institution from "./Institution";
import { sitesHeaderTabs } from "../../../utils/helpers/helper";

const Sites = () => {
  const [activeSitesTab, setActiveSitesTab] = useState("Lead Researcher");

  const renderActiveTab = () => {
    switch (activeSitesTab) {
      case "Institution":
        return <Institution />;
      default:
        return <LeadResearcher />;
    }
  };

  return (
    <div
      style={{ width: "85%", scrollbarWidth: "none" }}
      className="h-screen overflow-y-auto relative pb-40 z-30 font-sans bg-mainBlue text-left"
    >
      {/* tab header */}
      <div className="flex justify-left border-b border-gray-200">
        <div className="">
          <div className="bg-gray-50 z-0 px-2 rounded-t-sm"></div>
          <div>
            <div className="flex flex-col ">
              <div className="flex items-center justify-between px-4 flex-wrap gap-4">
                <div className="flex-1 ">
                  <CommonTabs
                    tabs={sitesHeaderTabs}
                    onChange={setActiveSitesTab}
                    defaultValue="Lead Researcher"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderActiveTab()}
    </div>
  );
};

export default Sites;

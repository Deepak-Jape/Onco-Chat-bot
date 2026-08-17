import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import CommonTabs from "../../common/Tabs";
import { FavoritesHeaderTab } from "../../utils/helpers/helper";


import { fetchTrials } from "../../redux/actions/searchAction";
import CardList from "../trialsHeader/trials/Cards";
import InstitutionFavorites from "./InstitutionFavorites";
import FavoriteResearcher from "./FavoritesResearcher";
import SavedSearches from "./SavedSearches";
import SponsorsSaved from "./SponsorsSaved";
import FavoriteCardList from "./FavoritesTrial";

export default function FavoritesHeader({ favoritesData, loading }) {
  const [activeTab, setActiveTab] = useState("Trials");
  const [favoriteTrials, setFavoriteTrials] = useState([]);

  const dispatch = useDispatch();

  // ⭐ THIS IS THE IMPORTANT PART ⭐
useEffect(() => {
  if (activeTab === "Trials") {
    dispatch(fetchTrials({}, 10, 1, null)).then((res) => {
      setFavoriteTrials(res?.results || []);
    });
  }
}, [activeTab]);

  return (
    <div >
      <div className="relative bg-mainBlue font-sans">

        <div className="flex items-center justify-between px-0 py-0">
          <CommonTabs
            tabs={FavoritesHeaderTab}
            value={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            defaultValue="Trials"
          />
        </div>

        {/* ----- TRIALS TAB ----- */}
        {activeTab === "Trials" && (
          <FavoriteCardList
            isFavorites={true}
            favoritesList={favoriteTrials}
            clearTrigger={false}
            counts={null}
          />
        )}

        {activeTab === "Sponsors" && <SponsorsSaved/>}
        {activeTab === "Institutions" && <InstitutionFavorites/>}
        {activeTab === "Researchers" && <FavoriteResearcher/>}
        {activeTab === "Saved Searches" && <SavedSearches/>}
      </div>
    </div>
  );
}

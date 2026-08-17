import { useEffect, useState } from "react";
import CountryFlag from "../../../common/GetFlags";
import CustomScrollbar from "../../../common/CustomScrollbar";

const toTitleCase = (str) => {
  if (!str) return str;
  return str
    .trim()
    .toLowerCase()
    .replace(/(^|[\s'-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
};

export default function TrialSiteLocations({ data }) {
  const countryList = data?.map((item, index) => ({
    id: index + 1,
    country: item?.country?.value,
    sites: item?.sites?.value,
    facility:
      item?.facility?.value?.map((f) => ({
        name: f?.name,
        city: f?.city,
        state: f?.state,
      })) || [],
  }));
  const [selectedCountry, setSelectedCountry] = useState(countryList?.[0]);
  const facilities = selectedCountry?.facility ?? [];
  const maxSitesCardHeightPx = 289;
  const shouldScrollSites = facilities.length > 4;
  useEffect(() => {
    setSelectedCountry(countryList?.[0]);
  }
    , [data]);
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* LEFT COLUMN: Countries */}
      <div
        className="space-y-2"
        style={{
          height:  `${maxSitesCardHeightPx}px`,
          overflow:  "auto" ,
        }}
      >
        {countryList?.map((item) => {
          const selected = selectedCountry?.id === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedCountry(item)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border
                ${selected
                  ? "bg-blue-100 border-blue-400"
                  : "bg-gray-50 border-transparent"
                }
              `}
            >
              <CountryFlag width={45} height={30} country={item?.country} />
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "400",
                    lineHeight: "14px",
                    fontFamily: "Rubik",
                    letterSpacing: "0%",
                    color: "rgba(0,0,0,0.8)",
                  }}
                >
                  {item.country?.replace(/\(.*?\)/g, "").trim()}
                </p>
                <p
                  style={{
                    marginTop: "2px",
                    fontSize: "14px",
                    fontWeight: "400",
                    lineHeight: "14px",
                    fontFamily: "Rubik",
                    letterSpacing: "0%",
                    color: "rgba(0,0,0,0.6)",
                  }}
                >
                  {item.sites} sites
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT COLUMN: Sites */}
      <div
        style={{
          border: "1px solid rgba(240, 240, 243, 1)",
          height: shouldScrollSites ? `${maxSitesCardHeightPx}px` : "auto",
        }}
        className="col-span-2 bg-white rounded-lg shadow-sm"
      >
        {shouldScrollSites ? (
          <CustomScrollbar
            height="100%"
            trackTop={8}
            trackBottom={8}
            trackRight={2}
          >
            <div>
              {facilities.map((site, index) => (
                <div key={index}>
                  <div className="py-3 px-4">
                    <p
                      style={{
                        fontSize: "15px",
                        lineHeight: "14px",
                        fontWeight: "500",
                        fontFamily: "Rubik",
                        letterSpacing: "0%",
                        color: "rgba(0,0,0,0.8)",
                      }}
                    >
                      {site.name || "-"}
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        lineHeight: "100%",
                        fontWeight: "400",
                        fontFamily: "Rubik",
                        letterSpacing: "0%",
                        color: "rgba(0,0,0,0.6)",
                      }}
                      className="mt-2"
                    >
                      {site.city ? toTitleCase(site.city) : "-"}
                      {site.state ? ` - ${toTitleCase(site.state)}` : ""}
                    </p>
                  </div>
                  {index !== facilities.length - 1 && (
                    <div className="border-b border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          </CustomScrollbar>
        ) : (
          <div>
            {facilities.map((site, index) => (
              <div key={index}>
                <div className="py-3 px-4">
                  <p
                    style={{
                      fontSize: "15px",
                      lineHeight: "14px",
                      fontWeight: "500",
                      fontFamily: "Rubik",
                      letterSpacing: "0%",
                      color: "rgba(0,0,0,0.8)",
                    }}
                  >
                    {site.name }
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: "100%",
                      fontWeight: "400",
                      fontFamily: "Rubik",
                      letterSpacing: "0%",
                      color: "rgba(0,0,0,0.6)",
                    }}
                    className="mt-2"
                  >
                    {site.city ? toTitleCase(site.city) : "-"}
                    {site.state ? ` - ${toTitleCase(site.state)}` : ""}
                  </p>
                </div>
                {index !== facilities.length - 1 && (
                  <div className="border-b border-gray-200" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

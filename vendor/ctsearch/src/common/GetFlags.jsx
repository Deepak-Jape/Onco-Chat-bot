import React from "react";
// import * as Flags from "country-flag-icons/react/3x2";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register locale once
countries.registerLocale(enLocale);

// const CountryFlag = ({ country, width = 24, height = 18, style = {} }) => {
//   if (!country) return null;

//   const code = countries.getAlpha2Code(country, "en"); 
//   const Flag = Flags[code];

//   return Flag ? <Flag style={{ width, height, ...style }} /> : null;
// };

const CountryFlag = ({
  country,
  width = 24,
  height = 18,
  style = {},
}) => {
  if (!country) return null;

  // Remove "( CHN )" part
  const cleanCountry = country.replace(/\(.*?\)/g, "").trim();

  const code = countries
    .getAlpha2Code(cleanCountry, "en")
    ?.toLowerCase();

  return code ? (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={cleanCountry}
      style={{ width, height, objectFit: "cover", ...style }}
    />
  ) : null;
};

export default CountryFlag;

/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useCallback, useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Link,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Logo from "../assets/Logo.png";
import CommonAutocomplete from "./CommonAutocomplete";
import DropdownwithChecklist from "./Dropdownwithchecklist";
import DatePickerBlock from "./FilterDatePicker";
import { DrawerFilterStyles } from "./filteroptions/DrawerFilterStyles";
import DropdownRadioButton from "./DropdownRadioButton";
import RadioButtonWithRange from "./RadioButtonWithRange";

import { useDispatch } from "react-redux";
import { fetchCards } from "../redux/trialsDataSlice";
import { FILTER_SECTIONS } from "../utils/helpers/helper";

const DrawerFilter = ({ onFilterChange, filters = {} }) => {
  const classes = DrawerFilterStyles();
  const [searchValue, setSearchValue] = useState([]);
  // const { data, loading, error, sessionKey } = useSelector(
  //   (state) => state.cards,
  // );

  // useEffect(() => {
  //   setFilters(data?.payload);
  // }, []);

  // Sync searchValue with filters when filters change from outside (like chip removal)
  useEffect(() => {
    const searchOptions = [];
    Object.entries(filters).forEach(([fieldKey, items]) => {
      if (Array.isArray(items)) {
        items.forEach((title) => {
          searchOptions.push({ title, group: fieldKey });
        });
      }
    });
    setSearchValue(searchOptions);
  }, [filters]);

  const dispatch = useDispatch();

  const handleFilterUpdate = useCallback(
    (section, filterKey, value) => {
      const newFilters = { ...filters };

      // Handle daterange fields with multiple keys
      const filterConfig = FILTER_SECTIONS.flatMap((s) => s.filters).find(
        (f) => f.key === filterKey,
      );
      if (filterConfig?.type === "daterange" && filterConfig.keys) {
        // Preserve existing values and only update the changed ones
        filterConfig.keys.forEach((key) => {
          if (key in value) {
            newFilters[key] = value[key];
          } else if (!(key in newFilters)) {
            newFilters[key] = filters[key] || null;
          }
        });
      } else {
        newFilters[filterKey] = value;
      }

      const currentMainSearchValues = searchValue.filter(
        (item) => item.group !== filterKey,
      );
      const newMainSearchItems = Array.isArray(value)
        ? value.map((title) => ({ title, group: filterKey }))
        : value
          ? [{ title: value, group: filterKey }]
          : [];

      const updatedSearchValue = [
        ...currentMainSearchValues,
        ...newMainSearchItems,
      ];
      setSearchValue(updatedSearchValue);

      const groupedFilters = { ...filters };
      if (filterConfig?.type === "daterange" && filterConfig.keys) {
        filterConfig.keys.forEach((key) => {
          if (key in value) {
            groupedFilters[key] = value[key];
          } else {
            groupedFilters[key] = filters[key] || null;
          }
        });
      } else {
        groupedFilters[filterKey] = value;
      }
      dispatch(
        fetchCards({
          groupedFilters,
          flag: filterKey,
          // session_key: sessionKey,
        }),
      ).then((res) => {
        // setFilters(...filters, res.payload.payload);
        // setStoreSessionKey(res.payload.session_key);
      });

      onFilterChange?.(newFilters, {});
    },
    [filters, onFilterChange, searchValue, dispatch],
  );

  const handleSearchChange = useCallback(
    (newValue) => {
      setSearchValue(newValue);

      const filtersWithoutSearch = { ...filters };
      // Get all possible search field keys from current filters and new values
      const searchKeys = new Set([
        ...Object.keys(filters).filter(() =>
          Object.values(filters).some((val) => Array.isArray(val)),
        ),
        ...newValue.map((option) => option.group),
      ]);

      // Clear existing search-related filters
      searchKeys.forEach((key) => delete filtersWithoutSearch[key]);

      // Convert search selections to direct field format
      const searchFilters = newValue.reduce((acc, option) => {
        if (!acc[option.group]) acc[option.group] = [];
        acc[option.group].push(option.title);
        return acc;
      }, {});

      const combinedFilters = { ...filtersWithoutSearch, ...searchFilters };
      onFilterChange?.(combinedFilters, { searchTerms: newValue });
    },
    [filters, onFilterChange],
  );
  const getFilterValue = useCallback(
    (section, filterKey, defaultValue = []) => {
      const filterConfig = FILTER_SECTIONS.flatMap((s) => s.filters).find(
        (f) => f.key === filterKey,
      );
      if (filterConfig?.type === "daterange" && filterConfig.keys) {
        // For daterange, return an object with both min and max values
        const dateRangeValue = {};
        filterConfig.keys.forEach((key) => {
          dateRangeValue[key] = filters[key] || null;
        });
        return dateRangeValue;
      }
      return filters[filterKey] ?? defaultValue;
    },
    [filters],
  );

  const renderFilter = useCallback(
    (filter, sectionTitle) => {
      const {
        type,
        placeholder,
        label,
        key,
        defaultValue = [],
        options = [],
      } = filter;
      const value = getFilterValue(sectionTitle, key, defaultValue);
      const onChange = (val) => handleFilterUpdate(sectionTitle, key, val);

      // Get values from main search that match this filter's fieldType
      const mainSearchValues = searchValue
        .filter((item) => item.group === key)
        .map((item) => item.title);

      // Combine filter values with main search values
      const combinedValue =
        type === "autocomplete"
          ? [...new Set([...value, ...mainSearchValues])]
          : value;

      switch (type) {
        case "autocomplete":
          return (
            <CommonAutocomplete
              placeholder={placeholder}
              value={combinedValue}
              onChange={onChange}
              filters={filters}
              fieldType={key}
              isGrouped={false}
            />
          );
        case "checklist":
          return (
            <DropdownwithChecklist
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              options={options}
              filters={filters}
              sectionType={sectionTitle}
              fieldType={key}
              isGrouped={false}
            />
          );
        case "daterange":
          return (
            <DatePickerBlock
              label={label}
              value={value}
              onChange={onChange}
              keys={filter.keys}
            />
          );
        case "radiobutton":
          return (
            <DropdownRadioButton
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              filter={filters}
              sectionType={sectionTitle}
              fieldType={key}
            />
          );
        case "radiorange":
          return (
            <RadioButtonWithRange
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              filter={filters}
              sectionType={sectionTitle}
              fieldType={key}
            />
          );
        default:
          return null;
      }
    },
    [getFilterValue, handleFilterUpdate, searchValue],
  );

  const accordions = useMemo(
    () =>
      FILTER_SECTIONS.map((section) => (
        <Accordion key={section.title} className={classes.accordionContainer}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.sectionTitle}>
              {section.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.accordion_detail}>
            {section.filters.map((filter) => (
              <div key={filter.key}>{renderFilter(filter, section.title)}</div>
            ))}
          </AccordionDetails>
        </Accordion>
      )),
    [classes, renderFilter],
  );

  return (
    <div className={classes.drawerContainer}>
      <div className={classes.logo}>
        <Link to="/">
          <img src={Logo} alt="Logo" />
        </Link>
      </div>
      <div className={classes.filterAutoComplete}>
        <CommonAutocomplete
          placeholder="Search"
          value={searchValue}
          onChange={handleSearchChange}
          filters={filters}
          isGrouped={true}
        />
      </div>
      <div className={classes.according_container}>{accordions}</div>
    </div>
  );
};

export default DrawerFilter;

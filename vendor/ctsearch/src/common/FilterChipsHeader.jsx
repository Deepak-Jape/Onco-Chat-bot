import React, { useMemo, useCallback } from "react";
import { Box, Chip, Button, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Normalize filter values into human-readable labels
 */
const getLabel = (value) => {
  if (typeof value === "object" && value !== null) {
    return (
      value.title ||
      value.label ||
      value.name ||
      value.value ||
      JSON.stringify(value)
    );
  }
  return String(value);
};

const FilterChipsHeader = ({ filters = {}, onRemoveFilter, onResetAll }) => {
  const chips = useMemo(() => {
    const list = [];

    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      if (!filterValue || (Array.isArray(filterValue) && !filterValue.length))
        return;

      const excludedKeys = [
        "start_date_min",
        "start_date_max",
        "completion_date_min",
        "completion_date_max",
        "study_first_post_date_min",
        "study_first_post_date_max",
        "result_first_posted",
        "age",
        "sex",
        "estimatedEnrollment",
        "resultPosted",
        "sites",
      ];

      // if (excludedKeys.some((key) => filterKey.includes(key))) return;

      // Multi-select filters
      if (Array.isArray(filterValue)) {
        filterValue.forEach((value, index) => {
          list.push({
            id: `${filterKey}-${value?.id ?? value}-${index}`,
            filterKey,
            value,
            index,
            label: getLabel(value),
          });
        });
        return;
      }

      // Single value filters
      list.push({
        id: `${filterKey}`,
        filterKey,
        value: filterValue,
        label: getLabel(filterValue),
      });
    });

    return list;
  }, [filters]);

  const handleDelete = useCallback(
    (chip) => {
      onRemoveFilter?.(chip.filterKey, chip.value, chip.index);
    },
    [onRemoveFilter],
  );

  /**
   * Render chips header
   */
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        alignItems: "center",
        overflowY: "scroll",
        maxHeight: "89px",
        scrollbarWidth: "thin",
      }}
    >
      {chips?.map((chip) => (
        <Chip
          key={chip.id}
          label={chip.label}
          size="small"
          variant="outlined"
          onDelete={() => handleDelete(chip)}
          deleteIcon={<CloseIcon />}
          sx={{
            fontSize: 12,
            gap: "3px",
            flexShrink: 0,
            height: "27px !important",
            borderRadius: "20px",
            border: "1px solid #E0E1E6 !important",
            color: "#00000099",
            fontWeight: 450,
            fontFamily: "Rubik",
            // "&:hover": {
            //   backgroundColor: "rgba(232, 232, 236, 1)",
            //   borderColor: "rgba(232, 232, 236, 1) !important",
            // },
            "& .MuiChip-deleteIcon": {
              color: "#00000099",
              fontSize: "14px",
              borderRadius: "50%",
            },
          }}
        />
      ))}

      {chips?.length > 0 && (
        <Button
          size="small"
          color="error"
          onClick={onResetAll}
          sx={{
            textTransform: "none",
            padding: "8px",
            fontSize: 12,
            flexShrink: 0,
            height: "27px !important",
            borderRadius: "6px",
            backgroundColor: " #FEF3F3 !important",
            fontWeight: 600,
            fontFamily: "Rubik",
            border: "2px solid #FDE2E2 !important",
            color: "#C14646",
          }}
        >
          Reset
        </Button>
      )}
    </Box>
  );
};

export default FilterChipsHeader;

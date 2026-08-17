import * as React from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";

export default function CommonTabs({
  tabs = [],
  defaultValue,
  disabledTabs = [],
  onChange,
  page,
}) {
  const [value, setValue] = React.useState(defaultValue || tabs[0]);
  const USER_ROLE = localStorage.getItem("userRole") || "";
  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (onChange) onChange(newValue);
  };
  React.useEffect(() => {
    setValue(defaultValue)

  }, [defaultValue])

  return (
    <Box sx={{ width: "100%", typography: "body1" }}>
      <TabContext value={value}>
        <Box
          sx={{
            height: "39px",
            display: "flex",
            alignItems: "center",
            backgroundColor: "transparent",
            backgroundImage:
              "linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), linear-gradient(#f3f4f6, #f3f4f6)",
            backgroundRepeat: "no-repeat, no-repeat",
            backgroundSize: "100% 1px, 100% calc(100% - 1px)",
            backgroundPosition: "left bottom, left top",
            borderRadius: "6px 6px 0 0",
            paddingRight: "6px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
            }}
          >
            <TabList
              onChange={handleChange}
              aria-label="common tabs"
              textColor="primary"
              indicatorColor="primary"
              TabIndicatorProps={{
                style: {
                  display: "none",
                },
              }}
              sx={{
                minHeight: "39px",
                height: "39px",
                "& .MuiTabs-flexContainer": {
                  height: "39px",
                },
              }}
            >
              {tabs?.map((label) => (
                <Tab
                  key={label}
                  label={label}
                  value={label}
                  disabled={disabledTabs.includes(label)}
                  sx={{
                    textTransform: "capitalize",
                    minHeight: "39px",
                    height: "39px",
                    fontFamily: "Rubik",
                    borderTopLeftRadius: "6px",
                    borderTopRightRadius: "6px",
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    color: "#374151",
                    fontWeight: "500",
                    position: "relative",

                    // Active/Selected state
                    "&.Mui-selected": {
                      backgroundColor: "transparent",
                      backgroundImage:
                        "linear-gradient(#1976d2, #1976d2), linear-gradient(rgba(220, 233, 252, 1), rgba(220, 233, 252, 1))",
                      backgroundRepeat: "no-repeat, no-repeat",
                      backgroundSize: "100% 1px, 100% calc(100% - 1px)",
                      backgroundPosition: "left bottom, left top",
                      color: "rgba(38, 102, 190, 1)",
                      zIndex: 8,
                    },

                    // Conditional Hover
                    "&:hover": !["Study Details"].includes(label)
                      ? {
                        backgroundColor: "rgba(220, 233, 252, 1)",
                        color: "rgba(0, 0, 0, 0.7)",
                      }
                      : {},

                    // Corrected Profile Page logic using spread operator
                    ...(page === "Profile page"
                      ? {
                        display:
                          USER_ROLE === "Super Admin" ||
                            USER_ROLE === "OncoSuits Admin" ||
                            label === "Account"
                            ? "block"
                            : "none",
                      }
                      : {}),
                  }}
                ></Tab>
              ))}
            </TabList>
          </Box>
        </Box>
      </TabContext>
    </Box>
  );
}

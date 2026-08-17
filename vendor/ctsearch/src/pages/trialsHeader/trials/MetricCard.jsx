import { Grid, Box, Typography } from "@mui/material";
import { helpIcon, TrendingDown, TrendingUp } from "../../../assets";

const metricsConfig = [
  {
    key: "recruitment_rate",
    title: "Recruitment Rate",
    unit: "Patients/Month",
    format: (v) => {
      v?.toFixed(0) ?? 0;
    },
    color: "rgba(241, 128, 16, 1)",
  },
  {
    key: "dropout_rate",
    title: "Dropout Rate",
    unit: "of Patients Discontinue",
    format: (v) => `${v?.toFixed(0) ?? 0}%`,
    color: "rgba(47, 128, 237, 1)",
  },
  {
    key: "accrual",
    title: "Accrual",
    unit: "Actual vs Planned",
    format: (v) => `${v?.toFixed(0) ?? 0}%`,
    color: "rgba(39, 174, 96, 1)",
  },
  {
    key: "ttpe",
    title: "TTPE",
    unit: "to Primary Endpoint",
    format: (v) => `${v?.toFixed(0) ?? 0} Days`,
    color: "rgba(131, 216, 28, 1)",
  },
];

export default function MetricsCards({ data }) {
  return (
    <Grid
      container
      sx={{ display: "flex", justifyContent: "space-between" }}
      spacing={1}
    >
      {metricsConfig.map((metric) => {
        const [value, benchmark] = data[metric?.key] || [0, 0];
        return (
          <Grid item xs={12} sm={6} md={3} key={metric.key}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #E5E7EB",
                boxShadow: "0 0 10px rgba(153,169,190,0.15)",
                height: "150px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Typography
                display="flex"
                gap="5px"
                color="rgba(0, 0, 0, 0.7)"
                fontWeight={500}
                fontSize={14}
                fontFamily="Rubik"
              >
                {metric.title} <img src={helpIcon} width={16} height={16} />
              </Typography>

              <Typography
                fontWeight={500}
                fontSize={30}
                fontFamily="Rubik"
                sx={{ color: metric.color }}
              >
                {metric.format(value)}
              </Typography>

              <Typography
                fontFamily="Rubik"
                fontWeight={400}
                fontSize={13}
                color="rgba(0, 0, 0, 0.7)"
              >
                {metric.unit}
              </Typography>

              <Box
                sx={{
                  mt: 1,
                  px: 1.2,
                  py: 0.6,
                  fontSize: 12,
                  borderRadius: 20,
                  fontFamily: "Rubik",
                  background:
                    benchmark > 0
                      ? "rgba(253, 226, 226, 1)"
                      : "rgba(218, 241, 228, 1)",
                  color:
                    benchmark > 0
                      ? "rgba(241, 87, 87, 1)"
                      : "rgba(39, 174, 96, 1)",
                  width: "fit-content",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                {benchmark > 0 ? (
                  <img src={TrendingDown} alt="down" width={14} height={14} />
                ) : (
                  <img src={TrendingUp} alt="up" width={14} height={14} />
                )}

                {`${benchmark ?? 0}% vs benchmark`}
              </Box>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}

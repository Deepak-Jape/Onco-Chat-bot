import { Box, Paper, Stack, Typography } from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

const testimonials = [
  {
    text: "OncoSuite instantly benchmarked our draft protocol against 142 similar studies. It surfaced three patient and comparator risks we would have otherwise missed. Avoiding just one amendment saved us more than the full annual license.",

    name: "Dr. Sarah Chen",

    role: "VP, Clinical Development,\nTop-20 Pharma",
  },
  {
    text: "We cut feasibility cycle time by 40% and identified high-performing sites we had never engaged before. Enrollment accelerated by two months — that directly advanced our development timeline.",
    name: "Dr. Michael Torres",
    role: "Senior Director, Global Clinical\nOperations, Oncology Biotech",
  },
  {
    text: "OncoSuite revealed strategic gaps in our MoA landscape and highlighted competitor design shifts months before they appeared in publications. It completely changed how we run portfolio reviews.",
    name: "Dr. James Wilson",
    role: "Head of Oncology Portfolio Strategy,\nMid-Size Pharma",
  },
];

const Stars = ({ count = 5 }) => (
  <Box sx={{ display: "flex", gap: 0.5 }} aria-label={`${count} star rating`}>
    {Array.from({ length: count }).map((_, idx) => (
      <StarRoundedIcon key={idx} sx={{ fontSize: 20, color: "#F5B301" }} />
    ))}
  </Box>
);

const CustomerTrustSection = () => {
  return (
    <Box
      sx={{
        padding: "56px clamp(16px, 5vw, 70px) 64px",
        background: "rgba(249, 249, 251, 1)",
        // Full-bleed background even if parent has side padding/max-width
        // Keep content layout unchanged.
        position: "relative",
        boxShadow: "0 0 0 100vmax rgba(249, 249, 251, 1)",
        clipPath: "inset(0 -100vmax)",
        "@media (max-width: 900px)": {
          padding: "44px 18px 52px",
        },
      }}
    >
      <Stack spacing={2} textAlign="center" sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography
          variant="h3"
          fontSize={{ xs: 26, sm: 36, md: 42 }}
          color="rgba(0, 0, 0, 0.8)"
          fontFamily="Rubik"
          fontWeight={600}
          textAlign="center"
          lineHeight="120%"
        >
          Trusted by the Teams Defining the{" "}
          <br className="landing-desktop-only-br" />
          Next Standard of Care.
        </Typography>

        <Typography
          variant="body1"
          fontSize={{ xs: 16, sm: 18 }}
          color="rgba(0,0,0,0.6)"
          textAlign="center"
          fontFamily="Rubik"
          fontWeight={400}
          lineHeight="24px"
        >
        See how leading top-20 pharma executives, innovative biotechs, and scaling CROs use OncoSuite to{" "}
          <br className="landing-desktop-only-br" />
optimize protocol designs, compress trial timelines, and protect multi-million dollar clinical investments.
        </Typography>
      </Stack>

      <Box
        sx={{
          width: "100%",
          maxWidth: "var(--onco-container-7xl, 80rem)",
          marginLeft: "auto",
          marginRight: "auto",
          overflowX: "auto",
          overflowY: "hidden",
          pb: 2,
          scrollSnapType: "x mandatory",
          scrollPaddingInline: { xs: "0px", md: "0px" },
          WebkitOverflowScrolling: "touch",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "@media (min-width: 1400px)": {
            overflowX: "visible",
            scrollSnapType: "none",
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, md: 2 },
            gridAutoFlow: "column",
            gridAutoColumns: {
              xs: "84%",
              sm: "320px",
              md: "364px",
            },
            justifyContent: "flex-start",
            alignItems: "stretch",
            width: "100%",
            "@media (min-width: 1400px)": {
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gridAutoFlow: "row",
              gridAutoColumns: "unset",
              justifyContent: "center",
              alignItems: "stretch",
            },
          }}
        >
          {testimonials.map((item, i) => (
            <Paper
              key={i}
              sx={{
                width: { xs: "100%", md: "100%" },
                minWidth: { xs: "100%", md: "unset" },
                maxWidth: { xs: "100%", md: "unset" },
                height: "100%",
                minHeight: 340,
                borderRadius: 1,
                border: "1px solid rgba(0, 0, 0, 0.05)",
                boxShadow: "4px 4px 20px rgba(130, 143, 169, 0.15)",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                scrollSnapAlign: { xs: "start", md: "none" },
                backgroundColor: "#fff",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  p: 2.5,
                  gap: 1.5,
                  flexGrow: 1,
                }}
              >
                <Stars />

                <Typography
                  fontSize={{ xs: 16, md: 18 }}
                  fontFamily="Rubik"
                  fontWeight={400}
                  textAlign="left"
                  sx={{
                    color: "rgba(0,0,0,0.8)",
                    lineHeight: { xs: "26px", md: "28px" },
                    flex: 1,
                    minHeight: 0,
                  }}
                >
                  {item.text.replaceAll("â€”", "—")}
                </Typography>

                <Box
                  sx={{
                    mt: "auto",
                    pt: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    minHeight: 112,
                  }}
                >
                  <Typography
                    fontSize={20}
                    fontFamily="Rubik"
                    fontWeight={600}
                    color="rgba(0, 0, 0, 0.85)"
                    lineHeight="130%"
                    textAlign="left"
                    sx={{ margin: 0 }}
                  >
                    {item.name}
                  </Typography>

                  <Typography
                    fontSize={16}
                    fontFamily="Rubik"
                    fontWeight={400}
                    color="rgba(0, 0, 0, 0.55)"
                    lineHeight="20px"
                    sx={{
                      whiteSpace: "pre-line",
                      minHeight: 40,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      mt: 0.75,
                    }}
                    textAlign="left"
                  >
                    {item.role}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default CustomerTrustSection;

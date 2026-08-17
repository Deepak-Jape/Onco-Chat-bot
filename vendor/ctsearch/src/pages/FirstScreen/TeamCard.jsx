import { Box, Grid, Typography } from "@mui/material";
import { Pointer } from "../../assets";

const Bullet = ({ text }) => (
  <Box component="li" sx={{ listStyle: "none", display: "flex", mb: 1 }}>
    <img
      src={Pointer}
      alt=""
      width={18}
      height={18}
      loading="lazy"
      decoding="async"
      style={{ marginRight: 8, marginTop: 4 }}
    />
    <Typography
      fontSize={16}
      fontFamily="Rubik"
      fontWeight={500}
      color="rgba(0,0,0,0.7)"
    >
      {text}
    </Typography>
  </Box>
);

const TeamCard = ({
  image,
  isActive,
  title,
  subtitle,
  bullets,
  result,
  moduleText,
}) => {
  return (
    <Grid
      container
      sx={{
        background: "rgba(255, 255, 255, 1)",
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0px 4px 20px rgba(83,96,115,0.1)",
        padding: "2%",
        borderRadius: "8px",
        width: "100%",
      }}
    >
      <Grid size={{ xs: 12, md: 6 }}>
        <Box
          sx={{
            height: "308px",
            borderRadius: "9px",
            overflow: "hidden",
          }}
        >
          <img
            src={image}
            alt={`${title} illustration`}
            width={640}
            height={308}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "9px",
              opacity: isActive ? 1 : 0.5,
            }}
          />
        </Box>
      </Grid>

      {/* RIGHT CONTENT */}
      <Grid size={{ xs: 12, md: 6 }} padding={"0 2%"}>
        <Box sx={{ opacity: isActive ? 1 : 0.5 }}>
          <Typography
            fontSize={20}
            fontWeight={500}
            fontFamily="Rubik"
            lineHeight="130%"
            textAlign="left"
            marginTop={2}
            // Aded this line
          >
            {title}
          </Typography>

          <Typography
            fontSize={16}
            fontWeight={400}
            color="rgba(0,0,0,0.6)"
            lineHeight="32px"
            textAlign="left"
          >
            {subtitle}
          </Typography>

          <Box
            component="ul"
            sx={{
              my: 3,
              fontFamily: "Rubik",
              fontWeight: "500",
              fontSize: "16px",
              lineHeight: "24px",
              textAlign: "left",
            }}
          >
            {bullets.map((b, i) => (
              <Bullet key={i} text={b} />
            ))}
          </Box>

          <Typography
            fontSize={16}
            color="rgba(0,0,0,0.6)"
            fontFamily="Rubik"
            fontWeight={500}
            lineHeight="22px"
            textAlign="left"
          >
            <strong>Result:</strong>
            <Box component="span" fontWeight={400}>
              {" "}
              {result}
            </Box>
          </Typography>

          <Typography
            fontSize="16px"
            lineHeight="32px"
            fontFamily="Rubik"
            fontWeight={500}
            color="rgba(193,102,13,1)"
            textAlign="left"
          >
            <Box component="span" fontWeight={500}>
              Recommended Module:
            </Box>
            <Box component="span" fontWeight={400}>
              {" "}
              {moduleText}
            </Box>
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default TeamCard;

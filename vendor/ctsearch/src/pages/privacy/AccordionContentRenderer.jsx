import { Box, Typography } from "@mui/material";
import bulletIcon from "../../assets/pointer.svg";

// ----- Bullet Icon (same as your original) -----
const BulletIcon = () => (
  <Box
    component="img"
    src={bulletIcon}
    alt="bullet-icon"
    sx={{
      width: "18px",
      height: "18px",
      objectFit: "contain",
      mt: "5px",
    }}
  />
);

const textStyle = {
  fontFamily: "Rubik",
  fontSize: { xs: "16px", sm: "16px", md: "18px" },
  fontWeight: 400,
  color: "rgba(0,0,0,0.6)",
  lineHeight: { xs: "24px", sm: "24px", md: "28px" },
  textAlign: "left",
};

const subTitleStyle = {
  fontFamily: "Rubik",
  fontSize: { xs: "18px", sm: "18px", md: "20px" },
  fontWeight: 600,
  color: "rgba(0,0,0,0.8)",
  lineHeight: "130%",
  mb: 1.5,
  textAlign: "left",
};

// ----- Dynamic Accordion Renderer -----
export default function AccordionContentRenderer({ section }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Intro paragraph */}
      {section.intro && (
        <Typography
          sx={{ ...textStyle, mb: 0 }}
          dangerouslySetInnerHTML={{ __html: section.intro }}
        />
      )}

      {/* Regular paragraphs */}
      {section.paragraphs &&
        section.paragraphs.map((p, i) => (
          <Typography
            key={i}
            sx={{ ...textStyle }}
            dangerouslySetInnerHTML={{ __html: p }}
          />
        ))}

      {/* Standard bullets */}
      {section.bullets &&
        section.bullets.map((item, i) => (
          <Box
            key={i}
            sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
          >
            <BulletIcon />

            {typeof item === "string" ? (
              <Typography sx={textStyle}>{item}</Typography>
            ) : (
              <Typography sx={textStyle}>
                <Box
                  component="span"
                  sx={{
                    fontWeight: 600,
                    color: "rgba(0,0,0,0.8)",
                    fontSize: "18px",
                  }}
                >
                  {item.bold + " "}
                </Box>
                {item.normal}
              </Typography>
            )}
          </Box>
        ))}

      {/* Subsections with bullets */}
      {section.subSections &&
        section.subSections.map((sub, si) => (
          <Box key={si} sx={{ mt: 1 }}>
            <Typography sx={subTitleStyle}>{sub.subTitle}</Typography>

            {sub.bullets.map((b, bi) => (
              <Box
                key={bi}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  mt: 1,
                }}
              >
                <BulletIcon />
                <Typography sx={textStyle}>{b}</Typography>
              </Box>
            ))}
          </Box>
        ))}

      {/* Final Note */}
      {section.finalNote && (
        <Box
          sx={{
            fontFamily: "Rubik",
            fontSize: { xs: "16px", sm: "16px", md: "18px" },
            fontWeight: 400,
            color: "rgba(0,0,0,0.6)",
            lineHeight: { xs: "24px", sm: "24px", md: "28px" },
            textAlign: "left",
            mt: 2,

            "& a": {
              color: "rgba(38,102,190,1)",
              textDecoration: "underline",
            },
          }}
          dangerouslySetInnerHTML={{ __html: section.finalNote }}
        />
      )}

      {/* Contact details */}
      {section.contact && (
        <Box sx={{ mt: 1 }}>
          <Typography
            sx={{
              fontFamily: "Rubik",
              fontSize: { xs: "18px", sm: "18px", md: "20px" },
              fontWeight: 600,
              color: "rgba(0,0,0,0.8)",
              lineHeight: "130%",
              mb: 1,
              textAlign: "left",
            }}
          >
            {section.contact.office}
          </Typography>

          <Typography sx={textStyle}>
            Email:{" "}
            <Box
              component="a"
              href={`mailto:${section.contact.email}`}
              sx={{
                color: "rgba(0, 0, 0, 0.6)",
                textDecoration: "none !important",
                fontFamily: "Rubik",
                fontSize: { xs: "16px", sm: "16px", md: "18px" },
                fontWeight: 400,
                lineHeight: { xs: "24px", sm: "24px", md: "28px" },

                "&:hover": {
                  textDecoration: "none !important",
                },
                "&:focus": {
                  textDecoration: "none !important",
                },
                "&:visited": {
                  textDecoration: "none !important",
                },
              }}
            >
              {section.contact.email}
            </Box>
          </Typography>
        </Box>
      )}
    </Box>
  );
}

import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Link, Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function SourceEvidenceCard({ data }) {
  if (!data) return null;
  // Check if title is a "negative" or "empty" result
  const isNotAvailable = data.title === "Not Available" || data.title === "NA";

  const getProgressColor = (value) => {
    if (value >= 80) return '#4ade80'; // Green
    if (value >= 50) return '#fbbf24'; // Amber
    return '#f87171'; // Red
  };

  const getHighlightedText = (text, highlightString) => {
    // Guard clause: if there's no text or no search string, return original text
    if (!text || typeof text !== "string" || !highlightString || typeof highlightString !== "string") {
      return text;
    }

    // Escape special characters to prevent regex breaking (e.g., if user types '?')
    const escapedHighlight = highlightString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create a global, case-insensitive regex
    const regex = new RegExp(`(${escapedHighlight})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          style={{
            backgroundColor: "rgba(238, 251, 0, 0.7)",
            padding: "0 2px",
            borderRadius: "2px",
            fontWeight: 600,
            color: "#000",
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };
  return (
    <Card
      sx={{
        maxWidth: 450,
        bgcolor: '#ffffff', // Switched to white
        color: '#18181b',   // Darker text for white bg
        borderRadius: 2,
        border: '1px solid #e4e4e7' // Light border
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>

          {/* TITLE: Darker main color, muted gray if unavailable */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 'bold',
              color: isNotAvailable ? '#a1a1aa' : '#18181b'
            }}
          >
            {data.title}
          </Typography>

          {/* QUOTE: Subtle gray with a blue accent border */}
          {data.quote && (
            <Typography
              variant="body2"
              sx={{
                fontStyle: 'italic',
                color: '#52525b', // Mid-tone gray
                lineHeight: 1.6,
                borderLeft: '2px solid #2563eb', // Stronger blue for light mode
                pl: 2
              }}
            >
              {getHighlightedText(data.quote, data.quoteHI)}
            </Typography>
          )}

          {/* DESCRIPTION: Dark gray for better readability */}
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#3f3f46' }}>
            {data.description}
          </Typography>

          {/* CONFIDENCE BAR */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 1 }}>
            <Typography variant="caption" sx={{ minWidth: 70, color: '#71717a', textTransform: 'uppercase' }}>
              Confidence
            </Typography>
            <LinearProgress
              variant="determinate"
              value={data.confidenceScore}
              sx={{
                flexGrow: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: '#f4f4f5', // Light track color
                '& .MuiLinearProgress-bar': {
                  bgcolor: getProgressColor(data.confidenceScore),
                }
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 35, color: '#18181b' }}>
              {data.confidenceScore}%
            </Typography>
          </Box>

          {/* SOURCE LINK: High-contrast blue */}
          {data.sourceUrl && (
            <Link
              href={data.sourceUrl}
              target="_blank"
              underline="none"
              sx={{
                color: '#2563eb',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                width: 'fit-content',
                '&:hover': { color: '#1d4ed8', textDecoration: 'underline' }
              }}
            >
              View original source <ArrowForwardIcon sx={{ fontSize: 14 }} />
            </Link>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
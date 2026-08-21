import { Box, Typography, CircularProgress } from '@mui/material';

export const ConfidenceScore = ({ score = 0 }) => {
  const getColor = (s) => {
    if (s >= 70) return '#008544';
    if (s >= 40) return '#FFB800';
    return '#D92D20';
  };

  const activeColor = getColor(score);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography
        sx={{
          fontFamily: 'Rubik',
          fontSize: '13px',
          color: '#8A8A8A',
          fontWeight: 400,
          whiteSpace: 'nowrap'
        }}
      >
        Confidence Score:
      </Typography>

      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={34}
          thickness={5}
          sx={{ color: '#E6E6E6' }}
        />
        <CircularProgress
          variant="determinate"
          value={score}
          size={34}
          thickness={5}
          sx={{
            color: activeColor,
            position: 'absolute',
            left: 0,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Typography
          sx={{
            position: 'absolute',
            fontFamily: 'Rubik',
            fontWeight: 600,
            fontSize: '11px',
            color: '#333333',
          }}
        >
          {score}
        </Typography>
      </Box>
    </Box>
  );
};
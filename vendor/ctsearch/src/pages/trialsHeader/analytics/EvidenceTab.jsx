import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import React from 'react'
import MoAComparisonMatrix from './graph/MoAComparisonMatrix'

const EvidenceTab = () => {
  return (
    <Box
      sx={{
        padding: "0% 2%",
        mb: 3,
      }}
    >
      <Grid
        sx={{
          justifyContent: "space-between",
        }}
        container
        spacing={2}
        xs={12}
      >
        <Grid
          sx={{
            width: "48.5%",
          }}
          item
          xs={12}
          md={6}
        >
          <MoAComparisonMatrix />
        </Grid>

        <Grid
          sx={{
            width: "48.5%",
          }}
          item
          xs={12}
          md={6}
        >
        </Grid>
        <Grid
          sx={{
            width: "48.5%",
          }}
          item
          xs={12}
          md={6}
        >
        </Grid>

        <Grid item xs={12} md={6}></Grid>
      </Grid>
    </Box>
  )
}

export default EvidenceTab

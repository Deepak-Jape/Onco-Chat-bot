    import React from 'react';
    import { Box, Typography, Button, useTheme } from '@mui/material';
    import { useNavigate } from 'react-router-dom';

    const NotFound = () => {
      const theme = useTheme();
      const navigate = useNavigate();

      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="80vh"
          sx={{
            background: theme.palette.background.default,
            color: theme.palette.text.primary,
            px: 2,
          }}
        >
          <Typography variant="h1" color="primary" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            The page you are looking for does not exist.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Go to Home Page
          </Button>
        </Box>
      );
    };

    export default NotFound;

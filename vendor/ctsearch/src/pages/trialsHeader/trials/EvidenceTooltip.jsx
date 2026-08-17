import React from 'react';
import { Popover, Box } from '@mui/material';
import SourceEvidenceCard from '../../../common/SourceEvidenceCard';
import { useSelector } from 'react-redux';

const EvidenceTooltip = ({ children, rawData }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const isAlertActive = useSelector((state) => state.trials.isAlertActive);

  /**
   * Formats the raw JSON data into the structure expected by SourceEvidenceCard.
   * Handles "Not Available" values and string-based confidence scores.
   */
  const getFormattedData = (data) => {
    if (!data) return null;

    // Use the explicit value from JSON (e.g., "Not Available") 
    // or fallback to "N/A"
    const displayValue = data.value || "";

    // Extract the source text from the array
    const quote = data.source_text 
      ? data.source_text
      : "No direct source text available.";

       const quoteHI = data.source 
      ? data.source
      : "No direct source text available.";

    // Extract the reasoning
    const description = data.reasoning || "No reasoning provided for this metric.";

    // Convert string confidence "1" to number 100
    const confidenceScore = data.confidence_score
      ? parseFloat(data.confidence_score) * 100
      : 0;

    return {
      title: `${displayValue}`,
      quote: quote,
      description: description,
      confidenceScore: confidenceScore,
      quoteHI:quoteHI
    };
  };

  const formatted = getFormattedData(rawData);

  const handleOpen = (event) => {
    if (isAlertActive) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // If there's no data to show, just render the text normally
  if (!formatted) return <>{children}</>;

  return (
    <>
      <Box
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        component="div"
        sx={{ display: 'inline-block', cursor: 'help' }}
      >
        {children}
      </Box>
      <Popover
        id="evidence-popover"
        sx={{ pointerEvents: 'none' }}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        // ACCESSIBILITY FIXES:
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        onClose={handleClose}
      >
        <SourceEvidenceCard data={formatted} />
      </Popover>
    </>
  );
};

export default EvidenceTooltip;
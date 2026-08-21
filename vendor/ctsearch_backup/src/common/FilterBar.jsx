import React, { useState } from 'react';
import { Box, TextField, Autocomplete, Chip, Button, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const FilterBar = () => {
  const [condition, setCondition] = useState(null);
  const [treatment, setTreatment] = useState(null);
  const [phase, setPhase] = useState([]);
  const [intervention, setIntervention] = useState([]);
  const [status, setStatus] = useState([]);
  const [estimatedReadout, setEstimatedReadout] = useState(null);

  const [openField, setOpenField] = useState(null);

  const phases = ['Early Phase I', 'Phase I', 'Phase II'];
  const interventions = ['Drug', 'Device', 'Procedure'];
  const statuses = ['Not Yet Recruiting', 'Recruiting', 'Completed'];

  const handleHoverOpen = (field) => {
    setOpenField(field);
  };

  const handleClose = () => {
    setOpenField(null);
  };

  

  return (
    <Box sx={{
      height: "40px"
    }} className="shadow-all-sides flex items-center gap-0 w-full bg-white  rounded-xl">
      {/* Condition */}
      <Autocomplete
        open={openField === 'condition'}
        onOpen={() => handleHoverOpen('condition')}
        onClose={handleClose}
        onMouseLeave={handleClose}
        onMouseEnter={() => handleHoverOpen('condition')}
        options={["Condition A", "Condition B", "Condition C"]}
        value={condition}
        onChange={(e, v) => setCondition(v)}
        popupIcon={<ExpandMoreIcon />}
        renderInput={(params) => <TextField {...params} placeholder='Condition' label="" />}
        sx={{
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          }, width: 300, paddingRight: "0px", '& .MuiInputBase-root': { height: '40px' }
        }}
      />

      {/* Treatment */}
      <Autocomplete
        open={openField === 'treatment'}
        onOpen={() => handleHoverOpen('treatment')}
        onClose={handleClose}
        onMouseEnter={() => handleHoverOpen('treatment')}
        options={["Treatment A", "Treatment B", "Treatment C"]}
        value={treatment}
        onChange={(e, v) => setTreatment(v)}
        popupIcon={<ExpandMoreIcon />}
        renderInput={(params) => <TextField {...params} label="" placeholder='Treatment' />}
        sx={{
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          }, width: 300, '& .MuiInputBase-root': { height: '40px' }
        }}
      />

      {/* Early Phase */}
      <Autocomplete
        multiple
        open={openField === 'phase'}
        onOpen={() => handleHoverOpen('phase')}
        onClose={handleClose}
        onMouseEnter={() => handleHoverOpen('phase')}
        options={phases}
        value={phase}
        onChange={(e, v) => setPhase(v)}
        popupIcon={<ExpandMoreIcon />}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip label={option} {...getTagProps({ index })} />
          ))
        }
        renderInput={(params) => <TextField {...params} label="" placeholder='Study Phase' />}
        sx={{
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          }, width: 220, '& .MuiInputBase-root': { padding: "0px", height: '40px' }
        }}
      />

      {/* Intervention */}
      <Autocomplete
        multiple
        open={openField === 'intervention'}
        onOpen={() => handleHoverOpen('intervention')}
        onClose={handleClose}
        onMouseEnter={() => handleHoverOpen('intervention')}
        options={interventions}
        value={intervention}
        onChange={(e, v) => setIntervention(v)}
        popupIcon={<ExpandMoreIcon />}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip label={option} {...getTagProps({ index })} />
          ))
        }
        renderInput={(params) => <TextField {...params} label="" placeholder='Study Type' />}
        sx={{
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          }, width: 220, '& .MuiInputBase-root': { padding: "0px", height: '40px' }
        }}
      />

      {/* Status */}
      <Autocomplete
        multiple
        open={openField === 'status'}
        onOpen={() => handleHoverOpen('status')}
        onClose={handleClose}
        onMouseEnter={() => handleHoverOpen('status')}
        options={statuses}
        value={status}
        onChange={(e, v) => setStatus(v)}
        popupIcon={<ExpandMoreIcon />}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip label={option} {...getTagProps({ index })} />
          ))
        }
        renderInput={(params) => <TextField {...params} label="" placeholder='Study Status' />}
        sx={{
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          }, width: 220, '& .MuiInputBase-root': { padding: "0px", height: '40px' }
        }}
      />

      {/* Estimated Readout */}
      <Autocomplete
        open={openField === 'readout'}
        onOpen={() => handleHoverOpen('readout')}
        onClose={handleClose}
        onMouseEnter={() => handleHoverOpen('readout')}
        options={["2024", "2025", "2026"]}
        value={estimatedReadout}
        onChange={(e, v) => setEstimatedReadout(v)}
        popupIcon={<ExpandMoreIcon />}
        renderInput={(params) => <TextField {...params} label="" placeholder='Estimated Readout' />}
        sx={{
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          }, width: 220, '& .MuiInputBase-root': { padding: "0px", height: '40px' }
        }}
      />

      <Button variant="outlined" sx={{ borderRadius: 2 }}>All Filters</Button>
      <Button variant="text" color="error">Reset</Button>
    </Box>
  );
};

export default FilterBar;

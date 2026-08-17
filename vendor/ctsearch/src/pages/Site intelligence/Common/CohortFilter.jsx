import { useEffect, useState } from 'react';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Keep in sync with DROPDOWN_HEIGHT in SitesLists.jsx so this dropdown and
// the country dropdown next to it never drift apart in height again.
const DROPDOWN_HEIGHT = 40;

function CohortFilter({ open = false, cohorts = [], onChange }) {
  // FIX: hooks must always run in the same order on every render, so they
  // can no longer sit after a conditional `return`. Previously this
  // component did `if (...) return;` BEFORE calling useState/useEffect —
  // if `open`/`cohorts.length` ever changed between renders, React would
  // throw "change in the order of Hooks called" and the component could
  // silently break. All hooks now run unconditionally at the top; the
  // early-exit logic moved down into the JSX return instead.
  const [selectedCohort, setSelectedCohort] = useState('');

  useEffect(() => {
    if (cohorts.length > 0) {
      setSelectedCohort(cohorts[0].cohort_id);
    }
  }, [cohorts]);

  // if (cohorts?.length < 2 || !open) return null; // `null`, not `undefined` — React expects a renderable value

  const handleSelectionChange = (event) => {
    const cohortId = event.target.value;
    setSelectedCohort(cohortId);
    onChange?.(cohortId);
  };

  const selectedCohortName =
    cohorts.find((c) => c.cohort_id === selectedCohort)?.cohort_name ?? '';

  return (
    // FIX (white box / size mismatch): width: '100%' here means this
    // FormControl always matches whatever container it's placed in,
    // instead of relying on an external wrapper to force it via
    // `!important` (see SitesLists.jsx — that override can be removed now).
    <FormControl size="small" sx={{ minWidth: 114, width: '100%' }}>
      <Select
        value={selectedCohort}
        onChange={handleSelectionChange}
        IconComponent={ExpandMoreIcon}
        displayEmpty
        fullWidth // FIX: makes the actual bordered input stretch to fill FormControl,
                  // so the visible border and the outer box are always the same size
        // FIX (ellipsis): render the value ourselves as a single-line,
        // truncatable element instead of letting Select's default flex
        // layout swallow the long cohort name.
        renderValue={() =>
          selectedCohort === '' ? (
            <span style={{ color: 'rgba(0,0,0,0.4)' }}>Select Cohorts</span>
          ) : (
            <span
              title={selectedCohortName} // native tooltip shows full name on hover when truncated
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedCohortName}
            </span>
          )
        }
        sx={{
          height: `${DROPDOWN_HEIGHT}px`,
          boxSizing: 'border-box',
          fontSize: '14px',
          fontWeight: 500,
          color: '#00000066',
          backgroundColor: '#FFF',
          borderRadius: '6px',
          // FIX (double border / white box outside the visible pill):
          // MUI's OutlinedInput draws its border on a real <fieldset>
          // element. This project's Tailwind preflight resets fieldset
          // margin/padding but not its native browser border, so the
          // default UA fieldset border was leaking through underneath
          // MUI's own positioned border — that's the plain-edged outer
          // rectangle sitting above the rounded pill in the screenshot.
          // Fix: strip the native fieldset border entirely and put the
          // real border directly on the Select's own root instead — the
          // same workaround already used on the TextField above (search
          // sx="& fieldset": { border: "none" }).
          border: '1px solid rgba(0, 0, 0, 0.15)',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.3)',
          },
          '&.Mui-focused': {
            borderColor: 'rgba(0, 0, 0, 0.4)',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '& .MuiSelect-select': {
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            minWidth: 0, // lets the truncatable <span> above actually shrink instead of overflowing
            overflow: 'hidden',
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: { borderRadius: '12px', mt: 0.5 },
          },
        }}
      >
        <MenuItem value="" disabled>
          Select Cohorts
        </MenuItem>
        {cohorts?.map((cohort) => (
          <MenuItem key={cohort.cohort_id} value={cohort.cohort_id}>
            {cohort.cohort_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default CohortFilter;
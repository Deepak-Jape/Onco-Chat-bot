import React from 'react';
import LpiTimelineCard from '../Plan components/LpiTimelineCard';
import ShortlistedSitesBlock from '../Plan components/ShortlistedSitesBlock';
import FastTrackCrosBlock from '../Plan components/FastTrackCrosBlock';

export default function SitePlans({cohorts}) {
  const cohortMode = cohorts.length > 1 ? 'multiple' : 'single'
  return (
    <div style={styles.masterParentFrame}>
      {/* Top Section Component: LPI Timeline Metric Summary */}
      <LpiTimelineCard cohortMode={cohortMode}  sites={24} plannedPatients={200} timeToLPI="11.2 months" />

      {/* Middle Section Component: Short-listed Interactive Data Grid */}
      <ShortlistedSitesBlock cohorts={cohorts} />

      {/* Bottom Section Component: Fast Track CRO Cards Grid Panel */}
      {/* Hide CRO Partnerships section - not in the poc */}
      {/* <FastTrackCrosBlock /> */}
    </div>
  );
}

const styles = {
  masterParentFrame: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: '24px',
    gap: '24px',
    width: '100%',
    maxWidth: "96vw", // '1450px',
    boxSizing: 'border-box',
    backgroundColor: '#F8FAFC',
    height: '85vh',
    minHeight: '85%',
    overflowY: 'auto',
  },
};
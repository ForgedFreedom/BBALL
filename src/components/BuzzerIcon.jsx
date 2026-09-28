import React from 'react';

// A round push-button buzzer (mount + domed cap with a highlight) with sound
// waves radiating off it, distinct from the whistle and the old bell/horn
// emoji choices.
export const BuzzerIcon = () => (
  <svg viewBox="0 0 24 16" width="22" height="22" aria-hidden="true" focusable="false" style={{ verticalAlign: 'middle', marginRight: '0.35rem' }}>
    <rect x="2" y="10.5" width="8" height="3" rx="1" fill="currentColor" />
    <circle cx="6" cy="8" r="6" fill="currentColor" />
    <ellipse cx="4.2" cy="5.4" rx="1.8" ry="1" fill="rgba(0,0,0,0.35)" />
    <path d="M15 4 Q18 8 15 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M18 2 Q22.5 8 18 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

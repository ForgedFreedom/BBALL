import React from 'react';

// A classic referee whistle, modeled on a real one: a flat mouthpiece block
// (with its side grip/air hole) feeding into a round resonating chamber
// (with the rectangular sound slot on top), and a lanyard ring at the back.
// Recessed details use a translucent dark fill rather than a literal color
// so they read as "cut into" the body on any button background color —
// filling them plain white blended invisibly into white button text/icons.
export const WhistleIcon = () => (
  <svg viewBox="0 0 32 16" width="22" height="22" aria-hidden="true" focusable="false" style={{ verticalAlign: 'middle', marginRight: '0.35rem' }}>
    <rect x="1" y="4" width="14" height="8" rx="1" fill="currentColor" />
    <ellipse cx="5.5" cy="8" rx="1.8" ry="2.6" fill="rgba(0,0,0,0.4)" />
    <rect x="14" y="6" width="3" height="4" fill="currentColor" />
    <circle cx="23" cy="8" r="7" fill="currentColor" />
    <rect x="19" y="3.2" width="8" height="2.4" rx="1" fill="rgba(0,0,0,0.4)" />
    <rect x="28" y="7" width="2" height="2" fill="currentColor" />
    <circle cx="29.5" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

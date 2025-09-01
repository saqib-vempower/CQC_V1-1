
import React from 'react';

// tiny inline icon helper (no extra deps)
const Icon = ({ path, className = 'w-6 h-6' }: { path: string; className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
);
  
export const icons = {
    bolt: 'M13 3L4 14h7l-1  7 9-11h-7l1-7z',
    shield: 'M12 3l7 4v5c0 5-3.8 9.1-7 10-3.2-.9-7-5-7-10V7l7-4z',
    wave: 'M3 12s2-4 6-4 6 4 12 4-2 4-6 4-6-4-12-4z',
    check: 'M20 6l-11 11-5-5',
    upload: 'M12 3v12M7 8l5-5 5 5M5 19h14',
    mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3z M5 11a7 7 0 0 0 14 0M12 18v3',
    table: 'M4 6h16M4 12h16M4 18h16M8 4v16M16 4v16',
    wand: 'M3 21l10-10M14 4l6 6M12 6l6 6M6 12l6 6',
    chart: 'M4 20h16M7 16v-6M12 20V8m5 12v-9',
    file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z M14 3v6h6',
    play: 'M8 5v14l11-7-11-7z',
};

export default Icon;
  
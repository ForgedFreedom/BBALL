import React from 'react';

const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const ActivityLogPanel = ({ entries, open, onToggle }) => {
  return (
    <section className="panel activity-log-panel">
      <div className="stats-header">
        <h2>Activity Log</h2>
        <button className="toggle-button" onClick={onToggle}>
          {open ? 'Hide Log' : 'Show Log'}
        </button>
      </div>

      {open && (
        entries.length > 0 ? (
          <ul className="activity-log-list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <span className="activity-log-time">{formatTime(entry.ts)}</span>
                <span>{entry.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="leaderboard-line">No activity yet.</p>
        )
      )}
    </section>
  );
};

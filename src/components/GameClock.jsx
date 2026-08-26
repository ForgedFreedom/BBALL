import React from 'react';

const formatClock = (totalSeconds) => {
  const seconds = Math.max(0, totalSeconds);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

// Displays elapsed time for a court's current game. While running, it ticks
// once a second from `startedAt`; once stopped, it shows the frozen
// `frozenSeconds` from the last game played on that court.
export const GameClock = ({ running, startedAt, frozenSeconds }) => {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!running) return undefined;
    // Refresh immediately (don't wait for the first tick) so resuming — e.g.
    // after an undo — doesn't briefly show a stale reading.
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const seconds = running && startedAt
    ? Math.floor((now - startedAt) / 1000)
    : (frozenSeconds || 0);

  return (
    <div className="game-clock" aria-label="Game clock">
      {formatClock(seconds)}
    </div>
  );
};

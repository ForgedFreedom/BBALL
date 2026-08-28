import React from 'react';

// How many players sit at the front of the Waitlist (i.e. next in line for
// Next Team) before the rest collapse behind a "Show more" toggle.
const WAITLIST_PREVIEW_COUNT = 5;

export const PlayerLists = ({
  waitlist,
  pausedList,
  nextTeam,
  getPlayerName,
  pausePlayer,
  readyPlayer,
  removePlayer,
  startSwap,
}) => {
  const [showFullWaitlist, setShowFullWaitlist] = React.useState(false);
  const hiddenWaitlistCount = Math.max(0, waitlist.length - WAITLIST_PREVIEW_COUNT);
  const visibleWaitlist = showFullWaitlist ? waitlist : waitlist.slice(0, WAITLIST_PREVIEW_COUNT);

  return (
  <div className="lists-container">
    <div className="list-section">
      <h2>Waitlist ({waitlist.length})</h2>
      <ul>
        {visibleWaitlist.map((id) => (
          <li key={id}>
            {getPlayerName(id)}
            <div className="player-actions">
              <button className="pause-button" onClick={() => pausePlayer(id)}>Pause</button>
              <button className="swap-button" onClick={() => startSwap(id, 'waitlist')}>Swap</button>
            </div>
          </li>
        ))}
      </ul>
      {hiddenWaitlistCount > 0 && (
        <button className="toggle-button waitlist-toggle" onClick={() => setShowFullWaitlist(!showFullWaitlist)}>
          {showFullWaitlist ? 'Show Top 5 Only' : `Show ${hiddenWaitlistCount} More`}
        </button>
      )}
    </div>

    <div className="list-section">
      <h2>Paused ({pausedList.length})</h2>
      <ul>
        {pausedList.map((id) => (
          <li key={id}>
            {getPlayerName(id)}
            <div className="player-actions">
              <button className="ready-button" onClick={() => readyPlayer(id)}>Ready</button>
              <button className="danger-button" onClick={() => removePlayer(id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>

    <div className="list-section next-team-section">
      <h2>Next Team ({nextTeam.length})</h2>
      <ul>
        {nextTeam.map((id) => (
          <li key={id}>
            {getPlayerName(id)}
            <div className="player-actions">
              <button className="pause-button" onClick={() => pausePlayer(id)}>Pause</button>
              <button className="swap-button" onClick={() => startSwap(id, 'nextTeam')}>Swap</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
  );
};

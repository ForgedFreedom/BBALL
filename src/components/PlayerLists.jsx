import React from 'react';

export const PlayerLists = ({
  waitlist,
  pausedList,
  nextTeam,
  getPlayerName,
  pausePlayer,
  readyPlayer,
  removePlayer,
  startSwap,
}) => (
  <div className="lists-container">
    <div className="list-section">
      <h2>Waitlist ({waitlist.length})</h2>
      <ul>
        {waitlist.map((id) => (
          <li key={id}>
            {getPlayerName(id)}
            <div className="player-actions">
              <button className="pause-button" onClick={() => pausePlayer(id)}>Pause</button>
              <button className="swap-button" onClick={() => startSwap(id, 'waitlist')}>Swap</button>
            </div>
          </li>
        ))}
      </ul>
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

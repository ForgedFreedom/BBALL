import React from 'react';
import { GameClock } from './GameClock.jsx';

const stripSuffix = (label) => label.replace(' (Winners)', '').replace(' (Challengers)', '');

export const Court = ({
  court,
  team1,
  team2,
  team1Wins,
  teamLabel,
  gameStarted,
  postMaxOut,
  getPlayerName,
  startSwap,
  onStartGame,
  setPendingWinner,
  resetGame,
  canUndoWinner,
  onUndoWinner,
  clockStartedAt,
  clockFrozenSeconds,
}) => {
  const label1 = teamLabel(court, 1);
  const label2 = teamLabel(court, 2);
  const isFirstGame = team1.length === 0 && team2.length === 0;

  return (
    <div className={`court-section court-${court.toLowerCase()}`}>
      <h2>Court {court}</h2>

      <div className="teams-container">
        <div className="team-section">
          <h3>{label1} ({team1.length}) &middot; Wins: {team1Wins}</h3>
          <ul>
            {team1.map((id) => (
              <li key={id}>
                {getPlayerName(id)}
                <div className="player-actions">
                  <button className="swap-button" onClick={() => startSwap(id, `team${court === 'A' ? 1 : 3}`)}>Swap</button>
                </div>
              </li>
            ))}
          </ul>
          {canUndoWinner && (
            <button className="undo-button team-action-button" onClick={onUndoWinner}>Undo Last Result</button>
          )}
        </div>

        <div className="team-section">
          <h3>{label2} ({team2.length})</h3>
          <ul>
            {team2.map((id) => (
              <li key={id}>
                {getPlayerName(id)}
                <div className="player-actions">
                  <button className="swap-button" onClick={() => startSwap(id, `team${court === 'A' ? 2 : 4}`)}>Swap</button>
                </div>
              </li>
            ))}
          </ul>
          {!gameStarted && !isFirstGame && (
            <button className="primary-button team-action-button" onClick={onStartGame}>Start Next Game</button>
          )}
        </div>
      </div>

      <div className="game-controls">
        {postMaxOut && <p className="max-out-message">Game Over! {stripSuffix(label1)} winners have been retired.</p>}

        {!gameStarted && isFirstGame && (
          <button className="primary-button" onClick={onStartGame}>Start Game</button>
        )}

        {gameStarted && (
          <div className="winner-controls">
            <button className="win-button" onClick={() => setPendingWinner({ court, team: 1 })}>
              {stripSuffix(label1)} Won
            </button>
            <button className="win-button" onClick={() => setPendingWinner({ court, team: 2 })}>
              {stripSuffix(label2)} Won
            </button>
          </div>
        )}

        {(team1.length > 0 || team2.length > 0) && (
          <div className="court-footer-row">
            <GameClock running={gameStarted} startedAt={clockStartedAt} frozenSeconds={clockFrozenSeconds} />
            <button onClick={resetGame} className="danger-button">Reset Court {court}</button>
          </div>
        )}
      </div>
    </div>
  );
};

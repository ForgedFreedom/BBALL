import React from 'react';

export const PlayerStatsPanel = ({
  players,
  showPlayerStats,
  setShowPlayerStats,
  maxWins,
  topWinners,
  onRestore,
}) => {
  return (
    <section className="panel player-stats-panel">
      <div className="stats-header">
        <h2>Player Stats</h2>
        <button
          className="toggle-button"
          onClick={() => setShowPlayerStats(!showPlayerStats)}
        >
          {showPlayerStats ? 'Hide Stats' : 'Show Stats'}
        </button>
      </div>

      {showPlayerStats && (
        <>
          <p className="leaderboard-line">
            {maxWins > 0
              ? `Leader Board Wins: ${topWinners.join(', ')} with ${maxWins} win${maxWins > 1 ? 's' : ''}`
              : 'No wins recorded yet.'}
          </p>

          <div className="table-scroll">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Streak</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {players.length > 0 ? (
                  players.map((p) => (
                    <tr key={p.id} className={p.removed ? 'removed-row' : undefined}>
                      <td>{p.name}{p.removed && <span className="removed-tag"> (Removed)</span>}</td>
                      <td>{p.wins}</td>
                      <td>{p.losses}</td>
                      <td>{p.winStreak}</td>
                      <td>
                        {p.removed && (
                          <button className="restore-button" onClick={() => onRestore(p.id)}>Restore</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>No players added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

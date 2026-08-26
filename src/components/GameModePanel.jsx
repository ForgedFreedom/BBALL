import React from 'react';

export const GameModePanel = ({ gameMode, onChange }) => {
  return (
    <div className="game-mode-panel">
      <h3>Game Mode</h3>

      <select value={gameMode} onChange={onChange}>
        <option value="5x5">5 vs 5</option>
        <option value="4x4">4 vs 4</option>
        <option value="3x3">3 vs 3</option>
      </select>
    </div>
  );
};
import React from 'react';
import { Modal } from './Modal.jsx';

export const StartGameModal = ({
  open,
  court,
  teamAName,
  teamANames,
  teamBName,
  teamBNames,
  teamAWins,
  maxWinsLimit,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  // If teamAName is still holding down the court, one more win would push
  // its streak to the max-wins limit and max it out — flag that up front so
  // it isn't a surprise.
  const willMaxOut = typeof teamAWins === 'number' && typeof maxWinsLimit === 'number'
    && teamAWins + 1 >= maxWinsLimit;

  return (
    <Modal open={open} onClose={onCancel}>
      <h3 className="modal-title">Start Next Game on Court {court}</h3>

      <p className="matchup-preview">
        {teamAName} ({(teamANames || []).join(', ')})
        <br />
        vs
        <br />
        {teamBName} ({(teamBNames || []).join(', ')})
      </p>

      {willMaxOut && (
        <p className="max-out-warning">
          ⚠ {teamAName} is one win away from the {maxWinsLimit}-win limit — a win
          here will be their last game before maxing out.
        </p>
      )}

      <div className="modal-actions">
        <button className="modal-close" onClick={onCancel}>Cancel</button>
        <button className="win-button" onClick={onConfirm}>Start Game</button>
      </div>
    </Modal>
  );
};

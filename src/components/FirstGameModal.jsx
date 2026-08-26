import React from 'react';
import { Modal } from './Modal.jsx';

export const FirstGameModal = ({
  open,
  court,
  teamAName,
  teamANames,
  teamBName,
  teamBNames,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onCancel}>
      <h3 className="modal-title">Start Game on Court {court}</h3>

      <p className="matchup-preview">
        {teamAName} ({(teamANames || []).join(', ')})
        <br />
        vs
        <br />
        {teamBName} ({(teamBNames || []).join(', ')})
      </p>

      <div className="modal-actions">
        <button className="modal-close" onClick={onCancel}>Cancel</button>
        <button className="win-button" onClick={onConfirm}>Start Game</button>
      </div>
    </Modal>
  );
};

import React from 'react';
import { Modal } from './Modal.jsx';

export const WinnerModal = ({ open, court, team, teamLabel, winnerNames, onConfirm, onCancel }) => {
  if (!open) return null;

  const winnerName = teamLabel(court, team);

  return (
    <Modal open={open} onClose={onCancel}>
      <h3 className="modal-title">Confirm Winner</h3>
      <p>
        Declare <strong>{winnerName} ({(winnerNames || []).join(', ')})</strong> as the winner on Court {court}?
      </p>

      <div className="modal-actions">
        <button className="modal-close" onClick={onCancel}>Cancel</button>
        <button className="win-button" onClick={onConfirm}>Confirm</button>
      </div>
    </Modal>
  );
};

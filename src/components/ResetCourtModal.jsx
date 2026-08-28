import React from 'react';
import { Modal } from './Modal.jsx';

export const ResetCourtModal = ({
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
      <h3 className="modal-title">Reset Court {court}?</h3>
      <p>Everyone currently on the court goes back to the Waitlist, and the win streak resets. This can't be undone.</p>

      <p className="matchup-preview">
        {teamAName} ({(teamANames || []).join(', ') || '—'})
        <br />
        {teamBName} ({(teamBNames || []).join(', ') || '—'})
      </p>

      <div className="modal-actions">
        <button className="modal-close" onClick={onCancel}>Cancel</button>
        <button className="danger-button" onClick={onConfirm}>Reset Court {court}</button>
      </div>
    </Modal>
  );
};

import React from 'react';
import { Modal } from './Modal.jsx';

export const ClearAllModal = ({ open, onConfirm, onCancel }) => {
  return (
    <Modal open={open} onClose={onCancel}>
      <h3 className="modal-title">Clear All Data?</h3>
      <p>This will remove all players, teams, and game state. This cannot be undone.</p>

      <div className="modal-actions">
        <button className="modal-close" onClick={onCancel}>Cancel</button>
        <button className="danger-button" onClick={onConfirm}>Confirm</button>
      </div>
    </Modal>
  );
};

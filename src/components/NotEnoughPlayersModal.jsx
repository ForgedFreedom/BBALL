import { Modal } from "./Modal.jsx";
export const NotEnoughPlayersModal = ({ open, needed, onClose }) => {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="modal-title">Not Enough Players</h3>
      <p>You need at least {needed} players to start a game.</p>

      <div className="modal-actions">
        <button className="modal-close" onClick={onClose}>OK</button>
      </div>
    </Modal>
  );
};
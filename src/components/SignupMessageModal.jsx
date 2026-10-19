import { Modal } from "./Modal.jsx";

// Pops up after a successful Add Player while the signup message is enabled.
// Backdrop clicks don't close it — the player has to acknowledge it.
export const SignupMessageModal = ({ open, playerName, message, onClose }) => {
  if (!open) return null;

  return (
    <Modal open={open} onClose={() => {}}>
      <div className="signup-message-popup">
        <h3 className="modal-title">📢 Heads up, {playerName}!</h3>
        <p className="signup-message-popup-text">{message}</p>
        <div className="modal-actions">
          <button className="primary-button" onClick={onClose} autoFocus>Got It</button>
        </div>
      </div>
    </Modal>
  );
};

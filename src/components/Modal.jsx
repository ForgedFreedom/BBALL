// components/Modal.jsx
import React from 'react';

export const Modal = ({ open, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
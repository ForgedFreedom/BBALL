import React from 'react';
import { Modal } from './Modal.jsx';

const TITLES = {
  set: 'Set Lock-Down Code',
  'verify-swap': 'Lock-Down Is Active',
  'verify-disable': 'Disable Lock-Down',
};

const DESCRIPTIONS = {
  set: "Choose a 4-digit code. You'll need it to authorize swaps or turn lock-down off later.",
  'verify-swap': 'Enter the 4-digit lock-down code to allow swapping for the rest of this session.',
  'verify-disable': 'Enter the 4-digit lock-down code to turn lock-down mode off.',
};

export const LockdownCodeModal = ({ open, mode, purpose, error, onSubmit, onCancel }) => {
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    if (open) setValue('');
  }, [open]);

  if (!open) return null;

  const key = mode === 'set' ? 'set' : `verify-${purpose}`;

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setValue(digits);
  };

  const submit = () => {
    if (value.length !== 4) return;
    onSubmit(value);
  };

  return (
    <Modal open={open} onClose={onCancel}>
      <h3 className="modal-title">{TITLES[key]}</h3>
      <p>{DESCRIPTIONS[key]}</p>

      <input
        className="code-input"
        type="text"
        inputMode="numeric"
        pattern="\d*"
        maxLength={4}
        autoFocus
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder="••••"
      />

      {error && <p className="error">{error}</p>}

      <div className="modal-actions">
        <button className="modal-close" onClick={onCancel}>Cancel</button>
        <button className="primary-button" disabled={value.length !== 4} onClick={submit}>
          {mode === 'set' ? 'Save Code' : 'Submit'}
        </button>
      </div>
    </Modal>
  );
};

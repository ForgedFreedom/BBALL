import React from 'react';
import { Modal } from './Modal.jsx';

const BASE_LABELS = {
  waitlist: 'Waitlist',
  pausedList: 'Paused',
  nextTeam: 'Next Team',
};

export const SwapModal = ({
  open,
  swappingPlayer,
  lists,
  getPlayerName,
  onSwap,
  onCancel,
  swapError,
  listLabel,
}) => {
  if (!open || !swappingPlayer) return null;

  const { id: sourceId, sourceList, targetLists } = swappingPlayer;
  const labelFor = (listName) => (listLabel && listLabel(listName)) || BASE_LABELS[listName] || listName;

  return (
    <Modal open={open} onClose={onCancel}>
      <h3 className="modal-title">Swap Player</h3>

      <p>
        Swapping <strong>{getPlayerName(sourceId)}</strong> from{" "}
        <strong>{labelFor(sourceList)}</strong>
      </p>

      <div className="swap-lists">
        {targetLists.map(listName => (
          <div key={listName} className="swap-list">
            <h4>{labelFor(listName)}</h4>

            <ul>
              {lists[listName].map(pid => (
                <li key={pid}>
                  {getPlayerName(pid)}
                  <button
                    className="swap-button"
                    onClick={() => onSwap(pid, listName)}
                  >
                    Swap
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {swapError && <p className="error">{swapError}</p>}

      <div className="modal-actions">
        <button className="modal-close" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};
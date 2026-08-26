import React from 'react';

export const MaxWinsPanel = ({
  maxWinsLimit,
  maxWinsInput,
  maxWinsError,
  onChange
}) => {
  return (
    <div className="max-wins-panel">
      <h3>Max Wins Limit</h3>

      <input
        type="text"
        value={maxWinsInput}
        onChange={onChange}
        placeholder={`Current: ${maxWinsLimit}`}
      />

      {maxWinsError && (
        <p className="error">{maxWinsError}</p>
      )}
    </div>
  );
};
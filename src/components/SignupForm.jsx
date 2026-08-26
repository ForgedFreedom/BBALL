import React from 'react';
export const SignupForm = ({
  playerName,
  setPlayerName,
  addPlayer,
  signupError
}) => /*#__PURE__*/React.createElement("div", {
  className: "signup-container"
}, /*#__PURE__*/React.createElement("input", {
  type: "text",
  value: playerName,
  onChange: e => setPlayerName(e.target.value),
  placeholder: "Enter player name"
}), /*#__PURE__*/React.createElement("button", {
  onClick: addPlayer
}, "Add Player"), signupError && /*#__PURE__*/React.createElement("p", {
  className: "error"
}, signupError));
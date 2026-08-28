import React from 'react';
import './style.css';
import { useBballManager } from './hooks/useBballManager.jsx';
import { SignupForm } from './components/SignupForm.jsx';
import { PlayerLists } from './components/PlayerLists.jsx';
import { Court } from './components/Court.jsx';
import { ClearAllModal } from './components/ClearAllModal.jsx';
import { WinnerModal } from './components/WinnerModal.jsx';
import { StartGameModal } from './components/StartGameModal.jsx';
import { FirstGameModal } from './components/FirstGameModal.jsx';
import { SwapModal } from './components/SwapModal.jsx';
import { GameModePanel } from './components/GameModePanel.jsx';
import { MaxWinsPanel } from './components/MaxWinsPanel.jsx';
import { PlayerStatsPanel } from './components/PlayerStatsPanel.jsx';
import { NotEnoughPlayersModal } from './components/NotEnoughPlayersModal.jsx';
import { ResetCourtModal } from './components/ResetCourtModal.jsx';
import { ActivityLogPanel } from './components/ActivityLogPanel.jsx';
import { LockdownCodeModal } from './components/LockdownCodeModal.jsx';

function App() {
  const {
    players,
    waitlist,
    pausedList,
    nextTeam,
    team1,
    team2,
    team3,
    team4,
    team1Wins,
    team3Wins,
    gameStartedA,
    gameStartedB,
    postMaxOutA,
    postMaxOutB,
    team1Label,
    team2Label,
    team3Label,
    team4Label,
    playerName,
    signupError,
    loading,
    error,
    maxWinsLimit,
    maxWinsInput,
    maxWinsError,
    gameMode,
    gameModeError,
    swappingPlayer,
    swapError,
    pendingWinner,
    setPendingWinner,
    pendingStart,
    pendingFirstStart,
    pendingClearAll,
    setPendingClearAll,
    pendingNotEnoughPlayers,
    setPendingNotEnoughPlayers,
    pendingResetCourt,
    showPlayerStats,
    showActivityLog,
    showSettings,
    activityLog,
    totalCount,
    maxWins,
    topWinners,
    previewFirstGameTeams,
    previewNextGameChallengers,
    lastSwapUndo,
    lastWinnerUndoA,
    lastWinnerUndoB,
    clockStartA,
    clockStartB,
    clockElapsedA,
    clockElapsedB,
    lockdownEnabled,
    lockdownPrompt,
    setPlayerName,
    addPlayer,
    pausePlayer,
    readyPlayer,
    removePlayer,
    restorePlayer,
    startSwap,
    completeSwap,
    cancelSwap,
    undoLastSwap,
    dismissSwapUndo,
    requestStartA,
    requestStartB,
    startGameA,
    startGameB,
    firstGameA,
    firstGameB,
    cancelStart,
    declareWinnerA,
    declareWinnerB,
    cancelWinner,
    undoWinner,
    requestResetCourt,
    cancelResetCourt,
    confirmResetCourt,
    clearAll,
    cancelClearAll,
    clearScores,
    handleMaxWinsChange,
    handleGameModeChange,
    getPlayerName,
    setShowPlayerStats,
    setShowActivityLog,
    setShowSettings,
    toggleLockdown,
    submitLockdownCode,
    cancelLockdownPrompt,
  } = useBballManager();

  const teamLabel = (court, team) => {
    if (court === 'A') return team === 1 ? team1Label : team2Label;
    return team === 1 ? team3Label : team4Label;
  };

  const teamPlayers = (court, team) => {
    if (court === 'A') return team === 1 ? team1 : team2;
    return team === 1 ? team3 : team4;
  };

  const listLabel = (listName) => {
    const map = { team1: team1Label, team2: team2Label, team3: team3Label, team4: team4Label };
    return map[listName];
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-screen">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  const waitlistCount = new Set(waitlist).size;

  return (
    <div className="app">
      <header className="app-header">
        <h1>RFCN BBALL Game Manager</h1>
        <div className="summary-bar">
          <span>Total: {totalCount}</span>
          <span>Waitlist: {waitlistCount}</span>
          <span>Paused: {pausedList.length}</span>
        </div>
      </header>

      <main>
        {lastSwapUndo && (
          <div className="swap-undo-banner">
            <span>
              Swapped <strong>{getPlayerName(lastSwapUndo.sourcePlayerId)}</strong> and{' '}
              <strong>{getPlayerName(lastSwapUndo.targetPlayerId)}</strong>.
            </span>
            <div className="swap-undo-actions">
              <button className="undo-button" onClick={undoLastSwap}>Undo</button>
              <button className="modal-close" onClick={dismissSwapUndo}>Dismiss</button>
            </div>
          </div>
        )}

        <div className="top-row">
          <section className="panel rules-panel">
            <h2>How We Play Around Here</h2>
            <ul>
              <li>Love God, Love Others, Be Grateful!</li>
              <li>Respect Each Other; Respect the Call.</li>
              <li>Minimum Age: 16</li>
            </ul>
          </section>
          <section className="panel">
            <h2>Player Signup</h2>
            <SignupForm
              playerName={playerName}
              setPlayerName={setPlayerName}
              addPlayer={addPlayer}
              signupError={signupError}
            />
          </section>
        </div>

        <PlayerStatsPanel
          players={players}
          showPlayerStats={showPlayerStats}
          setShowPlayerStats={setShowPlayerStats}
          maxWins={maxWins}
          topWinners={topWinners}
          onRestore={restorePlayer}
        />

        <PlayerLists
          waitlist={waitlist}
          pausedList={pausedList}
          nextTeam={nextTeam}
          getPlayerName={getPlayerName}
          pausePlayer={pausePlayer}
          readyPlayer={readyPlayer}
          removePlayer={removePlayer}
          startSwap={startSwap}
        />

        <div className="courts-container">
          <Court
            court="A"
            team1={team1}
            team2={team2}
            team1Wins={team1Wins}
            teamLabel={teamLabel}
            gameStarted={gameStartedA}
            postMaxOut={postMaxOutA}
            getPlayerName={getPlayerName}
            startSwap={startSwap}
            onStartGame={requestStartA}
            setPendingWinner={setPendingWinner}
            onRequestReset={() => requestResetCourt('A')}
            canUndoWinner={!!lastWinnerUndoA}
            onUndoWinner={() => undoWinner('A')}
            clockStartedAt={clockStartA}
            clockFrozenSeconds={clockElapsedA}
          />

          {(gameMode === '4x4' || gameMode === '3x3') && (
            <Court
              court="B"
              team1={team3}
              team2={team4}
              team1Wins={team3Wins}
              teamLabel={teamLabel}
              gameStarted={gameStartedB}
              postMaxOut={postMaxOutB}
              getPlayerName={getPlayerName}
              startSwap={startSwap}
              onStartGame={requestStartB}
              setPendingWinner={setPendingWinner}
              onRequestReset={() => requestResetCourt('B')}
              canUndoWinner={!!lastWinnerUndoB}
              onUndoWinner={() => undoWinner('B')}
              clockStartedAt={clockStartB}
              clockFrozenSeconds={clockElapsedB}
            />
          )}
        </div>

        <ActivityLogPanel
          entries={activityLog}
          open={showActivityLog}
          onToggle={() => setShowActivityLog(!showActivityLog)}
        />

        <section className="panel settings-panel">
          <div className="stats-header">
            <h2>Settings</h2>
            <button
              className="toggle-button"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? 'Hide Settings' : 'Show Settings'}
            </button>
          </div>

          {showSettings && (
            <>
              <GameModePanel gameMode={gameMode} onChange={handleGameModeChange} />
              {gameModeError && <p className="error">{gameModeError}</p>}

              <MaxWinsPanel
                maxWinsLimit={maxWinsLimit}
                maxWinsInput={maxWinsInput}
                maxWinsError={maxWinsError}
                onChange={handleMaxWinsChange}
              />

              <div className="lockdown-panel">
                <h3>Lock-Down Mode</h3>
                <p className="lockdown-status">
                  {lockdownEnabled ? '🔒 Swaps require a code.' : '🔓 Swaps are open.'}
                </p>
                <button
                  className={lockdownEnabled ? 'danger-button' : 'primary-button'}
                  onClick={toggleLockdown}
                >
                  {lockdownEnabled ? 'Disable Lock-Down' : 'Enable Lock-Down'}
                </button>
              </div>

              <div className="danger-zone">
                <button onClick={clearScores} className="danger-button">Clear Scores</button>
                <button onClick={() => setPendingClearAll(true)} className="danger-button">Clear All</button>
              </div>
            </>
          )}
        </section>

      </main>

      <ClearAllModal open={!!pendingClearAll} onConfirm={clearAll} onCancel={cancelClearAll} />

      <ResetCourtModal
        open={pendingResetCourt !== null}
        court={pendingResetCourt || ''}
        teamAName={pendingResetCourt ? teamLabel(pendingResetCourt, 1) : ''}
        teamANames={pendingResetCourt ? teamPlayers(pendingResetCourt, 1).map(getPlayerName) : []}
        teamBName={pendingResetCourt ? teamLabel(pendingResetCourt, 2) : ''}
        teamBNames={pendingResetCourt ? teamPlayers(pendingResetCourt, 2).map(getPlayerName) : []}
        onConfirm={confirmResetCourt}
        onCancel={cancelResetCourt}
      />

      <WinnerModal
        open={!!pendingWinner}
        court={pendingWinner?.court}
        team={pendingWinner?.team}
        teamLabel={teamLabel}
        winnerNames={pendingWinner ? teamPlayers(pendingWinner.court, pendingWinner.team).map(getPlayerName) : []}
        onConfirm={() => {
          if (!pendingWinner) return;
          if (pendingWinner.court === 'A') declareWinnerA(pendingWinner.team);
          else declareWinnerB(pendingWinner.team);
        }}
        onCancel={cancelWinner}
      />

      <StartGameModal
        open={pendingStart !== null}
        court={pendingStart || ''}
        teamAName={pendingStart === 'B' ? team3Label : team1Label}
        teamANames={(pendingStart === 'B' ? team3 : team1).map(getPlayerName)}
        teamBName={pendingStart === 'B' ? team4Label : team2Label}
        teamBNames={(previewNextGameChallengers[pendingStart] || []).map(getPlayerName)}
        onConfirm={() => {
          if (pendingStart === 'A') startGameA();
          else if (pendingStart === 'B') startGameB();
        }}
        onCancel={cancelStart}
      />

      <FirstGameModal
        open={pendingFirstStart !== null}
        court={pendingFirstStart || ''}
        teamAName={pendingFirstStart === 'B' ? team3Label : team1Label}
        teamANames={previewFirstGameTeams.teamA.map(getPlayerName)}
        teamBName={pendingFirstStart === 'B' ? team4Label : team2Label}
        teamBNames={previewFirstGameTeams.teamB.map(getPlayerName)}
        onConfirm={() => {
          if (pendingFirstStart === 'A') firstGameA();
          else if (pendingFirstStart === 'B') firstGameB();
        }}
        onCancel={cancelStart}
      />

      <NotEnoughPlayersModal
        open={pendingNotEnoughPlayers !== null}
        needed={pendingNotEnoughPlayers?.needed}
        onClose={() => setPendingNotEnoughPlayers(null)}
      />

      <SwapModal
        open={!!swappingPlayer}
        swappingPlayer={swappingPlayer}
        lists={{ waitlist, pausedList, nextTeam, team1, team2, team3, team4 }}
        getPlayerName={getPlayerName}
        onSwap={completeSwap}
        onCancel={cancelSwap}
        swapError={swapError}
        listLabel={listLabel}
      />

      <LockdownCodeModal
        open={!!lockdownPrompt}
        mode={lockdownPrompt?.mode}
        purpose={lockdownPrompt?.purpose}
        error={lockdownPrompt?.error}
        onSubmit={submitLockdownCode}
        onCancel={cancelLockdownPrompt}
      />
    </div>
  );
}

export default App;

import React from 'react';

const STORAGE_KEY = 'bballManagerState';
const MAX_SAVE_LOGS = 100;
const MAX_LOG_ENTRIES = 200;
const DEFAULT_MAX_WINS = 5;
const ADMIN_LOCKDOWN_CODE = '8989';
// How long a correct swap-unlock code stays valid before lock-down re-engages.
const SWAP_UNLOCK_DURATION_MS = 2 * 60 * 1000;

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Matches the mm:ss format shown on the live GameClock, so log entries read
// consistently with what was on screen.
const formatClock = (totalSeconds) => {
  const seconds = Math.max(0, totalSeconds || 0);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

// --- Player-name profanity filter ---
// A short, curated blocklist checked against each *word* of the entered name
// (after lowercasing and undoing common leetspeak substitutions), so simple
// obfuscation like "a$$" or "5h1t" doesn't slip through. This is a casual
// deterrent for a small local app, not a comprehensive filter — it's checked
// per word (not against the whole name glued together) specifically to avoid
// cross-word false positives (e.g. "Rob Itch" won't trip the "bitch" entry).
// Extend BLOCKED_WORDS here if something gets through, or trim it if a
// legitimate name gets caught (e.g. "Dick" as short for Richard).
const BLOCKED_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'piss',
  'cock', 'pussy', 'slut', 'whore', 'fag', 'faggot', 'nigger', 'nigga',
  'retard', 'rape', 'twat', 'wank', 'douche', 'dyke', 'spic', 'chink',
  'gook', 'tranny', 'cum', 'boob', 'penis', 'vagina', 'anal', 'sex',
];

const LEETSPEAK_MAP = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' };

const normalizeForProfanityCheck = (word) => word
  .toLowerCase()
  .split('')
  .map((ch) => LEETSPEAK_MAP[ch] || ch)
  .join('')
  .replace(/[^a-z]/g, '');

const containsBlockedWord = (name) => {
  // Split on whitespace/punctuation so the check runs per word, not on the
  // whole name concatenated together.
  const words = name.split(/[^a-zA-Z0-9@$!]+/).filter(Boolean);
  return words.some((word) => {
    const normalized = normalizeForProfanityCheck(word);
    return normalized.length > 0 && BLOCKED_WORDS.some((bad) => normalized.includes(bad));
  });
};

export const useBballManager = () => {
  const [players, setPlayers] = React.useState([]);
  const [waitlist, setWaitlist] = React.useState([]);
  const [pausedList, setPausedList] = React.useState([]);
  const [nextTeam, setNextTeam] = React.useState([]);
  const [team1, setTeam1] = React.useState([]);
  const [team2, setTeam2] = React.useState([]);
  const [team3, setTeam3] = React.useState([]);
  const [team4, setTeam4] = React.useState([]);
  const [team1Wins, setTeam1Wins] = React.useState(0);
  const [team3Wins, setTeam3Wins] = React.useState(0);
  const [gameStartedA, setGameStartedA] = React.useState(false);
  const [gameStartedB, setGameStartedB] = React.useState(false);
  const [postMaxOutA, setPostMaxOutA] = React.useState(false);
  const [postMaxOutB, setPostMaxOutB] = React.useState(false);
  // Game clocks: clockStart*  is the timestamp the current game began (null if
  // not running); clockElapsed* is the frozen duration (seconds) of the most
  // recently finished game on that court (null once a new game starts).
  const [clockStartA, setClockStartA] = React.useState(null);
  const [clockStartB, setClockStartB] = React.useState(null);
  const [clockElapsedA, setClockElapsedA] = React.useState(null);
  const [clockElapsedB, setClockElapsedB] = React.useState(null);
  const [team1Label, setTeam1Label] = React.useState('Team 1');
  const [team2Label, setTeam2Label] = React.useState('Team 2');
  const [team3Label, setTeam3Label] = React.useState('Team 3');
  const [team4Label, setTeam4Label] = React.useState('Team 4');
  const [playerName, setPlayerName] = React.useState('');
  const [signupError, setSignupError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [maxWinsLimit, setMaxWinsLimit] = React.useState(DEFAULT_MAX_WINS);
  const [maxWinsInput, setMaxWinsInput] = React.useState('');
  const [maxWinsError, setMaxWinsError] = React.useState(null);
  const [gameMode, setGameMode] = React.useState('5x5');
  const [gameModeError, setGameModeError] = React.useState(null);
  const [swappingPlayer, setSwappingPlayer] = React.useState(null);
  const [swapError, setSwapError] = React.useState(null);
  const [pendingWinner, setPendingWinner] = React.useState(null);
  const [pendingStart, setPendingStart] = React.useState(null);
  const [pendingFirstStart, setPendingFirstStart] = React.useState(null);
  const [pendingClearAll, setPendingClearAll] = React.useState(null);
  const [pendingNotEnoughPlayers, setPendingNotEnoughPlayers] = React.useState(null);
  const [showPlayerStats, setShowPlayerStats] = React.useState(false);
  const [showActivityLog, setShowActivityLog] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [activityLog, setActivityLog] = React.useState([]);

  // Undo (single most-recent action, per action type)
  const [lastSwapUndo, setLastSwapUndo] = React.useState(null);
  const [lastWinnerUndoA, setLastWinnerUndoA] = React.useState(null);
  const [lastWinnerUndoB, setLastWinnerUndoB] = React.useState(null);

  // Lock-down mode. lockdownEnabled/lockdownCode persist; swapUnlockExpiresAt
  // and the active prompt are session-local (reset on reload) and never saved.
  // A correct swap-unlock code sets swapUnlockExpiresAt to a future timestamp
  // (now + SWAP_UNLOCK_DURATION_MS) rather than unlocking for the rest of the
  // session — swapping re-locks on its own once that time passes.
  const [lockdownEnabled, setLockdownEnabled] = React.useState(false);
  const [lockdownCode, setLockdownCode] = React.useState(null);
  const [swapUnlockExpiresAt, setSwapUnlockExpiresAt] = React.useState(null);
  const [lockdownPrompt, setLockdownPrompt] = React.useState(null);

  const saveLogCount = React.useRef(0);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addLog = React.useCallback((message) => {
    setActivityLog((prev) => {
      const entry = { id: generateId(), ts: Date.now(), message };
      const next = [entry, ...prev];
      return next.length > MAX_LOG_ENTRIES ? next.slice(0, MAX_LOG_ENTRIES) : next;
    });
  }, []);

  const getPlayerName = React.useCallback((id) => {
    const player = players.find((p) => p.id === id);
    if (!player) return '';
    return player.name;
  }, [players]);

  const listDisplayName = React.useCallback((listName) => {
    switch (listName) {
      case 'waitlist': return 'Waitlist';
      case 'pausedList': return 'Paused';
      case 'nextTeam': return 'Next Team';
      case 'team1': return team1Label;
      case 'team2': return team2Label;
      case 'team3': return team3Label;
      case 'team4': return team4Label;
      default: return listName;
    }
  }, [team1Label, team2Label, team3Label, team4Label]);

  const getTeamSize = React.useCallback(() => {
    switch (gameMode) {
      case '5x5': return 5;
      case '4x4': return 4;
      case '3x3': return 3;
      default: return 5;
    }
  }, [gameMode]);

  // --- Load saved state on mount ---
  React.useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        setPlayers((state.players || []).map((p) => ({ removed: false, ...p })));
        setWaitlist(state.waitlist || []);
        setPausedList(state.pausedList || []);
        setNextTeam(state.nextTeam || []);
        setTeam1(state.team1 || []);
        setTeam2(state.team2 || []);
        setTeam3(state.team3 || []);
        setTeam4(state.team4 || []);
        setTeam1Wins(state.team1Wins || 0);
        setTeam3Wins(state.team3Wins || 0);
        setGameStartedA(state.gameStartedA || false);
        setGameStartedB(state.gameStartedB || false);
        setPostMaxOutA(state.postMaxOutA || false);
        setPostMaxOutB(state.postMaxOutB || false);
        setTeam1Label(state.team1Label || 'Team 1');
        setTeam2Label(state.team2Label || 'Team 2');
        setTeam3Label(state.team3Label || 'Team 3');
        setTeam4Label(state.team4Label || 'Team 4');
        setMaxWinsLimit(state.maxWinsLimit || DEFAULT_MAX_WINS);
        setGameMode(state.gameMode || '5x5');
        setActivityLog(state.activityLog || []);
        setLockdownEnabled(state.lockdownEnabled || false);
        setLockdownCode(state.lockdownCode || null);
        setClockStartA(state.clockStartA || null);
        setClockStartB(state.clockStartB || null);
        setClockElapsedA(state.clockElapsedA ?? null);
        setClockElapsedB(state.clockElapsedB ?? null);
      }
      setLoading(false);
    } catch {
      setError('Failed to load saved data. Please refresh.');
      setLoading(false);
    }
  }, []);

  // --- Persist state (debounced) ---
  const snapshotRef = React.useRef(null);
  snapshotRef.current = {
    players, waitlist, pausedList, nextTeam, team1, team2, team3, team4,
    team1Wins, team3Wins, gameStartedA, gameStartedB,
    postMaxOutA, postMaxOutB, team1Label, team2Label,
    team3Label, team4Label, maxWinsLimit, gameMode,
    activityLog, lockdownEnabled, lockdownCode,
    clockStartA, clockStartB, clockElapsedA, clockElapsedB,
  };

  const saveSnapshot = React.useCallback(() => {
    if (saveLogCount.current >= MAX_SAVE_LOGS) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshotRef.current));
      saveLogCount.current += 1;
    } catch (err) {
      setError('Failed to save data to localStorage. Check storage settings.');
      console.error(err);
    }
  }, []);

  React.useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(saveSnapshot, 500);
    return () => clearTimeout(timeout);
  }, [players, waitlist, pausedList, nextTeam, team1, team2, team3, team4, team1Wins, team3Wins, gameStartedA, gameStartedB, postMaxOutA, postMaxOutB, team1Label, team2Label, team3Label, team4Label, maxWinsLimit, gameMode, activityLog, lockdownEnabled, lockdownCode, clockStartA, clockStartB, clockElapsedA, clockElapsedB, loading, saveSnapshot]);

  // Flush immediately if the tab is closed/refreshed/backgrounded before the debounce fires.
  React.useEffect(() => {
    if (loading) return;
    const flush = () => saveSnapshot();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loading, saveSnapshot]);

  // --- Keep the Next Team topped up from the waitlist ---
  const fillNextTeam = React.useCallback(() => {
    const teamSize = getTeamSize();
    if (nextTeam.length >= teamSize || waitlist.length === 0) return;
    const newNextTeam = [...nextTeam];
    const newWaitlist = [...waitlist];
    while (newNextTeam.length < teamSize && newWaitlist.length > 0) {
      newNextTeam.push(newWaitlist.shift());
    }
    setNextTeam(newNextTeam);
    setWaitlist(newWaitlist);
  }, [getTeamSize, nextTeam, waitlist]);

  React.useEffect(() => {
    fillNextTeam();
  }, [waitlist, nextTeam, gameMode, fillNextTeam]);

  // --- Signup ---
  const addPlayer = React.useCallback(() => {
    const name = playerName.trim();
    if (!name) {
      setSignupError('Please enter a valid name.');
      return;
    }
    if (name.length > 15) {
      setSignupError('Player name must be 15 characters or less.');
      return;
    }
    if (containsBlockedWord(name)) {
      setSignupError('That name isn\'t allowed. Please choose another.');
      return;
    }
    const normalizedName = name.toLowerCase();
    if (players.some((p) => !p.removed && p.name.toLowerCase() === normalizedName)) {
      setSignupError('Player name already exists.');
      return;
    }
    const newPlayer = { id: generateId(), name, wins: 0, losses: 0, winStreak: 0, removed: false };
    setPlayers((prev) => [...prev, newPlayer]);
    setWaitlist((prev) => [...prev, newPlayer.id]);
    setPlayerName('');
    setSignupError(null);
    addLog(`Signed up ${name}`);
  }, [playerName, players, addLog]);

  // Players in the Next Team can pause themselves too, so pull from both pools.
  const pausePlayer = React.useCallback((id) => {
    const name = getPlayerName(id);
    setWaitlist((prev) => prev.filter((pid) => pid !== id));
    setNextTeam((prev) => prev.filter((pid) => pid !== id));
    setPausedList((prev) => (prev.includes(id) ? prev : [...prev, id]));
    addLog(`Paused ${name}`);
  }, [getPlayerName, addLog]);

  const readyPlayer = React.useCallback((id) => {
    const name = getPlayerName(id);
    setPausedList((prev) => prev.filter((pid) => pid !== id));
    setWaitlist((prev) => [...prev, id]);
    addLog(`${name} is ready again (back on Waitlist)`);
  }, [getPlayerName, addLog]);

  // Removal "ghosts" the player: pulled out of every active list, but kept in
  // the players array (and their win/loss history) until Clear All is used.
  const removePlayer = React.useCallback((id) => {
    const name = getPlayerName(id);
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, removed: true } : p)));
    setWaitlist((prev) => prev.filter((pid) => pid !== id));
    setPausedList((prev) => prev.filter((pid) => pid !== id));
    setNextTeam((prev) => prev.filter((pid) => pid !== id));
    setTeam1((prev) => prev.filter((pid) => pid !== id));
    setTeam2((prev) => prev.filter((pid) => pid !== id));
    setTeam3((prev) => prev.filter((pid) => pid !== id));
    setTeam4((prev) => prev.filter((pid) => pid !== id));
    addLog(`Removed ${name}`);
  }, [getPlayerName, addLog]);

  const restorePlayer = React.useCallback((id) => {
    const name = getPlayerName(id);
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, removed: false } : p)));
    setWaitlist((prev) => (prev.includes(id) ? prev : [...prev, id]));
    addLog(`Restored ${name} to Waitlist`);
  }, [getPlayerName, addLog]);

  // --- Swap ---
  const listSetters = {
    waitlist: setWaitlist,
    pausedList: setPausedList,
    nextTeam: setNextTeam,
    team1: setTeam1,
    team2: setTeam2,
    team3: setTeam3,
    team4: setTeam4,
  };
  const listValues = { waitlist, pausedList, nextTeam, team1, team2, team3, team4 };

  const openSwapModal = React.useCallback((id, sourceList) => {
    const validTargetLists = [];
    if (sourceList !== 'waitlist' && waitlist.length > 0) validTargetLists.push('waitlist');
    if (sourceList !== 'pausedList' && pausedList.length > 0) validTargetLists.push('pausedList');
    if (sourceList !== 'nextTeam' && nextTeam.length > 0) validTargetLists.push('nextTeam');
    if (sourceList !== 'team1' && team1.length > 0) validTargetLists.push('team1');
    if (sourceList !== 'team2' && team2.length > 0) validTargetLists.push('team2');
    if (gameMode === '4x4' || gameMode === '3x3') {
      if (sourceList !== 'team3' && team3.length > 0) validTargetLists.push('team3');
      if (sourceList !== 'team4' && team4.length > 0) validTargetLists.push('team4');
    }

    if (validTargetLists.length === 0) {
      setSwapError('No players available to swap with.');
      return;
    }
    setSwappingPlayer({ id, sourceList, targetLists: validTargetLists });
    setSwapError(null);
  }, [waitlist, pausedList, nextTeam, team1, team2, team3, team4, gameMode]);

  // Public entry point for starting a swap. Gated by lock-down mode: if
  // enabled and the temporary swap-unlock has expired (or was never granted),
  // ask for the code first.
  const startSwap = React.useCallback((id, sourceList) => {
    const stillUnlocked = swapUnlockExpiresAt && Date.now() < swapUnlockExpiresAt;
    if (lockdownEnabled && !stillUnlocked) {
      setLockdownPrompt({ mode: 'verify', purpose: 'swap', pendingSwap: { id, sourceList }, error: null });
      return;
    }
    openSwapModal(id, sourceList);
  }, [lockdownEnabled, swapUnlockExpiresAt, openSwapModal]);

  const completeSwap = React.useCallback((targetPlayerId, targetList) => {
    if (!swappingPlayer || !swappingPlayer.targetLists.includes(targetList)) {
      setSwapError('Invalid target list or player selection for swap.');
      setSwappingPlayer(null);
      return;
    }
    const { id: sourcePlayerId, sourceList } = swappingPlayer;
    if (!listValues[sourceList]?.includes(sourcePlayerId) || !listValues[targetList]?.includes(targetPlayerId)) {
      setSwapError('Source or target player not found in specified lists.');
      setSwappingPlayer(null);
      return;
    }
    listSetters[sourceList]((prev) => prev.map((pid) => (pid === sourcePlayerId ? targetPlayerId : pid)));
    listSetters[targetList]((prev) => prev.map((pid) => (pid === targetPlayerId ? sourcePlayerId : pid)));
    setLastSwapUndo({ sourceList, sourcePlayerId, targetList, targetPlayerId });
    addLog(`Swapped ${getPlayerName(sourcePlayerId)} (${listDisplayName(sourceList)}) with ${getPlayerName(targetPlayerId)} (${listDisplayName(targetList)})`);
    setSwappingPlayer(null);
    setSwapError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swappingPlayer, waitlist, pausedList, nextTeam, team1, team2, team3, team4, getPlayerName, listDisplayName, addLog]);

  const cancelSwap = React.useCallback(() => {
    setSwappingPlayer(null);
    setSwapError(null);
  }, []);

  const undoLastSwap = React.useCallback(() => {
    if (!lastSwapUndo) return;
    const { sourceList, sourcePlayerId, targetList, targetPlayerId } = lastSwapUndo;
    // sourcePlayerId is currently sitting in targetList's slot (and vice versa).
    if (!listValues[targetList]?.includes(sourcePlayerId) || !listValues[sourceList]?.includes(targetPlayerId)) {
      setSwapError('Cannot undo — player positions have changed since the swap.');
      setLastSwapUndo(null);
      return;
    }
    listSetters[targetList]((prev) => prev.map((pid) => (pid === sourcePlayerId ? targetPlayerId : pid)));
    listSetters[sourceList]((prev) => prev.map((pid) => (pid === targetPlayerId ? sourcePlayerId : pid)));
    addLog(`Undid swap of ${getPlayerName(sourcePlayerId)} and ${getPlayerName(targetPlayerId)}`);
    setLastSwapUndo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSwapUndo, waitlist, pausedList, nextTeam, team1, team2, team3, team4, getPlayerName, addLog]);

  const dismissSwapUndo = React.useCallback(() => setLastSwapUndo(null), []);

  // --- Starting games ---
  const requestStart = React.useCallback((court) => {
    const teamSize = getTeamSize();
    const teamA = court === 'A' ? team1 : team3;
    const teamB = court === 'A' ? team2 : team4;

    if (teamA.length === 0 && teamB.length === 0) {
      if (nextTeam.length + waitlist.length >= teamSize * 2) {
        setPendingFirstStart(court);
      } else {
        setPendingNotEnoughPlayers({ court, needed: teamSize * 2 });
      }
      return;
    }

    const shortfall = teamSize - teamB.length;
    if (shortfall > 0 && nextTeam.length + waitlist.length < shortfall) {
      setPendingNotEnoughPlayers({ court, needed: teamSize });
      return;
    }
    setPendingStart(court);
  }, [getTeamSize, team1, team2, team3, team4, nextTeam, waitlist]);

  const requestStartA = React.useCallback(() => requestStart('A'), [requestStart]);
  const requestStartB = React.useCallback(() => requestStart('B'), [requestStart]);

  // Consuming the shared Next Team / Waitlist pool into a team invalidates any
  // pending winner-undo snapshot (its captured waitlist/nextTeam would be stale).
  // Pure preview of who would fill each court's challenger slot right now
  // (topped up from Next Team, then Waitlist). Used in the confirmation modal.
  const previewNextGameChallengers = React.useMemo(() => {
    const teamSize = getTeamSize();
    const buildFor = (currentChallengers) => {
      const nt = [...nextTeam];
      const wl = [...waitlist];
      const challengers = [...currentChallengers];
      while (challengers.length < teamSize && nt.length > 0) challengers.push(nt.shift());
      while (challengers.length < teamSize && wl.length > 0) challengers.push(wl.shift());
      return challengers;
    };
    return { A: buildFor(team2), B: buildFor(team4) };
  }, [nextTeam, waitlist, team2, team4, getTeamSize]);

  const confirmStart = React.useCallback((court) => {
    const challengers = previewNextGameChallengers[court];
    const consumedIds = challengers.filter((id) => !(court === 'A' ? team2 : team4).includes(id));
    const nt = nextTeam.filter((id) => !consumedIds.includes(id));
    const wl = waitlist.filter((id) => !consumedIds.includes(id));
    setNextTeam(nt);
    setWaitlist(wl);
    setLastWinnerUndoA(null);
    setLastWinnerUndoB(null);
    if (court === 'A') {
      setTeam2(challengers);
      setTeam2Label('Team 2 (Challengers)');
      setTeam1Label('Team 1 (Winners)');
      setGameStartedA(true);
      setPostMaxOutA(false);
      setClockStartA(Date.now());
      setClockElapsedA(null);
    } else {
      setTeam4(challengers);
      setTeam4Label('Team 4 (Challengers)');
      setTeam3Label('Team 3 (Winners)');
      setGameStartedB(true);
      setPostMaxOutB(false);
      setClockStartB(Date.now());
      setClockElapsedB(null);
    }
    setPendingStart(null);
  }, [previewNextGameChallengers, nextTeam, waitlist, team2, team4]);

  const startGameA = React.useCallback(() => confirmStart('A'), [confirmStart]);
  const startGameB = React.useCallback(() => confirmStart('B'), [confirmStart]);

  // Pure preview of how the Next Team + Waitlist would split into the first two
  // teams, without touching state. Used to show players in the confirmation modal.
  // Who gets INTO the first game is still strict FIFO (first in line, first
  // seated) — only which of the two teams each of them lands on is random,
  // so the earliest signups aren't always split the same predictable way.
  const previewFirstGameTeams = React.useMemo(() => {
    const teamSize = getTeamSize();
    const nt = [...nextTeam];
    const wl = [...waitlist];
    const combined = [];
    while (combined.length < teamSize * 2 && nt.length > 0) combined.push(nt.shift());
    while (combined.length < teamSize * 2 && wl.length > 0) combined.push(wl.shift());
    const shuffled = shuffleArray(combined);
    return { teamA: shuffled.slice(0, teamSize), teamB: shuffled.slice(teamSize) };
  }, [nextTeam, waitlist, getTeamSize]);

  const firstGame = React.useCallback((court) => {
    const teamSize = getTeamSize();
    if (nextTeam.length + waitlist.length < teamSize * 2) {
      setPendingNotEnoughPlayers({ court, needed: teamSize * 2 });
      setPendingFirstStart(null);
      return;
    }
    const { teamA, teamB } = previewFirstGameTeams;
    const nt = nextTeam.filter((id) => !teamA.includes(id) && !teamB.includes(id));
    const wl = waitlist.filter((id) => !teamA.includes(id) && !teamB.includes(id));
    setNextTeam(nt);
    setWaitlist(wl);
    setLastWinnerUndoA(null);
    setLastWinnerUndoB(null);
    if (court === 'A') {
      setTeam1(teamA);
      setTeam2(teamB);
      setTeam1Label('Team 1');
      setTeam2Label('Team 2');
      setTeam1Wins(0);
      setGameStartedA(true);
      setPostMaxOutA(false);
      setClockStartA(Date.now());
      setClockElapsedA(null);
    } else {
      setTeam3(teamA);
      setTeam4(teamB);
      setTeam3Label('Team 3');
      setTeam4Label('Team 4');
      setTeam3Wins(0);
      setGameStartedB(true);
      setPostMaxOutB(false);
      setClockStartB(Date.now());
      setClockElapsedB(null);
    }
    setPendingFirstStart(null);
  }, [getTeamSize, nextTeam, waitlist, previewFirstGameTeams]);

  const firstGameA = React.useCallback(() => firstGame('A'), [firstGame]);
  const firstGameB = React.useCallback(() => firstGame('B'), [firstGame]);

  const cancelStart = React.useCallback(() => {
    setPendingStart(null);
    setPendingFirstStart(null);
  }, []);

  // --- Declaring a winner ---
  const declareWinner = React.useCallback((court, winningSlot) => {
    const teamA = court === 'A' ? team1 : team3;
    const teamB = court === 'A' ? team2 : team4;
    const currentWins = court === 'A' ? team1Wins : team3Wins;
    const labelA = court === 'A' ? team1Label : team3Label;
    const labelB = court === 'A' ? team2Label : team4Label;

    const winner = winningSlot === 1 ? teamA : teamB;
    const loser = winningSlot === 1 ? teamB : teamA;
    const winnerLabel = winningSlot === 1 ? labelA : labelB;
    const newWins = winningSlot === 1 ? currentWins + 1 : 1;

    // Stop this court's clock, freezing the elapsed time of the game just played.
    const clockStart = court === 'A' ? clockStartA : clockStartB;
    const elapsedMs = clockStart ? Date.now() - clockStart : 0;
    // Floor (not round) to match the live clock display, so the frozen value
    // exactly continues from whatever was last shown while it was running.
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

    // Snapshot exactly what this action is about to change, so it can be undone.
    const participantIds = [...teamA, ...teamB];
    const participantSnapshot = players
      .filter((p) => participantIds.includes(p.id))
      .map((p) => ({ id: p.id, wins: p.wins, losses: p.losses, winStreak: p.winStreak }));
    const undoSnapshot = {
      participantSnapshot,
      prevTeamA: teamA,
      prevTeamB: teamB,
      prevWins: currentWins,
      prevLabelA: labelA,
      prevLabelB: labelB,
      elapsedMsAtDeclare: elapsedMs,
    };

    setPlayers((prev) => prev.map((p) => {
      if (winner.includes(p.id)) return { ...p, wins: p.wins + 1, winStreak: p.winStreak + 1 };
      if (loser.includes(p.id)) return { ...p, losses: p.losses + 1, winStreak: 0 };
      return p;
    }));

    const maxedOut = newWins >= maxWinsLimit;

    if (maxedOut) {
      setWaitlist((prev) => shuffleArray([...prev, ...winner, ...loser]));
    } else {
      setWaitlist((prev) => [...prev, ...loser]);
    }

    if (court === 'A') {
      setTeam1Wins(maxedOut ? 0 : newWins);
      if (maxedOut) {
        setTeam1([]);
        setTeam2([]);
        setTeam1Label('Team 1');
        setTeam2Label('Team 2');
        setPostMaxOutA(true);
      } else {
        setTeam1(winner);
        setTeam2([]);
        setTeam1Label('Team 1 (Winners)');
        setTeam2Label('Team 2');
        setPostMaxOutA(false);
      }
      setGameStartedA(false);
      setClockStartA(null);
      setClockElapsedA(elapsedSeconds);
      setLastWinnerUndoA(undoSnapshot);
    } else {
      setTeam3Wins(maxedOut ? 0 : newWins);
      if (maxedOut) {
        setTeam3([]);
        setTeam4([]);
        setTeam3Label('Team 3');
        setTeam4Label('Team 4');
        setPostMaxOutB(true);
      } else {
        setTeam3(winner);
        setTeam4([]);
        setTeam3Label('Team 3 (Winners)');
        setTeam4Label('Team 4');
        setPostMaxOutB(false);
      }
      setGameStartedB(false);
      setClockStartB(null);
      setClockElapsedB(elapsedSeconds);
      setLastWinnerUndoB(undoSnapshot);
    }
    addLog(`${winnerLabel} won on Court ${court} (${winner.map((id) => getPlayerName(id)).join(', ')}) — game time ${formatClock(elapsedSeconds)}`);
    setPendingWinner(null);
  }, [team1, team2, team3, team4, team1Wins, team3Wins, team1Label, team2Label, team3Label, team4Label, maxWinsLimit, players, getPlayerName, addLog, clockStartA, clockStartB]);

  const declareWinnerA = React.useCallback((slot) => declareWinner('A', slot), [declareWinner]);
  const declareWinnerB = React.useCallback((slot) => declareWinner('B', slot), [declareWinner]);

  const cancelWinner = React.useCallback(() => setPendingWinner(null), []);

  const undoWinner = React.useCallback((court) => {
    const snap = court === 'A' ? lastWinnerUndoA : lastWinnerUndoB;
    if (!snap) return;
    const { participantSnapshot, prevTeamA, prevTeamB, prevWins, prevLabelA, prevLabelB, elapsedMsAtDeclare } = snap;
    const participantIds = participantSnapshot.map((p) => p.id);
    // Resume the clock from where it stood when the winner was declared, rather
    // than from zero, so undoing doesn't erase the time already on the clock.
    const resumedStart = Date.now() - (elapsedMsAtDeclare || 0);

    setPlayers((prev) => prev.map((p) => {
      const snapP = participantSnapshot.find((sp) => sp.id === p.id);
      return snapP ? { ...p, wins: snapP.wins, losses: snapP.losses, winStreak: snapP.winStreak } : p;
    }));
    // Pull the participants back out of wherever the loser (and possibly winner,
    // on a max-out) landed, regardless of whether they've since been auto-filled
    // into the Next Team.
    setWaitlist((prev) => prev.filter((id) => !participantIds.includes(id)));
    setNextTeam((prev) => prev.filter((id) => !participantIds.includes(id)));

    if (court === 'A') {
      setTeam1(prevTeamA);
      setTeam2(prevTeamB);
      setTeam1Wins(prevWins);
      setTeam1Label(prevLabelA);
      setTeam2Label(prevLabelB);
      setGameStartedA(true);
      setPostMaxOutA(false);
      setClockStartA(resumedStart);
      setClockElapsedA(null);
      setLastWinnerUndoA(null);
    } else {
      setTeam3(prevTeamA);
      setTeam4(prevTeamB);
      setTeam3Wins(prevWins);
      setTeam3Label(prevLabelA);
      setTeam4Label(prevLabelB);
      setGameStartedB(true);
      setPostMaxOutB(false);
      setClockStartB(resumedStart);
      setClockElapsedB(null);
      setLastWinnerUndoB(null);
    }
    addLog(`Undid the winner declaration on Court ${court}`);
  }, [lastWinnerUndoA, lastWinnerUndoB, addLog]);

  // --- Reset / clear ---
  const [pendingResetCourt, setPendingResetCourt] = React.useState(null);
  const requestResetCourt = React.useCallback((court) => setPendingResetCourt(court), []);
  const cancelResetCourt = React.useCallback(() => setPendingResetCourt(null), []);

  const resetGameA = React.useCallback(() => {
    const names = [...team1, ...team2].map(getPlayerName);
    setWaitlist((prev) => [...prev, ...team1, ...team2]);
    setTeam1([]);
    setTeam2([]);
    setTeam1Wins(0);
    setTeam1Label('Team 1');
    setTeam2Label('Team 2');
    setGameStartedA(false);
    setPostMaxOutA(false);
    setClockStartA(null);
    setClockElapsedA(null);
    setLastWinnerUndoA(null);
    addLog(names.length
      ? `Reset Court A — sent ${names.join(', ')} back to the Waitlist`
      : 'Reset Court A');
  }, [team1, team2, getPlayerName, addLog]);

  const resetGameB = React.useCallback(() => {
    const names = [...team3, ...team4].map(getPlayerName);
    setWaitlist((prev) => [...prev, ...team3, ...team4]);
    setTeam3([]);
    setTeam4([]);
    setTeam3Wins(0);
    setTeam3Label('Team 3');
    setTeam4Label('Team 4');
    setGameStartedB(false);
    setPostMaxOutB(false);
    setClockStartB(null);
    setClockElapsedB(null);
    setLastWinnerUndoB(null);
    addLog(names.length
      ? `Reset Court B — sent ${names.join(', ')} back to the Waitlist`
      : 'Reset Court B');
  }, [team3, team4, getPlayerName, addLog]);

  const confirmResetCourt = React.useCallback(() => {
    if (pendingResetCourt === 'A') resetGameA();
    else if (pendingResetCourt === 'B') resetGameB();
    setPendingResetCourt(null);
  }, [pendingResetCourt, resetGameA, resetGameB]);

  const clearAll = React.useCallback(() => {
    setPlayers([]);
    setWaitlist([]);
    setPausedList([]);
    setNextTeam([]);
    setTeam1([]);
    setTeam2([]);
    setTeam3([]);
    setTeam4([]);
    setTeam1Wins(0);
    setTeam3Wins(0);
    setGameStartedA(false);
    setGameStartedB(false);
    setPostMaxOutA(false);
    setPostMaxOutB(false);
    setClockStartA(null);
    setClockStartB(null);
    setClockElapsedA(null);
    setClockElapsedB(null);
    setTeam1Label('Team 1');
    setTeam2Label('Team 2');
    setTeam3Label('Team 3');
    setTeam4Label('Team 4');
    setPlayerName('');
    setSignupError(null);
    setError(null);
    setMaxWinsLimit(DEFAULT_MAX_WINS);
    setMaxWinsInput('');
    setMaxWinsError(null);
    setGameMode('5x5');
    setGameModeError(null);
    setSwappingPlayer(null);
    setSwapError(null);
    setPendingWinner(null);
    setPendingStart(null);
    setPendingFirstStart(null);
    setPendingNotEnoughPlayers(null);
    setPendingResetCourt(null);
    setShowPlayerStats(false);
    setShowActivityLog(false);
    setShowSettings(false);
    setActivityLog([]);
    setLastSwapUndo(null);
    setLastWinnerUndoA(null);
    setLastWinnerUndoB(null);
    setLockdownEnabled(false);
    setLockdownCode(null);
    setSwapUnlockExpiresAt(null);
    setLockdownPrompt(null);
    saveLogCount.current = 0;
    setPendingClearAll(null);
  }, []);

  const cancelClearAll = React.useCallback(() => setPendingClearAll(null), []);

  const clearScores = React.useCallback(() => {
    setPlayers((prev) => prev.map((p) => ({ ...p, wins: 0, losses: 0, winStreak: 0 })));
    addLog('Cleared all player scores');
  }, [addLog]);

  // --- Settings ---
  const handleMaxWinsChange = React.useCallback((e) => {
    const val = e.target.value;
    setMaxWinsInput(val);
    if (/^\d+$/.test(val) && Number(val) > 0) {
      setMaxWinsLimit(parseInt(val, 10));
      setMaxWinsError(null);
    } else {
      setMaxWinsError('Enter a positive number.');
    }
  }, []);

  const totalCount = players.filter((p) => !p.removed).length;

  const teamSizeForMode = (mode) => (mode === '5x5' ? 5 : mode === '4x4' ? 4 : 3);
  // 5x5 is the only single-court mode — 4x4 and 3x3 both run two courts.
  const isTwoCourtMode = (mode) => mode === '4x4' || mode === '3x3';

  // Switching modes changes the team size. If a team is already seated (a
  // winner sitting between games), it needs to grow or shrink to match —
  // topped up from Next Team/Waitlist, or benching the excess back to the
  // Waitlist. Court B only exists in two-court modes (4x4, 3x3):
  //  - Leaving a two-court mode for 5x5: if both courts have a winner
  //    sitting, Court B's winners become Court A's challengers (the two
  //    courts' winners play each other), each side topped up as needed. If
  //    only one court has a winner sitting, it carries over alone as the new
  //    team1.
  //  - Entering a two-court mode from 5x5 with a full seated winning team:
  //    split that team fairly across both new courts (see below) rather than
  //    just benching the excess.
  //  - Switching directly between the two two-court modes (4x4 <-> 3x3):
  //    each court's own seated team just resizes independently — no merging
  //    or splitting, since both courts already exist.
  const handleGameModeChange = React.useCallback((e) => {
    const newMode = e.target.value;
    if (newMode === gameMode) return;
    setGameModeError(null);

    if (gameStartedA || gameStartedB) {
      setGameModeError('Finish or reset the current game(s) before changing modes.');
      return;
    }

    const newTeamSize = teamSizeForMode(newMode);
    const minPlayers = newTeamSize * 2;
    const availablePlayers = nextTeam.length + waitlist.length + team1.length + team2.length + team3.length + team4.length;
    if (availablePlayers < minPlayers) {
      setGameModeError(`Need at least ${minPlayers} available players for ${newMode} mode.`);
      return;
    }

    const nt = [...nextTeam];
    let wl = [...waitlist];
    const oldTeamSize = teamSizeForMode(gameMode);
    const oldIsTwoCourt = isTwoCourtMode(gameMode);
    const newIsTwoCourt = isTwoCourtMode(newMode);
    const leavingTwoCourtMode = oldIsTwoCourt && !newIsTwoCourt;
    const enteringTwoCourtMode = !oldIsTwoCourt && newIsTwoCourt;
    const bothTwoCourtModes = oldIsTwoCourt && newIsTwoCourt;
    // Going from the single-court mode to a two-court mode shrinks (or grows)
    // the seated winning team — but rather than just benching the excess,
    // split it fairly: roughly half moves over to seed Court B's Team 3, so
    // both new teams keep some of the winning roster instead of Team 1
    // keeping everyone and Team 3 starting from scratch.
    const splittingIntoTwoCourt = enteringTwoCourtMode && team1.length === oldTeamSize;

    // Seed the new team1/team2/team3 from whoever's already sitting on a court.
    let seedTeam1 = team1;
    let seedTeam2 = [];
    let seedTeam3 = null;
    let team1FromCourtB = false;
    let splitMovedCount = 0;
    if (leavingTwoCourtMode) {
      if (team1.length > 0 && team3.length > 0) {
        seedTeam2 = team3; // both courts' winners now play each other
      } else if (team1.length === 0 && team3.length > 0) {
        seedTeam1 = team3; // only Court B had a winner sitting — it carries over alone
        team1FromCourtB = true;
      }
      wl = [...wl, ...team4]; // team4 is always empty here, kept for safety
    } else if (splittingIntoTwoCourt) {
      const shuffled = shuffleArray(team1);
      const team1Count = Math.min(Math.ceil(shuffled.length / 2), newTeamSize);
      const team3Count = Math.min(shuffled.length - team1Count, newTeamSize);
      seedTeam1 = shuffled.slice(0, team1Count);
      seedTeam3 = shuffled.slice(team1Count, team1Count + team3Count);
      splitMovedCount = seedTeam3.length;
    } else if (bothTwoCourtModes && team3.length > 0) {
      seedTeam3 = team3; // resize independently below — no merge, no split
    }

    const resizeTeam = (team) => {
      const resized = [...team];
      while (resized.length < newTeamSize) {
        if (nt.length > 0) resized.push(nt.shift());
        else if (wl.length > 0) resized.push(wl.shift());
        else return null;
      }
      while (resized.length > newTeamSize) {
        wl.push(resized.pop());
      }
      return resized;
    };

    let newTeam1 = seedTeam1;
    if (seedTeam1.length > 0 && seedTeam1.length !== newTeamSize) {
      const resized = resizeTeam(seedTeam1);
      if (!resized) {
        setGameModeError(`Not enough available players to fill Team 1 for ${newMode} mode.`);
        return;
      }
      newTeam1 = resized;
    }

    let newTeam2 = seedTeam2;
    if (seedTeam2.length > 0 && seedTeam2.length !== newTeamSize) {
      const resized = resizeTeam(seedTeam2);
      if (!resized) {
        setGameModeError(`Not enough available players to fill Team 2 for ${newMode} mode.`);
        return;
      }
      newTeam2 = resized;
    }

    let newTeam3 = seedTeam3;
    if (seedTeam3 && seedTeam3.length !== newTeamSize) {
      const resized = resizeTeam(seedTeam3);
      if (!resized) {
        setGameModeError(`Not enough available players to seed Team 3 for ${newMode} mode.`);
        return;
      }
      newTeam3 = resized;
    }

    // fillNextTeam only ever tops the Next Team up, never trims it — if the new
    // mode's team size is smaller, bench the overflow back to the Waitlist now.
    while (nt.length > newTeamSize) {
      wl.push(nt.pop());
    }

    setNextTeam(nt);
    setWaitlist(wl);
    setTeam1(newTeam1);
    setTeam2(newTeam2);
    if (team1FromCourtB) setTeam1Label('Team 1 (Winners)');
    if (newTeam2.length > 0) setTeam2Label('Team 2');
    setGameMode(newMode);
    // A mode change reshuffles the rosters, so any clock reading from before
    // no longer describes "this game" — clear both courts' clocks.
    setClockStartA(null);
    setClockStartB(null);
    setClockElapsedA(null);
    setClockElapsedB(null);

    if (leavingTwoCourtMode) {
      setTeam3([]);
      setTeam4([]);
      setTeam3Wins(0);
      setTeam3Label('Team 3');
      setTeam4Label('Team 4');
      setGameStartedB(false);
      setPostMaxOutB(false);
    } else if (newTeam3) {
      setTeam3(newTeam3);
      setTeam4([]);
      setTeam3Wins(0);
      setTeam3Label('Team 3');
      setTeam4Label('Team 4');
      setGameStartedB(false);
      setPostMaxOutB(false);
    }

    if (newTeam2.length > 0) {
      addLog(`Switched to ${newMode} mode — Court A and Court B winners now face off as ${team1Label} vs Team 2`);
    } else if (splittingIntoTwoCourt && newTeam3) {
      addLog(`Switched to ${newMode} mode — split ${team1Label} to seed Team 3 on Court B (${splitMovedCount} player(s) moved, each side topped up from the Next Team)`);
    } else if (bothTwoCourtModes && newTeam3) {
      addLog(`Switched to ${newMode} mode — resized Court A's and Court B's seated teams`);
    } else {
      const sizeDiff = newTeam1.length - seedTeam1.length;
      if (sizeDiff !== 0) {
        addLog(sizeDiff > 0
          ? `Switched to ${newMode} mode — added ${sizeDiff} player(s) to ${team1Label}`
          : `Switched to ${newMode} mode — moved ${-sizeDiff} player(s) from ${team1Label} to the Waitlist`);
      } else {
        addLog(`Switched game mode to ${newMode}`);
      }
    }
  }, [gameMode, gameStartedA, gameStartedB, nextTeam, waitlist, team1, team2, team3, team4, team1Label, addLog]);

  // --- Lock-down mode ---
  const openEnableLockdownPrompt = React.useCallback(() => {
    setLockdownPrompt({ mode: 'set', purpose: 'enable', error: null });
  }, []);

  const openDisableLockdownPrompt = React.useCallback(() => {
    setLockdownPrompt({ mode: 'verify', purpose: 'disable', error: null });
  }, []);

  const toggleLockdown = React.useCallback(() => {
    if (lockdownEnabled) {
      openDisableLockdownPrompt();
    } else {
      openEnableLockdownPrompt();
    }
  }, [lockdownEnabled, openEnableLockdownPrompt, openDisableLockdownPrompt]);

  const cancelLockdownPrompt = React.useCallback(() => setLockdownPrompt(null), []);

  const submitLockdownCode = React.useCallback((code) => {
    setLockdownPrompt((prompt) => {
      if (!prompt) return prompt;
      const { mode, purpose, pendingSwap } = prompt;

      if (mode === 'set') {
        if (!/^\d{4}$/.test(code)) {
          return { ...prompt, error: 'Enter a 4-digit code.' };
        }
        setLockdownCode(code);
        setLockdownEnabled(true);
        setSwapUnlockExpiresAt(null);
        addLog('Lock-down mode enabled.');
        return null;
      }

      // mode === 'verify'
      const isAdmin = code === ADMIN_LOCKDOWN_CODE;
      const isCorrect = code === lockdownCode;
      if (!isAdmin && !isCorrect) {
        return { ...prompt, error: 'Incorrect code.' };
      }

      if (isAdmin) {
        setLockdownEnabled(false);
        setLockdownCode(null);
        setSwapUnlockExpiresAt(null);
        addLog('Lock-down mode reset with the admin code.');
        if (purpose === 'swap' && pendingSwap) {
          openSwapModal(pendingSwap.id, pendingSwap.sourceList);
        }
        return null;
      }

      if (purpose === 'disable') {
        setLockdownEnabled(false);
        setLockdownCode(null);
        setSwapUnlockExpiresAt(null);
        addLog('Lock-down mode disabled.');
      } else if (purpose === 'swap') {
        setSwapUnlockExpiresAt(Date.now() + SWAP_UNLOCK_DURATION_MS);
        addLog('Swaps unlocked for 2 minutes.');
        if (pendingSwap) {
          openSwapModal(pendingSwap.id, pendingSwap.sourceList);
        }
      }
      return null;
    });
  }, [lockdownCode, openSwapModal, addLog]);

  const maxWins = React.useMemo(() => {
    const active = players.filter((p) => !p.removed);
    return active.length ? Math.max(...active.map((p) => p.wins), 0) : 0;
  }, [players]);
  const topWinners = players.filter((p) => !p.removed && p.wins === maxWins).map((p) => p.name);

  return {
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
    pendingStart,
    pendingFirstStart,
    pendingClearAll,
    pendingNotEnoughPlayers,
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
    setPendingClearAll,
    setPendingNotEnoughPlayers,
    setPendingWinner,
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
    resetGameA,
    resetGameB,
    requestResetCourt,
    cancelResetCourt,
    confirmResetCourt,
    clearAll,
    cancelClearAll,
    clearScores,
    handleMaxWinsChange,
    handleGameModeChange,
    getPlayerName,
    getTeamSize,
    setShowPlayerStats,
    setShowActivityLog,
    setShowSettings,
    toggleLockdown,
    submitLockdownCode,
    cancelLockdownPrompt,
  };
};

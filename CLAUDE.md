# BBALL — RFCN Pickup Basketball Game Manager

A React/Vite app for running pickup basketball rotations at RFCN: signup,
waitlist, "Next Team" auto-fill, winner-stays courts, multiple game modes,
player stats, and a bunch of small-gym-specific rules described below.

## History / origin

This project is a rewrite of a single-file HTML app (plain `React.createElement`
calls, no build step, React 18 UMD + Tailwind via CDN) originally published at
https://forgedfreedom.github.io/BBALL/. That file is the reference for "what
the app used to do" but its logic has bugs the rewrite intentionally does not
carry forward (see git history / conversation log for specifics — the
short version is the original's mode-switching and winner-stays logic had
several edge-case bugs that are fixed here).

The user attempted a first pass at splitting the single file into this
Vite + React component structure but it didn't actually run — `App.jsx` was
still the default `create-vite` template and was never wired to the rest of
the code (the real app lived, unused, in `main.jsx`). A full rebuild fixed
the wiring and a number of latent bugs, then added the features below on top.
**As of this writing the app is fully functional and has been manually
verified end-to-end** (see "How changes were verified" below) — it is not a
work-in-progress skeleton.

**Not yet connected to git/GitHub.** Target remote:
https://github.com/ForgedFreedom/BBALL (same repo that hosts the published
single-file version above). This needs to be set up — ask the user how they
want the old single-file history handled before pushing.

## Stack

- React 19 + Vite 7, plain JS (`.jsx`, no TypeScript).
- **No Tailwind** — despite the original single-file app using the Tailwind
  CDN script, this rewrite uses a single hand-written stylesheet
  (`src/style.css`). Don't reach for Tailwind classes; they won't do anything.
- No backend — all state lives in memory and is persisted to
  `localStorage` (key `bballManagerState`), debounced 500ms + flushed on
  `pagehide`/tab-hidden.
- No test framework configured. `eslint.config.js` is the only automated
  check (`npm run lint`). See "How changes were verified" for how to actually
  exercise the app.

## Architecture

```
index.html → src/main.jsx → src/App.jsx → src/components/*.jsx
                                  │
                                  └── src/hooks/useBballManager.jsx  (all state + logic)
```

- **`src/hooks/useBballManager.jsx`** is the entire application brain — one
  large hook holding all state and every state-transition function. This is
  intentional; the "manageable design" the user wanted is the
  hook/components split, not further decomposition of the hook itself.
  Don't casually split it into multiple hooks/contexts without discussing it
  — a lot of the logic below is interdependent (e.g. mode-switching touches
  clocks, undo snapshots, and roster arrays all at once).
- **`src/App.jsx`** wires the hook's return values into the components and
  owns cross-cutting layout (header, panels, modal rendering). It's the only
  place that composes multiple components together.
- **`src/components/*.jsx`** are mostly presentational, taking data + handler
  props. `Court.jsx` is the biggest one (renders one court, generic over A/B).
- Modal components (`*Modal.jsx`) all wrap the shared `Modal.jsx`
  (note the capital M — was previously `modal.jsx`, lowercase, which broke on
  case-sensitive filesystems/CI; keep it capitalized).

## Domain model (state in the hook)

- `players`: `{id, name, wins, losses, winStreak, removed}[]` — the full
  roster including "ghosted" (removed) players; never deleted except by
  Clear All.
- `waitlist`, `pausedList`, `nextTeam`: arrays of player **ids**. `waitlist`
  is strict FIFO order — index 0 is next to be pulled into `nextTeam` by
  `fillNextTeam`. In the UI, `PlayerLists.jsx` only renders the front 5 of a
  long Waitlist by default (a `showFullWaitlist` boolean local to that
  component, not persisted — always starts collapsed on load, same as the
  other collapsible panels), with a "Show N More" toggle to reveal the rest.
  Paused/Next Team aren't collapsed since they don't tend to grow long.
- `team1`/`team2` (Court A) and `team3`/`team4` (Court B): arrays of player
  ids. Team3/Team4 are only ever populated in a two-court mode (`4x4` or
  `3x3` — see "Game modes & team sizes" below); `5x5` is single-court.
- `team1Wins`/`team3Wins`: the current win-streak of whoever occupies the
  "Team 1"/"Team 3" (winners) slot on each court.
- `gameStartedA/B`, `postMaxOutA/B`: per-court status flags.
- `team1Label..team4Label`: display labels, dynamically suffixed with
  `" (Winners)"` / `" (Challengers)"` — see `stripSuffix()` in `Court.jsx`
  for how the "X Won" buttons strip these back off.
- `maxWinsLimit`: when a team's streak hits this, both teams on that court
  get shuffled back into the waitlist and the streak resets (a "max-out").
- `activityLog`: a **rolling** list — newest entry unshifted to the front,
  trimmed back down to 200 whenever it would exceed that (`MAX_LOG_ENTRIES`
  in the hook), so it's always "the most recent 200," not a hard stop.
  Persisted, cleared by Clear All. Logs swap/pause/ready/remove/restore/
  signup/winner/reset-court/mode-change/lockdown events. Winner entries
  include that game's duration (`— game time mm:ss`, from the same clock
  shown live on the court); reset-court entries name the players sent back
  to the Waitlist. Does **not** log every single click — see the hook for
  exactly what calls `addLog`.
- Undo snapshots: `lastSwapUndo`, `lastWinnerUndoA`, `lastWinnerUndoB` — each
  a **single-slot, most-recent-action-only** undo (not a history stack), per
  the user's explicit choice. They get invalidated (cleared) by whatever
  other action would make restoring them unsafe — e.g. starting a new game
  clears both courts' winner-undo snapshots because it consumes the shared
  Next Team/Waitlist pool those snapshots assumed was untouched.
- Lock-down: `lockdownEnabled`/`lockdownCode` persist; `swapUnlockExpiresAt`
  and the active `lockdownPrompt` do not (session-local, reset on reload).
- Clocks: `clockStartA/B` (a real timestamp, not a counter — this is why the
  clock survives a page reload mid-game) and `clockElapsedA/B` (frozen
  seconds once a winner is declared).

## Key business rules (not obvious from skimming the code)

These were negotiated in detail with the user across several turns — read
this before changing related logic, since the "obvious" simpler
implementation is usually the one that was explicitly rejected.

**Game modes & team sizes.** 3x3 (3), 4x4 (4), 5x5 (5). `5x5` is the only
single-court mode; both `4x4` and `3x3` run two courts (Court B populates
`team3`/`team4`). `isTwoCourtMode(mode)` in the hook (currently `mode ===
'4x4' || mode === '3x3'`) is what mode-switching logic checks; `App.jsx`
renders Court B off the equivalent inline check — keep both in sync if a
third two-court mode is ever added. Next Team auto-fills to the current
mode's team size from the Waitlist via an effect (`fillNextTeam`).

**Winner-stays flow.** Declaring a winner keeps that team seated (as
"Team 1"/"Team 3", labeled "(Winners)"), sends the loser to the Waitlist, and
(unless maxed out) leaves the challenger slot empty for "Start Next Game" to
fill from Next Team/Waitlist. The confirmation modals for both "Start Next
Game" and "Start First Game" show the actual player names, computed via
`previewNextGameChallengers`/`previewFirstGameTeams` — these are pure
preview functions that mirror the real fill logic exactly, so what the modal
shows is guaranteed to match what actually happens on confirm.

**First game team assignment is randomized.** `previewFirstGameTeams`
selects *who* gets into a court's first game strictly FIFO (first in line,
first seated — teamSize × 2 players from Next Team then Waitlist), but then
shuffles that selected group before splitting it in half, so which of the
two teams each player lands on is random rather than always "first half in
line = Team 1." A court's "first game" is identified the same way the code
already did — `team1`/`team2` (or `team3`/`team4`) both empty — which
naturally also covers Court B's first game and any court after Reset Court,
not just the literal first game of a session; that broader scope was a
deliberate choice, not an oversight.

**Mode switching resizes seated teams.** Changing `gameMode` while a team is
sitting mid-tournament (not empty, `gameStarted*` false) resizes it to the
new team size rather than leaving it mismatched. `isTwoCourtMode()` (see
above) drives which of these branches applies — the logic is symmetric
across both two-court modes, not 4x4-specific:
- Generic case: top up from Next Team → Waitlist, or bench the excess back
  to the Waitlist.
- **Leaving a two-court mode (4x4 or 3x3) for 5x5, with winners on both
  courts**: Court A's and Court B's winners now play each other — Court B's
  team becomes the new Team 2, each side topped up by however many it's
  short.
- **Leaving a two-court mode with a winner on only one court**: that team
  carries over alone as the new Team 1 (and picks up the "(Winners)" label
  if it came from Court B).
- **Entering a two-court mode (4x4 or 3x3) from 5x5 with a full 5-player
  winning team**: split it fairly rather than just benching the excess —
  shuffle, then send `min(ceil(5/2), newTeamSize)` to stay on Team 1 and the
  rest (capped at `newTeamSize`) to seed Court B's Team 3, topping up
  whichever side is short from Next Team/Waitlist. In practice this is a 3/2
  split for both 4x4 and 3x3 (Team 1 keeps 3, Team 3 seeds with 2). This was
  an explicit fairness rule from the user ("both new teams should keep some
  of the winning roster, not just Team 1"), not a general algorithm — it
  only applies to this specific kind of transition.
- **Switching directly between the two two-court modes (4x4 ↔ 3x3)**: no
  merge or split — Court A's and Court B's seated teams each just resize
  independently to the new team size, since both courts already exist.
- The min-player gate before allowing any switch checks *available* players
  (Next Team + Waitlist + everyone currently seated), not total signups, so
  paused/removed players don't count toward unlocking a bigger mode.

**Undo (single-step, per action type).**
- Swap: shows a dismissible banner ("Swapped X and Y — Undo/Dismiss") until
  another swap happens or it's dismissed.
- Winner declaration: an "Undo Last Result" button appears under Team 1 on
  that court. Restores the exact pre-declare roster, labels, win streak, and
  each participant's individual wins/losses/streak (snapshotted per-player,
  not just reverted by formula, so it's correct even if the same player is
  involved in other games between the two events). Also resumes that court's
  clock from where it was at declare time (not from zero).
- "Wrong player added to a team" is explicitly **not** a separate undo
  feature — the user decided fixing that is just "swap the right person in,
  and undo the swap if that was wrong too."

**Player-name profanity filter.** Signup (`addPlayer`) rejects names that
contain a blocked word, via `containsBlockedWord()`/`BLOCKED_WORDS` at the
top of the hook. Checked per **word** (split on whitespace/punctuation), not
against the whole name glued together, specifically to avoid cross-word
false positives (e.g. "Rob Itch" won't trip the "bitch" entry). Each word is
lowercased and run through a small leetspeak substitution map (`0→o, 1→i,
3→e, 4→a, 5→s, 7→t, @→a, $→s, !→i`) before a substring check, so casual
obfuscation like "a$$" or "sh1t" is still caught.
- **Known trade-off**: it's substring matching, not exact-word matching, so
  it can false-positive on a legitimate word/name that happens to contain a
  blocked one — e.g. "Scunthorpe" contains "cunt", and "Dick" (a common
  short form of Richard) is itself on the list. This was an accepted
  trade-off for a small, casual local app rather than something to solve
  with fuzzy/whitelist logic; if a real player hits this, the simplest fix
  is trimming the specific word from `BLOCKED_WORDS`.
- Same "casual deterrent, not a real moderation system" trust model as the
  lock-down code — see the security note below.

**Ghost removal, not deletion.** "Remove" pulls a player out of every active
list but keeps their `players` row (with `removed: true`) so their win/loss
history survives in Player Stats (shown dimmed, tagged "(Removed)"). A
"Restore" button there un-ghosts them back onto the Waitlist. Only Clear All
actually deletes player records.

**Lock-down mode.** A settings toggle that gates the *swap* action (only)
behind a 4-digit code:
- Turning it on prompts you to set the code.
- The first swap attempt while locked prompts for the code; a correct entry
  unlocks swapping for the next 2 minutes (`SWAP_UNLOCK_DURATION_MS` in the
  hook), tracked via a `swapUnlockExpiresAt` timestamp rather than a
  session-long boolean — swapping re-locks itself once that time passes,
  without needing a reload. Not persisted, so it's also cleared by a reload
  regardless. This replaced an earlier "unlocked for the rest of the browser
  session" behavior per explicit user preference, once they noticed in
  testing that an unlock was otherwise equivalent to just disabling
  lock-down for the remainder of the session.
- Turning lock-down off also requires the code.
- `8989` is a hardcoded admin code that works anywhere a code is requested
  and always fully resets lock-down (disables it + clears the set code) —
  it's a global escape hatch, not scoped to one flow.
- Clear All always wipes lock-down state.
- **Security note the user has been told**: the code is stored in plain
  text in `localStorage`, same trust model as the rest of the app's data.
  It's a casual deterrent against mis-clicks, not a real access control.

**Game clock.** Starts on confirmed "Start Game" (first or next), stops and
freezes on winner declaration, resets on a fresh game / court reset / Clear
All / any mode switch. Uses `Math.floor` consistently (not `round`) so the
frozen value always exactly continues from whatever the live ticking display
last showed. The frozen duration is also written into that game's activity
log entry (`— game time mm:ss`).

## Non-goals / things explicitly deferred

- No multi-step undo history — single most-recent action per type, by
  request.
- No real auth/security model beyond the lock-down code (see above).
- The original single-file app's "4x4-split-a-live-court" migration feature
  (converting a running 5v5 into two 4v4 courts mid-game) was intentionally
  **not** ported — deemed too complex/bug-prone for the value; the
  mode-switch resize rules above are the replacement.

## How changes were verified

There is no automated test suite. Every feature above was verified by
actually running the app and driving it with Playwright against the live
dev server — not just `npm run build`/`npm run lint` passing. When making
further changes, follow the same pattern:

```bash
npm run dev -- --port 5173 --strictPort &   # background it
# poll until it's up, then drive it with a throwaway Playwright script
```

Playwright isn't a project dependency (deliberately — it's a dev-time
verification tool, not something the app ships with). Install it ad hoc into
this project's `node_modules` when needed:

```bash
npm install --no-save playwright
npx playwright install chromium   # first time only
```

Write a throwaway `.mjs` script that launches Chromium, drives the UI
(`page.click`, `page.fill`, `page.selectOption`, etc. — real controlled-input
events, not `eval`ing `.value`), and asserts on the rendered DOM text. Put it
in the project root (module resolution needs it there to find
`node_modules/playwright`), run it with plain `node`, then delete it — don't
leave test scripts committed. Kill the dev server and `rm -rf dist` when
done (`lsof -ti:5173 -sTCP:LISTEN | xargs -r kill`).

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # production build to dist/
npm run lint     # eslint . — should always be clean before calling something done
```

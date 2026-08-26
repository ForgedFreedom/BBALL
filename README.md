# BBALL — RFCN Pickup Basketball Game Manager

A React app for running pickup basketball rotations: player signup, a
waitlist that auto-fills a "Next Team," winner-stays courts, 3x3/4x4/5x5
game modes, player win/loss stats, a per-court game clock, an activity log,
and an optional lock-down code to keep swaps from happening by accident.

Live version: https://forgedfreedom.github.io/BBALL/ *(currently the older
single-file version — this repo is the rewrite; see below)*

## Running it locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

```bash
npm run build   # production build to dist/
npm run lint    # eslint
```

## What it does

- **Signup & rotation** — add players, they land on the Waitlist and
  auto-fill into "Next Team" up to the current mode's team size.
- **Courts** — Court A always; Court B appears in 4x4 mode. Winning teams
  stay on the court; the loser goes back to the Waitlist.
- **Game modes** — 3x3, 4x4, 5x5, switchable mid-session with rules for
  fairly resizing/merging seated teams (see `CLAUDE.md` for the details).
- **Max wins** — a team that hits the configured win streak gets retired
  back into the rotation.
- **Player stats** — win/loss/streak table with a leader-board line;
  "removed" players are ghosted (hidden from active lists, kept in stats)
  and can be restored.
- **Undo** — the most recent swap or winner declaration can be undone.
- **Lock-down mode** — an optional 4-digit code that gates the swap action,
  for when you want to stop people from freely rearranging teams.
- **Activity log & game clock** — a running log of roster changes, and a
  digital clock per court that starts on tip-off and stops when a winner is
  declared.

Everything persists to the browser's `localStorage` — no backend, no
accounts.

## Project docs

See `CLAUDE.md` for architecture notes, the domain model, and the (fairly
detailed) business rules behind game-mode switching, undo, and lock-down
mode — worth reading before making changes.

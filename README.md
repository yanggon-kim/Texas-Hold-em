# Texas Hold'em — Learn Step by Step

A web-deployed **learning game** that teaches Texas Hold'em to a complete
novice, one skill at a time. You progress through levels from low → high, and
each level uses lots of **repetition (drills)** with instant feedback to lock in
the rules and strategy before unlocking the next level.

> Built as a personal learning tool. See [`docs/game-development.md`](docs/game-development.md)
> for the full design, and [`docs/beginner-guide.md`](docs/beginner-guide.md) for
> the rules & strategy reference the level content is based on.

## What's included

Rules fluency (Milestones M0–M3) and game flow (M4):

| Level | Title | What you drill |
|-------|-------|----------------|
| 1 | Cards & Suits | Recognise all 52 cards, suits, and colours |
| 2 | Hand Rankings | Name the 10 hands and compare two hands |
| 3 | Make the Best Hand | Pick the best 5-card hand from 7 cards |
| 4 | Table & Flow | Button, blinds, and the four betting rounds |
| 5 | Betting Actions | Check, bet, call, raise, fold — and when each applies |
| 6 | Position | Why acting later wins; early vs. late play |
| 7 | Starting Hands | Which two cards to play, by tier and position |
| 8 | Outs & Pot Odds | Counting outs, the Rule of 2 & 4, pot-odds calls |
| 9 | Reading the Board | The nuts, flush threats, and paired boards |

Each level: a short intro → a **Learn (study) stage** with definitions, worked
examples, and **Korean translations** of the key terms → randomized drills with
instant Coach feedback → master it to unlock the next. Miss a question and you
get an extra practice rep, and you can **Practice again** any time to drill by
repetition. Progress is saved in your browser (`localStorage`).

Two practice modes per level: a **mastery session** (gates the next level) and
**∞ Endless practice** (unlimited questions). A **📊 stats dashboard** tracks
per-skill accuracy, questions answered, a recent-session trend, and flags your
weakest area.

Level 10 (full table play vs. AI opponents) is planned next — see the design doc.

## Tech

- **React + Vite + TypeScript**, styled with **Tailwind CSS v4**
- A pure, UI-free **poker engine** (`src/engine/`) — deck, hand evaluator
  (best 5-of-7 with tie-breaking), and a verified hand factory — fully unit-tested
- Client-only: no backend, no database

## Develop

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm test         # run the engine unit tests (Vitest)
npm run build    # typecheck + production build to dist/
npm run preview  # preview the production build locally
```

## Deploy (Vercel)

1. Push this repo to GitHub (already done on the working branch).
2. In your Vercel dashboard: **Add New → Project → Import** this repo.
3. Vercel auto-detects Vite — no settings needed:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy. No environment variables or secrets are required (it's a static SPA).

## Project layout

```
src/
  engine/        pure poker logic (card, deck, handEvaluator, handFactory, odds)
  drills/        per-level question generators + the level registry
  state/         progress tracking + localStorage persistence
  components/    React UI (cards, level map, intro, drill screen, coach)
tests/           Vitest unit tests for the engine
docs/            design doc + beginner guide
```

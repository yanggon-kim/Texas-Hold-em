# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A client-only Texas Hold'em **learning game** (React 18 + Vite 6 + TypeScript + Tailwind CSS v4). It has 10 levels: levels 1–9 are multiple-choice drills, and level 10 is a live no-limit table against bots with a coach. There is no backend; progress is kept in `localStorage`. It deploys to Vercel as a static SPA (default `base: '/'`, no env vars).

The whole app is in **Korean**: UI text, drill prompts, explanations, card rank names in text (`RANK_NAME` in `src/engine/card.ts`, e.g. 퀸; card faces in `PlayingCard.tsx` show J/Q/K/A instead), code comments, test names and commit messages. Keep new content in Korean as well.

Design docs: `docs/game-development.md` (curriculum, milestones, remaining nice-to-haves) and `docs/beginner-guide.md` (the rules and strategy content the levels are based on).

## Commands

```bash
npm run dev          # dev server at http://localhost:5173
npm test             # vitest run (all tests in tests/**/*.test.ts, node env)
npx vitest run tests/game.test.ts        # a single test file
npx vitest run -t "사이드 팟"             # tests whose name matches a pattern
npm run typecheck    # tsc -b --noEmit
npm run build        # tsc -b && vite build → dist/
```

There is no linter. `tsconfig.app.json` is strict and sets `noUnusedLocals` and `noUnusedParameters`, so unused symbols fail `npm run build`. Tests are included in the type check.

## Deployment

The GitHub repo (`origin`, branch `main`) is connected to Vercel. **Every push to `main` builds and publishes the live web game automatically**, so a push is a production release. Before pushing to `main`, run `npm test` and `npm run build` (a failed build breaks the deploy). Other branches typically get Vercel preview deployments. Only commit or push when the user asks.

## Architecture

There are three layers. Dependencies point downward only:

1. **`src/engine/`**: pure poker logic with no React imports, fully unit-tested.
   - `handEvaluator.ts`: best 5 of 7 cards, `HandCategory` enum, `CATEGORY_NAME` (Korean names), score comparison and tie-breaks.
   - `handFactory.ts`: builds hands of a *requested* category (`makeHandOfCategory`, `make7OfCategory`). Each result is checked against the real evaluator, and the factory retries until it matches, so drills can rely on the category being exact.
   - `deck.ts`: also exports `mulberry32`, the seeded RNG used throughout tests.
   - `game.ts`: hand engine for level 10 (blinds, streets, min-raise, side pots, showdown). `applyAction(prev, action)` returns a new `GameState`. `bot.ts` has `decideBotAction` (difficulties `easy` / `normal` / `hard`) and `coachTip`.
   - `startingHands.ts`, `board.ts` and `odds.ts` support the strategy levels 7–9.
   - Level 10 teaching layer: `fastEval.ts` (integer-card evaluator for simulations; `tests/table.test.ts` checks it agrees with `evaluateHand`), `equity.ts` (Monte Carlo equity, exact final-category odds on the flop and turn, outs), `coach.ts` (`coachAdvice` builds the sectioned explanation and recommendation), `narration.ts` (per-action explanations of bots and the human from public info only), and `glossary.ts` (a `Glosser` adds "용어(뜻)" the first time a term appears in a panel; pass the particle through `g.t(term, '이/가')` rather than wrapping the glossed string in `josa`).
   - `josa.ts`: picks Korean particles (이/가, 은/는, 을/를, 과/와, 으로/로) from the final sound of the word before them, including digits and Latin letters. **Use `josa(word, '이/가')` whenever a variable is followed by a particle in Korean text.** Never hardcode the particle.

2. **`src/drills/`**: curriculum content.
   - `levels.ts`: the `LEVELS: LevelDef[]` registry. Each level has `concept` bullets, an optional `lesson` (a `LessonGenerator`), and either `generate` plus `drillsPerSession`/`masteryNeeded` (a quiz level) or `play: true` (the live table).
   - `levelNN_*.ts`: one `DrillGenerator = (rng) => Drill` per level. Card-based levels generate hands with `handFactory`. Rule-knowledge levels (4–6) define fixed `QuizItem[]` banks and use `quizDrill()` from `quiz.ts`.
   - `types.ts` holds the shared types plus the `shuffledOptions` and `sampleDistinct` helpers. **Always take randomness from the `rng` argument**, never `Math.random`, so that tests can seed the generators.
   - `lessons.ts` holds the lesson cards. `LessonDiagram` kinds are rendered by `components/LessonDiagram.tsx`.

3. **`src/state/progress.ts` + `src/components/`**: UI.
   - `useProgress()` stores the per-level `LevelProgress` under the `localStorage` key `th-learn-progress-v1`. `normalize()` fills in missing fields and levels, so old saves keep working. When you add a field, give it a default in `emptyLevel()`; don't bump the key.
   - `TableScreen.tsx` stores the game and its narration feed together. Bot turns wait for the **다음 ▶** button (or advance on a timer when step mode is off), and the rest of the hand fast-forwards once the human folds. `App.tsx` is a small view-state machine (`map → intro → lesson → drill | table`, plus `stats`) with no router. `DrillScreen` runs in `'mastery'` or `'endless'` mode. It is remounted through `sessionKey` for each new session and re-asks missed drills.

### Adding or changing a level

Write the generator in `src/drills/levelNN_*.ts` and a lesson in `lessons.ts`, then register both in `LEVELS`. `tests/lessons.test.ts` asserts that every level has a lesson. `tests/quizLevels.test.ts` generates each level's drills 60 times with seeded RNGs and checks that each one is well-formed. Add a new generator to that list.

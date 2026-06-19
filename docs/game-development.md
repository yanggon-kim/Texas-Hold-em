# 🎮 Texas Hold'em Learning Game — Development Design Document

A web-deployed, single-player **learning game** that teaches Texas Hold'em to a
complete novice, one step at a time. The player progresses through **levels from
low → high**, and each level uses **lots of repetition (drills)** to lock in the
rules and strategy before unlocking the next level.

> **Audience:** built for a personal learner (the author) who wants to go from
> "knows nothing" → "plays a confident, basic-strategy game."

---

## 1. Vision & Design Principles

1. **Learn by doing, not by reading.** Every concept is taught through
   interactive drills, not walls of text.
2. **One concept at a time.** Each level isolates a single skill so the learner
   is never overwhelmed.
3. **Repetition builds mastery.** A level is only "passed" after the learner
   answers enough drills correctly (a mastery threshold).
4. **Immediate feedback.** Every answer shows ✅/❌ instantly with a short
   explanation of *why*.
5. **Progress is visible & saved.** A map/path shows locked vs. unlocked levels;
   progress persists between sessions.
6. **Safe to fail.** No real money, no penalties — just practice and feedback.

---

## 2. Learning Curriculum (Levels: low → high)

Each level has: **a short lesson → repetition drills → a mastery check** that
unlocks the next level.

| Level | Title | Skill learned | Drill type |
|-------|-------|---------------|------------|
| **1** | Cards & Suits | Recognize the 52 cards, 4 suits, 13 ranks | Flashcard / "name this card" |
| **2** | Hand Rankings | Memorize the 10 hands, strongest → weakest | "Which hand wins?" pairs |
| **3** | Make the Best Hand | Pick the best 5-card hand from 7 cards | Board + hole cards puzzle |
| **4** | Table & Flow | Dealer button, blinds, the 4 betting rounds | Order-the-phases / fill-in |
| **5** | Betting Actions | check / bet / call / raise / fold in context | "What can you do here?" |
| **6** | Position | Why acting later is better; seat names (UTG→BTN) | Identify position / advantage |
| **7** | Starting Hands | Pre-flop hand selection by position | Play / Fold chart drills |
| **8** | Outs & Pot Odds | Count outs, basic odds, call/fold math | Count-the-outs + decision |
| **9** | Reading the Board | Draws, made hands, what beats you | "Best possible hand?" reads |
| **10** | Full Hands vs. AI | Apply everything against simple bot opponents | Guided full-table play + coach |

> Levels 1–3 = **rules fluency**. Levels 4–6 = **game flow**. Levels 7–9 =
> **strategy**. Level 10 = **integration**.

---

## 3. Level Structure (repeated pattern for every level)

```
Level N
├── Intro card        (1 screen: the concept in ~3 bullets)
├── Worked example    (1–2 fully explained examples)
├── Drill set         (10–20 randomized questions — the repetition core)
│     ├── Question
│     ├── Answer + instant feedback (why it's right/wrong)
│     └── Running score
├── Mastery check     (e.g. 8/10 correct, or streak of N)
└── Unlock next level + award progress
```

**Repetition mechanics:**
- Questions are **randomly generated** so the set never feels memorized.
- **Wrong answers are re-queued** (mistakes come back more often — light spaced
  repetition).
- A level can be **replayed** any time to keep skills sharp.
- Optional **"endless drill"** mode per skill for grinding.

---

## 4. Game Features

### Core (MVP)
- Level map / progress path (locked vs. unlocked)
- The 10 levels with drills + feedback
- Score & mastery tracking per level
- Progress saved locally (resume where you left off)
- A simple **"Coach"** panel that explains the reasoning behind each answer

### Later (nice-to-have)
- Streaks, badges, and a daily-practice reminder
- Stats dashboard (accuracy per skill, weakest areas)
- Adjustable difficulty within a level
- Simple AI opponents with selectable styles (tight/loose) for Level 10
- Hand-history review with coaching notes
- Dark mode

---

## 5. Technical Architecture

A **client-side single-page app** is enough — no server or database required,
which keeps it free and trivial to deploy. Progress is stored in the browser.

### Recommended stack
- **Language:** TypeScript
- **Framework:** React + Vite
- **Styling:** Tailwind CSS (fast, clean UI)
- **State/persistence:** React state + `localStorage` (no backend)
- **Card images:** SVG card set (lightweight, scalable)
- **Testing:** Vitest (unit-test the poker logic)
- **Deployment:** Vercel (free tier, build-on-push)

> The poker rules engine (deck, dealing, hand evaluation) is pure TypeScript with
> **zero UI dependencies**, so it can be fully unit-tested and reused anywhere.

### Proposed folder structure
```
/
├── docs/                     # design docs (this file, beginner-guide.md)
├── public/
│   └── cards/                # SVG card assets
├── src/
│   ├── engine/               # pure poker logic (no UI)
│   │   ├── deck.ts           # 52-card deck, shuffle, deal
│   │   ├── card.ts           # Card/Rank/Suit types
│   │   ├── handEvaluator.ts  # best 5-of-7, hand ranking
│   │   └── odds.ts           # outs & pot-odds helpers
│   ├── drills/               # question generators per level
│   │   ├── level01_cards.ts
│   │   ├── level02_rankings.ts
│   │   └── ...
│   ├── components/           # React UI (Card, Table, DrillScreen, Coach…)
│   ├── state/                # progress, persistence (localStorage)
│   ├── pages/                # LevelMap, LevelPlay, Stats
│   └── main.tsx
├── tests/                    # engine + drill-generator tests
└── package.json
```

---

## 6. Data Model (sketch)

```ts
type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A';
interface Card { rank: Rank; suit: Suit; }

type HandRank =
  | 'HighCard' | 'OnePair' | 'TwoPair' | 'ThreeOfAKind' | 'Straight'
  | 'Flush' | 'FullHouse' | 'FourOfAKind' | 'StraightFlush' | 'RoyalFlush';

interface Drill {
  id: string;
  levelId: number;
  prompt: string;
  render?: { holeCards?: Card[]; board?: Card[] };  // visual context
  options: string[];
  correctIndex: number;
  explanation: string;   // shown by the Coach after answering
}

interface LevelProgress {
  levelId: number;
  unlocked: boolean;
  bestScore: number;     // e.g. 9/10
  mastered: boolean;     // passed the mastery threshold
  attempts: number;
}

interface PlayerProgress {
  currentLevel: number;
  levels: Record<number, LevelProgress>;
  totalDrillsAnswered: number;
  accuracyBySkill: Record<string, { correct: number; total: number }>;
}
```

---

## 7. Development Roadmap (milestones)

**Status: all milestones complete.** The full 10-level curriculum plus the
live table are shipped and merged to `main`. (Updated 2026-06-19.)

- ✅ **M0 — Setup**: Vite + React + TS + Tailwind project; builds and deploys.
- ✅ **M1 — Engine**: `card`, `deck`, `handEvaluator` (best 5-of-7) + a verified
  `handFactory`, all unit-tested.
- ✅ **M2 — Drill framework**: `DrillScreen`, scoring, instant Coach feedback,
  mastery gating, `localStorage` progress, light spaced repetition.
- ✅ **M3 — Levels 1–3**: cards, hand rankings, best-hand puzzles (rules fluency).
- ✅ **M4 — Levels 4–6**: table flow, betting actions, position (game flow).
- ✅ **M5 — Levels 7–9**: starting hands, outs/pot odds, board reading (strategy),
  backed by `startingHands.ts` and `board.ts`.
- ✅ **M6 — Level 10**: live table vs. AI (`game.ts` + `bot.ts` + `TableScreen`)
  with an on-table coach, **3 bot difficulty levels**, and **side-pot** support.
- ✅ **M7 — Polish (partial)**: per-skill **stats dashboard**, a **Learn (study)
  stage** with visual-aid diagrams, **Korean term** translations, and an
  **Endless Practice** mode. (Remaining nice-to-haves below.)

### Shipped beyond the original plan
- **Learn stage** before drills: definitions, worked examples, and schematic
  diagrams (suits chart, rank strip, hand-ranking ladder, betting-rounds
  timeline, poker-table position diagram).
- **Korean translations** of key terms (Hangul + romanization), reinforced in
  drill explanations.
- **Endless Practice** mode for unlimited repetition per level.
- **Stats dashboard**: per-skill accuracy, recent-session trend, weakest-area
  flag, from both mastery and endless sessions.

### Still open (nice-to-have)
- Badges / streaks / daily-practice reminder.
- Dark mode.
- Side-pot UI breakdown on the table (engine already computes pots; the table
  shows an aggregate summary).
- Hand-history review with coaching notes.

> Shipped after **M3** as a usable v0.1, then iterated through to M6.

---

## Test coverage snapshot

81 unit tests (Vitest) cover the pure logic:
- hand evaluation (categories, best 5-of-7, tie-breaking), the deck/shuffle,
  and the verified hand factory;
- drill/lesson generators (well-formed across many seeds);
- starting-hand classification and board reading (flush/pair/nuts);
- progress accumulation; and the game engine (chip conservation across full
  hands at every bot difficulty, blinds, fold-wins, and side-pot splits).

---

## 8. Deployment

- **Vercel**: connect the GitHub repo → Vercel auto-detects Vite → builds on
  every push and publishes the `dist/` output.
- No `base` path tweak needed (served from the domain root).
- Result: a public URL the learner can open on desktop or phone, anytime.

---

## 9. Locked Decisions

These were confirmed and are the source of truth for the build:

1. **Stack** — ✅ **React + Vite + TypeScript** (+ Tailwind CSS).
2. **v0.1 scope** — ✅ **Levels 1–3 first** (rules-fluency core: cards, hand
   rankings, best 5-of-7), then iterate toward the full 10.
3. **Hosting** — ✅ **Vercel** (build on push, free tier).

### Still open (minor)
- **Card art** — start with simple CSS/Unicode cards, swap to an open-source SVG
  deck later if desired.

> Note on deployment: since hosting is **Vercel** (not GitHub Pages), Vite's
> `base` can stay as the default `'/'` — no repo-name base path needed.

---

## Related Docs
- [`beginner-guide.md`](./beginner-guide.md) — the human-readable rules &
  strategy reference that the level content is based on.

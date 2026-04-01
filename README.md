# Tutor AI

A personalized AI tutor that remembers every mistake you've made and gets smarter about **you** over time.

Not a template. A real product. After 6 months, this repo knows your exact weak points and builds custom problem sets from your failure patterns. A fresh repo is useful. A 2-year-old repo is invaluable. Nobody can replicate it because nobody has **your** mistake history.

## Architecture

- **Cloudflare Worker** — all API routes, SSE streaming to DeepSeek
- **KV Storage** — student profile, sessions, mistakes, flashcards, progress, goals
- **Single HTML file** — dark mode dashboard with 8 tabs

## Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/chat` | POST | SSE streaming chat with DeepSeek. System prompt includes full student history |
| `/api/student` | GET/POST | Student profile (name, subjects, learning style, goals) |
| `/api/sessions` | GET/POST | Study session logs |
| `/api/mistakes` | GET/POST | Mistake tracker with automatic pattern detection |
| `/api/flashcards` | GET/POST | Spaced repetition flashcards (SM-2 algorithm) |
| `/api/progress` | GET/POST | Progress snapshots with mastery scores |
| `/api/goals` | GET/POST | Learning goals with sub-checkpoints |
| `/api/quiz` | GET | Auto-generated quiz based on weak areas |
| `/api/insights` | GET | AI-powered learning insights |

## Tracking Engine (`src/tutor/tracker.ts`)

- **StudentProfileManager** — profile and preferences
- **SessionTracker** — study session history, streak calculation, accuracy tracking
- **MistakeTracker** — mistake logging with automatic pattern detection
- **SpacedRepetition** — SM-2 algorithm for flashcard scheduling
- **ProgressTracker** — mastery computation and trend analysis
- **GoalManager** — goals with checkpoints and completion tracking
- **QuizGenerator** — weighted quiz generation (60% weak areas, 20% review, 20% new)
- **LearningInsights** — pattern detection, trend analysis, time-based insights

## Seed Data

Pre-loaded for a CS student named Alex studying algorithms:
- 30 study sessions across 8 topics
- 45 mistakes tracked (recursion, graphs, DP, trees, sorting, hash tables, linked lists, arrays)
- 50 spaced repetition flashcards
- 12 weeks of progress snapshots
- 4 learning goals with checkpoints
- Identified patterns: recursion base case errors, BFS/DFS confusion, DP overlapping subproblems

## Setup

```bash
npm install
export DEEPSEEK_API_KEY=your-key
npx wrangler dev
```

Open `http://localhost:8787` — the dashboard loads with Alex's seed data.

For the chat feature, set `DEEPSEEK_API_KEY` in `.dev.vars` or as a wrangler secret:

```bash
npx wrangler secret put DEEPSEEK_API_KEY
```

## Deploy

```bash
npx wrangler deploy
```

## Design

- Dark mode: `#0F172A` background
- Correct/positive: `#10B981` (green)
- Streaks/warnings: `#F59E0B` (amber)
- Mistakes: `#EF4444` (red)
- Info: `#3B82F6` (blue)

## The Value Proposition

This isn't a study app. It's a **compound interest machine** for learning.

- **Week 1**: It's a decent quiz tool.
- **Month 3**: It knows you always forget recursion base cases and confuses BFS/DFS traversal order. Quizzes target exactly that.
- **Month 6**: It has 200+ mistakes logged, knows your accuracy by time of day, your weakest topics, and what explanations actually work for you. No generic course can compete.
- **Year 2**: Irreplaceable. The mistake history, pattern library, and mastery timeline represent hundreds of hours of data about YOUR brain. Nobody else has it. Nobody can replicate it.

Every session, every mistake, every flashcard review compounds. The longer you use it, the more valuable it becomes.

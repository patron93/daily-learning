# 001 — Lesson quiz and trainer

> An interactive quiz at the end of every new lesson (today's topic + recap of past topics) and a free-play "Trainer" page, both running in the browser on the static site.

Status: agreed

## Problem / motivation

Lessons are read-only: a static exercise with answers in a spoiler, and a review list of words. There is no active recall, no typing practice, and nothing brings past grammar or tech topics back. Language-learning apps solve this with short randomized quizzes; the site can do the same without a backend.

## How it fits the app

- **Site:** VitePress on GitHub Pages (`.vitepress/`). The quiz is a Vue component registered in a custom theme (`.vitepress/theme/`), so lesson markdown can embed it. Vue ships with VitePress; no new runtime dependency.
- **Data:** words come from `polish/vocabulary.json` (already in the repo). Grammar and tech questions are written by the daily scheduled task into one quiz file per lesson, next to the lesson.
- **Daily task:** `INSTRUCTIONS.md` and `templates/polish.md` / `templates/tech.md` gain a "write the quiz file" step and the quiz embed. The polish template drops its static "Повторение" and "Упражнение" sections and their answers; the quiz replaces them.
- **SRS:** unchanged. The task still picks due words and updates `box` / `next_review` as today; quiz results never flow back.
- **Deploy:** `.github/workflows/deploy.yml` runs the tests before `vitepress build`.

## In scope

- Lesson quiz on every lesson page that has a quiz file: about 10 questions — 6 on today's lesson, 4 recap.
- "Тренажёр" page (nav + sidebar link): endless stream of questions from the whole vocabulary and all past quiz files, filterable by track (polish / tech), until the user presses "Хватит"; shows the score for the session.
- Polish word exercises, generated in the browser from `vocabulary.json`:
  - multiple choice PL→RU and RU→PL (distractors from other vocabulary words, same part of speech when possible);
  - typed answer PL→RU and RU→PL;
  - "собери предложение": shuffled words of a vocabulary `example` (Polish part) to put in order.
- Polish grammar questions from the quiz file: multiple choice and gap fill (type the correct form).
- Tech questions from the quiz file: multiple choice with an explanation shown after answering.
- Pronunciation button 🔊 on Polish words and sentences via the browser `speechSynthesis` API with `lang = 'pl-PL'`; hidden when no Polish voice is available.
- Diacritics keyboard `ą ć ę ł ń ó ś ź ż` under every typed-answer field.
- Real randomness: every attempt draws a fresh random sample of questions and shuffles options and word order.
- Vitest unit tests for quiz logic and a schema test for all quiz files; tests run in CI before build.

## Out of scope

- Storing progress, scores, streaks or mistakes (no localStorage, no backend, no accounts).
- Feeding quiz results back into `vocabulary.json` / SRS.
- A quiz for the existing lesson `lessons/2026-10-15.md` or any lesson written before this feature.
- Changes to old lessons' text.
- Quizzes in email; the email keeps only the link.

## User stories

- As a learner, I want a short quiz after today's Polish lesson so that I actively recall the new words and grammar instead of only reading them.
- As a learner, I want to translate words both ways, by choice and by typing, so that I can both recognise and produce them.
- As a learner, I want old topics to come back in quizzes so that I do not forget them.
- As a team lead, I want a few multiple-choice questions after the tech lesson, with explanations, so that I check I got the nuance.
- As a learner, I want a trainer page so that I can practise any time, not only on today's lesson.

## Domain & data

### Quiz file

Path: `lessons/YYYY-MM-DD-<track>.quiz.json`, `track` ∈ `polish | tech`, written in the same commit as the lesson. 8–10 questions per file.

```json
{
  "date": "2026-10-17",
  "track": "polish",
  "topic": "Винительный падеж",
  "questions": [
    {
      "id": "acc-1",
      "type": "choice",
      "prompt": "Mam ___ (siostra).",
      "options": ["siostrę", "siostra", "siostry", "siostrą"],
      "answer": "siostrę",
      "explain": "Mieć + biernik: -a → -ę."
    },
    {
      "id": "acc-2",
      "type": "gap",
      "prompt": "Piję ___ (kawa) codziennie.",
      "answers": ["kawę"],
      "explain": "Pić + biernik."
    }
  ]
}
```

Rules:

- `type`: `choice` (2–5 unique `options`, `answer` is one of them) or `gap` (Polish track only; `answers` is a non-empty list of accepted strings).
- `id` unique within the file; `prompt` and `explain` non-empty; Russian explanations, Polish examples.
- `date` and `track` match the file name.
- Text follows the existing VitePress rule: no `{{` in strings that end up in markdown (the component renders strings as text, so JSON content is safe, but keep the rule for consistency).

### Lesson embed

The lesson markdown ends with a quiz section that embeds the component:

```md
## 🧩 Квиз

<LessonQuiz date="2026-10-17" track="polish" />
```

### Data loading

A build-time VitePress data loader (`.vitepress/quiz.data.mts`) reads all `lessons/*.quiz.json` and `polish/vocabulary.json` and exposes them to the components. A lesson without a quiz file renders no quiz.

### Question selection (lesson quiz)

- **Today (6):** for `polish` — 3 word exercises over today's new words (`added` = lesson date), plus 3 random questions from today's quiz file; for `tech` — 6 random questions from today's quiz file. If a pool is short, fill from the other pool of the same day.
- **Recap (4):** random questions from quiz files and vocabulary dated before the lesson. Items from the last 7 days before the lesson are 3× as likely as older ones. For `polish`, words with `next_review` ≤ lesson date are picked first (up to 2), then the weighted draw.
- Word exercise kind (choice / typed / sentence) and direction (PL→RU / RU→PL) are random per item.
- No question appears twice in one attempt. "Ещё раз" re-draws everything.

### Answer checking (typed)

- Compare after trimming, collapsing spaces, lowercasing, and stripping final punctuation.
- Russian side: `ru` is split on `,` and `;` into accepted variants (`"встреча, митинг"` → either). Text in parentheses is optional.
- Polish side: exact match after normalisation is correct. A match only after removing diacritics (`ą→a`, `ć→c`, `ę→e`, `ł→l`, `ń→n`, `ó→o`, `ś→s`, `ź/ż→z`) counts as correct but shows "Правильно пишется: źródło" with the differing letters highlighted.
- Anything else is wrong; show the correct answer and, for quiz-file questions, `explain`.

## Acceptance criteria

1. Given a lesson with a quiz file, when the page opens, then a quiz with 10 questions (6 today + 4 recap, or fewer if the pools are smaller) is shown below the lesson text.
2. Given the same lesson, when the user presses "Ещё раз" twice, then the question sets or their order differ between attempts (randomness verified in unit tests with a seeded RNG: different seeds give different samples, the same seed the same sample).
3. Given a lesson without a quiz file (e.g. `2026-10-15.md`), when the page opens, then no quiz renders and the page builds without errors.
4. Given a choice question, when the user picks an option, then it is marked right/wrong, the correct option is highlighted, and `explain` is shown when present.
5. Given a typed PL answer `zrodlo` for `źródło`, when submitted, then it is accepted with the "Правильно пишется" hint; `zrodla` is rejected.
6. Given a typed RU answer `митинг` for `ru: "встреча, митинг"`, when submitted, then it is accepted.
7. Given a word exercise, then both directions PL→RU and RU→PL occur across draws, and both choice and typed modes occur.
8. Given a sentence-builder item, when the user puts the shuffled words in the original order, then it is accepted; any other order is rejected and the original sentence with translation is shown.
9. Given a browser with a `pl-PL` voice, when the user presses 🔊, then the Polish text is spoken; given no such voice, the button is hidden.
10. Given the "Тренажёр" page, when the user selects a track and starts, then questions keep coming from the whole pool until "Хватит", after which the session score is shown.
11. Given recap selection, then only items dated before the lesson are used, and over many seeded draws items from the last 7 days are picked more often than older ones.
12. Given any `lessons/*.quiz.json` that breaks the schema rules above, when CI runs, then the schema test fails and the deploy job does not publish.
13. Given the daily task runs after this ships, then the new polish lesson has no static "Повторение"/"Упражнение" sections, ends with the quiz embed, and a matching valid quiz file is committed; the tech lesson ends with the quiz embed and its quiz file.
14. The quiz is usable on a phone (375 px width): no horizontal scroll, buttons large enough to tap, diacritics keyboard wraps.

## Usage examples

### Example 1: Polish lesson quiz

Lesson `2026-10-17-polish` added `kawa`, `herbata`, `cukier`, `mleko`, `kubek`; quiz file has 9 grammar questions on biernik.

1. Q1 (typed, RU→PL): «чашка, кружка» → user types `kubek` → correct, 🔊 plays "kubek".
2. Q2 (choice, PL→RU): `cukier` → options «сахар / молоко / соль / чай» → correct.
3. Q3 (sentence): `[kawę] [Piję] [bez] [cukru]` → user orders `Piję kawę bez cukru` → correct.
4. Q4–Q6: three random biernik questions from the quiz file.
5. Q7–Q10 recap: `biurko` (due today, RU→PL typed), `spotkanie` (choice), and two older items.
6. Result: «8 из 10» and buttons «Ещё раз» / «Тренажёр».

### Example 2: diacritics and wrong answers

- RU→PL «перерыв», user types `przerwe` for `przerwa` → wrong (letter differs, not a diacritic) → shows `przerwa`.
- RU→PL «источник», user types `zrodlo` → accepted, hint «Правильно пишется: źródło».

### Example 3: tech lesson quiz

Lesson `2026-10-18-tech` on Angular `linkedSignal`, quiz file with 8 choice questions. The page shows 6 of them in random order with shuffled options, plus 4 recap questions from earlier tech quiz files (e.g. `effect` vs `computed`). After each answer the explanation appears.

## Zones (delivery plan)

Three zones, merged and deployed strictly in order Z1 → Z2 → Z3 (Z3 makes the daily task embed `<LessonQuiz>`, which must already be registered on the live site). Validation per zone: `npm test` + `npm run build` (the repo has no SDD validate scripts). No zone adds `lessons/*.quiz.json`; sample data lives in `tests/fixtures/` only.

Shared design: logic in `.vitepress/quiz/*.ts` (no vue/vitepress imports, testable in node); item keys `w:<pl>` and `q:<date>-<track>:<id>`; dates are `YYYY-MM-DD` strings with day math via `Date.UTC`; RNG always passed in (`mulberry32`), seeded in the browser from `crypto.getRandomValues`.

### Z1 — Quiz logic and CI gate (`agent/quiz-logic`)

Nothing visible on the site changes. Covers AC 2, 4–8, 11, 12 (logic level).

| Item | Tier | Files | Done when |
|---|---|---|---|
| Z1.1 vitest + CI | light | `package.json` (`"vitest": "3.2.7"` exact, `"test": "vitest run"`), `vitest.config.ts` (include `tests/**/*.test.ts`, node env, exclude `.vitepress/cache|dist`, `node_modules`), `deploy.yml` (`npm test` between install and build), README commands | `npm test` runs in CI before build; a failing test blocks deploy (AC12) |
| Z1.2 core helpers | light | `types.ts`, `rng.ts` (`mulberry32`, `shuffle`, `sample`, `weightedSample`), `check.ts` (`normalize`, `stripDiacritics`, `ruVariants`, `checkTyped`, `checkItem`), `speech.ts` (`pickPolishVoice`) + tests | AC5 (`zrodlo`→ok with hint marks, `zrodla`/`przerwe`→wrong), AC6 (`митинг` accepted for `встреча, митинг`; parenthesised parts optional), AC4 (explain only for file items), AC8 check, AC9 voice pick; same seed → same sequence |
| Z1.3 exercises + selection | light | `exercises.ts` (`splitExample`, `makeWordItem`), `select.ts` (`selectLessonQuiz`, `createTrainer`), fixtures `tests/fixtures/vocabulary.json` + 6 quiz files, tests | AC1 (10 items, unique keys; short pool fills to 6 today), AC2 (seeded determinism, different seeds differ), AC3 (no file → []), AC7 (both directions, all three kinds over seeds), AC8 (tokens are a non-identity permutation), AC10 (endless trainer, track filter, empty → null), AC11 (recap only before date, recent picked more, due words always in) |
| Z1.4 schema | light | `schema.ts` (`validateQuizFile`), `tests/quiz/schema.test.ts`, `tests/lesson-quiz-files.test.ts` | one failing case per schema rule; every real `lessons/*.quiz.json` valid; every `<LessonQuiz date track>` embed has a matching quiz file (AC12, AC13 in CI) |

Order: Z1.1 → Z1.2 → (Z1.3 ∥ Z1.4).

### Z2 — Quiz UI and Trainer page (`agent/quiz-ui`)

Covers AC 1, 3, 4, 9, 10, 14 in the browser.

| Item | Tier | Files | Done when |
|---|---|---|---|
| Z2.1 components | standard | `.vitepress/theme/components/{LessonQuiz,Trainer,QuizQuestion,DiacriticsKeyboard,SpeakButton}.vue`, `.vitepress/theme/quiz.css` | Components hold no checking/selection logic; all randomness in `onMounted`/handlers (no hydration mismatch); one question at a time, final "N из M" + "Ещё раз" + "Тренажёр" (`withBase`); 🔊 hidden without a Polish voice; 375 px: no horizontal scroll, 44 px buttons, wrapping keyboard |
| Z2.2 wiring | light | `.vitepress/quiz.data.mts` (`watch` quiz files + vocabulary), `.vitepress/theme/index.ts` (extends DefaultTheme, registers `LessonQuiz`, `Trainer`), `trainer.md`, `config.mts` (nav + sidebar "Тренажёр") | `npm run build` green; `dist/trainer.html` exists; `lessons/2026-10-15` builds without quiz markup (AC3) |

Order: Z2.1 → Z2.2. Manual check in `npm run dev` at 375 px with a temporary local copy of a fixture quiz and a scratch lesson, both removed before commit (verifier checks the diff).

### Z3 — Daily task switches to quizzes (`agent/quiz-daily-task`)

Covers AC 13. Lands only after Z2 is deployed.

| Item | Tier | Files | Done when |
|---|---|---|---|
| Z3.1 templates + instructions + docs | light | `templates/polish.md` (drop Повторение, Упражнение, Ответы; end with `## 🧩 Квиз` + embed), `templates/tech.md` (same embed), `INSTRUCTIONS.md` (polish step 1 reworded, step 4 → write quiz file; tech gets a quiz-file step; run `npm install && npm test` before push; `LessonQuiz` is the one allowed raw tag), README files table, spec + `docs/README.md` status `shipped`, `tests/templates.test.ts` | template test green; first scheduled run after merge produces lesson + valid quiz file and a green deploy (reported as a post-merge check) |

`templates/lesson.md` and old lessons stay untouched.

## Dependencies

- `vitest` as a new devDependency (agreed with the user; exact version fixed at implementation).
- VitePress custom theme (`.vitepress/theme/index.ts`) extending the default theme.
- Daily scheduled task follows the updated `INSTRUCTIONS.md`.

## Decisions

- **Due words in recap.** The daily task updates `next_review` in the same commit as the lesson, so a word also counts as due when `reviews > 0` and `next_review − interval[box] = date` (it was reviewed on the lesson date). Intervals from `state.json → srs_intervals_days`: 1→1, 2→3, 3→7, 4→14, 5→30.
- **vitest** pinned exactly to `3.2.7` (shares Vite 5 with VitePress 1.6; no lockfile in the repo).
- **npm in the daily task sandbox.** If `npm install` is unreachable there, the task skips `npm test` and relies on CI; an invalid quiz file then fails deploy and the existing fallback emails the full lesson.

## Open questions

- None.

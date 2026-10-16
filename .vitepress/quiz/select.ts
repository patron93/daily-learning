import { makeWordItem } from './exercises'
import { sample, shuffle, weightedSample } from './rng'
import type { FileQuestion, QuizFile, QuizItem, Track, Word } from './types'

// Review intervals in days per SRS box (state.json → srs_intervals_days).
export const INTERVALS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 }

const DAY_MS = 86_400_000
const TODAY_TOTAL = 6
const TODAY_WORD_MAX = 3
const TODAY_FILE_MAX = 3
const RECAP_TOTAL = 4
const RECAP_DUE_MAX = 2
const RECENT_DAYS = 7
const RECENT_WEIGHT = 3

// YYYY-MM-DD → milliseconds at 00:00 UTC.
function utcMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

// Whole days from `from` to `to` (positive when `to` is later).
export function daysBetween(from: string, to: string): number {
  return Math.round((utcMs(to) - utcMs(from)) / DAY_MS)
}

export function addDays(date: string, n: number): string {
  return new Date(utcMs(date) + n * DAY_MS).toISOString().slice(0, 10)
}

// Due on `date`: added before it and either overdue, or reviewed on `date` (next_review − interval = date).
export function isDue(word: Word, date: string): boolean {
  if (!(word.added < date)) return false
  if (word.next_review <= date) return true
  const interval = INTERVALS[word.box]
  return word.reviews > 0 && interval !== undefined && addDays(word.next_review, -interval) === date
}

// A candidate for a quiz slot: a vocabulary word or a question from a quiz file.
type Source =
  | { source: 'word'; word: Word; date: string }
  | { source: 'file'; file: QuizFile; question: FileQuestion }

function sourceKey(s: Source): string {
  return s.source === 'word' ? `w:${s.word.pl}` : `q:${s.file.date}-${s.file.track}:${s.question.id}`
}

function sourceDate(s: Source): string {
  return s.source === 'word' ? s.word.added : s.file.date
}

function fileSources(files: readonly QuizFile[]): Source[] {
  return files.flatMap((file) => file.questions.map((question): Source => ({ source: 'file', file, question })))
}

function wordSources(words: readonly Word[]): Source[] {
  return words.map((word): Source => ({ source: 'word', word, date: word.added }))
}

function buildItem(s: Source, vocab: readonly Word[], rng: () => number): QuizItem {
  if (s.source === 'word') return makeWordItem(s.word, vocab, rng)
  const { file, question } = s
  const key = sourceKey(s)
  if (question.type === 'choice') {
    return {
      key,
      source: 'file',
      kind: 'choice',
      question,
      options: shuffle(question.options, rng),
      date: file.date,
      track: file.track,
    }
  }
  return { key, source: 'file', kind: 'gap', question, date: file.date, track: file.track }
}

// How many items to take from a word pool (size a) and a file pool (size b) so the total is min(total, a + b),
// each capped at 3 first, then the shortfall filled from whichever pool has room.
function splitQuota(a: number, b: number, total: number): [number, number] {
  let x = Math.min(TODAY_WORD_MAX, a)
  let y = Math.min(TODAY_FILE_MAX, b)
  let short = total - x - y
  const addX = Math.min(short, a - x)
  x += addX
  short -= addX
  y += Math.min(short, b - y)
  return [x, y]
}

export type LessonQuizInput = {
  date: string
  track: Track
  vocab: readonly Word[]
  quizzes: readonly QuizFile[]
  rng: () => number
}

export function selectLessonQuiz({ date, track, vocab, quizzes, rng }: LessonQuizInput): QuizItem[] {
  const file = quizzes.find((q) => q.date === date && q.track === track)
  if (!file) return []

  // Today: polish mixes today's words and questions; tech uses only the file.
  const todayWords = track === 'polish' ? wordSources(vocab.filter((w) => w.added === date)) : []
  const todayFiles = fileSources([file])
  const [nWords, nFiles] = splitQuota(todayWords.length, todayFiles.length, TODAY_TOTAL)
  const pickedWords = sample(todayWords, nWords, rng)
  const pickedFiles = sample(todayFiles, nFiles, rng)

  // Recap: strictly earlier items on the same track.
  const earlierFiles = fileSources(quizzes.filter((q) => q.track === track && q.date < date))
  let dueChosen: Source[] = []
  let recapPool: Source[] = earlierFiles
  if (track === 'polish') {
    const pastWords = vocab.filter((w) => w.added < date)
    const due = pastWords.filter((w) => isDue(w, date))
    dueChosen = wordSources(sample(due, RECAP_DUE_MAX, rng))
    const chosenKeys = new Set(dueChosen.map(sourceKey))
    recapPool = [...wordSources(pastWords), ...earlierFiles].filter((s) => !chosenKeys.has(sourceKey(s)))
  }
  const weight = (s: Source): number => {
    const days = daysBetween(sourceDate(s), date)
    return days >= 1 && days <= RECENT_DAYS ? RECENT_WEIGHT : 1
  }
  const weighted = weightedSample(recapPool, weight, RECAP_TOTAL - dueChosen.length, rng)

  return [...pickedWords, ...pickedFiles, ...dueChosen, ...weighted].map((s) => buildItem(s, vocab, rng))
}

export type Trainer = { next(): QuizItem | null }

export type TrainerInput = {
  track: Track
  vocab: readonly Word[]
  quizzes: readonly QuizFile[]
  rng: () => number
}

// Endless stream: a shuffled deck over the whole pool; reshuffled when empty, never repeating the last dealt item at the join.
export function createTrainer({ track, vocab, quizzes, rng }: TrainerInput): Trainer {
  const pool: Source[] = [
    ...(track === 'polish' ? wordSources(vocab) : []),
    ...fileSources(quizzes.filter((q) => q.track === track)),
  ]
  let deck: Source[] = []
  let last: string | null = null

  return {
    next(): QuizItem | null {
      if (pool.length === 0) return null
      if (deck.length === 0) deck = dealDeck(pool, last, rng)
      const s = deck.shift()
      if (!s) return null
      last = sourceKey(s)
      return buildItem(s, vocab, rng)
    },
  }
}

function dealDeck(pool: readonly Source[], last: string | null, rng: () => number): Source[] {
  const deck = shuffle(pool, rng)
  if (pool.length > 1 && last !== null && sourceKey(deck[0]) === last) {
    const i = deck.findIndex((s) => sourceKey(s) !== last)
    ;[deck[0], deck[i]] = [deck[i], deck[0]]
  }
  return deck
}

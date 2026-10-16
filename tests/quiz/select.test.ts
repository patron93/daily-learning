import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../../.vitepress/quiz/rng'
import {
  addDays,
  createTrainer,
  daysBetween,
  INTERVALS,
  isDue,
  selectLessonQuiz,
} from '../../.vitepress/quiz/select'
import type { QuizFile, QuizItem, Word } from '../../.vitepress/quiz/types'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')
const vocab: Word[] = (JSON.parse(readFileSync(join(FIXTURES, 'vocabulary.json'), 'utf8')) as { words: Word[] }).words
const quizzes: QuizFile[] = readdirSync(join(FIXTURES, 'quizzes'))
  .filter((f) => f.endsWith('.quiz.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(FIXTURES, 'quizzes', f), 'utf8')) as QuizFile)

const POLISH_DATE = '2026-10-17'
const TECH_DATE = '2026-10-18'

function lesson(date: string, track: 'polish' | 'tech', seed: number, v: Word[] = vocab): QuizItem[] {
  return selectLessonQuiz({ date, track, vocab: v, quizzes, rng: mulberry32(seed) })
}

function keys(items: QuizItem[]): string[] {
  return items.map((i) => i.key)
}

// Date of an item: the word's added date for word items, the file date for file items.
function itemDate(item: QuizItem): string {
  return item.source === 'word' ? item.word.added : item.date
}

function word(pl: string): Word {
  const found = vocab.find((w) => w.pl === pl)
  if (!found) throw new Error(`no fixture word ${pl}`)
  return found
}

describe('day math and SRS helpers', () => {
  it('computes whole days and adds days in UTC', () => {
    expect(daysBetween('2026-10-10', '2026-10-17')).toBe(7)
    expect(daysBetween('2026-10-17', '2026-10-10')).toBe(-7)
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-10-20', -3)).toBe('2026-10-17')
  })

  it('uses the SRS intervals from state.json', () => {
    expect(INTERVALS).toEqual({ 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 })
  })

  it('treats a word as due when overdue, or when reviewed on the date', () => {
    expect(isDue(word('dom'), POLISH_DATE)).toBe(true)
    expect(isDue(word('kot'), POLISH_DATE)).toBe(true)
    // biurko: box 2, next_review 2026-10-20 − 3 days = 2026-10-17, reviews > 0.
    expect(isDue(word('biurko'), POLISH_DATE)).toBe(true)
    expect(isDue(word('biurko'), '2026-10-16')).toBe(false)
    expect(isDue(word('kawa'), POLISH_DATE)).toBe(false)
  })

  it('never treats a word added on or after the date as due', () => {
    const fresh: Word = { ...word('kawa'), added: POLISH_DATE, next_review: '2026-10-01' }
    expect(isDue(fresh, POLISH_DATE)).toBe(false)
  })
})

describe('selectLessonQuiz', () => {
  it('builds 10 items for polish 2026-10-17: 3 words and 3 file questions today, then 4 recap (AC1)', () => {
    const items = lesson(POLISH_DATE, 'polish', 1)
    expect(items).toHaveLength(10)
    expect(new Set(keys(items)).size).toBe(10)
    expect(items.slice(0, 3).every((i) => i.source === 'word' && i.word.added === POLISH_DATE)).toBe(true)
    expect(items.slice(3, 6).every((i) => i.source === 'file' && i.date === POLISH_DATE)).toBe(true)
    expect(items.slice(6).every((i) => itemDate(i) < POLISH_DATE)).toBe(true)
  })

  it('builds 10 items for tech 2026-10-18: 6 from today, 4 recap (AC1)', () => {
    const items = lesson(TECH_DATE, 'tech', 1)
    expect(items).toHaveLength(10)
    expect(new Set(keys(items)).size).toBe(10)
    expect(items.slice(0, 6).every((i) => i.source === 'file' && i.date === TECH_DATE)).toBe(true)
    expect(items.slice(6).every((i) => i.source === 'file' && i.track === 'tech' && i.date < TECH_DATE)).toBe(true)
  })

  it('fills the today block to 6 from file questions when only one word was added today (AC1)', () => {
    const oneWord = vocab.filter((w) => w.added !== POLISH_DATE || w.pl === 'kubek')
    for (let seed = 1; seed <= 20; seed++) {
      const items = lesson(POLISH_DATE, 'polish', seed, oneWord)
      const today = items.slice(0, 6)
      expect(items).toHaveLength(10)
      expect(today.filter((i) => i.source === 'word')).toHaveLength(1)
      expect(today.filter((i) => i.source === 'file' && i.date === POLISH_DATE)).toHaveLength(5)
    }
  })

  it('returns no items when there is no quiz file for that date and track (AC3)', () => {
    expect(lesson('2026-10-15', 'polish', 1)).toEqual([])
    expect(lesson(POLISH_DATE, 'tech', 1)).toEqual([])
    expect(lesson('2026-10-19', 'polish', 1)).toEqual([])
  })

  it('gives the same items for the same seed and different items for different seeds (AC2)', () => {
    expect(lesson(POLISH_DATE, 'polish', 5)).toEqual(lesson(POLISH_DATE, 'polish', 5))
    expect(lesson(TECH_DATE, 'tech', 5)).toEqual(lesson(TECH_DATE, 'tech', 5))
    const sequences = new Set(
      Array.from({ length: 20 }, (_, i) => JSON.stringify(keys(lesson(POLISH_DATE, 'polish', i + 1)))),
    )
    expect(sequences.size).toBeGreaterThanOrEqual(2)
  })

  it('shuffles the options of file choice questions but keeps the same set (AC2)', () => {
    const choices = lesson(TECH_DATE, 'tech', 3).filter((i) => i.source === 'file' && i.kind === 'choice')
    expect(choices.length).toBeGreaterThan(0)
    for (const item of choices) {
      if (item.source !== 'file' || item.kind !== 'choice') continue
      expect([...item.options].sort()).toEqual([...item.question.options].sort())
    }
  })

  it('uses only recap items dated before the lesson, over many seeds (AC11)', () => {
    const bad: string[] = []
    for (let seed = 1; seed <= 2000; seed++) {
      for (const item of lesson(POLISH_DATE, 'polish', seed).slice(6)) {
        if (!(itemDate(item) < POLISH_DATE)) bad.push(item.key)
      }
      for (const item of lesson(TECH_DATE, 'tech', seed).slice(6)) {
        if (!(itemDate(item) < TECH_DATE)) bad.push(item.key)
      }
    }
    expect(bad).toEqual([])
  })

  it('puts the due words first in the polish recap, capped at 2 (AC11)', () => {
    const due = vocab.filter((w) => isDue(w, POLISH_DATE)).map((w) => w.pl)
    expect([...due].sort()).toEqual(['biurko', 'dom', 'kot'])
    for (let seed = 1; seed <= 500; seed++) {
      const recap = lesson(POLISH_DATE, 'polish', seed).slice(6)
      const firstTwo = recap.slice(0, 2)
      expect(firstTwo.every((i) => i.source === 'word' && isDue(i.word, POLISH_DATE))).toBe(true)
      expect(new Set(firstTwo.map((i) => i.key)).size).toBe(2)
    }
  })

  it('draws items from the last 7 days more often than older ones (AC11)', () => {
    const due = new Set(vocab.filter((w) => isDue(w, POLISH_DATE)).map((w) => w.pl))
    const candidates = new Map<string, string>()
    for (const w of vocab) {
      if (w.added < POLISH_DATE && !due.has(w.pl)) candidates.set(`w:${w.pl}`, w.added)
    }
    for (const f of quizzes) {
      if (f.track !== 'polish' || f.date >= POLISH_DATE) continue
      for (const q of f.questions) candidates.set(`q:${f.date}-${f.track}:${q.id}`, f.date)
    }
    const counts = new Map<string, number>([...candidates.keys()].map((k) => [k, 0]))
    for (let seed = 1; seed <= 2000; seed++) {
      for (const item of lesson(POLISH_DATE, 'polish', seed).slice(6)) {
        if (counts.has(item.key)) counts.set(item.key, (counts.get(item.key) ?? 0) + 1)
      }
    }
    const mean = (pred: (d: number) => boolean): number => {
      const picked = [...candidates].filter(([, d]) => pred(daysBetween(d, POLISH_DATE)))
      expect(picked.length).toBeGreaterThan(0)
      return picked.reduce((sum, [k]) => sum + (counts.get(k) ?? 0), 0) / picked.length
    }
    const recent = mean((days) => days >= 1 && days <= 7)
    const older = mean((days) => days > 7)
    expect(recent).toBeGreaterThan(older)
  })
})

describe('createTrainer', () => {
  const polishFiles = quizzes.filter((q) => q.track === 'polish')
  const polishPoolKeys = [
    ...vocab.map((w) => `w:${w.pl}`),
    ...polishFiles.flatMap((f) => f.questions.map((q) => `q:${f.date}-${f.track}:${q.id}`)),
  ]

  it('gives an endless polish stream and covers the whole pool in the first pool-size calls (AC10)', () => {
    const trainer = createTrainer({ track: 'polish', vocab, quizzes, rng: mulberry32(3) })
    const got: QuizItem[] = []
    for (let i = 0; i < 50; i++) {
      const item = trainer.next()
      expect(item).not.toBeNull()
      if (item) got.push(item)
    }
    expect(new Set(keys(got.slice(0, polishPoolKeys.length)))).toEqual(new Set(polishPoolKeys))
    expect(got.every((i) => polishPoolKeys.includes(i.key))).toBe(true)
  })

  it('never repeats the same item twice in a row, including across reshuffles (AC10)', () => {
    const trainer = createTrainer({ track: 'polish', vocab, quizzes, rng: mulberry32(11) })
    const seen: string[] = []
    for (let i = 0; i < 500; i++) {
      const item = trainer.next()
      if (!item) throw new Error('trainer ran out')
      seen.push(item.key)
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1])
  })

  it('yields only tech file items for the tech track (AC10)', () => {
    const trainer = createTrainer({ track: 'tech', vocab, quizzes, rng: mulberry32(4) })
    for (let i = 0; i < 50; i++) {
      const item = trainer.next()
      expect(item).not.toBeNull()
      expect(item?.source).toBe('file')
      expect(item?.source === 'file' && item.track).toBe('tech')
    }
  })

  it('returns null for an empty pool (AC10)', () => {
    expect(createTrainer({ track: 'tech', vocab, quizzes: [], rng: mulberry32(1) }).next()).toBeNull()
    expect(createTrainer({ track: 'polish', vocab: [], quizzes: [], rng: mulberry32(1) }).next()).toBeNull()
  })
})

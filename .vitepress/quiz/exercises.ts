import type { Direction, QuizItem, Word } from './types'
import { shuffle } from './rng'

export type Split = { pl: string; ru: string }

export type WordKind = 'choice' | 'typed' | 'sentence'

export type WordItemOpts = { kind?: WordKind; dir?: Direction }

const SEPARATOR = ' — '
const TRAILING_PUNCT = /[.,!?;:…]+$/
const MAX_DISTRACTORS = 3
const MAX_RESHUFFLES = 10

// Splits "<Polish> — <Russian>" on the first separator; null when a side is missing or empty.
export function splitExample(example: string): Split | null {
  const idx = example.indexOf(SEPARATOR)
  if (idx < 0) return null
  const pl = example.slice(0, idx).trim()
  const ru = example.slice(idx + SEPARATOR.length).trim()
  if (!pl || !ru) return null
  return { pl, ru }
}

// Polish part without trailing punctuation, split on whitespace.
function sentenceTokens(pl: string): string[] {
  return pl.replace(TRAILING_PUNCT, '').trim().split(/\s+/).filter(Boolean)
}

// The string shown as an option or prompt for a word in the given direction.
function shown(word: Word, side: 'pl' | 'ru'): string {
  return side === 'pl' ? word.pl : word.ru
}

// Up to 3 display strings from other words: same pos first, then the rest; no duplicates, never the answer.
function distractors(word: Word, vocab: readonly Word[], dir: Direction, rng: () => number): string[] {
  const side = dir === 'pl-ru' ? 'ru' : 'pl'
  const answer = shown(word, side)
  const others = vocab.filter((w) => w.pl !== word.pl)
  const ordered = [
    ...shuffle(
      others.filter((w) => w.pos === word.pos),
      rng,
    ),
    ...shuffle(
      others.filter((w) => w.pos !== word.pos),
      rng,
    ),
  ]
  const out: string[] = []
  for (const other of ordered) {
    if (out.length >= MAX_DISTRACTORS) break
    const candidate = shown(other, side)
    if (candidate === answer || out.includes(candidate)) continue
    out.push(candidate)
  }
  return out
}

function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((t, i) => t === b[i])
}

// Shuffled tokens that differ from the original whenever the original has two distinct tokens.
function scrambled(original: readonly string[], rng: () => number): string[] {
  let tokens = shuffle(original, rng)
  for (let i = 0; i < MAX_RESHUFFLES && sameOrder(tokens, original); i++) {
    tokens = shuffle(original, rng)
  }
  if (sameOrder(tokens, original) && !original.every((t) => t === original[0])) {
    // Rotation by one differs from the original unless all tokens are equal.
    tokens = [...original.slice(1), original[0]]
  }
  return tokens
}

export function makeWordItem(
  word: Word,
  vocab: readonly Word[],
  rng: () => number,
  opts: WordItemOpts = {},
): QuizItem {
  const dir: Direction = opts.dir ?? (rng() < 0.5 ? 'pl-ru' : 'ru-pl')
  const split = splitExample(word.example)
  const tokens = split ? sentenceTokens(split.pl) : []
  const picks = distractors(word, vocab, dir, rng)

  const allowed: WordKind[] = ['typed']
  if (picks.length > 0) allowed.push('choice')
  if (split && tokens.length >= 2) allowed.push('sentence')

  const kind: WordKind =
    opts.kind && allowed.includes(opts.kind) ? opts.kind : allowed[Math.floor(rng() * allowed.length)]
  const key = `w:${word.pl}`

  if (kind === 'sentence' && split) {
    return {
      key,
      source: 'word',
      kind: 'sentence',
      word,
      original: tokens,
      tokens: scrambled(tokens, rng),
      sentence: split.pl,
      translation: split.ru,
    }
  }

  const prompt = shown(word, dir === 'pl-ru' ? 'pl' : 'ru')
  const answer = shown(word, dir === 'pl-ru' ? 'ru' : 'pl')
  if (kind === 'choice') {
    return {
      key,
      source: 'word',
      kind: 'choice',
      dir,
      word,
      prompt,
      options: shuffle([answer, ...picks], rng),
      answer,
    }
  }
  return { key, source: 'word', kind: 'typed', dir, word, prompt }
}

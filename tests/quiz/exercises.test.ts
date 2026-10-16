import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { makeWordItem, splitExample, type WordItemOpts } from '../../.vitepress/quiz/exercises'
import { mulberry32 } from '../../.vitepress/quiz/rng'
import type { QuizItem, Word } from '../../.vitepress/quiz/types'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')
const vocab: Word[] = (JSON.parse(readFileSync(join(FIXTURES, 'vocabulary.json'), 'utf8')) as { words: Word[] }).words

function word(pl: string): Word {
  const found = vocab.find((w) => w.pl === pl)
  if (!found) throw new Error(`no fixture word ${pl}`)
  return found
}

function items(w: Word, seeds: number, opts: WordItemOpts = {}): QuizItem[] {
  return Array.from({ length: seeds }, (_, i) => makeWordItem(w, vocab, mulberry32(i + 1), opts))
}

describe('splitExample', () => {
  it('splits on the first " — " separator', () => {
    expect(splitExample('Piję kawę bez cukru. — Пью кофе без сахара.')).toEqual({
      pl: 'Piję kawę bez cukru.',
      ru: 'Пью кофе без сахара.',
    })
    expect(splitExample('a — b — c')).toEqual({ pl: 'a', ru: 'b — c' })
  })

  it('returns null when the separator is missing or a side is empty', () => {
    expect(splitExample('Piję kawę')).toBeNull()
    expect(splitExample('Piję kawę - пью кофе')).toBeNull()
    expect(splitExample(' — пью кофе')).toBeNull()
    expect(splitExample('Piję kawę — ')).toBeNull()
  })
})

describe('makeWordItem', () => {
  it('uses key w:<pl> and prompts and answers per direction', () => {
    const kawa = word('kawa')
    for (const item of items(kawa, 40)) {
      expect(item.key).toBe('w:kawa')
      if (item.source !== 'word' || item.kind === 'sentence') continue
      if (item.dir === 'pl-ru') {
        expect(item.prompt).toBe('kawa')
        if (item.kind === 'choice') expect(item.answer).toBe('кофе')
      } else {
        expect(item.prompt).toBe('кофе')
        if (item.kind === 'choice') expect(item.answer).toBe('kawa')
      }
    }
  })

  it('draws both directions and all three kinds over seeds 1..200 (AC7)', () => {
    const spotkanie = word('spotkanie')
    const dirs = new Set<string>()
    const kinds = new Set<string>()
    for (let seed = 1; seed <= 200; seed++) {
      const item = makeWordItem(spotkanie, vocab, mulberry32(seed))
      kinds.add(item.kind)
      if (item.kind !== 'sentence') dirs.add(item.dir)
    }
    expect([...dirs].sort()).toEqual(['pl-ru', 'ru-pl'])
    expect([...kinds].sort()).toEqual(['choice', 'sentence', 'typed'])
  })

  it('builds a sentence whose tokens are a non-identity permutation of the original (AC8)', () => {
    const kawa = word('kawa')
    for (const item of items(kawa, 50, { kind: 'sentence' })) {
      if (item.kind !== 'sentence') throw new Error('expected sentence item')
      expect(item.original).toEqual(['Piję', 'kawę', 'bez', 'cukru'])
      expect([...item.tokens].sort()).toEqual([...item.original].sort())
      expect(item.tokens).not.toEqual(item.original)
      expect(item.sentence).toBe('Piję kawę bez cukru.')
      expect(item.translation).toBe('Пью кофе без сахара.')
    }
  })

  it('takes distractors of the same pos first, then others', () => {
    // kawa is noun-f; the fixture has exactly three other noun-f words (herbata, przerwa, książka).
    const choices = items(word('kawa'), 60, { kind: 'choice' })
    for (const item of choices) {
      if (item.kind !== 'choice') throw new Error('expected choice item')
      const distractors = item.options.filter((o) => o !== item.answer).sort()
      const expected = item.dir === 'pl-ru' ? ['перерыв', 'книга', 'чай'] : ['herbata', 'książka', 'przerwa']
      expect(distractors).toEqual([...expected].sort())
    }
  })

  it('gives choice options without duplicates, with the answer exactly once and at most 4 options', () => {
    for (const item of items(word('spotkanie'), 100, { kind: 'choice' })) {
      if (item.kind !== 'choice') throw new Error('expected choice item')
      expect(new Set(item.options).size).toBe(item.options.length)
      expect(item.options.filter((o) => o === item.answer)).toHaveLength(1)
      expect(item.options.length).toBeGreaterThanOrEqual(2)
      expect(item.options.length).toBeLessThanOrEqual(4)
    }
  })

  it('drops distractors whose display string repeats the answer or another option', () => {
    const synthetic: Word[] = [
      { pl: 'aa', ru: 'x', pos: 'noun-m', example: 'Aa bb. — x', topic: 't', added: '2026-10-01', box: 1, reviews: 0, next_review: '2026-10-02' },
      { pl: 'bb', ru: 'x', pos: 'noun-m', example: 'Bb. — x', topic: 't', added: '2026-10-01', box: 1, reviews: 0, next_review: '2026-10-02' },
      { pl: 'cc', ru: 'y', pos: 'noun-m', example: 'Cc. — y', topic: 't', added: '2026-10-01', box: 1, reviews: 0, next_review: '2026-10-02' },
      { pl: 'dd', ru: 'y', pos: 'noun-m', example: 'Dd. — y', topic: 't', added: '2026-10-01', box: 1, reviews: 0, next_review: '2026-10-02' },
      { pl: 'ee', ru: 'z', pos: 'noun-m', example: 'Ee. — z', topic: 't', added: '2026-10-01', box: 1, reviews: 0, next_review: '2026-10-02' },
    ]
    for (let seed = 1; seed <= 50; seed++) {
      const item = makeWordItem(synthetic[0], synthetic, mulberry32(seed), { kind: 'choice', dir: 'pl-ru' })
      if (item.kind !== 'choice') throw new Error('expected choice item')
      expect([...item.options].sort()).toEqual(['x', 'y', 'z'])
    }
  })

  it('never offers choice when there is no distractor, nor sentence without a split example', () => {
    const only: Word[] = [
      { pl: 'aa', ru: 'x', pos: 'noun-m', example: 'Aa bb. — x', topic: 't', added: '2026-10-01', box: 1, reviews: 0, next_review: '2026-10-02' },
    ]
    const kinds = new Set<string>()
    for (let seed = 1; seed <= 50; seed++) kinds.add(makeWordItem(only[0], only, mulberry32(seed)).kind)
    expect([...kinds].sort()).toEqual(['sentence', 'typed'])

    const noSplit: Word = { ...word('kawa'), example: 'Piję kawę bez cukru.' }
    const kinds2 = new Set<string>()
    for (let seed = 1; seed <= 50; seed++) kinds2.add(makeWordItem(noSplit, vocab, mulberry32(seed)).kind)
    expect(kinds2.has('sentence')).toBe(false)
    expect(kinds2.has('choice')).toBe(true)
  })

  it('ignores an opts.kind that is not allowed', () => {
    const noSplit: Word = { ...word('kawa'), example: 'Piję kawę bez cukru.' }
    for (let seed = 1; seed <= 20; seed++) {
      expect(makeWordItem(noSplit, vocab, mulberry32(seed), { kind: 'sentence' }).kind).not.toBe('sentence')
    }
  })

  it('is deterministic for the same seed', () => {
    expect(makeWordItem(word('kawa'), vocab, mulberry32(9))).toEqual(makeWordItem(word('kawa'), vocab, mulberry32(9)))
  })
})

import { describe, expect, it } from 'vitest'
import { checkItem, checkTyped, normalize, ruVariants, stripDiacritics } from '../../.vitepress/quiz/check'
import type { QuizItem, Word } from '../../.vitepress/quiz/types'

const zrodlo: Word = {
  pl: 'źródło',
  ru: 'источник',
  pos: 'n',
  example: 'To jest źródło.',
  topic: 'słownictwo',
  added: '2026-10-01',
  next_review: '2026-10-02',
  box: 1,
  reviews: 0,
}

describe('normalize', () => {
  it('trims, collapses spaces, lowercases and strips trailing punctuation', () => {
    expect(normalize('  Źródło.  ')).toBe('źródło')
    expect(normalize('Ok ?!')).toBe('ok')
    expect(normalize('a   b\tc')).toBe('a b c')
    expect(normalize('wow…')).toBe('wow')
    expect(normalize('x.;:')).toBe('x')
  })

  it('keeps inner punctuation', () => {
    expect(normalize('a.b, c')).toBe('a.b, c')
  })
})

describe('stripDiacritics', () => {
  it('maps Polish letters to base letters in both cases', () => {
    expect(stripDiacritics('ąćęłńóśźż')).toBe('acelnoszz')
    expect(stripDiacritics('ĄĆĘŁŃÓŚŹŻ')).toBe('ACELNOSZZ')
  })

  it('leaves other characters alone', () => {
    expect(stripDiacritics('abc тест 1')).toBe('abc тест 1')
  })
})

describe('ruVariants', () => {
  it('splits on comma and semicolon', () => {
    expect(ruVariants('встреча, митинг')).toEqual(['встреча', 'митинг'])
    expect(ruVariants('один; два')).toEqual(['один', 'два'])
  })

  it('produces the variant without parenthesised text and the one with only the brackets removed', () => {
    expect(ruVariants('письменный стол (стол)')).toEqual(['письменный стол', 'письменный стол стол'])
  })

  it('drops empty variants and duplicates', () => {
    expect(ruVariants('(только скобки)')).toEqual(['только скобки'])
    expect(ruVariants('кот, кот ,  ')).toEqual(['кот'])
  })
})

describe('checkTyped', () => {
  it('accepts a Polish answer after diacritics are dropped, with a hint (AC5)', () => {
    expect(checkTyped('zrodlo', ['źródło'], 'pl')).toEqual({
      ok: true,
      hint: { correct: 'źródło', marks: [0, 2, 4] },
    })
  })

  it('marks only the letters where the diacritic was dropped', () => {
    expect(checkTyped('źrodlo', ['źródło'], 'pl')).toEqual({
      ok: true,
      hint: { correct: 'źródło', marks: [2, 4] },
    })
  })

  it('rejects a wrong letter, not just a diacritic (AC5)', () => {
    expect(checkTyped('zrodla', ['źródło'], 'pl').ok).toBe(false)
    expect(checkTyped('przerwe', ['przerwa'], 'pl').ok).toBe(false)
  })

  it('accepts an exact match after normalisation with no hint (AC5)', () => {
    expect(checkTyped('Źródło. ', ['źródło'], 'pl')).toEqual({ ok: true })
  })

  it('does not give the diacritics hint for Russian answers', () => {
    expect(checkTyped('встреча', ['встреча'], 'ru')).toEqual({ ok: true })
    expect(checkTyped('митинг', ruVariants('встреча, митинг'), 'ru')).toEqual({ ok: true })
  })

  it('accepts the Russian variants and optional parenthesised text (AC6)', () => {
    const accepted = ruVariants('встреча, митинг')
    expect(checkTyped('митинг', accepted, 'ru').ok).toBe(true)
    expect(checkTyped(' Встреча ', accepted, 'ru').ok).toBe(true)

    const table = ruVariants('письменный стол (стол)')
    expect(checkTyped('письменный стол', table, 'ru').ok).toBe(true)
    expect(checkTyped('письменный стол стол', table, 'ru').ok).toBe(true)
    expect(checkTyped('стул', table, 'ru').ok).toBe(false)
  })
})

describe('checkItem', () => {
  const wordTypedPlRu: QuizItem = { key: 'w:źródło', source: 'word', kind: 'typed', dir: 'pl-ru', word: zrodlo, prompt: 'źródło' }
  const wordTypedRuPl: QuizItem = { key: 'w:źródło', source: 'word', kind: 'typed', dir: 'ru-pl', word: zrodlo, prompt: 'источник' }
  const wordChoice: QuizItem = {
    key: 'w:źródło',
    source: 'word',
    kind: 'choice',
    dir: 'pl-ru',
    word: zrodlo,
    prompt: 'źródło',
    options: ['источник', 'встреча', 'стол'],
    answer: 'источник',
  }
  const fileChoice: QuizItem = {
    key: 'q:2026-10-17-polish:acc-1',
    source: 'file',
    kind: 'choice',
    question: { id: 'acc-1', type: 'choice', prompt: 'Mam ___ (siostra).', options: ['siostrę', 'siostra'], answer: 'siostrę', explain: 'Mieć + biernik.' },
    options: ['siostrę', 'siostra'],
    date: '2026-10-17',
    track: 'polish',
  }
  const fileGap: QuizItem = {
    key: 'q:2026-10-17-polish:acc-2',
    source: 'file',
    kind: 'gap',
    question: { id: 'acc-2', type: 'gap', prompt: 'Piję ___ (kawa).', answers: ['kawę'], explain: 'Pić + biernik.' },
    date: '2026-10-17',
    track: 'polish',
  }
  const sentence: QuizItem = {
    key: 'w:źródło:sentence',
    source: 'word',
    kind: 'sentence',
    word: zrodlo,
    original: ['Piję', 'kawę', 'bez', 'cukru'],
    tokens: ['cukru', 'bez', 'Piję', 'kawę'],
    sentence: 'Piję kawę bez cukru',
    translation: 'Я пью кофе без сахара',
  }

  it('checks typed PL→RU against the Russian variants', () => {
    const meeting: QuizItem = { ...wordTypedPlRu, word: { ...zrodlo, pl: 'spotkanie', ru: 'встреча, митинг' } }
    expect(checkItem(meeting, 'Митинг')).toEqual({ ok: true, correct: 'встреча, митинг' })
    expect(checkItem(meeting, ' встреча ')).toEqual({ ok: true, correct: 'встреча, митинг' })
    expect(checkItem(wordTypedPlRu, 'кофе').ok).toBe(false)
  })

  it('checks typed RU→PL with the diacritics hint', () => {
    expect(checkItem(wordTypedRuPl, 'zrodlo')).toEqual({
      ok: true,
      correct: 'źródło',
      hint: { correct: 'źródło', marks: [0, 2, 4] },
    })
    expect(checkItem(wordTypedRuPl, 'zrodla')).toEqual({ ok: false, correct: 'źródło' })
  })

  it('checks word choice and omits explain (AC4)', () => {
    const right = checkItem(wordChoice, 'источник')
    expect(right).toEqual({ ok: true, correct: 'источник' })
    expect(right).not.toHaveProperty('explain')

    const wrong = checkItem(wordChoice, 'стол')
    expect(wrong).toEqual({ ok: false, correct: 'источник' })
    expect(wrong).not.toHaveProperty('explain')
  })

  it('checks file choice and includes explain (AC4)', () => {
    expect(checkItem(fileChoice, 'siostra')).toEqual({
      ok: false,
      correct: 'siostrę',
      explain: 'Mieć + biernik.',
    })
    expect(checkItem(fileChoice, 'siostrę')).toEqual({
      ok: true,
      correct: 'siostrę',
      explain: 'Mieć + biernik.',
    })
  })

  it('checks file gap as typed PL with explain', () => {
    expect(checkItem(fileGap, 'kawe')).toEqual({
      ok: true,
      correct: 'kawę',
      explain: 'Pić + biernik.',
      hint: { correct: 'kawę', marks: [3] },
    })
    expect(checkItem(fileGap, 'kawa')).toEqual({ ok: false, correct: 'kawę', explain: 'Pić + biernik.' })
  })

  it('accepts a sentence only in the original order (AC8)', () => {
    expect(checkItem(sentence, ['Piję', 'kawę', 'bez', 'cukru']).ok).toBe(true)

    const swapped = checkItem(sentence, ['Piję', 'bez', 'kawę', 'cukru'])
    expect(swapped.ok).toBe(false)
    expect(swapped.correct).toContain(' — ')
    expect(swapped.correct).toBe('Piję kawę bez cukru — Я пью кофе без сахара')
  })

  it('treats a sentence answer that is not an array, or a typed answer that is an array, as wrong', () => {
    expect(checkItem(sentence, 'Piję kawę bez cukru').ok).toBe(false)
    expect(checkItem(wordTypedPlRu, ['Митинг']).ok).toBe(false)
  })
})

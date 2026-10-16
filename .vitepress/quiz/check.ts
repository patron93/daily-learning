import type { QuizItem } from './types'

export type TypedHint = { correct: string; marks: number[] }

export type TypedResult = { ok: boolean; hint?: TypedHint }

export type CheckResult = {
  ok: boolean
  correct: string
  explain?: string
  hint?: TypedHint
}

const DIACRITIC_MAP: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z',
}

// Trim, collapse whitespace, lowercase, strip trailing .,!?;:… (repeatedly), trim.
export function normalize(s: string): string {
  let out = s.trim().replace(/\s+/g, ' ').toLowerCase()
  let prev = ''
  while (prev !== out) {
    prev = out
    out = out.replace(/[.,!?;:…]+$/, '')
  }
  return out.trim()
}

export function stripDiacritics(s: string): string {
  return s.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => DIACRITIC_MAP[ch] ?? ch)
}

// Accepted Russian answers: split on , and ;; each part yields a variant without
// parenthesised text and a variant with only the parenthesis characters removed.
export function ruVariants(ru: string): string[] {
  const out: string[] = []
  for (const part of ru.split(/[,;]/)) {
    const variants = [part.replace(/\([^)]*\)/g, ''), part.replace(/[()]/g, '')]
    for (const v of variants) {
      const n = normalize(v)
      if (n && !out.includes(n)) out.push(n)
    }
  }
  return out
}

export function checkTyped(input: string, accepted: string[], lang: 'pl' | 'ru'): TypedResult {
  const typed = normalize(input)
  if (accepted.some((a) => normalize(a) === typed)) return { ok: true }

  if (lang === 'pl') {
    const plainTyped = stripDiacritics(typed)
    const match = accepted.find((a) => stripDiacritics(normalize(a)) === plainTyped)
    if (match !== undefined) {
      const correct = match.trim()
      const marks: number[] = []
      for (let i = 0; i < correct.length; i++) {
        // подсвечиваем только буквы, где диакритику пропустили
        if (stripDiacritics(correct[i]) !== correct[i] && typed[i] !== correct[i].toLowerCase()) marks.push(i)
      }
      return { ok: true, hint: { correct, marks } }
    }
  }

  return { ok: false }
}

export function checkItem(item: QuizItem, answer: string | string[]): CheckResult {
  if (item.source === 'file') {
    if (item.kind === 'choice') {
      const { answer: expected, explain } = item.question
      return { ok: answer === expected, correct: expected, explain }
    }
    const { answers, explain } = item.question
    const correct = answers[0] ?? ''
    return { ...checkTypedAnswer(answer, answers, 'pl', correct), explain }
  }

  switch (item.kind) {
    case 'choice':
      return { ok: answer === item.answer, correct: item.answer }
    case 'typed': {
      if (item.dir === 'pl-ru') {
        return checkTypedAnswer(answer, ruVariants(item.word.ru), 'ru', item.word.ru)
      }
      return checkTypedAnswer(answer, [item.word.pl], 'pl', item.word.pl)
    }
    case 'sentence': {
      const ok =
        Array.isArray(answer) &&
        answer.length === item.original.length &&
        answer.every((t, i) => t === item.original[i])
      return { ok, correct: `${item.sentence} — ${item.translation}` }
    }
  }
}

function checkTypedAnswer(
  answer: string | string[],
  accepted: string[],
  lang: 'pl' | 'ru',
  correct: string,
): CheckResult {
  if (typeof answer !== 'string') return { ok: false, correct }
  const r = checkTyped(answer, accepted, lang)
  return r.hint ? { ok: r.ok, correct, hint: r.hint } : { ok: r.ok, correct }
}

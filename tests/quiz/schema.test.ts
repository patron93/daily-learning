import { describe, expect, it } from 'vitest'
import { validateQuizFile } from '../../.vitepress/quiz/schema'

const POLISH_FILE = '2026-10-17-polish.quiz.json'
const TECH_FILE = '2026-10-18-tech.quiz.json'

type Data = Record<string, unknown>

function choice(id: string): Data {
  return {
    id,
    type: 'choice',
    prompt: `Mam ___ (${id}).`,
    options: ['siostrę', 'siostra', 'siostry', 'siostrą'],
    answer: 'siostrę',
    explain: `Mieć + biernik (${id}).`,
  }
}

function gap(id: string): Data {
  return {
    id,
    type: 'gap',
    prompt: `Piję ___ (${id}) codziennie.`,
    answers: ['kawę'],
    explain: `Pić + biernik (${id}).`,
  }
}

function choices(count: number): Data[] {
  return Array.from({ length: count }, (_, i) => choice(`q${i + 1}`))
}

function polishFile(overrides: Data = {}): Data {
  return {
    date: '2026-10-17',
    track: 'polish',
    topic: 'Винительный падеж',
    questions: [...choices(5), gap('q6'), gap('q7'), gap('q8')],
    ...overrides,
  }
}

function techFile(overrides: Data = {}): Data {
  return {
    date: '2026-10-18',
    track: 'tech',
    topic: 'linkedSignal',
    questions: choices(8),
    ...overrides,
  }
}

function withQuestion(data: Data, index: number, patch: Data): Data {
  const questions = data.questions as Data[]
  return {
    ...data,
    questions: questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
  }
}

function withoutKey(data: Data, key: string): Data {
  const copy = { ...data }
  delete copy[key]
  return copy
}

describe('validateQuizFile', () => {
  it('accepts a valid polish file', () => {
    expect(validateQuizFile(POLISH_FILE, polishFile())).toEqual([])
  })

  it('accepts a valid tech file', () => {
    expect(validateQuizFile(TECH_FILE, techFile())).toEqual([])
  })

  it('rejects a file name that does not match the pattern', () => {
    expect(validateQuizFile('2026-10-17-polish.json', polishFile())).toEqual([
      expect.stringContaining('file name'),
    ])
  })

  it('rejects a date that differs from the file name', () => {
    expect(validateQuizFile(POLISH_FILE, polishFile({ date: '2026-10-16' }))).toEqual([
      expect.stringContaining('date'),
    ])
  })

  it('rejects a track that differs from the file name', () => {
    expect(validateQuizFile(POLISH_FILE, polishFile({ track: 'tech', questions: choices(8) }))).toEqual([
      expect.stringContaining('track'),
    ])
  })

  it('rejects 7 questions', () => {
    expect(validateQuizFile(POLISH_FILE, polishFile({ questions: choices(7) }))).toEqual([
      expect.stringContaining('8–10'),
    ])
  })

  it('rejects 11 questions', () => {
    expect(validateQuizFile(POLISH_FILE, polishFile({ questions: choices(11) }))).toEqual([
      expect.stringContaining('8–10'),
    ])
  })

  it('rejects a duplicate question id', () => {
    const data = withQuestion(polishFile(), 1, { id: 'q1' })
    expect(validateQuizFile(POLISH_FILE, data)).toEqual([expect.stringMatching(/"q1".*duplicate id/)])
  })

  it('rejects an empty prompt', () => {
    const data = withQuestion(polishFile(), 2, { prompt: '' })
    expect(validateQuizFile(POLISH_FILE, data)).toEqual([expect.stringMatching(/"q3".*prompt/)])
  })

  it('rejects an empty explain', () => {
    const data = withQuestion(polishFile(), 2, { explain: '   ' })
    expect(validateQuizFile(POLISH_FILE, data)).toEqual([expect.stringMatching(/"q3".*explain/)])
  })

  it('rejects a choice question with 1 option', () => {
    const data = withQuestion(polishFile(), 0, { options: ['siostrę'], answer: 'siostrę' })
    expect(validateQuizFile(POLISH_FILE, data)).toEqual([expect.stringMatching(/"q1".*2–5 entries/)])
  })

  it('rejects a choice question with 6 options', () => {
    const data = withQuestion(polishFile(), 0, { options: ['a', 'b', 'c', 'd', 'e', 'f'], answer: 'a' })
    expect(validateQuizFile(POLISH_FILE, data)).toEqual([expect.stringMatching(/"q1".*2–5 entries/)])
  })

  it('rejects duplicate options', () => {
    const data = withQuestion(polishFile(), 0, { options: ['siostrę', 'siostrę', 'siostry'], answer: 'siostrę' })
    expect(validateQuizFile(POLISH_FILE, data)).toEqual([expect.stringMatching(/"q1".*unique/)])
  })

  it('rejects a choice answer that is not among the options', () => {
    const data = withQuestion(polishFile(), 0, { answer: 'siostra-x' })
    expect(validateQuizFile(POLISH_FILE, data)).toEqual([expect.stringMatching(/"q1".*not one of the options/)])
  })

  it('rejects a gap question on the tech track', () => {
    const data = withQuestion(techFile(), 0, gap('q1'))
    expect(validateQuizFile(TECH_FILE, data)).toEqual([expect.stringMatching(/"q1".*only on the polish track/)])
  })

  it('rejects a gap question with an empty answers list', () => {
    const data = withQuestion(polishFile(), 5, { answers: [] })
    expect(validateQuizFile(POLISH_FILE, data)).toEqual([expect.stringMatching(/"q6".*answers/)])
  })

  it('rejects an unknown question type', () => {
    const data = withQuestion(polishFile(), 0, { type: 'essay' })
    expect(validateQuizFile(POLISH_FILE, data)).toEqual([expect.stringMatching(/"q1".*type.*essay/)])
  })

  it('rejects "{{" inside a prompt', () => {
    const data = withQuestion(polishFile(), 0, { prompt: 'Mam {{siostra}}.' })
    expect(validateQuizFile(POLISH_FILE, data)).toEqual([expect.stringMatching(/"q1".*prompt.*"\{\{"/)])
  })

  it('rejects a missing topic', () => {
    expect(validateQuizFile(POLISH_FILE, withoutKey(polishFile(), 'topic'))).toEqual([
      expect.stringContaining('topic'),
    ])
  })

  it('rejects data that is not an object', () => {
    expect(validateQuizFile(POLISH_FILE, null)).toEqual([expect.stringContaining('object')])
  })
})

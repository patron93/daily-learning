export type Track = 'polish' | 'tech'

export type Word = {
  pl: string
  ru: string
  pos: string
  example: string
  topic: string
  added: string
  next_review: string
  box: number
  reviews: number
}

export type FileQuestion =
  | { id: string; type: 'choice'; prompt: string; options: string[]; answer: string; explain: string }
  | { id: string; type: 'gap'; prompt: string; answers: string[]; explain: string }

export type QuizFile = {
  date: string
  track: Track
  topic: string
  questions: FileQuestion[]
}

export type Direction = 'pl-ru' | 'ru-pl'

export type QuizItem =
  | { key: string; source: 'word'; kind: 'choice'; dir: Direction; word: Word; prompt: string; options: string[]; answer: string }
  | { key: string; source: 'word'; kind: 'typed'; dir: Direction; word: Word; prompt: string }
  | { key: string; source: 'word'; kind: 'sentence'; word: Word; original: string[]; tokens: string[]; sentence: string; translation: string }
  | { key: string; source: 'file'; kind: 'choice'; question: Extract<FileQuestion, { type: 'choice' }>; options: string[]; date: string; track: Track }
  | { key: string; source: 'file'; kind: 'gap'; question: Extract<FileQuestion, { type: 'gap' }>; date: string; track: Track }

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineLoader } from 'vitepress'
import type { QuizFile, Word } from './quiz/types'

export interface QuizData {
  vocab: Word[]
  quizzes: QuizFile[]
}

declare const data: QuizData
export { data }

const root = fileURLToPath(new URL('..', import.meta.url))

export default defineLoader({
  watch: ['../lessons/*.quiz.json', '../polish/vocabulary.json'],
  load(files: string[]): QuizData {
    const vocabPath = path.join(root, 'polish', 'vocabulary.json')
    const vocab: Word[] = JSON.parse(fs.readFileSync(vocabPath, 'utf8')).words ?? []
    const quizzes = files
      .filter((f) => f.endsWith('.quiz.json'))
      .map((f) => JSON.parse(fs.readFileSync(f, 'utf8')) as QuizFile)
      .sort((a, b) => a.date.localeCompare(b.date) || a.track.localeCompare(b.track))
    return { vocab, quizzes }
  },
})

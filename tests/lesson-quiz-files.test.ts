import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateQuizFile } from '../.vitepress/quiz/schema'

const root = fileURLToPath(new URL('..', import.meta.url))
const lessonsDir = join(root, 'lessons')

function listLessonFiles(suffix: string): string[] {
  return readdirSync(lessonsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => entry.name)
    .sort()
}

const quizFiles = listLessonFiles('.quiz.json')
const lessonFiles = listLessonFiles('.md')

const EMBED_TAG_RE = /<LessonQuiz\b[^>]*>/g

describe('lesson quiz files', () => {
  it('every lessons/*.quiz.json parses and passes the schema', () => {
    const failures = quizFiles.map((name) => {
      let data: unknown
      try {
        data = JSON.parse(readFileSync(join(lessonsDir, name), 'utf8'))
      } catch (error) {
        return { file: name, errors: [`invalid JSON: ${(error as Error).message}`] }
      }
      return { file: name, errors: validateQuizFile(name, data) }
    }).filter((result) => result.errors.length > 0)

    expect(failures).toEqual([])
  })

  it('every <LessonQuiz date track> embed points at a matching lesson md and quiz file', () => {
    const problems: string[] = []

    for (const name of lessonFiles) {
      const source = readFileSync(join(lessonsDir, name), 'utf8')
      for (const [tag] of source.matchAll(EMBED_TAG_RE)) {
        const date = /\bdate="([^"]*)"/.exec(tag)?.[1]
        const track = /\btrack="([^"]*)"/.exec(tag)?.[1]
        if (date === undefined || track === undefined) {
          problems.push(`${name}: <LessonQuiz> needs date and track attributes: ${tag}`)
          continue
        }

        const base = `${date}-${track}`
        if (name !== `${base}.md`) {
          problems.push(`${name}: embeds quiz for ${base}, so the lesson file must be named ${base}.md`)
        }
        if (!existsSync(join(lessonsDir, `${base}.quiz.json`))) {
          problems.push(`${name}: missing quiz file lessons/${base}.quiz.json`)
        }
      }
    }

    expect(problems).toEqual([])
  })
})

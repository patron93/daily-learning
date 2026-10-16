import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateQuizFile } from '../../.vitepress/quiz/schema'

const dir = fileURLToPath(new URL('../fixtures/quizzes', import.meta.url))

describe('test fixtures', () => {
  it('every fixture quiz file passes the schema', () => {
    for (const file of fs.readdirSync(dir)) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
      expect(validateQuizFile(file, data), file).toEqual([])
    }
  })
})

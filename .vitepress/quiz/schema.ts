// Validation rules for lessons/YYYY-MM-DD-<track>.quiz.json. Pure TS, no vue/vitepress imports.
// Returns human-readable errors; an empty array means the file is valid.

const FILE_NAME_RE = /^(\d{4}-\d{2}-\d{2})-(polish|tech|electric)\.quiz\.json$/

const MIN_QUESTIONS = 8
const MAX_QUESTIONS = 10
const MIN_OPTIONS = 2
const MAX_OPTIONS = 5

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== ''

// Walks every string in the value and reports any that contains "{{".
function findBraces(value: unknown, path: string, errors: string[]): void {
  if (typeof value === 'string') {
    if (value.includes('{{')) errors.push(`${path} contains "{{"`)
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => findBraces(item, `${path}[${i}]`, errors))
  } else if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) findBraces(item, `${path}.${key}`, errors)
  }
}

function checkChoice(question: Record<string, unknown>, label: string, errors: string[]): void {
  const { options, answer } = question

  if (!Array.isArray(options) || options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    errors.push(`${label}: options must be an array of ${MIN_OPTIONS}–${MAX_OPTIONS} entries`)
  } else {
    if (!options.every(isText)) errors.push(`${label}: every option must be a non-empty string`)
    if (new Set(options).size !== options.length) errors.push(`${label}: options must be unique`)
  }

  if (!isText(answer)) {
    errors.push(`${label}: answer must be a non-empty string`)
  } else if (!Array.isArray(options) || !options.includes(answer)) {
    errors.push(`${label}: answer "${answer}" is not one of the options`)
  }
}

function checkGap(question: Record<string, unknown>, label: string, track: unknown, errors: string[]): void {
  if (track !== 'polish') errors.push(`${label}: gap questions are allowed only on the polish track`)

  const { answers } = question
  if (!Array.isArray(answers) || answers.length === 0 || !answers.every(isText)) {
    errors.push(`${label}: answers must be a non-empty list of non-empty strings`)
  }
}

function checkQuestion(
  raw: unknown,
  index: number,
  track: unknown,
  seenIds: Set<string>,
  errors: string[],
): void {
  if (!isObject(raw)) {
    errors.push(`question #${index + 1} must be an object`)
    return
  }

  const { id, prompt, explain, type } = raw
  const label = isText(id) ? `question "${id}"` : `question #${index + 1}`

  if (!isText(id)) {
    errors.push(`${label}: id must be a non-empty string`)
  } else if (seenIds.has(id)) {
    errors.push(`${label}: duplicate id`)
  } else {
    seenIds.add(id)
  }

  if (!isText(prompt)) errors.push(`${label}: prompt must be a non-empty string`)
  if (!isText(explain)) errors.push(`${label}: explain must be a non-empty string`)

  if (type === 'choice') {
    checkChoice(raw, label, errors)
  } else if (type === 'gap') {
    checkGap(raw, label, track, errors)
  } else {
    errors.push(`${label}: type must be "choice" or "gap", got ${String(type)}`)
  }

  findBraces(raw, label, errors)
}

export function validateQuizFile(fileName: string, data: unknown): string[] {
  const errors: string[] = []

  const name = FILE_NAME_RE.exec(fileName)
  if (!name) {
    errors.push(`file name "${fileName}" must match YYYY-MM-DD-<polish|tech|electric>.quiz.json`)
  }

  if (!isObject(data)) {
    errors.push('quiz file root must be an object')
    return errors
  }

  if (name) {
    if (data.date !== name[1]) {
      errors.push(`date "${String(data.date)}" does not match file name date "${name[1]}"`)
    }
    if (data.track !== name[2]) {
      errors.push(`track "${String(data.track)}" does not match file name track "${name[2]}"`)
    }
  }

  if (!isText(data.topic)) errors.push('topic must be a non-empty string')

  const { questions } = data
  if (!Array.isArray(questions)) {
    errors.push('questions must be an array')
  } else {
    if (questions.length < MIN_QUESTIONS || questions.length > MAX_QUESTIONS) {
      errors.push(`questions must contain ${MIN_QUESTIONS}–${MAX_QUESTIONS} entries, found ${questions.length}`)
    }
    const seenIds = new Set<string>()
    questions.forEach((raw, index) => checkQuestion(raw, index, data.track, seenIds, errors))
  }

  for (const [key, value] of Object.entries(data)) {
    if (key !== 'questions') findBraces(value, key, errors)
  }

  return errors
}

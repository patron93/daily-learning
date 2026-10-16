import { describe, expect, it } from 'vitest'
import { pickPolishVoice } from '../../.vitepress/quiz/speech'

describe('pickPolishVoice', () => {
  it('prefers pl-PL over other Polish voices (AC9)', () => {
    const voices = [{ lang: 'pl' }, { lang: 'pl-PL' }]
    expect(pickPolishVoice(voices)).toBe(voices[1])
  })

  it('returns the pl-PL voice among other languages (AC9)', () => {
    const voices = [{ lang: 'en-US' }, { lang: 'pl-PL' }]
    expect(pickPolishVoice(voices)).toBe(voices[1])
  })

  it('treats underscore as a dash and ignores case', () => {
    const voices = [{ lang: 'pl_PL' }]
    expect(pickPolishVoice(voices)).toBe(voices[0])
    const voices2 = [{ lang: 'de-DE' }, { lang: 'PL-pl' }, { lang: 'pl-PL' }]
    expect(pickPolishVoice(voices2)).toBe(voices2[1])
  })

  it('falls back to any lang starting with pl', () => {
    const voices = [{ lang: 'en-US' }, { lang: 'pl' }]
    expect(pickPolishVoice(voices)).toBe(voices[1])
  })

  it('returns null when no Polish voice exists (AC9)', () => {
    expect(pickPolishVoice([{ lang: 'en-US' }])).toBeNull()
    expect(pickPolishVoice([])).toBeNull()
  })
})

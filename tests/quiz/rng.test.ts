import { describe, expect, it } from 'vitest'
import { mulberry32, sample, shuffle, weightedSample } from '../../.vitepress/quiz/rng'

function take(rng: () => number, n: number): number[] {
  return Array.from({ length: n }, () => rng())
}

describe('mulberry32', () => {
  it('gives the same sequence for the same seed', () => {
    expect(take(mulberry32(42), 20)).toEqual(take(mulberry32(42), 20))
  })

  it('gives different sequences for different seeds', () => {
    expect(take(mulberry32(1), 20)).not.toEqual(take(mulberry32(2), 20))
  })

  it('returns floats in [0, 1)', () => {
    for (const v of take(mulberry32(7), 1000)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('shuffle', () => {
  const input = ['a', 'b', 'c', 'd', 'e', 'f']

  it('returns a permutation of the input', () => {
    const out = shuffle(input, mulberry32(3))
    expect([...out].sort()).toEqual([...input].sort())
    expect(out).toHaveLength(input.length)
  })

  it('does not mutate the input and returns a new array', () => {
    const copy = [...input]
    const out = shuffle(input, mulberry32(3))
    expect(input).toEqual(copy)
    expect(out).not.toBe(input)
  })

  it('is deterministic per seed and varies across seeds', () => {
    expect(shuffle(input, mulberry32(9))).toEqual(shuffle(input, mulberry32(9)))
    const orders = new Set(Array.from({ length: 20 }, (_, s) => shuffle(input, mulberry32(s)).join('')))
    expect(orders.size).toBeGreaterThan(1)
  })
})

describe('sample', () => {
  const input = Array.from({ length: 10 }, (_, i) => i)

  it('returns n distinct elements from the input', () => {
    for (let seed = 0; seed < 50; seed++) {
      const out = sample(input, 4, mulberry32(seed))
      expect(out).toHaveLength(4)
      expect(new Set(out).size).toBe(4)
      for (const v of out) expect(input).toContain(v)
    }
  })

  it('returns all elements when n exceeds the length', () => {
    const out = sample(input, 50, mulberry32(1))
    expect([...out].sort((a, b) => a - b)).toEqual(input)
  })

  it('returns an empty array for n <= 0 or an empty input', () => {
    expect(sample(input, 0, mulberry32(1))).toEqual([])
    expect(sample([], 3, mulberry32(1))).toEqual([])
  })

  it('gives the same sample for the same seed and different samples for different seeds', () => {
    expect(sample(input, 4, mulberry32(5))).toEqual(sample(input, 4, mulberry32(5)))
    const samples = new Set(Array.from({ length: 20 }, (_, s) => sample(input, 4, mulberry32(s)).join(',')))
    expect(samples.size).toBeGreaterThan(1)
  })
})

describe('weightedSample', () => {
  const items = ['a', 'b', 'c', 'd', 'e']

  it('never returns duplicates', () => {
    for (let seed = 0; seed < 100; seed++) {
      const out = weightedSample(items, () => 1, 4, mulberry32(seed))
      expect(out).toHaveLength(4)
      expect(new Set(out).size).toBe(4)
    }
  })

  it('never picks items with weight <= 0', () => {
    const weights: Record<string, number> = { a: 0, b: -3, c: 1, d: 0, e: 2 }
    for (let seed = 0; seed < 100; seed++) {
      const out = weightedSample(items, (t) => weights[t], 5, mulberry32(seed))
      expect(out.every((t) => weights[t] > 0)).toBe(true)
      expect(out).toHaveLength(2)
    }
  })

  it('favours heavier items over many seeds', () => {
    const weights: Record<string, number> = { a: 1, b: 9 }
    let heavy = 0
    let light = 0
    for (let seed = 0; seed < 1000; seed++) {
      const [first] = weightedSample(['a', 'b'], (t) => weights[t], 1, mulberry32(seed))
      if (first === 'b') heavy++
      else light++
    }
    expect(heavy).toBeGreaterThan(light * 4)
  })

  it('returns fewer items when the positive pool is short', () => {
    expect(weightedSample(items, (t) => (t === 'c' ? 1 : 0), 3, mulberry32(1))).toEqual(['c'])
  })
})

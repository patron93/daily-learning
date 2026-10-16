// Seeded PRNG (mulberry32). Returns a function producing floats in [0, 1).
export function mulberry32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Fisher–Yates on a copy; the input is not mutated.
export function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

// Up to n distinct elements (fewer when arr is shorter).
export function sample<T>(arr: readonly T[], n: number, rng: () => number): T[] {
  return shuffle(arr, rng).slice(0, Math.max(0, n))
}

// Roulette selection without replacement. Items with weight <= 0 (or NaN) are never picked.
export function weightedSample<T>(
  items: readonly T[],
  weight: (t: T) => number,
  n: number,
  rng: () => number,
): T[] {
  const pool = items
    .map((item) => ({ item, w: weight(item) }))
    .filter((e) => e.w > 0)
  const out: T[] = []
  while (out.length < n && pool.length > 0) {
    const total = pool.reduce((sum, e) => sum + e.w, 0)
    let r = rng() * total
    let idx = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].w
      if (r < 0) {
        idx = i
        break
      }
    }
    out.push(pool[idx].item)
    pool.splice(idx, 1)
  }
  return out
}

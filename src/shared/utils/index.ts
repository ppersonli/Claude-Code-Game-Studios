/**
 * Pick N unique random items from an array (non-mutating).
 */
export function pickRandomUnique<T>(source: readonly T[], count: number): T[] {
  const copy = [...source]
  const result: T[] = []
  for (let i = 0; i < count; i++) {
    if (copy.length === 0) break
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

/**
 * Blend two hex colors.
 * @param ratio 0 = all c1, 1 = all c2
 */
export function blendColors(c1: string, c2: string, ratio: number): string {
  const hex = (s: string) => parseInt(s, 16)
  const r1 = hex(c1.slice(1, 3)), g1 = hex(c1.slice(3, 5)), b1 = hex(c1.slice(5, 7))
  const r2 = hex(c2.slice(1, 3)), g2 = hex(c2.slice(3, 5)), b2 = hex(c2.slice(5, 7))
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio)
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio)
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Seeded pseudo-random number generator (0–1).
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * Tiered combo multiplier lookup.
 */
export function getComboMultiplier(combo: number): number {
  if (combo <= 1) return 1
  if (combo <= 3) return 1.5
  if (combo <= 5) return 2
  if (combo <= 8) return 3
  return 5
}

/**
 * Generate a daily seed from a date (YYYYMMDD integer).
 */
export function getDailySeed(date?: Date): number {
  const d = date ?? new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

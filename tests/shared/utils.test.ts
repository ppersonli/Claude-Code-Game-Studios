import { describe, it, expect } from 'vitest'
import {
  pickRandomUnique,
  blendColors,
  seededRandom,
  getDailySeed,
  getComboMultiplier,
} from '../../src/shared/utils'

describe('pickRandomUnique', () => {
  it('picks exact count from source', () => {
    const result = pickRandomUnique([1, 2, 3, 4, 5], 3)
    expect(result).toHaveLength(3)
  })

  it('returns all items when count >= source length', () => {
    const result = pickRandomUnique([1, 2, 3], 5)
    expect(result).toHaveLength(3)
    expect(result.sort()).toEqual([1, 2, 3])
  })

  it('returns empty for empty source', () => {
    expect(pickRandomUnique([], 3)).toEqual([])
  })

  it('returns empty for count 0', () => {
    expect(pickRandomUnique([1, 2, 3], 0)).toEqual([])
  })

  it('does not mutate source array', () => {
    const source = [1, 2, 3, 4, 5]
    const copy = [...source]
    pickRandomUnique(source, 3)
    expect(source).toEqual(copy)
  })

  it('returns unique items', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = pickRandomUnique(source, 10)
    expect(new Set(result).size).toBe(result.length)
  })
})

describe('blendColors', () => {
  it('returns c1 when ratio is 0', () => {
    expect(blendColors('#ff0000', '#0000ff', 0)).toBe('#ff0000')
  })

  it('returns c2 when ratio is 1', () => {
    expect(blendColors('#ff0000', '#0000ff', 1)).toBe('#0000ff')
  })

  it('returns midpoint at ratio 0.5', () => {
    const result = blendColors('#ff0000', '#0000ff', 0.5)
    expect(result).toBe('#800080')
  })

  it('blends all channels correctly', () => {
    const result = blendColors('#ffffff', '#000000', 0.5)
    expect(result).toBe('#808080')
  })
})

describe('seededRandom', () => {
  it('returns a number between 0 and 1', () => {
    const r = seededRandom(12345)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThan(1)
  })

  it('returns the same value for the same seed', () => {
    expect(seededRandom(42)).toBe(seededRandom(42))
  })

  it('returns different values for different seeds', () => {
    expect(seededRandom(1)).not.toBe(seededRandom(2))
  })
})

describe('getDailySeed', () => {
  it('returns YYYYMMDD format', () => {
    const seed = getDailySeed(new Date(2026, 0, 15)) // Jan 15, 2026
    expect(seed).toBe(20260115)
  })

  it('handles December correctly', () => {
    const seed = getDailySeed(new Date(2026, 11, 31)) // Dec 31, 2026
    expect(seed).toBe(20261231)
  })

  it('returns a number when called without args', () => {
    const seed = getDailySeed()
    expect(typeof seed).toBe('number')
    expect(seed).toBeGreaterThan(20250000)
  })
})

describe('getComboMultiplier', () => {
  it('returns 1 for combo 0 or 1', () => {
    expect(getComboMultiplier(0)).toBe(1)
    expect(getComboMultiplier(1)).toBe(1)
  })

  it('returns 1.5 for combo 2-3', () => {
    expect(getComboMultiplier(2)).toBe(1.5)
    expect(getComboMultiplier(3)).toBe(1.5)
  })

  it('returns 2 for combo 4-5', () => {
    expect(getComboMultiplier(4)).toBe(2)
    expect(getComboMultiplier(5)).toBe(2)
  })

  it('returns 3 for combo 6-8', () => {
    expect(getComboMultiplier(6)).toBe(3)
    expect(getComboMultiplier(8)).toBe(3)
  })

  it('returns 5 for combo 9+', () => {
    expect(getComboMultiplier(9)).toBe(5)
    expect(getComboMultiplier(100)).toBe(5)
  })
})

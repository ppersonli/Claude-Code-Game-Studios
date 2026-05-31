import { describe, it, expect } from 'vitest'
import { LEVELS, getPairCount, getUnlockedLevelCount } from '../../src/games/meme-match/data/levels'

describe('LEVELS', () => {
  it('has 5 levels', () => {
    expect(LEVELS).toHaveLength(5)
  })

  it('each level has required fields', () => {
    for (const level of LEVELS) {
      expect(level.id).toBeGreaterThan(0)
      expect(level.name).toBeTruthy()
      expect(level.cols).toBeGreaterThan(0)
      expect(level.rows).toBeGreaterThan(0)
      expect(level.timeLimit).toBeGreaterThan(0)
      expect(level.requiredScore).toBeGreaterThanOrEqual(0)
    }
  })

  it('each level has an even number of cells (rows × cols)', () => {
    for (const level of LEVELS) {
      expect((level.rows * level.cols) % 2).toBe(0)
    }
  })

  it('required scores are monotonically increasing', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].requiredScore).toBeGreaterThan(LEVELS[i - 1].requiredScore)
    }
  })

  it('time limits are increasing', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].timeLimit).toBeGreaterThanOrEqual(LEVELS[i - 1].timeLimit)
    }
  })
})

describe('getPairCount', () => {
  it('returns correct pair count for each level', () => {
    expect(getPairCount(LEVELS[0])).toBe(6)   // 4×3 / 2
    expect(getPairCount(LEVELS[1])).toBe(8)   // 4×4 / 2
    expect(getPairCount(LEVELS[2])).toBe(10)  // 5×4 / 2
    expect(getPairCount(LEVELS[3])).toBe(12)  // 6×4 / 2
    expect(getPairCount(LEVELS[4])).toBe(15)  // 6×5 / 2
  })
})

describe('getUnlockedLevelCount', () => {
  it('returns 1 for score 0 (only Easy)', () => {
    expect(getUnlockedLevelCount(0)).toBe(1)
  })

  it('returns 2 for score 500 (Easy + Medium)', () => {
    expect(getUnlockedLevelCount(500)).toBe(2)
  })

  it('returns 5 for score 5000+ (all levels)', () => {
    expect(getUnlockedLevelCount(5000)).toBe(5)
    expect(getUnlockedLevelCount(99999)).toBe(5)
  })

  it('returns 1 for score below first threshold', () => {
    expect(getUnlockedLevelCount(100)).toBe(1)
  })

  it('returns 3 for score 1500', () => {
    expect(getUnlockedLevelCount(1500)).toBe(3)
  })
})

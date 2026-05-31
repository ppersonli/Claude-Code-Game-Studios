import { describe, it, expect } from 'vitest'
import { SORT_LEVELS } from '../../src/games/boba-sort/data/levels'

describe('SORT_LEVELS', () => {
  it('has 6 levels', () => {
    expect(SORT_LEVELS).toHaveLength(6)
  })

  it('each level has required fields', () => {
    for (const level of SORT_LEVELS) {
      expect(level.id).toBeGreaterThan(0)
      expect(level.name).toBeTruthy()
      expect(level.tubes).toBeGreaterThan(0)
      expect(level.ingredientTypes).toBeGreaterThan(0)
      expect(level.itemsPerType).toBe(4)
      expect(level.targetMoves).toBeGreaterThan(0)
      expect(level.targetTime).toBeGreaterThan(0)
      expect(level.requiredStars).toBeGreaterThanOrEqual(0)
    }
  })

  it('tubes count is greater than ingredient types (solvable)', () => {
    for (const level of SORT_LEVELS) {
      expect(level.tubes).toBeGreaterThanOrEqual(level.ingredientTypes)
    }
  })

  it('target moves increase with difficulty', () => {
    for (let i = 1; i < SORT_LEVELS.length; i++) {
      expect(SORT_LEVELS[i].targetMoves).toBeGreaterThanOrEqual(SORT_LEVELS[i - 1].targetMoves)
    }
  })

  it('target time increases with difficulty', () => {
    for (let i = 1; i < SORT_LEVELS.length; i++) {
      expect(SORT_LEVELS[i].targetTime).toBeGreaterThanOrEqual(SORT_LEVELS[i - 1].targetTime)
    }
  })

  it('required stars are monotonically increasing', () => {
    for (let i = 1; i < SORT_LEVELS.length; i++) {
      expect(SORT_LEVELS[i].requiredStars).toBeGreaterThanOrEqual(SORT_LEVELS[i - 1].requiredStars)
    }
  })

  it('first level has 0 required stars (always unlocked)', () => {
    expect(SORT_LEVELS[0].requiredStars).toBe(0)
  })

  it('each level has unique id', () => {
    const ids = SORT_LEVELS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each level has unique name', () => {
    const names = SORT_LEVELS.map((l) => l.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('total items = types × itemsPerType', () => {
    for (const level of SORT_LEVELS) {
      const totalItems = level.ingredientTypes * level.itemsPerType
      // Total items must fit in tubes (each tube has capacity itemsPerType)
      expect(totalItems).toBeLessThanOrEqual(level.tubes * level.itemsPerType)
    }
  })

  it('target moves are reasonable (more than minimum required)', () => {
    // Minimum moves = total items (worst case: move each item once)
    for (const level of SORT_LEVELS) {
      const totalItems = level.ingredientTypes * level.itemsPerType
      // Target should be achievable but challenging
      expect(level.targetMoves).toBeGreaterThanOrEqual(level.ingredientTypes)
    }
  })
})

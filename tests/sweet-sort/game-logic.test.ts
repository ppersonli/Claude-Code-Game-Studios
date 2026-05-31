import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  GAME_CANDY_COLORS,
  COLOR_NAMES,
  COLOR_VALUES,
  getColorByIndex,
  getColorHex,
  createRNG,
  getLevelConfig,
  calculateOptimalMoves,
  createSolvableLevel,
  generateLevel,
  getStarRating,
  isValidMove,
  executeMove,
  checkCompletion,
  getDefaultSave,
  updateLevelResult,
  type SaveData,
} from '../../src/games/sweet-sort/core'

// ─── Color ──────────────────────────────────────────────────────────────────

describe('Color', () => {
  it('has 8 candy colors', () => {
    expect(GAME_CANDY_COLORS).toHaveLength(8)
  })

  it('each color has name, hex, and label', () => {
    for (const color of GAME_CANDY_COLORS) {
      expect(color.name).toBeTypeOf('string')
      expect(color.hex).toBeTypeOf('number')
      expect(color.label).toBeTypeOf('string')
    }
  })

  it('COLOR_NAMES has correct values', () => {
    expect(COLOR_NAMES).toEqual(['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'TEAL'])
  })

  it('COLOR_VALUES has correct values', () => {
    expect(COLOR_VALUES).toEqual([
      0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFA07A,
      0xDDA0DD, 0xFF8C42, 0xFF85A1, 0x5F9EA0
    ])
  })

  it('getColorByIndex returns correct color', () => {
    expect(getColorByIndex(0)).toEqual({ name: 'RED', hex: 0xFF6B6B, label: 'Red' })
    expect(getColorByIndex(7)).toEqual({ name: 'TEAL', hex: 0x5F9EA0, label: 'Teal' })
  })

  it('getColorByIndex throws for invalid index', () => {
    expect(() => getColorByIndex(-1)).toThrow('Invalid color index')
    expect(() => getColorByIndex(8)).toThrow('Invalid color index')
  })

  it('getColorHex returns correct hex', () => {
    expect(getColorHex(0)).toBe(0xFF6B6B)
    expect(getColorHex(7)).toBe(0x5F9EA0)
  })

  it('getColorHex throws for invalid index', () => {
    expect(() => getColorHex(-1)).toThrow('Invalid color index')
  })
})

// ─── RNG ────────────────────────────────────────────────────────────────────

describe('createRNG', () => {
  it('returns a function', () => {
    const rng = createRNG(1)
    expect(rng).toBeTypeOf('function')
  })

  it('produces deterministic output for same seed', () => {
    const rng1 = createRNG(42)
    const rng2 = createRNG(42)
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2())
    }
  })

  it('produces different output for different seeds', () => {
    const rng1 = createRNG(1)
    const rng2 = createRNG(2)
    const values1 = Array.from({ length: 10 }, () => rng1())
    const values2 = Array.from({ length: 10 }, () => rng2())
    expect(values1).not.toEqual(values2)
  })

  it('returns values between 0 and 1', () => {
    const rng = createRNG(123)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('produces varying values', () => {
    const rng = createRNG(1)
    const values = new Set(Array.from({ length: 100 }, () => rng()))
    expect(values.size).toBeGreaterThan(50)
  })
})

// ─── Level Config ───────────────────────────────────────────────────────────

describe('getLevelConfig', () => {
  it('level 1-5: 2 colors, 3 tubes, capacity 3', () => {
    for (let i = 1; i <= 5; i++) {
      const config = getLevelConfig(i)
      expect(config.numColors).toBe(2)
      expect(config.numTubes).toBe(4) // Math.max(3, 2+2)
      expect(config.capacity).toBe(3)
      expect(config.shuffleMoves).toBe(3)
      expect(config.levelNum).toBe(i)
    }
  })

  it('level 6-10: 3 colors, 4 tubes, capacity 3', () => {
    for (let i = 6; i <= 10; i++) {
      const config = getLevelConfig(i)
      expect(config.numColors).toBe(3)
      expect(config.numTubes).toBe(5) // Math.max(4, 3+2)
      expect(config.capacity).toBe(3)
      expect(config.shuffleMoves).toBe(4)
    }
  })

  it('level 11-15: 3 colors, 4 tubes, capacity 4', () => {
    for (let i = 11; i <= 15; i++) {
      const config = getLevelConfig(i)
      expect(config.numColors).toBe(3)
      expect(config.numTubes).toBe(5) // Math.max(4, 3+2)
      expect(config.capacity).toBe(4)
      expect(config.shuffleMoves).toBe(5)
    }
  })

  it('level 16-20: 4 colors, 5 tubes, capacity 3', () => {
    for (let i = 16; i <= 20; i++) {
      const config = getLevelConfig(i)
      expect(config.numColors).toBe(4)
      expect(config.numTubes).toBe(6) // Math.max(5, 4+2)
      expect(config.capacity).toBe(3)
      expect(config.shuffleMoves).toBe(6)
    }
  })

  it('level 21+ scales difficulty', () => {
    const config = getLevelConfig(21)
    expect(config.numColors).toBeGreaterThanOrEqual(4)
    expect(config.numTubes).toBeGreaterThanOrEqual(6)
  })

  it('numColors never exceeds COLOR_NAMES.length', () => {
    const config = getLevelConfig(1000)
    expect(config.numColors).toBeLessThanOrEqual(COLOR_NAMES.length)
  })

  it('numTubes is always at least numColors + 2', () => {
    for (let i = 1; i <= 100; i += 5) {
      const config = getLevelConfig(i)
      expect(config.numTubes).toBeGreaterThanOrEqual(config.numColors + 2)
    }
  })
})

// ─── calculateOptimalMoves ──────────────────────────────────────────────────

describe('calculateOptimalMoves', () => {
  it('returns 0 for empty tubes', () => {
    expect(calculateOptimalMoves([[], []], 4)).toBe(0)
  })

  it('returns 0 for already sorted tubes', () => {
    expect(calculateOptimalMoves([[0, 0, 0], [1, 1, 1]], 3)).toBe(0)
  })

  it('counts misplaced candies', () => {
    // tube: [0, 1] - top is 1, bottom is 0 (misplaced)
    expect(calculateOptimalMoves([[0, 1]], 2)).toBe(1)
  })

  it('divides by 2 and rounds up', () => {
    // [0, 1, 0] - top color is 0, sameCount=1, misplaced=2, ceil(2/2)=1
    expect(calculateOptimalMoves([[0, 1, 0]], 3)).toBe(1)
  })

  it('handles multiple tubes', () => {
    // tube1: [0, 1] misplaced=1, tube2: [1, 0] misplaced=1, total=2, ceil(2/2)=1
    expect(calculateOptimalMoves([[0, 1], [1, 0]], 2)).toBe(1)
  })

  it('handles single color tube as sorted', () => {
    expect(calculateOptimalMoves([[0, 0, 0]], 3)).toBe(0)
  })
})

// ─── createSolvableLevel ────────────────────────────────────────────────────

describe('createSolvableLevel', () => {
  it('returns correct structure', () => {
    const config = getLevelConfig(1)
    const level = createSolvableLevel(config)
    expect(level).toHaveProperty('tubes')
    expect(level).toHaveProperty('numColors')
    expect(level).toHaveProperty('capacity')
    expect(level).toHaveProperty('optimalMoves')
    expect(level).toHaveProperty('levelNum')
  })

  it('has correct number of tubes', () => {
    const config = getLevelConfig(1)
    const level = createSolvableLevel(config)
    expect(level.tubes).toHaveLength(config.numTubes)
  })

  it('all tubes respect capacity', () => {
    const config = getLevelConfig(1)
    const level = createSolvableLevel(config)
    for (const tube of level.tubes) {
      expect(tube.length).toBeLessThanOrEqual(config.capacity)
    }
  })

  it('all candies are valid color indices', () => {
    const config = getLevelConfig(1)
    const level = createSolvableLevel(config)
    for (const tube of level.tubes) {
      for (const candy of tube) {
        expect(candy).toBeGreaterThanOrEqual(0)
        expect(candy).toBeLessThan(config.numColors)
      }
    }
  })

  it('total candies equals numColors * capacity', () => {
    const config = getLevelConfig(1)
    const level = createSolvableLevel(config)
    const total = level.tubes.reduce((sum, tube) => sum + tube.length, 0)
    expect(total).toBe(config.numColors * config.capacity)
  })

  it('optimalMoves is at least 3', () => {
    const config = getLevelConfig(1)
    const level = createSolvableLevel(config)
    expect(level.optimalMoves).toBeGreaterThanOrEqual(3)
  })

  it('produces deterministic output for same level', () => {
    const level1 = generateLevel(5)
    const level2 = generateLevel(5)
    expect(level1.tubes).toEqual(level2.tubes)
    expect(level1.optimalMoves).toBe(level2.optimalMoves)
  })

  it('produces different output for different levels', () => {
    const level1 = generateLevel(1) // 2 colors, shuffleMoves=3
    const level2 = generateLevel(6) // 3 colors, shuffleMoves=4
    // Different seeds should produce different puzzles
    expect(JSON.stringify(level1.tubes)).not.toBe(JSON.stringify(level2.tubes))
  })
})

// ─── generateLevel ──────────────────────────────────────────────────────────

describe('generateLevel', () => {
  it('generates a level for level 1', () => {
    const level = generateLevel(1)
    expect(level.numColors).toBe(2)
    expect(level.tubes).toHaveLength(4) // Math.max(3, 2+2)
    expect(level.capacity).toBe(3)
  })

  it('generates a level for level 50', () => {
    const level = generateLevel(50)
    expect(level.numColors).toBeGreaterThanOrEqual(4)
    expect(level.tubes.length).toBeGreaterThanOrEqual(6)
  })

  it('is deterministic', () => {
    const l1 = generateLevel(42)
    const l2 = generateLevel(42)
    expect(l1.tubes).toEqual(l2.tubes)
  })
})

// ─── getStarRating ──────────────────────────────────────────────────────────

describe('getStarRating', () => {
  it('returns 3 stars for moves <= optimal', () => {
    expect(getStarRating(5, 5)).toBe(3)
    expect(getStarRating(3, 5)).toBe(3)
  })

  it('returns 2 stars for moves <= optimal * 1.5', () => {
    expect(getStarRating(6, 5)).toBe(2)  // 6 <= 7.5
    expect(getStarRating(7, 5)).toBe(2)  // 7 <= 7.5
  })

  it('returns 1 star for moves > optimal * 1.5', () => {
    expect(getStarRating(8, 5)).toBe(1)  // 8 > 7.5
    expect(getStarRating(100, 5)).toBe(1)
  })

  it('boundary: exactly at optimal * 1.5', () => {
    expect(getStarRating(7, 5)).toBe(2)  // 7 <= 7.5
  })
})

// ─── isValidMove ────────────────────────────────────────────────────────────

describe('isValidMove', () => {
  it('returns true for valid move to empty tube', () => {
    const tubes = [[0, 1], []]
    expect(isValidMove(tubes, 0, 1, 3)).toBe(true)
  })

  it('returns true for move onto same color', () => {
    const tubes = [[1], [0, 1]] // top of both tubes is 1
    expect(isValidMove(tubes, 0, 1, 3)).toBe(true)
  })

  it('returns false for move onto different color', () => {
    const tubes = [[0], [1]]
    expect(isValidMove(tubes, 0, 1, 3)).toBe(false)
  })

  it('returns false when source is empty', () => {
    const tubes = [[], [0]]
    expect(isValidMove(tubes, 0, 1, 3)).toBe(false)
  })

  it('returns false when target is full', () => {
    const tubes = [[0], [1, 1, 1]]
    expect(isValidMove(tubes, 0, 1, 3)).toBe(false)
  })

  it('returns false when from === to', () => {
    const tubes = [[0]]
    expect(isValidMove(tubes, 0, 0, 3)).toBe(false)
  })

  it('returns false for out-of-bounds indices', () => {
    const tubes = [[0]]
    expect(isValidMove(tubes, -1, 0, 3)).toBe(false)
    expect(isValidMove(tubes, 0, -1, 3)).toBe(false)
    expect(isValidMove(tubes, 0, 5, 3)).toBe(false)
    expect(isValidMove(tubes, 5, 0, 3)).toBe(false)
  })

  it('allows moving onto same color in multi-candy tube', () => {
    const tubes = [[0], [1, 0]]
    expect(isValidMove(tubes, 0, 1, 4)).toBe(true)
  })

  it('blocks moving different color onto non-empty tube', () => {
    const tubes = [[0], [1, 1]]
    expect(isValidMove(tubes, 0, 1, 4)).toBe(false)
  })
})

// ─── executeMove ────────────────────────────────────────────────────────────

describe('executeMove', () => {
  it('moves candy from source to target', () => {
    const tubes = [[0, 1], []]
    const candy = executeMove(tubes, 0, 1)
    expect(candy).toBe(1)
    expect(tubes[0]).toEqual([0])
    expect(tubes[1]).toEqual([1])
  })

  it('always moves the top candy', () => {
    const tubes = [[0, 1, 2], []]
    executeMove(tubes, 0, 1)
    expect(tubes[0]).toEqual([0, 1])
    expect(tubes[1]).toEqual([2])
  })

  it('can move onto matching color', () => {
    const tubes = [[0], [0]]
    executeMove(tubes, 0, 1)
    expect(tubes[0]).toEqual([])
    expect(tubes[1]).toEqual([0, 0])
  })
})

// ─── checkCompletion ────────────────────────────────────────────────────────

describe('checkCompletion', () => {
  it('returns true for all empty tubes', () => {
    expect(checkCompletion([[], []])).toBe(true)
  })

  it('returns true for sorted tubes', () => {
    expect(checkCompletion([[0, 0], [1, 1]])).toBe(true)
  })

  it('returns true when some tubes are empty', () => {
    expect(checkCompletion([[0, 0, 0], []])).toBe(true)
  })

  it('returns false for mixed tube', () => {
    expect(checkCompletion([[0, 1]])).toBe(false)
  })

  it('returns false when one tube is mixed', () => {
    expect(checkCompletion([[0, 0], [0, 1]])).toBe(false)
  })

  it('returns true for single color tube', () => {
    expect(checkCompletion([[2, 2, 2]])).toBe(true)
  })
})

// ─── Save Data ──────────────────────────────────────────────────────────────

describe('getDefaultSave', () => {
  it('returns correct defaults', () => {
    const save = getDefaultSave()
    expect(save.currentLevel).toBe(1)
    expect(save.stars).toEqual({})
    expect(save.totalStars).toBe(0)
    expect(save.highScores).toEqual({})
    expect(save.unlocks).toEqual([])
    expect(save.candyCollection).toEqual([])
  })
})

describe('updateLevelResult', () => {
  let save: SaveData

  beforeEach(() => {
    save = getDefaultSave()
  })

  it('records stars for new level', () => {
    updateLevelResult(save, 1, 3, 5)
    expect(save.stars[1]).toBe(3)
    expect(save.totalStars).toBe(3)
  })

  it('updates stars if higher', () => {
    updateLevelResult(save, 1, 1, 10)
    updateLevelResult(save, 1, 3, 5)
    expect(save.stars[1]).toBe(3)
    expect(save.totalStars).toBe(3)
  })

  it('does not reduce stars', () => {
    updateLevelResult(save, 1, 3, 5)
    updateLevelResult(save, 1, 1, 10)
    expect(save.stars[1]).toBe(3)
    expect(save.totalStars).toBe(3)
  })

  it('adds difference when upgrading stars', () => {
    updateLevelResult(save, 1, 2, 8)
    expect(save.totalStars).toBe(2)
    updateLevelResult(save, 1, 3, 5)
    expect(save.totalStars).toBe(3)
  })

  it('records high score', () => {
    updateLevelResult(save, 1, 3, 5)
    expect(save.highScores[1]).toBe(5)
  })

  it('updates high score if lower', () => {
    updateLevelResult(save, 1, 3, 10)
    updateLevelResult(save, 1, 3, 5)
    expect(save.highScores[1]).toBe(5)
  })

  it('does not increase high score', () => {
    updateLevelResult(save, 1, 3, 5)
    updateLevelResult(save, 1, 3, 10)
    expect(save.highScores[1]).toBe(5)
  })

  it('advances current level', () => {
    updateLevelResult(save, 1, 3, 5)
    expect(save.currentLevel).toBe(2)
  })

  it('advances current level past current', () => {
    updateLevelResult(save, 5, 3, 5)
    expect(save.currentLevel).toBe(6)
  })

  it('does not decrease current level', () => {
    updateLevelResult(save, 5, 3, 5)
    updateLevelResult(save, 3, 3, 5)
    expect(save.currentLevel).toBe(6)
  })

  it('handles multiple levels', () => {
    updateLevelResult(save, 1, 3, 5)
    updateLevelResult(save, 2, 2, 8)
    updateLevelResult(save, 3, 1, 15)
    expect(save.totalStars).toBe(6)
    expect(save.currentLevel).toBe(4)
    expect(save.stars[1]).toBe(3)
    expect(save.stars[2]).toBe(2)
    expect(save.stars[3]).toBe(1)
  })
})

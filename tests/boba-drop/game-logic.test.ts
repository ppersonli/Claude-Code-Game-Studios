import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateMergeScore,
  isMaxLevel,
} from '../../src/games/boba-drop/logic/scoring'
import {
  loadSave,
  saveSave,
  updateHighScore,
} from '../../src/games/boba-drop/logic/save'
import {
  getRandomLevel,
  canMerge,
  processMerge,
  checkGameOver,
  clampDropX,
  createGameState,
  type IngredientBody,
} from '../../src/games/boba-drop/logic/game-state'
import {
  INGREDIENTS,
  MAX_INGREDIENT_LEVEL,
  getMaxDropLevel,
} from '../../src/games/boba-drop/data/ingredients'
import {
  GAME_W,
  GAME_H,
  CUP_TOP,
  CUP_BOTTOM,
  CUP_TOP_WIDTH,
  CUP_BOTTOM_WIDTH,
  CUP_LEFT_TOP,
  CUP_RIGHT_TOP,
  CUP_LEFT_BOTTOM,
  CUP_RIGHT_BOTTOM,
  DROP_ZONE_Y,
  DROP_COOLDOWN,
  OVERFLOW_TIME,
  WALL_THICKNESS,
} from '../../src/games/boba-drop/logic/constants'

// ===== Mock localStorage =====
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ===== Ingredients =====
describe('INGREDIENTS', () => {
  it('has 8 ingredients', () => {
    expect(INGREDIENTS).toHaveLength(8)
  })

  it('each ingredient has name, nameEn, radius, color', () => {
    for (const ing of INGREDIENTS) {
      expect(typeof ing.name).toBe('string')
      expect(typeof ing.nameEn).toBe('string')
      expect(typeof ing.radius).toBe('number')
      expect(typeof ing.color).toBe('number')
      expect(ing.radius).toBeGreaterThan(0)
    }
  })

  it('radii are strictly increasing', () => {
    for (let i = 1; i < INGREDIENTS.length; i++) {
      expect(INGREDIENTS[i].radius).toBeGreaterThan(INGREDIENTS[i - 1].radius)
    }
  })

  it('MAX_INGREDIENT_LEVEL is last index', () => {
    expect(MAX_INGREDIENT_LEVEL).toBe(INGREDIENTS.length - 1)
  })

  it('getMaxDropLevel returns min(4, MAX_INGREDIENT_LEVEL)', () => {
    expect(getMaxDropLevel()).toBe(Math.min(4, MAX_INGREDIENT_LEVEL))
  })
})

// ===== Constants =====
describe('constants', () => {
  it('GAME_W and GAME_H are positive', () => {
    expect(GAME_W).toBeGreaterThan(0)
    expect(GAME_H).toBeGreaterThan(0)
  })

  it('cup geometry is consistent', () => {
    expect(CUP_TOP).toBeLessThan(CUP_BOTTOM)
    expect(CUP_LEFT_TOP).toBeLessThan(CUP_RIGHT_TOP)
    expect(CUP_LEFT_BOTTOM).toBeLessThan(CUP_RIGHT_BOTTOM)
    expect(CUP_TOP_WIDTH).toBeGreaterThan(CUP_BOTTOM_WIDTH)
  })

  it('derived cup edges match formulas', () => {
    expect(CUP_LEFT_TOP).toBe((GAME_W - CUP_TOP_WIDTH) / 2)
    expect(CUP_RIGHT_TOP).toBe(CUP_LEFT_TOP + CUP_TOP_WIDTH)
    expect(CUP_LEFT_BOTTOM).toBe((GAME_W - CUP_BOTTOM_WIDTH) / 2)
    expect(CUP_RIGHT_BOTTOM).toBe(CUP_LEFT_BOTTOM + CUP_BOTTOM_WIDTH)
  })

  it('DROP_ZONE_Y is above CUP_TOP', () => {
    expect(DROP_ZONE_Y).toBeLessThan(CUP_TOP)
  })

  it('timing constants are positive', () => {
    expect(DROP_COOLDOWN).toBeGreaterThan(0)
    expect(OVERFLOW_TIME).toBeGreaterThan(0)
    expect(WALL_THICKNESS).toBeGreaterThan(0)
  })
})

// ===== Scoring =====
describe('calculateMergeScore', () => {
  it('level 0 -> 1 gives 10 points', () => {
    expect(calculateMergeScore(0)).toBe(10)
  })

  it('level 1 -> 2 gives 40 points', () => {
    expect(calculateMergeScore(1)).toBe(40)
  })

  it('level 2 -> 3 gives 90 points', () => {
    expect(calculateMergeScore(2)).toBe(90)
  })

  it('level 6 -> 7 gives 490 points', () => {
    expect(calculateMergeScore(6)).toBe(490)
  })

  it('follows formula (level+1)^2 * 10', () => {
    for (let l = 0; l < 7; l++) {
      expect(calculateMergeScore(l)).toBe((l + 1) * (l + 1) * 10)
    }
  })
})

describe('isMaxLevel', () => {
  it('returns true for level >= maxLevel', () => {
    expect(isMaxLevel(7, 7)).toBe(true)
    expect(isMaxLevel(8, 7)).toBe(true)
  })

  it('returns false for level < maxLevel', () => {
    expect(isMaxLevel(6, 7)).toBe(false)
    expect(isMaxLevel(0, 7)).toBe(false)
  })
})

// ===== Save/Load =====
describe('save/load', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadSave returns default when no data', () => {
    const save = loadSave()
    expect(save.highScore).toBe(0)
  })

  it('saveSave and loadSave round-trip', () => {
    saveSave({ highScore: 1234 })
    const loaded = loadSave()
    expect(loaded.highScore).toBe(1234)
  })

  it('loadSave handles corrupted JSON gracefully', () => {
    localStorage.setItem('boba-drop-save', 'NOT_JSON')
    const save = loadSave()
    expect(save.highScore).toBe(0)
  })

  it('loadSave handles missing highScore field', () => {
    localStorage.setItem('boba-drop-save', JSON.stringify({ foo: 'bar' }))
    const save = loadSave()
    expect(save.highScore).toBe(0)
  })

  it('updateHighScore saves when score is higher', () => {
    saveSave({ highScore: 100 })
    const result = updateHighScore(200)
    expect(result.highScore).toBe(200)
    expect(loadSave().highScore).toBe(200)
  })

  it('updateHighScore does not overwrite when score is lower', () => {
    saveSave({ highScore: 500 })
    const result = updateHighScore(300)
    expect(result.highScore).toBe(500)
  })

  it('updateHighScore handles equal score', () => {
    saveSave({ highScore: 100 })
    const result = updateHighScore(100)
    expect(result.highScore).toBe(100)
  })
})

// ===== Game State =====
describe('createGameState', () => {
  it('returns correct initial values', () => {
    const state = createGameState()
    expect(state.score).toBe(0)
    expect(state.ingredients).toEqual([])
    expect(state.canDrop).toBe(true)
    expect(state.gameOver).toBe(false)
    expect(state.merging.size).toBe(0)
    expect(typeof state.nextLevel).toBe('number')
  })

  it('nextLevel is within droppable range', () => {
    for (let i = 0; i < 50; i++) {
      const state = createGameState()
      expect(state.nextLevel).toBeGreaterThanOrEqual(0)
      expect(state.nextLevel).toBeLessThanOrEqual(getMaxDropLevel())
    }
  })
})

describe('getRandomLevel', () => {
  it('returns a number between 0 and maxDropLevel inclusive', () => {
    const max = getMaxDropLevel()
    for (let i = 0; i < 100; i++) {
      const level = getRandomLevel()
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(max)
    }
  })

  it('eventually produces all valid levels', () => {
    const seen = new Set<number>()
    const max = getMaxDropLevel()
    for (let i = 0; i < 500; i++) {
      seen.add(getRandomLevel())
    }
    for (let l = 0; l <= max; l++) {
      expect(seen.has(l)).toBe(true)
    }
  })
})

describe('canMerge', () => {
  const makeBody = (id: number, level: number): IngredientBody => ({
    id,
    x: 0,
    y: 0,
    level,
    droppedAt: 0,
  })

  it('allows merge of same-level non-max ingredients', () => {
    expect(canMerge(makeBody(1, 0), makeBody(2, 0), new Set())).toBe(true)
    expect(canMerge(makeBody(1, 3), makeBody(2, 3), new Set())).toBe(true)
  })

  it('rejects different levels', () => {
    expect(canMerge(makeBody(1, 0), makeBody(2, 1), new Set())).toBe(false)
    expect(canMerge(makeBody(1, 2), makeBody(2, 5), new Set())).toBe(false)
  })

  it('rejects max-level merges', () => {
    const maxLvl = MAX_INGREDIENT_LEVEL
    expect(canMerge(makeBody(1, maxLvl), makeBody(2, maxLvl), new Set())).toBe(false)
  })

  it('rejects if either is already merging', () => {
    const merging = new Set<number>([1])
    expect(canMerge(makeBody(1, 0), makeBody(2, 0), merging)).toBe(false)
    expect(canMerge(makeBody(2, 0), makeBody(1, 0), merging)).toBe(false)
  })

  it('rejects if both are merging', () => {
    const merging = new Set<number>([1, 2])
    expect(canMerge(makeBody(1, 0), makeBody(2, 0), merging)).toBe(false)
  })
})

describe('processMerge', () => {
  it('creates a new body at midpoint', () => {
    const a: IngredientBody = { id: 1, x: 100, y: 200, level: 2, droppedAt: 0 }
    const b: IngredientBody = { id: 2, x: 200, y: 400, level: 2, droppedAt: 0 }
    const result = processMerge(a, b, 1000)
    expect(result.newBody.x).toBe(150)
    expect(result.newBody.y).toBe(300)
    expect(result.newBody.level).toBe(3)
  })

  it('calculates correct points', () => {
    const a: IngredientBody = { id: 1, x: 0, y: 0, level: 1, droppedAt: 0 }
    const b: IngredientBody = { id: 2, x: 0, y: 0, level: 1, droppedAt: 0 }
    const result = processMerge(a, b, 0)
    expect(result.points).toBe(calculateMergeScore(1))
  })

  it('sets droppedAt to provided time', () => {
    const a: IngredientBody = { id: 1, x: 0, y: 0, level: 0, droppedAt: 0 }
    const b: IngredientBody = { id: 2, x: 0, y: 0, level: 0, droppedAt: 0 }
    const result = processMerge(a, b, 5000)
    expect(result.newBody.droppedAt).toBe(5000)
  })

  it('does not mutate inputs', () => {
    const a: IngredientBody = { id: 1, x: 100, y: 200, level: 0, droppedAt: 0 }
    const b: IngredientBody = { id: 2, x: 300, y: 400, level: 0, droppedAt: 0 }
    const aCopy = { ...a }
    const bCopy = { ...b }
    processMerge(a, b, 0)
    expect(a).toEqual(aCopy)
    expect(b).toEqual(bCopy)
  })
})

describe('checkGameOver', () => {
  it('returns false when no ingredients overflow', () => {
    const ingredients: IngredientBody[] = [
      { id: 1, x: 100, y: 400, level: 0, droppedAt: 0 },
    ]
    expect(checkGameOver(ingredients, 5000)).toBe(false)
  })

  it('returns false when overflow is within tolerance', () => {
    const ingredients: IngredientBody[] = [
      { id: 1, x: 100, y: 50, level: 0, droppedAt: 3000 },
    ]
    // 5000 - 3000 = 2000, which is NOT > OVERFLOW_TIME
    expect(checkGameOver(ingredients, 5000)).toBe(false)
  })

  it('returns true when overflow exceeds OVERFLOW_TIME', () => {
    const ingredients: IngredientBody[] = [
      { id: 1, x: 100, y: 50, level: 0, droppedAt: 1000 },
    ]
    // 4000 - 1000 = 3000 > 2000
    expect(checkGameOver(ingredients, 4000)).toBe(true)
  })

  it('returns false for empty ingredients array', () => {
    expect(checkGameOver([], 9999)).toBe(false)
  })

  it('checks all ingredients, not just the first', () => {
    const ingredients: IngredientBody[] = [
      { id: 1, x: 100, y: 400, level: 0, droppedAt: 0 },  // not overflowing
      { id: 2, x: 200, y: 50, level: 0, droppedAt: 1000 }, // overflowing
    ]
    expect(checkGameOver(ingredients, 4000)).toBe(true)
  })

  it('ingredients at exactly CUP_TOP are not overflowing', () => {
    const ingredients: IngredientBody[] = [
      { id: 1, x: 100, y: CUP_TOP, level: 0, droppedAt: 0 },
    ]
    expect(checkGameOver(ingredients, 99999)).toBe(false)
  })

  it('ingredients just above CUP_TOP are overflowing', () => {
    const ingredients: IngredientBody[] = [
      { id: 1, x: 100, y: CUP_TOP - 1, level: 0, droppedAt: 0 },
    ]
    expect(checkGameOver(ingredients, OVERFLOW_TIME + 1)).toBe(true)
  })
})

describe('clampDropX', () => {
  it('clamps to left boundary', () => {
    expect(clampDropX(0, CUP_LEFT_TOP, CUP_RIGHT_TOP)).toBe(CUP_LEFT_TOP + 30)
  })

  it('clamps to right boundary', () => {
    expect(clampDropX(9999, CUP_LEFT_TOP, CUP_RIGHT_TOP)).toBe(CUP_RIGHT_TOP - 30)
  })

  it('passes through valid x unchanged', () => {
    const validX = (CUP_LEFT_TOP + CUP_RIGHT_TOP) / 2
    expect(clampDropX(validX, CUP_LEFT_TOP, CUP_RIGHT_TOP)).toBe(validX)
  })

  it('handles x at left edge of valid range', () => {
    const x = CUP_LEFT_TOP + 30
    expect(clampDropX(x, CUP_LEFT_TOP, CUP_RIGHT_TOP)).toBe(x)
  })

  it('handles x at right edge of valid range', () => {
    const x = CUP_RIGHT_TOP - 30
    expect(clampDropX(x, CUP_LEFT_TOP, CUP_RIGHT_TOP)).toBe(x)
  })
})

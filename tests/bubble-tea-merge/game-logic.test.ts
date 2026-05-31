import { describe, it, expect, vi, beforeEach } from 'vitest'
import { INGREDIENTS, MAX_INGREDIENT_LEVEL, MAX_DROP_LEVEL, getIngredientByLevel } from '../../src/games/bubble-tea-merge/data/ingredients'
import { calculateMergeScore } from '../../src/games/bubble-tea-merge/logic/scoring'
import {
  canMerge,
  processMerge,
  checkGameOver,
  clampDropX,
  getRandomLevel,
  createGameState,
  type IngredientBody,
} from '../../src/games/bubble-tea-merge/logic/game-state'
import { loadSave, updateHighScore } from '../../src/games/bubble-tea-merge/logic/save'
import {
  CUP_LEFT_TOP, CUP_RIGHT_TOP, CUP_TOP, OVERFLOW_TIME,
  CUP_TOP_WIDTH, CUP_BOTTOM_WIDTH, CUP_LEFT_BOTTOM, CUP_RIGHT_BOTTOM,
  DROP_MARGIN, GAME_W, GAME_H,
} from '../../src/games/bubble-tea-merge/logic/constants'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ===== Ingredients Data =====

describe('INGREDIENTS data', () => {
  it('test_ingredients_has_7_tiers', () => {
    expect(INGREDIENTS).toHaveLength(7)
  })

  it('test_ingredients_have_unique_levels', () => {
    const levels = INGREDIENTS.map(i => i.level)
    expect(new Set(levels).size).toBe(levels.length)
  })

  it('test_ingredients_have_required_fields', () => {
    for (const ing of INGREDIENTS) {
      expect(ing.name).toBeTruthy()
      expect(ing.nameEn).toBeTruthy()
      expect(ing.radius).toBeGreaterThan(0)
      expect(typeof ing.color).toBe('number')
    }
  })

  it('test_ingredients_radii_strictly_increasing', () => {
    for (let i = 1; i < INGREDIENTS.length; i++) {
      expect(INGREDIENTS[i].radius).toBeGreaterThan(INGREDIENTS[i - 1].radius)
    }
  })

  it('test_max_ingredient_level_is_6', () => {
    expect(MAX_INGREDIENT_LEVEL).toBe(6)
  })

  it('test_max_drop_level_is_3', () => {
    expect(MAX_DROP_LEVEL).toBe(3)
  })

  it('test_getIngredientByLevel_returns_correct', () => {
    const tapioca = getIngredientByLevel(0)
    expect(tapioca.name).toBe('西米')
    expect(tapioca.radius).toBe(18)
  })

  it('test_getIngredientByLevel_invalid_throws', () => {
    expect(() => getIngredientByLevel(99)).toThrow('Invalid ingredient level')
  })
})

// ===== Scoring =====

describe('calculateMergeScore', () => {
  it('test_merge_score_level_0_is_10', () => {
    expect(calculateMergeScore(0)).toBe(10) // (0+1)^2 * 10
  })

  it('test_merge_score_level_1_is_40', () => {
    expect(calculateMergeScore(1)).toBe(40) // (1+1)^2 * 10
  })

  it('test_merge_score_level_2_is_90', () => {
    expect(calculateMergeScore(2)).toBe(90) // (2+1)^2 * 10
  })

  it('test_merge_score_level_5_is_360', () => {
    expect(calculateMergeScore(5)).toBe(360) // (5+1)^2 * 10
  })

  it('test_merge_score_exponential_growth', () => {
    const scores = [0, 1, 2, 3, 4, 5].map(calculateMergeScore)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1])
    }
  })
})

// ===== Game State: canMerge =====

describe('canMerge', () => {
  const makeBody = (id: number, level: number): IngredientBody => ({
    id, x: 0, y: 0, level, droppedAt: Date.now(),
  })

  it('test_canMerge_same_level_returns_true', () => {
    expect(canMerge(makeBody(1, 0), makeBody(2, 0), new Set())).toBe(true)
  })

  it('test_canMerge_different_level_returns_false', () => {
    expect(canMerge(makeBody(1, 0), makeBody(2, 1), new Set())).toBe(false)
  })

  it('test_canMerge_max_level_returns_false', () => {
    expect(canMerge(makeBody(1, 6), makeBody(2, 6), new Set())).toBe(false)
  })

  it('test_canMerge_already_merging_returns_false', () => {
    const merging = new Set<number>([1])
    expect(canMerge(makeBody(1, 0), makeBody(2, 0), merging)).toBe(false)
  })

  it('test_canMerge_one_already_merging_returns_false', () => {
    const merging = new Set<number>([2])
    expect(canMerge(makeBody(1, 0), makeBody(2, 0), merging)).toBe(false)
  })
})

// ===== Game State: processMerge =====

describe('processMerge', () => {
  it('test_processMerge_returns_midpoint', () => {
    const a: IngredientBody = { id: 1, x: 100, y: 200, level: 0, droppedAt: 0 }
    const b: IngredientBody = { id: 2, x: 200, y: 300, level: 0, droppedAt: 0 }
    const result = processMerge(a, b)
    expect(result.x).toBe(150)
    expect(result.y).toBe(250)
  })

  it('test_processMerge_returns_correct_new_level', () => {
    const a: IngredientBody = { id: 1, x: 0, y: 0, level: 2, droppedAt: 0 }
    const b: IngredientBody = { id: 2, x: 0, y: 0, level: 2, droppedAt: 0 }
    expect(processMerge(a, b).newLevel).toBe(3)
  })

  it('test_processMerge_returns_correct_points', () => {
    const a: IngredientBody = { id: 1, x: 0, y: 0, level: 1, droppedAt: 0 }
    const b: IngredientBody = { id: 2, x: 0, y: 0, level: 1, droppedAt: 0 }
    expect(processMerge(a, b).points).toBe(40) // (1+1)^2 * 10
  })
})

// ===== Game State: checkGameOver =====

describe('checkGameOver', () => {
  it('test_gameOver_false_when_no_ingredients', () => {
    expect(checkGameOver([], Date.now())).toBe(false)
  })

  it('test_gameOver_false_when_all_below_top', () => {
    const bodies: IngredientBody[] = [
      { id: 1, x: 200, y: 500, level: 0, droppedAt: Date.now() - 5000 },
    ]
    expect(checkGameOver(bodies, Date.now())).toBe(false)
  })

  it('test_gameOver_false_when_above_top_but_recently_dropped', () => {
    const now = Date.now()
    const bodies: IngredientBody[] = [
      { id: 1, x: 200, y: CUP_TOP - 10, level: 0, droppedAt: now - 500 },
    ]
    expect(checkGameOver(bodies, now)).toBe(false)
  })

  it('test_gameOver_true_when_above_top_for_too_long', () => {
    const now = Date.now()
    const bodies: IngredientBody[] = [
      { id: 1, x: 200, y: CUP_TOP - 10, level: 0, droppedAt: now - OVERFLOW_TIME - 100 },
    ]
    expect(checkGameOver(bodies, now)).toBe(true)
  })

  it('test_gameOver_at_exact_boundary_stays_false', () => {
    const now = Date.now()
    const bodies: IngredientBody[] = [
      { id: 1, x: 200, y: CUP_TOP, level: 0, droppedAt: now - OVERFLOW_TIME - 100 },
    ]
    expect(checkGameOver(bodies, now)).toBe(false) // y === CUP_TOP, not < CUP_TOP
  })
})

// ===== Game State: clampDropX =====

describe('clampDropX', () => {
  it('test_clampDropX_clamps_to_left', () => {
    expect(clampDropX(0)).toBe(CUP_LEFT_TOP + DROP_MARGIN)
  })

  it('test_clampDropX_clamps_to_right', () => {
    expect(clampDropX(999)).toBe(CUP_RIGHT_TOP - DROP_MARGIN)
  })

  it('test_clampDropX_passes_through_center', () => {
    const center = GAME_W / 2
    expect(clampDropX(center)).toBe(center)
  })
})

// ===== getRandomLevel =====

describe('getRandomLevel', () => {
  it('test_randomLevel_in_range_0_to_MAX_DROP_LEVEL', () => {
    for (let i = 0; i < 100; i++) {
      const level = getRandomLevel()
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(MAX_DROP_LEVEL)
    }
  })
})

// ===== createGameState =====

describe('createGameState', () => {
  it('test_initialState_correct_defaults', () => {
    const state = createGameState()
    expect(state.score).toBe(0)
    expect(state.canDrop).toBe(true)
    expect(state.gameOver).toBe(false)
    expect(state.ingredients).toEqual([])
    expect(state.merging.size).toBe(0)
    expect(state.nextLevel).toBeGreaterThanOrEqual(0)
    expect(state.nextLevel).toBeLessThanOrEqual(MAX_DROP_LEVEL)
  })
})

// ===== Constants =====

describe('constants', () => {
  it('test_cup_is_symmetric', () => {
    expect(CUP_LEFT_TOP).toBe((GAME_W - CUP_TOP_WIDTH) / 2)
    expect(CUP_RIGHT_TOP).toBe(CUP_LEFT_TOP + CUP_TOP_WIDTH)
    expect(CUP_LEFT_BOTTOM).toBe((GAME_W - CUP_BOTTOM_WIDTH) / 2)
    expect(CUP_RIGHT_BOTTOM).toBe(CUP_LEFT_BOTTOM + CUP_BOTTOM_WIDTH)
  })

  it('test_cup_narrower_at_bottom', () => {
    expect(CUP_BOTTOM_WIDTH).toBeLessThan(CUP_TOP_WIDTH)
  })

  it('test_canvas_dimensions', () => {
    expect(GAME_W).toBe(480)
    expect(GAME_H).toBe(854)
  })
})

// ===== Save/Load =====

describe('save/load', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_loadSave_returns_zero_when_empty', () => {
    const save = loadSave()
    expect(save.highScore).toBe(0)
  })

  it('test_updateHighScore_persists_new_score', () => {
    const save = updateHighScore(100)
    expect(save.highScore).toBe(100)
    expect(loadSave().highScore).toBe(100)
  })

  it('test_updateHighScore_keeps_higher', () => {
    updateHighScore(100)
    updateHighScore(50)
    expect(loadSave().highScore).toBe(100)
  })

  it('test_updateHighScore_replaces_lower', () => {
    updateHighScore(50)
    updateHighScore(100)
    expect(loadSave().highScore).toBe(100)
  })

  it('test_loadSave_handles_corrupted_json', () => {
    localStorage.setItem('bubble-tea-merge-save', 'NOT_JSON')
    expect(loadSave().highScore).toBe(0)
  })

  it('test_loadSave_handles_missing_field', () => {
    localStorage.setItem('bubble-tea-merge-save', '{"other": 42}')
    expect(loadSave().highScore).toBe(0)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateMergeScore,
  isMaxLevel,
} from '../../src/games/mochi-merge/logic/scoring'
import {
  loadSave,
  saveSave,
  updateHighScore,
} from '../../src/games/mochi-merge/logic/save'
import {
  getRandomLevel,
  canMerge,
  processMerge,
  checkGameOver,
  clampDropX,
  createGameState,
  type MochiBody,
} from '../../src/games/mochi-merge/logic/game-state'
import {
  MOCHI_TYPES,
  MAX_MOCHI_LEVEL,
  getMaxDropLevel,
} from '../../src/games/mochi-merge/data/mochi-types'
import {
  GAME_W,
  GAME_H,
  BOX_TOP,
  BOX_BOTTOM,
  BOX_LEFT,
  BOX_RIGHT,
  BOX_WIDTH,
  BOX_CENTER_X,
  DROP_ZONE_Y,
  DROP_COOLDOWN,
  OVERFLOW_TIME,
  WALL_THICKNESS,
} from '../../src/games/mochi-merge/logic/constants'

// ===== Mock localStorage =====
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ===== Mochi Types =====
describe('MOCHI_TYPES', () => {
  it('has 6 mochi types', () => {
    expect(MOCHI_TYPES).toHaveLength(6)
  })

  it('each mochi has name, nameEn, radius, color, emoji', () => {
    for (const m of MOCHI_TYPES) {
      expect(typeof m.name).toBe('string')
      expect(typeof m.nameEn).toBe('string')
      expect(typeof m.radius).toBe('number')
      expect(typeof m.color).toBe('number')
      expect(typeof m.emoji).toBe('string')
      expect(m.radius).toBeGreaterThan(0)
    }
  })

  it('radii are strictly increasing', () => {
    for (let i = 1; i < MOCHI_TYPES.length; i++) {
      expect(MOCHI_TYPES[i].radius).toBeGreaterThan(MOCHI_TYPES[i - 1].radius)
    }
  })

  it('MAX_MOCHI_LEVEL is last index', () => {
    expect(MAX_MOCHI_LEVEL).toBe(MOCHI_TYPES.length - 1)
  })

  it('getMaxDropLevel returns min(3, MAX_MOCHI_LEVEL)', () => {
    expect(getMaxDropLevel()).toBe(Math.min(3, MAX_MOCHI_LEVEL))
  })
})

// ===== Constants =====
describe('constants', () => {
  it('GAME_W and GAME_H are positive', () => {
    expect(GAME_W).toBeGreaterThan(0)
    expect(GAME_H).toBeGreaterThan(0)
  })

  it('box geometry is consistent', () => {
    expect(BOX_TOP).toBeLessThan(BOX_BOTTOM)
    expect(BOX_LEFT).toBeLessThan(BOX_RIGHT)
    expect(BOX_WIDTH).toBe(BOX_RIGHT - BOX_LEFT)
    expect(BOX_CENTER_X).toBe((BOX_LEFT + BOX_RIGHT) / 2)
  })

  it('DROP_ZONE_Y is above BOX_TOP', () => {
    expect(DROP_ZONE_Y).toBeLessThan(BOX_TOP)
  })

  it('timing constants are positive', () => {
    expect(DROP_COOLDOWN).toBeGreaterThan(0)
    expect(OVERFLOW_TIME).toBeGreaterThan(0)
    expect(WALL_THICKNESS).toBeGreaterThan(0)
  })
})

// ===== Scoring =====
describe('calculateMergeScore', () => {
  it('test_level0_gives_10_points', () => {
    expect(calculateMergeScore(0)).toBe(10)
  })

  it('test_level1_gives_40_points', () => {
    expect(calculateMergeScore(1)).toBe(40)
  })

  it('test_level2_gives_90_points', () => {
    expect(calculateMergeScore(2)).toBe(90)
  })

  it('test_follows_formula', () => {
    for (let l = 0; l < 5; l++) {
      expect(calculateMergeScore(l)).toBe((l + 1) * (l + 1) * 10)
    }
  })
})

describe('isMaxLevel', () => {
  it('test_true_for_level_gte_maxLevel', () => {
    expect(isMaxLevel(5, 5)).toBe(true)
    expect(isMaxLevel(6, 5)).toBe(true)
  })

  it('test_false_for_level_lt_maxLevel', () => {
    expect(isMaxLevel(4, 5)).toBe(false)
    expect(isMaxLevel(0, 5)).toBe(false)
  })
})

// ===== Save/Load =====
describe('save/load', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_loadSave_returns_default_when_no_data', () => {
    const save = loadSave()
    expect(save.highScore).toBe(0)
  })

  it('test_saveSave_and_loadSave_round_trip', () => {
    const data = loadSave()
    data.highScore = 1234
    saveSave(data)
    const loaded = loadSave()
    expect(loaded.highScore).toBe(1234)
  })

  it('test_loadSave_handles_corrupted_JSON', () => {
    localStorage.setItem('mochi-merge-save', 'NOT_JSON')
    const save = loadSave()
    expect(save.highScore).toBe(0)
  })

  it('test_loadSave_handles_missing_highScore_field', () => {
    localStorage.setItem('mochi-merge-save', JSON.stringify({ foo: 'bar' }))
    const save = loadSave()
    expect(save.highScore).toBe(0)
  })

  it('test_updateHighScore_saves_when_higher', () => {
    const data = loadSave()
    data.highScore = 100
    saveSave(data)
    const result = updateHighScore(200)
    expect(result.highScore).toBe(200)
    expect(loadSave().highScore).toBe(200)
  })

  it('test_updateHighScore_does_not_overwrite_lower', () => {
    const data = loadSave()
    data.highScore = 500
    saveSave(data)
    const result = updateHighScore(300)
    expect(result.highScore).toBe(500)
  })

  it('test_updateHighScore_handles_equal_score', () => {
    const data = loadSave()
    data.highScore = 100
    saveSave(data)
    const result = updateHighScore(100)
    expect(result.highScore).toBe(100)
  })
})

// ===== Game State =====
describe('createGameState', () => {
  it('test_returns_correct_initial_values', () => {
    const state = createGameState()
    expect(state.score).toBe(0)
    expect(state.mochis).toEqual([])
    expect(state.canDrop).toBe(true)
    expect(state.gameOver).toBe(false)
    expect(state.merging.size).toBe(0)
    expect(typeof state.nextLevel).toBe('number')
  })

  it('test_nextLevel_within_droppable_range', () => {
    for (let i = 0; i < 50; i++) {
      const state = createGameState()
      expect(state.nextLevel).toBeGreaterThanOrEqual(0)
      expect(state.nextLevel).toBeLessThanOrEqual(getMaxDropLevel())
    }
  })
})

describe('getRandomLevel', () => {
  it('test_returns_valid_range', () => {
    const max = getMaxDropLevel()
    for (let i = 0; i < 100; i++) {
      const level = getRandomLevel()
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(max)
    }
  })

  it('test_eventually_produces_all_valid_levels', () => {
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
  const makeBody = (id: number, level: number): MochiBody => ({
    id, x: 0, y: 0, level, droppedAt: 0,
  })

  it('test_allows_same_level_merge', () => {
    expect(canMerge(makeBody(1, 0), makeBody(2, 0), new Set())).toBe(true)
    expect(canMerge(makeBody(1, 3), makeBody(2, 3), new Set())).toBe(true)
  })

  it('test_rejects_different_levels', () => {
    expect(canMerge(makeBody(1, 0), makeBody(2, 1), new Set())).toBe(false)
  })

  it('test_rejects_max_level_merges', () => {
    expect(canMerge(makeBody(1, MAX_MOCHI_LEVEL), makeBody(2, MAX_MOCHI_LEVEL), new Set())).toBe(false)
  })

  it('test_rejects_if_either_is_merging', () => {
    const merging = new Set<number>([1])
    expect(canMerge(makeBody(1, 0), makeBody(2, 0), merging)).toBe(false)
    expect(canMerge(makeBody(2, 0), makeBody(1, 0), merging)).toBe(false)
  })

  it('test_rejects_if_both_are_merging', () => {
    const merging = new Set<number>([1, 2])
    expect(canMerge(makeBody(1, 0), makeBody(2, 0), merging)).toBe(false)
  })
})

describe('processMerge', () => {
  it('test_creates_new_body_at_midpoint', () => {
    const a: MochiBody = { id: 1, x: 100, y: 200, level: 2, droppedAt: 0 }
    const b: MochiBody = { id: 2, x: 200, y: 400, level: 2, droppedAt: 0 }
    const result = processMerge(a, b, 1000)
    expect(result.newBody.x).toBe(150)
    expect(result.newBody.y).toBe(300)
    expect(result.newBody.level).toBe(3)
  })

  it('test_calculates_correct_points', () => {
    const a: MochiBody = { id: 1, x: 0, y: 0, level: 1, droppedAt: 0 }
    const b: MochiBody = { id: 2, x: 0, y: 0, level: 1, droppedAt: 0 }
    const result = processMerge(a, b, 0)
    expect(result.points).toBe(calculateMergeScore(1))
  })

  it('test_sets_droppedAt_to_provided_time', () => {
    const a: MochiBody = { id: 1, x: 0, y: 0, level: 0, droppedAt: 0 }
    const b: MochiBody = { id: 2, x: 0, y: 0, level: 0, droppedAt: 0 }
    const result = processMerge(a, b, 5000)
    expect(result.newBody.droppedAt).toBe(5000)
  })

  it('test_does_not_mutate_inputs', () => {
    const a: MochiBody = { id: 1, x: 100, y: 200, level: 0, droppedAt: 0 }
    const b: MochiBody = { id: 2, x: 300, y: 400, level: 0, droppedAt: 0 }
    const aCopy = { ...a }
    const bCopy = { ...b }
    processMerge(a, b, 0)
    expect(a).toEqual(aCopy)
    expect(b).toEqual(bCopy)
  })
})

describe('checkGameOver', () => {
  it('test_false_when_no_overflow', () => {
    const mochis: MochiBody[] = [
      { id: 1, x: 100, y: 400, level: 0, droppedAt: 0 },
    ]
    expect(checkGameOver(mochis, 5000)).toBe(false)
  })

  it('test_false_when_overflow_within_tolerance', () => {
    const mochis: MochiBody[] = [
      { id: 1, x: 100, y: 50, level: 0, droppedAt: 3000 },
    ]
    expect(checkGameOver(mochis, 5000)).toBe(false)
  })

  it('test_true_when_overflow_exceeds_time', () => {
    const mochis: MochiBody[] = [
      { id: 1, x: 100, y: 50, level: 0, droppedAt: 1000 },
    ]
    expect(checkGameOver(mochis, 4000)).toBe(true)
  })

  it('test_false_for_empty_array', () => {
    expect(checkGameOver([], 9999)).toBe(false)
  })

  it('test_checks_all_mochis', () => {
    const mochis: MochiBody[] = [
      { id: 1, x: 100, y: 400, level: 0, droppedAt: 0 },
      { id: 2, x: 200, y: 50, level: 0, droppedAt: 1000 },
    ]
    expect(checkGameOver(mochis, 4000)).toBe(true)
  })

  it('test_mochi_at_exactly_BOX_TOP_not_overflowing', () => {
    const mochis: MochiBody[] = [
      { id: 1, x: 100, y: BOX_TOP, level: 0, droppedAt: 0 },
    ]
    expect(checkGameOver(mochis, 99999)).toBe(false)
  })

  it('test_mochi_just_above_BOX_TOP_is_overflowing', () => {
    const mochis: MochiBody[] = [
      { id: 1, x: 100, y: BOX_TOP - 1, level: 0, droppedAt: 0 },
    ]
    expect(checkGameOver(mochis, OVERFLOW_TIME + 1)).toBe(true)
  })
})

describe('clampDropX', () => {
  it('test_clamps_to_left_boundary', () => {
    expect(clampDropX(0, BOX_LEFT, BOX_RIGHT)).toBe(BOX_LEFT + 30)
  })

  it('test_clamps_to_right_boundary', () => {
    expect(clampDropX(9999, BOX_LEFT, BOX_RIGHT)).toBe(BOX_RIGHT - 30)
  })

  it('test_passes_through_valid_x', () => {
    const validX = (BOX_LEFT + BOX_RIGHT) / 2
    expect(clampDropX(validX, BOX_LEFT, BOX_RIGHT)).toBe(validX)
  })

  it('test_handles_x_at_left_edge', () => {
    const x = BOX_LEFT + 30
    expect(clampDropX(x, BOX_LEFT, BOX_RIGHT)).toBe(x)
  })

  it('test_handles_x_at_right_edge', () => {
    const x = BOX_RIGHT - 30
    expect(clampDropX(x, BOX_LEFT, BOX_RIGHT)).toBe(x)
  })
})

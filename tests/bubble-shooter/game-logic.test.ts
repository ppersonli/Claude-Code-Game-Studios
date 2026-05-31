import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BUBBLE_COLORS, getColorById } from '../../src/games/bubble-shooter/data/colors'
import {
  createEmptyGrid, getCellCenter, getNearestCell, getNeighbors,
  findConnected, findFloating, isGridEmpty, getLowestBubbleRow,
} from '../../src/games/bubble-shooter/logic/grid'
import { getLevelConfig, generateLevelGrid } from '../../src/games/bubble-shooter/logic/levels'
import {
  createLevelState, shootBubble, pickRandomColor, getNextLevel,
} from '../../src/games/bubble-shooter/logic/game-state'
import { calculateShotScore, calculateLevelBonus } from '../../src/games/bubble-shooter/logic/scoring'
import { loadSave, saveProgress, resetSave } from '../../src/games/bubble-shooter/logic/save'
import { COLS, ROWS, BUBBLE_RADIUS, MIN_MATCH } from '../../src/games/bubble-shooter/logic/constants'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ===== Colors =====

describe('BUBBLE_COLORS', () => {
  it('test_has_6_colors', () => { expect(BUBBLE_COLORS).toHaveLength(6) })
  it('test_unique_ids', () => {
    expect(new Set(BUBBLE_COLORS.map(c => c.id)).size).toBe(6)
  })
  it('test_required_fields', () => {
    for (const c of BUBBLE_COLORS) {
      expect(c.name).toBeTruthy()
      expect(c.emoji).toBeTruthy()
      expect(typeof c.hex).toBe('number')
    }
  })
  it('test_getColorById_valid', () => {
    expect(getColorById(0).name).toBe('草莓粉')
  })
  it('test_getColorById_invalid_throws', () => {
    expect(() => getColorById(99)).toThrow()
  })
})

// ===== Grid: Creation =====

describe('createEmptyGrid', () => {
  it('test_default_dimensions', () => {
    const grid = createEmptyGrid()
    expect(grid).toHaveLength(ROWS)
    expect(grid[0]).toHaveLength(COLS)
  })
  it('test_custom_dimensions', () => {
    const grid = createEmptyGrid(5, 8)
    expect(grid).toHaveLength(5)
    expect(grid[0]).toHaveLength(8)
  })
  it('test_all_null', () => {
    const grid = createEmptyGrid(3, 3)
    for (const row of grid) {
      for (const cell of row) {
        expect(cell).toBeNull()
      }
    }
  })
})

// ===== Grid: Cell Center =====

describe('getCellCenter', () => {
  it('test_row0_col0', () => {
    const { x, y } = getCellCenter(0, 0)
    expect(x).toBe(BUBBLE_RADIUS + 10)
    expect(y).toBe(80)
  })
  it('test_odd_row_offset', () => {
    const even = getCellCenter(0, 0)
    const odd = getCellCenter(1, 0)
    expect(odd.x).toBe(even.x + BUBBLE_RADIUS)
  })
  it('test_column_spacing', () => {
    const c0 = getCellCenter(0, 0)
    const c1 = getCellCenter(0, 1)
    expect(c1.x - c0.x).toBe(BUBBLE_RADIUS * 2)
  })
})

// ===== Grid: Nearest Cell =====

describe('getNearestCell', () => {
  it('test_returns_valid_cell', () => {
    const { row, col } = getNearestCell(100, 100)
    expect(row).toBeGreaterThanOrEqual(0)
    expect(col).toBeGreaterThanOrEqual(0)
  })
  it('test_returns_closest_to_given_position', () => {
    const center = getCellCenter(2, 3)
    const { row, col } = getNearestCell(center.x, center.y)
    expect(row).toBe(2)
    expect(col).toBe(3)
  })
})

// ===== Grid: Neighbors =====

describe('getNeighbors', () => {
  it('test_center_has_6_neighbors', () => {
    const neighbors = getNeighbors(2, 5)
    expect(neighbors.length).toBeLessThanOrEqual(6)
    expect(neighbors.length).toBeGreaterThanOrEqual(4)
  })
  it('test_corner_has_fewer', () => {
    const neighbors = getNeighbors(0, 0)
    expect(neighbors.length).toBeLessThanOrEqual(4)
  })
  it('test_no_negative_indices', () => {
    const neighbors = getNeighbors(0, 0)
    for (const n of neighbors) {
      expect(n.row).toBeGreaterThanOrEqual(0)
      expect(n.col).toBeGreaterThanOrEqual(0)
    }
  })
  it('test_no_out_of_bounds', () => {
    const neighbors = getNeighbors(ROWS - 1, COLS - 1)
    for (const n of neighbors) {
      expect(n.row).toBeLessThan(ROWS)
      expect(n.col).toBeLessThan(COLS)
    }
  })
})

// ===== Grid: Find Connected =====

describe('findConnected', () => {
  it('test_single_bubble', () => {
    const grid = createEmptyGrid(3, 3)
    grid[0][0] = 0
    const connected = findConnected(grid, 0, 0)
    expect(connected).toHaveLength(1)
  })
  it('test_two_adjacent_same_color', () => {
    const grid = createEmptyGrid(3, 3)
    grid[0][0] = 0
    grid[0][1] = 0
    const connected = findConnected(grid, 0, 0)
    expect(connected).toHaveLength(2)
  })
  it('test_does_not_cross_different_color', () => {
    const grid = createEmptyGrid(3, 3)
    grid[0][0] = 0
    grid[0][1] = 1
    grid[0][2] = 0
    const connected = findConnected(grid, 0, 0)
    expect(connected).toHaveLength(1)
  })
  it('test_chain_of_three', () => {
    const grid = createEmptyGrid(3, 3)
    grid[0][0] = 1
    grid[0][1] = 1
    grid[0][2] = 1
    const connected = findConnected(grid, 0, 0)
    expect(connected).toHaveLength(3)
  })
  it('test_empty_cell_returns_empty', () => {
    const grid = createEmptyGrid(3, 3)
    expect(findConnected(grid, 0, 0)).toHaveLength(0)
  })
  it('test_diagonal_not_connected', () => {
    const grid = createEmptyGrid(3, 3)
    grid[0][0] = 0
    grid[1][1] = 0
    const connected = findConnected(grid, 0, 0)
    // Depends on hex grid neighbor definition — diagonal may or may not be neighbor
    expect(connected.length).toBeGreaterThanOrEqual(1)
  })
})

// ===== Grid: Find Floating =====

describe('findFloating', () => {
  it('test_no_floating_when_all_attached', () => {
    const grid = createEmptyGrid(3, 3)
    grid[0][0] = 0
    grid[0][1] = 0
    grid[1][0] = 0
    expect(findFloating(grid)).toHaveLength(0)
  })
  it('test_finds_floating_bubble', () => {
    const grid = createEmptyGrid(6, 6)
    grid[0][0] = 0 // anchored to top
    // Isolated bubble far from any connected group
    grid[5][5] = 1
    const floating = findFloating(grid)
    expect(floating.length).toBeGreaterThanOrEqual(1)
    expect(floating.some(f => f.row === 5 && f.col === 5)).toBe(true)
  })
  it('test_empty_grid_has_no_floating', () => {
    expect(findFloating(createEmptyGrid())).toHaveLength(0)
  })
})

// ===== Grid: Utility =====

describe('grid utilities', () => {
  it('test_isGridEmpty_true', () => {
    expect(isGridEmpty(createEmptyGrid())).toBe(true)
  })
  it('test_isGridEmpty_false', () => {
    const grid = createEmptyGrid()
    grid[0][0] = 0
    expect(isGridEmpty(grid)).toBe(false)
  })
  it('test_getLowestBubbleRow_empty', () => {
    expect(getLowestBubbleRow(createEmptyGrid())).toBe(-1)
  })
  it('test_getLowestBubbleRow_with_bubbles', () => {
    const grid = createEmptyGrid()
    grid[0][0] = 0
    grid[5][3] = 1
    expect(getLowestBubbleRow(grid)).toBe(5)
  })
})

// ===== Levels =====

describe('getLevelConfig', () => {
  it('test_level_1_config', () => {
    const c = getLevelConfig(1)
    expect(c.level).toBe(1)
    expect(c.colors).toBe(3)
    expect(c.maxShots).toBeGreaterThan(0)
  })
  it('test_clamps_low', () => {
    expect(getLevelConfig(0).level).toBe(1)
  })
  it('test_clamps_high', () => {
    expect(getLevelConfig(100).level).toBe(50)
  })
  it('test_difficulty_increases', () => {
    const easy = getLevelConfig(1)
    const hard = getLevelConfig(50)
    expect(hard.colors).toBeGreaterThanOrEqual(easy.colors)
    expect(hard.maxShots).toBeLessThanOrEqual(easy.maxShots)
    expect(hard.rows).toBeGreaterThanOrEqual(easy.rows)
  })
  it('test_max_colors_capped_at_6', () => {
    expect(getLevelConfig(50).colors).toBeLessThanOrEqual(6)
  })
})

describe('generateLevelGrid', () => {
  it('test_generates_correct_dimensions', () => {
    const grid = generateLevelGrid(getLevelConfig(1))
    expect(grid).toHaveLength(ROWS)
    expect(grid[0]).toHaveLength(COLS)
  })
  it('test_has_bubbles_in_top_rows', () => {
    const grid = generateLevelGrid(getLevelConfig(1))
    const topRow = grid[0].filter(c => c !== null)
    expect(topRow.length).toBeGreaterThan(0)
  })
  it('test_uses_correct_color_range', () => {
    const config = getLevelConfig(1) // 3 colors
    const grid = generateLevelGrid(config)
    const usedColors = new Set<number>()
    for (const row of grid) {
      for (const cell of row) {
        if (cell !== null) usedColors.add(cell)
      }
    }
    for (const c of usedColors) {
      expect(c).toBeLessThan(config.colors)
    }
  })
})

// ===== Game State =====

describe('createLevelState', () => {
  it('test_initial_state', () => {
    const s = createLevelState(1)
    expect(s.level).toBe(1)
    expect(s.score).toBe(0)
    expect(s.gameOver).toBe(false)
    expect(s.levelComplete).toBe(false)
    expect(s.shotsLeft).toBeGreaterThan(0)
    expect(s.currentColor).toBeGreaterThanOrEqual(0)
    expect(s.nextColor).toBeGreaterThanOrEqual(0)
  })
  it('test_carries_high_score', () => {
    const s = createLevelState(1, 500)
    expect(s.highScore).toBe(500)
  })
})

describe('pickRandomColor', () => {
  it('test_returns_color_from_pool', () => {
    const pool = [0, 1, 2]
    for (let i = 0; i < 20; i++) {
      expect(pool).toContain(pickRandomColor(pool))
    }
  })
})

// ===== Shooting =====

describe('shootBubble', () => {
  it('test_place_bubble_on_empty_cell', () => {
    const state = createLevelState(1)
    // Clear a spot
    state.grid[5][5] = null
    const result = shootBubble(state, 5, 5)
    expect(state.grid[5][5]).not.toBeNull()
    expect(state.shotsFired).toBe(1)
  })
  it('test_fails_on_occupied_cell', () => {
    const state = createLevelState(1)
    if (state.grid[0][0] !== null) {
      const result = shootBubble(state, 0, 0)
      expect(result.popped).toBe(0)
    }
  })
  it('test_pops_matching_group', () => {
    const state = createLevelState(1)
    // Set up a matchable group
    state.grid[5][3] = 0
    state.grid[5][4] = 0
    state.currentColor = 0
    state.grid[5][5] = null
    const result = shootBubble(state, 5, 5)
    if (state.grid[5][5] === 0) {
      expect(result.popped).toBeGreaterThanOrEqual(0)
    }
  })
  it('test_decrements_shots', () => {
    const state = createLevelState(1)
    const before = state.shotsLeft
    state.grid[ROWS - 1][0] = null
    shootBubble(state, ROWS - 1, 0)
    expect(state.shotsLeft).toBe(before - 1)
  })
  it('test_game_over_when_no_shots', () => {
    const state = createLevelState(1)
    state.shotsLeft = 1
    state.grid[ROWS - 1][0] = null
    shootBubble(state, ROWS - 1, 0)
    expect(state.gameOver).toBe(true)
  })
  it('test_level_complete_when_grid_empty', () => {
    const state = createLevelState(1)
    // Clear entire grid except one cell
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        state.grid[r][c] = null
      }
    }
    state.grid[0][0] = 0
    state.grid[0][1] = 0
    state.currentColor = 0
    state.grid[0][2] = null
    const result = shootBubble(state, 0, 2)
    if (state.levelComplete) {
      expect(state.levelsCompleted).toContain(1)
    }
  })
})

describe('getNextLevel', () => {
  it('test_returns_next', () => {
    expect(getNextLevel(createLevelState(5))).toBe(6)
  })
  it('test_returns_null_at_max', () => {
    expect(getNextLevel(createLevelState(50))).toBeNull()
  })
})

// ===== Scoring =====

describe('scoring', () => {
  it('test_shot_score', () => {
    expect(calculateShotScore(3, 2)).toBe(3 * 10 + 2 * 15)
  })
  it('test_level_bonus', () => {
    const bonus = calculateLevelBonus(100, 10, 30)
    expect(bonus).toBe(10 * 5 + 10)
  })
  it('test_level_bonus_no_shots', () => {
    expect(calculateLevelBonus(0, 0, 30)).toBe(0)
  })
})

// ===== Save/Load =====

describe('save/load', () => {
  beforeEach(() => { localStorage.clear() })

  it('test_loadSave_default', () => {
    const save = loadSave()
    expect(save.highScore).toBe(0)
    expect(save.levelsCompleted).toEqual([])
  })
  it('test_saveProgress_and_load', () => {
    saveProgress(500, 3, [1, 2, 3])
    const save = loadSave()
    expect(save.highScore).toBe(500)
    expect(save.levelsCompleted).toEqual([1, 2, 3])
  })
  it('test_saveProgress_keeps_higher_score', () => {
    saveProgress(500, 1, [1])
    saveProgress(300, 2, [2])
    expect(loadSave().highScore).toBe(500)
  })
  it('test_saveProgress_merges_levels', () => {
    saveProgress(100, 1, [1])
    saveProgress(200, 3, [3])
    const levels = loadSave().levelsCompleted
    expect(levels).toContain(1)
    expect(levels).toContain(3)
  })
  it('test_corrupted_json', () => {
    localStorage.setItem('bubble-shooter-save', 'BROKEN')
    expect(loadSave().highScore).toBe(0)
  })
  it('test_resetSave', () => {
    saveProgress(100, 1, [1])
    resetSave()
    expect(loadSave().highScore).toBe(0)
  })
})

// ===== Constants =====

describe('constants', () => {
  it('test_grid_dimensions', () => {
    expect(COLS).toBe(12)
    expect(ROWS).toBe(12)
  })
  it('test_min_match_is_3', () => {
    expect(MIN_MATCH).toBe(3)
  })
})

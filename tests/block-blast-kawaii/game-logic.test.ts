import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GRID_SIZE, QUEUE_SIZE, LINE_SCORES } from '../../src/games/block-blast-kawaii/logic/constants'
import {
  BLOCK_SHAPES, getBlockDimensions, getBlockCellCount,
  pickRandomShape, generateBlockQueue, type Block, type BlockShape,
} from '../../src/games/block-blast-kawaii/logic/blocks'
import {
  createEmptyGrid, canPlace, placeBlock, findFullLines, clearLines,
  canAnyBlockFit, countOccupied, isGridEmpty, cloneGrid, type Grid,
} from '../../src/games/block-blast-kawaii/logic/grid'
import {
  lineBaseScore, getComboMultiplier, calculateMoveScore, updateCombo,
} from '../../src/games/block-blast-kawaii/logic/scoring'
import {
  createNewGame, placeBlockFromQueue, saveGame, restoreGame, clearSave,
  loadBestScore, saveBestScore, type GameState,
} from '../../src/games/block-blast-kawaii/logic/game-state'
import {
  canBuyBlastTheme, equipBlastTheme, getAvailableBlastThemes,
  checkBlastAchievements, gameCoins, dailyRewardCoins,
  isDailyRewardAvailable, claimDailyReward,
} from '../../src/games/block-blast-kawaii/logic/meta'
import { BLAST_THEMES, getBlastThemeById } from '../../src/games/block-blast-kawaii/data/themes'
import { BLAST_ACHIEVEMENTS, getBlastAchievementById, type BlastStats } from '../../src/games/block-blast-kawaii/data/achievements'
import { KAWAII_COLORS, getKawaiiColor } from '../../src/games/block-blast-kawaii/data/colors'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

beforeEach(() => {
  Object.keys(storage).forEach(k => delete storage[k])
})

// ==============================
// CONSTANTS
// ==============================

describe('constants', () => {
  it('test_GRID_SIZE_is_10', () => { expect(GRID_SIZE).toBe(10) })
  it('test_QUEUE_SIZE_is_3', () => { expect(QUEUE_SIZE).toBe(3) })
  it('test_LINE_SCORES_has_6_entries', () => { expect(LINE_SCORES).toHaveLength(6) })
  it('test_LINE_SCORES_0_is_0', () => { expect(LINE_SCORES[0]).toBe(0) })
  it('test_LINE_SCORES_increasing', () => {
    for (let i = 2; i < LINE_SCORES.length; i++)
      expect(LINE_SCORES[i]).toBeGreaterThan(LINE_SCORES[i - 1])
  })
})

// ==============================
// BLOCKS
// ==============================

describe('BLOCK_SHAPES', () => {
  it('test_has_multiple_shapes', () => {
    expect(BLOCK_SHAPES.length).toBeGreaterThan(10)
  })
  it('test_all_have_valid_matrix', () => {
    for (const shape of BLOCK_SHAPES) {
      expect(shape.matrix.length).toBeGreaterThan(0)
      const cols = shape.matrix[0].length
      for (const row of shape.matrix) {
        expect(row.length).toBe(cols)
      }
    }
  })
  it('test_all_have_at_least_one_filled_cell', () => {
    for (const shape of BLOCK_SHAPES) {
      const filled = shape.matrix.flat().some(c => c === 1)
      expect(filled).toBe(true)
    }
  })
})

describe('getBlockDimensions', () => {
  it('test_single_block', () => {
    expect(getBlockDimensions([[1]])).toEqual({ rows: 1, cols: 1 })
  })
  it('test_horizontal_i', () => {
    expect(getBlockDimensions([[1, 1, 1, 1]])).toEqual({ rows: 1, cols: 4 })
  })
  it('test_vertical_i', () => {
    expect(getBlockDimensions([[1], [1], [1], [1]])).toEqual({ rows: 4, cols: 1 })
  })
  it('test_o_block', () => {
    expect(getBlockDimensions([[1, 1], [1, 1]])).toEqual({ rows: 2, cols: 2 })
  })
})

describe('getBlockCellCount', () => {
  it('test_single', () => { expect(getBlockCellCount([[1]])).toBe(1) })
  it('test_o_block', () => { expect(getBlockCellCount([[1, 1], [1, 1]])).toBe(4) })
  it('test_t_block', () => { expect(getBlockCellCount([[1, 1, 1], [0, 1, 0]])).toBe(4) })
  it('test_empty', () => { expect(getBlockCellCount([[0, 0], [0, 0]])).toBe(0) })
})

describe('pickRandomShape', () => {
  it('test_returns_a_shape', () => {
    const s = pickRandomShape()
    expect(s.matrix).toBeDefined()
    expect(s.type).toBeDefined()
  })
  it('test_returns_from_BLOCK_SHAPES', () => {
    const s = pickRandomShape()
    expect(BLOCK_SHAPES).toContain(s)
  })
})

describe('generateBlockQueue', () => {
  it('test_returns_correct_count', () => {
    expect(generateBlockQueue(3)).toHaveLength(3)
  })
  it('test_each_has_shape_and_color', () => {
    const queue = generateBlockQueue(3)
    for (const b of queue) {
      expect(b.shape).toBeDefined()
      expect(typeof b.colorIndex).toBe('number')
    }
  })
  it('test_empty_queue', () => {
    expect(generateBlockQueue(0)).toHaveLength(0)
  })
})

// ==============================
// GRID: createEmptyGrid
// ==============================

describe('createEmptyGrid', () => {
  it('test_creates_10x10', () => {
    const grid = createEmptyGrid()
    expect(grid).toHaveLength(GRID_SIZE)
    for (const row of grid) expect(row).toHaveLength(GRID_SIZE)
  })
  it('test_all_null', () => {
    const grid = createEmptyGrid()
    for (const row of grid)
      for (const cell of row)
        expect(cell).toBeNull()
  })
})

// ==============================
// GRID: cloneGrid
// ==============================

describe('cloneGrid', () => {
  it('test_deep_copy', () => {
    const grid = createEmptyGrid()
    grid[0][0] = 1
    const clone = cloneGrid(grid)
    clone[0][0] = 99
    expect(grid[0][0]).toBe(1)
  })
  it('test_preserves_null', () => {
    expect(cloneGrid(createEmptyGrid())[0][0]).toBeNull()
  })
})

// ==============================
// GRID: canPlace
// ==============================

describe('canPlace', () => {
  it('test_valid_placement', () => {
    expect(canPlace(createEmptyGrid(), [[1]], 0, 0)).toBe(true)
  })
  it('test_out_of_bounds_right', () => {
    expect(canPlace(createEmptyGrid(), [[1, 1]], 0, 9)).toBe(false)
  })
  it('test_out_of_bounds_bottom', () => {
    expect(canPlace(createEmptyGrid(), [[1], [1]], 9, 0)).toBe(false)
  })
  it('test_negative_row', () => {
    expect(canPlace(createEmptyGrid(), [[1]], -1, 0)).toBe(false)
  })
  it('test_negative_col', () => {
    expect(canPlace(createEmptyGrid(), [[1]], 0, -1)).toBe(false)
  })
  it('test_collision_with_existing', () => {
    const grid = createEmptyGrid()
    grid[0][0] = 1
    expect(canPlace(grid, [[1]], 0, 0)).toBe(false)
  })
  it('test_no_collision_adjacent', () => {
    const grid = createEmptyGrid()
    grid[0][0] = 1
    expect(canPlace(grid, [[1]], 0, 1)).toBe(true)
  })
  it('test_o_block_at_corner', () => {
    expect(canPlace(createEmptyGrid(), [[1, 1], [1, 1]], 0, 0)).toBe(true)
  })
  it('test_o_block_overflow', () => {
    expect(canPlace(createEmptyGrid(), [[1, 1], [1, 1]], 9, 9)).toBe(false)
  })
  it('test_i_horizontal_at_edge', () => {
    expect(canPlace(createEmptyGrid(), [[1, 1, 1, 1]], 0, 6)).toBe(true)
    expect(canPlace(createEmptyGrid(), [[1, 1, 1, 1]], 0, 7)).toBe(false)
  })
})

// ==============================
// GRID: placeBlock
// ==============================

describe('placeBlock', () => {
  it('test_places_single', () => {
    const grid = placeBlock(createEmptyGrid(), [[1]], 0, 0, 3)
    expect(grid[0][0]).toBe(3)
  })
  it('test_places_o_block', () => {
    const grid = placeBlock(createEmptyGrid(), [[1, 1], [1, 1]], 2, 3, 5)
    expect(grid[2][3]).toBe(5)
    expect(grid[2][4]).toBe(5)
    expect(grid[3][3]).toBe(5)
    expect(grid[3][4]).toBe(5)
  })
  it('test_does_not_fill_empty_cells_in_shape', () => {
    const grid = placeBlock(createEmptyGrid(), [[1, 0], [0, 1]], 0, 0, 2)
    expect(grid[0][0]).toBe(2)
    expect(grid[0][1]).toBeNull()
    expect(grid[1][0]).toBeNull()
    expect(grid[1][1]).toBe(2)
  })
  it('test_does_not_mutate_input', () => {
    const original = createEmptyGrid()
    placeBlock(original, [[1]], 0, 0, 1)
    expect(original[0][0]).toBeNull()
  })
})

// ==============================
// GRID: findFullLines / clearLines
// ==============================

describe('findFullLines', () => {
  it('test_empty_grid', () => {
    const { rows, cols } = findFullLines(createEmptyGrid())
    expect(rows).toHaveLength(0)
    expect(cols).toHaveLength(0)
  })
  it('test_full_row', () => {
    const grid = createEmptyGrid()
    for (let c = 0; c < 10; c++) grid[0][c] = 1
    const { rows, cols } = findFullLines(grid)
    expect(rows).toEqual([0])
  })
  it('test_full_col', () => {
    const grid = createEmptyGrid()
    for (let r = 0; r < 10; r++) grid[r][0] = 1
    const { rows, cols } = findFullLines(grid)
    expect(cols).toEqual([0])
  })
  it('test_partial_row_not_full', () => {
    const grid = createEmptyGrid()
    for (let c = 0; c < 9; c++) grid[0][c] = 1
    expect(findFullLines(grid).rows).toHaveLength(0)
  })
  it('test_multiple_full_rows', () => {
    const grid = createEmptyGrid()
    for (let c = 0; c < 10; c++) { grid[0][c] = 1; grid[5][c] = 1 }
    const { rows } = findFullLines(grid)
    expect(rows).toEqual([0, 5])
  })
  it('test_full_row_and_col_simultaneously', () => {
    const grid = createEmptyGrid()
    for (let c = 0; c < 10; c++) grid[0][c] = 1
    for (let r = 0; r < 10; r++) grid[r][0] = 1
    const { rows, cols } = findFullLines(grid)
    expect(rows).toEqual([0])
    expect(cols).toEqual([0])
  })
})

describe('clearLines', () => {
  it('test_no_lines_returns_same', () => {
    const grid = createEmptyGrid()
    grid[0][0] = 1
    const result = clearLines(grid)
    expect(result.linesCleared).toBe(0)
    expect(result.grid[0][0]).toBe(1)
  })
  it('test_clears_full_row', () => {
    const grid = createEmptyGrid()
    for (let c = 0; c < 10; c++) grid[0][c] = 1
    grid[1][0] = 2
    const result = clearLines(grid)
    expect(result.linesCleared).toBe(1)
    for (let c = 0; c < 10; c++) expect(result.grid[0][c]).toBeNull()
    expect(result.grid[1][0]).toBe(2)
  })
  it('test_clears_row_and_col', () => {
    const grid = createEmptyGrid()
    for (let c = 0; c < 10; c++) grid[0][c] = 1
    for (let r = 0; r < 10; r++) grid[r][0] = 1
    const result = clearLines(grid)
    expect(result.linesCleared).toBe(2)
    for (let c = 0; c < 10; c++) expect(result.grid[0][c]).toBeNull()
    for (let r = 0; r < 10; r++) expect(result.grid[r][0]).toBeNull()
  })
  it('test_does_not_mutate_input', () => {
    const grid = createEmptyGrid()
    for (let c = 0; c < 10; c++) grid[0][c] = 1
    clearLines(grid)
    expect(grid[0][0]).toBe(1)
  })
})

// ==============================
// GRID: canAnyBlockFit
// ==============================

describe('canAnyBlockFit', () => {
  it('test_empty_grid_any_fits', () => {
    expect(canAnyBlockFit(createEmptyGrid(), [{ matrix: [[1]] }])).toBe(true)
  })
  it('test_full_grid_none_fits', () => {
    const grid = createEmptyGrid()
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 10; c++)
        grid[r][c] = 1
    expect(canAnyBlockFit(grid, [{ matrix: [[1]] }])).toBe(false)
  })
  it('test_single_gap_fits_single', () => {
    const grid = createEmptyGrid()
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 10; c++)
        grid[r][c] = 1
    grid[5][5] = null
    expect(canAnyBlockFit(grid, [{ matrix: [[1]] }])).toBe(true)
  })
  it('test_single_gap_no_fit_o_block', () => {
    const grid = createEmptyGrid()
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 10; c++)
        grid[r][c] = 1
    grid[5][5] = null
    expect(canAnyBlockFit(grid, [{ matrix: [[1, 1], [1, 1]] }])).toBe(false)
  })
  it('test_empty_blocks_array', () => {
    expect(canAnyBlockFit(createEmptyGrid(), [])).toBe(false)
  })
})

// ==============================
// GRID: countOccupied / isGridEmpty
// ==============================

describe('countOccupied', () => {
  it('test_empty', () => { expect(countOccupied(createEmptyGrid())).toBe(0) })
  it('test_one_cell', () => {
    const grid = createEmptyGrid()
    grid[3][4] = 1
    expect(countOccupied(grid)).toBe(1)
  })
  it('test_full', () => {
    const grid = createEmptyGrid()
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 10; c++)
        grid[r][c] = 1
    expect(countOccupied(grid)).toBe(100)
  })
})

describe('isGridEmpty', () => {
  it('test_empty', () => { expect(isGridEmpty(createEmptyGrid())).toBe(true) })
  it('test_not_empty', () => {
    const grid = createEmptyGrid()
    grid[0][0] = 1
    expect(isGridEmpty(grid)).toBe(false)
  })
})

// ==============================
// SCORING
// ==============================

describe('lineBaseScore', () => {
  it('test_0_lines', () => { expect(lineBaseScore(0)).toBe(0) })
  it('test_1_line', () => { expect(lineBaseScore(1)).toBe(100) })
  it('test_2_lines', () => { expect(lineBaseScore(2)).toBe(300) })
  it('test_3_lines', () => { expect(lineBaseScore(3)).toBe(600) })
  it('test_4_lines', () => { expect(lineBaseScore(4)).toBe(1000) })
  it('test_5_lines_caps', () => { expect(lineBaseScore(5)).toBe(1500) })
  it('test_10_lines_caps', () => { expect(lineBaseScore(10)).toBe(1500) })
})

describe('getComboMultiplier', () => {
  it('test_0_is_1x', () => { expect(getComboMultiplier(0)).toBe(1) })
  it('test_1_is_1x', () => { expect(getComboMultiplier(1)).toBe(1) })
  it('test_2_is_1.5x', () => { expect(getComboMultiplier(2)).toBe(1.5) })
  it('test_3_is_1.5x', () => { expect(getComboMultiplier(3)).toBe(1.5) })
  it('test_4_is_2x', () => { expect(getComboMultiplier(4)).toBe(2) })
  it('test_5_is_2x', () => { expect(getComboMultiplier(5)).toBe(2) })
  it('test_6_is_3x', () => { expect(getComboMultiplier(6)).toBe(3) })
  it('test_9_is_5x', () => { expect(getComboMultiplier(9)).toBe(5) })
  it('test_100_is_5x', () => { expect(getComboMultiplier(100)).toBe(5) })
})

describe('calculateMoveScore', () => {
  it('test_single_line_no_combo', () => {
    expect(calculateMoveScore(1, 0)).toBe(100)
  })
  it('test_double_line_no_combo', () => {
    expect(calculateMoveScore(2, 0)).toBe(300)
  })
  it('test_single_line_with_combo_3', () => {
    expect(calculateMoveScore(1, 3)).toBe(150) // 100 * 1.5
  })
  it('test_triple_line_with_combo_5', () => {
    expect(calculateMoveScore(3, 5)).toBe(1200) // 600 * 2
  })
  it('test_zero_lines', () => {
    expect(calculateMoveScore(0, 5)).toBe(0)
  })
})

describe('updateCombo', () => {
  it('test_single_line_resets', () => { expect(updateCombo(5, 1)).toBe(0) })
  it('test_double_line_increments', () => { expect(updateCombo(0, 2)).toBe(1) })
  it('test_triple_line_increments', () => { expect(updateCombo(3, 3)).toBe(4) })
  it('test_zero_lines_resets', () => { expect(updateCombo(5, 0)).toBe(0) })
})

// ==============================
// GAME STATE
// ==============================

describe('createNewGame', () => {
  it('test_starts_with_empty_grid', () => {
    expect(isGridEmpty(createNewGame().grid)).toBe(true)
  })
  it('test_starts_at_zero_score', () => {
    expect(createNewGame().score).toBe(0)
  })
  it('test_starts_with_3_blocks', () => {
    expect(createNewGame().queue).toHaveLength(3)
  })
  it('test_not_game_over', () => {
    expect(createNewGame().gameOver).toBe(false)
  })
  it('test_combo_starts_at_0', () => {
    expect(createNewGame().combo).toBe(0)
  })
  it('test_selectedBlockIndex_is_negative', () => {
    expect(createNewGame().selectedBlockIndex).toBe(-1)
  })
})

describe('loadBestScore / saveBestScore', () => {
  it('test_default_zero', () => { expect(loadBestScore()).toBe(0) })
  it('test_round_trip', () => {
    saveBestScore(42)
    expect(loadBestScore()).toBe(42)
  })
})

describe('saveGame / restoreGame / clearSave', () => {
  it('test_round_trip', () => {
    const state = createNewGame()
    saveGame(state)
    const restored = restoreGame()
    expect(restored).not.toBeNull()
    expect(restored!.score).toBe(0)
  })
  it('test_empty_returns_null', () => {
    expect(restoreGame()).toBeNull()
  })
  it('test_clear_removes', () => {
    saveGame(createNewGame())
    clearSave()
    expect(restoreGame()).toBeNull()
  })
})

describe('placeBlockFromQueue', () => {
  it('test_valid_placement', () => {
    const state = createNewGame()
    // Place the first block at 0,0
    const result = placeBlockFromQueue(state, 0, 0, 0)
    expect(result).not.toBeNull()
    expect(result!.state.blocksPlaced).toBe(1)
  })
  it('test_invalid_index_returns_null', () => {
    expect(placeBlockFromQueue(createNewGame(), -1, 0, 0)).toBeNull()
    expect(placeBlockFromQueue(createNewGame(), 5, 0, 0)).toBeNull()
  })
  it('test_invalid_placement_returns_null', () => {
    const state = createNewGame()
    // O-block at 9,9 won't fit
    state.queue[0] = { shape: { type: 'O', matrix: [[1, 1], [1, 1]] }, colorIndex: 0 }
    expect(placeBlockFromQueue(state, 0, 9, 9)).toBeNull()
  })
  it('test_clears_full_row', () => {
    const state = createNewGame()
    // Fill row 0 except col 0
    for (let c = 1; c < 10; c++) state.grid[0][c] = 1
    // Place a single block at 0,0
    state.queue[0] = { shape: { type: 'single', matrix: [[1]] }, colorIndex: 2 }
    const result = placeBlockFromQueue(state, 0, 0, 0)
    expect(result!.linesCleared).toBe(1)
    expect(result!.points).toBe(100)
  })
  it('test_queues_refilled', () => {
    const state = createNewGame()
    const result = placeBlockFromQueue(state, 0, 0, 0)
    expect(result!.state.queue).toHaveLength(3)
  })
  it('test_game_over_when_no_blocks_fit', () => {
    const state = createNewGame()
    // Fill entire grid
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 10; c++)
        state.grid[r][c] = 1
    // Leave one cell open
    state.grid[0][0] = null
    // Queue has only blocks bigger than 1 cell
    state.queue = [
      { shape: { type: 'O', matrix: [[1, 1], [1, 1]] }, colorIndex: 0 },
      { shape: { type: 'I', matrix: [[1, 1, 1, 1]] }, colorIndex: 1 },
      { shape: { type: 'trio_h', matrix: [[1, 1, 1]] }, colorIndex: 2 },
    ]
    // Place single at 0,0 if available — but queue has no single
    expect(canAnyBlockFit(state.grid, state.queue)).toBe(false)
  })
  it('test_gameOver_blocks_placement', () => {
    const state = createNewGame()
    state.gameOver = true
    expect(placeBlockFromQueue(state, 0, 0, 0)).toBeNull()
  })
})

// ==============================
// THEMES
// ==============================

describe('BLAST_THEMES', () => {
  it('test_has_6_themes', () => { expect(BLAST_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(BLAST_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(BLAST_THEMES[0].cost).toBe(0) })
  it('test_costs_increase', () => {
    for (let i = 2; i < BLAST_THEMES.length; i++)
      expect(BLAST_THEMES[i].cost).toBeGreaterThanOrEqual(BLAST_THEMES[i - 1].cost)
  })
  it('test_all_have_emoji', () => {
    for (const t of BLAST_THEMES) expect(t.emoji).toBeTruthy()
  })
  it('test_getBlastThemeById_valid', () => {
    expect(getBlastThemeById('pastel').name).toBe('糖果夢')
  })
  it('test_getBlastThemeById_invalid', () => {
    expect(() => getBlastThemeById('fake')).toThrow()
  })
})

describe('canBuyBlastTheme', () => {
  it('test_affordable', () => {
    expect(canBuyBlastTheme(200, 1000, ['pastel'], 'ocean')).toBe(true)
  })
  it('test_insufficient_coins', () => {
    expect(canBuyBlastTheme(50, 1000, ['pastel'], 'ocean')).toBe(false)
  })
  it('test_insufficient_score', () => {
    expect(canBuyBlastTheme(200, 100, ['pastel'], 'ocean')).toBe(false)
  })
  it('test_already_owned', () => {
    expect(canBuyBlastTheme(9999, 99999, ['pastel', 'ocean'], 'ocean')).toBe(false)
  })
})

describe('equipBlastTheme', () => {
  it('test_equip_unlocked', () => { expect(equipBlastTheme(['pastel', 'ocean'], 'ocean')).toBe(true) })
  it('test_equip_locked', () => { expect(equipBlastTheme(['pastel'], 'galaxy')).toBe(false) })
})

describe('getAvailableBlastThemes', () => {
  it('test_returns_all', () => { expect(getAvailableBlastThemes(9999, 99999, ['pastel'])).toHaveLength(6) })
  it('test_pastel_unlocked', () => {
    const t = getAvailableBlastThemes(0, 0, ['pastel']).find(t => t.theme.id === 'pastel')!
    expect(t.unlocked).toBe(true)
  })
})

// ==============================
// ACHIEVEMENTS
// ==============================

function makeStats(overrides: Partial<BlastStats> = {}): BlastStats {
  return {
    highScore: 0, totalGames: 0, totalBlocksPlaced: 0, totalLinesCleared: 0,
    maxCombo: 0, maxLinesSingleMove: 0, dailyCompleted: 0, themesUnlocked: 1,
    ...overrides,
  }
}

describe('BLAST_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => { expect(BLAST_ACHIEVEMENTS).toHaveLength(14) })
  it('test_unique_ids', () => { expect(new Set(BLAST_ACHIEVEMENTS.map(a => a.id)).size).toBe(14) })
  it('test_all_have_rewards', () => {
    for (const a of BLAST_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0)
  })
  it('test_getBlastAchievementById_valid', () => {
    expect(getBlastAchievementById('first-place').name).toBe('初次放置')
  })
  it('test_getBlastAchievementById_invalid', () => {
    expect(() => getBlastAchievementById('fake')).toThrow()
  })
})

describe('checkBlastAchievements', () => {
  it('test_unlocks_first_place', () => {
    expect(checkBlastAchievements(makeStats({ totalBlocksPlaced: 1 }), []).some(a => a.id === 'first-place')).toBe(true)
  })
  it('test_unlocks_first_line', () => {
    expect(checkBlastAchievements(makeStats({ totalLinesCleared: 1 }), []).some(a => a.id === 'first-line')).toBe(true)
  })
  it('test_unlocks_combo_3', () => {
    expect(checkBlastAchievements(makeStats({ maxCombo: 3 }), []).some(a => a.id === 'combo-3')).toBe(true)
  })
  it('test_unlocks_score_1000', () => {
    expect(checkBlastAchievements(makeStats({ highScore: 1000 }), []).some(a => a.id === 'score-1000')).toBe(true)
  })
  it('test_no_duplicate', () => {
    expect(checkBlastAchievements(makeStats({ totalBlocksPlaced: 1 }), ['first-place']).some(a => a.id === 'first-place')).toBe(false)
  })
  it('test_insufficient_no_unlock', () => {
    expect(checkBlastAchievements(makeStats(), []).length).toBe(0)
  })
  it('test_boundary_score_1000', () => {
    expect(checkBlastAchievements(makeStats({ highScore: 999 }), []).some(a => a.id === 'score-1000')).toBe(false)
    expect(checkBlastAchievements(makeStats({ highScore: 1000 }), []).some(a => a.id === 'score-1000')).toBe(true)
  })
  it('test_boundary_place_100', () => {
    expect(checkBlastAchievements(makeStats({ totalBlocksPlaced: 99 }), []).some(a => a.id === 'place-100')).toBe(false)
    expect(checkBlastAchievements(makeStats({ totalBlocksPlaced: 100 }), []).some(a => a.id === 'place-100')).toBe(true)
  })
  it('test_boundary_lines_50', () => {
    expect(checkBlastAchievements(makeStats({ totalLinesCleared: 49 }), []).some(a => a.id === 'lines-50')).toBe(false)
    expect(checkBlastAchievements(makeStats({ totalLinesCleared: 50 }), []).some(a => a.id === 'lines-50')).toBe(true)
  })
})

// ==============================
// META: Coins & Daily
// ==============================

describe('gameCoins', () => {
  it('test_100_score', () => { expect(gameCoins(100)).toBe(20) })
  it('test_zero', () => { expect(gameCoins(0)).toBe(0) })
  it('test_rounds_down', () => { expect(gameCoins(109)).toBe(21) })
})

describe('dailyRewardCoins', () => {
  it('test_returns_100', () => { expect(dailyRewardCoins()).toBe(100) })
})

describe('daily reward', () => {
  it('test_available_initially', () => { expect(isDailyRewardAvailable('')).toBe(true) })
  it('test_not_available_after_claim', () => {
    expect(isDailyRewardAvailable(new Date().toISOString().slice(0, 10))).toBe(false)
  })
  it('test_claim_first_time', () => {
    const r = claimDailyReward('')
    expect(r.claimed).toBe(true)
  })
  it('test_claim_already_claimed', () => {
    const r = claimDailyReward(new Date().toISOString().slice(0, 10))
    expect(r.claimed).toBe(false)
  })
})

// ==============================
// COLORS
// ==============================

describe('KAWAII_COLORS', () => {
  it('test_has_6_colors', () => { expect(KAWAII_COLORS).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(KAWAII_COLORS.map(c => c.id)).size).toBe(6) })
  it('test_all_have_hex', () => {
    for (const c of KAWAII_COLORS) expect(c.hex).toMatch(/^#/)
  })
  it('test_all_have_glow', () => {
    for (const c of KAWAII_COLORS) expect(c.glow).toMatch(/^#/)
  })
})

describe('getKawaiiColor', () => {
  it('test_index_0', () => { expect(getKawaiiColor(0).id).toBe('pink') })
  it('test_wraps_around', () => { expect(getKawaiiColor(6).id).toBe('pink') })
  it('test_index_5', () => { expect(getKawaiiColor(5).id).toBe('purple') })
})

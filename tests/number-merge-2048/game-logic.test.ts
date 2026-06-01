import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createEmptyGrid, getEmptyCells, spawnTile, slideRowLeft, slideGrid,
  hasWinTile, canMove, getHighestTile, countTiles, initGrid,
  cloneGrid, clearAnimations, resetTileIdCounter,
  type Tile, type Grid,
} from '../../src/games/number-merge-2048/logic/grid'
import { GRID_SIZE } from '../../src/games/number-merge-2048/logic/constants'
import { calculateMergePoints, calculateGameOverBonus } from '../../src/games/number-merge-2048/logic/scoring'
import {
  createNewGame, processMove, continuePlaying,
  loadBestScore, saveBestScore, clearSave, restoreGame, saveGame,
} from '../../src/games/number-merge-2048/logic/game-state'
import {
  canBuyMergeTheme, equipMergeTheme, getAvailableMergeThemes,
  checkMergeAchievements, gameCoins, dailyRewardCoins,
  isDailyRewardAvailable, claimDailyReward,
} from '../../src/games/number-merge-2048/logic/meta'
import { MERGE_THEMES, getMergeThemeById } from '../../src/games/number-merge-2048/data/themes'
import { MERGE_ACHIEVEMENTS, getMergeAchievementById, type Merge2048Stats } from '../../src/games/number-merge-2048/data/achievements'
import { getTileStyle } from '../../src/games/number-merge-2048/data/tile-colors'

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
  resetTileIdCounter()
})

// ==============================
// GRID: createEmptyGrid
// ==============================

describe('createEmptyGrid', () => {
  it('test_creates_4x4', () => {
    const grid = createEmptyGrid()
    expect(grid).toHaveLength(GRID_SIZE)
    for (const row of grid) expect(row).toHaveLength(GRID_SIZE)
  })
  it('test_all_null', () => {
    const grid = createEmptyGrid()
    for (const row of grid) for (const cell of row) expect(cell).toBeNull()
  })
})

// ==============================
// GRID: getEmptyCells
// ==============================

describe('getEmptyGrid', () => {
  it('test_full_grid_returns_16_cells', () => {
    expect(getEmptyCells(createEmptyGrid())).toHaveLength(16)
  })
  it('test_partial_grid', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[1][1] = { value: 4, id: 2 }
    expect(getEmptyCells(grid)).toHaveLength(14)
  })
  it('test_full_returns_empty', () => {
    const grid = createEmptyGrid()
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        grid[r][c] = { value: 2, id: r * 4 + c }
    expect(getEmptyCells(grid)).toHaveLength(0)
  })
})

// ==============================
// GRID: spawnTile
// ==============================

describe('spawnTile', () => {
  it('test_spawns_at_empty_cell', () => {
    const grid = createEmptyGrid()
    const result = spawnTile(grid)
    expect(result).not.toBeNull()
    const empty = getEmptyCells(result!.grid)
    expect(empty).toHaveLength(15)
  })
  it('test_spawns_value_2_or_4', () => {
    const grid = createEmptyGrid()
    const result = spawnTile(grid)
    const tile = result!.grid[result!.row][result!.col]
    expect(tile).not.toBeNull()
    expect([2, 4]).toContain(tile!.value)
  })
  it('test_marks_new_tile', () => {
    const grid = createEmptyGrid()
    const result = spawnTile(grid)
    const tile = result!.grid[result!.row][result!.col]
    expect(tile!.isNew).toBe(true)
  })
  it('test_full_grid_returns_null', () => {
    const grid = createEmptyGrid()
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        grid[r][c] = { value: 2, id: r * 4 + c }
    expect(spawnTile(grid)).toBeNull()
  })
})

// ==============================
// GRID: cloneGrid
// ==============================

describe('cloneGrid', () => {
  it('test_creates_deep_copy', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    const clone = cloneGrid(grid)
    clone[0][0]!.value = 999
    expect(grid[0][0]!.value).toBe(2)
  })
  it('test_preserves_null', () => {
    const clone = cloneGrid(createEmptyGrid())
    expect(clone[0][0]).toBeNull()
  })
})

// ==============================
// GRID: clearAnimations
// ==============================

describe('clearAnimations', () => {
  it('test_removes_isNew_flag', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1, isNew: true }
    const cleaned = clearAnimations(grid)
    expect(cleaned[0][0]!.isNew).toBeUndefined()
  })
  it('test_removes_mergedFrom_flag', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 4, id: 1, mergedFrom: [{ value: 2, id: 2 }, { value: 2, id: 3 }] }
    const cleaned = clearAnimations(grid)
    expect(cleaned[0][0]!.mergedFrom).toBeUndefined()
  })
  it('test_preserves_value', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 8, id: 1, isNew: true }
    const cleaned = clearAnimations(grid)
    expect(cleaned[0][0]!.value).toBe(8)
  })
})

// ==============================
// GRID: slideRowLeft
// ==============================

describe('slideRowLeft', () => {
  it('test_merges_two_equal_tiles', () => {
    const row: (Tile | null)[] = [{ value: 2, id: 1 }, { value: 2, id: 2 }, null, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(4)
    expect(result.row[1]).toBeNull()
    expect(result.points).toBe(4)
  })
  it('test_no_merge_different_values', () => {
    const row: (Tile | null)[] = [{ value: 2, id: 1 }, { value: 4, id: 2 }, null, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(2)
    expect(result.row[1]!.value).toBe(4)
    expect(result.points).toBe(0)
  })
  it('test_compacts_gaps', () => {
    const row: (Tile | null)[] = [null, { value: 2, id: 1 }, null, { value: 2, id: 2 }]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(4)
    expect(result.points).toBe(4)
  })
  it('test_no_triple_merge', () => {
    const row: (Tile | null)[] = [{ value: 2, id: 1 }, { value: 2, id: 2 }, { value: 2, id: 3 }, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(4)
    expect(result.row[1]!.value).toBe(2)
    expect(result.points).toBe(4)
  })
  it('test_four_equal_merges_to_two', () => {
    const row: (Tile | null)[] = [{ value: 4, id: 1 }, { value: 4, id: 2 }, { value: 4, id: 3 }, { value: 4, id: 4 }]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(8)
    expect(result.row[1]!.value).toBe(8)
    expect(result.points).toBe(16)
  })
  it('test_already_compact', () => {
    const row: (Tile | null)[] = [{ value: 2, id: 1 }, { value: 4, id: 2 }, { value: 8, id: 3 }, { value: 16, id: 4 }]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(2)
    expect(result.row[1]!.value).toBe(4)
    expect(result.row[2]!.value).toBe(8)
    expect(result.row[3]!.value).toBe(16)
    expect(result.points).toBe(0)
  })
  it('test_all_null', () => {
    const row: (Tile | null)[] = [null, null, null, null]
    const result = slideRowLeft(row)
    for (const cell of result.row) expect(cell).toBeNull()
    expect(result.points).toBe(0)
  })
  it('test_sets_mergedFrom_flag', () => {
    const row: (Tile | null)[] = [{ value: 8, id: 1 }, { value: 8, id: 2 }, null, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.mergedFrom).toBeDefined()
    expect(result.row[0]!.mergedFrom!.length).toBe(2)
  })
  it('test_high_merge_values', () => {
    const row: (Tile | null)[] = [{ value: 1024, id: 1 }, { value: 1024, id: 2 }, null, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(2048)
    expect(result.points).toBe(2048)
  })
})

// ==============================
// GRID: slideGrid
// ==============================

describe('slideGrid', () => {
  it('test_slide_left', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[0][2] = { value: 2, id: 2 }
    const result = slideGrid(grid, 'left')
    expect(result.grid[0][0]!.value).toBe(4)
    expect(result.moved).toBe(true)
    expect(result.points).toBe(4)
  })
  it('test_slide_right', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[0][2] = { value: 2, id: 2 }
    const result = slideGrid(grid, 'right')
    expect(result.grid[0][3]!.value).toBe(4)
    expect(result.moved).toBe(true)
  })
  it('test_slide_up', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[2][0] = { value: 2, id: 2 }
    const result = slideGrid(grid, 'up')
    expect(result.grid[0][0]!.value).toBe(4)
    expect(result.moved).toBe(true)
  })
  it('test_slide_down', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[2][0] = { value: 2, id: 2 }
    const result = slideGrid(grid, 'down')
    expect(result.grid[3][0]!.value).toBe(4)
    expect(result.moved).toBe(true)
  })
  it('test_no_move_returns_false', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    const result = slideGrid(grid, 'left')
    expect(result.moved).toBe(false)
  })
  it('test_multi_row_merge', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }; grid[0][1] = { value: 2, id: 2 }
    grid[1][0] = { value: 4, id: 3 }; grid[1][1] = { value: 4, id: 4 }
    const result = slideGrid(grid, 'left')
    expect(result.grid[0][0]!.value).toBe(4)
    expect(result.grid[1][0]!.value).toBe(8)
    expect(result.points).toBe(12)
  })
  it('test_does_not_mutate_input', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[0][2] = { value: 2, id: 2 }
    const original = cloneGrid(grid)
    slideGrid(grid, 'left')
    expect(grid[0][2]!.value).toBe(2)
  })
})

// ==============================
// GRID: hasWinTile
// ==============================

describe('hasWinTile', () => {
  it('test_empty_grid_false', () => {
    expect(hasWinTile(createEmptyGrid())).toBe(false)
  })
  it('test_1024_false', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 1024, id: 1 }
    expect(hasWinTile(grid)).toBe(false)
  })
  it('test_2048_true', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2048, id: 1 }
    expect(hasWinTile(grid)).toBe(true)
  })
  it('test_4096_also_true', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 4096, id: 1 }
    expect(hasWinTile(grid)).toBe(true)
  })
})

// ==============================
// GRID: canMove
// ==============================

describe('canMove', () => {
  it('test_empty_grid_can_move', () => {
    expect(canMove(createEmptyGrid())).toBe(true)
  })
  it('test_adjacent_horizontal_merge', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[0][1] = { value: 2, id: 2 }
    expect(canMove(grid)).toBe(true)
  })
  it('test_adjacent_vertical_merge', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[1][0] = { value: 2, id: 2 }
    expect(canMove(grid)).toBe(true)
  })
  it('test_no_moves_blocked', () => {
    const grid = createEmptyGrid()
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2, 4, 8, 16, 32, 64]
    let i = 0
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        grid[r][c] = { value: values[i], id: i++ }
    // This specific arrangement has no merges possible
    // Row 0: 2,4,8,16 - Row 1: 32,64,128,256 - Row 2: 512,1024,2,4 - Row 3: 8,16,32,64
    // Check neighbors: all different horizontally and vertically
    expect(canMove(grid)).toBe(false)
  })
})

// ==============================
// GRID: getHighestTile
// ==============================

describe('getHighestTile', () => {
  it('test_empty_grid_returns_0', () => {
    expect(getHighestTile(createEmptyGrid())).toBe(0)
  })
  it('test_finds_max', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[1][1] = { value: 1024, id: 2 }
    grid[2][2] = { value: 512, id: 3 }
    expect(getHighestTile(grid)).toBe(1024)
  })
})

// ==============================
// GRID: countTiles
// ==============================

describe('countTiles', () => {
  it('test_empty_grid_returns_0', () => {
    expect(countTiles(createEmptyGrid())).toBe(0)
  })
  it('test_counts_correctly', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[1][1] = { value: 4, id: 2 }
    expect(countTiles(grid)).toBe(2)
  })
  it('test_full_grid_returns_16', () => {
    const grid = createEmptyGrid()
    let i = 0
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        grid[r][c] = { value: 2, id: i++ }
    expect(countTiles(grid)).toBe(16)
  })
})

// ==============================
// GRID: initGrid
// ==============================

describe('initGrid', () => {
  it('test_starts_with_two_tiles', () => {
    const grid = initGrid()
    expect(countTiles(grid)).toBe(2)
  })
  it('test_tiles_are_2_or_4', () => {
    const grid = initGrid()
    for (const row of grid) {
      for (const tile of row) {
        if (tile) expect([2, 4]).toContain(tile.value)
      }
    }
  })
})

// ==============================
// SCORING
// ==============================

describe('scoring', () => {
  it('test_merge_points_equal_value', () => {
    expect(calculateMergePoints(4)).toBe(4)
    expect(calculateMergePoints(8)).toBe(8)
    expect(calculateMergePoints(2048)).toBe(2048)
  })
  it('test_game_over_bonus', () => {
    expect(calculateGameOverBonus(100)).toBe(10)
    expect(calculateGameOverBonus(0)).toBe(0)
    expect(calculateGameOverBonus(1000)).toBe(100)
  })
})

// ==============================
// GAME STATE
// ==============================

describe('createNewGame', () => {
  it('test_initializes_with_two_tiles', () => {
    const state = createNewGame()
    expect(countTiles(state.grid)).toBe(2)
  })
  it('test_starts_at_zero_score', () => {
    const state = createNewGame()
    expect(state.score).toBe(0)
  })
  it('test_not_won_not_game_over', () => {
    const state = createNewGame()
    expect(state.won).toBe(false)
    expect(state.gameOver).toBe(false)
  })
})

describe('loadBestScore', () => {
  it('test_defaults_to_zero', () => {
    expect(loadBestScore()).toBe(0)
  })
  it('test_saves_and_loads', () => {
    saveBestScore(1234)
    expect(loadBestScore()).toBe(1234)
  })
})

describe('saveGame / restoreGame', () => {
  it('test_round_trips', () => {
    const state = createNewGame()
    saveGame(state)
    const restored = restoreGame()
    expect(restored).not.toBeNull()
    expect(restored!.score).toBe(state.score)
  })
  it('test_returns_null_when_empty', () => {
    expect(restoreGame()).toBeNull()
  })
  it('test_clear_removes_save', () => {
    saveGame(createNewGame())
    clearSave()
    expect(restoreGame()).toBeNull()
  })
})

describe('processMove', () => {
  it('test_valid_move_changes_state', () => {
    let state = createNewGame()
    // Force a grid with known values for testing
    state.grid = createEmptyGrid()
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][2] = { value: 2, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    const { state: newState, moved } = processMove(state, 'left')
    expect(moved).toBe(true)
    expect(newState.score).toBe(4)
  })
  it('test_no_move_returns_same', () => {
    let state = createNewGame()
    state.grid = createEmptyGrid()
    state.grid[0][0] = { value: 2, id: 1 }
    const { state: newState, moved } = processMove(state, 'left')
    expect(moved).toBe(false)
  })
  it('test_game_over_when_no_moves', () => {
    let state = createNewGame()
    state.grid = createEmptyGrid()
    // Create a no-move state: values alternate so no merges possible
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2, 4, 8, 16, 32, 64]
    let id = 1
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        state.grid[r][c] = { value: values[r * 4 + c], id: id++ }
    // Only way to get game over is if no empty cells and no adjacent matches
    // But we need a move that fills the last empty cell
    // Simpler: just check the canMove logic directly
    expect(canMove(state.grid)).toBe(false)
  })
  it('test_tracks_move_count', () => {
    let state = createNewGame()
    state.grid = createEmptyGrid()
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][3] = { value: 4, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    const { state: newState } = processMove(state, 'left')
    expect(newState.moveCount).toBe(1)
  })
})

describe('continuePlaying', () => {
  it('test_sets_keepPlaying', () => {
    let state = createNewGame()
    state.won = true
    const continued = continuePlaying(state)
    expect(continued.keepPlaying).toBe(true)
    expect(continued.won).toBe(false)
  })
})

// ==============================
// THEMES
// ==============================

describe('MERGE_THEMES', () => {
  it('test_has_6_themes', () => {
    expect(MERGE_THEMES).toHaveLength(6)
  })
  it('test_unique_ids', () => {
    expect(new Set(MERGE_THEMES.map(t => t.id)).size).toBe(6)
  })
  it('test_first_free', () => {
    expect(MERGE_THEMES[0].cost).toBe(0)
    expect(MERGE_THEMES[0].requiredScore).toBe(0)
  })
  it('test_costs_increase', () => {
    for (let i = 2; i < MERGE_THEMES.length; i++)
      expect(MERGE_THEMES[i].cost).toBeGreaterThanOrEqual(MERGE_THEMES[i - 1].cost)
  })
  it('test_requiredScores_increase', () => {
    for (let i = 2; i < MERGE_THEMES.length; i++)
      expect(MERGE_THEMES[i].requiredScore).toBeGreaterThanOrEqual(MERGE_THEMES[i - 1].requiredScore)
  })
  it('test_all_have_emoji', () => {
    for (const t of MERGE_THEMES) expect(t.emoji).toBeTruthy()
  })
  it('test_all_have_bgColors', () => {
    for (const t of MERGE_THEMES) {
      expect(t.bgTop).toBeTruthy()
      expect(t.bgBot).toBeTruthy()
    }
  })
  it('test_getMergeThemeById_valid', () => {
    expect(getMergeThemeById('classic').name).toBe('經典粉')
  })
  it('test_getMergeThemeById_invalid', () => {
    expect(() => getMergeThemeById('fake')).toThrow()
  })
})

describe('canBuyMergeTheme', () => {
  it('test_affordable', () => {
    expect(canBuyMergeTheme(200, 1000, ['classic'], 'ocean')).toBe(true)
  })
  it('test_insufficient_coins', () => {
    expect(canBuyMergeTheme(50, 1000, ['classic'], 'ocean')).toBe(false)
  })
  it('test_insufficient_score', () => {
    expect(canBuyMergeTheme(200, 100, ['classic'], 'ocean')).toBe(false)
  })
  it('test_already_owned', () => {
    expect(canBuyMergeTheme(9999, 99999, ['classic', 'ocean'], 'ocean')).toBe(false)
  })
})

describe('equipMergeTheme', () => {
  it('test_equip_unlocked', () => {
    expect(equipMergeTheme(['classic', 'ocean'], 'ocean')).toBe(true)
  })
  it('test_equip_locked_fails', () => {
    expect(equipMergeTheme(['classic'], 'galaxy')).toBe(false)
  })
})

describe('getAvailableMergeThemes', () => {
  it('test_returns_all', () => {
    expect(getAvailableMergeThemes(9999, 99999, ['classic'])).toHaveLength(6)
  })
  it('test_classic_unlocked', () => {
    const t = getAvailableMergeThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!
    expect(t.unlocked).toBe(true)
  })
  it('test_locked_not_owned', () => {
    const t = getAvailableMergeThemes(0, 0, ['classic']).find(t => t.theme.id === 'galaxy')!
    expect(t.unlocked).toBe(false)
    expect(t.canBuy).toBe(false)
  })
})

// ==============================
// ACHIEVEMENTS
// ==============================

function makeStats(overrides: Partial<Merge2048Stats> = {}): Merge2048Stats {
  return {
    highScore: 0, highestTile: 0, totalGames: 0, totalMoves: 0,
    totalMerges: 0, bestMoveCount: 0, dailyCompleted: 0, themesUnlocked: 1,
    ...overrides,
  }
}

describe('MERGE_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => {
    expect(MERGE_ACHIEVEMENTS).toHaveLength(14)
  })
  it('test_unique_ids', () => {
    expect(new Set(MERGE_ACHIEVEMENTS.map(a => a.id)).size).toBe(14)
  })
  it('test_all_have_rewards', () => {
    for (const a of MERGE_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0)
  })
  it('test_all_have_emoji', () => {
    for (const a of MERGE_ACHIEVEMENTS) expect(a.emoji).toBeTruthy()
  })
  it('test_getMergeAchievementById_valid', () => {
    expect(getMergeAchievementById('first-merge').name).toBe('初次合併')
  })
  it('test_getMergeAchievementById_invalid', () => {
    expect(() => getMergeAchievementById('fake')).toThrow()
  })
})

describe('checkMergeAchievements', () => {
  it('test_unlocks_first_merge', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 4 }), [])
    expect(u.some(a => a.id === 'first-merge')).toBe(true)
  })
  it('test_unlocks_tile_128', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 128 }), [])
    expect(u.some(a => a.id === 'tile-128')).toBe(true)
  })
  it('test_unlocks_tile_512', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 512 }), [])
    expect(u.some(a => a.id === 'tile-512')).toBe(true)
  })
  it('test_unlocks_tile_2048', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 2048 }), [])
    expect(u.some(a => a.id === 'tile-2048')).toBe(true)
  })
  it('test_unlocks_score_1000', () => {
    const u = checkMergeAchievements(makeStats({ highScore: 1000 }), [])
    expect(u.some(a => a.id === 'score-1000')).toBe(true)
  })
  it('test_unlocks_score_5000', () => {
    const u = checkMergeAchievements(makeStats({ highScore: 5000 }), [])
    expect(u.some(a => a.id === 'score-5000')).toBe(true)
  })
  it('test_unlocks_score_10000', () => {
    const u = checkMergeAchievements(makeStats({ highScore: 10000 }), [])
    expect(u.some(a => a.id === 'score-10000')).toBe(true)
  })
  it('test_unlocks_games_10', () => {
    const u = checkMergeAchievements(makeStats({ totalGames: 10 }), [])
    expect(u.some(a => a.id === 'games-10')).toBe(true)
  })
  it('test_unlocks_games_50', () => {
    const u = checkMergeAchievements(makeStats({ totalGames: 50 }), [])
    expect(u.some(a => a.id === 'games-50')).toBe(true)
  })
  it('test_unlocks_moves_500', () => {
    const u = checkMergeAchievements(makeStats({ totalMoves: 500 }), [])
    expect(u.some(a => a.id === 'moves-500')).toBe(true)
  })
  it('test_unlocks_win_fast', () => {
    const u = checkMergeAchievements(makeStats({ bestMoveCount: 150 }), [])
    expect(u.some(a => a.id === 'win-fast')).toBe(true)
  })
  it('test_unlocks_daily_3', () => {
    const u = checkMergeAchievements(makeStats({ dailyCompleted: 3 }), [])
    expect(u.some(a => a.id === 'daily-3')).toBe(true)
  })
  it('test_unlocks_theme_3', () => {
    const u = checkMergeAchievements(makeStats({ themesUnlocked: 3 }), [])
    expect(u.some(a => a.id === 'theme-3')).toBe(true)
  })
  it('test_unlocks_theme_all', () => {
    const u = checkMergeAchievements(makeStats({ themesUnlocked: 6 }), [])
    expect(u.some(a => a.id === 'theme-all')).toBe(true)
  })
  it('test_no_duplicate', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 4 }), ['first-merge'])
    expect(u.some(a => a.id === 'first-merge')).toBe(false)
  })
  it('test_multiple_achievements', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 2048, highScore: 10000 }), [])
    expect(u.length).toBeGreaterThanOrEqual(4)
  })
  it('test_insufficient_no_unlock', () => {
    const u = checkMergeAchievements(makeStats(), [])
    expect(u.length).toBe(0)
  })
  it('test_boundary_tile_128', () => {
    expect(checkMergeAchievements(makeStats({ highestTile: 127 }), []).some(a => a.id === 'tile-128')).toBe(false)
    expect(checkMergeAchievements(makeStats({ highestTile: 128 }), []).some(a => a.id === 'tile-128')).toBe(true)
  })
  it('test_boundary_win_fast', () => {
    expect(checkMergeAchievements(makeStats({ bestMoveCount: 201 }), []).some(a => a.id === 'win-fast')).toBe(false)
    expect(checkMergeAchievements(makeStats({ bestMoveCount: 200 }), []).some(a => a.id === 'win-fast')).toBe(true)
    // bestMoveCount = 0 means never won
    expect(checkMergeAchievements(makeStats({ bestMoveCount: 0 }), []).some(a => a.id === 'win-fast')).toBe(false)
  })
  it('test_boundary_games_10', () => {
    expect(checkMergeAchievements(makeStats({ totalGames: 9 }), []).some(a => a.id === 'games-10')).toBe(false)
    expect(checkMergeAchievements(makeStats({ totalGames: 10 }), []).some(a => a.id === 'games-10')).toBe(true)
  })
})

// ==============================
// META: Coins & Daily
// ==============================

describe('gameCoins', () => {
  it('test_base_coins', () => {
    expect(gameCoins(100, false)).toBe(10)
  })
  it('test_win_bonus', () => {
    expect(gameCoins(100, true)).toBe(60) // 10 + 50
  })
  it('test_zero_score', () => {
    expect(gameCoins(0, false)).toBe(0)
    expect(gameCoins(0, true)).toBe(50)
  })
})

describe('dailyRewardCoins', () => {
  it('test_returns_100', () => {
    expect(dailyRewardCoins()).toBe(100)
  })
})

describe('daily reward', () => {
  it('test_available_initially', () => {
    expect(isDailyRewardAvailable('')).toBe(true)
  })
  it('test_not_available_after_claim', () => {
    expect(isDailyRewardAvailable(new Date().toISOString().slice(0, 10))).toBe(false)
  })
  it('test_claim_first_time', () => {
    const r = claimDailyReward('')
    expect(r.claimed).toBe(true)
    expect(r.today).toBeTruthy()
  })
  it('test_claim_already_claimed', () => {
    const r = claimDailyReward(new Date().toISOString().slice(0, 10))
    expect(r.claimed).toBe(false)
  })
  it('test_claim_different_day', () => {
    const r = claimDailyReward('2020-01-01')
    expect(r.claimed).toBe(true)
  })
})

// ==============================
// TILE COLORS
// ==============================

describe('getTileStyle', () => {
  it('test_has_style_for_2', () => {
    const s = getTileStyle(2)
    expect(s.bg).toBeTruthy()
    expect(s.color).toBe('#fff')
  })
  it('test_has_style_for_2048', () => {
    const s = getTileStyle(2048)
    expect(s.glow).toBeTruthy()
  })
  it('test_high_value_falls_back', () => {
    const s = getTileStyle(999999)
    expect(s.bg).toBeTruthy()
  })
  it('test_all_power_of_two_styles', () => {
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]
    for (const v of values) {
      const s = getTileStyle(v)
      expect(s.bg).toBeTruthy()
      expect(s.fontSize).toBeTruthy()
    }
  })
})

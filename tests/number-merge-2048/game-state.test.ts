import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createEmptyGrid, countTiles, cloneGrid, canMove, resetTileIdCounter,
  type Tile, type Direction,
} from '../../src/games/number-merge-2048/logic/grid'
import {
  createNewGame, processMove, continuePlaying,
  loadBestScore, saveBestScore, clearSave, restoreGame, saveGame,
  type GameState,
} from '../../src/games/number-merge-2048/logic/game-state'

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

/** Helper: build a state with a specific grid layout */
function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    grid: createEmptyGrid(),
    score: 0,
    bestScore: 0,
    won: false,
    gameOver: false,
    keepPlaying: false,
    moveCount: 0,
    highestTile: 2,
    ...overrides,
  }
}

// ==============================
// createNewGame
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
  it('test_keepPlaying_false', () => {
    const state = createNewGame()
    expect(state.keepPlaying).toBe(false)
  })
  it('test_moveCount_zero', () => {
    const state = createNewGame()
    expect(state.moveCount).toBe(0)
  })
  it('test_highestTile_is_2', () => {
    const state = createNewGame()
    expect(state.highestTile).toBe(2)
  })
  it('test_loads_best_score_from_storage', () => {
    saveBestScore(500)
    const state = createNewGame()
    expect(state.bestScore).toBe(500)
  })
})

// ==============================
// loadBestScore / saveBestScore
// ==============================

describe('loadBestScore', () => {
  it('test_defaults_to_zero', () => {
    expect(loadBestScore()).toBe(0)
  })
  it('test_saves_and_loads', () => {
    saveBestScore(1234)
    expect(loadBestScore()).toBe(1234)
  })
  it('test_overwrites_previous', () => {
    saveBestScore(100)
    saveBestScore(200)
    expect(loadBestScore()).toBe(200)
  })
  it('test_handles_zero', () => {
    saveBestScore(500)
    saveBestScore(0)
    expect(loadBestScore()).toBe(0)
  })
})

// ==============================
// saveGame / restoreGame / clearSave
// ==============================

describe('saveGame / restoreGame / clearSave', () => {
  it('test_round_trips_score', () => {
    const state = makeState({ score: 42 })
    saveGame(state)
    const restored = restoreGame()
    expect(restored).not.toBeNull()
    expect(restored!.score).toBe(42)
  })
  it('test_round_trips_grid', () => {
    const state = makeState()
    state.grid[0][0] = { value: 8, id: 1 }
    saveGame(state)
    const restored = restoreGame()
    expect(restored!.grid[0][0]!.value).toBe(8)
  })
  it('test_round_trips_won_flag', () => {
    const state = makeState({ won: true })
    saveGame(state)
    expect(restoreGame()!.won).toBe(true)
  })
  it('test_round_trips_gameOver_flag', () => {
    const state = makeState({ gameOver: true })
    saveGame(state)
    expect(restoreGame()!.gameOver).toBe(true)
  })
  it('test_round_trips_moveCount', () => {
    const state = makeState({ moveCount: 42 })
    saveGame(state)
    expect(restoreGame()!.moveCount).toBe(42)
  })
  it('test_returns_null_when_empty', () => {
    expect(restoreGame()).toBeNull()
  })
  it('test_clear_removes_save', () => {
    saveGame(makeState())
    clearSave()
    expect(restoreGame()).toBeNull()
  })
  it('test_clear_when_already_empty', () => {
    clearSave()
    expect(restoreGame()).toBeNull()
  })
  it('test_strips_animation_flags_on_save', () => {
    const state = makeState()
    state.grid[0][0] = { value: 2, id: 1, isNew: true }
    state.grid[1][1] = { value: 4, id: 2, mergedFrom: [{ value: 2, id: 3 }, { value: 2, id: 4 }] }
    saveGame(state)
    const restored = restoreGame()
    expect(restored!.grid[0][0]!.isNew).toBeUndefined()
    expect(restored!.grid[1][1]!.mergedFrom).toBeUndefined()
  })
})

// ==============================
// processMove
// ==============================

describe('processMove', () => {
  it('test_valid_left_merge_scores', () => {
    const state = makeState()
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][2] = { value: 2, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    const { state: ns, moved } = processMove(state, 'left')
    expect(moved).toBe(true)
    expect(ns.score).toBe(4)
  })
  it('test_no_move_returns_same', () => {
    const state = makeState()
    state.grid[0][0] = { value: 2, id: 1 }
    const { state: ns, moved } = processMove(state, 'left')
    expect(moved).toBe(false)
    expect(ns).toBe(state)
  })
  it('test_game_over_when_no_moves_left', () => {
    const state = makeState()
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2, 4, 8, 16, 32, 64]
    let id = 1
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        state.grid[r][c] = { value: values[r * 4 + c], id: id++ }
    expect(canMove(state.grid)).toBe(false)
  })
  it('test_tracks_move_count', () => {
    const state = makeState()
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][3] = { value: 4, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    const { state: ns } = processMove(state, 'left')
    expect(ns.moveCount).toBe(1)
  })
  it('test_incrementing_move_count', () => {
    let state = makeState()
    // Set up a grid where right then left always produces a valid move
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][3] = { value: 4, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    const { state: s1 } = processMove(state, 'left')
    expect(s1.moveCount).toBe(1)
  })
  it('test_best_score_updates', () => {
    saveBestScore(0)
    const state = makeState()
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][2] = { value: 2, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    const { state: ns } = processMove(state, 'left')
    expect(ns.bestScore).toBeGreaterThanOrEqual(4)
  })
  it('test_gameOver_blocks_further_moves', () => {
    const state = makeState({ gameOver: true })
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][2] = { value: 2, id: 2 }
    const { moved } = processMove(state, 'left')
    expect(moved).toBe(false)
  })
  it('test_won_blocks_further_moves_unless_keepPlaying', () => {
    const state = makeState({ won: true })
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][2] = { value: 2, id: 2 }
    const { moved } = processMove(state, 'left')
    expect(moved).toBe(false)
  })
  it('test_keepPlaying_allows_moves_after_win', () => {
    const state = makeState({ won: true, keepPlaying: true })
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][2] = { value: 2, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    const { state: ns, moved } = processMove(state, 'left')
    expect(moved).toBe(true)
  })
  it('test_right_direction', () => {
    const state = makeState()
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][2] = { value: 2, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    const { state: ns, moved } = processMove(state, 'right')
    expect(moved).toBe(true)
  })
  it('test_up_direction', () => {
    const state = makeState()
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[2][0] = { value: 2, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    const { state: ns, moved } = processMove(state, 'up')
    expect(moved).toBe(true)
  })
  it('test_down_direction', () => {
    const state = makeState()
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[2][0] = { value: 2, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    const { state: ns, moved } = processMove(state, 'down')
    expect(moved).toBe(true)
  })
  it('test_saves_state_after_move', () => {
    const state = makeState()
    state.grid[0][0] = { value: 2, id: 1 }
    state.grid[0][2] = { value: 2, id: 2 }
    state.grid[3][3] = { value: 2, id: 3 }
    processMove(state, 'left')
    const restored = restoreGame()
    expect(restored).not.toBeNull()
    expect(restored!.moveCount).toBe(1)
  })
})

// ==============================
// continuePlaying
// ==============================

describe('continuePlaying', () => {
  it('test_sets_keepPlaying_true', () => {
    const state = makeState({ won: true })
    const continued = continuePlaying(state)
    expect(continued.keepPlaying).toBe(true)
  })
  it('test_clears_won_flag', () => {
    const state = makeState({ won: true })
    const continued = continuePlaying(state)
    expect(continued.won).toBe(false)
  })
  it('test_preserves_score', () => {
    const state = makeState({ won: true, score: 500 })
    const continued = continuePlaying(state)
    expect(continued.score).toBe(500)
  })
  it('test_preserves_grid', () => {
    const state = makeState({ won: true })
    state.grid[0][0] = { value: 2048, id: 1 }
    const continued = continuePlaying(state)
    expect(continued.grid[0][0]!.value).toBe(2048)
  })
  it('test_returns_new_object', () => {
    const state = makeState({ won: true })
    const continued = continuePlaying(state)
    expect(continued).not.toBe(state)
  })
})

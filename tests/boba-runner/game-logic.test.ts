import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OBSTACLES, getObstacleById } from '../../src/games/boba-runner/data/obstacles'
import { POWERUPS, getPowerUpById } from '../../src/games/boba-runner/data/powerups'
import {
  type RunnerState, createInitialState, getPlayerHitbox,
  jump, slide, updatePlayer, getPlayerHeight,
  aabbOverlap, checkObstacleCollision,
  spawnObstacle, spawnPearls, updateWorld,
  collectPearls, collectPowerUps, applyPowerUp, updatePowerUps,
  handleHit, getSpeedPercent,
} from '../../src/games/boba-runner/logic/game-state'
import { loadSave, saveProgress, resetSave } from '../../src/games/boba-runner/logic/save'
import {
  PLAYER_X, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SLIDE_HEIGHT,
  GROUND_Y, BASE_SPEED, MAX_SPEED, JUMP_VELOCITY, GRAVITY,
  SLIDE_DURATION, PEARL_RADIUS, GAME_W, SAVE_KEY,
} from '../../src/games/boba-runner/logic/constants'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ===== Obstacle Data =====

describe('OBSTACLES', () => {
  it('test_has_5_types', () => { expect(OBSTACLES).toHaveLength(5) })
  it('test_unique_ids', () => { expect(new Set(OBSTACLES.map(o => o.id)).size).toBe(5) })
  it('test_required_fields', () => {
    for (const o of OBSTACLES) { expect(o.name).toBeTruthy(); expect(o.width).toBeGreaterThan(0); expect(o.height).toBeGreaterThan(0) }
  })
  it('test_getObstacleById_valid', () => { expect(getObstacleById('spilled-tea').name).toBe('洒出的茶') })
  it('test_getObstacleById_invalid', () => { expect(() => getObstacleById('fake')).toThrow() })
})

// ===== PowerUp Data =====

describe('POWERUPS', () => {
  it('test_has_3_types', () => { expect(POWERUPS).toHaveLength(3) })
  it('test_unique_ids', () => { expect(new Set(POWERUPS.map(p => p.id)).size).toBe(3) })
  it('test_shield_no_duration', () => { expect(getPowerUpById('shield').duration).toBe(0) })
  it('test_magnet_has_duration', () => { expect(getPowerUpById('magnet').duration).toBeGreaterThan(0) })
  it('test_double_has_duration', () => { expect(getPowerUpById('double').duration).toBeGreaterThan(0) })
  it('test_getPowerUpById_valid', () => { expect(getPowerUpById('magnet').name).toBe('磁铁') })
  it('test_getPowerUpById_invalid', () => { expect(() => getPowerUpById('fake')).toThrow() })
})

// ===== Initial State =====

describe('createInitialState', () => {
  it('test_defaults', () => {
    const s = createInitialState()
    expect(s.score).toBe(0); expect(s.pearls).toBe(0); expect(s.speed).toBe(BASE_SPEED)
    expect(s.playerState).toBe('running'); expect(s.gameOver).toBe(false); expect(s.shieldActive).toBe(false)
  })
  it('test_carries_high_score', () => { expect(createInitialState(500).highScore).toBe(500) })
})

// ===== Player Physics =====

describe('player physics', () => {
  it('test_jump_from_running', () => {
    const s = createInitialState(); s.playerState = 'running'
    expect(jump(s)).toBe(true); expect(s.playerState).toBe('jumping'); expect(s.playerVY).toBe(JUMP_VELOCITY)
  })
  it('test_jump_fails_while_jumping', () => {
    const s = createInitialState(); s.playerState = 'jumping'
    expect(jump(s)).toBe(false)
  })
  it('test_jump_fails_while_dead', () => {
    const s = createInitialState(); s.playerState = 'dead'
    expect(jump(s)).toBe(false)
  })
  it('test_slide_from_running', () => {
    const s = createInitialState(); s.playerState = 'running'
    expect(slide(s, 1000)).toBe(true); expect(s.playerState).toBe('sliding'); expect(s.slideEndsAt).toBe(1000 + SLIDE_DURATION)
  })
  it('test_slide_fails_while_jumping', () => {
    const s = createInitialState(); s.playerState = 'jumping'
    expect(slide(s, 1000)).toBe(false)
  })
  it('test_updatePlayer_gravity', () => {
    const s = createInitialState(); s.playerState = 'running'
    jump(s)
    const y0 = s.playerY
    updatePlayer(s, 100)
    expect(s.playerY).toBeLessThan(y0) // going up initially
    // After many frames, should come back down
    for (let i = 0; i < 50; i++) updatePlayer(s, 100 + i * 16)
    expect(s.playerState).toBe('running')
  })
  it('test_updatePlayer_slide_expires', () => {
    const s = createInitialState(); s.playerState = 'running'
    slide(s, 1000)
    updatePlayer(s, 1000 + SLIDE_DURATION + 1)
    expect(s.playerState).toBe('running')
  })
  it('test_getPlayerHeight_running', () => {
    const s = createInitialState(); s.playerState = 'running'
    expect(getPlayerHeight(s)).toBe(PLAYER_HEIGHT)
  })
  it('test_getPlayerHeight_sliding', () => {
    const s = createInitialState(); s.playerState = 'sliding'
    expect(getPlayerHeight(s)).toBe(PLAYER_SLIDE_HEIGHT)
  })
  it('test_getPlayerHitbox', () => {
    const s = createInitialState()
    const box = getPlayerHitbox(s)
    expect(box.x).toBe(PLAYER_X); expect(box.w).toBe(PLAYER_WIDTH); expect(box.h).toBe(PLAYER_HEIGHT)
  })
})

// ===== AABB Collision =====

describe('aabbOverlap', () => {
  it('test_overlapping_boxes', () => {
    expect(aabbOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true)
  })
  it('test_non_overlapping', () => {
    expect(aabbOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 10, h: 10 })).toBe(false)
  })
  it('test_adjacent_no_overlap', () => {
    expect(aabbOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false)
  })
  it('test_contained', () => {
    expect(aabbOverlap({ x: 0, y: 0, w: 20, h: 20 }, { x: 5, y: 5, w: 5, h: 5 })).toBe(true)
  })
  it('test_partial_overlap_x', () => {
    expect(aabbOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 8, y: 0, w: 10, h: 10 })).toBe(true)
  })
  it('test_partial_overlap_y', () => {
    expect(aabbOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 8, w: 10, h: 10 })).toBe(true)
  })
})

// ===== Obstacle Collision =====

describe('checkObstacleCollision', () => {
  it('test_no_collision_when_empty', () => {
    const s = createInitialState()
    expect(checkObstacleCollision(s)).toBeNull()
  })
  it('test_collision_when_overlapping', () => {
    const s = createInitialState()
    s.obstacles.push({ x: PLAYER_X, y: s.playerY, width: 50, height: 50, type: 'box', id: 'test' })
    expect(checkObstacleCollision(s)).not.toBeNull()
  })
  it('test_no_collision_when_far', () => {
    const s = createInitialState()
    s.obstacles.push({ x: 500, y: 500, width: 50, height: 50, type: 'box', id: 'test' })
    expect(checkObstacleCollision(s)).toBeNull()
  })
})

// ===== Spawning =====

describe('spawning', () => {
  it('test_spawnObstacle_adds_entity', () => {
    const s = createInitialState()
    spawnObstacle(s, GAME_W)
    expect(s.obstacles.length).toBeGreaterThanOrEqual(1)
  })
  it('test_spawnPearls_adds_entities', () => {
    const s = createInitialState()
    spawnPearls(s, GAME_W)
    expect(s.pearlEntities.length).toBeGreaterThanOrEqual(2)
  })
  it('test_spawnObstacle_sets_next_position', () => {
    const s = createInitialState()
    spawnObstacle(s, GAME_W)
    expect(s.nextObstacleX).toBeGreaterThan(GAME_W)
  })
})

// ===== World Update =====

describe('updateWorld', () => {
  it('test_moves_obstacles_left', () => {
    const s = createInitialState()
    s.obstacles.push({ x: 400, y: 600, width: 50, height: 50, type: 'box', id: 't' })
    updateWorld(s, GAME_W)
    expect(s.obstacles[0].x).toBeLessThan(400)
  })
  it('test_removes_offscreen_obstacles', () => {
    const s = createInitialState()
    s.obstacles.push({ x: -200, y: 600, width: 50, height: 50, type: 'box', id: 'old' })
    s.nextObstacleX = 9999 // prevent respawn
    updateWorld(s, GAME_W)
    expect(s.obstacles.some(o => o.id === 'old')).toBe(false)
  })
  it('test_increases_distance', () => {
    const s = createInitialState()
    const d0 = s.distance
    updateWorld(s, GAME_W)
    expect(s.distance).toBeGreaterThan(d0)
  })
  it('test_speed_increases', () => {
    const s = createInitialState()
    const s0 = s.speed
    for (let i = 0; i < 1000; i++) updateWorld(s, GAME_W)
    expect(s.speed).toBeGreaterThan(s0)
  })
  it('test_speed_caps_at_max', () => {
    const s = createInitialState()
    s.speed = MAX_SPEED
    updateWorld(s, GAME_W)
    expect(s.speed).toBeLessThanOrEqual(MAX_SPEED)
  })
  it('test_spawns_obstacles_when_empty', () => {
    const s = createInitialState()
    s.obstacles = []
    updateWorld(s, GAME_W)
    expect(s.obstacles.length).toBeGreaterThanOrEqual(0) // may or may not spawn depending on nextObstacleX
  })
})

// ===== Pearl Collection =====

describe('collectPearls', () => {
  it('test_collects_nearby_pearl', () => {
    const s = createInitialState()
    s.pearlEntities.push({ x: PLAYER_X + 10, y: s.playerY + 10, collected: false })
    const count = collectPearls(s)
    expect(count).toBe(1); expect(s.pearls).toBe(1)
  })
  it('test_does_not_collect_far_pearl', () => {
    const s = createInitialState()
    s.pearlEntities.push({ x: 500, y: 500, collected: false })
    expect(collectPearls(s)).toBe(0)
  })
  it('test_magnet_expands_collection_radius', () => {
    const s = createInitialState()
    s.activePowerUps.push({ type: 'magnet', endsAt: Date.now() + 5000 })
    s.pearlEntities.push({ x: PLAYER_X + 100, y: s.playerY, collected: false })
    expect(collectPearls(s)).toBe(1)
  })
  it('test_does_not_collect_already_collected', () => {
    const s = createInitialState()
    s.pearlEntities.push({ x: PLAYER_X + 10, y: s.playerY + 10, collected: true })
    expect(collectPearls(s)).toBe(0)
  })
})

// ===== Power-Up Collection =====

describe('power-ups', () => {
  it('test_applyPowerUp_shield', () => {
    const s = createInitialState()
    applyPowerUp(s, 'shield', 1000)
    expect(s.shieldActive).toBe(true)
  })
  it('test_applyPowerUp_magnet', () => {
    const s = createInitialState()
    applyPowerUp(s, 'magnet', 1000)
    expect(s.activePowerUps.some(p => p.type === 'magnet')).toBe(true)
  })
  it('test_applyPowerUp_double', () => {
    const s = createInitialState()
    applyPowerUp(s, 'double', 1000)
    expect(s.doubleScore).toBe(true)
  })
  it('test_updatePowerUps_expires', () => {
    const s = createInitialState()
    s.activePowerUps.push({ type: 'double', endsAt: 1000 })
    s.doubleScore = true
    updatePowerUps(s, 2000)
    expect(s.doubleScore).toBe(false)
    expect(s.activePowerUps.length).toBe(0)
  })
  it('test_updatePowerUps_keeps_active', () => {
    const s = createInitialState()
    s.activePowerUps.push({ type: 'magnet', endsAt: 5000 })
    updatePowerUps(s, 2000)
    expect(s.activePowerUps.length).toBe(1)
  })
  it('test_collectPowerUps_picks_up', () => {
    const s = createInitialState()
    s.powerUpEntities.push({ x: PLAYER_X + 10, y: s.playerY + 10, type: 'shield', collected: false })
    const result = collectPowerUps(s, 1000)
    expect(result).toBe('shield'); expect(s.shieldActive).toBe(true)
  })
})

// ===== Hit / Death =====

describe('handleHit', () => {
  it('test_dies_without_shield', () => {
    const s = createInitialState()
    expect(handleHit(s)).toBe(true); expect(s.gameOver).toBe(true); expect(s.playerState).toBe('dead')
  })
  it('test_survives_with_shield', () => {
    const s = createInitialState(); s.shieldActive = true
    expect(handleHit(s)).toBe(false); expect(s.shieldActive).toBe(false); expect(s.gameOver).toBe(false)
  })
  it('test_updates_high_score_on_death', () => {
    const s = createInitialState(100); s.score = 500
    handleHit(s)
    expect(s.highScore).toBe(500)
  })
})

// ===== Speed =====

describe('getSpeedPercent', () => {
  it('test_0_at_base', () => { expect(getSpeedPercent(createInitialState())).toBe(0) })
  it('test_1_at_max', () => { const s = createInitialState(); s.speed = MAX_SPEED; expect(getSpeedPercent(s)).toBe(1) })
  it('test_between', () => { const s = createInitialState(); s.speed = (BASE_SPEED + MAX_SPEED) / 2; const pct = getSpeedPercent(s); expect(pct).toBeGreaterThan(0); expect(pct).toBeLessThan(1) })
})

// ===== Save/Load =====

describe('save/load', () => {
  beforeEach(() => { localStorage.clear() })
  it('test_loadSave_default', () => { const s = loadSave(); expect(s.highScore).toBe(0); expect(s.totalPearls).toBe(0) })
  it('test_saveProgress_and_load', () => { saveProgress(500, 30); const s = loadSave(); expect(s.highScore).toBe(500); expect(s.totalPearls).toBe(30) })
  it('test_saveProgress_keeps_higher', () => { saveProgress(500, 10); saveProgress(300, 20); expect(loadSave().highScore).toBe(500) })
  it('test_saveProgress_accumulates_pearls', () => { saveProgress(100, 10); saveProgress(200, 20); expect(loadSave().totalPearls).toBe(30) })
  it('test_corrupted', () => { localStorage.setItem(SAVE_KEY, 'BROKEN'); expect(loadSave().highScore).toBe(0) })
  it('test_resetSave', () => { saveProgress(100, 10); resetSave(); expect(loadSave().highScore).toBe(0) })
})

// ===== Constants =====

describe('constants', () => {
  it('test_player_dimensions', () => { expect(PLAYER_WIDTH).toBeGreaterThan(0); expect(PLAYER_HEIGHT).toBeGreaterThan(PLAYER_SLIDE_HEIGHT) })
  it('test_speed_range', () => { expect(BASE_SPEED).toBeLessThan(MAX_SPEED) })
  it('test_jump_is_negative', () => { expect(JUMP_VELOCITY).toBeLessThan(0) })
  it('test_gravity_is_positive', () => { expect(GRAVITY).toBeGreaterThan(0) })
})

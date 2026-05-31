import { OBSTACLES, type ObstacleDef } from '../data/obstacles'
import { POWERUPS, type PowerUpDef } from '../data/powerups'
import {
  PLAYER_X, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SLIDE_HEIGHT,
  JUMP_VELOCITY, GRAVITY, SLIDE_DURATION,
  GROUND_Y, BASE_SPEED, MAX_SPEED, SPEED_INCREMENT,
  DISTANCE_PER_POINT, OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP,
  PEARL_RADIUS, PEARL_GAP, POWERUP_CHANCE, MAGNET_RADIUS,
} from './constants'

// === Types ===

export interface AABB {
  x: number
  y: number
  w: number
  h: number
}

export interface Entity {
  x: number
  y: number
  width: number
  height: number
  type: string
  id: string
}

export type PlayerState = 'running' | 'jumping' | 'sliding' | 'dead'

export interface ActivePowerUp {
  type: string
  endsAt: number
}

export interface RunnerState {
  // Player
  playerY: number
  playerVY: number
  playerState: PlayerState
  slideEndsAt: number
  // World
  speed: number
  distance: number
  score: number
  pearls: number
  // Entities
  obstacles: Entity[]
  pearlEntities: { x: number; y: number; collected: boolean }[]
  powerUpEntities: { x: number; y: number; type: string; collected: boolean }[]
  activePowerUps: ActivePowerUp[]
  // State
  highScore: number
  shieldActive: boolean
  gameOver: boolean
  paused: boolean
  // Spawning
  nextObstacleX: number
  nextPearlX: number
  frameCount: number
  // Double score tracking
  doubleScore: boolean
}

// === Initialization ===

export function createInitialState(highScore: number = 0): RunnerState {
  return {
    playerY: GROUND_Y - PLAYER_HEIGHT,
    playerVY: 0,
    playerState: 'running',
    slideEndsAt: 0,
    speed: BASE_SPEED,
    distance: 0,
    score: 0,
    pearls: 0,
    obstacles: [],
    pearlEntities: [],
    powerUpEntities: [],
    activePowerUps: [],
    highScore,
    shieldActive: false,
    gameOver: false,
    paused: false,
    nextObstacleX: 600,
    nextPearlX: 300,
    frameCount: 0,
    doubleScore: false,
  }
}

// === Player Physics ===

export function jump(state: RunnerState): boolean {
  if (state.playerState === 'jumping' || state.playerState === 'dead') return false
  state.playerState = 'jumping'
  state.playerVY = JUMP_VELOCITY
  return true
}

export function slide(state: RunnerState, now: number): boolean {
  if (state.playerState === 'jumping' || state.playerState === 'dead') return false
  state.playerState = 'sliding'
  state.slideEndsAt = now + SLIDE_DURATION
  return true
}

export function updatePlayer(state: RunnerState, now: number): void {
  if (state.playerState === 'jumping') {
    state.playerVY += GRAVITY
    state.playerY += state.playerVY
    const ground = GROUND_Y - getPlayerHeight(state)
    if (state.playerY >= ground) {
      state.playerY = ground
      state.playerVY = 0
      state.playerState = 'running'
    }
  } else if (state.playerState === 'sliding') {
    if (now >= state.slideEndsAt) {
      state.playerState = 'running'
    }
  }
}

export function getPlayerHeight(state: RunnerState): number {
  return state.playerState === 'sliding' ? PLAYER_SLIDE_HEIGHT : PLAYER_HEIGHT
}

export function getPlayerHitbox(state: RunnerState): AABB {
  return {
    x: PLAYER_X,
    y: state.playerY,
    w: PLAYER_WIDTH,
    h: getPlayerHeight(state),
  }
}

// === Collision ===

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function checkObstacleCollision(state: RunnerState): Entity | null {
  const playerBox = getPlayerHitbox(state)
  for (const obs of state.obstacles) {
    const obsBox: AABB = { x: obs.x, y: obs.y, w: obs.width, h: obs.height }
    if (aabbOverlap(playerBox, obsBox)) return obs
  }
  return null
}

// === Spawning ===

export function getRandomObstacleDef(): ObstacleDef {
  // Skip low-pipe if only ground obstacles desired; include all for variety
  const idx = Math.floor(Math.random() * OBSTACLES.length)
  return OBSTACLES[idx]
}

export function spawnObstacle(state: RunnerState, gameW: number): void {
  const def = getRandomObstacleDef()
  const y = GROUND_Y - def.height + def.yOffset
  state.obstacles.push({
    x: gameW + 50,
    y,
    width: def.width,
    height: def.height,
    type: def.id,
    id: `obs_${state.frameCount}`,
  })
  state.nextObstacleX = gameW + 50 + OBSTACLE_MIN_GAP + Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP)

  // Maybe spawn power-up
  if (Math.random() < POWERUP_CHANCE) {
    const puIdx = Math.floor(Math.random() * POWERUPS.length)
    state.powerUpEntities.push({
      x: gameW + 50 + 100 + Math.random() * 100,
      y: GROUND_Y - 80 - Math.random() * 100,
      type: POWERUPS[puIdx].id,
      collected: false,
    })
  }
}

export function spawnPearls(state: RunnerState, gameW: number): void {
  const count = 2 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    state.pearlEntities.push({
      x: gameW + 50 + i * PEARL_GAP,
      y: GROUND_Y - 40 - Math.random() * 120,
      collected: false,
    })
  }
  state.nextPearlX = gameW + 50 + count * PEARL_GAP + Math.random() * 200
}

// === World Update ===

export function updateWorld(state: RunnerState, gameW: number): void {
  // Move obstacles
  for (const obs of state.obstacles) obs.x -= state.speed
  state.obstacles = state.obstacles.filter(o => o.x > -100)

  // Move pearls
  for (const p of state.pearlEntities) p.x -= state.speed
  state.pearlEntities = state.pearlEntities.filter(p => p.x > -50)

  // Move power-ups
  for (const pu of state.powerUpEntities) pu.x -= state.speed
  state.powerUpEntities = state.powerUpEntities.filter(p => p.x > -50)

  // Distance/score
  state.distance += state.speed
  state.score = Math.floor(state.distance / DISTANCE_PER_POINT)
  if (state.doubleScore) state.score *= 2

  // Speed increase
  if (state.speed < MAX_SPEED) {
    state.speed += SPEED_INCREMENT
  }

  // Spawn
  if (state.obstacles.length === 0 || (state.obstacles.length > 0 && state.obstacles[state.obstacles.length - 1].x < state.nextObstacleX)) {
    spawnObstacle(state, gameW)
  }
  if (state.pearlEntities.filter(p => !p.collected).length === 0 || state.pearlEntities.length === 0) {
    spawnPearls(state, gameW)
  }

  state.frameCount++
}

// === Pearl Collection ===

export function collectPearls(state: RunnerState): number {
  const playerBox = getPlayerHitbox(state)
  // Expand hitbox if magnet active
  const magnetActive = state.activePowerUps.some(p => p.type === 'magnet')
  const collectBox = magnetActive
    ? { x: playerBox.x - MAGNET_RADIUS, y: playerBox.y - MAGNET_RADIUS, w: playerBox.w + MAGNET_RADIUS * 2, h: playerBox.h + MAGNET_RADIUS * 2 }
    : playerBox

  let collected = 0
  for (const p of state.pearlEntities) {
    if (p.collected) continue
    const pearlBox: AABB = { x: p.x - PEARL_RADIUS, y: p.y - PEARL_RADIUS, w: PEARL_RADIUS * 2, h: PEARL_RADIUS * 2 }
    if (aabbOverlap(collectBox, pearlBox)) {
      p.collected = true
      collected++
    }
  }
  state.pearls += collected
  return collected
}

// === Power-Up Collection & Management ===

export function collectPowerUps(state: RunnerState, now: number): string | null {
  const playerBox = getPlayerHitbox(state)
  for (const pu of state.powerUpEntities) {
    if (pu.collected) continue
    const puBox: AABB = { x: pu.x - 15, y: pu.y - 15, w: 30, h: 30 }
    if (aabbOverlap(playerBox, puBox)) {
      pu.collected = true
      applyPowerUp(state, pu.type, now)
      return pu.type
    }
  }
  return null
}

export function applyPowerUp(state: RunnerState, type: string, now: number): void {
  if (type === 'shield') {
    state.shieldActive = true
  } else if (type === 'magnet' || type === 'double') {
    const def = POWERUPS.find(p => p.id === type)!
    state.activePowerUps.push({ type, endsAt: now + def.duration })
    if (type === 'double') state.doubleScore = true
  }
}

export function updatePowerUps(state: RunnerState, now: number): void {
  state.activePowerUps = state.activePowerUps.filter(p => {
    if (now >= p.endsAt) {
      if (p.type === 'double') state.doubleScore = false
      return false
    }
    return true
  })
}

// === Hit / Death ===

export function handleHit(state: RunnerState): boolean {
  if (state.shieldActive) {
    state.shieldActive = false
    return false // survived
  }
  state.playerState = 'dead'
  state.gameOver = true
  if (state.score > state.highScore) state.highScore = state.score
  return true
}

// === Speed info ===

export function getSpeedPercent(state: RunnerState): number {
  return Math.min(1, (state.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED))
}

import type { TowerType, EnemyType } from './constants'

// ─── Grid Cell ─────────────────────────────────────────────────────────

export interface GridCell {
  row: number
  col: number
  isPath: boolean
  tower: Tower | null
}

// ─── Tower ─────────────────────────────────────────────────────────────

export interface Tower {
  id: number
  type: TowerType
  level: number // 1-3
  row: number
  col: number
  x: number // pixel position (center of cell)
  y: number
  lastFireTime: number
  target: Enemy | null
}

// ─── Enemy ─────────────────────────────────────────────────────────────

export interface Enemy {
  id: number
  type: EnemyType
  level: number // wave difficulty tier 0-4
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  x: number
  y: number
  pathIndex: number // current waypoint index
  reward: number
  alive: boolean
  flying: boolean
  isBoss: boolean
  slowUntil: number // timestamp when slow expires
  chainHit: boolean // already hit by chain lightning
}

// ─── Projectile ────────────────────────────────────────────────────────

export interface Projectile {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  targetId: number
  towerType: TowerType
  splashRadius: number
  chainCount: number
  slowAmount: number
  slowDuration: number
  color: number
  speed: number
}

// ─── Wave ──────────────────────────────────────────────────────────────

export interface WaveConfig {
  enemies: { type: EnemyType; count: number }[]
  level: number // enemy difficulty tier
  isBoss: boolean
}

// ─── Game State ────────────────────────────────────────────────────────

export interface TDGameState {
  level: number
  wave: number
  lives: number
  coins: number
  score: number
  towers: Tower[]
  enemies: Enemy[]
  projectiles: Projectile[]
  grid: GridCell[][]
  path: { x: number; y: number }[]
  isPaused: boolean
  isGameOver: boolean
  isLevelComplete: boolean
  waveInProgress: boolean
  nextEnemyId: number
  nextTowerId: number
  nextProjectileId: number
  enemiesSpawned: number
  enemiesDefeated: number
}

// ─── Save Data ─────────────────────────────────────────────────────────

export interface TDSaveData {
  highScore: number
  coins: number
  levelsCompleted: number[]
  totalEnemiesDefeated: number
  unlockedTowers: string[]
  achievements: string[]
  themes: string[]
  equippedTheme: string
  lastDailyDate: string
  dailyCompleted: number
  gamesPlayed: number
}

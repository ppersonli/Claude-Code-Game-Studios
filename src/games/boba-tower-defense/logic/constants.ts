// ─── Canvas ────────────────────────────────────────────────────────────
export const GAME_W = 480
export const GAME_H = 854

// ─── Grid ──────────────────────────────────────────────────────────────
export const CELL_SIZE = 48
export const GRID_COLS = 10
export const GRID_ROWS = 16

// ─── Tower ─────────────────────────────────────────────────────────────
export const MAX_TOWER_LEVEL = 3
export const TOWER_PLACE_COST = [0, 50, 0, 0] // cost per level (0 = merge only)
export const MERGE_RANGE = 60 // px — how close towers must be to merge

// Tower stats per level: [level1, level2, level3]
export const TOWER_STATS = {
  classic: {
    name: '經典波波',
    emoji: '🧋',
    damage: [10, 20, 40],
    range: [120, 140, 160],
    fireRate: [1000, 800, 600], // ms between shots
    cost: 100,
    projectileColor: 0x3E2723,
    projectileSpeed: 6,
  },
  taro: {
    name: '芋圓砲台',
    emoji: '🍠',
    damage: [8, 16, 32],
    range: [100, 120, 140],
    fireRate: [1200, 1000, 800],
    splashRadius: [40, 55, 70],
    cost: 200,
    projectileColor: 0x9B59B6,
    projectileSpeed: 5,
  },
  matcha: {
    name: '抹茶狙擊',
    emoji: '🍵',
    damage: [25, 50, 100],
    range: [200, 250, 300],
    fireRate: [2000, 1800, 1500],
    cost: 350,
    projectileColor: 0x66BB6A,
    projectileSpeed: 10,
  },
  fruit: {
    name: '水果減速',
    emoji: '🍓',
    damage: [5, 10, 20],
    range: [130, 150, 170],
    fireRate: [800, 700, 600],
    slowAmount: [0.3, 0.5, 0.7], // fraction of speed reduced
    slowDuration: [2000, 2500, 3000], // ms
    cost: 250,
    projectileColor: 0xFF6B6B,
    projectileSpeed: 7,
  },
  brown_sugar: {
    name: '黑糖連鎖',
    emoji: '🍯',
    damage: [12, 24, 48],
    range: [110, 130, 150],
    fireRate: [1500, 1200, 1000],
    chainCount: [2, 3, 4], // number of enemies hit
    cost: 500,
    projectileColor: 0x4E342E,
    projectileSpeed: 8,
  },
} as const

export type TowerType = keyof typeof TOWER_STATS

// ─── Enemies ───────────────────────────────────────────────────────────
export const ENEMY_STATS = {
  lemon_scout: {
    name: '檸檬偵察兵',
    emoji: '🍋',
    hp: [30, 60, 120, 250, 500],
    speed: [2.5, 2.8, 3.0, 3.2, 3.5],
    reward: [5, 8, 12, 18, 25],
    color: 0xFFD700,
    radius: 12,
  },
  lime_tank: {
    name: '萊姆坦克',
    emoji: '🍈',
    hp: [80, 160, 320, 640, 1280],
    speed: [1.0, 1.1, 1.2, 1.3, 1.4],
    reward: [10, 15, 22, 30, 40],
    color: 0x88CC44,
    radius: 18,
  },
  vinegar_flyer: {
    name: '醋酸飛行者',
    emoji: '🪰',
    hp: [20, 40, 80, 160, 320],
    speed: [3.0, 3.2, 3.5, 3.8, 4.0],
    reward: [8, 12, 18, 25, 35],
    color: 0xAA8833,
    radius: 10,
    flying: true,
  },
  ginger_boss: {
    name: '薑王',
    emoji: '👹',
    hp: [500, 1000, 2000, 4000, 8000],
    speed: [0.8, 0.9, 1.0, 1.1, 1.2],
    reward: [50, 100, 200, 400, 800],
    color: 0xCC6633,
    radius: 24,
    isBoss: true,
  },
  citrus_swarm: {
    name: '柑橘群',
    emoji: '🍊',
    hp: [10, 20, 40, 80, 160],
    speed: [3.5, 3.8, 4.0, 4.2, 4.5],
    reward: [2, 3, 5, 8, 12],
    color: 0xFF8844,
    radius: 8,
    swarmSize: 5,
  },
} as const

export type EnemyType = keyof typeof ENEMY_STATS

// ─── Waves ─────────────────────────────────────────────────────────────
export const WAVES_PER_LEVEL = 10
export const BOSS_WAVE_INTERVAL = 5
export const WAVE_SPAWN_INTERVAL = 800 // ms between enemy spawns in a wave
export const WAVE_DELAY = 5000 // ms between waves
export const STARTING_LIVES = 20
export const STARTING_COINS = 200

// ─── Levels ────────────────────────────────────────────────────────────
export const TOTAL_LEVELS = 5
export const LEVEL_UNLOCK_COST = [0, 0, 0, 0, 0] // unlocked by completing previous

// ─── Path waypoints (S-curve) ──────────────────────────────────────────
export const DEFAULT_PATH: readonly { x: number; y: number }[] = [
  { x: -20, y: 150 },
  { x: 120, y: 150 },
  { x: 120, y: 350 },
  { x: 360, y: 350 },
  { x: 360, y: 550 },
  { x: 120, y: 550 },
  { x: 120, y: 700 },
  { x: 500, y: 700 },
] as const

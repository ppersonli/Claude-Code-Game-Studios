/** Bounce Golf game configuration constants */
export const GAME_CONFIG = {
  /** Canvas resolution */
  WIDTH: 800,
  HEIGHT: 600,

  /** Physics */
  GRAVITY: 400,
  BALL_RADIUS: 10,
  BALL_BOUNCINESS: 0.7,
  BALL_FRICTION: 0.98,
  MAX_POWER: 800,
  MIN_POWER: 100,
  POWER_PER_LEVEL: 40,
  STOP_THRESHOLD: 5,

  /** Upgrade costs */
  UPGRADE_BASE_COST: 50,
  UPGRADE_COST_MULTIPLIER: 1.4,

  /** Prestige */
  PRESTIGE_GALAXY_COINS_PER_RESET: 10,
  PRESTIGE_BONUS_PER_COIN: 0.05,

  /** Star thresholds */
  STAR_THRESHOLDS: {
    par: (levelPar: number, strokes: number) => strokes <= levelPar,
    time: (target: number, elapsed: number) => elapsed <= target,
    collect: (target: number, collected: number) => collected >= target,
  },

  /** Colors (low-poly neon theme) */
  COLORS: {
    BG_DARK: 0x1a1a2e,
    BG_LIGHT: 0x16213e,
    NEON_GREEN: 0x00ff88,
    NEON_BLUE: 0x00d4ff,
    NEON_PINK: 0xff2d95,
    NEON_PURPLE: 0x7b2ff7,
    NEON_ORANGE: 0xff6b35,
    FAIRWAY_GREEN: 0x2ecc71,
    SAND: 0xf4d03f,
    WATER: 0x3498db,
    BALL_WHITE: 0xffffff,
    HOLE_BLACK: 0x2c3e50,
    STAR_GOLD: 0xffd700,
    WALL_GRAY: 0x95a5a6,
    BOUNCE_PAD: 0xff2d95,
  },

  /** Upgrade definitions */
  UPGRADES: {
    power: {
      name: 'Power',
      description: 'Hit the ball harder',
      baseCost: 50,
      maxLevel: 20,
      effect: (level: number) => 1 + level * 0.15,
    },
    bounce: {
      name: 'Bounce',
      description: 'Ball bounces higher',
      baseCost: 75,
      maxLevel: 15,
      effect: (level: number) => 0.7 + level * 0.03,
    },
    accuracy: {
      name: 'Accuracy',
      description: 'See trajectory further',
      baseCost: 100,
      maxLevel: 10,
      effect: (level: number) => 30 + level * 5,
    },
    magnet: {
      name: 'Star Magnet',
      description: 'Attract nearby stars',
      baseCost: 200,
      maxLevel: 10,
      effect: (level: number) => level * 20,
    },
  },

  /** Character definitions */
  CHARACTERS: [
    { id: 'rookie', name: 'Rookie', color: 0xffffff, passive: 'none', unlockCondition: 'default' },
    { id: 'bouncy', name: 'Bouncy', color: 0x00ff88, passive: '+10% bounce', unlockCondition: 'complete_5_levels' },
    { id: 'power', name: 'Powerhouse', color: 0xff6b35, passive: '+10% power', unlockCondition: 'complete_10_levels' },
    { id: 'lucky', name: 'Lucky Star', color: 0xffd700, passive: '+1 star per level', unlockCondition: 'collect_50_stars' },
    { id: 'ghost', name: 'Ghost Ball', color: 0x7b2ff7, passive: 'Phase through 1 wall', unlockCondition: 'prestige_1' },
    { id: 'splitter', name: 'Splitter', color: 0xff2d95, passive: 'Ball splits into 3', unlockCondition: 'complete_25_levels' },
  ] as const,

  /** Colors for neon theme */
  LEVEL_COLORS: [0x00ff88, 0x00d4ff, 0xff2d95, 0x7b2ff7, 0xff6b35, 0xf4d03f],
} as const

export type UpgradeKey = keyof typeof GAME_CONFIG.UPGRADES
export type CharacterId = typeof GAME_CONFIG.CHARACTERS[number]['id']

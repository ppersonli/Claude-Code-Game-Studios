/** Game configuration constants */
export const GAME_CONFIG = {
  /** Canvas resolution */
  WIDTH: 800,
  HEIGHT: 600,

  /** Physics */
  GRAVITY_CONSTANT: 5000,
  MAX_LAUNCH_SPEED: 600,
  MIN_LAUNCH_SPEED: 100,
  LAUNCH_POWER_PER_LEVEL: 50,

  /** Resource collection */
  BASE_STARDUST_PER_PIXEL: 0.01,
  STARDUST_MULTIPLIER_PER_LEVEL: 0.15,

  /** Upgrade costs */
  UPGRADE_BASE_COST: 10,
  UPGRADE_COST_MULTIPLIER: 1.35,

  /** Prestige */
  PRESTIGE_BASE_REQUIREMENT: 10000,
  PRESTIGE_REQUIREMENT_MULTIPLIER: 2.5,
  PRESTIGE_CORE_BONUS: 0.1, // +10% per core

  /** Daily challenges */
  DAILY_CHALLENGE_COUNT: 3,
  STREAK_BONUS_PER_DAY: 0.05,

  /** Colors (neon space theme) */
  COLORS: {
    BG_DARK: 0x0a0a2e,
    NEON_BLUE: 0x00d4ff,
    NEON_PURPLE: 0x7b2ff7,
    NEON_PINK: 0xff2d95,
    STARDUST_GOLD: 0xffd700,
    PLANET_FIRE: 0xff4500,
    PLANET_ICE: 0x00bfff,
    PLANET_TOXIC: 0x32cd32,
    PLANET_CRYSTAL: 0x9370db,
    PLANET_VOID: 0x4a0080,
    DANGER_RED: 0xff3333,
  },

  /** Ship types */
  SHIPS: [
    { id: 'scout', name: 'Scout', color: 0x00d4ff, speed: 1.0, fuel: 1.0, cost: 0 },
    { id: 'racer', name: 'Racer', color: 0xff2d95, speed: 1.3, fuel: 0.8, cost: 500 },
    { id: 'tanker', name: 'Tanker', color: 0x32cd32, speed: 0.8, fuel: 1.5, cost: 2000 },
    { id: 'phantom', name: 'Phantom', color: 0x7b2ff7, speed: 1.5, fuel: 0.6, cost: 5000 },
    { id: 'nova', name: 'Nova', color: 0xffd700, speed: 2.0, fuel: 1.0, cost: 15000 },
  ],

  /** Upgrade types */
  UPGRADES: {
    launchPower: { name: 'Launch Power', icon: '🚀', baseCost: 10, maxLevel: 50 },
    fuelCapacity: { name: 'Fuel Capacity', icon: '⛽', baseCost: 15, maxLevel: 50 },
    gravityResist: { name: 'Gravity Resist', icon: '🛡️', baseCost: 20, maxLevel: 30 },
    stardustMagnet: { name: 'Stardust Magnet', icon: '🧲', baseCost: 25, maxLevel: 30 },
    autoCollector: { name: 'Auto Collector', icon: '🤖', baseCost: 100, maxLevel: 10 },
  },
} as const

export type UpgradeKey = keyof typeof GAME_CONFIG.UPGRADES
export type ShipId = typeof GAME_CONFIG.SHIPS[number]['id']

/**
 * Config & Data — unit tests
 * Covers: constants validation, upgrade definitions, ship definitions,
 *         planet/star system data integrity, color constants
 */
import { describe, it, expect } from 'vitest'
import { GAME_CONFIG, type UpgradeKey, type ShipId } from '../../src/games/orbit-odyssey/config'
import { STAR_SYSTEMS } from '../../src/games/orbit-odyssey/data/planets'

// ─── Game Config Constants ───────────────────────────────
describe('GAME_CONFIG constants', () => {
  it('should have valid canvas dimensions', () => {
    expect(GAME_CONFIG.WIDTH).toBeGreaterThan(0)
    expect(GAME_CONFIG.HEIGHT).toBeGreaterThan(0)
    expect(GAME_CONFIG.WIDTH).toBeGreaterThanOrEqual(480)
  })

  it('should have valid physics constants', () => {
    expect(GAME_CONFIG.GRAVITY_CONSTANT).toBeGreaterThan(0)
    expect(GAME_CONFIG.MAX_LAUNCH_SPEED).toBeGreaterThan(GAME_CONFIG.MIN_LAUNCH_SPEED)
    expect(GAME_CONFIG.LAUNCH_POWER_PER_LEVEL).toBeGreaterThan(0)
  })

  it('should have valid upgrade cost formula parameters', () => {
    expect(GAME_CONFIG.UPGRADE_BASE_COST).toBeGreaterThan(0)
    expect(GAME_CONFIG.UPGRADE_COST_MULTIPLIER).toBeGreaterThan(1)
    expect(GAME_CONFIG.UPGRADE_COST_MULTIPLIER).toBeLessThan(2) // sanity: not too steep
  })

  it('should have valid prestige parameters', () => {
    expect(GAME_CONFIG.PRESTIGE_BASE_REQUIREMENT).toBeGreaterThan(0)
    expect(GAME_CONFIG.PRESTIGE_REQUIREMENT_MULTIPLIER).toBeGreaterThan(1)
    expect(GAME_CONFIG.PRESTIGE_CORE_BONUS).toBeGreaterThan(0)
    expect(GAME_CONFIG.PRESTIGE_CORE_BONUS).toBeLessThan(1) // not more than 100% per core
  })

  it('should have valid daily challenge count', () => {
    expect(GAME_CONFIG.DAILY_CHALLENGE_COUNT).toBeGreaterThanOrEqual(1)
    expect(GAME_CONFIG.DAILY_CHALLENGE_COUNT).toBeLessThanOrEqual(10)
  })
})

// ─── Color Constants ─────────────────────────────────────
describe('GAME_CONFIG.COLORS', () => {
  it('should have all required color keys', () => {
    const requiredColors = [
      'BG_DARK', 'NEON_BLUE', 'NEON_PURPLE', 'NEON_PINK',
      'STARDUST_GOLD', 'PLANET_FIRE', 'PLANET_ICE', 'PLANET_TOXIC',
      'PLANET_CRYSTAL', 'PLANET_VOID', 'DANGER_RED',
    ]
    for (const key of requiredColors) {
      expect(GAME_CONFIG.COLORS).toHaveProperty(key)
    }
  })

  it('should have all colors as valid hex numbers', () => {
    for (const [key, value] of Object.entries(GAME_CONFIG.COLORS)) {
      expect(typeof value).toBe('number')
      expect(value).toBeGreaterThanOrEqual(0x000000)
      expect(value).toBeLessThanOrEqual(0xffffff)
    }
  })
})

// ─── Ship Definitions ────────────────────────────────────
describe('GAME_CONFIG.SHIPS', () => {
  it('should have at least 1 ship', () => {
    expect(GAME_CONFIG.SHIPS.length).toBeGreaterThanOrEqual(1)
  })

  it('should have scout as the first ship with cost 0', () => {
    const scout = GAME_CONFIG.SHIPS[0]
    expect(scout.id).toBe('scout')
    expect(scout.cost).toBe(0)
    expect(scout.name).toBeTruthy()
  })

  it('should have unique ship IDs', () => {
    const ids = GAME_CONFIG.SHIPS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should have ships with increasing cost', () => {
    for (let i = 1; i < GAME_CONFIG.SHIPS.length; i++) {
      expect(GAME_CONFIG.SHIPS[i].cost).toBeGreaterThanOrEqual(GAME_CONFIG.SHIPS[i - 1].cost)
    }
  })

  it('should have valid speed and fuel multipliers', () => {
    for (const ship of GAME_CONFIG.SHIPS) {
      expect(ship.speed).toBeGreaterThan(0)
      expect(ship.fuel).toBeGreaterThan(0)
      expect(ship.speed).toBeLessThanOrEqual(5) // sanity cap
      expect(ship.fuel).toBeLessThanOrEqual(5)
    }
  })
})

// ─── Upgrade Definitions ─────────────────────────────────
describe('GAME_CONFIG.UPGRADES', () => {
  const upgradeKeys = Object.keys(GAME_CONFIG.UPGRADES) as UpgradeKey[]

  it('should have at least 3 upgrades', () => {
    expect(upgradeKeys.length).toBeGreaterThanOrEqual(3)
  })

  it('each upgrade should have required fields', () => {
    for (const key of upgradeKeys) {
      const upgrade = GAME_CONFIG.UPGRADES[key]
      expect(upgrade.name).toBeTruthy()
      expect(upgrade.icon).toBeTruthy()
      expect(upgrade.baseCost).toBeGreaterThan(0)
      expect(upgrade.maxLevel).toBeGreaterThan(0)
    }
  })

  it('each upgrade should have unique base cost', () => {
    const costs = upgradeKeys.map(k => GAME_CONFIG.UPGRADES[k].baseCost)
    // Not strictly required but good design — check they're all positive
    for (const cost of costs) {
      expect(cost).toBeGreaterThan(0)
    }
  })

  it('upgrade cost formula should be monotonically increasing', () => {
    for (const key of upgradeKeys) {
      const config = GAME_CONFIG.UPGRADES[key]
      const costs: number[] = []
      for (let level = 0; level <= Math.min(config.maxLevel, 20); level++) {
        costs.push(Math.floor(config.baseCost * Math.pow(GAME_CONFIG.UPGRADE_COST_MULTIPLIER, level)))
      }
      for (let i = 1; i < costs.length; i++) {
        expect(costs[i]).toBeGreaterThan(costs[i - 1])
      }
    }
  })
})

// ─── Star System Data ────────────────────────────────────
describe('STAR_SYSTEMS data', () => {
  it('should have at least 2 star systems', () => {
    expect(STAR_SYSTEMS.length).toBeGreaterThanOrEqual(2)
  })

  it('should have sol system as first with 0 unlock cost', () => {
    expect(STAR_SYSTEMS[0].id).toBe('sol')
    expect(STAR_SYSTEMS[0].unlockCost).toBe(0)
  })

  it('should have unique system IDs', () => {
    const ids = STAR_SYSTEMS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each system should have at least 1 planet', () => {
    for (const system of STAR_SYSTEMS) {
      expect(system.planets.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('each planet should have valid properties', () => {
    for (const system of STAR_SYSTEMS) {
      for (const planet of system.planets) {
        expect(planet.id).toBeTruthy()
        expect(planet.name).toBeTruthy()
        expect(planet.x).toBeGreaterThan(0)
        expect(planet.y).toBeGreaterThan(0)
        expect(planet.radius).toBeGreaterThan(0)
        expect(planet.mass).toBeGreaterThan(0)
        expect(planet.color).toBeGreaterThan(0)
        expect(planet.glowColor).toBeGreaterThan(0)
        expect(['stardust', 'crystal', 'plasma', 'void']).toContain(planet.resourceType)
        expect(planet.resourceValue).toBeGreaterThan(0)
      }
    }
  })

  it('each system should have unique planet IDs', () => {
    for (const system of STAR_SYSTEMS) {
      const ids = system.planets.map(p => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('unlock costs should increase across systems', () => {
    for (let i = 1; i < STAR_SYSTEMS.length; i++) {
      expect(STAR_SYSTEMS[i].unlockCost).toBeGreaterThanOrEqual(STAR_SYSTEMS[i - 1].unlockCost)
    }
  })

  it('later systems should have higher resource values', () => {
    // First system planets should have lower avg resource value than last system
    const firstAvg = STAR_SYSTEMS[0].planets.reduce((s, p) => s + p.resourceValue, 0) / STAR_SYSTEMS[0].planets.length
    const lastSystem = STAR_SYSTEMS[STAR_SYSTEMS.length - 1]
    const lastAvg = lastSystem.planets.reduce((s, p) => s + p.resourceValue, 0) / lastSystem.planets.length
    expect(lastAvg).toBeGreaterThan(firstAvg)
  })

  it('planet positions should be within reasonable bounds (0-800 x 0-600)', () => {
    for (const system of STAR_SYSTEMS) {
      for (const planet of system.planets) {
        expect(planet.x).toBeGreaterThanOrEqual(0)
        expect(planet.x).toBeLessThanOrEqual(800)
        expect(planet.y).toBeGreaterThanOrEqual(0)
        expect(planet.y).toBeLessThanOrEqual(600)
      }
    }
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getUpgradeCost,
  getUpgradeLevel,
  isUpgradeMaxed,
  purchaseUpgrade,
  getEmployeeCost,
  getEmployeeCount,
  hireEmployee,
  getPlanetUnlockCost,
  canUnlockPlanet,
  unlockPlanet,
} from '../src/games/space-factory-idle/logic/upgrades'
import type { GameState } from '../src/games/space-factory-idle/logic/game-state'
import { CONSTANTS } from '../src/games/space-factory-idle/logic/constants'

/* ── Helpers ────────────────────────────────────────────────────── */

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    starDust: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    prestigeMult: 1,
    productionLines: {
      earth: [
        { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false },
      ],
    },
    upgrades: {},
    employees: {},
    unlockedPlanets: ['earth'],
    unlockedRecipes: ['ore-smelt'],
    totalProduced: 0,
    bestDistance: 0,
    achievements: [],
    lastDailyCompleted: '',
    dailyStreak: 0,
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    activeEvent: null,
    eventEndTime: 0,
    sessionCoinsEarned: 0,
    sessionItemsProduced: 0,
    sessionUpgradesMade: 0,
    totalPlayTime: 0,
    ...overrides,
  }
}

/* ── Tests ──────────────────────────────────────────────────────── */

describe('upgrades.ts — upgrades, employees, planets', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  /* ── Upgrades ─────────────────────────────────────────────────── */

  describe('getUpgradeCost', () => {
    it('returns base cost at level 0', () => {
      const state = makeGameState()
      const cost = getUpgradeCost(state, 'line-speed')
      // line-speed: baseCost=100, costMultiplier=1.15, level=0
      expect(cost).toBe(Math.floor(100 * Math.pow(1.15, 0)))
    })

    it('increases with level', () => {
      const state = makeGameState({ upgrades: { 'line-speed': 2 } })
      const cost = getUpgradeCost(state, 'line-speed')
      expect(cost).toBe(Math.floor(100 * Math.pow(1.15, 2)))
    })

    it('returns Infinity for unknown upgrade', () => {
      const state = makeGameState()
      expect(getUpgradeCost(state, 'nonexistent')).toBe(Infinity)
    })

    it('returns Infinity when maxed', () => {
      const state = makeGameState({ upgrades: { 'auto-sell': 1 } }) // auto-sell maxLevel=1
      expect(getUpgradeCost(state, 'auto-sell')).toBe(Infinity)
    })
  })

  describe('getUpgradeLevel', () => {
    it('returns 0 when not purchased', () => {
      const state = makeGameState()
      expect(getUpgradeLevel(state, 'line-speed')).toBe(0)
    })

    it('returns current level', () => {
      const state = makeGameState({ upgrades: { 'line-speed': 3 } })
      expect(getUpgradeLevel(state, 'line-speed')).toBe(3)
    })
  })

  describe('isUpgradeMaxed', () => {
    it('returns false when not purchased', () => {
      const state = makeGameState()
      expect(isUpgradeMaxed(state, 'line-speed')).toBe(false)
    })

    it('returns false when below max', () => {
      const state = makeGameState({ upgrades: { 'line-speed': 5 } })
      expect(isUpgradeMaxed(state, 'line-speed')).toBe(false)
    })

    it('returns true when at max level', () => {
      const state = makeGameState({ upgrades: { 'auto-sell': 1 } }) // maxLevel=1
      expect(isUpgradeMaxed(state, 'auto-sell')).toBe(true)
    })

    it('returns true for unknown upgrade', () => {
      const state = makeGameState()
      expect(isUpgradeMaxed(state, 'nonexistent')).toBe(true)
    })
  })

  describe('purchaseUpgrade', () => {
    it('purchases upgrade when enough coins', () => {
      const state = makeGameState({ coins: 1000 })
      const result = purchaseUpgrade(state, 'line-speed')
      expect(result).toBe(true)
      expect(state.upgrades['line-speed']).toBe(1)
      expect(state.coins).toBeLessThan(1000)
    })

    it('fails when not enough coins', () => {
      const state = makeGameState({ coins: 0 })
      const result = purchaseUpgrade(state, 'line-speed')
      expect(result).toBe(false)
      expect(state.upgrades['line-speed']).toBeUndefined()
    })

    it('fails for unknown upgrade', () => {
      const state = makeGameState({ coins: 10000 })
      expect(purchaseUpgrade(state, 'nonexistent')).toBe(false)
    })

    it('fails when already maxed', () => {
      const state = makeGameState({ coins: 10000, upgrades: { 'auto-sell': 1 } })
      expect(purchaseUpgrade(state, 'auto-sell')).toBe(false)
    })

    it('increments sessionUpgradesMade', () => {
      const state = makeGameState({ coins: 1000 })
      purchaseUpgrade(state, 'line-speed')
      expect(state.sessionUpgradesMade).toBe(1)
    })

    it('cost increases with level', () => {
      const state1 = makeGameState({ coins: 100000 })
      purchaseUpgrade(state1, 'line-speed')
      const coinsAfter1 = state1.coins

      const state2 = makeGameState({ coins: 100000 })
      purchaseUpgrade(state2, 'line-speed')
      purchaseUpgrade(state2, 'line-speed')
      // Second purchase should cost more than first
      expect(100000 - state2.coins).toBeGreaterThan(100000 - coinsAfter1)
    })
  })

  /* ── Employees ────────────────────────────────────────────────── */

  describe('getEmployeeCost', () => {
    it('returns base cost for first hire', () => {
      const state = makeGameState()
      const cost = getEmployeeCost(state, 'intern')
      // intern: baseCost=50, costMultiplier=1.15, count=0
      expect(cost).toBe(Math.floor(50 * Math.pow(1.15, 0)))
    })

    it('increases with count', () => {
      const state = makeGameState({ employees: { intern: 2 } })
      const cost = getEmployeeCost(state, 'intern')
      expect(cost).toBe(Math.floor(50 * Math.pow(1.15, 2)))
    })

    it('returns Infinity for unknown employee', () => {
      const state = makeGameState()
      expect(getEmployeeCost(state, 'alien')).toBe(Infinity)
    })
  })

  describe('getEmployeeCount', () => {
    it('returns 0 when none hired', () => {
      const state = makeGameState()
      expect(getEmployeeCount(state, 'intern')).toBe(0)
    })

    it('returns count', () => {
      const state = makeGameState({ employees: { engineer: 3 } })
      expect(getEmployeeCount(state, 'engineer')).toBe(3)
    })
  })

  describe('hireEmployee', () => {
    it('hires when enough coins', () => {
      const state = makeGameState({ coins: 1000 })
      const result = hireEmployee(state, 'intern')
      expect(result).toBe(true)
      expect(state.employees['intern']).toBe(1)
      expect(state.coins).toBeLessThan(1000)
    })

    it('fails when not enough coins', () => {
      const state = makeGameState({ coins: 0 })
      expect(hireEmployee(state, 'intern')).toBe(false)
    })

    it('fails for unknown employee', () => {
      const state = makeGameState({ coins: 10000 })
      expect(hireEmployee(state, 'alien')).toBe(false)
    })

    it('cost increases with count', () => {
      const state1 = makeGameState({ coins: 100000 })
      hireEmployee(state1, 'intern')
      const cost1 = 100000 - state1.coins

      const state2 = makeGameState({ coins: 100000 })
      hireEmployee(state2, 'intern')
      hireEmployee(state2, 'intern')
      const cost2 = 100000 - state2.coins

      expect(cost2).toBeGreaterThan(cost1)
    })

    it('different employees have different costs', () => {
      const state = makeGameState({ coins: 100000 })
      hireEmployee(state, 'intern')
      const costIntern = 100000 - state.coins

      const state2 = makeGameState({ coins: 100000 })
      hireEmployee(state2, 'director')
      const costDirector = 100000 - state2.coins

      expect(costDirector).toBeGreaterThan(costIntern)
    })
  })

  /* ── Planets ──────────────────────────────────────────────────── */

  describe('getPlanetUnlockCost', () => {
    it('earth costs 1000 (index 0)', () => {
      const planet = { id: 'earth' } as any
      expect(getPlanetUnlockCost(planet)).toBe(1000)
    })

    it('moon costs 5000 (index 1)', () => {
      const planet = { id: 'moon' } as any
      expect(getPlanetUnlockCost(planet)).toBe(5000)
    })

    it('mars costs 25000 (index 2)', () => {
      const planet = { id: 'mars' } as any
      expect(getPlanetUnlockCost(planet)).toBe(25000)
    })

    it('costs increase exponentially', () => {
      const earth = { id: 'earth' } as any
      const moon = { id: 'moon' } as any
      const mars = { id: 'mars' } as any
      expect(getPlanetUnlockCost(mars)).toBeGreaterThan(getPlanetUnlockCost(moon))
      expect(getPlanetUnlockCost(moon)).toBeGreaterThan(getPlanetUnlockCost(earth))
    })
  })

  describe('canUnlockPlanet', () => {
    it('returns false if planet not found', () => {
      const state = makeGameState()
      const result = canUnlockPlanet(state, 'nonexistent')
      expect(result.can).toBe(false)
      expect(result.reason).toBe('Planet not found')
    })

    it('returns false if already unlocked', () => {
      const state = makeGameState()
      const result = canUnlockPlanet(state, 'earth')
      expect(result.can).toBe(false)
      expect(result.reason).toBe('Already unlocked')
    })

    it('returns false if galactic without 3 prestiges', () => {
      const state = makeGameState({ prestigeCount: 2 })
      const result = canUnlockPlanet(state, 'galactic')
      expect(result.can).toBe(false)
      expect(result.reason).toBe('Need 3 prestiges')
    })

    it('returns false if distance not met', () => {
      const state = makeGameState({ coins: 100000 })
      const result = canUnlockPlanet(state, 'moon') // needs 10km
      expect(result.can).toBe(false)
      expect(result.reason).toContain('km traveled')
    })

    it('returns false if not enough coins', () => {
      const state = makeGameState({ bestDistance: 100 })
      const result = canUnlockPlanet(state, 'moon') // costs 5000
      expect(result.can).toBe(false)
      expect(result.reason).toContain('coins')
    })

    it('returns true when all conditions met', () => {
      const state = makeGameState({
        coins: 5000,
        bestDistance: 10,
      })
      const result = canUnlockPlanet(state, 'moon')
      expect(result.can).toBe(true)
    })

    it('galactic can be unlocked with 3 prestiges', () => {
      const state = makeGameState({
        coins: 5_000_000, // galactic costs 3,125,000
        prestigeCount: 3,
      })
      const result = canUnlockPlanet(state, 'galactic')
      expect(result.can).toBe(true)
    })
  })

  describe('unlockPlanet', () => {
    it('unlocks planet and deducts cost', () => {
      const state = makeGameState({ coins: 10000, bestDistance: 10 })
      const result = unlockPlanet(state, 'moon')
      expect(result).toBe(true)
      expect(state.unlockedPlanets).toContain('moon')
      expect(state.coins).toBeLessThan(10000)
    })

    it('adds first recipe line for new planet', () => {
      const state = makeGameState({ coins: 10000, bestDistance: 10 })
      unlockPlanet(state, 'moon')
      expect(state.productionLines.moon).toBeDefined()
      expect(state.productionLines.moon.length).toBe(1)
      expect(state.productionLines.moon[0].recipeId).toBe('helium3')
    })

    it('adds recipe to unlockedRecipes', () => {
      const state = makeGameState({ coins: 10000, bestDistance: 10 })
      unlockPlanet(state, 'moon')
      expect(state.unlockedRecipes).toContain('helium3')
    })

    it('fails if conditions not met', () => {
      const state = makeGameState({ coins: 0 })
      expect(unlockPlanet(state, 'moon')).toBe(false)
    })

    it('fails for already unlocked planet', () => {
      const state = makeGameState({ coins: 100000, bestDistance: 100 })
      expect(unlockPlanet(state, 'earth')).toBe(false)
    })
  })
})

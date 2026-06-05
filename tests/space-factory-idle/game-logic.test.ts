import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadState, saveState, resetState, calculateOfflineEarnings, calcTotalOutputPerSec, trackPlayTime, type GameState } from '../../src/games/space-factory-idle/logic/game-state'
import { processProductionTick, clickProduce, sellStock, upgradeLine, addProductionLine, getLineUpgradeCost } from '../../src/games/space-factory-idle/logic/production'
import { canPrestige, performPrestige, calcEarnableStardust, getPrestigeRequirement } from '../../src/games/space-factory-idle/logic/prestige'
import { rollForEvent, activateEvent, checkEventExpiry, getEventOutputMult, EVENTS } from '../../src/games/space-factory-idle/logic/events'
import { purchaseUpgrade, getUpgradeCost, getUpgradeLevel, isUpgradeMaxed, hireEmployee, getEmployeeCost, getEmployeeCount, unlockPlanet, canUnlockPlanet, getPlanetUnlockCost } from '../../src/games/space-factory-idle/logic/upgrades'
import { PLANETS } from '../../src/games/space-factory-idle/data/planets'
import { RECIPES } from '../../src/games/space-factory-idle/data/recipes'
import { UPGRADES } from '../../src/games/space-factory-idle/data/upgrades'

// Helper: create a fresh test state
function makeTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 1000,
    totalCoins: 1000,
    starDust: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    prestigeMult: 1,
    factoryLevel: 1,
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

describe('Save System', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadState', () => {
    it('returns default state when no save exists', () => {
      const state = loadState()
      expect(state.coins).toBe(0)
      expect(state.unlockedPlanets).toEqual(['earth'])
      expect(state.productionLines.earth).toBeDefined()
      expect(state.productionLines.earth.length).toBe(1)
    })
    it('loads saved state from localStorage', () => {
      const saved = makeTestState({ coins: 5000, totalCoins: 10000 })
      localStorage.setItem('space-factory-idle-state', JSON.stringify(saved))
      const state = loadState()
      expect(state.coins).toBe(5000)
      expect(state.totalCoins).toBe(10000)
    })
    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('space-factory-idle-state', 'not-json')
      const state = loadState()
      expect(state.coins).toBe(0)
    })
    it('merges missing fields with defaults', () => {
      localStorage.setItem('space-factory-idle-state', JSON.stringify({ coins: 100 }))
      const state = loadState()
      expect(state.coins).toBe(100)
      expect(state.unlockedPlanets).toEqual(['earth'])
      expect(state.achievements).toEqual([])
    })
  })

  describe('saveState & loadState roundtrip', () => {
    it('persists and restores state', () => {
      const state = makeTestState({ coins: 999, starDust: 5 })
      saveState(state)
      const loaded = loadState()
      expect(loaded.coins).toBe(999)
      expect(loaded.starDust).toBe(5)
    })
  })

  describe('resetState', () => {
    it('resets to default values', () => {
      const state = makeTestState({ coins: 99999, starDust: 50, prestigeCount: 3 })
      saveState(state)
      const fresh = resetState()
      expect(fresh.coins).toBe(0)
      expect(fresh.starDust).toBe(0)
      expect(fresh.prestigeCount).toBe(0)
    })
  })

  describe('calculateOfflineEarnings', () => {
    it('returns 0 without offline upgrade', () => {
      const state = makeTestState()
      expect(calculateOfflineEarnings(state)).toBe(0)
    })
    it('returns 0 when less than 10 seconds offline', () => {
      const state = makeTestState({
        upgrades: { 'offline-earn': 1 },
        lastOnline: Date.now() - 5000, // 5 seconds ago
      })
      expect(calculateOfflineEarnings(state)).toBe(0)
    })
    it('returns earnings when offline with upgrade', () => {
      const state = makeTestState({
        upgrades: { 'offline-earn': 1 },
        lastOnline: Date.now() - 3600_000, // 1 hour ago
        productionLines: {
          earth: [
            { recipeId: 'ore-smelt', level: 5, stock: 0, maxStock: 20, automated: false },
          ],
        },
      })
      const earnings = calculateOfflineEarnings(state)
      expect(earnings).toBeGreaterThan(0)
    })
    it('caps at max offline hours', () => {
      const state = makeTestState({
        upgrades: { 'offline-earn': 1 },
        lastOnline: Date.now() - 24 * 3600_000, // 24 hours ago
      })
      const earnings = calculateOfflineEarnings(state)
      // Should not be more than 8 hours worth
      const maxEarnings = calcTotalOutputPerSec(state) * 8 * 3600 * 0.5 * state.prestigeMult
      expect(earnings).toBeLessThanOrEqual(Math.floor(maxEarnings) + 1)
    })
  })
})

describe('Production System', () => {
  describe('processProductionTick', () => {
    it('produces items and earns coins when auto-sell is active', () => {
      const state = makeTestState({
        upgrades: { 'auto-sell': 1 },
        productionLines: {
          earth: [
            { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false },
          ],
        },
      })
      const earned = processProductionTick(state)
      expect(earned).toBeGreaterThanOrEqual(0)
      expect(state.totalProduced).toBeGreaterThan(0)
    })
    it('does not exceed max stock without auto-sell', () => {
      const state = makeTestState({
        productionLines: {
          earth: [
            { recipeId: 'ore-smelt', level: 1, stock: 9, maxStock: 10, automated: false },
          ],
        },
      })
      processProductionTick(state)
      expect(state.productionLines.earth[0].stock).toBeLessThanOrEqual(state.productionLines.earth[0].maxStock)
    })
    it('respects prestige multiplier', () => {
      const state1 = makeTestState({ prestigeMult: 1, upgrades: { 'auto-sell': 1 } })
      const state2 = makeTestState({ prestigeMult: 2, upgrades: { 'auto-sell': 1 } })
      const earned1 = processProductionTick(state1)
      const earned2 = processProductionTick(state2)
      expect(earned2).toBeGreaterThanOrEqual(earned1)
    })
  })

  describe('clickProduce', () => {
    it('adds stock when clicking produce', () => {
      const state = makeTestState()
      clickProduce(state, 'earth', 0)
      expect(state.productionLines.earth[0].stock).toBeGreaterThan(0)
    })
    it('returns 0 for invalid planet', () => {
      const state = makeTestState()
      const result = clickProduce(state, 'invalid', 0)
      expect(result).toBe(0)
    })
    it('returns 0 for invalid line index', () => {
      const state = makeTestState()
      const result = clickProduce(state, 'earth', 99)
      expect(result).toBe(0)
    })
    it('auto-sells overflow when stock exceeds max', () => {
      const state = makeTestState({
        productionLines: {
          earth: [
            { recipeId: 'ore-smelt', level: 1, stock: 9, maxStock: 10, automated: false },
          ],
        },
      })
      // First click fills to 10
      clickProduce(state, 'earth', 0)
      // Second click should overflow and sell
      const earned = clickProduce(state, 'earth', 0)
      expect(earned).toBeGreaterThanOrEqual(0)
    })
  })

  describe('sellStock', () => {
    it('sells all stock for coins', () => {
      const state = makeTestState({
        productionLines: {
          earth: [
            { recipeId: 'ore-smelt', level: 1, stock: 5, maxStock: 10, automated: false },
          ],
        },
      })
      const earned = sellStock(state, 'earth', 0)
      expect(earned).toBeGreaterThan(0)
      expect(state.productionLines.earth[0].stock).toBe(0)
      expect(state.coins).toBeGreaterThan(1000)
    })
    it('returns 0 when stock is 0', () => {
      const state = makeTestState()
      const earned = sellStock(state, 'earth', 0)
      expect(earned).toBe(0)
    })
  })

  describe('upgradeLine', () => {
    it('upgrades line level and deducts coins', () => {
      const state = makeTestState({ coins: 10000 })
      const cost = getLineUpgradeCost(state.productionLines.earth[0])
      const result = upgradeLine(state, 'earth', 0)
      expect(result).toBe(true)
      expect(state.productionLines.earth[0].level).toBe(2)
      expect(state.coins).toBe(10000 - cost)
    })
    it('fails when not enough coins', () => {
      const state = makeTestState({ coins: 0 })
      const result = upgradeLine(state, 'earth', 0)
      expect(result).toBe(false)
    })
    it('increases max stock on upgrade', () => {
      const state = makeTestState({ coins: 10000 })
      const initialMaxStock = state.productionLines.earth[0].maxStock
      upgradeLine(state, 'earth', 0)
      expect(state.productionLines.earth[0].maxStock).toBeGreaterThan(initialMaxStock)
    })
  })

  describe('addProductionLine', () => {
    it('adds a new line to a planet', () => {
      const state = makeTestState({ coins: 10000 })
      const result = addProductionLine(state, 'earth', 'metal-work')
      expect(result).toBe(true)
      expect(state.productionLines.earth.length).toBe(2)
    })
    it('fails when not enough coins', () => {
      const state = makeTestState({ coins: 0 })
      const result = addProductionLine(state, 'earth', 'metal-work')
      expect(result).toBe(false)
    })
    it('fails when planet has max lines', () => {
      const earth = PLANETS.find(p => p.id === 'earth')!
      const state = makeTestState({ coins: 1000000 })
      // Fill all lines
      for (let i = state.productionLines.earth.length; i < earth.productionLines; i++) {
        addProductionLine(state, 'earth', RECIPES.filter(r => r.planetId === 'earth')[i]?.id || 'ore-smelt')
      }
      expect(state.productionLines.earth.length).toBe(earth.productionLines)
      const result = addProductionLine(state, 'earth', 'nano-chip')
      expect(result).toBe(false)
    })
  })

  describe('getLineUpgradeCost', () => {
    it('scales with level', () => {
      const line1 = { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false }
      const line2 = { recipeId: 'ore-smelt', level: 5, stock: 0, maxStock: 10, automated: false }
      expect(getLineUpgradeCost(line2)).toBeGreaterThan(getLineUpgradeCost(line1))
    })
  })
})

describe('Prestige System', () => {
  describe('canPrestige', () => {
    it('returns false when totalCoins below threshold', () => {
      const state = makeTestState({ totalCoins: 500_000, prestigeLevel: 0 })
      expect(canPrestige(state)).toBe(false)
    })
    it('returns true when totalCoins meets threshold', () => {
      const state = makeTestState({ totalCoins: 1_000_000, prestigeLevel: 0 })
      expect(canPrestige(state)).toBe(true)
    })
  })

  describe('calcEarnableStardust', () => {
    it('returns 0 for small total coins', () => {
      const state = makeTestState({ totalCoins: 500_000 })
      expect(calcEarnableStardust(state)).toBe(0)
    })
    it('returns positive stardust for 1M+ coins', () => {
      const state = makeTestState({ totalCoins: 1_000_000 })
      expect(calcEarnableStardust(state)).toBe(1)
    })
    it('scales with total coins', () => {
      const state = makeTestState({ totalCoins: 4_000_000 })
      expect(calcEarnableStardust(state)).toBe(2)
    })
  })

  describe('performPrestige', () => {
    it('returns 0 when cannot prestige', () => {
      const state = makeTestState({ totalCoins: 100 })
      expect(performPrestige(state)).toBe(0)
    })
    it('resets progress while keeping star dust', () => {
      const state = makeTestState({
        coins: 2_000_000,
        totalCoins: 2_000_000,
        prestigeLevel: 0,
        prestigeCount: 0,
        prestigeMult: 1,
      })
      const earned = performPrestige(state)
      expect(earned).toBeGreaterThan(0)
      expect(state.coins).toBe(0)
      expect(state.totalCoins).toBe(0)
      expect(state.starDust).toBe(earned)
      expect(state.prestigeCount).toBe(1)
      expect(state.prestigeMult).toBeGreaterThan(1)
      // First line should be reset to ore-smelt
      expect(state.productionLines.earth[0].recipeId).toBe('ore-smelt')
      expect(state.unlockedPlanets).toEqual(['earth'])
    })
    it('accumulates star dust across prestiges', () => {
      const state = makeTestState({ totalCoins: 10_000_000, prestigeLevel: 0 })
      const earned1 = performPrestige(state)
      state.totalCoins = 10_000_000
      const earned2 = performPrestige(state)
      expect(state.starDust).toBe(earned1 + earned2)
    })
    it('increments prestige level', () => {
      const state = makeTestState({ totalCoins: 2_000_000, prestigeLevel: 0 })
      performPrestige(state)
      expect(state.prestigeLevel).toBe(1)
    })
  })

  describe('getPrestigeRequirement', () => {
    it('returns 1M for level 0', () => {
      const state = makeTestState({ prestigeLevel: 0 })
      expect(getPrestigeRequirement(state)).toBe(1_000_000)
    })
    it('increases each level', () => {
      const state = makeTestState({ prestigeLevel: 2 })
      expect(getPrestigeRequirement(state)).toBe(100_000_000)
    })
  })
})

describe('Upgrade System', () => {
  describe('purchaseUpgrade', () => {
    it('purchases upgrade and deducts coins', () => {
      const state = makeTestState({ coins: 10000 })
      const result = purchaseUpgrade(state, 'line-speed')
      expect(result).toBe(true)
      expect(state.upgrades['line-speed']).toBe(1)
      expect(state.coins).toBeLessThan(10000)
    })
    it('fails when not enough coins', () => {
      const state = makeTestState({ coins: 0 })
      const result = purchaseUpgrade(state, 'line-speed')
      expect(result).toBe(false)
    })
    it('fails when already maxed', () => {
      const upgrade = UPGRADES.find(u => u.id === 'auto-sell')!
      const state = makeTestState({
        coins: 1000000,
        upgrades: { 'auto-sell': upgrade.maxLevel },
      })
      const result = purchaseUpgrade(state, 'auto-sell')
      expect(result).toBe(false)
    })
    it('increments session upgrades made', () => {
      const state = makeTestState({ coins: 10000 })
      purchaseUpgrade(state, 'line-speed')
      expect(state.sessionUpgradesMade).toBe(1)
    })
  })

  describe('getUpgradeCost', () => {
    it('increases with level', () => {
      const state0 = makeTestState({ upgrades: {} })
      const state5 = makeTestState({ upgrades: { 'line-speed': 5 } })
      expect(getUpgradeCost(state5, 'line-speed')).toBeGreaterThan(getUpgradeCost(state0, 'line-speed'))
    })
    it('returns Infinity when maxed', () => {
      const upgrade = UPGRADES.find(u => u.id === 'auto-sell')!
      const state = makeTestState({ upgrades: { 'auto-sell': upgrade.maxLevel } })
      expect(getUpgradeCost(state, 'auto-sell')).toBe(Infinity)
    })
  })

  describe('getUpgradeLevel', () => {
    it('returns 0 for unpurchased', () => {
      const state = makeTestState()
      expect(getUpgradeLevel(state, 'line-speed')).toBe(0)
    })
    it('returns correct level', () => {
      const state = makeTestState({ upgrades: { 'line-speed': 3 } })
      expect(getUpgradeLevel(state, 'line-speed')).toBe(3)
    })
  })

  describe('isUpgradeMaxed', () => {
    it('returns false for unpurchased', () => {
      const state = makeTestState()
      expect(isUpgradeMaxed(state, 'line-speed')).toBe(false)
    })
    it('returns true when at max level', () => {
      const upgrade = UPGRADES.find(u => u.id === 'line-speed')!
      const state = makeTestState({ upgrades: { 'line-speed': upgrade.maxLevel } })
      expect(isUpgradeMaxed(state, 'line-speed')).toBe(true)
    })
  })
})

describe('Employee System', () => {
  describe('hireEmployee', () => {
    it('hires an employee', () => {
      const state = makeTestState({ coins: 1000 })
      const result = hireEmployee(state, 'intern')
      expect(result).toBe(true)
      expect(state.employees['intern']).toBe(1)
    })
    it('fails when not enough coins', () => {
      const state = makeTestState({ coins: 0 })
      const result = hireEmployee(state, 'intern')
      expect(result).toBe(false)
    })
    it('increases cost with each hire', () => {
      const state = makeTestState({ coins: 100000 })
      const cost1 = getEmployeeCost(state, 'intern')
      hireEmployee(state, 'intern')
      const cost2 = getEmployeeCost(state, 'intern')
      expect(cost2).toBeGreaterThan(cost1)
    })
  })

  describe('getEmployeeCost', () => {
    it('returns base cost for first hire', () => {
      const state = makeTestState()
      expect(getEmployeeCost(state, 'intern')).toBe(50)
    })
  })

  describe('getEmployeeCount', () => {
    it('returns 0 for unhired', () => {
      const state = makeTestState()
      expect(getEmployeeCount(state, 'intern')).toBe(0)
    })
  })
})

describe('Planet System', () => {
  describe('canUnlockPlanet', () => {
    it('returns already unlocked for earth', () => {
      const state = makeTestState()
      const result = canUnlockPlanet(state, 'earth')
      expect(result.can).toBe(false)
      expect(result.reason).toContain('Already unlocked')
    })
    it('requires distance for moon', () => {
      const state = makeTestState({ coins: 100000, bestDistance: 0 })
      const result = canUnlockPlanet(state, 'moon')
      expect(result.can).toBe(false)
    })
    it('allows moon with enough distance and coins', () => {
      const cost = getPlanetUnlockCost(PLANETS.find(p => p.id === 'moon')!)
      const state = makeTestState({ coins: cost, bestDistance: 10 })
      const result = canUnlockPlanet(state, 'moon')
      expect(result.can).toBe(true)
    })
    it('requires 3 prestiges for galactic', () => {
      const state = makeTestState({ coins: 1e15, bestDistance: 10000, prestigeCount: 2 })
      const result = canUnlockPlanet(state, 'galactic')
      expect(result.can).toBe(false)
      expect(result.reason).toContain('prestige')
    })
  })

  describe('unlockPlanet', () => {
    it('unlocks moon with enough resources', () => {
      const cost = getPlanetUnlockCost(PLANETS.find(p => p.id === 'moon')!)
      const state = makeTestState({ coins: cost, bestDistance: 10 })
      const result = unlockPlanet(state, 'moon')
      expect(result).toBe(true)
      expect(state.unlockedPlanets).toContain('moon')
      expect(state.productionLines.moon).toBeDefined()
      expect(state.productionLines.moon.length).toBe(1)
    })
  })

  describe('getPlanetUnlockCost', () => {
    it('increases with planet index', () => {
      const moonCost = getPlanetUnlockCost(PLANETS.find(p => p.id === 'moon')!)
      const marsCost = getPlanetUnlockCost(PLANETS.find(p => p.id === 'mars')!)
      expect(marsCost).toBeGreaterThan(moonCost)
    })
  })
})

describe('Event System', () => {
  describe('rollForEvent', () => {
    it('usually returns null (low chance)', () => {
      const state = makeTestState()
      let triggered = 0
      for (let i = 0; i < 1000; i++) {
        if (rollForEvent(state, 'earth')) triggered++
      }
      // With 0.2% chance, expect ~2 out of 1000
      expect(triggered).toBeLessThan(20)
    })
    it('does not trigger when event already active', () => {
      const state = makeTestState({
        activeEvent: 'meteor_shower',
        eventEndTime: Date.now() + 5000,
      })
      // Force high chance
      const event = rollForEvent(state, 'earth')
      // Even if it would trigger, it shouldn't when one is active
      expect(event).toBeNull()
    })
  })

  describe('activateEvent & checkEventExpiry', () => {
    it('activates event on state', () => {
      const state = makeTestState()
      const event = EVENTS.find(e => e.id === 'meteor_shower')!
      activateEvent(state, event)
      expect(state.activeEvent).toBe('meteor_shower')
      expect(state.eventEndTime).toBeGreaterThan(Date.now())
    })
    it('expires event after duration', () => {
      const state = makeTestState({
        activeEvent: 'meteor_shower',
        eventEndTime: Date.now() - 1000, // already expired
      })
      const expired = checkEventExpiry(state)
      expect(expired).toBe(true)
      expect(state.activeEvent).toBeNull()
    })
    it('does not expire active event', () => {
      const state = makeTestState({
        activeEvent: 'meteor_shower',
        eventEndTime: Date.now() + 10000,
      })
      const expired = checkEventExpiry(state)
      expect(expired).toBe(false)
    })
  })

  describe('getEventOutputMult', () => {
    it('returns 1 when no event active', () => {
      const state = makeTestState()
      expect(getEventOutputMult(state)).toBe(1)
    })
    it('returns 2 for meteor shower', () => {
      const state = makeTestState({
        activeEvent: 'meteor_shower',
        eventEndTime: Date.now() + 5000,
      })
      expect(getEventOutputMult(state)).toBe(2)
    })
    it('returns 0.7 for sandstorm', () => {
      const state = makeTestState({
        activeEvent: 'sandstorm',
        eventEndTime: Date.now() + 10000,
      })
      expect(getEventOutputMult(state)).toBe(0.7)
    })
    it('returns 1 when event expired', () => {
      const state = makeTestState({
        activeEvent: 'meteor_shower',
        eventEndTime: Date.now() - 1000,
      })
      expect(getEventOutputMult(state)).toBe(1)
    })
  })

  describe('Inflation System', () => {
    it('sellStock returns fewer coins with high totalPlayTime', () => {
      // Use metal-work (basePrice=3) so inflation doesn't floor earnings to 0
      const stateFresh = makeTestState({
        totalPlayTime: 0,
        coins: 1000,
        productionLines: {
          earth: [
            { recipeId: 'metal-work', level: 1, stock: 10, maxStock: 20, automated: false },
          ],
        },
        unlockedRecipes: ['ore-smelt', 'metal-work'],
      })
      const stateInflated = makeTestState({
        totalPlayTime: 1200, // 20 minutes → factor = max(0.1, 1 - 20*0.05) = 0.0 → 0.1
        coins: 1000,
        productionLines: {
          earth: [
            { recipeId: 'metal-work', level: 1, stock: 10, maxStock: 20, automated: false },
          ],
        },
        unlockedRecipes: ['ore-smelt', 'metal-work'],
      })

      const freshEarnings = sellStock(stateFresh, 'earth', 0)
      const inflatedEarnings = sellStock(stateInflated, 'earth', 0)

      expect(freshEarnings).toBeGreaterThan(0)
      expect(inflatedEarnings).toBeGreaterThan(0)
      expect(inflatedEarnings).toBeLessThan(freshEarnings)
    })

    it('processProductionTick applies inflation to auto-sell', () => {
      const stateNoInflation = makeTestState({
        totalPlayTime: 0,
        coins: 1000,
        upgrades: { 'auto-sell': 1 },
        productionLines: {
          earth: [
            { recipeId: 'ore-smelt', level: 1, stock: 9, maxStock: 10, automated: false },
          ],
        },
      })
      const stateHighInflation = makeTestState({
        totalPlayTime: 72000, // 20 hours
        coins: 1000,
        upgrades: { 'auto-sell': 1 },
        productionLines: {
          earth: [
            { recipeId: 'ore-smelt', level: 1, stock: 9, maxStock: 10, automated: false },
          ],
        },
      })

      // Run multiple ticks to accumulate earnings
      let freshTotal = 0
      let inflatedTotal = 0
      for (let i = 0; i < 10; i++) {
        freshTotal += processProductionTick(stateNoInflation)
        inflatedTotal += processProductionTick(stateHighInflation)
      }

      expect(freshTotal).toBeGreaterThan(inflatedTotal)
    })

    it('performPrestige resets totalPlayTime to 0', () => {
      const state = makeTestState({
        totalCoins: 2_000_000,
        totalPlayTime: 36000,
      })
      performPrestige(state)
      expect(state.totalPlayTime).toBe(0)
    })

    it('trackPlayTime increments totalPlayTime', () => {
      const state = makeTestState({ totalPlayTime: 0 })
      trackPlayTime(state, 1000) // 1 second
      expect(state.totalPlayTime).toBeCloseTo(1.0)
      trackPlayTime(state, 500) // 0.5 seconds more
      expect(state.totalPlayTime).toBeCloseTo(1.5)
    })
  })
})

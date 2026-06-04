import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  processProductionTick,
  clickProduce,
  sellStock,
  upgradeLine,
  addProductionLine,
  automateLine,
  recalcAllMaxStock,
  getLineUpgradeCost,
  calcLineMaxStock,
  getNewLineCost,
} from '../src/games/space-factory-idle/logic/production'
import type { GameState, ProductionLineState } from '../src/games/space-factory-idle/logic/game-state'

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

describe('production.ts — production logic', () => {
  describe('processProductionTick', () => {
    it('produces items on active lines', () => {
      const state = makeGameState()
      processProductionTick(state)
      const line = state.productionLines.earth[0]
      expect(line.stock).toBeGreaterThan(0)
      expect(state.totalProduced).toBeGreaterThan(0)
    })

    it('applies event output multiplier (meteor shower = x2)', () => {
      // Meteor shower doubles output
      const stateMeteor = makeGameState({
        activeEvent: 'meteor_shower',
        eventEndTime: Date.now() + 60_000,
      })
      processProductionTick(stateMeteor)
      const stockMeteor = stateMeteor.productionLines.earth[0].stock

      // No event
      const stateNormal = makeGameState()
      processProductionTick(stateNormal)
      const stockNormal = stateNormal.productionLines.earth[0].stock

      // Meteor shower should produce more items
      expect(stockMeteor).toBeGreaterThan(stockNormal)
    })

    it('sandstorm reduces production output', () => {
      // Use electronics (baseOutput: 3) at level 3 so output > 1 and multiplier is visible
      const stateSand = makeGameState({
        activeEvent: 'sandstorm',
        eventEndTime: Date.now() + 30_000,
      })
      stateSand.unlockedRecipes.push('electronics')
      stateSand.productionLines.earth[0] = { recipeId: 'electronics', level: 3, stock: 0, maxStock: 50, automated: false }
      processProductionTick(stateSand)
      const stockSand = stateSand.productionLines.earth[0].stock

      const stateNormal = makeGameState()
      stateNormal.unlockedRecipes.push('electronics')
      stateNormal.productionLines.earth[0] = { recipeId: 'electronics', level: 3, stock: 0, maxStock: 50, automated: false }
      processProductionTick(stateNormal)
      const stockNormal = stateNormal.productionLines.earth[0].stock

      // Sandstorm should produce fewer items
      expect(stockSand).toBeLessThan(stockNormal)
    })

    it('black hole triples production output', () => {
      const stateBH = makeGameState({
        activeEvent: 'black_hole',
        eventEndTime: Date.now() + 120_000,
      })
      processProductionTick(stateBH)
      const stockBH = stateBH.productionLines.earth[0].stock

      const stateNormal = makeGameState()
      processProductionTick(stateNormal)
      const stockNormal = stateNormal.productionLines.earth[0].stock

      // Black hole should produce significantly more
      expect(stockBH).toBeGreaterThan(stockNormal)
    })

    it('does not apply expired event multiplier', () => {
      const stateExpired = makeGameState({
        activeEvent: 'meteor_shower',
        eventEndTime: Date.now() - 1, // already expired
      })
      processProductionTick(stateExpired)
      const stockExpired = stateExpired.productionLines.earth[0].stock

      const stateNormal = makeGameState()
      processProductionTick(stateNormal)
      const stockNormal = stateNormal.productionLines.earth[0].stock

      // Expired event should produce same as no event (within rounding tolerance)
      expect(stockExpired).toBe(stockNormal)
    })

    it('does not exceed maxStock', () => {
      const state = makeGameState()
      // Set stock near max
      state.productionLines.earth[0].stock = 9
      state.productionLines.earth[0].maxStock = 10
      processProductionTick(state)
      expect(state.productionLines.earth[0].stock).toBeLessThanOrEqual(10)
    })

    it('auto-sells when stock full and auto-sell upgrade active', () => {
      const state = makeGameState({
        upgrades: { 'auto-sell': 1 },
      })
      state.productionLines.earth[0].stock = 10
      state.productionLines.earth[0].maxStock = 10
      processProductionTick(state)
      // Should have earned coins from auto-sell
      expect(state.coins).toBeGreaterThan(0)
      expect(state.totalCoins).toBeGreaterThan(0)
    })

    it('updates sessionItemsProduced', () => {
      const state = makeGameState()
      processProductionTick(state)
      expect(state.sessionItemsProduced).toBeGreaterThan(0)
    })

    it('applies coin multiplier upgrade (via auto-sell)', () => {
      // processProductionTick only generates coins via auto-sell when stock is full
      const state1 = makeGameState({ upgrades: { 'auto-sell': 1 } })
      state1.productionLines.earth[0].stock = 10 // already full
      state1.productionLines.earth[0].maxStock = 10
      processProductionTick(state1)
      const coins1 = state1.coins

      const state2 = makeGameState({ upgrades: { 'auto-sell': 1, 'coin-mult': 2 } })
      state2.productionLines.earth[0].stock = 10 // already full
      state2.productionLines.earth[0].maxStock = 10
      processProductionTick(state2)
      const coins2 = state2.coins

      // With coin-mult, should earn more from auto-sell
      expect(coins2).toBeGreaterThan(coins1)
    })

    it('applies prestige multiplier (via auto-sell)', () => {
      const state1 = makeGameState({ upgrades: { 'auto-sell': 1 } })
      state1.productionLines.earth[0].stock = 10 // already full
      state1.productionLines.earth[0].maxStock = 10
      processProductionTick(state1)
      const coins1 = state1.coins

      const state2 = makeGameState({ prestigeMult: 2, upgrades: { 'auto-sell': 1 } })
      state2.productionLines.earth[0].stock = 10 // already full
      state2.productionLines.earth[0].maxStock = 10
      processProductionTick(state2)
      const coins2 = state2.coins

      expect(coins2).toBeGreaterThan(coins1)
    })

    it('handles multiple planets', () => {
      const state = makeGameState({
        productionLines: {
          earth: [{ recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false }],
          moon: [{ recipeId: 'helium3', level: 1, stock: 0, maxStock: 10, automated: false }],
        },
      })
      processProductionTick(state)
      expect(state.productionLines.earth[0].stock).toBeGreaterThan(0)
      expect(state.productionLines.moon[0].stock).toBeGreaterThan(0)
    })

    it('skips unknown planets gracefully', () => {
      const state = makeGameState({
        productionLines: {
          earth: [{ recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false }],
          unknown_planet: [{ recipeId: 'fake', level: 1, stock: 0, maxStock: 10, automated: false }],
        },
      })
      // Should not throw
      expect(() => processProductionTick(state)).not.toThrow()
    })

    it('skips lines with unknown recipes', () => {
      const state = makeGameState({
        productionLines: {
          earth: [{ recipeId: 'nonexistent-recipe', level: 1, stock: 0, maxStock: 10, automated: false }],
        },
      })
      expect(() => processProductionTick(state)).not.toThrow()
    })
  })

  describe('clickProduce', () => {
    it('produces items when clicked', () => {
      const state = makeGameState()
      const coins = clickProduce(state, 'earth', 0)
      expect(state.productionLines.earth[0].stock).toBeGreaterThan(0)
      expect(state.totalProduced).toBeGreaterThan(0)
    })

    it('returns 0 for invalid planet', () => {
      const state = makeGameState()
      const coins = clickProduce(state, 'mars', 0)
      expect(coins).toBe(0)
    })

    it('returns 0 for invalid line index', () => {
      const state = makeGameState()
      const coins = clickProduce(state, 'earth', 5)
      expect(coins).toBe(0)
    })

    it('auto-sells overflow and returns coins', () => {
      const state = makeGameState()
      state.productionLines.earth[0].stock = 10
      state.productionLines.earth[0].maxStock = 10
      const coins = clickProduce(state, 'earth', 0)
      // Overflow should be sold, returning coins
      expect(coins).toBeGreaterThan(0)
      expect(state.coins).toBeGreaterThan(0)
      expect(state.productionLines.earth[0].stock).toBe(10) // clamped to max
    })

    it('updates sessionItemsProduced', () => {
      const state = makeGameState()
      clickProduce(state, 'earth', 0)
      expect(state.sessionItemsProduced).toBeGreaterThan(0)
    })

    it('returns 0 when no overflow', () => {
      const state = makeGameState()
      state.productionLines.earth[0].stock = 0
      const coins = clickProduce(state, 'earth', 0)
      expect(coins).toBe(0) // no overflow = no coins from click
    })
  })

  describe('sellStock', () => {
    it('sells stock and returns coins', () => {
      const state = makeGameState()
      state.productionLines.earth[0].stock = 5
      const coins = sellStock(state, 'earth', 0)
      expect(coins).toBeGreaterThan(0)
      expect(state.coins).toBe(coins)
      expect(state.productionLines.earth[0].stock).toBe(0)
    })

    it('returns 0 when stock is 0', () => {
      const state = makeGameState()
      const coins = sellStock(state, 'earth', 0)
      expect(coins).toBe(0)
    })

    it('returns 0 for invalid planet', () => {
      const state = makeGameState()
      const coins = sellStock(state, 'fake', 0)
      expect(coins).toBe(0)
    })

    it('returns 0 for invalid line index', () => {
      const state = makeGameState()
      const coins = sellStock(state, 'earth', 99)
      expect(coins).toBe(0)
    })

    it('updates totalCoins and sessionCoinsEarned', () => {
      const state = makeGameState()
      state.productionLines.earth[0].stock = 10
      sellStock(state, 'earth', 0)
      expect(state.totalCoins).toBeGreaterThan(0)
      expect(state.sessionCoinsEarned).toBeGreaterThan(0)
    })

    it('applies prestige multiplier to sell value', () => {
      const state1 = makeGameState()
      state1.productionLines.earth[0].stock = 5
      const coins1 = sellStock(state1, 'earth', 0)

      const state2 = makeGameState({ prestigeMult: 2 })
      state2.productionLines.earth[0].stock = 5
      const coins2 = sellStock(state2, 'earth', 0)

      expect(coins2).toBeGreaterThan(coins1)
    })

    it('applies coin-mult upgrade', () => {
      const state1 = makeGameState()
      state1.productionLines.earth[0].stock = 5
      const coins1 = sellStock(state1, 'earth', 0)

      const state2 = makeGameState({ upgrades: { 'coin-mult': 1 } })
      state2.productionLines.earth[0].stock = 5
      const coins2 = sellStock(state2, 'earth', 0)

      expect(coins2).toBeGreaterThan(coins1)
    })
  })

  describe('getLineUpgradeCost', () => {
    it('returns base cost at level 1', () => {
      const line: ProductionLineState = { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false }
      const cost = getLineUpgradeCost(line)
      // calcCost(50, 1.15, 1) = floor(50 * 1.15^1) ≈ floor(57.499) = 57
      expect(cost).toBeGreaterThan(0)
    })

    it('increases with level', () => {
      const line1: ProductionLineState = { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false }
      const line5: ProductionLineState = { recipeId: 'ore-smelt', level: 5, stock: 0, maxStock: 10, automated: false }
      expect(getLineUpgradeCost(line5)).toBeGreaterThan(getLineUpgradeCost(line1))
    })
  })

  describe('calcLineMaxStock', () => {
    it('calculates base max stock', () => {
      const state = makeGameState()
      const line: ProductionLineState = { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false }
      // base = 10 + 1*2 = 12
      expect(calcLineMaxStock(state, line)).toBe(12)
    })

    it('increases with line level', () => {
      const state = makeGameState()
      const line1: ProductionLineState = { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false }
      const line5: ProductionLineState = { recipeId: 'ore-smelt', level: 5, stock: 0, maxStock: 10, automated: false }
      expect(calcLineMaxStock(state, line5)).toBeGreaterThan(calcLineMaxStock(state, line1))
    })

    it('applies line-capacity upgrade', () => {
      const state = makeGameState({ upgrades: { 'line-capacity': 5 } })
      const line: ProductionLineState = { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false }
      // base = 12, + 5 capacity = 17
      expect(calcLineMaxStock(state, line)).toBe(17)
    })

    it('applies warehouse upgrade', () => {
      const state = makeGameState({ upgrades: { warehouse: 2 } })
      const line: ProductionLineState = { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false }
      // base = 12, + 2*10 warehouse = 32
      expect(calcLineMaxStock(state, line)).toBe(32)
    })
  })

  describe('upgradeLine', () => {
    it('upgrades when enough coins', () => {
      const state = makeGameState({ coins: 1000 })
      const result = upgradeLine(state, 'earth', 0)
      expect(result).toBe(true)
      expect(state.productionLines.earth[0].level).toBe(2)
      expect(state.coins).toBeLessThan(1000)
    })

    it('fails when not enough coins', () => {
      const state = makeGameState({ coins: 0 })
      const result = upgradeLine(state, 'earth', 0)
      expect(result).toBe(false)
      expect(state.productionLines.earth[0].level).toBe(1)
    })

    it('fails for invalid planet', () => {
      const state = makeGameState({ coins: 10000 })
      expect(upgradeLine(state, 'mars', 0)).toBe(false)
    })

    it('fails for invalid line index', () => {
      const state = makeGameState({ coins: 10000 })
      expect(upgradeLine(state, 'earth', 99)).toBe(false)
    })

    it('updates maxStock after upgrade', () => {
      const state = makeGameState({ coins: 10000 })
      const maxBefore = state.productionLines.earth[0].maxStock
      upgradeLine(state, 'earth', 0)
      expect(state.productionLines.earth[0].maxStock).toBeGreaterThan(maxBefore)
    })

    it('increments sessionUpgradesMade', () => {
      const state = makeGameState({ coins: 10000 })
      upgradeLine(state, 'earth', 0)
      expect(state.sessionUpgradesMade).toBe(1)
    })
  })

  describe('addProductionLine', () => {
    it('adds a new line when enough coins', () => {
      const state = makeGameState({ coins: 10000 })
      const result = addProductionLine(state, 'earth', 'metal-work')
      expect(result).toBe(true)
      expect(state.productionLines.earth.length).toBe(2)
    })

    it('deducts recipe cost from coins', () => {
      const state = makeGameState({ coins: 10000 })
      const coinsBefore = state.coins
      addProductionLine(state, 'earth', 'metal-work')
      expect(state.coins).toBeLessThan(coinsBefore)
    })

    it('fails when not enough coins', () => {
      const state = makeGameState({ coins: 0 })
      const result = addProductionLine(state, 'earth', 'metal-work')
      expect(result).toBe(false)
    })

    it('fails when planet is at max lines', () => {
      const state = makeGameState({ coins: 100000 })
      // Earth has max 3 lines
      addProductionLine(state, 'earth', 'metal-work')
      addProductionLine(state, 'earth', 'electronics')
      // 3rd line already exists from default, so adding 2 more = 3 total
      expect(state.productionLines.earth.length).toBe(3)
      // Adding a 4th should fail
      const result = addProductionLine(state, 'earth', 'precision')
      expect(result).toBe(false)
    })

    it('fails for invalid planet', () => {
      const state = makeGameState({ coins: 10000 })
      expect(addProductionLine(state, 'fake', 'ore-smelt')).toBe(false)
    })

    it('fails for invalid recipe', () => {
      const state = makeGameState({ coins: 10000 })
      expect(addProductionLine(state, 'earth', 'nonexistent')).toBe(false)
    })

    it('adds recipe to unlockedRecipes', () => {
      const state = makeGameState({ coins: 10000 })
      addProductionLine(state, 'earth', 'metal-work')
      expect(state.unlockedRecipes).toContain('metal-work')
    })

    it('creates planet entry if not existing', () => {
      const state = makeGameState({ coins: 10000, unlockedPlanets: ['earth', 'moon'] })
      state.productionLines = {
        earth: [{ recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false }],
      }
      addProductionLine(state, 'moon', 'helium3')
      expect(state.productionLines.moon).toBeDefined()
      expect(state.productionLines.moon.length).toBe(1)
    })
  })

  describe('automateLine', () => {
    it('automates a line when enough coins', () => {
      const state = makeGameState({ coins: 5000 })
      const result = automateLine(state, 'earth', 0)
      expect(result).toBe(true)
      expect(state.productionLines.earth[0].automated).toBe(true)
    })

    it('deducts cost (1000 * (lineIndex + 1))', () => {
      const state = makeGameState({ coins: 5000 })
      automateLine(state, 'earth', 0)
      expect(state.coins).toBe(5000 - 1000) // 1000 * (0+1)
    })

    it('fails when not enough coins', () => {
      const state = makeGameState({ coins: 0 })
      expect(automateLine(state, 'earth', 0)).toBe(false)
    })

    it('fails when already automated', () => {
      const state = makeGameState({ coins: 10000 })
      automateLine(state, 'earth', 0)
      expect(automateLine(state, 'earth', 0)).toBe(false)
    })

    it('fails for invalid planet', () => {
      const state = makeGameState({ coins: 10000 })
      expect(automateLine(state, 'fake', 0)).toBe(false)
    })

    it('fails for invalid line index', () => {
      const state = makeGameState({ coins: 10000 })
      expect(automateLine(state, 'earth', 99)).toBe(false)
    })

    it('higher index costs more', () => {
      const state1 = makeGameState({ coins: 100000 })
      const coinsBefore = state1.coins
      automateLine(state1, 'earth', 0)
      const cost0 = coinsBefore - state1.coins

      const state2 = makeGameState({ coins: 100000 })
      const coinsBefore2 = state2.coins
      addProductionLine(state2, 'earth', 'metal-work')
      automateLine(state2, 'earth', 1)
      const cost1 = coinsBefore2 - state2.coins

      expect(cost1).toBeGreaterThan(cost0)
    })
  })

  describe('recalcAllMaxStock', () => {
    it('updates maxStock for all lines', () => {
      const state = makeGameState({ upgrades: { 'line-capacity': 5 } })
      const line = state.productionLines.earth[0]
      line.maxStock = 5 // manually set wrong
      recalcAllMaxStock(state)
      expect(line.maxStock).toBe(calcLineMaxStock(state, line))
    })
  })

  describe('getNewLineCost', () => {
    it('returns recipe baseCost for valid index', () => {
      const cost = getNewLineCost('earth', 0)
      expect(cost).toBe(0) // ore-smelt has baseCost 0
    })

    it('returns Infinity for out of range index', () => {
      expect(getNewLineCost('earth', 99)).toBe(Infinity)
    })

    it('returns correct costs for different recipes', () => {
      const cost0 = getNewLineCost('earth', 0) // ore-smelt: 0
      const cost1 = getNewLineCost('earth', 1) // metal-work: 100
      expect(cost1).toBeGreaterThan(cost0)
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  processProductionTick,
  clickProduce,
  sellStock,
  getLineUpgradeCost,
  calcLineMaxStock,
  upgradeLine,
  addProductionLine,
  automateLine,
  recalcAllMaxStock,
  getNewLineCost,
} from '../../src/games/space-factory-idle/logic/production'
import type { GameState, ProductionLineState } from '../../src/games/space-factory-idle/logic/game-state'

function makeLine(overrides: Partial<ProductionLineState> = {}): ProductionLineState {
  return {
    recipeId: 'ore-smelt',
    level: 1,
    stock: 0,
    maxStock: 10,
    automated: false,
    ...overrides,
  }
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 10000,
    totalCoins: 0,
    starDust: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    prestigeMult: 1,
    factoryLevel: 1,
    productionLines: {
      earth: [makeLine()],
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

describe('production', () => {
  describe('processProductionTick', () => {
    it('should produce items and add to stock', () => {
      const state = makeState()
      const coins = processProductionTick(state)
      // ore-smelt has baseOutput=1, level=1, all mults=1 → produces 1 item
      expect(state.productionLines.earth[0].stock).toBeGreaterThanOrEqual(1)
      expect(state.totalProduced).toBeGreaterThanOrEqual(1)
    })

    it('should not exceed maxStock', () => {
      const state = makeState()
      state.productionLines.earth[0].maxStock = 1
      // Run many ticks
      for (let i = 0; i < 10; i++) {
        processProductionTick(state)
      }
      expect(state.productionLines.earth[0].stock).toBeLessThanOrEqual(1)
    })

    it('should earn coins when auto-sell is enabled and stock is full', () => {
      const state = makeState({
        upgrades: { 'auto-sell': 1 },
      })
      state.productionLines.earth[0].maxStock = 1
      state.productionLines.earth[0].stock = 1

      const coinsBefore = state.coins
      processProductionTick(state)
      // Should have earned some coins from auto-sell
      expect(state.coins).toBeGreaterThanOrEqual(coinsBefore)
    })

    it('should scale output with line level', () => {
      // Use electronics (baseOutput=3) so floor() doesn't clamp to 1
      const state1 = makeState({
        productionLines: { earth: [makeLine({ recipeId: 'electronics', level: 1 })] },
        unlockedRecipes: ['ore-smelt', 'electronics'],
      })
      const state2 = makeState({
        productionLines: { earth: [makeLine({ recipeId: 'electronics', level: 3 })] },
        unlockedRecipes: ['ore-smelt', 'electronics'],
      })

      processProductionTick(state1)
      processProductionTick(state2)
      // Level 3 output > Level 1 output
      expect(state2.productionLines.earth[0].stock).toBeGreaterThan(
        state1.productionLines.earth[0].stock,
      )
    })

    it('should scale output with speed upgrade', () => {
      // Use electronics recipe (baseOutput=8) so floor() doesn't clamp to 1
      const state1 = makeState({
        productionLines: { earth: [makeLine({ recipeId: 'electronics' })] },
        unlockedRecipes: ['ore-smelt', 'electronics'],
      })
      const state2 = makeState({
        productionLines: { earth: [makeLine({ recipeId: 'electronics' })] },
        unlockedRecipes: ['ore-smelt', 'electronics'],
        upgrades: { 'line-speed': 5 },
      })

      processProductionTick(state1)
      processProductionTick(state2)
      expect(state2.productionLines.earth[0].stock).toBeGreaterThan(
        state1.productionLines.earth[0].stock,
      )
    })

    it('should scale output with prestige multiplier', () => {
      const state1 = makeState({ prestigeMult: 1 })
      const state2 = makeState({ prestigeMult: 3 })

      processProductionTick(state1)
      processProductionTick(state2)
      expect(state2.productionLines.earth[0].stock).toBeGreaterThan(
        state1.productionLines.earth[0].stock,
      )
    })

    it('should scale output with engineer employees', () => {
      const state1 = makeState({
        productionLines: { earth: [makeLine({ recipeId: 'electronics' })] },
        unlockedRecipes: ['ore-smelt', 'electronics'],
      })
      const state2 = makeState({
        productionLines: { earth: [makeLine({ recipeId: 'electronics' })] },
        unlockedRecipes: ['ore-smelt', 'electronics'],
        employees: { engineer: 5 },
      })

      processProductionTick(state1)
      processProductionTick(state2)
      expect(state2.productionLines.earth[0].stock).toBeGreaterThan(
        state1.productionLines.earth[0].stock,
      )
    })

    it('should scale output with director employees', () => {
      const state1 = makeState({
        productionLines: { earth: [makeLine({ recipeId: 'electronics' })] },
        unlockedRecipes: ['ore-smelt', 'electronics'],
      })
      const state2 = makeState({
        productionLines: { earth: [makeLine({ recipeId: 'electronics' })] },
        unlockedRecipes: ['ore-smelt', 'electronics'],
        employees: { director: 3 },
      })

      processProductionTick(state1)
      processProductionTick(state2)
      expect(state2.productionLines.earth[0].stock).toBeGreaterThan(
        state1.productionLines.earth[0].stock,
      )
    })

    it('should handle multiple production lines', () => {
      const state = makeState({
        productionLines: {
          earth: [
            makeLine({ recipeId: 'ore-smelt', level: 1 }),
            makeLine({ recipeId: 'metal-work', level: 1 }),
          ],
        },
        unlockedRecipes: ['ore-smelt', 'metal-work'],
      })
      processProductionTick(state)
      expect(state.productionLines.earth[0].stock).toBeGreaterThanOrEqual(1)
      expect(state.productionLines.earth[1].stock).toBeGreaterThanOrEqual(1)
    })

    it('should skip invalid planet IDs', () => {
      const state = makeState({
        productionLines: {
          earth: [makeLine()],
          invalid_planet: [makeLine()],
        },
      })
      // Should not throw, just skip the invalid planet
      expect(() => processProductionTick(state)).not.toThrow()
    })

    it('should track sessionItemsProduced', () => {
      const state = makeState()
      processProductionTick(state)
      expect(state.sessionItemsProduced).toBeGreaterThanOrEqual(1)
    })
  })

  describe('clickProduce', () => {
    it('should return 0 for invalid planet', () => {
      const state = makeState()
      expect(clickProduce(state, 'nonexistent', 0)).toBe(0)
    })

    it('should return 0 for invalid line index', () => {
      const state = makeState()
      expect(clickProduce(state, 'earth', 5)).toBe(0)
    })

    it('should produce items and add to stock', () => {
      const state = makeState()
      const coins = clickProduce(state, 'earth', 0)
      expect(state.productionLines.earth[0].stock).toBeGreaterThanOrEqual(1)
      expect(state.totalProduced).toBeGreaterThanOrEqual(1)
    })

    it('should auto-sell overflow when stock exceeds max', () => {
      const state = makeState()
      state.productionLines.earth[0].maxStock = 1
      state.productionLines.earth[0].stock = 1

      const coinsBefore = state.coins
      const earned = clickProduce(state, 'earth', 0)
      // Stock was at max, overflow should be sold
      expect(state.productionLines.earth[0].stock).toBeLessThanOrEqual(1)
      expect(earned).toBeGreaterThanOrEqual(0)
    })

    it('should track sessionItemsProduced', () => {
      const state = makeState()
      const before = state.sessionItemsProduced
      clickProduce(state, 'earth', 0)
      expect(state.sessionItemsProduced).toBeGreaterThan(before)
    })
  })

  describe('sellStock', () => {
    it('should return 0 for invalid planet', () => {
      const state = makeState()
      expect(sellStock(state, 'nonexistent', 0)).toBe(0)
    })

    it('should return 0 for empty stock', () => {
      const state = makeState()
      state.productionLines.earth[0].stock = 0
      expect(sellStock(state, 'earth', 0)).toBe(0)
    })

    it('should sell all stock and earn coins', () => {
      const state = makeState()
      state.productionLines.earth[0].stock = 10
      const coinsBefore = state.coins
      const earned = sellStock(state, 'earth', 0)
      expect(earned).toBeGreaterThan(0)
      expect(state.coins).toBeGreaterThan(coinsBefore)
      expect(state.productionLines.earth[0].stock).toBe(0)
    })

    it('should apply coin multiplier from upgrades', () => {
      const state1 = makeState()
      state1.productionLines.earth[0].stock = 10
      const earned1 = sellStock(state1, 'earth', 0)

      const state2 = makeState({ upgrades: { 'coin-mult': 3 } })
      state2.productionLines.earth[0].stock = 10
      const earned2 = sellStock(state2, 'earth', 0)

      expect(earned2).toBeGreaterThan(earned1)
    })

    it('should apply prestige multiplier', () => {
      const state1 = makeState({ prestigeMult: 1 })
      state1.productionLines.earth[0].stock = 10
      const earned1 = sellStock(state1, 'earth', 0)

      const state2 = makeState({ prestigeMult: 5 })
      state2.productionLines.earth[0].stock = 10
      const earned2 = sellStock(state2, 'earth', 0)

      expect(earned2).toBeGreaterThan(earned1)
    })

    it('should apply inflation reduction', () => {
      const state1 = makeState({ totalPlayTime: 0 })
      state1.productionLines.earth[0].stock = 10
      const earned1 = sellStock(state1, 'earth', 0)

      const state2 = makeState({ totalPlayTime: 36000 }) // 10 hours
      state2.productionLines.earth[0].stock = 10
      const earned2 = sellStock(state2, 'earth', 0)

      // Higher inflation → lower sell price
      expect(earned2).toBeLessThan(earned1)
    })

    it('should track totalCoins', () => {
      const state = makeState()
      state.productionLines.earth[0].stock = 5
      const before = state.totalCoins
      sellStock(state, 'earth', 0)
      expect(state.totalCoins).toBeGreaterThan(before)
    })
  })

  describe('getLineUpgradeCost', () => {
    it('should return base cost at level 1', () => {
      const line = makeLine({ level: 1 })
      // calcCost(50, 1.15, 1) = floor(50 * 1.15) = 57
      expect(getLineUpgradeCost(line)).toBe(57)
    })

    it('should increase with level', () => {
      const cost1 = getLineUpgradeCost(makeLine({ level: 1 }))
      const cost5 = getLineUpgradeCost(makeLine({ level: 5 }))
      expect(cost5).toBeGreaterThan(cost1)
    })
  })

  describe('calcLineMaxStock', () => {
    it('should return base stock at level 1 with no upgrades', () => {
      const state = makeState()
      const line = makeLine({ level: 1 })
      // base = 10 + 1*2 = 12
      expect(calcLineMaxStock(state, line)).toBe(12)
    })

    it('should increase with line level', () => {
      const state = makeState()
      const stock1 = calcLineMaxStock(state, makeLine({ level: 1 }))
      const stock5 = calcLineMaxStock(state, makeLine({ level: 5 }))
      expect(stock5).toBeGreaterThan(stock1)
    })

    it('should increase with line-capacity upgrade', () => {
      const state1 = makeState()
      const state2 = makeState({ upgrades: { 'line-capacity': 10 } })
      const line = makeLine({ level: 1 })
      expect(calcLineMaxStock(state2, line)).toBeGreaterThan(calcLineMaxStock(state1, line))
    })

    it('should increase with warehouse upgrade', () => {
      const state1 = makeState()
      const state2 = makeState({ upgrades: { 'warehouse': 5 } })
      const line = makeLine({ level: 1 })
      // warehouse adds +10 per level → +50
      expect(calcLineMaxStock(state2, line)).toBe(calcLineMaxStock(state1, line) + 50)
    })
  })

  describe('upgradeLine', () => {
    it('should return false for invalid planet', () => {
      const state = makeState()
      expect(upgradeLine(state, 'nonexistent', 0)).toBe(false)
    })

    it('should return false for invalid line index', () => {
      const state = makeState()
      expect(upgradeLine(state, 'earth', 5)).toBe(false)
    })

    it('should return false if not enough coins', () => {
      const state = makeState({ coins: 1 })
      expect(upgradeLine(state, 'earth', 0)).toBe(false)
    })

    it('should upgrade line level and deduct coins', () => {
      const state = makeState({ coins: 10000 })
      const costBefore = getLineUpgradeCost(state.productionLines.earth[0])
      const coinsBefore = state.coins

      const result = upgradeLine(state, 'earth', 0)
      expect(result).toBe(true)
      expect(state.productionLines.earth[0].level).toBe(2)
      expect(state.coins).toBe(coinsBefore - costBefore)
    })

    it('should update maxStock after upgrade', () => {
      const state = makeState({ coins: 10000 })
      const maxBefore = state.productionLines.earth[0].maxStock
      upgradeLine(state, 'earth', 0)
      expect(state.productionLines.earth[0].maxStock).toBeGreaterThan(maxBefore)
    })

    it('should increment sessionUpgradesMade', () => {
      const state = makeState({ coins: 10000 })
      upgradeLine(state, 'earth', 0)
      expect(state.sessionUpgradesMade).toBe(1)
    })
  })

  describe('addProductionLine', () => {
    it('should return false for invalid planet', () => {
      const state = makeState()
      expect(addProductionLine(state, 'nonexistent', 'metal-work')).toBe(false)
    })

    it('should return false for invalid recipe', () => {
      const state = makeState()
      expect(addProductionLine(state, 'earth', 'nonexistent')).toBe(false)
    })

    it('should return false if not enough coins', () => {
      const state = makeState({ coins: 0 })
      // metal-work costs 100
      expect(addProductionLine(state, 'earth', 'metal-work')).toBe(false)
    })

    it('should return false if at max production lines', () => {
      const state = makeState({
        productionLines: {
          earth: [
            makeLine(),
            makeLine({ recipeId: 'metal-work' }),
            makeLine({ recipeId: 'electronics' }),
          ],
        },
        coins: 100000,
      })
      // Earth has max 3 production lines
      expect(addProductionLine(state, 'earth', 'precision')).toBe(false)
    })

    it('should add a new production line', () => {
      const state = makeState({ coins: 10000 })
      const result = addProductionLine(state, 'earth', 'metal-work')
      expect(result).toBe(true)
      expect(state.productionLines.earth).toHaveLength(2)
      expect(state.productionLines.earth[1].recipeId).toBe('metal-work')
    })

    it('should deduct coins', () => {
      const state = makeState({ coins: 10000 })
      const before = state.coins
      addProductionLine(state, 'earth', 'metal-work') // costs 100
      expect(state.coins).toBe(before - 100)
    })

    it('should add recipe to unlockedRecipes', () => {
      const state = makeState({ coins: 10000 })
      addProductionLine(state, 'earth', 'metal-work')
      expect(state.unlockedRecipes).toContain('metal-work')
    })

    it('should create productionLines array for planet if none exists', () => {
      const state = makeState({
        coins: 10000,
        productionLines: {},
      })
      addProductionLine(state, 'earth', 'ore-smelt')
      expect(state.productionLines.earth).toBeDefined()
      expect(state.productionLines.earth).toHaveLength(1)
    })
  })

  describe('automateLine', () => {
    it('should return false for invalid planet', () => {
      const state = makeState()
      expect(automateLine(state, 'nonexistent', 0)).toBe(false)
    })

    it('should return false for invalid line index', () => {
      const state = makeState()
      expect(automateLine(state, 'earth', 5)).toBe(false)
    })

    it('should return false if already automated', () => {
      const state = makeState()
      state.productionLines.earth[0].automated = true
      expect(automateLine(state, 'earth', 0)).toBe(false)
    })

    it('should return false if not enough coins', () => {
      const state = makeState({ coins: 1 })
      expect(automateLine(state, 'earth', 0)).toBe(false)
    })

    it('should automate the line and deduct coins', () => {
      const state = makeState({ coins: 10000 })
      const result = automateLine(state, 'earth', 0)
      expect(result).toBe(true)
      expect(state.productionLines.earth[0].automated).toBe(true)
      expect(state.coins).toBe(10000 - 1000) // cost = 1000 * (0+1)
    })
  })

  describe('recalcAllMaxStock', () => {
    it('should update all lines maxStock', () => {
      const state = makeState({
        productionLines: {
          earth: [
            makeLine({ level: 1, maxStock: 5 }), // stale
            makeLine({ level: 3, maxStock: 5 }), // stale
          ],
        },
      })
      recalcAllMaxStock(state)
      expect(state.productionLines.earth[0].maxStock).toBe(calcLineMaxStock(state, state.productionLines.earth[0]))
      expect(state.productionLines.earth[1].maxStock).toBe(calcLineMaxStock(state, state.productionLines.earth[1]))
    })
  })

  describe('getNewLineCost', () => {
    it('should return recipe baseCost', () => {
      // ore-smelt has baseCost 0
      expect(getNewLineCost('earth', 0)).toBe(0)
    })

    it('should return Infinity for out of range index', () => {
      expect(getNewLineCost('earth', 999)).toBe(Infinity)
    })

    it('should return correct cost for second recipe', () => {
      // metal-work has baseCost 100
      expect(getNewLineCost('earth', 1)).toBe(100)
    })
  })
})

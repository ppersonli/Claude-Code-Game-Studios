/**
 * Space Factory Idle — Production Logic Tests
 * Tests for processProductionTick, clickProduce, sellStock, upgradeLine, etc.
 */

import { describe, it, expect } from 'vitest'
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
} from '../../src/games/space-factory-idle/logic/production'
import { createDefaultState } from '../../src/games/space-factory-idle/logic/game-state'

/* ── processProductionTick ─────────────────────────────────────── */

describe('processProductionTick', () => {
  it('produces items on automated lines', () => {
    const state = createDefaultState()
    state.productionLines['earth'][0].automated = true
    const earned = processProductionTick(state)
    expect(state.totalProduced).toBeGreaterThan(0)
  })

  it('returns coins from auto-sell when stock is full', () => {
    const state = createDefaultState()
    state.productionLines['earth'][0].automated = true
    state.productionLines['earth'][0].stock = 10 // fill stock
    state.upgrades['auto-sell'] = 1
    const earned = processProductionTick(state)
    expect(earned).toBeGreaterThan(0)
    expect(state.coins).toBeGreaterThan(0)
  })

  it('does not produce beyond maxStock', () => {
    const state = createDefaultState()
    state.productionLines['earth'][0].automated = true
    state.productionLines['earth'][0].stock = 10 // already at max
    state.productionLines['earth'][0].maxStock = 10
    state.upgrades['auto-sell'] = 0 // no auto-sell
    processProductionTick(state)
    // Stock should not exceed max
    expect(state.productionLines['earth'][0].stock).toBeLessThanOrEqual(10)
  })

  it('accumulates sessionCoinsEarned', () => {
    const state = createDefaultState()
    state.productionLines['earth'][0].automated = true
    state.productionLines['earth'][0].stock = 10
    state.upgrades['auto-sell'] = 1
    processProductionTick(state)
    expect(state.sessionCoinsEarned).toBeGreaterThan(0)
  })
})

/* ── clickProduce ──────────────────────────────────────────────── */

describe('clickProduce', () => {
  it('produces items on click', () => {
    const state = createDefaultState()
    const earned = clickProduce(state, 'earth', 0)
    expect(state.totalProduced).toBeGreaterThan(0)
  })

  it('returns 0 for invalid planet', () => {
    const state = createDefaultState()
    const earned = clickProduce(state, 'mars', 0)
    expect(earned).toBe(0)
    expect(state.totalProduced).toBe(0)
  })

  it('returns 0 for invalid line index', () => {
    const state = createDefaultState()
    const earned = clickProduce(state, 'earth', 5)
    expect(earned).toBe(0)
  })

  it('auto-sells when stock is full', () => {
    const state = createDefaultState()
    state.productionLines['earth'][0].stock = 10
    state.productionLines['earth'][0].maxStock = 10
    const earned = clickProduce(state, 'earth', 0)
    expect(earned).toBeGreaterThan(0)
    expect(state.coins).toBeGreaterThan(0)
  })

  it('accumulates sessionItemsProduced', () => {
    const state = createDefaultState()
    clickProduce(state, 'earth', 0)
    expect(state.sessionItemsProduced).toBeGreaterThan(0)
  })
})

/* ── sellStock ─────────────────────────────────────────────────── */

describe('sellStock', () => {
  it('sells all stock and earns coins', () => {
    const state = createDefaultState()
    state.productionLines['earth'][0].stock = 5
    const earned = sellStock(state, 'earth', 0)
    expect(earned).toBeGreaterThan(0)
    expect(state.coins).toBeGreaterThan(0)
    expect(state.productionLines['earth'][0].stock).toBe(0)
  })

  it('returns 0 for empty stock', () => {
    const state = createDefaultState()
    state.productionLines['earth'][0].stock = 0
    const earned = sellStock(state, 'earth', 0)
    expect(earned).toBe(0)
  })

  it('returns 0 for invalid planet', () => {
    const state = createDefaultState()
    const earned = sellStock(state, 'invalid', 0)
    expect(earned).toBe(0)
  })
})

/* ── getLineUpgradeCost ────────────────────────────────────────── */

describe('getLineUpgradeCost', () => {
  it('returns finite cost for valid line', () => {
    const state = createDefaultState()
    const line = state.productionLines['earth'][0]
    const cost = getLineUpgradeCost(line)
    expect(cost).toBeGreaterThan(0)
    expect(Number.isFinite(cost)).toBe(true)
  })

  it('increases with level', () => {
    const state = createDefaultState()
    const line = state.productionLines['earth'][0]
    const cost1 = getLineUpgradeCost(line)
    line.level = 5
    const cost5 = getLineUpgradeCost(line)
    expect(cost5).toBeGreaterThan(cost1)
  })
})

/* ── calcLineMaxStock ──────────────────────────────────────────── */

describe('calcLineMaxStock', () => {
  it('returns base capacity for level 1 line', () => {
    const state = createDefaultState()
    const line = state.productionLines['earth'][0]
    const maxStock = calcLineMaxStock(state, line)
    // baseCapacity(10) + level(1)*2 = 12
    expect(maxStock).toBe(12)
  })

  it('increases with line level', () => {
    const state = createDefaultState()
    const line = state.productionLines['earth'][0]
    line.level = 5
    const maxStock = calcLineMaxStock(state, line)
    // 10 + 5*2 = 20
    expect(maxStock).toBe(20)
  })

  it('increases with warehouse upgrade', () => {
    const state = createDefaultState()
    const line = state.productionLines['earth'][0]
    state.upgrades['warehouse'] = 3
    const maxStock = calcLineMaxStock(state, line)
    // 10 + 1*2 + 3*10 = 42
    expect(maxStock).toBe(42)
  })
})

/* ── upgradeLine ───────────────────────────────────────────────── */

describe('upgradeLine', () => {
  it('upgrades line if enough coins', () => {
    const state = createDefaultState()
    state.coins = 1000
    const result = upgradeLine(state, 'earth', 0)
    expect(result).toBe(true)
    expect(state.productionLines['earth'][0].level).toBe(2)
  })

  it('deducts coins', () => {
    const state = createDefaultState()
    state.coins = 1000
    upgradeLine(state, 'earth', 0)
    expect(state.coins).toBeLessThan(1000)
  })

  it('returns false if not enough coins', () => {
    const state = createDefaultState()
    state.coins = 1
    const result = upgradeLine(state, 'earth', 0)
    expect(result).toBe(false)
    expect(state.productionLines['earth'][0].level).toBe(1)
  })

  it('returns false for invalid line', () => {
    const state = createDefaultState()
    state.coins = 1000
    const result = upgradeLine(state, 'earth', 5)
    expect(result).toBe(false)
  })

  it('increments sessionUpgradesMade', () => {
    const state = createDefaultState()
    state.coins = 1000
    upgradeLine(state, 'earth', 0)
    expect(state.sessionUpgradesMade).toBe(1)
  })
})

/* ── addProductionLine ─────────────────────────────────────────── */

describe('addProductionLine', () => {
  it('adds a new line if enough coins', () => {
    const state = createDefaultState()
    state.coins = 1000
    const result = addProductionLine(state, 'earth', 'ore-smelt')
    expect(result).toBe(true)
    expect(state.productionLines['earth'].length).toBe(2)
  })

  it('deducts recipe cost for non-free recipes', () => {
    const state = createDefaultState()
    state.coins = 1000
    const initialCoins = state.coins
    addProductionLine(state, 'earth', 'metal-work') // costs 100
    expect(state.coins).toBeLessThan(initialCoins)
    expect(state.coins).toBe(initialCoins - 100)
  })

  it('free recipes cost 0 coins', () => {
    const state = createDefaultState()
    state.coins = 1000
    addProductionLine(state, 'earth', 'ore-smelt') // costs 0
    expect(state.coins).toBe(1000)
  })

  it('returns false for locked planet', () => {
    const state = createDefaultState()
    state.coins = 10000
    const result = addProductionLine(state, 'mars', 'ore-smelt')
    expect(result).toBe(false)
  })

  it('returns false if not enough coins for paid recipe', () => {
    const state = createDefaultState()
    state.coins = 50 // metal-work costs 100
    const result = addProductionLine(state, 'earth', 'metal-work')
    expect(result).toBe(false)
  })
})

/* ── automateLine ──────────────────────────────────────────────── */

describe('automateLine', () => {
  it('automates a line if enough coins', () => {
    const state = createDefaultState()
    state.coins = 5000
    const result = automateLine(state, 'earth', 0)
    expect(result).toBe(true)
    expect(state.productionLines['earth'][0].automated).toBe(true)
  })

  it('deducts cost', () => {
    const state = createDefaultState()
    state.coins = 5000
    automateLine(state, 'earth', 0)
    expect(state.coins).toBeLessThan(5000)
  })

  it('returns false if already automated', () => {
    const state = createDefaultState()
    state.coins = 5000
    automateLine(state, 'earth', 0)
    const result = automateLine(state, 'earth', 0)
    expect(result).toBe(false)
  })

  it('returns false if not enough coins', () => {
    const state = createDefaultState()
    state.coins = 1
    const result = automateLine(state, 'earth', 0)
    expect(result).toBe(false)
  })
})

/* ── recalcAllMaxStock ─────────────────────────────────────────── */

describe('recalcAllMaxStock', () => {
  it('updates maxStock for all lines', () => {
    const state = createDefaultState()
    state.upgrades['warehouse'] = 5
    recalcAllMaxStock(state)
    const line = state.productionLines['earth'][0]
    expect(line.maxStock).toBeGreaterThan(10) // base is 10
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Ingredient } from '../../src/types'
import {
  calculateServeResult,
  generateOrder,
  createInitialState,
  startStandardGame,
  startDailyGame,
  nextCustomer,
  addToCup,
  serveDrink,
  resetCup,
  endGame,
  unlockItem,
} from '../../src/games/bubble-tea/composables/useGameState'
import { INGREDIENTS } from '../../src/games/bubble-tea/data/ingredients'
import { DAILY_MODIFIERS } from '../../src/games/bubble-tea/data/daily-challenge'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// Mock window for effects
vi.stubGlobal('window', { innerWidth: 400, innerHeight: 800 })

const greenTea = INGREDIENTS.find(i => i.id === 'green_tea')!
const milk = INGREDIENTS.find(i => i.id === 'milk')!
const boba = INGREDIENTS.find(i => i.id === 'boba')!
const ice = INGREDIENTS.find(i => i.id === 'ice')!

describe('calculateServeResult', () => {
  it('scores a perfect serve correctly', () => {
    const order: Ingredient[] = [greenTea, milk]
    const cup: Ingredient[] = [greenTea, milk]
    const result = calculateServeResult(order, cup, 0)
    expect(result.matches).toBe(2)
    expect(result.wrong).toBe(0)
    expect(result.isPerfect).toBe(true)
    expect(result.points).toBeGreaterThan(0)
    expect(result.newCombo).toBe(1)
  })

  it('scores a partial match correctly', () => {
    const order: Ingredient[] = [greenTea, milk]
    const cup: Ingredient[] = [greenTea, boba]
    const result = calculateServeResult(order, cup, 0)
    expect(result.matches).toBe(1)
    expect(result.wrong).toBe(1)
    expect(result.isPerfect).toBe(false)
    expect(result.newCombo).toBe(0)
  })

  it('resets combo on non-perfect serve', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = [boba]
    const result = calculateServeResult(order, cup, 5)
    expect(result.newCombo).toBe(0)
  })

  it('increments combo on perfect serve', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = [greenTea]
    const result = calculateServeResult(order, cup, 3)
    expect(result.newCombo).toBe(4)
  })

  it('applies tip bonus', () => {
    const order: Ingredient[] = [greenTea, milk]
    const cup: Ingredient[] = [greenTea, milk]
    const withTip = calculateServeResult(order, cup, 0, { tipBonus: 2.0 })
    const withoutTip = calculateServeResult(order, cup, 0, { tipBonus: 1 })
    expect(withTip.points).toBeGreaterThan(withoutTip.points)
  })

  it('applies daily score multiplier', () => {
    const order: Ingredient[] = [greenTea, milk]
    const cup: Ingredient[] = [greenTea, milk]
    const modifier = DAILY_MODIFIERS.find(m => m.scoreMultiplier > 1)!
    const withDaily = calculateServeResult(order, cup, 0, { isDaily: true, dailyModifier: modifier })
    const withoutDaily = calculateServeResult(order, cup, 0)
    expect(withDaily.points).toBeGreaterThanOrEqual(withoutDaily.points)
  })

  it('never returns negative points', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = [boba, ice, milk, greenTea, boba, ice]
    const result = calculateServeResult(order, cup, 0)
    expect(result.points).toBeGreaterThanOrEqual(0)
  })

  it('handles empty cup', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = []
    const result = calculateServeResult(order, cup, 0)
    expect(result.matches).toBe(0)
    expect(result.wrong).toBe(0)
  })

  it('handles empty order', () => {
    const order: Ingredient[] = []
    const cup: Ingredient[] = [greenTea]
    const result = calculateServeResult(order, cup, 0)
    expect(result.matches).toBe(0)
    expect(result.wrong).toBe(1)
    expect(result.isPerfect).toBe(false)
  })

  it('calculates combo multiplier tiers correctly', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = [greenTea]
    // combo 1 -> 2 should get 1.5x
    const r2 = calculateServeResult(order, cup, 1)
    expect(r2.newCombo).toBe(2)
    // combo 4 -> 5 should get 2x
    const r5 = calculateServeResult(order, cup, 4)
    expect(r5.newCombo).toBe(5)
    expect(r5.points).toBeGreaterThan(r2.points)
  })
})

describe('generateOrder', () => {
  it('generates order with correct size for level', () => {
    // Level 1: min(2 + 0, 5) = 2
    const order1 = generateOrder(1, [])
    expect(order1).toHaveLength(2)
    // Level 5: min(2 + 2, 5) = 4
    const order5 = generateOrder(5, [])
    expect(order5).toHaveLength(4)
    // Level 10: min(2 + 5, 5) = 5 (capped)
    const order10 = generateOrder(10, [])
    expect(order10).toHaveLength(5)
  })

  it('returns unique ingredients', () => {
    const order = generateOrder(5, [])
    const ids = order.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only uses unlocked ingredients', () => {
    // With no unlocked premium, only base 11 are available
    const order = generateOrder(1, [])
    for (const ing of order) {
      expect(ing.locked).toBeFalsy()
    }
  })

  it('can include unlocked premium ingredients', () => {
    const taro = INGREDIENTS.find(i => i.id === 'taro')!
    // Generate many orders, at least one should eventually include taro
    let found = false
    for (let i = 0; i < 50; i++) {
      const order = generateOrder(10, ['taro'])
      if (order.some(o => o.id === 'taro')) { found = true; break }
    }
    expect(found).toBe(true)
  })
})

describe('createInitialState', () => {
  it('returns correct initial values', () => {
    const state = createInitialState()
    expect(state.score).toBe(0)
    expect(state.level).toBe(1)
    expect(state.combo).toBe(0)
    expect(state.gameOver).toBe(false)
    expect(state.cupContents).toEqual([])
  })

  it('loads persistent data from localStorage', () => {
    localStorage.setItem('btea_coins', '500')
    localStorage.setItem('btea_total_drinks', '25')
    localStorage.setItem('btea_achievements', '["combo5"]')
    const state = createInitialState()
    expect(state.totalCoins).toBe(500)
    expect(state.totalDrinksServed).toBe(25)
    expect(state.achievements).toContain('combo5')
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('btea_achievements', 'NOT_JSON')
    const state = createInitialState()
    expect(state.achievements).toEqual([])
  })
})

describe('game flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('startStandardGame resets session state', () => {
    const state = createInitialState()
    state.score = 100
    state.level = 5
    startStandardGame(state)
    expect(state.score).toBe(0)
    expect(state.level).toBe(1)
    expect(state.isDaily).toBe(false)
  })

  it('startDailyGame sets daily mode', () => {
    const state = createInitialState()
    const modifier = DAILY_MODIFIERS[0]
    startDailyGame(state, modifier)
    expect(state.isDaily).toBe(true)
    expect(state.dailyTimer).toBe(modifier.timeLimit)
    expect(state.maxCustomers).toBe(999)
  })

  it('nextCustomer sets current order and customer', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    expect(state.currentOrder.length).toBeGreaterThan(0)
    expect(state.currentCustomer).not.toBeNull()
    expect(state.cupContents).toEqual([])
  })

  it('addToCup adds ingredient to cup', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    const result = addToCup(state, greenTea)
    expect(result).toBe(true)
    expect(state.cupContents).toHaveLength(1)
    expect(state.cupContents[0].id).toBe('green_tea')
  })

  it('addToCup returns false when cup is full (6 items)', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    for (let i = 0; i < 6; i++) addToCup(state, greenTea)
    expect(addToCup(state, milk)).toBe(false)
    expect(state.cupContents).toHaveLength(6)
  })

  it('resetCup clears cup contents', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    addToCup(state, greenTea)
    addToCup(state, milk)
    resetCup(state)
    expect(state.cupContents).toEqual([])
  })

  it('serveDrink returns null for empty cup', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    expect(serveDrink(state)).toBeNull()
  })

  it('serveDrink processes a serve', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.currentOrder = [greenTea, milk]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }
    addToCup(state, greenTea)
    addToCup(state, milk)
    const result = serveDrink(state)
    expect(result).not.toBeNull()
    expect(result!.isPerfect).toBe(true)
    expect(state.score).toBeGreaterThan(0)
    expect(state.drinksServed).toBe(1)
    expect(state.customersServed).toBe(1)
  })

  it('serveDrink increments combo on perfect', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.currentOrder = [greenTea]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }
    addToCup(state, greenTea)
    serveDrink(state)
    expect(state.combo).toBe(1)
    expect(state.perfectCount).toBe(1)
  })

  it('endGame persists data', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.score = 50
    state.totalDrinksServed = 10
    endGame(state)
    expect(state.totalCoins).toBe(50)
    expect(localStorage.getItem('btea_coins')).toBe('50')
    expect(localStorage.getItem('btea_total_drinks')).toBe('10')
  })

  it('unlockItem deducts coins and adds to list', () => {
    const state = createInitialState()
    state.totalCoins = 500
    const result = unlockItem(state, 'ingredient', 'taro', 100)
    expect(result).toBe(true)
    expect(state.totalCoins).toBe(400)
    expect(state.unlockedIngredients).toContain('taro')
  })

  it('unlockItem returns false if insufficient coins', () => {
    const state = createInitialState()
    state.totalCoins = 50
    const result = unlockItem(state, 'ingredient', 'taro', 100)
    expect(result).toBe(false)
    expect(state.unlockedIngredients).not.toContain('taro')
  })

  it('level up occurs every 3 serves in standard mode', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.currentOrder = [greenTea]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }

    for (let i = 0; i < 3; i++) {
      state.cupContents = []
      addToCup(state, greenTea)
      serveDrink(state)
      if (!state.gameOver) nextCustomer(state)
    }
    expect(state.level).toBe(2)
  })

  it('game ends after maxCustomers in standard mode', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.maxCustomers = 2
    state.currentOrder = [greenTea]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }

    // Serve 2 customers
    addToCup(state, greenTea)
    serveDrink(state)
    nextCustomer(state) // customersServed=1, < 2
    addToCup(state, greenTea)
    serveDrink(state)
    nextCustomer(state) // customersServed=2, >= 2 -> gameOver
    expect(state.gameOver).toBe(true)
  })
})

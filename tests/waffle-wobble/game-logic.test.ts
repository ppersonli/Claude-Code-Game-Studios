import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TOPPINGS, getToppingById, MAX_TOPPINGS_PER_ORDER, WAFFLE_COOK_TIME } from '../../src/games/waffle-wobble/data/toppings'
import {
  createInitialState, generateOrder, getSpawnInterval, getPatience,
  spawnCustomer, startCooking, checkWaffleDone, checkWaffleBurned,
  addToppingToWaffle, discardWaffle, checkOrderMatch, serveToCustomer,
  updateCustomerPatience, canUnlockTopping, unlockTopping, getCustomersNeeded,
} from '../../src/games/waffle-wobble/logic/game-state'
import { calculateScore, calculateCoins } from '../../src/games/waffle-wobble/logic/scoring'
import { saveGame, loadGame, resetSave } from '../../src/games/waffle-wobble/logic/save'
import { COOK_TIME, BURN_TIME, MAX_LIVES, PATIENCE_BASE } from '../../src/games/waffle-wobble/logic/constants'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ===== Toppings Data =====

describe('TOPPINGS data', () => {
  it('test_toppings_has_10_entries', () => { expect(TOPPINGS).toHaveLength(10) })
  it('test_toppings_have_unique_ids', () => {
    expect(new Set(TOPPINGS.map(t => t.id)).size).toBe(TOPPINGS.length)
  })
  it('test_toppings_have_required_fields', () => {
    for (const t of TOPPINGS) {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.emoji).toBeTruthy()
      expect(typeof t.color).toBe('number')
      expect(t.unlockCost).toBeGreaterThanOrEqual(0)
    }
  })
  it('test_first_two_free', () => {
    expect(TOPPINGS[0].unlockCost).toBe(0)
    expect(TOPPINGS[1].unlockCost).toBe(0)
  })
  it('test_costs_increasing', () => {
    for (let i = 2; i < TOPPINGS.length; i++) {
      expect(TOPPINGS[i].unlockCost).toBeGreaterThanOrEqual(TOPPINGS[i - 1].unlockCost)
    }
  })
  it('test_getToppingById_valid', () => {
    expect(getToppingById('syrup').name).toBe('糖浆')
  })
  it('test_getToppingById_invalid_throws', () => {
    expect(() => getToppingById('fake')).toThrow()
  })
  it('test_max_toppings_per_order', () => { expect(MAX_TOPPINGS_PER_ORDER).toBe(3) })
})

// ===== Order Generation =====

describe('generateOrder', () => {
  it('test_order_has_at_least_one_topping', () => {
    const state = createInitialState()
    for (let i = 0; i < 20; i++) {
      const order = generateOrder(1, state.unlockedToppings)
      expect(order.toppings.length).toBeGreaterThanOrEqual(1)
    }
  })
  it('test_order_uses_only_unlocked_toppings', () => {
    const state = createInitialState()
    for (let i = 0; i < 20; i++) {
      const order = generateOrder(1, state.unlockedToppings)
      for (const t of order.toppings) {
        expect(state.unlockedToppings).toContain(t)
      }
    }
  })
  it('test_order_max_toppings_at_high_level', () => {
    const ids = TOPPINGS.map(t => t.id)
    for (let i = 0; i < 20; i++) {
      const order = generateOrder(20, ids)
      expect(order.toppings.length).toBeLessThanOrEqual(MAX_TOPPINGS_PER_ORDER)
    }
  })
  it('test_order_no_duplicate_toppings', () => {
    const ids = TOPPINGS.map(t => t.id)
    for (let i = 0; i < 20; i++) {
      const order = generateOrder(10, ids)
      expect(new Set(order.toppings).size).toBe(order.toppings.length)
    }
  })
})

// ===== Customer Spawning =====

describe('spawnCustomer', () => {
  it('test_spawn_creates_valid_customer', () => {
    const state = createInitialState()
    const c = spawnCustomer(state, 1000)
    expect(c.id).toBeGreaterThan(0)
    expect(c.order.toppings.length).toBeGreaterThanOrEqual(1)
    expect(c.patience).toBeGreaterThan(0)
    expect(c.served).toBe(false)
    expect(c.lost).toBe(false)
  })
  it('test_spawn_adds_to_state', () => {
    const state = createInitialState()
    spawnCustomer(state, 1000)
    expect(state.customers).toHaveLength(1)
  })
  it('test_spawn_increments_id', () => {
    const state = createInitialState()
    const c1 = spawnCustomer(state, 1000)
    const c2 = spawnCustomer(state, 2000)
    expect(c2.id).toBeGreaterThan(c1.id)
  })
  it('test_spawn_interval_decreases_with_level', () => {
    expect(getSpawnInterval(1)).toBeGreaterThan(getSpawnInterval(10))
  })
  it('test_spawn_interval_has_minimum', () => {
    expect(getSpawnInterval(100)).toBeGreaterThanOrEqual(1500)
  })
  it('test_patience_decreases_with_level', () => {
    expect(getPatience(1)).toBeGreaterThan(getPatience(10))
  })
  it('test_patience_has_minimum', () => {
    expect(getPatience(100)).toBeGreaterThanOrEqual(6000)
  })
})

// ===== Waffle Iron =====

describe('waffle iron', () => {
  it('test_startCooking_from_empty', () => {
    const state = createInitialState()
    expect(startCooking(state, 1000)).toBe(true)
    expect(state.waffle.state).toBe('cooking')
  })
  it('test_startCooking_fails_if_not_empty', () => {
    const state = createInitialState()
    startCooking(state, 1000)
    expect(startCooking(state, 2000)).toBe(false)
  })
  it('test_checkWaffleDone_after_cook_time', () => {
    const state = createInitialState()
    startCooking(state, 0)
    expect(checkWaffleDone(state, COOK_TIME - 1)).toBe(false)
    expect(checkWaffleDone(state, COOK_TIME)).toBe(true)
    expect(state.waffle.state).toBe('done')
  })
  it('test_checkWaffleBurned_after_burn_time', () => {
    const state = createInitialState()
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    expect(checkWaffleBurned(state, BURN_TIME - 1)).toBe(false)
    expect(checkWaffleBurned(state, BURN_TIME)).toBe(true)
    expect(state.waffle.state).toBe('burned')
  })
  it('test_discardWaffle_resets_state', () => {
    const state = createInitialState()
    startCooking(state, 0)
    discardWaffle(state)
    expect(state.waffle.state).toBe('empty')
    expect(state.waffle.addedToppings).toEqual([])
  })
})

// ===== Topping Addition =====

describe('addToppingToWaffle', () => {
  it('test_add_topping_to_done_waffle', () => {
    const state = createInitialState()
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    expect(addToppingToWaffle(state, 'syrup')).toBe(true)
    expect(state.waffle.addedToppings).toContain('syrup')
  })
  it('test_add_topping_fails_if_cooking', () => {
    const state = createInitialState()
    startCooking(state, 0)
    expect(addToppingToWaffle(state, 'syrup')).toBe(false)
  })
  it('test_add_topping_fails_if_max', () => {
    const state = createInitialState()
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    addToppingToWaffle(state, 'syrup')
    addToppingToWaffle(state, 'butter')
    addToppingToWaffle(state, 'cream')
    expect(addToppingToWaffle(state, 'strawberry')).toBe(false)
  })
  it('test_add_duplicate_topping_fails', () => {
    const state = createInitialState()
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    addToppingToWaffle(state, 'syrup')
    expect(addToppingToWaffle(state, 'syrup')).toBe(false)
  })
  it('test_add_locked_topping_fails', () => {
    const state = createInitialState()
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    expect(addToppingToWaffle(state, 'gold')).toBe(false)
  })
})

// ===== Order Matching =====

describe('checkOrderMatch', () => {
  it('test_exact_match', () => {
    expect(checkOrderMatch(['syrup', 'butter'], ['syrup', 'butter'])).toBe(true)
  })
  it('test_match_different_order', () => {
    expect(checkOrderMatch(['butter', 'syrup'], ['syrup', 'butter'])).toBe(true)
  })
  it('test_mismatch_different_toppings', () => {
    expect(checkOrderMatch(['syrup'], ['butter'])).toBe(false)
  })
  it('test_mismatch_different_count', () => {
    expect(checkOrderMatch(['syrup'], ['syrup', 'butter'])).toBe(false)
  })
  it('test_empty_matches_empty', () => {
    expect(checkOrderMatch([], [])).toBe(true)
  })
})

// ===== Serving =====

describe('serveToCustomer', () => {
  it('test_serve_success', () => {
    const state = createInitialState()
    const customer = spawnCustomer(state, 0)
    customer.order.toppings = ['syrup']
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    addToppingToWaffle(state, 'syrup')
    const result = serveToCustomer(state, customer.id, COOK_TIME + 1000)
    expect(result).not.toBeNull()
    expect(result!.success).toBe(true)
    expect(result!.points).toBeGreaterThan(0)
    expect(customer.served).toBe(true)
    expect(state.score).toBeGreaterThan(0)
  })
  it('test_serve_fails_wrong_toppings', () => {
    const state = createInitialState()
    const customer = spawnCustomer(state, 0)
    customer.order.toppings = ['butter']
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    addToppingToWaffle(state, 'syrup')
    const result = serveToCustomer(state, customer.id, COOK_TIME + 1000)
    expect(result!.success).toBe(false)
  })
  it('test_serve_fails_if_not_done', () => {
    const state = createInitialState()
    const customer = spawnCustomer(state, 0)
    startCooking(state, 0)
    const result = serveToCustomer(state, customer.id, 500)
    expect(result).toBeNull()
  })
  it('test_serve_fails_already_served', () => {
    const state = createInitialState()
    const customer = spawnCustomer(state, 0)
    customer.order.toppings = ['syrup']
    customer.served = true
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    addToppingToWaffle(state, 'syrup')
    const result = serveToCustomer(state, customer.id, COOK_TIME + 1000)
    expect(result).toBeNull()
  })
  it('test_serve_clears_waffle', () => {
    const state = createInitialState()
    const customer = spawnCustomer(state, 0)
    customer.order.toppings = ['syrup']
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    addToppingToWaffle(state, 'syrup')
    serveToCustomer(state, customer.id, COOK_TIME + 1000)
    expect(state.waffle.state).toBe('empty')
  })
  it('test_perfect_serve_doubles_points', () => {
    const state = createInitialState()
    const customer = spawnCustomer(state, 0)
    customer.order.toppings = ['syrup']
    customer.patience = 20000
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    addToppingToWaffle(state, 'syrup')
    const result = serveToCustomer(state, customer.id, COOK_TIME + 500) // fast serve
    expect(result!.perfect).toBe(true)
    expect(result!.points).toBeGreaterThanOrEqual(20)
  })
  it('test_combo_increments_on_perfect', () => {
    const state = createInitialState()
    const c1 = spawnCustomer(state, 0)
    c1.order.toppings = ['syrup']
    c1.patience = 20000
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    addToppingToWaffle(state, 'syrup')
    serveToCustomer(state, c1.id, COOK_TIME + 500)
    expect(state.combo).toBe(1)
    expect(state.maxCombo).toBe(1)
  })
  it('test_combo_resets_on_non_perfect', () => {
    const state = createInitialState()
    state.combo = 5
    const customer = spawnCustomer(state, 0)
    customer.order.toppings = ['syrup']
    customer.patience = 5000
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    addToppingToWaffle(state, 'syrup')
    serveToCustomer(state, customer.id, COOK_TIME + 10000) // slow → not perfect
    expect(state.combo).toBe(0)
  })
  it('test_serve_increments_counters', () => {
    const state = createInitialState()
    const customer = spawnCustomer(state, 0)
    customer.order.toppings = ['syrup']
    startCooking(state, 0)
    checkWaffleDone(state, COOK_TIME)
    addToppingToWaffle(state, 'syrup')
    serveToCustomer(state, customer.id, COOK_TIME + 1000)
    expect(state.totalServed).toBe(1)
    expect(state.customersServedThisLevel).toBe(1)
  })
})

// ===== Customer Patience =====

describe('updateCustomerPatience', () => {
  it('test_no_loss_when_patience_valid', () => {
    const state = createInitialState()
    spawnCustomer(state, 0)
    expect(updateCustomerPatience(state, 1000)).toBe(0)
    expect(state.lives).toBe(MAX_LIVES)
  })
  it('test_loses_life_on_timeout', () => {
    const state = createInitialState()
    spawnCustomer(state, 0)
    const lost = updateCustomerPatience(state, PATIENCE_BASE + 1000)
    expect(lost).toBe(1)
    expect(state.lives).toBe(MAX_LIVES - 1)
  })
  it('test_game_over_when_no_lives', () => {
    const state = createInitialState()
    state.lives = 1
    spawnCustomer(state, 0)
    updateCustomerPatience(state, PATIENCE_BASE + 1000)
    expect(state.gameOver).toBe(true)
  })
  it('test_ignores_served_customers', () => {
    const state = createInitialState()
    const c = spawnCustomer(state, 0)
    c.served = true
    expect(updateCustomerPatience(state, PATIENCE_BASE + 1000)).toBe(0)
  })
})

// ===== Topping Unlock =====

describe('unlockTopping', () => {
  it('test_can_unlock_when_affordable', () => {
    const state = createInitialState()
    state.coins = 100
    state.level = 5
    expect(canUnlockTopping(state, 'cream')).toBe(true)
  })
  it('test_cannot_unlock_insufficient_coins', () => {
    const state = createInitialState()
    state.coins = 10
    state.level = 5
    expect(canUnlockTopping(state, 'cream')).toBe(false)
  })
  it('test_cannot_unlock_insufficient_level', () => {
    const state = createInitialState()
    state.coins = 100
    state.level = 1
    expect(canUnlockTopping(state, 'cream')).toBe(false)
  })
  it('test_cannot_unlock_already_unlocked', () => {
    const state = createInitialState()
    expect(canUnlockTopping(state, 'syrup')).toBe(false)
  })
  it('test_unlock_deducts_coins', () => {
    const state = createInitialState()
    state.coins = 100
    state.level = 5
    expect(unlockTopping(state, 'cream')).toBe(true)
    expect(state.coins).toBe(50)
    expect(state.unlockedToppings).toContain('cream')
  })
})

// ===== Scoring =====

describe('scoring', () => {
  it('test_base_score', () => { expect(calculateScore(0, false, 0)).toBe(10) })
  it('test_perfect_doubles', () => { expect(calculateScore(0, true, 0)).toBe(20) })
  it('test_time_bonus_adds', () => { expect(calculateScore(50, false, 0)).toBe(60) })
  it('test_combo_bonus_adds', () => { expect(calculateScore(0, false, 3)).toBe(16) })
  it('test_coins_minimum_1', () => { expect(calculateCoins(1)).toBe(1) })
  it('test_coins_formula', () => { expect(calculateCoins(30)).toBe(10) })
})

// ===== Level Config =====

describe('level config', () => {
  it('test_customers_needed_increases', () => {
    expect(getCustomersNeeded(5)).toBeGreaterThan(getCustomersNeeded(1))
  })
  it('test_customers_needed_base', () => {
    expect(getCustomersNeeded(1)).toBe(5)
  })
})

// ===== Save/Load =====

describe('save/load', () => {
  beforeEach(() => { localStorage.clear() })

  it('test_loadGame_null_when_empty', () => { expect(loadGame()).toBeNull() })
  it('test_roundtrip', () => {
    const state = createInitialState()
    state.score = 42
    state.coins = 99
    saveGame(state)
    const loaded = loadGame()!
    expect(loaded.score).toBe(42)
    expect(loaded.coins).toBe(99)
  })
  it('test_corrupted_json', () => {
    localStorage.setItem('waffle-wobble-save', 'NOT_JSON')
    expect(loadGame()).toBeNull()
  })
  it('test_resetSave', () => {
    saveGame(createInitialState())
    resetSave()
    expect(loadGame()).toBeNull()
  })
})

// ===== Initial State =====

describe('createInitialState', () => {
  it('test_default_values', () => {
    const s = createInitialState()
    expect(s.score).toBe(0)
    expect(s.coins).toBe(0)
    expect(s.lives).toBe(MAX_LIVES)
    expect(s.level).toBe(1)
    expect(s.gameOver).toBe(false)
    expect(s.combo).toBe(0)
    expect(s.waffle.state).toBe('empty')
    expect(s.customers).toEqual([])
    expect(s.unlockedToppings).toContain('syrup')
    expect(s.unlockedToppings).toContain('butter')
    expect(s.unlockedToppings).toHaveLength(2)
  })
})

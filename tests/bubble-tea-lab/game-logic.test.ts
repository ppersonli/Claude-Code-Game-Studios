import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Ingredient } from '../../src/types'
import {
  calculateServeResult,
  generateOrder,
  getDailyModifier,
  createInitialState,
  startStandardGame,
  startDailyGame,
  nextCustomer,
  addToCup,
  serveDrink,
  resetCup,
  endGame,
  unlockItem,
  checkAchievements,
  clearTimer,
  addFloatText,
  addScorePopup,
  INGREDIENTS,
  CUSTOMERS,
  isIngredientUnlocked,
  isCustomerUnlocked,
} from '../../src/games/bubble-tea-lab/composables/useGameState'
import type { BubbleTeaLabState } from '../../src/games/bubble-tea-lab/composables/useGameState'
import { DAILY_MODIFIERS } from '../../src/games/bubble-tea-lab/data/daily-challenge'

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
const blackTea = INGREDIENTS.find(i => i.id === 'black_tea')!
const milk = INGREDIENTS.find(i => i.id === 'milk')!
const coconut = INGREDIENTS.find(i => i.id === 'coconut')!
const boba = INGREDIENTS.find(i => i.id === 'boba')!
const ice = INGREDIENTS.find(i => i.id === 'ice')!
const taro = INGREDIENTS.find(i => i.id === 'taro')!

describe('calculateServeResult', () => {
  it('test_serveResult_perfect_serve_returns_correct_score', () => {
    const order: Ingredient[] = [greenTea, milk]
    const cup: Ingredient[] = [greenTea, milk]
    const result = calculateServeResult(order, cup, 0)
    expect(result.matches).toBe(2)
    expect(result.wrong).toBe(0)
    expect(result.isPerfect).toBe(true)
    expect(result.points).toBeGreaterThan(0)
    expect(result.newCombo).toBe(1)
    expect(result.orderUsed).toEqual([true, true])
    expect(result.cupUsed).toEqual([true, true])
  })

  it('test_serveResult_partial_match_returns_correct_score', () => {
    const order: Ingredient[] = [greenTea, milk]
    const cup: Ingredient[] = [greenTea, boba]
    const result = calculateServeResult(order, cup, 0)
    expect(result.matches).toBe(1)
    expect(result.wrong).toBe(1)
    expect(result.isPerfect).toBe(false)
    expect(result.newCombo).toBe(0)
    // 10 - 5 = 5
    expect(result.points).toBe(5)
  })

  it('test_serveResult_no_match_returns_zero_points', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = [boba]
    const result = calculateServeResult(order, cup, 0)
    expect(result.matches).toBe(0)
    expect(result.wrong).toBe(1)
    expect(result.isPerfect).toBe(false)
    expect(result.points).toBe(0)
  })

  it('test_serveResult_combo_increments_on_perfect', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = [greenTea]
    const result = calculateServeResult(order, cup, 3)
    expect(result.newCombo).toBe(4)
  })

  it('test_serveResult_combo_resets_on_non_perfect', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = [boba]
    const result = calculateServeResult(order, cup, 5)
    expect(result.newCombo).toBe(0)
  })

  it('test_serveResult_applies_tip_bonus', () => {
    const order: Ingredient[] = [greenTea, milk]
    const cup: Ingredient[] = [greenTea, milk]
    const withTip = calculateServeResult(order, cup, 0, { tipBonus: 2.0 })
    const withoutTip = calculateServeResult(order, cup, 0, { tipBonus: 1 })
    expect(withTip.points).toBeGreaterThan(withoutTip.points)
  })

  it('test_serveResult_applies_daily_multiplier', () => {
    const order: Ingredient[] = [greenTea, milk]
    const cup: Ingredient[] = [greenTea, milk]
    const modifier = DAILY_MODIFIERS.find(m => m.scoreMultiplier > 1)!
    const withDaily = calculateServeResult(order, cup, 0, { isDaily: true, dailyModifier: modifier })
    const withoutDaily = calculateServeResult(order, cup, 0)
    expect(withDaily.points).toBeGreaterThanOrEqual(withoutDaily.points)
  })

  it('test_serveResult_never_returns_negative_points', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = [boba, ice, milk, greenTea, boba, ice]
    const result = calculateServeResult(order, cup, 0)
    expect(result.points).toBeGreaterThanOrEqual(0)
  })

  it('test_serveResult_handles_empty_cup', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = []
    const result = calculateServeResult(order, cup, 0)
    expect(result.matches).toBe(0)
    expect(result.wrong).toBe(0)
    expect(result.isPerfect).toBe(false)
  })

  it('test_serveResult_handles_empty_order', () => {
    const order: Ingredient[] = []
    const cup: Ingredient[] = [greenTea]
    const result = calculateServeResult(order, cup, 0)
    expect(result.matches).toBe(0)
    expect(result.wrong).toBe(1)
    expect(result.isPerfect).toBe(false)
  })

  it('test_serveResult_combo_multiplier_tiers_increasing', () => {
    const order: Ingredient[] = [greenTea]
    const cup: Ingredient[] = [greenTea]
    // combo 0 -> 1 (1x multiplier)
    const r1 = calculateServeResult(order, cup, 0)
    // combo 3 -> 4 (1.5x multiplier tier)
    const r4 = calculateServeResult(order, cup, 3)
    // combo 7 -> 8 (3x multiplier tier)
    const r8 = calculateServeResult(order, cup, 7)
    expect(r4.points).toBeGreaterThan(r1.points)
    expect(r8.points).toBeGreaterThan(r4.points)
  })

  it('test_serveResult_matches_ingredients_one_to_one', () => {
    // Cup has 2 boba but order has 1 boba — should only match 1
    const order: Ingredient[] = [boba]
    const cup: Ingredient[] = [boba, boba]
    const result = calculateServeResult(order, cup, 0)
    expect(result.matches).toBe(1)
    expect(result.wrong).toBe(1)
  })
})

describe('generateOrder', () => {
  it('test_generateOrder_level1_returns_2_items', () => {
    const order = generateOrder(1, [])
    expect(order).toHaveLength(2)
  })

  it('test_generateOrder_level5_returns_4_items', () => {
    const order = generateOrder(5, [])
    expect(order).toHaveLength(4)
  })

  it('test_generateOrder_high_level_caps_at_5', () => {
    const order = generateOrder(10, [])
    expect(order).toHaveLength(5)
  })

  it('test_generateOrder_returns_unique_ingredients', () => {
    const order = generateOrder(5, [])
    const ids = order.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('test_generateOrder_only_uses_unlocked_ingredients', () => {
    const order = generateOrder(1, [])
    for (const ing of order) {
      expect(ing.locked).toBeFalsy()
    }
  })

  it('test_generateOrder_can_include_unlocked_premium', () => {
    let found = false
    for (let i = 0; i < 50; i++) {
      const order = generateOrder(10, ['taro'])
      if (order.some(o => o.id === 'taro')) { found = true; break }
    }
    expect(found).toBe(true)
  })
})

describe('getDailyModifier', () => {
  it('test_getDailyModifier_returns_modifier_from_list', () => {
    const modifier = getDailyModifier(20260115)
    expect(DAILY_MODIFIERS).toContain(modifier)
  })

  it('test_getDailyModifier_is_deterministic', () => {
    const m1 = getDailyModifier(20260115)
    const m2 = getDailyModifier(20260115)
    expect(m1.name).toBe(m2.name)
  })

  it('test_getDailyModifier_different_seeds_can_differ', () => {
    const modifiers = new Set<string>()
    for (let seed = 20260101; seed <= 20260110; seed++) {
      modifiers.add(getDailyModifier(seed).name)
    }
    // With 10 seeds and 5 modifiers, we should see at least 2 different ones
    expect(modifiers.size).toBeGreaterThanOrEqual(2)
  })
})

describe('re-exports', () => {
  it('test_reExport_isIngredientUnlocked_works', () => {
    expect(isIngredientUnlocked(greenTea, [])).toBe(true)
    expect(isIngredientUnlocked(taro, [])).toBe(false)
    expect(isIngredientUnlocked(taro, ['taro'])).toBe(true)
  })

  it('test_reExport_isCustomerUnlocked_works', () => {
    const girl = CUSTOMERS.find(c => c.name === '小美')!
    const catgirl = CUSTOMERS.find(c => c.name === '猫猫酱')!
    expect(isCustomerUnlocked(girl, [])).toBe(true)
    expect(isCustomerUnlocked(catgirl, [])).toBe(false)
    expect(isCustomerUnlocked(catgirl, ['猫猫酱'])).toBe(true)
  })
})

describe('createInitialState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_initialState_returns_correct_defaults', () => {
    const state = createInitialState()
    expect(state.score).toBe(0)
    expect(state.level).toBe(1)
    expect(state.combo).toBe(0)
    expect(state.maxCombo).toBe(0)
    expect(state.perfectCount).toBe(0)
    expect(state.drinksServed).toBe(0)
    expect(state.customersServed).toBe(0)
    expect(state.maxCustomers).toBe(10)
    expect(state.cupContents).toEqual([])
    expect(state.currentOrder).toEqual([])
    expect(state.currentCustomer).toBeNull()
    expect(state.gameOver).toBe(false)
    expect(state.serving).toBe(false)
    expect(state.isDaily).toBe(false)
    expect(state.adPlaying).toBe(false)
  })

  it('test_initialState_loads_coins_from_storage', () => {
    localStorage.setItem('btlab_coins', '500')
    const state = createInitialState()
    expect(state.totalCoins).toBe(500)
    expect(state.coins).toBe(500)
  })

  it('test_initialState_loads_drinks_from_storage', () => {
    localStorage.setItem('btlab_total_drinks', '25')
    const state = createInitialState()
    expect(state.totalDrinksServed).toBe(25)
  })

  it('test_initialState_loads_achievements_from_storage', () => {
    localStorage.setItem('btlab_achievements', '["combo5"]')
    const state = createInitialState()
    expect(state.achievements).toContain('combo5')
  })

  it('test_initialState_loads_unlocked_ingredients', () => {
    localStorage.setItem('btlab_unlocked_ingredients', '["taro"]')
    const state = createInitialState()
    expect(state.unlockedIngredients).toContain('taro')
  })

  it('test_initialState_loads_unlocked_customers', () => {
    localStorage.setItem('btlab_unlocked_customers', '["猫猫酱"]')
    const state = createInitialState()
    expect(state.unlockedCustomers).toContain('猫猫酱')
  })

  it('test_initialState_handles_corrupted_json_gracefully', () => {
    localStorage.setItem('btlab_achievements', 'NOT_JSON')
    localStorage.setItem('btlab_unlocked_ingredients', '{broken')
    localStorage.setItem('btlab_unlocked_customers', '???')
    const state = createInitialState()
    expect(state.achievements).toEqual([])
    expect(state.unlockedIngredients).toEqual([])
    expect(state.unlockedCustomers).toEqual([])
  })

  it('test_initialState_handles_corrupted_int_gracefully', () => {
    localStorage.setItem('btlab_coins', 'NaN')
    const state = createInitialState()
    expect(state.totalCoins).toBeNaN()
  })

  it('test_initialState_sets_totalCustomers_alias', () => {
    const state = createInitialState()
    expect(state.totalCustomers).toBe(state.maxCustomers)
  })
})

describe('startStandardGame', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_startStandardGame_resets_session_state', () => {
    const state = createInitialState()
    state.score = 100
    state.level = 5
    state.combo = 3
    state.maxCombo = 5
    state.perfectCount = 2
    state.drinksServed = 8
    startStandardGame(state)
    expect(state.score).toBe(0)
    expect(state.level).toBe(1)
    expect(state.combo).toBe(0)
    expect(state.maxCombo).toBe(0)
    expect(state.perfectCount).toBe(0)
    expect(state.drinksServed).toBe(0)
    expect(state.customersServed).toBe(0)
    expect(state.maxCustomers).toBe(10)
    expect(state.isDaily).toBe(false)
    expect(state.gameOver).toBe(false)
    expect(state.serving).toBe(false)
    expect(state.cupContents).toEqual([])
    expect(state.currentOrder).toEqual([])
    expect(state.currentCustomer).toBeNull()
    expect(state.totalCustomers).toBe(10)
  })

  it('test_startStandardGame_preserves_persistent_state', () => {
    const state = createInitialState()
    state.totalCoins = 500
    state.totalDrinksServed = 30
    state.achievements = ['combo5']
    state.unlockedIngredients = ['taro']
    startStandardGame(state)
    expect(state.totalCoins).toBe(500)
    expect(state.totalDrinksServed).toBe(30)
    expect(state.achievements).toContain('combo5')
    expect(state.unlockedIngredients).toContain('taro')
  })
})

describe('startDailyGame', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_startDailyGame_sets_daily_mode', () => {
    const state = createInitialState()
    const modifier = DAILY_MODIFIERS[0]
    startDailyGame(state, modifier)
    expect(state.isDaily).toBe(true)
    expect(state.dailyTimer).toBe(modifier.timeLimit)
    expect(state.dailyModifier).toBe(modifier)
    expect(state.maxCustomers).toBe(999)
    expect(state.totalCustomers).toBe(999)
    expect(state.dailyCompleted).toBe(false)
    expect(state.dailyGoalProgress).toBe(0)
  })

  it('test_startDailyGame_resets_session_state', () => {
    const state = createInitialState()
    state.score = 100
    state.level = 5
    startDailyGame(state, DAILY_MODIFIERS[0])
    expect(state.score).toBe(0)
    expect(state.level).toBe(1)
    expect(state.combo).toBe(0)
    expect(state.gameOver).toBe(false)
  })
})

describe('nextCustomer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_nextCustomer_sets_order_and_customer', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    expect(state.currentOrder.length).toBeGreaterThan(0)
    expect(state.currentCustomer).not.toBeNull()
    expect(state.cupContents).toEqual([])
    expect(state.customerMood).toBe('neutral')
  })

  it('test_nextCustomer_sets_gameOver_when_maxReached', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.customersServed = 10
    nextCustomer(state)
    expect(state.gameOver).toBe(true)
  })

  it('test_nextCustomer_does_not_set_gameOver_when_under_max', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.customersServed = 9
    nextCustomer(state)
    expect(state.gameOver).toBe(false)
  })
})

describe('addToCup', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_addToCup_adds_ingredient_to_cup', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    const result = addToCup(state, greenTea)
    expect(result).toBe(true)
    expect(state.cupContents).toHaveLength(1)
    expect(state.cupContents[0].id).toBe('green_tea')
  })

  it('test_addToCup_returns_false_when_full', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    for (let i = 0; i < 6; i++) addToCup(state, greenTea)
    expect(addToCup(state, milk)).toBe(false)
    expect(state.cupContents).toHaveLength(6)
  })

  it('test_addToCup_allows_six_items_max', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    const items = [greenTea, blackTea, milk, coconut, boba, ice]
    for (const item of items) {
      expect(addToCup(state, item)).toBe(true)
    }
    expect(state.cupContents).toHaveLength(6)
    expect(addToCup(state, greenTea)).toBe(false)
  })
})

describe('resetCup', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_resetCup_clears_cup_contents', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    addToCup(state, greenTea)
    addToCup(state, milk)
    resetCup(state)
    expect(state.cupContents).toEqual([])
  })
})

describe('serveDrink', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_serveDrink_returns_null_for_empty_cup', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    expect(serveDrink(state)).toBeNull()
  })

  it('test_serveDrink_returns_null_when_already_serving', () => {
    const state = createInitialState()
    startStandardGame(state)
    nextCustomer(state)
    addToCup(state, greenTea)
    state.serving = true
    expect(serveDrink(state)).toBeNull()
  })

  it('test_serveDrink_processes_perfect_serve', () => {
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
    expect(state.combo).toBe(1)
    expect(state.perfectCount).toBe(1)
    expect(state.customerMood).toBe('happy')
    expect(state.serving).toBe(true)
  })

  it('test_serveDrink_processes_imperfect_serve', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.currentOrder = [greenTea]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }
    addToCup(state, boba)
    const result = serveDrink(state)
    expect(result).not.toBeNull()
    expect(result!.isPerfect).toBe(false)
    expect(state.combo).toBe(0)
    expect(state.customerMood).toBe('sad')
  })

  it('test_serveDrink_increments_combo_on_consecutive_perfects', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }

    state.currentOrder = [greenTea]
    addToCup(state, greenTea)
    serveDrink(state)
    expect(state.combo).toBe(1)

    state.cupContents = []
    state.serving = false
    state.currentOrder = [milk]
    addToCup(state, milk)
    serveDrink(state)
    expect(state.combo).toBe(2)
  })

  it('test_serveDrink_resets_combo_on_imperfect', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.combo = 5
    state.currentOrder = [greenTea]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }
    addToCup(state, boba)
    serveDrink(state)
    expect(state.combo).toBe(0)
  })

  it('test_serveDrink_tracks_max_combo', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }

    state.currentOrder = [greenTea]
    addToCup(state, greenTea)
    serveDrink(state)
    expect(state.maxCombo).toBe(1)

    state.cupContents = []
    state.serving = false
    state.currentOrder = [milk]
    addToCup(state, milk)
    serveDrink(state)
    expect(state.maxCombo).toBe(2)
  })

  it('test_serveDrink_applies_tip_bonus_from_customer', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.currentOrder = [greenTea, milk]
    state.currentCustomer = { name: 'VIP大人', img: '', rarity: 'legendary', tipBonus: 2.0 }
    addToCup(state, greenTea)
    addToCup(state, milk)
    const withTip = serveDrink(state)!

    const state2 = createInitialState()
    startStandardGame(state2)
    state2.currentOrder = [greenTea, milk]
    state2.currentCustomer = { name: '小美', img: '', rarity: 'common' }
    addToCup(state2, greenTea)
    addToCup(state2, milk)
    const withoutTip = serveDrink(state2)!

    expect(withTip.points).toBeGreaterThan(withoutTip.points)
  })

  it('test_serveDrink_level_up_occurs_every_3_serves', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }

    for (let i = 0; i < 3; i++) {
      state.cupContents = []
      state.serving = false
      state.currentOrder = [greenTea]
      addToCup(state, greenTea)
      serveDrink(state)
      if (i < 2) nextCustomer(state)
    }
    expect(state.level).toBe(2)
  })

  it('test_serveDrink_daily_level_up_occurs_every_2_serves', () => {
    const state = createInitialState()
    startDailyGame(state, DAILY_MODIFIERS[0])
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }

    for (let i = 0; i < 2; i++) {
      state.cupContents = []
      state.serving = false
      state.currentOrder = [greenTea]
      addToCup(state, greenTea)
      serveDrink(state)
      if (i < 1) nextCustomer(state)
    }
    expect(state.level).toBe(2)
  })

  it('test_serveDrink_triggers_screen_shake_at_combo_5', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.combo = 4
    state.currentOrder = [greenTea]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }
    addToCup(state, greenTea)
    serveDrink(state)
    expect(state.combo).toBe(5)
    expect(state.screenShake).toBe(true)
  })

  it('test_serveDrink_daily_goal_tracking_perfect', () => {
    const modifier = DAILY_MODIFIERS.find(m => m.goal?.type === 'perfect')!
    const state = createInitialState()
    startDailyGame(state, modifier)
    state.currentOrder = [greenTea]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }
    addToCup(state, greenTea)
    serveDrink(state)
    expect(state.dailyGoalProgress).toBe(1)
  })

  it('test_serveDrink_daily_goal_tracking_combo', () => {
    const modifier = DAILY_MODIFIERS.find(m => m.goal?.type === 'combo')!
    const state = createInitialState()
    startDailyGame(state, modifier)
    state.combo = 4
    state.currentOrder = [greenTea]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }
    addToCup(state, greenTea)
    serveDrink(state)
    expect(state.dailyGoalProgress).toBe(5)
  })

  it('test_serveDrink_daily_goal_tracking_level', () => {
    const modifier = DAILY_MODIFIERS.find(m => m.goal?.type === 'level')!
    const state = createInitialState()
    startDailyGame(state, modifier)
    state.level = 3
    state.currentOrder = [greenTea]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }
    addToCup(state, greenTea)
    serveDrink(state)
    expect(state.dailyGoalProgress).toBe(3)
  })

  it('test_serveDrink_daily_goal_tracking_score', () => {
    const modifier = DAILY_MODIFIERS.find(m => m.goal?.type === 'score')!
    const state = createInitialState()
    startDailyGame(state, modifier)
    state.currentOrder = [greenTea]
    state.currentCustomer = { name: 'test', img: '', rarity: 'common' }
    addToCup(state, greenTea)
    const result = serveDrink(state)!
    expect(state.dailyGoalProgress).toBe(result.points)
  })
})

describe('endGame', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_endGame_persists_coins_and_drinks', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.score = 50
    state.totalDrinksServed = 10
    endGame(state)
    expect(state.totalCoins).toBe(50)
    expect(state.coins).toBe(50)
    expect(state.gameOver).toBe(true)
    expect(localStorage.getItem('btlab_coins')).toBe('50')
    expect(localStorage.getItem('btlab_total_drinks')).toBe('10')
  })

  it('test_endGame_persists_achievements', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.achievements = ['combo5', 'first_perfect']
    endGame(state)
    const saved = JSON.parse(localStorage.getItem('btlab_achievements')!)
    expect(saved).toContain('combo5')
    expect(saved).toContain('first_perfect')
  })

  it('test_endGame_persists_unlocked_items', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.unlockedIngredients = ['taro']
    state.unlockedCustomers = ['猫猫酱']
    endGame(state)
    expect(JSON.parse(localStorage.getItem('btlab_unlocked_ingredients')!)).toContain('taro')
    expect(JSON.parse(localStorage.getItem('btlab_unlocked_customers')!)).toContain('猫猫酱')
  })

  it('test_endGame_daily_completion_awards_bonus', () => {
    const modifier = DAILY_MODIFIERS.find(m => m.goal?.type === 'perfect')!
    const state = createInitialState()
    startDailyGame(state, modifier)
    state.score = 100
    state.dailyGoalProgress = 3 // meets goal of 3
    endGame(state)
    // 200 bonus + 100 score
    expect(state.totalCoins).toBe(300)
  })

  it('test_endGame_daily_no_bonus_when_goal_not_met', () => {
    const modifier = DAILY_MODIFIERS.find(m => m.goal?.type === 'perfect')!
    const state = createInitialState()
    startDailyGame(state, modifier)
    state.score = 100
    state.dailyGoalProgress = 1 // goal is 3
    endGame(state)
    expect(state.totalCoins).toBe(100)
  })

  it('test_endGame_standard_mode_no_daily_bonus', () => {
    const state = createInitialState()
    startStandardGame(state)
    state.score = 100
    endGame(state)
    expect(state.totalCoins).toBe(100)
  })
})

describe('unlockItem', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_unlockItem_deducts_coins_and_adds_ingredient', () => {
    const state = createInitialState()
    state.totalCoins = 500
    const result = unlockItem(state, 'ingredient', 'taro', 100)
    expect(result).toBe(true)
    expect(state.totalCoins).toBe(400)
    expect(state.coins).toBe(400)
    expect(state.unlockedIngredients).toContain('taro')
  })

  it('test_unlockItem_deducts_coins_and_adds_customer', () => {
    const state = createInitialState()
    state.totalCoins = 1000
    const result = unlockItem(state, 'customer', '猫猫酱', 500)
    expect(result).toBe(true)
    expect(state.totalCoins).toBe(500)
    expect(state.unlockedCustomers).toContain('猫猫酱')
  })

  it('test_unlockItem_returns_false_insufficient_coins', () => {
    const state = createInitialState()
    state.totalCoins = 50
    const result = unlockItem(state, 'ingredient', 'taro', 100)
    expect(result).toBe(false)
    expect(state.totalCoins).toBe(50)
    expect(state.unlockedIngredients).not.toContain('taro')
  })

  it('test_unlockItem_exact_coins_succeeds', () => {
    const state = createInitialState()
    state.totalCoins = 100
    const result = unlockItem(state, 'ingredient', 'taro', 100)
    expect(result).toBe(true)
    expect(state.totalCoins).toBe(0)
  })
})

describe('checkAchievements', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_checkAchievements_unlocks_first_perfect', () => {
    const state = createInitialState()
    state.perfectCount = 1
    const newlyUnlocked = checkAchievements(state)
    expect(newlyUnlocked).toContain('first_perfect')
    expect(state.achievements).toContain('first_perfect')
  })

  it('test_checkAchievements_unlocks_combo5', () => {
    const state = createInitialState()
    state.maxCombo = 5
    const newlyUnlocked = checkAchievements(state)
    expect(newlyUnlocked).toContain('combo5')
  })

  it('test_checkAchievements_unlocks_multiple', () => {
    const state = createInitialState()
    state.perfectCount = 5
    state.maxCombo = 10
    state.level = 5
    state.score = 500
    const newlyUnlocked = checkAchievements(state)
    expect(newlyUnlocked.length).toBeGreaterThanOrEqual(4)
  })

  it('test_checkAchievements_does_not_duplicate', () => {
    const state = createInitialState()
    state.achievements = ['combo5']
    state.maxCombo = 5
    const newlyUnlocked = checkAchievements(state)
    expect(newlyUnlocked).not.toContain('combo5')
    expect(state.achievements.filter(a => a === 'combo5')).toHaveLength(1)
  })

  it('test_checkAchievements_returns_empty_when_none_new', () => {
    const state = createInitialState()
    const newlyUnlocked = checkAchievements(state)
    expect(newlyUnlocked).toEqual([])
  })

  it('test_checkAchievements_serve50_checks_total', () => {
    const state = createInitialState()
    state.totalDrinksServed = 50
    const newlyUnlocked = checkAchievements(state)
    expect(newlyUnlocked).toContain('serve50')
  })

  it('test_checkAchievements_daily_complete', () => {
    const state = createInitialState()
    state.dailyCompleted = true
    const newlyUnlocked = checkAchievements(state)
    expect(newlyUnlocked).toContain('daily_complete')
  })

  it('test_checkAchievements_unlock_all_ingredients', () => {
    const state = createInitialState()
    state.unlockedIngredients = ['taro', 'grass_jelly', 'mochi', 'popping_boba', 'cream']
    const newlyUnlocked = checkAchievements(state)
    expect(newlyUnlocked).toContain('unlock_all_ingredients')
  })
})

describe('clearTimer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('test_clearTimer_clears_interval', () => {
    const state = createInitialState()
    const id = setInterval(() => {}, 1000) as unknown as ReturnType<typeof setInterval>
    state.dailyTimerId = id
    const spy = vi.spyOn(globalThis, 'clearInterval')
    clearTimer(state)
    expect(spy).toHaveBeenCalledWith(id)
    expect(state.dailyTimerId).toBeNull()
  })

  it('test_clearTimer_noop_when_no_timer', () => {
    const state = createInitialState()
    state.dailyTimerId = null
    expect(() => clearTimer(state)).not.toThrow()
  })
})

describe('effect helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_addFloatText_adds_and_removes_after_timeout', () => {
    vi.useFakeTimers()
    const state = createInitialState()
    addFloatText(state, 'test', '#ff0000')
    expect(state.floatTexts).toHaveLength(1)
    expect(state.floatTexts[0].text).toBe('test')
    expect(state.floatTexts[0].color).toBe('#ff0000')
    vi.advanceTimersByTime(1000)
    expect(state.floatTexts).toHaveLength(0)
    vi.useRealTimers()
  })

  it('test_addScorePopup_adds_and_removes_after_timeout', () => {
    vi.useFakeTimers()
    const state = createInitialState()
    addScorePopup(state, '+50', '#ffd700')
    expect(state.scorePopups).toHaveLength(1)
    expect(state.scorePopups[0].text).toBe('+50')
    vi.advanceTimersByTime(1200)
    expect(state.scorePopups).toHaveLength(0)
    vi.useRealTimers()
  })

  it('test_addFloatText_assigns_unique_ids', () => {
    const state = createInitialState()
    addFloatText(state, 'a', '#fff')
    addFloatText(state, 'b', '#fff')
    expect(state.floatTexts[0].id).not.toBe(state.floatTexts[1].id)
  })
})

describe('full game flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_fullFlow_standard_game_play_through', () => {
    const state = createInitialState()
    startStandardGame(state)
    expect(state.gameOver).toBe(false)

    // Play 2 rounds
    for (let i = 0; i < 2; i++) {
      nextCustomer(state)
      expect(state.currentCustomer).not.toBeNull()
      expect(state.currentOrder.length).toBeGreaterThan(0)

      // Match the order exactly
      for (const ing of state.currentOrder) {
        addToCup(state, ing)
      }
      const result = serveDrink(state)
      expect(result).not.toBeNull()
      expect(result!.isPerfect).toBe(true)
      expect(state.customerMood).toBe('happy')
    }

    expect(state.drinksServed).toBe(2)
    expect(state.perfectCount).toBe(2)
    expect(state.combo).toBe(2)
    expect(state.score).toBeGreaterThan(0)
  })

  it('test_fullFlow_game_ends_after_10_customers', () => {
    const state = createInitialState()
    startStandardGame(state)

    for (let i = 0; i < 10; i++) {
      nextCustomer(state)
      if (state.gameOver) break
      addToCup(state, state.currentOrder[0])
      serveDrink(state)
      state.cupContents = []
      state.serving = false
    }
    // After serving 10, next nextCustomer should trigger gameOver
    nextCustomer(state)
    expect(state.gameOver).toBe(true)
  })

  it('test_fullFlow_coins_accumulate_across_games', () => {
    const state = createInitialState()
    // Game 1
    startStandardGame(state)
    state.score = 50
    endGame(state)
    expect(state.totalCoins).toBe(50)

    // Game 2
    startStandardGame(state)
    state.score = 30
    endGame(state)
    expect(state.totalCoins).toBe(80)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RECIPES, getRecipeById } from '../../src/games/bubble-tea-idle/data/recipes'
import { EQUIPMENT, getEquipmentCost, getEquipmentMultiplier } from '../../src/games/bubble-tea-idle/data/equipment'
import { STAFF, getStaffCost, getStaffCps } from '../../src/games/bubble-tea-idle/data/staff'
import { LOCATIONS, getLocationById } from '../../src/games/bubble-tea-idle/data/locations'
import {
  createInitialState,
  tap,
  calculateTapIncome,
  calculateIdleIncomePerSecond,
  tickIdleIncome,
  canUnlockRecipe,
  unlockRecipe,
  selectRecipe,
  canBuyEquipment,
  buyEquipment,
  canHireStaff,
  hireStaff,
  canUnlockLocation,
  unlockLocation,
  switchLocation,
  canPrestige,
  prestige,
  getPrestigePointsForReset,
  applyOfflineEarnings,
  calculateOfflineEarnings,
  formatMoney,
  formatNumber,
  xpForLevel,
  type IdleGameState,
} from '../../src/games/bubble-tea-idle/logic/game-state'
import { saveGame, loadGame, resetSave } from '../../src/games/bubble-tea-idle/logic/save'
import { PRESTIGE_THRESHOLD, OFFLINE_EFFICIENCY } from '../../src/games/bubble-tea-idle/logic/constants'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ===== Data =====

describe('RECIPES data', () => {
  it('test_recipes_has_7_entries', () => { expect(RECIPES).toHaveLength(7) })
  it('test_recipes_have_unique_ids', () => {
    expect(new Set(RECIPES.map(r => r.id)).size).toBe(RECIPES.length)
  })
  it('test_recipes_have_required_fields', () => {
    for (const r of RECIPES) {
      expect(r.id).toBeTruthy()
      expect(r.name).toBeTruthy()
      expect(r.emoji).toBeTruthy()
      expect(r.basePrice).toBeGreaterThan(0)
      expect(r.unlockCost).toBeGreaterThanOrEqual(0)
    }
  })
  it('test_recipes_prices_increasing', () => {
    for (let i = 1; i < RECIPES.length; i++) {
      expect(RECIPES[i].basePrice).toBeGreaterThan(RECIPES[i - 1].basePrice)
    }
  })
  it('test_classic_recipe_is_free', () => {
    expect(RECIPES[0].id).toBe('classic')
    expect(RECIPES[0].unlockCost).toBe(0)
    expect(RECIPES[0].unlockLevel).toBe(0)
  })
  it('test_getRecipeById_valid', () => {
    expect(getRecipeById('classic').name).toBe('经典奶茶')
  })
  it('test_getRecipeById_invalid_throws', () => {
    expect(() => getRecipeById('nonexistent')).toThrow()
  })
})

describe('EQUIPMENT data', () => {
  it('test_equipment_has_5_entries', () => { expect(EQUIPMENT).toHaveLength(5) })
  it('test_equipment_have_unique_ids', () => {
    expect(new Set(EQUIPMENT.map(e => e.id)).size).toBe(EQUIPMENT.length)
  })
  it('test_getEquipmentCost_increases_per_level', () => {
    const eq = EQUIPMENT[0]
    const cost0 = getEquipmentCost(eq, 0)
    const cost1 = getEquipmentCost(eq, 1)
    expect(cost1).toBeGreaterThan(cost0)
  })
  it('test_getEquipmentMultiplier_base_is_1', () => {
    expect(getEquipmentMultiplier({})).toBe(1)
  })
  it('test_getEquipmentMultiplier_increases_with_levels', () => {
    expect(getEquipmentMultiplier({ shaker: 1 })).toBeGreaterThan(1)
  })
})

describe('STAFF data', () => {
  it('test_staff_has_5_entries', () => { expect(STAFF).toHaveLength(5) })
  it('test_getStaffCost_increases_with_owned', () => {
    const s = STAFF[0]
    expect(getStaffCost(s, 1)).toBeGreaterThan(getStaffCost(s, 0))
  })
  it('test_getStaffCps_zero_when_empty', () => {
    expect(getStaffCps({})).toBe(0)
  })
  it('test_getStaffCps_calculates_total', () => {
    expect(getStaffCps({ trainee: 2 })).toBeCloseTo(0.2)
  })
})

describe('LOCATIONS data', () => {
  it('test_locations_has_5_entries', () => { expect(LOCATIONS).toHaveLength(5) })
  it('test_street_is_free', () => {
    expect(LOCATIONS[0].id).toBe('street')
    expect(LOCATIONS[0].unlockCost).toBe(0)
  })
  it('test_multipliers_increasing', () => {
    for (let i = 1; i < LOCATIONS.length; i++) {
      expect(LOCATIONS[i].incomeMultiplier).toBeGreaterThan(LOCATIONS[i - 1].incomeMultiplier)
    }
  })
  it('test_getLocationById_valid', () => {
    expect(getLocationById('street').name).toBe('街边小摊')
  })
  it('test_getLocationById_invalid_throws', () => {
    expect(() => getLocationById('fake')).toThrow()
  })
})

// ===== Game State: Tap =====

describe('tap', () => {
  it('test_tap_adds_money', () => {
    const state = createInitialState()
    const income = tap(state)
    expect(income).toBeGreaterThan(0)
    expect(state.money).toBe(income)
  })
  it('test_tap_increments_counters', () => {
    const state = createInitialState()
    tap(state)
    expect(state.totalTaps).toBe(1)
    expect(state.totalCupsSold).toBe(1)
    expect(state.totalEarned).toBeGreaterThan(0)
  })
  it('test_tap_uses_selected_recipe', () => {
    const state = createInitialState()
    state.unlockedRecipes.push('green-tea')
    state.selectedRecipe = 'green-tea'
    const income = tap(state)
    expect(income).toBe(3) // green-tea basePrice = 3
  })
  it('test_calculateTapIncome_base', () => {
    const state = createInitialState()
    expect(calculateTapIncome(state)).toBe(1) // classic basePrice = 1
  })
})

// ===== Game State: Idle Income =====

describe('idle income', () => {
  it('test_idle_income_zero_without_staff', () => {
    const state = createInitialState()
    expect(calculateIdleIncomePerSecond(state)).toBe(0)
  })
  it('test_idle_income_with_staff', () => {
    const state = createInitialState()
    state.staffCounts = { trainee: 1 }
    expect(calculateIdleIncomePerSecond(state)).toBe(0) // 0.1 * 1 = 0.1 → floor = 0
  })
  it('test_idle_income_with_multiple_staff', () => {
    const state = createInitialState()
    state.staffCounts = { barista: 2 } // 0.5 * 2 = 1.0 per sec
    expect(calculateIdleIncomePerSecond(state)).toBe(1)
  })
  it('test_tickIdleIncome_adds_money', () => {
    const state = createInitialState()
    state.staffCounts = { barista: 2 }
    const income = tickIdleIncome(state)
    expect(income).toBe(1)
    expect(state.money).toBe(1)
  })
})

// ===== Recipe Unlock =====

describe('recipe unlock', () => {
  it('test_canUnlockRecipe_true_when_affordable', () => {
    const state = createInitialState()
    state.money = 100
    state.level = 10
    expect(canUnlockRecipe(state, 'green-tea')).toBe(true)
  })
  it('test_canUnlockRecipe_false_insufficient_money', () => {
    const state = createInitialState()
    state.money = 10
    state.level = 10
    expect(canUnlockRecipe(state, 'green-tea')).toBe(false)
  })
  it('test_canUnlockRecipe_false_insufficient_level', () => {
    const state = createInitialState()
    state.money = 100
    state.level = 3
    expect(canUnlockRecipe(state, 'green-tea')).toBe(false)
  })
  it('test_canUnlockRecipe_false_already_unlocked', () => {
    const state = createInitialState()
    state.money = 100
    state.level = 10
    state.unlockedRecipes.push('green-tea')
    expect(canUnlockRecipe(state, 'green-tea')).toBe(false)
  })
  it('test_unlockRecipe_deducts_and_selects', () => {
    const state = createInitialState()
    state.money = 100
    state.level = 10
    expect(unlockRecipe(state, 'green-tea')).toBe(true)
    expect(state.money).toBe(50) // 100 - 50
    expect(state.selectedRecipe).toBe('green-tea')
    expect(state.unlockedRecipes).toContain('green-tea')
  })
  it('test_selectRecipe_only_unlocked', () => {
    const state = createInitialState()
    expect(selectRecipe(state, 'matcha')).toBe(false)
    expect(selectRecipe(state, 'classic')).toBe(true)
  })
})

// ===== Equipment =====

describe('equipment', () => {
  it('test_canBuyEquipment_true_when_affordable', () => {
    const state = createInitialState()
    state.money = 100
    expect(canBuyEquipment(state, 'shaker')).toBe(true)
  })
  it('test_canBuyEquipment_false_insufficient', () => {
    const state = createInitialState()
    state.money = 5
    expect(canBuyEquipment(state, 'shaker')).toBe(false)
  })
  it('test_canBuyEquipment_false_max_level', () => {
    const state = createInitialState()
    state.money = 999999
    state.equipmentLevels = { shaker: 50 }
    expect(canBuyEquipment(state, 'shaker')).toBe(false)
  })
  it('test_buyEquipment_upgrades_level', () => {
    const state = createInitialState()
    state.money = 100
    expect(buyEquipment(state, 'shaker')).toBe(true)
    expect(state.equipmentLevels.shaker).toBe(1)
    expect(state.money).toBe(90) // 100 - 10
  })
})

// ===== Staff =====

describe('staff', () => {
  it('test_canHireStaff_true_when_affordable', () => {
    const state = createInitialState()
    state.money = 100
    expect(canHireStaff(state, 'trainee')).toBe(true)
  })
  it('test_canHireStaff_false_insufficient', () => {
    const state = createInitialState()
    state.money = 5
    expect(canHireStaff(state, 'trainee')).toBe(false)
  })
  it('test_hireStaff_increments_count', () => {
    const state = createInitialState()
    state.money = 100
    expect(hireStaff(state, 'trainee')).toBe(true)
    expect(state.staffCounts.trainee).toBe(1)
  })
  it('test_hireStaff_cost_increases', () => {
    const state = createInitialState()
    state.money = 100
    hireStaff(state, 'trainee')
    const remaining = state.money
    hireStaff(state, 'trainee')
    expect(state.money).toBeLessThan(remaining)
  })
})

// ===== Location =====

describe('location', () => {
  it('test_canUnlockLocation_true_when_affordable_and_leveled', () => {
    const state = createInitialState()
    state.money = 10000
    state.level = 20
    expect(canUnlockLocation(state, 'mall')).toBe(true)
  })
  it('test_canUnlockLocation_false_insufficient', () => {
    const state = createInitialState()
    state.money = 100
    state.level = 20
    expect(canUnlockLocation(state, 'mall')).toBe(false)
  })
  it('test_unlockLocation_sets_current', () => {
    const state = createInitialState()
    state.money = 10000
    state.level = 20
    expect(unlockLocation(state, 'mall')).toBe(true)
    expect(state.currentLocation).toBe('mall')
    expect(state.unlockedLocations).toContain('mall')
  })
  it('test_switchLocation_only_unlocked', () => {
    const state = createInitialState()
    expect(switchLocation(state, 'mall')).toBe(false)
    expect(switchLocation(state, 'street')).toBe(true)
  })
  it('test_location_multiplier_affects_income', () => {
    const state = createInitialState()
    state.money = 10000
    state.level = 20
    state.unlockedRecipes.push('green-tea')
    state.selectedRecipe = 'green-tea'
    state.equipmentLevels = { shaker: 5 } // base = 3, equip = 1.5, total = 4.5 → floor(4.5) = 4
    const income1 = calculateTapIncome(state)
    unlockLocation(state, 'mall') // 1.5x → 3 * 1.5 * 1.5 = 6.75 → floor = 6
    const income2 = calculateTapIncome(state)
    expect(income2).toBeGreaterThan(income1)
  })
})

// ===== Prestige =====

describe('prestige', () => {
  it('test_canPrestige_false_under_threshold', () => {
    const state = createInitialState()
    expect(canPrestige(state)).toBe(false)
  })
  it('test_canPrestige_true_above_threshold', () => {
    const state = createInitialState()
    state.totalEarned = PRESTIGE_THRESHOLD * 4
    expect(canPrestige(state)).toBe(true)
  })
  it('test_getPrestigePoints_formula', () => {
    const state = createInitialState()
    state.totalEarned = PRESTIGE_THRESHOLD * 9 // sqrt(9) = 3
    expect(getPrestigePointsForReset(state)).toBe(3)
  })
  it('test_prestige_resets_state', () => {
    const state = createInitialState()
    state.totalEarned = PRESTIGE_THRESHOLD * 4
    state.money = 500000
    state.staffCounts = { trainee: 5 }
    const points = prestige(state)
    expect(points).toBeGreaterThan(0)
    expect(state.money).toBe(0)
    expect(state.staffCounts).toEqual({})
    expect(state.prestigeCount).toBe(points)
    expect(state.prestigeMultiplier).toBeGreaterThan(1)
  })
  it('test_prestige_multiplier_boosts_income', () => {
    const state = createInitialState()
    state.totalEarned = PRESTIGE_THRESHOLD * 100 // sqrt(100) = 10 points → 1 + 10*0.05 = 1.50
    prestige(state)
    // Classic recipe: 1 * 1 * 1.50 = 1.5 → floor = 1
    // Use green-tea to make the difference visible
    state.unlockedRecipes.push('green-tea')
    state.selectedRecipe = 'green-tea'
    expect(calculateTapIncome(state)).toBeGreaterThan(3) // 3 * 1.50 = 4.5 → floor = 4
  })
})

// ===== Offline Earnings =====

describe('offline earnings', () => {
  it('test_calculateOfflineEarnings_zero_without_staff', () => {
    const state = createInitialState()
    expect(calculateOfflineEarnings(state, 60000, OFFLINE_EFFICIENCY)).toBe(0)
  })
  it('test_calculateOfflineEarnings_with_staff', () => {
    const state = createInitialState()
    state.staffCounts = { barista: 4 } // 2/s
    const earned = calculateOfflineEarnings(state, 60000, OFFLINE_EFFICIENCY) // 60s
    expect(earned).toBe(60) // 2 * 60 * 0.5
  })
  it('test_applyOfflineEarnings_adds_money', () => {
    const state = createInitialState()
    state.staffCounts = { barista: 4 }
    const earned = applyOfflineEarnings(state, 60000, OFFLINE_EFFICIENCY)
    expect(state.money).toBe(earned)
    expect(state.totalEarned).toBe(earned)
  })
})

// ===== Save/Load =====

describe('save/load', () => {
  beforeEach(() => { localStorage.clear() })

  it('test_loadGame_returns_null_when_empty', () => {
    expect(loadGame()).toBeNull()
  })
  it('test_saveGame_and_loadGame_roundtrip', () => {
    const state = createInitialState()
    state.money = 42
    state.level = 5
    saveGame(state)
    const loaded = loadGame()!
    expect(loaded.money).toBe(42)
    expect(loaded.level).toBe(5)
  })
  it('test_loadGame_handles_corrupted_json', () => {
    localStorage.setItem('bubble-tea-idle-save', 'NOT_JSON')
    expect(loadGame()).toBeNull()
  })
  it('test_loadGame_handles_missing_money', () => {
    localStorage.setItem('bubble-tea-idle-save', '{"level": 1}')
    expect(loadGame()).toBeNull()
  })
  it('test_resetSave_clears_data', () => {
    saveGame(createInitialState())
    resetSave()
    expect(loadGame()).toBeNull()
  })
})

// ===== Formatting =====

describe('formatting', () => {
  it('test_formatMoney_under_1000', () => { expect(formatMoney(999)).toBe('999') })
  it('test_formatMoney_thousands', () => { expect(formatMoney(1500)).toBe('1.5K') })
  it('test_formatMoney_millions', () => { expect(formatMoney(2500000)).toBe('2.50M') })
  it('test_formatMoney_billions', () => { expect(formatMoney(1500000000)).toBe('1.50B') })
  it('test_formatMoney_trillions', () => { expect(formatMoney(3000000000000)).toBe('3.00T') })
  it('test_formatNumber_thousands', () => { expect(formatNumber(5000)).toBe('5.0K') })
  it('test_formatNumber_millions', () => { expect(formatNumber(2000000)).toBe('2.0M') })
})

// ===== XP / Level =====

describe('xp/level', () => {
  it('test_xpForLevel_increases', () => {
    expect(xpForLevel(2)).toBeGreaterThan(xpForLevel(1))
  })
  it('test_xpForLevel_level1_is_100', () => {
    expect(xpForLevel(1)).toBe(100)
  })
})

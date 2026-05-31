import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RECIPES, getRecipeById } from '../../src/games/boba-tycoon/data/recipes'
import { EQUIPMENT, getEquipmentCost, getEquipmentMultiplier } from '../../src/games/boba-tycoon/data/equipment'
import { STAFF, getStaffCost, getStaffCps } from '../../src/games/boba-tycoon/data/staff'
import { LOCATIONS, getLocationById } from '../../src/games/boba-tycoon/data/locations'
import { DAILY_CHALLENGES, getDailyChallenge, seededRandom } from '../../src/games/boba-tycoon/data/daily-challenges'
import {
  createInitialState, tap, calculateTapIncome, calculateIdleIncome, tickIdle,
  canUnlockRecipe, unlockRecipe, selectRecipe,
  canBuyEquipment, buyEquipment,
  canHireStaff, hireStaff,
  canUnlockLocation, unlockLocation, switchLocation,
  canPrestige, doPrestige, getPrestigePoints,
  applyOffline, activateBoost,
  getDailyState, startDaily, checkDailyComplete,
  fmt, xpForLevel, type TycoonState,
} from '../../src/games/boba-tycoon/logic/game-state'
import { saveGame, loadGame, resetSave } from '../../src/games/boba-tycoon/logic/save'
import { PRESTIGE_THRESHOLD, BOOST_MULTIPLIER, BOOST_DURATION } from '../../src/games/boba-tycoon/logic/constants'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ===== Data: Recipes =====

describe('RECIPES', () => {
  it('test_has_8_recipes', () => { expect(RECIPES).toHaveLength(8) })
  it('test_unique_ids', () => { expect(new Set(RECIPES.map(r => r.id)).size).toBe(8) })
  it('test_required_fields', () => { for (const r of RECIPES) { expect(r.name).toBeTruthy(); expect(r.emoji).toBeTruthy(); expect(r.basePrice).toBeGreaterThan(0) } })
  it('test_prices_increasing', () => { for (let i = 1; i < RECIPES.length; i++) expect(RECIPES[i].basePrice).toBeGreaterThan(RECIPES[i - 1].basePrice) })
  it('test_first_free', () => { expect(RECIPES[0].unlockCost).toBe(0) })
  it('test_getRecipeById_valid', () => { expect(getRecipeById('classic-milk-tea').name).toBe('经典奶茶') })
  it('test_getRecipeById_invalid', () => { expect(() => getRecipeById('fake')).toThrow() })
})

// ===== Data: Equipment =====

describe('EQUIPMENT', () => {
  it('test_has_6_equipment', () => { expect(EQUIPMENT).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(EQUIPMENT.map(e => e.id)).size).toBe(6) })
  it('test_cost_increases', () => { const eq = EQUIPMENT[0]; expect(getEquipmentCost(eq, 5)).toBeGreaterThan(getEquipmentCost(eq, 0)) })
  it('test_multiplier_base_1', () => { expect(getEquipmentMultiplier({})).toBe(1) })
  it('test_multiplier_with_levels', () => { expect(getEquipmentMultiplier({ shaker: 3 })).toBeGreaterThan(1) })
})

// ===== Data: Staff =====

describe('STAFF', () => {
  it('test_has_6_staff', () => { expect(STAFF).toHaveLength(6) })
  it('test_cost_scaling', () => { expect(getStaffCost(STAFF[0], 5)).toBeGreaterThan(getStaffCost(STAFF[0], 0)) })
  it('test_cps_zero_empty', () => { expect(getStaffCps({})).toBe(0) })
  it('test_cps_with_staff', () => { expect(getStaffCps({ intern: 2 })).toBeCloseTo(0.2) })
})

// ===== Data: Locations =====

describe('LOCATIONS', () => {
  it('test_has_6_locations', () => { expect(LOCATIONS).toHaveLength(6) })
  it('test_first_free', () => { expect(LOCATIONS[0].id).toBe('cart'); expect(LOCATIONS[0].unlockCost).toBe(0) })
  it('test_multipliers_increasing', () => { for (let i = 1; i < LOCATIONS.length; i++) expect(LOCATIONS[i].incomeMult).toBeGreaterThan(LOCATIONS[i - 1].incomeMult) })
  it('test_getLocationById_valid', () => { expect(getLocationById('cart').name).toBe('街边小推车') })
  it('test_getLocationById_invalid', () => { expect(() => getLocationById('fake')).toThrow() })
})

// ===== Data: Daily Challenges =====

describe('DAILY_CHALLENGES', () => {
  it('test_has_5_challenges', () => { expect(DAILY_CHALLENGES).toHaveLength(5) })
  it('test_required_fields', () => { for (const c of DAILY_CHALLENGES) { expect(c.name).toBeTruthy(); expect(c.target).toBeGreaterThan(0); expect(c.reward).toBeGreaterThan(0) } })
  it('test_getDailyChallenge_deterministic', () => { expect(getDailyChallenge(20260601).name).toBe(getDailyChallenge(20260601).name) })
  it('test_seededRandom_0_to_1', () => { for (let i = 0; i < 10; i++) { const r = seededRandom(i); expect(r).toBeGreaterThanOrEqual(0); expect(r).toBeLessThan(1) } })
})

// ===== Tap =====

describe('tap', () => {
  it('test_tap_adds_money', () => { const s = createInitialState(); const inc = tap(s); expect(inc).toBeGreaterThan(0); expect(s.money).toBe(inc) })
  it('test_tap_increments_counters', () => { const s = createInitialState(); tap(s); expect(s.totalTaps).toBe(1); expect(s.totalCups).toBe(1) })
  it('test_tap_combo_increments', () => { const s = createInitialState(); tap(s); tap(s); expect(s.tapCombo).toBe(2) })
  it('test_tap_uses_recipe', () => { const s = createInitialState(); s.unlockedRecipes.push('taro-boba'); s.selectedRecipe = 'taro-boba'; expect(tap(s)).toBe(3) })
  it('test_calculateTapIncome_base', () => { expect(calculateTapIncome(createInitialState())).toBe(1) })
})

// ===== Idle =====

describe('idle income', () => {
  it('test_idle_zero_without_staff', () => { expect(calculateIdleIncome(createInitialState())).toBe(0) })
  it('test_idle_with_staff', () => { const s = createInitialState(); s.staffCounts = { barista: 2 }; expect(calculateIdleIncome(s)).toBe(1) })
  it('test_tickIdle_adds_money', () => { const s = createInitialState(); s.staffCounts = { barista: 2 }; tickIdle(s); expect(s.money).toBe(1) })
  it('test_combo_decays', () => { const s = createInitialState(); s.tapCombo = 5; s.comboTimer = 0; tickIdle(s, 5000); expect(s.tapCombo).toBe(0) })
})

// ===== Recipes =====

describe('recipe unlock', () => {
  it('test_canUnlock_affordable', () => { const s = createInitialState(); s.money = 100; s.level = 5; expect(canUnlockRecipe(s, 'taro-boba')).toBe(true) })
  it('test_canUnlock_insufficient_money', () => { const s = createInitialState(); s.money = 10; s.level = 5; expect(canUnlockRecipe(s, 'taro-boba')).toBe(false) })
  it('test_canUnlock_insufficient_level', () => { const s = createInitialState(); s.money = 100; s.level = 1; expect(canUnlockRecipe(s, 'taro-boba')).toBe(false) })
  it('test_canUnlock_already_owned', () => { const s = createInitialState(); s.money = 100; s.level = 5; s.unlockedRecipes.push('taro-boba'); expect(canUnlockRecipe(s, 'taro-boba')).toBe(false) })
  it('test_unlockRecipe_deducts', () => { const s = createInitialState(); s.money = 100; s.level = 5; expect(unlockRecipe(s, 'taro-boba')).toBe(true); expect(s.money).toBe(50); expect(s.selectedRecipe).toBe('taro-boba') })
  it('test_selectRecipe', () => { const s = createInitialState(); expect(selectRecipe(s, 'classic-milk-tea')).toBe(true); expect(selectRecipe(s, 'matcha-latte')).toBe(false) })
})

// ===== Equipment =====

describe('equipment', () => {
  it('test_canBuy_affordable', () => { const s = createInitialState(); s.money = 100; expect(canBuyEquipment(s, 'shaker')).toBe(true) })
  it('test_canBuy_insufficient', () => { const s = createInitialState(); s.money = 5; expect(canBuyEquipment(s, 'shaker')).toBe(false) })
  it('test_buyEquipment_upgrades', () => { const s = createInitialState(); s.money = 100; buyEquipment(s, 'shaker'); expect(s.equipmentLevels.shaker).toBe(1) })
})

// ===== Staff =====

describe('staff', () => {
  it('test_canHire_affordable', () => { const s = createInitialState(); s.money = 100; expect(canHireStaff(s, 'intern')).toBe(true) })
  it('test_hireStaff_increments', () => { const s = createInitialState(); s.money = 100; hireStaff(s, 'intern'); expect(s.staffCounts.intern).toBe(1) })
})

// ===== Location =====

describe('location', () => {
  it('test_canUnlock_affordable', () => { const s = createInitialState(); s.money = 5000; s.level = 15; expect(canUnlockLocation(s, 'kiosk')).toBe(true) })
  it('test_unlockLocation_sets_current', () => { const s = createInitialState(); s.money = 5000; s.level = 15; unlockLocation(s, 'kiosk'); expect(s.currentLocation).toBe('kiosk') })
  it('test_switchLocation', () => { const s = createInitialState(); expect(switchLocation(s, 'cart')).toBe(true); expect(switchLocation(s, 'kiosk')).toBe(false) })
  it('test_location_affects_income', () => { const s = createInitialState(); s.money = 5000; s.level = 15; s.unlockedRecipes.push('taro-boba'); s.selectedRecipe = 'taro-boba'; s.equipmentLevels = { shaker: 3 }; const i1 = calculateTapIncome(s); unlockLocation(s, 'kiosk'); const i2 = calculateTapIncome(s); expect(i2).toBeGreaterThan(i1) })
})

// ===== Prestige =====

describe('prestige', () => {
  it('test_canPrestige_false_under', () => { expect(canPrestige(createInitialState())).toBe(false) })
  it('test_canPrestige_true_above', () => { const s = createInitialState(); s.totalEarned = PRESTIGE_THRESHOLD * 4; expect(canPrestige(s)).toBe(true) })
  it('test_getPrestigePoints_formula', () => { const s = createInitialState(); s.totalEarned = PRESTIGE_THRESHOLD * 9; expect(getPrestigePoints(s)).toBe(3) })
  it('test_doPrestige_resets', () => { const s = createInitialState(); s.totalEarned = PRESTIGE_THRESHOLD * 4; s.money = 500000; doPrestige(s); expect(s.money).toBe(0); expect(s.prestigeCount).toBeGreaterThan(0); expect(s.prestigeMultiplier).toBeGreaterThan(1) })
})

// ===== Boost =====

describe('boost', () => {
  it('test_activateBoost_sets_flag', () => { const s = createInitialState(); activateBoost(s, 1000); expect(s.boostActive).toBe(true); expect(s.boostEndTime).toBe(1000 + BOOST_DURATION) })
  it('test_boost_doubles_tap', () => { const s = createInitialState(); activateBoost(s, Date.now()); const inc = tap(s); expect(inc).toBeGreaterThanOrEqual(2) })
  it('test_boost_expires', () => { const s = createInitialState(); s.boostActive = true; s.boostEndTime = 0; tickIdle(s, 5000); expect(s.boostActive).toBe(false) })
})

// ===== Daily =====

describe('daily challenge', () => {
  it('test_getDailyState_returns_challenge', () => { const d = getDailyState(); expect(d.challenge).toBeDefined(); expect(d.seed).toBeGreaterThan(0) })
  it('test_startDaily_sets_active', () => { const s = createInitialState(); startDaily(s); expect(s.dailyActive).toBe(true); expect(s.dailyProgress).toBe(0) })
  it('test_tap_increments_daily_tap_type', () => { const s = createInitialState(); s.dailyActive = true; s.dailyLastSeed = getDailyState().seed; const before = s.dailyProgress; tap(s); expect(s.dailyProgress).toBe(before + 1) })
  it('test_checkDailyComplete', () => { const s = createInitialState(); startDaily(s); const daily = getDailyState(); s.dailyProgress = daily.challenge.target; const completed = checkDailyComplete(s); if (daily.challenge.type === 'tap' || daily.challenge.type === 'serve') { expect(completed).toBe(true); expect(s.dailyCompleted).toBe(true) } })
})

// ===== Offline =====

describe('offline earnings', () => {
  it('test_applyOffline_zero_without_staff', () => { expect(applyOffline(createInitialState(), 60000)).toBe(0) })
  it('test_applyOffline_with_staff', () => { const s = createInitialState(); s.staffCounts = { barista: 4 }; expect(applyOffline(s, 60000)).toBe(60) })
})

// ===== Formatting =====

describe('formatting', () => {
  it('test_fmt_under_1000', () => { expect(fmt(999)).toBe('999') })
  it('test_fmt_thousands', () => { expect(fmt(1500)).toBe('1.5K') })
  it('test_fmt_millions', () => { expect(fmt(2500000)).toBe('2.50M') })
  it('test_fmt_billions', () => { expect(fmt(1500000000)).toBe('1.50B') })
  it('test_fmt_trillions', () => { expect(fmt(3e12)).toBe('3.00T') })
  it('test_xpForLevel_increases', () => { expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(1)) })
})

// ===== Save/Load =====

describe('save/load', () => {
  beforeEach(() => { localStorage.clear() })
  it('test_loadGame_null_empty', () => { expect(loadGame()).toBeNull() })
  it('test_roundtrip', () => { const s = createInitialState(); s.money = 42; saveGame(s); expect(loadGame()!.money).toBe(42) })
  it('test_corrupted', () => { localStorage.setItem('boba-tycoon-save', 'BROKEN'); expect(loadGame()).toBeNull() })
  it('test_resetSave', () => { saveGame(createInitialState()); resetSave(); expect(loadGame()).toBeNull() })
})

// ===== Initial State =====

describe('createInitialState', () => {
  it('test_defaults', () => {
    const s = createInitialState()
    expect(s.money).toBe(0); expect(s.level).toBe(1); expect(s.prestigeCount).toBe(0); expect(s.selectedRecipe).toBe('classic-milk-tea'); expect(s.unlockedRecipes).toContain('classic-milk-tea'); expect(s.currentLocation).toBe('cart'); expect(s.tapCombo).toBe(0); expect(s.boostActive).toBe(false)
  })
})

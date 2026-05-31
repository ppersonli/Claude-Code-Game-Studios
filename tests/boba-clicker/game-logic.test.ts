import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UPGRADES, MILESTONES, getUpgradeCost } from '../../src/games/boba-clicker/data/upgrades'
import {
  createInitialState, tap, calculateTapValue, getComboMultiplier,
  getCritChance, getAutoClickRate, tickAutoClick, updateCombo, updateBoost,
  canBuyUpgrade, buyUpgrade, checkMilestones,
  canPrestige, doPrestige, getPrestigePoints,
  activateBoost, fmt, type ClickerState,
} from '../../src/games/boba-clicker/logic/game-state'
import { saveGame, loadGame, resetSave } from '../../src/games/boba-clicker/logic/save'
import { PRESTIGE_THRESHOLD, COMBO_TIMEOUT, BOOST_DURATION } from '../../src/games/boba-clicker/logic/constants'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ===== Upgrades Data =====

describe('UPGRADES', () => {
  it('test_has_4_upgrades', () => { expect(UPGRADES).toHaveLength(4) })
  it('test_unique_ids', () => { expect(new Set(UPGRADES.map(u => u.id)).size).toBe(4) })
  it('test_required_fields', () => { for (const u of UPGRADES) { expect(u.name).toBeTruthy(); expect(u.baseCost).toBeGreaterThan(0) } })
  it('test_cost_scaling', () => { const u = UPGRADES[0]; expect(getUpgradeCost(u, 5)).toBeGreaterThan(getUpgradeCost(u, 0)) })
})

// ===== Milestones Data =====

describe('MILESTONES', () => {
  it('test_has_7_milestones', () => { expect(MILESTONES).toHaveLength(7) })
  it('test_unique_tap_thresholds', () => { expect(new Set(MILESTONES.map(m => m.taps)).size).toBe(7) })
  it('test_required_fields', () => { for (const m of MILESTONES) { expect(m.name).toBeTruthy(); expect(m.taps).toBeGreaterThan(0); expect(m.reward).toBeGreaterThan(0) } })
})

// ===== Initial State =====

describe('createInitialState', () => {
  it('test_defaults', () => {
    const s = createInitialState()
    expect(s.points).toBe(0); expect(s.totalTaps).toBe(0); expect(s.combo).toBe(0)
    expect(s.prestigeCount).toBe(0); expect(s.prestigeMultiplier).toBe(1); expect(s.boostActive).toBe(false)
  })
})

// ===== Tap =====

describe('tap', () => {
  it('test_tap_returns_value', () => {
    const s = createInitialState()
    const r = tap(s, 1000)
    expect(r.value).toBeGreaterThan(0); expect(s.points).toBe(r.value); expect(s.totalTaps).toBe(1)
  })
  it('test_tap_combo_increments', () => {
    const s = createInitialState()
    tap(s, 1000); tap(s, 1100)
    expect(s.combo).toBe(2)
  })
  it('test_tap_combo_resets_on_timeout', () => {
    const s = createInitialState()
    tap(s, 1000); tap(s, 1000 + COMBO_TIMEOUT + 100)
    expect(s.combo).toBe(1)
  })
  it('test_tap_tracks_max_combo', () => {
    const s = createInitialState()
    for (let i = 0; i < 5; i++) tap(s, 1000 + i * 100)
    expect(s.maxCombo).toBe(5)
  })
  it('test_calculateTapValue_base', () => { expect(calculateTapValue(createInitialState())).toBe(1) })
  it('test_calculateTapValue_with_power', () => {
    const s = createInitialState(); s.upgradeLevels['tap-power'] = 5
    expect(calculateTapValue(s)).toBe(6) // 1 + 5
  })
  it('test_calculateTapValue_with_prestige', () => {
    const s = createInitialState(); s.prestigeMultiplier = 2
    expect(calculateTapValue(s)).toBe(2)
  })
  it('test_calculateTapValue_with_boost', () => {
    const s = createInitialState(); s.boostActive = true; s.boostEndTime = Date.now() + 10000
    expect(calculateTapValue(s)).toBe(2)
  })
})

// ===== Combo =====

describe('combo', () => {
  it('test_getComboMultiplier_base', () => { expect(getComboMultiplier(createInitialState())).toBe(1) })
  it('test_getComboMultiplier_with_combo', () => { const s = createInitialState(); s.combo = 10; expect(getComboMultiplier(s)).toBe(1.5) })
  it('test_updateCombo_resets_on_timeout', () => {
    const s = createInitialState(); s.combo = 5; s.lastTapTime = 0
    updateCombo(s, COMBO_TIMEOUT + 100)
    expect(s.combo).toBe(0)
  })
  it('test_updateCombo_keeps_recent', () => {
    const s = createInitialState(); s.combo = 5; s.lastTapTime = Date.now()
    updateCombo(s, Date.now())
    expect(s.combo).toBe(5)
  })
})

// ===== Crit =====

describe('crit', () => {
  it('test_getCritChance_base', () => { expect(getCritChance(createInitialState())).toBe(0) })
  it('test_getCritChance_with_levels', () => { const s = createInitialState(); s.upgradeLevels['crit-chance'] = 10; expect(getCritChance(s)).toBe(0.2) })
  it('test_getCritChance_caps_at_50', () => { const s = createInitialState(); s.upgradeLevels['crit-chance'] = 100; expect(getCritChance(s)).toBe(0.5) })
})

// ===== Auto-click =====

describe('auto-click', () => {
  it('test_getAutoClickRate_base', () => { expect(getAutoClickRate(createInitialState())).toBe(0) })
  it('test_getAutoClickRate_with_levels', () => { const s = createInitialState(); s.upgradeLevels['auto-click'] = 4; expect(getAutoClickRate(s)).toBe(2) })
  it('test_tickAutoClick_accumulates', () => {
    const s = createInitialState(); s.upgradeLevels['auto-click'] = 10 // 5/s
    tickAutoClick(s, 1) // 1 second = 5 clicks
    expect(s.totalTaps).toBe(5); expect(s.points).toBeGreaterThan(0)
  })
  it('test_tickAutoClick_nothing_without_level', () => {
    const s = createInitialState()
    tickAutoClick(s, 10)
    expect(s.totalTaps).toBe(0)
  })
})

// ===== Upgrades =====

describe('buyUpgrade', () => {
  it('test_canBuy_affordable', () => { const s = createInitialState(); s.points = 100; expect(canBuyUpgrade(s, 'tap-power')).toBe(true) })
  it('test_canBuy_insufficient', () => { const s = createInitialState(); s.points = 5; expect(canBuyUpgrade(s, 'tap-power')).toBe(false) })
  it('test_buyUpgrade_deducts', () => { const s = createInitialState(); s.points = 100; buyUpgrade(s, 'tap-power'); expect(s.upgradeLevels['tap-power']).toBe(1); expect(s.points).toBe(90) })
  it('test_buyUpgrade_invalid_id', () => { const s = createInitialState(); s.points = 100; expect(buyUpgrade(s, 'fake')).toBe(false) })
})

// ===== Milestones =====

describe('checkMilestones', () => {
  it('test_triggers_first_milestone', () => {
    const s = createInitialState(); s.totalTaps = 100; s.points = 0
    const claimed = checkMilestones(s)
    expect(claimed.length).toBe(1); expect(claimed[0].taps).toBe(100); expect(s.claimedMilestones).toContain(100); expect(s.points).toBe(50)
  })
  it('test_no_duplicate_claim', () => {
    const s = createInitialState(); s.totalTaps = 100
    checkMilestones(s); const r2 = checkMilestones(s)
    expect(r2.length).toBe(0)
  })
  it('test_multiple_milestones', () => {
    const s = createInitialState(); s.totalTaps = 1000
    const claimed = checkMilestones(s)
    expect(claimed.length).toBe(3) // 100, 500, 1000
  })
})

// ===== Prestige =====

describe('prestige', () => {
  it('test_canPrestige_false_under', () => { expect(canPrestige(createInitialState())).toBe(false) })
  it('test_canPrestige_true_above', () => { const s = createInitialState(); s.totalPoints = PRESTIGE_THRESHOLD * 4; expect(canPrestige(s)).toBe(true) })
  it('test_getPrestigePoints_formula', () => { const s = createInitialState(); s.totalPoints = PRESTIGE_THRESHOLD * 9; expect(getPrestigePoints(s)).toBe(3) })
  it('test_doPrestige_resets', () => {
    const s = createInitialState(); s.totalPoints = PRESTIGE_THRESHOLD * 4; s.points = 5000
    doPrestige(s)
    expect(s.points).toBe(0); expect(s.prestigeCount).toBeGreaterThan(0); expect(s.prestigeMultiplier).toBeGreaterThan(1)
  })
})

// ===== Boost =====

describe('boost', () => {
  it('test_activateBoost', () => { const s = createInitialState(); activateBoost(s, 1000); expect(s.boostActive).toBe(true); expect(s.boostEndTime).toBe(1000 + BOOST_DURATION) })
  it('test_updateBoost_expires', () => { const s = createInitialState(); s.boostActive = true; s.boostEndTime = 0; updateBoost(s, 5000); expect(s.boostActive).toBe(false) })
  it('test_updateBoost_keeps_active', () => { const s = createInitialState(); s.boostActive = true; s.boostEndTime = Date.now() + 10000; updateBoost(s, Date.now()); expect(s.boostActive).toBe(true) })
})

// ===== Formatting =====

describe('formatting', () => {
  it('test_fmt_under_1000', () => { expect(fmt(999)).toBe('999') })
  it('test_fmt_thousands', () => { expect(fmt(1500)).toBe('1.5K') })
  it('test_fmt_millions', () => { expect(fmt(2500000)).toBe('2.50M') })
})

// ===== Save/Load =====

describe('save/load', () => {
  beforeEach(() => { localStorage.clear() })
  it('test_loadGame_null_empty', () => { expect(loadGame()).toBeNull() })
  it('test_roundtrip', () => { const s = createInitialState(); s.points = 42; saveGame(s); expect(loadGame()!.points).toBe(42) })
  it('test_corrupted', () => { localStorage.setItem('boba-clicker-save', 'BROKEN'); expect(loadGame()).toBeNull() })
  it('test_resetSave', () => { saveGame(createInitialState()); resetSave(); expect(loadGame()).toBeNull() })
})

// ===== Constants =====

describe('constants', () => {
  it('test_prestige_threshold', () => { expect(PRESTIGE_THRESHOLD).toBe(10000) })
  it('test_combo_timeout_positive', () => { expect(COMBO_TIMEOUT).toBeGreaterThan(0) })
})

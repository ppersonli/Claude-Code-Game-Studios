import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WAFFLE_THEMES, getWaffleThemeById } from '../../src/games/waffle-wobble/data/themes'
import { WAFFLE_ACHIEVEMENTS, getWaffleAchievementById, type WaffleStats } from '../../src/games/waffle-wobble/data/achievements'
import {
  canBuyWaffleTheme, equipWaffleTheme, getAvailableWaffleThemes,
  checkWaffleAchievements,
  isDailyRewardAvailable, claimDailyReward, DAILY_REWARD_COINS,
} from '../../src/games/waffle-wobble/logic/meta'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<WaffleStats> = {}): WaffleStats {
  return {
    totalServed: 0, perfectServed: 0, totalLost: 0, highestLevel: 0,
    bestCombo: 0, totalCoinsEarned: 0, toppingsUnlocked: 2,
    themesUnlocked: 1, dailyCompleted: 0, gamesPlayed: 0, ...overrides,
  }
}

// ===== THEMES =====

describe('WAFFLE_THEMES', () => {
  it('test_has_6_themes', () => { expect(WAFFLE_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(WAFFLE_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(WAFFLE_THEMES[0].cost).toBe(0); expect(WAFFLE_THEMES[0].requiredLevel).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < WAFFLE_THEMES.length; i++) expect(WAFFLE_THEMES[i].cost).toBeGreaterThanOrEqual(WAFFLE_THEMES[i - 1].cost) })
  it('test_levels_increase', () => { for (let i = 2; i < WAFFLE_THEMES.length; i++) expect(WAFFLE_THEMES[i].requiredLevel).toBeGreaterThanOrEqual(WAFFLE_THEMES[i - 1].requiredLevel) })
  it('test_all_have_emoji', () => { for (const t of WAFFLE_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_bgGrad', () => { for (const t of WAFFLE_THEMES) expect(t.bgGrad).toHaveLength(2) })
  it('test_getWaffleThemeById_valid', () => { expect(getWaffleThemeById('classic').name).toBe('經典華夫') })
  it('test_getWaffleThemeById_invalid', () => { expect(() => getWaffleThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuyWaffleTheme', () => {
  it('test_affordable_with_level', () => { expect(canBuyWaffleTheme(200, 5, ['classic'], 'chocolate')).toBe(true) })
  it('test_insufficient_coins', () => { expect(canBuyWaffleTheme(50, 5, ['classic'], 'chocolate')).toBe(false) })
  it('test_insufficient_level', () => { expect(canBuyWaffleTheme(200, 1, ['classic'], 'chocolate')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyWaffleTheme(200, 5, ['classic', 'chocolate'], 'chocolate')).toBe(false) })
})

describe('equipWaffleTheme', () => {
  it('test_equip_unlocked', () => { expect(equipWaffleTheme(['classic', 'chocolate'], 'chocolate')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipWaffleTheme(['classic'], 'cosmic')).toBe(false) })
})

describe('getAvailableWaffleThemes', () => {
  it('test_returns_all', () => { expect(getAvailableWaffleThemes(9999, 99, ['classic'])).toHaveLength(WAFFLE_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableWaffleThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableWaffleThemes(0, 0, ['classic']).find(t => t.theme.id === 'cosmic')!; expect(t.unlocked).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('WAFFLE_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => { expect(WAFFLE_ACHIEVEMENTS).toHaveLength(14) })
  it('test_unique_ids', () => { expect(new Set(WAFFLE_ACHIEVEMENTS.map(a => a.id)).size).toBe(14) })
  it('test_all_have_rewards', () => { for (const a of WAFFLE_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getWaffleAchievementById_valid', () => { expect(getWaffleAchievementById('first-serve').name).toBe('初次出餐') })
  it('test_getWaffleAchievementById_invalid', () => { expect(() => getWaffleAchievementById('fake')).toThrow() })
})

describe('checkWaffleAchievements', () => {
  it('test_unlocks_first_serve', () => { const u = checkWaffleAchievements(makeStats({ totalServed: 1 }), []); expect(u.some(a => a.id === 'first-serve')).toBe(true) })
  it('test_unlocks_serve_50', () => { const u = checkWaffleAchievements(makeStats({ totalServed: 50 }), []); expect(u.some(a => a.id === 'serve-50')).toBe(true) })
  it('test_unlocks_serve_200', () => { const u = checkWaffleAchievements(makeStats({ totalServed: 200 }), []); expect(u.some(a => a.id === 'serve-200')).toBe(true) })
  it('test_unlocks_perfect_10', () => { const u = checkWaffleAchievements(makeStats({ perfectServed: 10 }), []); expect(u.some(a => a.id === 'perfect-10')).toBe(true) })
  it('test_unlocks_perfect_50', () => { const u = checkWaffleAchievements(makeStats({ perfectServed: 50 }), []); expect(u.some(a => a.id === 'perfect-50')).toBe(true) })
  it('test_unlocks_combo_5', () => { const u = checkWaffleAchievements(makeStats({ bestCombo: 5 }), []); expect(u.some(a => a.id === 'combo-5')).toBe(true) })
  it('test_unlocks_combo_10', () => { const u = checkWaffleAchievements(makeStats({ bestCombo: 10 }), []); expect(u.some(a => a.id === 'combo-10')).toBe(true) })
  it('test_unlocks_level_10', () => { const u = checkWaffleAchievements(makeStats({ highestLevel: 10 }), []); expect(u.some(a => a.id === 'level-10')).toBe(true) })
  it('test_unlocks_level_25', () => { const u = checkWaffleAchievements(makeStats({ highestLevel: 25 }), []); expect(u.some(a => a.id === 'level-25')).toBe(true) })
  it('test_unlocks_toppings_5', () => { const u = checkWaffleAchievements(makeStats({ toppingsUnlocked: 5 }), []); expect(u.some(a => a.id === 'toppings-5')).toBe(true) })
  it('test_unlocks_toppings_all', () => { const u = checkWaffleAchievements(makeStats({ toppingsUnlocked: 10 }), []); expect(u.some(a => a.id === 'toppings-all')).toBe(true) })
  it('test_unlocks_theme_3', () => { const u = checkWaffleAchievements(makeStats({ themesUnlocked: 3 }), []); expect(u.some(a => a.id === 'theme-3')).toBe(true) })
  it('test_unlocks_daily_3', () => { const u = checkWaffleAchievements(makeStats({ dailyCompleted: 3 }), []); expect(u.some(a => a.id === 'daily-3')).toBe(true) })
  it('test_unlocks_veteran', () => { const u = checkWaffleAchievements(makeStats({ gamesPlayed: 20 }), []); expect(u.some(a => a.id === 'veteran')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkWaffleAchievements(makeStats({ totalServed: 1 }), ['first-serve']); expect(u.some(a => a.id === 'first-serve')).toBe(false) })
  it('test_multiple', () => { const u = checkWaffleAchievements(makeStats({ totalServed: 50, bestCombo: 10, perfectServed: 10 }), []); expect(u.length).toBeGreaterThanOrEqual(3) })
  it('test_insufficient_no_unlock', () => { const u = checkWaffleAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_boundary_first_serve', () => { expect(checkWaffleAchievements(makeStats({ totalServed: 0 }), []).some(a => a.id === 'first-serve')).toBe(false); expect(checkWaffleAchievements(makeStats({ totalServed: 1 }), []).some(a => a.id === 'first-serve')).toBe(true) })
  it('test_boundary_serve_200', () => { expect(checkWaffleAchievements(makeStats({ totalServed: 199 }), []).some(a => a.id === 'serve-200')).toBe(false); expect(checkWaffleAchievements(makeStats({ totalServed: 200 }), []).some(a => a.id === 'serve-200')).toBe(true) })
  it('test_boundary_combo_10', () => { expect(checkWaffleAchievements(makeStats({ bestCombo: 9 }), []).some(a => a.id === 'combo-10')).toBe(false); expect(checkWaffleAchievements(makeStats({ bestCombo: 10 }), []).some(a => a.id === 'combo-10')).toBe(true) })
  it('test_boundary_level_25', () => { expect(checkWaffleAchievements(makeStats({ highestLevel: 24 }), []).some(a => a.id === 'level-25')).toBe(false); expect(checkWaffleAchievements(makeStats({ highestLevel: 25 }), []).some(a => a.id === 'level-25')).toBe(true) })
  it('test_boundary_toppings_all', () => { expect(checkWaffleAchievements(makeStats({ toppingsUnlocked: 9 }), []).some(a => a.id === 'toppings-all')).toBe(false); expect(checkWaffleAchievements(makeStats({ toppingsUnlocked: 10 }), []).some(a => a.id === 'toppings-all')).toBe(true) })
  it('test_boundary_veteran', () => { expect(checkWaffleAchievements(makeStats({ gamesPlayed: 19 }), []).some(a => a.id === 'veteran')).toBe(false); expect(checkWaffleAchievements(makeStats({ gamesPlayed: 20 }), []).some(a => a.id === 'veteran')).toBe(true) })
})

// ===== DAILY REWARD =====

describe('daily reward', () => {
  it('test_reward_amount', () => { expect(DAILY_REWARD_COINS).toBe(50) })
  it('test_available_initially', () => { expect(isDailyRewardAvailable('')).toBe(true) })
  it('test_not_available_after_claim', () => { expect(isDailyRewardAvailable(new Date().toISOString().slice(0, 10))).toBe(false) })
  it('test_claim_first_time', () => { const r = claimDailyReward(''); expect(r.claimed).toBe(true) })
  it('test_claim_already_claimed', () => { const r = claimDailyReward(new Date().toISOString().slice(0, 10)); expect(r.claimed).toBe(false) })
  it('test_claim_different_day', () => { const r = claimDailyReward('2020-01-01'); expect(r.claimed).toBe(true) })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IDLE_THEMES, getIdleThemeById } from '../../src/games/bubble-tea-idle/data/themes'
import { IDLE_ACHIEVEMENTS, getIdleAchievementById, type IdleStats } from '../../src/games/bubble-tea-idle/data/achievements'
import {
  canBuyIdleTheme, equipIdleTheme, getAvailableIdleThemes,
  checkIdleAchievements,
  isDailyRewardAvailable, claimDailyReward, DAILY_REWARD_COINS,
} from '../../src/games/bubble-tea-idle/logic/meta'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<IdleStats> = {}): IdleStats {
  return {
    totalTaps: 0, totalCupsSold: 0, totalEarned: 0, level: 0,
    prestigeCount: 0, locationsUnlocked: 1, recipesUnlocked: 1,
    staffHired: 0, themesUnlocked: 1, dailyCompleted: 0, ...overrides,
  }
}

// ===== THEMES =====

describe('IDLE_THEMES', () => {
  it('test_has_6_themes', () => { expect(IDLE_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(IDLE_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(IDLE_THEMES[0].cost).toBe(0); expect(IDLE_THEMES[0].requiredLevel).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < IDLE_THEMES.length; i++) expect(IDLE_THEMES[i].cost).toBeGreaterThanOrEqual(IDLE_THEMES[i - 1].cost) })
  it('test_levels_increase', () => { for (let i = 2; i < IDLE_THEMES.length; i++) expect(IDLE_THEMES[i].requiredLevel).toBeGreaterThanOrEqual(IDLE_THEMES[i - 1].requiredLevel) })
  it('test_all_have_emoji', () => { for (const t of IDLE_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_bgColors', () => { for (const t of IDLE_THEMES) { expect(typeof t.bgTop).toBe('number'); expect(typeof t.bgBot).toBe('number') } })
  it('test_getIdleThemeById_valid', () => { expect(getIdleThemeById('classic').name).toBe('經典奶茶店') })
  it('test_getIdleThemeById_invalid', () => { expect(() => getIdleThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuyIdleTheme', () => {
  it('test_affordable_with_level', () => { expect(canBuyIdleTheme(300, 10, ['classic'], 'matcha')).toBe(true) })
  it('test_insufficient_money', () => { expect(canBuyIdleTheme(50, 10, ['classic'], 'matcha')).toBe(false) })
  it('test_insufficient_level', () => { expect(canBuyIdleTheme(300, 2, ['classic'], 'matcha')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyIdleTheme(300, 10, ['classic', 'matcha'], 'matcha')).toBe(false) })
})

describe('equipIdleTheme', () => {
  it('test_equip_unlocked', () => { expect(equipIdleTheme(['classic', 'matcha'], 'matcha')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipIdleTheme(['classic'], 'cosmic')).toBe(false) })
})

describe('getAvailableIdleThemes', () => {
  it('test_returns_all', () => { expect(getAvailableIdleThemes(99999, 99, ['classic'])).toHaveLength(IDLE_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableIdleThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableIdleThemes(0, 0, ['classic']).find(t => t.theme.id === 'cosmic')!; expect(t.unlocked).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('IDLE_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => { expect(IDLE_ACHIEVEMENTS).toHaveLength(14) })
  it('test_unique_ids', () => { expect(new Set(IDLE_ACHIEVEMENTS.map(a => a.id)).size).toBe(14) })
  it('test_all_have_rewards', () => { for (const a of IDLE_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getIdleAchievementById_valid', () => { expect(getIdleAchievementById('first-tap').name).toBe('初次點擊') })
  it('test_getIdleAchievementById_invalid', () => { expect(() => getIdleAchievementById('fake')).toThrow() })
})

describe('checkIdleAchievements', () => {
  it('test_unlocks_first_tap', () => { const u = checkIdleAchievements(makeStats({ totalTaps: 100 }), []); expect(u.some(a => a.id === 'first-tap')).toBe(true) })
  it('test_unlocks_tap_10000', () => { const u = checkIdleAchievements(makeStats({ totalTaps: 10000 }), []); expect(u.some(a => a.id === 'tap-10000')).toBe(true) })
  it('test_unlocks_cups_100', () => { const u = checkIdleAchievements(makeStats({ totalCupsSold: 100 }), []); expect(u.some(a => a.id === 'cups-100')).toBe(true) })
  it('test_unlocks_cups_1000', () => { const u = checkIdleAchievements(makeStats({ totalCupsSold: 1000 }), []); expect(u.some(a => a.id === 'cups-1000')).toBe(true) })
  it('test_unlocks_earn_10k', () => { const u = checkIdleAchievements(makeStats({ totalEarned: 10000 }), []); expect(u.some(a => a.id === 'earn-10k')).toBe(true) })
  it('test_unlocks_earn_1m', () => { const u = checkIdleAchievements(makeStats({ totalEarned: 1000000 }), []); expect(u.some(a => a.id === 'earn-1m')).toBe(true) })
  it('test_unlocks_earn_100m', () => { const u = checkIdleAchievements(makeStats({ totalEarned: 100000000 }), []); expect(u.some(a => a.id === 'earn-100m')).toBe(true) })
  it('test_unlocks_first_prestige', () => { const u = checkIdleAchievements(makeStats({ prestigeCount: 1 }), []); expect(u.some(a => a.id === 'first-prestige')).toBe(true) })
  it('test_unlocks_prestige_5', () => { const u = checkIdleAchievements(makeStats({ prestigeCount: 5 }), []); expect(u.some(a => a.id === 'prestige-5')).toBe(true) })
  it('test_unlocks_all_locations', () => { const u = checkIdleAchievements(makeStats({ locationsUnlocked: 5 }), []); expect(u.some(a => a.id === 'all-locations')).toBe(true) })
  it('test_unlocks_all_recipes', () => { const u = checkIdleAchievements(makeStats({ recipesUnlocked: 7 }), []); expect(u.some(a => a.id === 'all-recipes')).toBe(true) })
  it('test_unlocks_tea_master', () => { const u = checkIdleAchievements(makeStats({ level: 30, recipesUnlocked: 5 }), []); expect(u.some(a => a.id === 'tea-master')).toBe(true) })
  it('test_tea_master_needs_both', () => { expect(checkIdleAchievements(makeStats({ level: 30, recipesUnlocked: 3 }), []).some(a => a.id === 'tea-master')).toBe(false); expect(checkIdleAchievements(makeStats({ level: 20, recipesUnlocked: 5 }), []).some(a => a.id === 'tea-master')).toBe(false) })
  it('test_unlocks_theme_3', () => { const u = checkIdleAchievements(makeStats({ themesUnlocked: 3 }), []); expect(u.some(a => a.id === 'theme-3')).toBe(true) })
  it('test_unlocks_daily_3', () => { const u = checkIdleAchievements(makeStats({ dailyCompleted: 3 }), []); expect(u.some(a => a.id === 'daily-3')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkIdleAchievements(makeStats({ totalTaps: 100 }), ['first-tap']); expect(u.some(a => a.id === 'first-tap')).toBe(false) })
  it('test_multiple', () => { const u = checkIdleAchievements(makeStats({ totalTaps: 100, totalCupsSold: 100, totalEarned: 10000 }), []); expect(u.length).toBeGreaterThanOrEqual(3) })
  it('test_insufficient_no_unlock', () => { const u = checkIdleAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_boundary_first_tap', () => { expect(checkIdleAchievements(makeStats({ totalTaps: 99 }), []).some(a => a.id === 'first-tap')).toBe(false); expect(checkIdleAchievements(makeStats({ totalTaps: 100 }), []).some(a => a.id === 'first-tap')).toBe(true) })
  it('test_boundary_earn_100m', () => { expect(checkIdleAchievements(makeStats({ totalEarned: 99999999 }), []).some(a => a.id === 'earn-100m')).toBe(false); expect(checkIdleAchievements(makeStats({ totalEarned: 100000000 }), []).some(a => a.id === 'earn-100m')).toBe(true) })
  it('test_boundary_prestige_5', () => { expect(checkIdleAchievements(makeStats({ prestigeCount: 4 }), []).some(a => a.id === 'prestige-5')).toBe(false); expect(checkIdleAchievements(makeStats({ prestigeCount: 5 }), []).some(a => a.id === 'prestige-5')).toBe(true) })
  it('test_boundary_cups_1000', () => { expect(checkIdleAchievements(makeStats({ totalCupsSold: 999 }), []).some(a => a.id === 'cups-1000')).toBe(false); expect(checkIdleAchievements(makeStats({ totalCupsSold: 1000 }), []).some(a => a.id === 'cups-1000')).toBe(true) })
})

// ===== DAILY REWARD =====

describe('daily reward', () => {
  it('test_reward_amount', () => { expect(DAILY_REWARD_COINS).toBe(100) })
  it('test_available_initially', () => { expect(isDailyRewardAvailable('')).toBe(true) })
  it('test_not_available_after_claim', () => { expect(isDailyRewardAvailable(new Date().toISOString().slice(0, 10))).toBe(false) })
  it('test_claim_first_time', () => { const r = claimDailyReward(''); expect(r.claimed).toBe(true) })
  it('test_claim_already_claimed', () => { const r = claimDailyReward(new Date().toISOString().slice(0, 10)); expect(r.claimed).toBe(false) })
  it('test_claim_different_day', () => { const r = claimDailyReward('2020-01-01'); expect(r.claimed).toBe(true) })
})

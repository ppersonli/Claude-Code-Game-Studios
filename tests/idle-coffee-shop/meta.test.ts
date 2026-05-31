import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CAFE_THEMES, getCafeThemeById } from '../../src/games/idle-coffee-shop/data/themes'
import { CAFE_ACHIEVEMENTS, getCafeAchievementById, type CafeStats } from '../../src/games/idle-coffee-shop/data/achievements'
import {
  canBuyCafeTheme, equipCafeTheme, getAvailableCafeThemes,
  checkCafeAchievements,
  isDailyRewardAvailable, claimDailyReward, DAILY_REWARD_COINS,
} from '../../src/games/idle-coffee-shop/composables/useMeta'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<CafeStats> = {}): CafeStats {
  return {
    totalCups: 0, totalClicks: 0, totalEarned: 0, highestLevel: 0,
    prestigeCount: 0, employeesHired: 0, recipesUnlocked: 0,
    themesUnlocked: 1, dailyCompleted: 0, gamesPlayed: 0, ...overrides,
  }
}

// ===== THEMES =====

describe('CAFE_THEMES', () => {
  it('test_has_6_themes', () => { expect(CAFE_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(CAFE_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(CAFE_THEMES[0].cost).toBe(0); expect(CAFE_THEMES[0].requiredLevel).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < CAFE_THEMES.length; i++) expect(CAFE_THEMES[i].cost).toBeGreaterThanOrEqual(CAFE_THEMES[i - 1].cost) })
  it('test_levels_increase', () => { for (let i = 2; i < CAFE_THEMES.length; i++) expect(CAFE_THEMES[i].requiredLevel).toBeGreaterThanOrEqual(CAFE_THEMES[i - 1].requiredLevel) })
  it('test_all_have_emoji', () => { for (const t of CAFE_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_bgColor', () => { for (const t of CAFE_THEMES) expect(typeof t.bgColor).toBe('number') })
  it('test_getCafeThemeById_valid', () => { expect(getCafeThemeById('classic').name).toBe('經典咖啡館') })
  it('test_getCafeThemeById_invalid', () => { expect(() => getCafeThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuyCafeTheme', () => {
  it('test_affordable_with_level', () => { expect(canBuyCafeTheme(300, 10, ['classic'], 'matcha')).toBe(true) })
  it('test_insufficient_coins', () => { expect(canBuyCafeTheme(50, 10, ['classic'], 'matcha')).toBe(false) })
  it('test_insufficient_level', () => { expect(canBuyCafeTheme(300, 2, ['classic'], 'matcha')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyCafeTheme(300, 10, ['classic', 'matcha'], 'matcha')).toBe(false) })
})

describe('equipCafeTheme', () => {
  it('test_equip_unlocked', () => { expect(equipCafeTheme(['classic', 'matcha'], 'matcha')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipCafeTheme(['classic'], 'cosmic')).toBe(false) })
})

describe('getAvailableCafeThemes', () => {
  it('test_returns_all', () => { expect(getAvailableCafeThemes(99999, 99, ['classic'])).toHaveLength(CAFE_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableCafeThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableCafeThemes(0, 0, ['classic']).find(t => t.theme.id === 'cosmic')!; expect(t.unlocked).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('CAFE_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => { expect(CAFE_ACHIEVEMENTS).toHaveLength(14) })
  it('test_unique_ids', () => { expect(new Set(CAFE_ACHIEVEMENTS.map(a => a.id)).size).toBe(14) })
  it('test_all_have_rewards', () => { for (const a of CAFE_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getCafeAchievementById_valid', () => { expect(getCafeAchievementById('first-cup').name).toBe('第一杯') })
  it('test_getCafeAchievementById_invalid', () => { expect(() => getCafeAchievementById('fake')).toThrow() })
})

describe('checkCafeAchievements', () => {
  it('test_unlocks_first_cup', () => { const u = checkCafeAchievements(makeStats({ totalCups: 1 }), []); expect(u.some(a => a.id === 'first-cup')).toBe(true) })
  it('test_unlocks_cups_100', () => { const u = checkCafeAchievements(makeStats({ totalCups: 100 }), []); expect(u.some(a => a.id === 'cups-100')).toBe(true) })
  it('test_unlocks_cups_1000', () => { const u = checkCafeAchievements(makeStats({ totalCups: 1000 }), []); expect(u.some(a => a.id === 'cups-1000')).toBe(true) })
  it('test_unlocks_clicks_500', () => { const u = checkCafeAchievements(makeStats({ totalClicks: 500 }), []); expect(u.some(a => a.id === 'clicks-500')).toBe(true) })
  it('test_unlocks_clicks_5000', () => { const u = checkCafeAchievements(makeStats({ totalClicks: 5000 }), []); expect(u.some(a => a.id === 'clicks-5000')).toBe(true) })
  it('test_unlocks_earn_100k', () => { const u = checkCafeAchievements(makeStats({ totalEarned: 100000 }), []); expect(u.some(a => a.id === 'earn-100k')).toBe(true) })
  it('test_unlocks_earn_10m', () => { const u = checkCafeAchievements(makeStats({ totalEarned: 10000000 }), []); expect(u.some(a => a.id === 'earn-10m')).toBe(true) })
  it('test_unlocks_level_20', () => { const u = checkCafeAchievements(makeStats({ highestLevel: 20 }), []); expect(u.some(a => a.id === 'level-20')).toBe(true) })
  it('test_unlocks_level_50', () => { const u = checkCafeAchievements(makeStats({ highestLevel: 50 }), []); expect(u.some(a => a.id === 'level-50')).toBe(true) })
  it('test_unlocks_prestige_1', () => { const u = checkCafeAchievements(makeStats({ prestigeCount: 1 }), []); expect(u.some(a => a.id === 'prestige-1')).toBe(true) })
  it('test_unlocks_prestige_5', () => { const u = checkCafeAchievements(makeStats({ prestigeCount: 5 }), []); expect(u.some(a => a.id === 'prestige-5')).toBe(true) })
  it('test_unlocks_barista_master', () => { const u = checkCafeAchievements(makeStats({ recipesUnlocked: 6, employeesHired: 10 }), []); expect(u.some(a => a.id === 'barista-master')).toBe(true) })
  it('test_barista_master_needs_both', () => { expect(checkCafeAchievements(makeStats({ recipesUnlocked: 6, employeesHired: 5 }), []).some(a => a.id === 'barista-master')).toBe(false); expect(checkCafeAchievements(makeStats({ recipesUnlocked: 3, employeesHired: 10 }), []).some(a => a.id === 'barista-master')).toBe(false) })
  it('test_unlocks_theme_3', () => { const u = checkCafeAchievements(makeStats({ themesUnlocked: 3 }), []); expect(u.some(a => a.id === 'theme-3')).toBe(true) })
  it('test_unlocks_daily_3', () => { const u = checkCafeAchievements(makeStats({ dailyCompleted: 3 }), []); expect(u.some(a => a.id === 'daily-3')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkCafeAchievements(makeStats({ totalCups: 1 }), ['first-cup']); expect(u.some(a => a.id === 'first-cup')).toBe(false) })
  it('test_multiple', () => { const u = checkCafeAchievements(makeStats({ totalCups: 100, totalClicks: 500, prestigeCount: 1 }), []); expect(u.length).toBeGreaterThanOrEqual(3) })
  it('test_insufficient_no_unlock', () => { const u = checkCafeAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_boundary_first_cup', () => { expect(checkCafeAchievements(makeStats({ totalCups: 0 }), []).some(a => a.id === 'first-cup')).toBe(false); expect(checkCafeAchievements(makeStats({ totalCups: 1 }), []).some(a => a.id === 'first-cup')).toBe(true) })
  it('test_boundary_cups_1000', () => { expect(checkCafeAchievements(makeStats({ totalCups: 999 }), []).some(a => a.id === 'cups-1000')).toBe(false); expect(checkCafeAchievements(makeStats({ totalCups: 1000 }), []).some(a => a.id === 'cups-1000')).toBe(true) })
  it('test_boundary_level_50', () => { expect(checkCafeAchievements(makeStats({ highestLevel: 49 }), []).some(a => a.id === 'level-50')).toBe(false); expect(checkCafeAchievements(makeStats({ highestLevel: 50 }), []).some(a => a.id === 'level-50')).toBe(true) })
  it('test_boundary_prestige_5', () => { expect(checkCafeAchievements(makeStats({ prestigeCount: 4 }), []).some(a => a.id === 'prestige-5')).toBe(false); expect(checkCafeAchievements(makeStats({ prestigeCount: 5 }), []).some(a => a.id === 'prestige-5')).toBe(true) })
  it('test_boundary_earn_10m', () => { expect(checkCafeAchievements(makeStats({ totalEarned: 9999999 }), []).some(a => a.id === 'earn-10m')).toBe(false); expect(checkCafeAchievements(makeStats({ totalEarned: 10000000 }), []).some(a => a.id === 'earn-10m')).toBe(true) })
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

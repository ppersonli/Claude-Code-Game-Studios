import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TYCOON_THEMES, getTycoonThemeById } from '../../src/games/boba-tycoon/data/themes'
import { TYCOON_ACHIEVEMENTS, getTycoonAchievementById, type TycoonStats } from '../../src/games/boba-tycoon/data/achievements'
import {
  canBuyTycoonTheme, equipTycoonTheme, getAvailableTycoonThemes,
  checkTycoonAchievements, buildTycoonStats,
  isDailyRewardAvailable, claimDailyReward, DAILY_REWARD_COINS,
} from '../../src/games/boba-tycoon/logic/meta'
import { createInitialState, tap, type TycoonState } from '../../src/games/boba-tycoon/logic/game-state'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<TycoonStats> = {}): TycoonStats {
  return {
    totalTaps: 0, totalEarned: 0, level: 1, prestigeCount: 0,
    locationsUnlocked: 1, recipesUnlocked: 1, staffHired: 0,
    themesUnlocked: 1, dailyCompleted: 0, ...overrides,
  }
}

// ===== THEMES =====

describe('TYCOON_THEMES', () => {
  it('test_has_6_themes', () => { expect(TYCOON_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(TYCOON_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(TYCOON_THEMES[0].cost).toBe(0); expect(TYCOON_THEMES[0].requiredLevel).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < TYCOON_THEMES.length; i++) expect(TYCOON_THEMES[i].cost).toBeGreaterThanOrEqual(TYCOON_THEMES[i - 1].cost) })
  it('test_levels_increase', () => { for (let i = 2; i < TYCOON_THEMES.length; i++) expect(TYCOON_THEMES[i].requiredLevel).toBeGreaterThanOrEqual(TYCOON_THEMES[i - 1].requiredLevel) })
  it('test_all_have_emoji', () => { for (const t of TYCOON_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_bgColors', () => { for (const t of TYCOON_THEMES) { expect(typeof t.bgTop).toBe('number'); expect(typeof t.bgBot).toBe('number') } })
  it('test_getTycoonThemeById_valid', () => { expect(getTycoonThemeById('classic').name).toBe('經典帝國') })
  it('test_getTycoonThemeById_invalid', () => { expect(() => getTycoonThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuyTycoonTheme', () => {
  it('test_affordable_with_level', () => { expect(canBuyTycoonTheme(1000, 10, ['classic'], 'matcha')).toBe(true) })
  it('test_insufficient_money', () => { expect(canBuyTycoonTheme(100, 10, ['classic'], 'matcha')).toBe(false) })
  it('test_insufficient_level', () => { expect(canBuyTycoonTheme(5000, 5, ['classic'], 'matcha')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyTycoonTheme(5000, 10, ['classic', 'matcha'], 'matcha')).toBe(false) })
  it('test_classic_already_owned', () => { expect(canBuyTycoonTheme(99999, 99, ['classic'], 'classic')).toBe(false) })
})

describe('equipTycoonTheme', () => {
  it('test_equip_unlocked', () => { expect(equipTycoonTheme(['classic', 'taro'], 'taro')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipTycoonTheme(['classic'], 'galaxy')).toBe(false) })
})

describe('getAvailableTycoonThemes', () => {
  it('test_returns_all', () => { expect(getAvailableTycoonThemes(99999, 99, ['classic'])).toHaveLength(TYCOON_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableTycoonThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableTycoonThemes(0, 0, ['classic']).find(t => t.theme.id === 'cosmic')!; expect(t.unlocked).toBe(false); expect(t.canBuy).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('TYCOON_ACHIEVEMENTS', () => {
  it('test_has_12_achievements', () => { expect(TYCOON_ACHIEVEMENTS).toHaveLength(12) })
  it('test_unique_ids', () => { expect(new Set(TYCOON_ACHIEVEMENTS.map(a => a.id)).size).toBe(12) })
  it('test_all_have_rewards', () => { for (const a of TYCOON_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getTycoonAchievementById_valid', () => { expect(getTycoonAchievementById('first-tap').name).toBe('初次點擊') })
  it('test_getTycoonAchievementById_invalid', () => { expect(() => getTycoonAchievementById('fake')).toThrow() })
})

describe('checkTycoonAchievements', () => {
  it('test_unlocks_first_tap', () => { const u = checkTycoonAchievements(makeStats({ totalTaps: 100 }), []); expect(u.some(a => a.id === 'first-tap')).toBe(true) })
  it('test_unlocks_tap_master', () => { const u = checkTycoonAchievements(makeStats({ totalTaps: 10000 }), []); expect(u.some(a => a.id === 'tap-master')).toBe(true) })
  it('test_unlocks_earn_10k', () => { const u = checkTycoonAchievements(makeStats({ totalEarned: 10000 }), []); expect(u.some(a => a.id === 'earn-10k')).toBe(true) })
  it('test_unlocks_earn_1m', () => { const u = checkTycoonAchievements(makeStats({ totalEarned: 1000000 }), []); expect(u.some(a => a.id === 'earn-1m')).toBe(true) })
  it('test_unlocks_first_prestige', () => { const u = checkTycoonAchievements(makeStats({ prestigeCount: 1 }), []); expect(u.some(a => a.id === 'first-prestige')).toBe(true) })
  it('test_unlocks_prestige_5', () => { const u = checkTycoonAchievements(makeStats({ prestigeCount: 5 }), []); expect(u.some(a => a.id === 'prestige-5')).toBe(true) })
  it('test_unlocks_all_locations', () => { const u = checkTycoonAchievements(makeStats({ locationsUnlocked: 6 }), []); expect(u.some(a => a.id === 'all-locations')).toBe(true) })
  it('test_unlocks_all_recipes', () => { const u = checkTycoonAchievements(makeStats({ recipesUnlocked: 8 }), []); expect(u.some(a => a.id === 'all-recipes')).toBe(true) })
  it('test_unlocks_theme_collector', () => { const u = checkTycoonAchievements(makeStats({ themesUnlocked: 3 }), []); expect(u.some(a => a.id === 'theme-collector')).toBe(true) })
  it('test_unlocks_daily_fan', () => { const u = checkTycoonAchievements(makeStats({ dailyCompleted: 3 }), []); expect(u.some(a => a.id === 'daily-fan')).toBe(true) })
  it('test_unlocks_level_30', () => { const u = checkTycoonAchievements(makeStats({ level: 30 }), []); expect(u.some(a => a.id === 'level-30')).toBe(true) })
  it('test_unlocks_staff_10', () => { const u = checkTycoonAchievements(makeStats({ staffHired: 10 }), []); expect(u.some(a => a.id === 'staff-10')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkTycoonAchievements(makeStats({ totalTaps: 100 }), ['first-tap']); expect(u.some(a => a.id === 'first-tap')).toBe(false) })
  it('test_multiple_achievements', () => { const u = checkTycoonAchievements(makeStats({ totalTaps: 10000, totalEarned: 1000000, prestigeCount: 5, level: 30 }), []); expect(u.length).toBeGreaterThanOrEqual(4) })
  it('test_insufficient_stats_no_unlock', () => { const u = checkTycoonAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_first_tap_boundary', () => { expect(checkTycoonAchievements(makeStats({ totalTaps: 99 }), []).some(a => a.id === 'first-tap')).toBe(false); expect(checkTycoonAchievements(makeStats({ totalTaps: 100 }), []).some(a => a.id === 'first-tap')).toBe(true) })
  it('test_level_30_boundary', () => { expect(checkTycoonAchievements(makeStats({ level: 29 }), []).some(a => a.id === 'level-30')).toBe(false); expect(checkTycoonAchievements(makeStats({ level: 30 }), []).some(a => a.id === 'level-30')).toBe(true) })
})

// ===== BUILD STATS =====

describe('buildTycoonStats', () => {
  it('test_builds_from_state', () => {
    const state = createInitialState()
    state.totalTaps = 500
    state.totalEarned = 10000
    state.level = 10
    state.prestigeCount = 2
    state.unlockedLocations = ['cart', 'kiosk']
    state.unlockedRecipes = ['classic-milk-tea', 'taro-boba']
    state.staffCounts = { intern: 3, barista: 2 }
    const stats = buildTycoonStats(state, ['classic', 'taro'], 3)
    expect(stats.totalTaps).toBe(500)
    expect(stats.totalEarned).toBe(10000)
    expect(stats.level).toBe(10)
    expect(stats.prestigeCount).toBe(2)
    expect(stats.locationsUnlocked).toBe(2)
    expect(stats.recipesUnlocked).toBe(2)
    expect(stats.staffHired).toBe(5)
    expect(stats.themesUnlocked).toBe(2)
    expect(stats.dailyCompleted).toBe(3)
  })
})

// ===== DAILY REWARD =====

describe('daily reward', () => {
  it('test_reward_amount', () => { expect(DAILY_REWARD_COINS).toBe(100) })
  it('test_available_initially', () => { expect(isDailyRewardAvailable('')).toBe(true) })
  it('test_not_available_after_claim', () => { expect(isDailyRewardAvailable(new Date().toISOString().slice(0, 10))).toBe(false) })
  it('test_claim_first_time', () => { const r = claimDailyReward(''); expect(r.claimed).toBe(true); expect(r.today).toBeTruthy() })
  it('test_claim_already_claimed', () => { const r = claimDailyReward(new Date().toISOString().slice(0, 10)); expect(r.claimed).toBe(false) })
  it('test_claim_different_day', () => { const r = claimDailyReward('2020-01-01'); expect(r.claimed).toBe(true) })
})

// ===== META FIELDS IN STATE =====

describe('TycoonState meta fields', () => {
  it('test_createInitialState_has_meta_defaults', () => {
    const s = createInitialState()
    expect(s.unlockedThemes).toEqual(['classic'])
    expect(s.equippedTheme).toBe('classic')
    expect(s.achievements).toEqual([])
    expect(s.dailyRewardCount).toBe(0)
    expect(s.lastDailyRewardDate).toBe('')
  })
})

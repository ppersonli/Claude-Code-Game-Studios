import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SWEET_THEMES, getSweetThemeById } from '../../src/games/sweet-sort/data/themes'
import { SWEET_ACHIEVEMENTS, getSweetAchievementById, type SweetStats } from '../../src/games/sweet-sort/data/achievements'
import {
  canBuySweetTheme, equipSweetTheme, getAvailableSweetThemes,
  checkSweetAchievements,
  levelCoins, dailyRewardCoins,
  isDailyRewardAvailable, claimDailyReward,
} from '../../src/games/sweet-sort/logic/meta'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<SweetStats> = {}): SweetStats {
  return {
    levelsCompleted: 0, totalStars: 0, threeStarLevels: 0, highestLevel: 0,
    totalMoves: 0, bestCombo: 0, themesUnlocked: 1, dailyCompleted: 0,
    gamesPlayed: 0, ...overrides,
  }
}

// ===== THEMES =====

describe('SWEET_THEMES', () => {
  it('test_has_6_themes', () => { expect(SWEET_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(SWEET_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(SWEET_THEMES[0].cost).toBe(0); expect(SWEET_THEMES[0].requiredStars).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < SWEET_THEMES.length; i++) expect(SWEET_THEMES[i].cost).toBeGreaterThanOrEqual(SWEET_THEMES[i - 1].cost) })
  it('test_stars_increase', () => { for (let i = 2; i < SWEET_THEMES.length; i++) expect(SWEET_THEMES[i].requiredStars).toBeGreaterThanOrEqual(SWEET_THEMES[i - 1].requiredStars) })
  it('test_all_have_emoji', () => { for (const t of SWEET_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_bgColor', () => { for (const t of SWEET_THEMES) expect(typeof t.bgColor).toBe('number') })
  it('test_getSweetThemeById_valid', () => { expect(getSweetThemeById('classic').name).toBe('經典糖果') })
  it('test_getSweetThemeById_invalid', () => { expect(() => getSweetThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuySweetTheme', () => {
  it('test_affordable_with_stars', () => { expect(canBuySweetTheme(100, 10, ['classic'], 'chocolate')).toBe(true) })
  it('test_insufficient_coins', () => { expect(canBuySweetTheme(10, 10, ['classic'], 'chocolate')).toBe(false) })
  it('test_insufficient_stars', () => { expect(canBuySweetTheme(100, 2, ['classic'], 'chocolate')).toBe(false) })
  it('test_already_owned', () => { expect(canBuySweetTheme(100, 10, ['classic', 'chocolate'], 'chocolate')).toBe(false) })
})

describe('equipSweetTheme', () => {
  it('test_equip_unlocked', () => { expect(equipSweetTheme(['classic', 'chocolate'], 'chocolate')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipSweetTheme(['classic'], 'rainbow')).toBe(false) })
})

describe('getAvailableSweetThemes', () => {
  it('test_returns_all', () => { expect(getAvailableSweetThemes(9999, 999, ['classic'])).toHaveLength(SWEET_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableSweetThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableSweetThemes(0, 0, ['classic']).find(t => t.theme.id === 'rainbow')!; expect(t.unlocked).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('SWEET_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => { expect(SWEET_ACHIEVEMENTS).toHaveLength(14) })
  it('test_unique_ids', () => { expect(new Set(SWEET_ACHIEVEMENTS.map(a => a.id)).size).toBe(14) })
  it('test_all_have_rewards', () => { for (const a of SWEET_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getSweetAchievementById_valid', () => { expect(getSweetAchievementById('first-sort').name).toBe('初次排序') })
  it('test_getSweetAchievementById_invalid', () => { expect(() => getSweetAchievementById('fake')).toThrow() })
})

describe('checkSweetAchievements', () => {
  it('test_unlocks_first_sort', () => { const u = checkSweetAchievements(makeStats({ levelsCompleted: 1 }), []); expect(u.some(a => a.id === 'first-sort')).toBe(true) })
  it('test_unlocks_ten_levels', () => { const u = checkSweetAchievements(makeStats({ levelsCompleted: 10 }), []); expect(u.some(a => a.id === 'ten-levels')).toBe(true) })
  it('test_unlocks_star_10', () => { const u = checkSweetAchievements(makeStats({ totalStars: 10 }), []); expect(u.some(a => a.id === 'star-10')).toBe(true) })
  it('test_unlocks_star_50', () => { const u = checkSweetAchievements(makeStats({ totalStars: 50 }), []); expect(u.some(a => a.id === 'star-50')).toBe(true) })
  it('test_unlocks_star_100', () => { const u = checkSweetAchievements(makeStats({ totalStars: 100 }), []); expect(u.some(a => a.id === 'star-100')).toBe(true) })
  it('test_unlocks_perfect_3', () => { const u = checkSweetAchievements(makeStats({ threeStarLevels: 3 }), []); expect(u.some(a => a.id === 'perfect-3')).toBe(true) })
  it('test_unlocks_perfect_10', () => { const u = checkSweetAchievements(makeStats({ threeStarLevels: 10 }), []); expect(u.some(a => a.id === 'perfect-10')).toBe(true) })
  it('test_unlocks_level_20', () => { const u = checkSweetAchievements(makeStats({ highestLevel: 20 }), []); expect(u.some(a => a.id === 'level-20')).toBe(true) })
  it('test_unlocks_level_50', () => { const u = checkSweetAchievements(makeStats({ highestLevel: 50 }), []); expect(u.some(a => a.id === 'level-50')).toBe(true) })
  it('test_unlocks_moves_1000', () => { const u = checkSweetAchievements(makeStats({ totalMoves: 1000 }), []); expect(u.some(a => a.id === 'moves-1000')).toBe(true) })
  it('test_unlocks_sweet_tooth', () => { const u = checkSweetAchievements(makeStats({ levelsCompleted: 20, totalStars: 30 }), []); expect(u.some(a => a.id === 'sweet-tooth')).toBe(true) })
  it('test_sweet_tooth_needs_both', () => { expect(checkSweetAchievements(makeStats({ levelsCompleted: 20, totalStars: 10 }), []).some(a => a.id === 'sweet-tooth')).toBe(false); expect(checkSweetAchievements(makeStats({ levelsCompleted: 10, totalStars: 30 }), []).some(a => a.id === 'sweet-tooth')).toBe(false) })
  it('test_unlocks_theme_3', () => { const u = checkSweetAchievements(makeStats({ themesUnlocked: 3 }), []); expect(u.some(a => a.id === 'theme-3')).toBe(true) })
  it('test_unlocks_daily_3', () => { const u = checkSweetAchievements(makeStats({ dailyCompleted: 3 }), []); expect(u.some(a => a.id === 'daily-3')).toBe(true) })
  it('test_unlocks_veteran', () => { const u = checkSweetAchievements(makeStats({ gamesPlayed: 50 }), []); expect(u.some(a => a.id === 'veteran')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkSweetAchievements(makeStats({ levelsCompleted: 1 }), ['first-sort']); expect(u.some(a => a.id === 'first-sort')).toBe(false) })
  it('test_multiple', () => { const u = checkSweetAchievements(makeStats({ levelsCompleted: 10, totalStars: 50, threeStarLevels: 3 }), []); expect(u.length).toBeGreaterThanOrEqual(3) })
  it('test_insufficient_no_unlock', () => { const u = checkSweetAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_boundary_first_sort', () => { expect(checkSweetAchievements(makeStats({ levelsCompleted: 0 }), []).some(a => a.id === 'first-sort')).toBe(false); expect(checkSweetAchievements(makeStats({ levelsCompleted: 1 }), []).some(a => a.id === 'first-sort')).toBe(true) })
  it('test_boundary_star_100', () => { expect(checkSweetAchievements(makeStats({ totalStars: 99 }), []).some(a => a.id === 'star-100')).toBe(false); expect(checkSweetAchievements(makeStats({ totalStars: 100 }), []).some(a => a.id === 'star-100')).toBe(true) })
  it('test_boundary_level_50', () => { expect(checkSweetAchievements(makeStats({ highestLevel: 49 }), []).some(a => a.id === 'level-50')).toBe(false); expect(checkSweetAchievements(makeStats({ highestLevel: 50 }), []).some(a => a.id === 'level-50')).toBe(true) })
  it('test_boundary_veteran', () => { expect(checkSweetAchievements(makeStats({ gamesPlayed: 49 }), []).some(a => a.id === 'veteran')).toBe(false); expect(checkSweetAchievements(makeStats({ gamesPlayed: 50 }), []).some(a => a.id === 'veteran')).toBe(true) })
})

// ===== COINS =====

describe('coins', () => {
  it('test_levelCoins_1_star', () => { expect(levelCoins(1)).toBe(10) })
  it('test_levelCoins_2_stars', () => { expect(levelCoins(2)).toBe(20) })
  it('test_levelCoins_3_stars', () => { expect(levelCoins(3)).toBe(30) })
  it('test_levelCoins_0_stars', () => { expect(levelCoins(0)).toBe(0) })
  it('test_dailyRewardCoins', () => { expect(dailyRewardCoins()).toBe(50) })
})

// ===== DAILY REWARD =====

describe('daily reward', () => {
  it('test_available_initially', () => { expect(isDailyRewardAvailable('')).toBe(true) })
  it('test_not_available_after_claim', () => { expect(isDailyRewardAvailable(new Date().toISOString().slice(0, 10))).toBe(false) })
  it('test_claim_first_time', () => { const r = claimDailyReward(''); expect(r.claimed).toBe(true) })
  it('test_claim_already_claimed', () => { const r = claimDailyReward(new Date().toISOString().slice(0, 10)); expect(r.claimed).toBe(false) })
  it('test_claim_different_day', () => { const r = claimDailyReward('2020-01-01'); expect(r.claimed).toBe(true) })
})

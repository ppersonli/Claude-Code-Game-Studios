import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SHOOTER_THEMES, getShooterThemeById } from '../../src/games/bubble-shooter/data/themes'
import { SHOOTER_ACHIEVEMENTS, getShooterAchievementById, type ShooterStats } from '../../src/games/bubble-shooter/data/achievements'
import {
  canBuyShooterTheme, equipShooterTheme, getAvailableShooterThemes,
  checkShooterAchievements,
  levelCoins, dailyRewardCoins,
  isDailyRewardAvailable, claimDailyReward,
} from '../../src/games/bubble-shooter/logic/meta'
import { loadSave, saveFull, createDefaultSave } from '../../src/games/bubble-shooter/logic/save'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<ShooterStats> = {}): ShooterStats {
  return {
    levelsCompleted: 0, totalPopped: 0, totalFallen: 0, highScore: 0,
    perfectLevels: 0, maxLevel: 0, themesUnlocked: 1, dailyCompleted: 0, totalShots: 0,
    ...overrides,
  }
}

// ===== THEMES =====

describe('SHOOTER_THEMES', () => {
  it('test_has_6_themes', () => { expect(SHOOTER_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(SHOOTER_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(SHOOTER_THEMES[0].cost).toBe(0); expect(SHOOTER_THEMES[0].requiredLevels).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < SHOOTER_THEMES.length; i++) expect(SHOOTER_THEMES[i].cost).toBeGreaterThanOrEqual(SHOOTER_THEMES[i - 1].cost) })
  it('test_levels_increase', () => { for (let i = 2; i < SHOOTER_THEMES.length; i++) expect(SHOOTER_THEMES[i].requiredLevels).toBeGreaterThanOrEqual(SHOOTER_THEMES[i - 1].requiredLevels) })
  it('test_all_have_emoji', () => { for (const t of SHOOTER_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_bgColors', () => { for (const t of SHOOTER_THEMES) { expect(typeof t.bgTop).toBe('number'); expect(typeof t.bgBot).toBe('number') } })
  it('test_getShooterThemeById_valid', () => { expect(getShooterThemeById('classic').name).toBe('經典紫色') })
  it('test_getShooterThemeById_invalid', () => { expect(() => getShooterThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuyShooterTheme', () => {
  it('test_affordable_with_levels', () => { expect(canBuyShooterTheme(100, 5, ['classic'], 'ocean')).toBe(true) })
  it('test_insufficient_coins', () => { expect(canBuyShooterTheme(10, 5, ['classic'], 'ocean')).toBe(false) })
  it('test_insufficient_levels', () => { expect(canBuyShooterTheme(100, 1, ['classic'], 'ocean')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyShooterTheme(100, 5, ['classic', 'ocean'], 'ocean')).toBe(false) })
})

describe('equipShooterTheme', () => {
  it('test_equip_unlocked', () => { expect(equipShooterTheme(['classic', 'ocean'], 'ocean')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipShooterTheme(['classic'], 'cosmic')).toBe(false) })
})

describe('getAvailableShooterThemes', () => {
  it('test_returns_all', () => { expect(getAvailableShooterThemes(9999, 50, ['classic'])).toHaveLength(SHOOTER_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableShooterThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableShooterThemes(0, 0, ['classic']).find(t => t.theme.id === 'cosmic')!; expect(t.unlocked).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('SHOOTER_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => { expect(SHOOTER_ACHIEVEMENTS).toHaveLength(14) })
  it('test_unique_ids', () => { expect(new Set(SHOOTER_ACHIEVEMENTS.map(a => a.id)).size).toBe(14) })
  it('test_all_have_rewards', () => { for (const a of SHOOTER_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getShooterAchievementById_valid', () => { expect(getShooterAchievementById('first-clear').name).toBe('初次通關') })
  it('test_getShooterAchievementById_invalid', () => { expect(() => getShooterAchievementById('fake')).toThrow() })
})

describe('checkShooterAchievements', () => {
  it('test_unlocks_first_clear', () => { const u = checkShooterAchievements(makeStats({ levelsCompleted: 1 }), []); expect(u.some(a => a.id === 'first-clear')).toBe(true) })
  it('test_unlocks_ten_clears', () => { const u = checkShooterAchievements(makeStats({ levelsCompleted: 10 }), []); expect(u.some(a => a.id === 'ten-clears')).toBe(true) })
  it('test_unlocks_pop_100', () => { const u = checkShooterAchievements(makeStats({ totalPopped: 100 }), []); expect(u.some(a => a.id === 'pop-100')).toBe(true) })
  it('test_unlocks_pop_1000', () => { const u = checkShooterAchievements(makeStats({ totalPopped: 1000 }), []); expect(u.some(a => a.id === 'pop-1000')).toBe(true) })
  it('test_unlocks_sharpshooter', () => { const u = checkShooterAchievements(makeStats({ perfectLevels: 1 }), []); expect(u.some(a => a.id === 'sharpshooter')).toBe(true) })
  it('test_unlocks_perfect_5', () => { const u = checkShooterAchievements(makeStats({ perfectLevels: 5 }), []); expect(u.some(a => a.id === 'perfect-5')).toBe(true) })
  it('test_unlocks_score_1000', () => { const u = checkShooterAchievements(makeStats({ highScore: 1000 }), []); expect(u.some(a => a.id === 'score-1000')).toBe(true) })
  it('test_unlocks_score_5000', () => { const u = checkShooterAchievements(makeStats({ highScore: 5000 }), []); expect(u.some(a => a.id === 'score-5000')).toBe(true) })
  it('test_unlocks_level_25', () => { const u = checkShooterAchievements(makeStats({ maxLevel: 25 }), []); expect(u.some(a => a.id === 'level-25')).toBe(true) })
  it('test_unlocks_level_50', () => { const u = checkShooterAchievements(makeStats({ maxLevel: 50 }), []); expect(u.some(a => a.id === 'level-50')).toBe(true) })
  it('test_unlocks_theme_3', () => { const u = checkShooterAchievements(makeStats({ themesUnlocked: 3 }), []); expect(u.some(a => a.id === 'theme-3')).toBe(true) })
  it('test_unlocks_daily_3', () => { const u = checkShooterAchievements(makeStats({ dailyCompleted: 3 }), []); expect(u.some(a => a.id === 'daily-3')).toBe(true) })
  it('test_unlocks_chain_5', () => { const u = checkShooterAchievements(makeStats({ totalFallen: 50 }), []); expect(u.some(a => a.id === 'chain-5')).toBe(true) })
  it('test_unlocks_veteran', () => { const u = checkShooterAchievements(makeStats({ totalShots: 500 }), []); expect(u.some(a => a.id === 'veteran')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkShooterAchievements(makeStats({ levelsCompleted: 1 }), ['first-clear']); expect(u.some(a => a.id === 'first-clear')).toBe(false) })
  it('test_multiple', () => { const u = checkShooterAchievements(makeStats({ levelsCompleted: 10, totalPopped: 1000, highScore: 5000, maxLevel: 50 }), []); expect(u.length).toBeGreaterThanOrEqual(4) })
  it('test_insufficient_no_unlock', () => { const u = checkShooterAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_boundary_first_clear', () => { expect(checkShooterAchievements(makeStats({ levelsCompleted: 0 }), []).some(a => a.id === 'first-clear')).toBe(false); expect(checkShooterAchievements(makeStats({ levelsCompleted: 1 }), []).some(a => a.id === 'first-clear')).toBe(true) })
  it('test_boundary_score_1000', () => { expect(checkShooterAchievements(makeStats({ highScore: 999 }), []).some(a => a.id === 'score-1000')).toBe(false); expect(checkShooterAchievements(makeStats({ highScore: 1000 }), []).some(a => a.id === 'score-1000')).toBe(true) })
  it('test_boundary_level_50', () => { expect(checkShooterAchievements(makeStats({ maxLevel: 49 }), []).some(a => a.id === 'level-50')).toBe(false); expect(checkShooterAchievements(makeStats({ maxLevel: 50 }), []).some(a => a.id === 'level-50')).toBe(true) })
})

// ===== COINS =====

describe('coins', () => {
  it('test_levelCoins_win_with_shots', () => { expect(levelCoins(true, 10, 40)).toBe(10 + 10 * 2) })
  it('test_levelCoins_win_no_shots', () => { expect(levelCoins(true, 0, 40)).toBe(10) })
  it('test_levelCoins_lose', () => { expect(levelCoins(false, 10, 40)).toBe(0) })
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

// ===== SAVE MIGRATION =====

describe('save migration', () => {
  beforeEach(() => { localStorage.clear() })

  it('test_loadSave_returns_defaults_on_empty', () => { const s = loadSave(); expect(s.highScore).toBe(0); expect(s.coins).toBe(0); expect(s.unlockedThemes).toEqual(['classic']) })
  it('test_loadSave_migrates_old_format', () => { localStorage.setItem('bubble-shooter-save', JSON.stringify({ highScore: 500, levelsCompleted: [1, 2] })); const s = loadSave(); expect(s.highScore).toBe(500); expect(s.levelsCompleted).toEqual([1, 2]); expect(s.coins).toBe(0) })
  it('test_loadSave_preserves_new_fields', () => { const data = createDefaultSave(); data.coins = 999; data.unlockedThemes = ['classic', 'ocean']; saveFull(data); const loaded = loadSave(); expect(loaded.coins).toBe(999); expect(loaded.unlockedThemes).toContain('ocean') })
  it('test_loadSave_handles_corrupted', () => { localStorage.setItem('bubble-shooter-save', 'BROKEN'); const s = loadSave(); expect(s.highScore).toBe(0) })
  it('test_createDefaultSave_has_all_fields', () => { const s = createDefaultSave(); expect(s.stats.totalPopped).toBe(0); expect(s.stats.perfectLevels).toBe(0); expect(s.stats.totalShots).toBe(0); expect(s.lastDailyDate).toBe('') })
})

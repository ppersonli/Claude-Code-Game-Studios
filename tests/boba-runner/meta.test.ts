import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RUNNER_THEMES, getRunnerThemeById } from '../../src/games/boba-runner/data/themes'
import { RUNNER_ACHIEVEMENTS, getRunnerAchievementById, type RunnerStats } from '../../src/games/boba-runner/data/achievements'
import {
  canBuyRunnerTheme, equipRunnerTheme, getAvailableRunnerThemes,
  checkRunnerAchievements,
  gameCoins, dailyRewardCoins,
  isDailyRewardAvailable, claimDailyReward,
} from '../../src/games/boba-runner/logic/meta'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<RunnerStats> = {}): RunnerStats {
  return {
    totalScore: 0, highScore: 0, totalPearls: 0, totalDistance: 0,
    totalJumps: 0, totalSlides: 0, shieldsUsed: 0,
    themesUnlocked: 1, dailyCompleted: 0, gamesPlayed: 0, ...overrides,
  }
}

// ===== THEMES =====

describe('RUNNER_THEMES', () => {
  it('test_has_6_themes', () => { expect(RUNNER_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(RUNNER_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(RUNNER_THEMES[0].cost).toBe(0); expect(RUNNER_THEMES[0].requiredHighScore).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < RUNNER_THEMES.length; i++) expect(RUNNER_THEMES[i].cost).toBeGreaterThanOrEqual(RUNNER_THEMES[i - 1].cost) })
  it('test_highscore_gates_increase', () => { for (let i = 2; i < RUNNER_THEMES.length; i++) expect(RUNNER_THEMES[i].requiredHighScore).toBeGreaterThanOrEqual(RUNNER_THEMES[i - 1].requiredHighScore) })
  it('test_all_have_emoji', () => { for (const t of RUNNER_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_colors', () => { for (const t of RUNNER_THEMES) { expect(typeof t.playerColor).toBe('number'); expect(typeof t.bgColor).toBe('number') } })
  it('test_getRunnerThemeById_valid', () => { expect(getRunnerThemeById('classic').name).toBe('經典波波') })
  it('test_getRunnerThemeById_invalid', () => { expect(() => getRunnerThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuyRunnerTheme', () => {
  it('test_affordable_with_score', () => { expect(canBuyRunnerTheme(100, 60, ['classic'], 'matcha')).toBe(true) })
  it('test_insufficient_coins', () => { expect(canBuyRunnerTheme(10, 60, ['classic'], 'matcha')).toBe(false) })
  it('test_insufficient_highscore', () => { expect(canBuyRunnerTheme(100, 10, ['classic'], 'matcha')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyRunnerTheme(100, 60, ['classic', 'matcha'], 'matcha')).toBe(false) })
})

describe('equipRunnerTheme', () => {
  it('test_equip_unlocked', () => { expect(equipRunnerTheme(['classic', 'matcha'], 'matcha')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipRunnerTheme(['classic'], 'cosmic')).toBe(false) })
})

describe('getAvailableRunnerThemes', () => {
  it('test_returns_all', () => { expect(getAvailableRunnerThemes(9999, 9999, ['classic'])).toHaveLength(RUNNER_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableRunnerThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableRunnerThemes(0, 0, ['classic']).find(t => t.theme.id === 'cosmic')!; expect(t.unlocked).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('RUNNER_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => { expect(RUNNER_ACHIEVEMENTS).toHaveLength(14) })
  it('test_unique_ids', () => { expect(new Set(RUNNER_ACHIEVEMENTS.map(a => a.id)).size).toBe(14) })
  it('test_all_have_rewards', () => { for (const a of RUNNER_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getRunnerAchievementById_valid', () => { expect(getRunnerAchievementById('first-run').name).toBe('初次奔跑') })
  it('test_getRunnerAchievementById_invalid', () => { expect(() => getRunnerAchievementById('fake')).toThrow() })
})

describe('checkRunnerAchievements', () => {
  it('test_unlocks_first_run', () => { const u = checkRunnerAchievements(makeStats({ gamesPlayed: 1 }), []); expect(u.some(a => a.id === 'first-run')).toBe(true) })
  it('test_unlocks_run_50', () => { const u = checkRunnerAchievements(makeStats({ gamesPlayed: 50 }), []); expect(u.some(a => a.id === 'run-50')).toBe(true) })
  it('test_unlocks_score_100', () => { const u = checkRunnerAchievements(makeStats({ highScore: 100 }), []); expect(u.some(a => a.id === 'score-100')).toBe(true) })
  it('test_unlocks_score_500', () => { const u = checkRunnerAchievements(makeStats({ highScore: 500 }), []); expect(u.some(a => a.id === 'score-500')).toBe(true) })
  it('test_unlocks_score_2000', () => { const u = checkRunnerAchievements(makeStats({ highScore: 2000 }), []); expect(u.some(a => a.id === 'score-2000')).toBe(true) })
  it('test_unlocks_pearls_100', () => { const u = checkRunnerAchievements(makeStats({ totalPearls: 100 }), []); expect(u.some(a => a.id === 'pearls-100')).toBe(true) })
  it('test_unlocks_pearls_1000', () => { const u = checkRunnerAchievements(makeStats({ totalPearls: 1000 }), []); expect(u.some(a => a.id === 'pearls-1000')).toBe(true) })
  it('test_unlocks_distance_10k', () => { const u = checkRunnerAchievements(makeStats({ totalDistance: 10000 }), []); expect(u.some(a => a.id === 'distance-10k')).toBe(true) })
  it('test_unlocks_distance_100k', () => { const u = checkRunnerAchievements(makeStats({ totalDistance: 100000 }), []); expect(u.some(a => a.id === 'distance-100k')).toBe(true) })
  it('test_unlocks_jumper', () => { const u = checkRunnerAchievements(makeStats({ totalJumps: 500 }), []); expect(u.some(a => a.id === 'jumper')).toBe(true) })
  it('test_unlocks_slider', () => { const u = checkRunnerAchievements(makeStats({ totalSlides: 200 }), []); expect(u.some(a => a.id === 'slider')).toBe(true) })
  it('test_unlocks_theme_3', () => { const u = checkRunnerAchievements(makeStats({ themesUnlocked: 3 }), []); expect(u.some(a => a.id === 'theme-3')).toBe(true) })
  it('test_unlocks_daily_3', () => { const u = checkRunnerAchievements(makeStats({ dailyCompleted: 3 }), []); expect(u.some(a => a.id === 'daily-3')).toBe(true) })
  it('test_unlocks_marathon', () => { const u = checkRunnerAchievements(makeStats({ totalDistance: 500 }), []); expect(u.some(a => a.id === 'marathon')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkRunnerAchievements(makeStats({ gamesPlayed: 1 }), ['first-run']); expect(u.some(a => a.id === 'first-run')).toBe(false) })
  it('test_multiple', () => { const u = checkRunnerAchievements(makeStats({ gamesPlayed: 50, highScore: 500, totalPearls: 100 }), []); expect(u.length).toBeGreaterThanOrEqual(3) })
  it('test_insufficient_no_unlock', () => { const u = checkRunnerAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_boundary_first_run', () => { expect(checkRunnerAchievements(makeStats({ gamesPlayed: 0 }), []).some(a => a.id === 'first-run')).toBe(false); expect(checkRunnerAchievements(makeStats({ gamesPlayed: 1 }), []).some(a => a.id === 'first-run')).toBe(true) })
  it('test_boundary_score_2000', () => { expect(checkRunnerAchievements(makeStats({ highScore: 1999 }), []).some(a => a.id === 'score-2000')).toBe(false); expect(checkRunnerAchievements(makeStats({ highScore: 2000 }), []).some(a => a.id === 'score-2000')).toBe(true) })
  it('test_boundary_distance_100k', () => { expect(checkRunnerAchievements(makeStats({ totalDistance: 99999 }), []).some(a => a.id === 'distance-100k')).toBe(false); expect(checkRunnerAchievements(makeStats({ totalDistance: 100000 }), []).some(a => a.id === 'distance-100k')).toBe(true) })
  it('test_boundary_jumper', () => { expect(checkRunnerAchievements(makeStats({ totalJumps: 499 }), []).some(a => a.id === 'jumper')).toBe(false); expect(checkRunnerAchievements(makeStats({ totalJumps: 500 }), []).some(a => a.id === 'jumper')).toBe(true) })
  it('test_boundary_slider', () => { expect(checkRunnerAchievements(makeStats({ totalSlides: 199 }), []).some(a => a.id === 'slider')).toBe(false); expect(checkRunnerAchievements(makeStats({ totalSlides: 200 }), []).some(a => a.id === 'slider')).toBe(true) })
})

// ===== COINS =====

describe('coins', () => {
  it('test_gameCoins_formula', () => { expect(gameCoins(100, 10)).toBe(30) }) // floor(100/5) + 10
  it('test_gameCoins_zero', () => { expect(gameCoins(0, 0)).toBe(0) })
  it('test_gameCoins_pearls_only', () => { expect(gameCoins(0, 5)).toBe(5) })
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

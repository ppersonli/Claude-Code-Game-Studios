import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MEME_THEMES, getMemeThemeById } from '../../src/games/meme-match/data/themes'
import { MEME_ACHIEVEMENTS, getMemeAchievementById, type MemeStats } from '../../src/games/meme-match/data/achievements'
import {
  canBuyMemeTheme, equipMemeTheme, getAvailableMemeThemes,
  checkMemeAchievements,
  gameCoins, dailyRewardCoins,
  isDailyRewardAvailable, claimDailyReward,
} from '../../src/games/meme-match/composables/useMeta'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<MemeStats> = {}): MemeStats {
  return {
    totalGames: 0, totalWins: 0, totalMatches: 0, totalMisses: 0,
    bestCombo: 0, highestScore: 0, perfectGames: 0, levelsCompleted: 0,
    themesUnlocked: 1, dailyCompleted: 0, ...overrides,
  }
}

// ===== THEMES =====

describe('MEME_THEMES', () => {
  it('test_has_6_themes', () => { expect(MEME_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(MEME_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(MEME_THEMES[0].cost).toBe(0); expect(MEME_THEMES[0].requiredScore).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < MEME_THEMES.length; i++) expect(MEME_THEMES[i].cost).toBeGreaterThanOrEqual(MEME_THEMES[i - 1].cost) })
  it('test_scores_increase', () => { for (let i = 2; i < MEME_THEMES.length; i++) expect(MEME_THEMES[i].requiredScore).toBeGreaterThanOrEqual(MEME_THEMES[i - 1].requiredScore) })
  it('test_all_have_emoji', () => { for (const t of MEME_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_cardBack', () => { for (const t of MEME_THEMES) expect(t.cardBack).toBeTruthy() })
  it('test_all_have_bgColor', () => { for (const t of MEME_THEMES) expect(t.bgColor).toBeTruthy() })
  it('test_getMemeThemeById_valid', () => { expect(getMemeThemeById('classic').name).toBe('經典問號') })
  it('test_getMemeThemeById_invalid', () => { expect(() => getMemeThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuyMemeTheme', () => {
  it('test_affordable_with_score', () => { expect(canBuyMemeTheme(200, 600, ['classic'], 'doge')).toBe(true) })
  it('test_insufficient_coins', () => { expect(canBuyMemeTheme(50, 600, ['classic'], 'doge')).toBe(false) })
  it('test_insufficient_score', () => { expect(canBuyMemeTheme(200, 100, ['classic'], 'doge')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyMemeTheme(200, 600, ['classic', 'doge'], 'doge')).toBe(false) })
})

describe('equipMemeTheme', () => {
  it('test_equip_unlocked', () => { expect(equipMemeTheme(['classic', 'doge'], 'doge')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipMemeTheme(['classic'], 'galaxy')).toBe(false) })
})

describe('getAvailableMemeThemes', () => {
  it('test_returns_all', () => { expect(getAvailableMemeThemes(9999, 99999, ['classic'])).toHaveLength(MEME_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableMemeThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableMemeThemes(0, 0, ['classic']).find(t => t.theme.id === 'legendary')!; expect(t.unlocked).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('MEME_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => { expect(MEME_ACHIEVEMENTS).toHaveLength(14) })
  it('test_unique_ids', () => { expect(new Set(MEME_ACHIEVEMENTS.map(a => a.id)).size).toBe(14) })
  it('test_all_have_rewards', () => { for (const a of MEME_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getMemeAchievementById_valid', () => { expect(getMemeAchievementById('first-match').name).toBe('初次配對') })
  it('test_getMemeAchievementById_invalid', () => { expect(() => getMemeAchievementById('fake')).toThrow() })
})

describe('checkMemeAchievements', () => {
  it('test_unlocks_first_match', () => { const u = checkMemeAchievements(makeStats({ totalMatches: 1 }), []); expect(u.some(a => a.id === 'first-match')).toBe(true) })
  it('test_unlocks_match_100', () => { const u = checkMemeAchievements(makeStats({ totalMatches: 100 }), []); expect(u.some(a => a.id === 'match-100')).toBe(true) })
  it('test_unlocks_match_1000', () => { const u = checkMemeAchievements(makeStats({ totalMatches: 1000 }), []); expect(u.some(a => a.id === 'match-1000')).toBe(true) })
  it('test_unlocks_combo_5', () => { const u = checkMemeAchievements(makeStats({ bestCombo: 5 }), []); expect(u.some(a => a.id === 'combo-5')).toBe(true) })
  it('test_unlocks_combo_10', () => { const u = checkMemeAchievements(makeStats({ bestCombo: 10 }), []); expect(u.some(a => a.id === 'combo-10')).toBe(true) })
  it('test_unlocks_perfect_game', () => { const u = checkMemeAchievements(makeStats({ perfectGames: 1 }), []); expect(u.some(a => a.id === 'perfect-game')).toBe(true) })
  it('test_unlocks_perfect_5', () => { const u = checkMemeAchievements(makeStats({ perfectGames: 5 }), []); expect(u.some(a => a.id === 'perfect-5')).toBe(true) })
  it('test_unlocks_score_5000', () => { const u = checkMemeAchievements(makeStats({ highestScore: 5000 }), []); expect(u.some(a => a.id === 'score-5000')).toBe(true) })
  it('test_unlocks_score_10000', () => { const u = checkMemeAchievements(makeStats({ highestScore: 10000 }), []); expect(u.some(a => a.id === 'score-10000')).toBe(true) })
  it('test_unlocks_all_levels', () => { const u = checkMemeAchievements(makeStats({ levelsCompleted: 5 }), []); expect(u.some(a => a.id === 'all-levels')).toBe(true) })
  it('test_unlocks_theme_3', () => { const u = checkMemeAchievements(makeStats({ themesUnlocked: 3 }), []); expect(u.some(a => a.id === 'theme-3')).toBe(true) })
  it('test_unlocks_daily_3', () => { const u = checkMemeAchievements(makeStats({ dailyCompleted: 3 }), []); expect(u.some(a => a.id === 'daily-3')).toBe(true) })
  it('test_unlocks_meme_lord', () => { const u = checkMemeAchievements(makeStats({ totalWins: 20 }), []); expect(u.some(a => a.id === 'meme-lord')).toBe(true) })
  it('test_unlocks_veteran', () => { const u = checkMemeAchievements(makeStats({ totalGames: 50 }), []); expect(u.some(a => a.id === 'veteran')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkMemeAchievements(makeStats({ totalMatches: 1 }), ['first-match']); expect(u.some(a => a.id === 'first-match')).toBe(false) })
  it('test_multiple', () => { const u = checkMemeAchievements(makeStats({ totalMatches: 100, bestCombo: 10, perfectGames: 1 }), []); expect(u.length).toBeGreaterThanOrEqual(3) })
  it('test_insufficient_no_unlock', () => { const u = checkMemeAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_boundary_first_match', () => { expect(checkMemeAchievements(makeStats({ totalMatches: 0 }), []).some(a => a.id === 'first-match')).toBe(false); expect(checkMemeAchievements(makeStats({ totalMatches: 1 }), []).some(a => a.id === 'first-match')).toBe(true) })
  it('test_boundary_combo_10', () => { expect(checkMemeAchievements(makeStats({ bestCombo: 9 }), []).some(a => a.id === 'combo-10')).toBe(false); expect(checkMemeAchievements(makeStats({ bestCombo: 10 }), []).some(a => a.id === 'combo-10')).toBe(true) })
  it('test_boundary_score_10000', () => { expect(checkMemeAchievements(makeStats({ highestScore: 9999 }), []).some(a => a.id === 'score-10000')).toBe(false); expect(checkMemeAchievements(makeStats({ highestScore: 10000 }), []).some(a => a.id === 'score-10000')).toBe(true) })
  it('test_boundary_meme_lord', () => { expect(checkMemeAchievements(makeStats({ totalWins: 19 }), []).some(a => a.id === 'meme-lord')).toBe(false); expect(checkMemeAchievements(makeStats({ totalWins: 20 }), []).some(a => a.id === 'meme-lord')).toBe(true) })
})

// ===== COINS =====

describe('coins', () => {
  it('test_gameCoins_win', () => { expect(gameCoins(1000, true)).toBe(50) })
  it('test_gameCoins_lose', () => { expect(gameCoins(1000, false)).toBe(20) })
  it('test_gameCoins_zero', () => { expect(gameCoins(0, false)).toBe(0) })
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

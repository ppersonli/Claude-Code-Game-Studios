import { describe, it, expect, vi, beforeEach } from 'vitest'
import { JELLY_THEMES, getJellyThemeById } from '../../src/games/jelly-pop/data/themes'
import { JELLY_ACHIEVEMENTS, getJellyAchievementById, type JellyStats } from '../../src/games/jelly-pop/data/achievements'
import {
  canBuyJellyTheme, equipJellyTheme, getAvailableJellyThemes,
  checkJellyAchievements,
  levelCoins, dailyRewardCoins,
  isDailyRewardAvailable, claimDailyReward,
} from '../../src/games/jelly-pop/logic/meta'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<JellyStats> = {}): JellyStats {
  return {
    totalScore: 0, highScore: 0, highestLevel: 0, totalMatches: 0,
    totalChains: 0, bestChain: 0, specialBombs: 0, specialRainbows: 0,
    themesUnlocked: 1, dailyCompleted: 0, gamesPlayed: 0, ...overrides,
  }
}

// ===== THEMES =====

describe('JELLY_THEMES', () => {
  it('test_has_6_themes', () => { expect(JELLY_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(JELLY_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(JELLY_THEMES[0].cost).toBe(0); expect(JELLY_THEMES[0].requiredLevel).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < JELLY_THEMES.length; i++) expect(JELLY_THEMES[i].cost).toBeGreaterThanOrEqual(JELLY_THEMES[i - 1].cost) })
  it('test_levels_increase', () => { for (let i = 2; i < JELLY_THEMES.length; i++) expect(JELLY_THEMES[i].requiredLevel).toBeGreaterThanOrEqual(JELLY_THEMES[i - 1].requiredLevel) })
  it('test_all_have_emoji', () => { for (const t of JELLY_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_bgColor', () => { for (const t of JELLY_THEMES) expect(typeof t.bgColor).toBe('number') })
  it('test_getJellyThemeById_valid', () => { expect(getJellyThemeById('classic').name).toBe('經典果凍') })
  it('test_getJellyThemeById_invalid', () => { expect(() => getJellyThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuyJellyTheme', () => {
  it('test_affordable_with_level', () => { expect(canBuyJellyTheme(200, 5, ['classic'], 'tropical')).toBe(true) })
  it('test_insufficient_coins', () => { expect(canBuyJellyTheme(50, 5, ['classic'], 'tropical')).toBe(false) })
  it('test_insufficient_level', () => { expect(canBuyJellyTheme(200, 1, ['classic'], 'tropical')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyJellyTheme(200, 5, ['classic', 'tropical'], 'tropical')).toBe(false) })
})

describe('equipJellyTheme', () => {
  it('test_equip_unlocked', () => { expect(equipJellyTheme(['classic', 'tropical'], 'tropical')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipJellyTheme(['classic'], 'galaxy')).toBe(false) })
})

describe('getAvailableJellyThemes', () => {
  it('test_returns_all', () => { expect(getAvailableJellyThemes(9999, 99, ['classic'])).toHaveLength(JELLY_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableJellyThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableJellyThemes(0, 0, ['classic']).find(t => t.theme.id === 'galaxy')!; expect(t.unlocked).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('JELLY_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => { expect(JELLY_ACHIEVEMENTS).toHaveLength(14) })
  it('test_unique_ids', () => { expect(new Set(JELLY_ACHIEVEMENTS.map(a => a.id)).size).toBe(14) })
  it('test_all_have_rewards', () => { for (const a of JELLY_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getJellyAchievementById_valid', () => { expect(getJellyAchievementById('first-match').name).toBe('初次消除') })
  it('test_getJellyAchievementById_invalid', () => { expect(() => getJellyAchievementById('fake')).toThrow() })
})

describe('checkJellyAchievements', () => {
  it('test_unlocks_first_match', () => { const u = checkJellyAchievements(makeStats({ totalMatches: 1 }), []); expect(u.some(a => a.id === 'first-match')).toBe(true) })
  it('test_unlocks_match_100', () => { const u = checkJellyAchievements(makeStats({ totalMatches: 100 }), []); expect(u.some(a => a.id === 'match-100')).toBe(true) })
  it('test_unlocks_match_1000', () => { const u = checkJellyAchievements(makeStats({ totalMatches: 1000 }), []); expect(u.some(a => a.id === 'match-1000')).toBe(true) })
  it('test_unlocks_chain_3', () => { const u = checkJellyAchievements(makeStats({ bestChain: 3 }), []); expect(u.some(a => a.id === 'chain-3')).toBe(true) })
  it('test_unlocks_chain_5', () => { const u = checkJellyAchievements(makeStats({ bestChain: 5 }), []); expect(u.some(a => a.id === 'chain-5')).toBe(true) })
  it('test_unlocks_score_5000', () => { const u = checkJellyAchievements(makeStats({ highScore: 5000 }), []); expect(u.some(a => a.id === 'score-5000')).toBe(true) })
  it('test_unlocks_score_20000', () => { const u = checkJellyAchievements(makeStats({ highScore: 20000 }), []); expect(u.some(a => a.id === 'score-20000')).toBe(true) })
  it('test_unlocks_level_5', () => { const u = checkJellyAchievements(makeStats({ highestLevel: 5 }), []); expect(u.some(a => a.id === 'level-5')).toBe(true) })
  it('test_unlocks_level_15', () => { const u = checkJellyAchievements(makeStats({ highestLevel: 15 }), []); expect(u.some(a => a.id === 'level-15')).toBe(true) })
  it('test_unlocks_bomb_10', () => { const u = checkJellyAchievements(makeStats({ specialBombs: 10 }), []); expect(u.some(a => a.id === 'bomb-10')).toBe(true) })
  it('test_unlocks_rainbow_5', () => { const u = checkJellyAchievements(makeStats({ specialRainbows: 5 }), []); expect(u.some(a => a.id === 'rainbow-5')).toBe(true) })
  it('test_unlocks_theme_3', () => { const u = checkJellyAchievements(makeStats({ themesUnlocked: 3 }), []); expect(u.some(a => a.id === 'theme-3')).toBe(true) })
  it('test_unlocks_daily_3', () => { const u = checkJellyAchievements(makeStats({ dailyCompleted: 3 }), []); expect(u.some(a => a.id === 'daily-3')).toBe(true) })
  it('test_unlocks_veteran', () => { const u = checkJellyAchievements(makeStats({ gamesPlayed: 20 }), []); expect(u.some(a => a.id === 'veteran')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkJellyAchievements(makeStats({ totalMatches: 1 }), ['first-match']); expect(u.some(a => a.id === 'first-match')).toBe(false) })
  it('test_multiple', () => { const u = checkJellyAchievements(makeStats({ totalMatches: 100, bestChain: 5, highScore: 5000 }), []); expect(u.length).toBeGreaterThanOrEqual(3) })
  it('test_insufficient_no_unlock', () => { const u = checkJellyAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_boundary_first_match', () => { expect(checkJellyAchievements(makeStats({ totalMatches: 0 }), []).some(a => a.id === 'first-match')).toBe(false); expect(checkJellyAchievements(makeStats({ totalMatches: 1 }), []).some(a => a.id === 'first-match')).toBe(true) })
  it('test_boundary_chain_5', () => { expect(checkJellyAchievements(makeStats({ bestChain: 4 }), []).some(a => a.id === 'chain-5')).toBe(false); expect(checkJellyAchievements(makeStats({ bestChain: 5 }), []).some(a => a.id === 'chain-5')).toBe(true) })
  it('test_boundary_score_20000', () => { expect(checkJellyAchievements(makeStats({ highScore: 19999 }), []).some(a => a.id === 'score-20000')).toBe(false); expect(checkJellyAchievements(makeStats({ highScore: 20000 }), []).some(a => a.id === 'score-20000')).toBe(true) })
  it('test_boundary_veteran', () => { expect(checkJellyAchievements(makeStats({ gamesPlayed: 19 }), []).some(a => a.id === 'veteran')).toBe(false); expect(checkJellyAchievements(makeStats({ gamesPlayed: 20 }), []).some(a => a.id === 'veteran')).toBe(true) })
})

// ===== COINS =====

describe('coins', () => {
  it('test_levelCoins_formula', () => { expect(levelCoins(0)).toBe(0); expect(levelCoins(100)).toBe(5); expect(levelCoins(1000)).toBe(50) })
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

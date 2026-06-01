import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MOCHI_THEMES, getMochiThemeById } from '../../src/games/mochi-merge/data/themes'
import { MOCHI_ACHIEVEMENTS, getMochiAchievementById, type MochiStats } from '../../src/games/mochi-merge/data/achievements'
import {
  type MochiSaveData, createDefaultSave,
  mergeCoins, scoreCoins, dailyRewardCoins,
  canBuyTheme, buyTheme, equipTheme, getEquippedTheme, getAvailableThemes,
  checkAchievements, onMerge, onGameEnd, isDailyAvailable,
} from '../../src/games/mochi-merge/logic/meta'
import { loadSave, saveSave } from '../../src/games/mochi-merge/logic/save'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeSave(overrides: Partial<MochiSaveData> = {}): MochiSaveData {
  return { ...createDefaultSave(), ...overrides }
}

function makeStats(overrides: Partial<MochiStats> = {}): MochiStats {
  return { ...createDefaultSave().stats, ...overrides }
}

// ===== THEMES =====

describe('MOCHI_THEMES', () => {
  it('test_has_6_themes', () => { expect(MOCHI_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(MOCHI_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(MOCHI_THEMES[0].cost).toBe(0); expect(MOCHI_THEMES[0].requiredHighScore).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < MOCHI_THEMES.length; i++) expect(MOCHI_THEMES[i].cost).toBeGreaterThanOrEqual(MOCHI_THEMES[i - 1].cost) })
  it('test_getMochiThemeById_valid', () => { expect(getMochiThemeById('classic').name).toBe('經典粉色') })
  it('test_getMochiThemeById_invalid', () => { expect(() => getMochiThemeById('fake')).toThrow() })
})

// ===== ACHIEVEMENTS =====

describe('MOCHI_ACHIEVEMENTS', () => {
  it('test_has_10_achievements', () => { expect(MOCHI_ACHIEVEMENTS).toHaveLength(10) })
  it('test_unique_ids', () => { expect(new Set(MOCHI_ACHIEVEMENTS.map(a => a.id)).size).toBe(10) })
  it('test_all_have_rewards', () => { for (const a of MOCHI_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getMochiAchievementById_valid', () => { expect(getMochiAchievementById('first-merge').name).toBe('初次合成') })
  it('test_getMochiAchievementById_invalid', () => { expect(() => getMochiAchievementById('fake')).toThrow() })
  it('test_first_merge_check', () => { const a = getMochiAchievementById('first-merge'); expect(a.check(makeStats({ totalMerges: 0 }))).toBe(false); expect(a.check(makeStats({ totalMerges: 1 }))).toBe(true) })
  it('test_merge_master_check', () => { const a = getMochiAchievementById('merge-master'); expect(a.check(makeStats({ totalMerges: 99 }))).toBe(false); expect(a.check(makeStats({ totalMerges: 100 }))).toBe(true) })
  it('test_grand_mochi_check', () => { const a = getMochiAchievementById('grand-mochi'); expect(a.check(makeStats({ grandMochis: 0 }))).toBe(false); expect(a.check(makeStats({ grandMochis: 1 }))).toBe(true) })
  it('test_score_500_check', () => { const a = getMochiAchievementById('score-500'); expect(a.check(makeStats({ bestScore: 499 }))).toBe(false); expect(a.check(makeStats({ bestScore: 500 }))).toBe(true) })
  it('test_crowded_check', () => { const a = getMochiAchievementById('crowded'); expect(a.check(makeStats({ biggestCount: 11 }))).toBe(false); expect(a.check(makeStats({ biggestCount: 12 }))).toBe(true) })
})

// ===== COINS =====

describe('coins', () => {
  it('test_mergeCoins_level0', () => { expect(mergeCoins(0)).toBe(0) })
  it('test_mergeCoins_level1', () => { expect(mergeCoins(1)).toBe(5) })
  it('test_mergeCoins_level3', () => { expect(mergeCoins(3)).toBe(45) })
  it('test_mergeCoins_level5', () => { expect(mergeCoins(5)).toBe(125) })
  it('test_scoreCoins', () => { expect(scoreCoins(0)).toBe(0); expect(scoreCoins(1000)).toBe(100); expect(scoreCoins(99)).toBe(9) })
  it('test_dailyRewardCoins', () => { expect(dailyRewardCoins()).toBe(50) })
})

// ===== THEME PURCHASE =====

describe('buyTheme', () => {
  it('test_canBuy_affordable', () => { const s = makeSave({ coins: 200, highScore: 500 }); expect(canBuyTheme(s, 'matcha')).toBe(true) })
  it('test_canBuy_insufficient_coins', () => { const s = makeSave({ coins: 50, highScore: 500 }); expect(canBuyTheme(s, 'matcha')).toBe(false) })
  it('test_canBuy_insufficient_highscore', () => { const s = makeSave({ coins: 500, highScore: 100 }); expect(canBuyTheme(s, 'matcha')).toBe(false) })
  it('test_canBuy_already_owned', () => { const s = makeSave({ coins: 500, highScore: 500, unlockedThemes: ['classic', 'matcha'] }); expect(canBuyTheme(s, 'matcha')).toBe(false) })
  it('test_buy_deducts_and_unlocks', () => { const s = makeSave({ coins: 200, highScore: 500 }); expect(buyTheme(s, 'sakura')).toBe(true); expect(s.coins).toBe(0); expect(s.unlockedThemes).toContain('sakura'); expect(s.equippedTheme).toBe('sakura') })
  it('test_buy_fails_insufficient', () => { const s = makeSave({ coins: 50 }); expect(buyTheme(s, 'sakura')).toBe(false) })
})

describe('equipTheme', () => {
  it('test_equip_unlocked', () => { const s = makeSave({ unlockedThemes: ['classic', 'matcha'] }); expect(equipTheme(s, 'matcha')).toBe(true); expect(s.equippedTheme).toBe('matcha') })
  it('test_equip_locked_fails', () => { const s = makeSave(); expect(equipTheme(s, 'galaxy')).toBe(false) })
})

describe('getAvailableThemes', () => {
  it('test_returns_all', () => { expect(getAvailableThemes(makeSave())).toHaveLength(MOCHI_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableThemes(makeSave()).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableThemes(makeSave()).find(t => t.theme.id === 'galaxy')!; expect(t.unlocked).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('checkAchievements', () => {
  it('test_unlocks_first_merge', () => { const s = makeSave(); s.stats.totalMerges = 1; const u = checkAchievements(s); expect(u.some(a => a.id === 'first-merge')).toBe(true); expect(s.coins).toBe(25) })
  it('test_no_duplicate', () => { const s = makeSave({ achievements: ['first-merge'] }); s.stats.totalMerges = 1; expect(checkAchievements(s).length).toBe(0) })
  it('test_multiple', () => { const s = makeSave(); s.stats.totalMerges = 100; s.stats.bestTier = 5; s.stats.bestScore = 2000; const u = checkAchievements(s); expect(u.length).toBeGreaterThanOrEqual(3) })
})

// ===== ON MERGE =====

describe('onMerge', () => {
  it('test_awards_coins', () => { const s = makeSave(); const coins = onMerge(s, 2, 5); expect(coins).toBe(20); expect(s.coins).toBe(20); expect(s.stats.totalMerges).toBe(1) })
  it('test_tracks_best_tier', () => { const s = makeSave(); onMerge(s, 3, 5); onMerge(s, 2, 4); expect(s.stats.bestTier).toBe(3) })
  it('test_tracks_grand_mochis', () => { const s = makeSave(); onMerge(s, 5, 3); expect(s.stats.grandMochis).toBe(1) })
  it('test_tracks_biggest_count', () => { const s = makeSave(); onMerge(s, 1, 10); onMerge(s, 1, 5); expect(s.stats.biggestCount).toBe(10) })
})

// ===== GAME END =====

describe('onGameEnd', () => {
  beforeEach(() => { localStorage.clear() })

  it('test_awards_score_coins', () => { const s = makeSave(); const r = onGameEnd(s, 1000, false); expect(r.scoreCoins).toBe(100); expect(s.coins).toBeGreaterThanOrEqual(100) })
  it('test_updates_highscore', () => { const s = makeSave(); onGameEnd(s, 2000, false); expect(s.highScore).toBe(2000) })
  it('test_keeps_higher_highscore', () => { const s = makeSave({ highScore: 5000 }); onGameEnd(s, 2000, false); expect(s.highScore).toBe(5000) })
  it('test_daily_bonus', () => { const s = makeSave(); const r = onGameEnd(s, 100, true); expect(r.dailyCoins).toBe(50); expect(s.stats.dailyCompleted).toBe(1) })
  it('test_no_duplicate_daily', () => { const s = makeSave(); onGameEnd(s, 100, true); const r2 = onGameEnd(s, 100, true); expect(r2.dailyCoins).toBe(0) })
  it('test_increments_games', () => { const s = makeSave(); onGameEnd(s, 100, false); expect(s.stats.totalGames).toBe(1) })
  it('test_triggers_achievements', () => { const s = makeSave(); s.stats.totalMerges = 100; s.stats.bestTier = 5; s.stats.bestScore = 2000; const r = onGameEnd(s, 2000, false); expect(r.newAchievements.length).toBeGreaterThanOrEqual(2) })
})

// ===== DAILY =====

describe('isDailyAvailable', () => {
  it('test_available_initially', () => { expect(isDailyAvailable(makeSave())).toBe(true) })
  it('test_not_available_after_completion', () => { const s = makeSave(); s.lastDailyDate = new Date().toISOString().slice(0, 10); expect(isDailyAvailable(s)).toBe(false) })
})

// ===== SAVE MIGRATION =====

describe('save migration', () => {
  beforeEach(() => { localStorage.clear() })

  it('test_loadSave_returns_defaults_on_empty', () => { const s = loadSave(); expect(s.highScore).toBe(0); expect(s.coins).toBe(0); expect(s.unlockedThemes).toEqual(['classic']) })
  it('test_loadSave_migrates_old_format', () => { localStorage.setItem('mochi-merge-save', JSON.stringify({ highScore: 500 })); const s = loadSave(); expect(s.highScore).toBe(500); expect(s.coins).toBe(0); expect(s.unlockedThemes).toEqual(['classic']) })
  it('test_loadSave_preserves_new_fields', () => { const data = createDefaultSave(); data.coins = 999; data.unlockedThemes = ['classic', 'matcha']; saveSave(data); const loaded = loadSave(); expect(loaded.coins).toBe(999); expect(loaded.unlockedThemes).toContain('matcha') })
  it('test_loadSave_handles_corrupted', () => { localStorage.setItem('mochi-merge-save', 'BROKEN'); const s = loadSave(); expect(s.highScore).toBe(0) })
})

// ===== DEFAULT =====

describe('createDefaultSave', () => {
  it('test_has_all_fields', () => {
    const s = createDefaultSave()
    expect(s.highScore).toBe(0); expect(s.coins).toBe(0); expect(s.equippedTheme).toBe('classic')
    expect(s.stats.totalGames).toBe(0); expect(s.stats.totalMerges).toBe(0); expect(s.stats.bestTier).toBe(0)
    expect(s.lastDailyDate).toBe('')
  })
})

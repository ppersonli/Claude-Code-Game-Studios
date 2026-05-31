import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MERGE_THEMES, getMergeThemeById } from '../../src/games/bubble-tea-merge/data/themes'
import { MERGE_ACHIEVEMENTS, getMergeAchievementById, type MergeStats } from '../../src/games/bubble-tea-merge/data/achievements'
import {
  type MergeSaveData, createDefaultSave,
  mergeCoins, scoreCoins, dailyRewardCoins,
  canBuyMergeTheme, buyMergeTheme, equipMergeTheme, getEquippedMergeTheme, getAvailableMergeThemes,
  checkMergeAchievements, onMerge, onGameEnd, isDailyAvailable,
} from '../../src/games/bubble-tea-merge/logic/meta'
import { loadSave, saveData } from '../../src/games/bubble-tea-merge/logic/save'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeSave(overrides: Partial<MergeSaveData> = {}): MergeSaveData {
  return { ...createDefaultSave(), ...overrides }
}

function makeStats(overrides: Partial<MergeStats> = {}): MergeStats {
  return { ...createDefaultSave().stats, ...overrides }
}

// ===== THEMES =====

describe('MERGE_THEMES', () => {
  it('test_has_6_themes', () => { expect(MERGE_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(MERGE_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(MERGE_THEMES[0].cost).toBe(0); expect(MERGE_THEMES[0].requiredHighScore).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < MERGE_THEMES.length; i++) expect(MERGE_THEMES[i].cost).toBeGreaterThanOrEqual(MERGE_THEMES[i - 1].cost) })
  it('test_getMergeThemeById_valid', () => { expect(getMergeThemeById('classic').name).toBe('經典奶茶') })
  it('test_getMergeThemeById_invalid', () => { expect(() => getMergeThemeById('fake')).toThrow() })
})

// ===== ACHIEVEMENTS =====

describe('MERGE_ACHIEVEMENTS', () => {
  it('test_has_10_achievements', () => { expect(MERGE_ACHIEVEMENTS).toHaveLength(10) })
  it('test_unique_ids', () => { expect(new Set(MERGE_ACHIEVEMENTS.map(a => a.id)).size).toBe(10) })
  it('test_all_have_rewards', () => { for (const a of MERGE_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getMergeAchievementById_valid', () => { expect(getMergeAchievementById('first-merge').name).toBe('初次合成') })
  it('test_getMergeAchievementById_invalid', () => { expect(() => getMergeAchievementById('fake')).toThrow() })
  it('test_first_merge_check', () => { const a = getMergeAchievementById('first-merge'); expect(a.check(makeStats({ totalMerges: 0 }))).toBe(false); expect(a.check(makeStats({ totalMerges: 1 }))).toBe(true) })
  it('test_merge_master_check', () => { const a = getMergeAchievementById('merge-master'); expect(a.check(makeStats({ totalMerges: 49 }))).toBe(false); expect(a.check(makeStats({ totalMerges: 50 }))).toBe(true) })
  it('test_crystal_boba_check', () => { const a = getMergeAchievementById('crystal-boba'); expect(a.check(makeStats({ crystalBobas: 0 }))).toBe(false); expect(a.check(makeStats({ crystalBobas: 1 }))).toBe(true) })
  it('test_score_500_check', () => { const a = getMergeAchievementById('score-500'); expect(a.check(makeStats({ bestScore: 499 }))).toBe(false); expect(a.check(makeStats({ bestScore: 500 }))).toBe(true) })
  it('test_combo_5_check', () => { const a = getMergeAchievementById('combo-5'); expect(a.check(makeStats({ bestCombo: 4 }))).toBe(false); expect(a.check(makeStats({ bestCombo: 5 }))).toBe(true) })
})

// ===== COINS =====

describe('coins', () => {
  it('test_mergeCoins_formula', () => { expect(mergeCoins(0)).toBe(0); expect(mergeCoins(1)).toBe(5); expect(mergeCoins(2)).toBe(20); expect(mergeCoins(3)).toBe(45) })
  it('test_scoreCoins_formula', () => { expect(scoreCoins(0)).toBe(0); expect(scoreCoins(100)).toBe(10); expect(scoreCoins(999)).toBe(99) })
  it('test_dailyRewardCoins', () => { expect(dailyRewardCoins()).toBe(50) })
})

// ===== THEME PURCHASE =====

describe('buyMergeTheme', () => {
  it('test_canBuy_affordable', () => { const s = makeSave({ coins: 200, highScore: 300 }); expect(canBuyMergeTheme(s, 'matcha')).toBe(true) })
  it('test_canBuy_insufficient_coins', () => { const s = makeSave({ coins: 50, highScore: 200 }); expect(canBuyMergeTheme(s, 'matcha')).toBe(false) })
  it('test_canBuy_insufficient_highscore', () => { const s = makeSave({ coins: 500, highScore: 50 }); expect(canBuyMergeTheme(s, 'matcha')).toBe(false) })
  it('test_canBuy_already_owned', () => { const s = makeSave({ coins: 500, highScore: 500, unlockedThemes: ['classic', 'matcha'] }); expect(canBuyMergeTheme(s, 'matcha')).toBe(false) })
  it('test_buy_deducts_and_unlocks', () => { const s = makeSave({ coins: 200, highScore: 300 }); expect(buyMergeTheme(s, 'matcha')).toBe(true); expect(s.coins).toBe(0); expect(s.unlockedThemes).toContain('matcha'); expect(s.equippedTheme).toBe('matcha') })
  it('test_buy_fails_insufficient', () => { const s = makeSave({ coins: 50 }); expect(buyMergeTheme(s, 'taro')).toBe(false) })
})

describe('equipMergeTheme', () => {
  it('test_equip_unlocked', () => { const s = makeSave({ unlockedThemes: ['classic', 'taro'] }); expect(equipMergeTheme(s, 'taro')).toBe(true); expect(s.equippedTheme).toBe('taro') })
  it('test_equip_locked_fails', () => { const s = makeSave(); expect(equipMergeTheme(s, 'galaxy')).toBe(false) })
})

describe('getAvailableMergeThemes', () => {
  it('test_returns_all', () => { expect(getAvailableMergeThemes(makeSave())).toHaveLength(MERGE_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableMergeThemes(makeSave()).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
})

// ===== ACHIEVEMENTS =====

describe('checkMergeAchievements', () => {
  it('test_unlocks_first_merge', () => { const s = makeSave(); s.stats.totalMerges = 1; const u = checkMergeAchievements(s); expect(u.some(a => a.id === 'first-merge')).toBe(true); expect(s.coins).toBe(25) })
  it('test_no_duplicate', () => { const s = makeSave({ achievements: ['first-merge'] }); s.stats.totalMerges = 1; expect(checkMergeAchievements(s).length).toBe(0) })
  it('test_multiple', () => { const s = makeSave(); s.stats.totalMerges = 1; s.stats.bestTier = 4; s.stats.bestScore = 500; const u = checkMergeAchievements(s); expect(u.length).toBeGreaterThanOrEqual(3) })
})

// ===== ON MERGE =====

describe('onMerge', () => {
  it('test_awards_coins', () => { const s = makeSave(); const coins = onMerge(s, 2, 1); expect(coins).toBe(20); expect(s.coins).toBe(20); expect(s.stats.totalMerges).toBe(1) })
  it('test_tracks_best_tier', () => { const s = makeSave(); onMerge(s, 3, 1); onMerge(s, 2, 2); expect(s.stats.bestTier).toBe(3) })
  it('test_tracks_best_combo', () => { const s = makeSave(); onMerge(s, 1, 5); onMerge(s, 1, 3); expect(s.stats.bestCombo).toBe(5) })
  it('test_tracks_crystal_bobas', () => { const s = makeSave(); onMerge(s, 6, 1); expect(s.stats.crystalBobas).toBe(1) })
})

// ===== GAME END =====

describe('onGameEnd', () => {
  beforeEach(() => { localStorage.clear() })

  it('test_awards_score_coins', () => { const s = makeSave(); const r = onGameEnd(s, 500, false); expect(r.scoreCoins).toBe(50); expect(s.coins).toBeGreaterThanOrEqual(50) })
  it('test_updates_highscore', () => { const s = makeSave(); onGameEnd(s, 1000, false); expect(s.highScore).toBe(1000) })
  it('test_keeps_higher_highscore', () => { const s = makeSave({ highScore: 2000 }); onGameEnd(s, 1000, false); expect(s.highScore).toBe(2000) })
  it('test_daily_bonus', () => { const s = makeSave(); const r = onGameEnd(s, 100, true); expect(r.dailyCoins).toBe(50); expect(s.stats.dailyCompleted).toBe(1) })
  it('test_no_duplicate_daily', () => { const s = makeSave(); onGameEnd(s, 100, true); const r2 = onGameEnd(s, 100, true); expect(r2.dailyCoins).toBe(0) })
  it('test_increments_games', () => { const s = makeSave(); onGameEnd(s, 100, false); expect(s.stats.totalGames).toBe(1) })
  it('test_triggers_achievements', () => { const s = makeSave(); s.stats.totalMerges = 50; s.stats.bestTier = 6; s.stats.bestScore = 1000; const r = onGameEnd(s, 1000, false); expect(r.newAchievements.length).toBeGreaterThanOrEqual(2) })
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
  it('test_loadSave_migrates_old_format', () => { localStorage.setItem('bubble-tea-merge-save', JSON.stringify({ highScore: 500 })); const s = loadSave(); expect(s.highScore).toBe(500); expect(s.coins).toBe(0); expect(s.unlockedThemes).toEqual(['classic']) })
  it('test_loadSave_preserves_new_fields', () => { const data = createDefaultSave(); data.coins = 999; data.unlockedThemes = ['classic', 'taro']; saveData(data); const loaded = loadSave(); expect(loaded.coins).toBe(999); expect(loaded.unlockedThemes).toContain('taro') })
  it('test_loadSave_handles_corrupted', () => { localStorage.setItem('bubble-tea-merge-save', 'BROKEN'); const s = loadSave(); expect(s.highScore).toBe(0) })
})

// ===== DEFAULT =====

describe('createDefaultSave', () => {
  it('test_has_all_fields', () => {
    const s = createDefaultSave()
    expect(s.highScore).toBe(0); expect(s.coins).toBe(0); expect(s.equippedTheme).toBe('classic')
    expect(s.stats.totalGames).toBe(0); expect(s.stats.totalMerges).toBe(0); expect(s.lastDailyDate).toBe('')
  })
})

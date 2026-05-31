import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DROP_THEMES, getDropThemeById } from '../../src/games/boba-drop/data/themes'
import { DROP_ACHIEVEMENTS, getDropAchievementById, type DropStats } from '../../src/games/boba-drop/data/achievements'
import {
  type DropSaveData, createDefaultDropSave,
  mergeCoins, scoreCoins, dailyRewardCoins,
  canBuyDropTheme, buyDropTheme, equipDropTheme, getEquippedDropTheme, getAvailableDropThemes,
  checkDropAchievements, onMerge, onGameEnd, isDailyAvailable,
} from '../../src/games/boba-drop/logic/meta'
import { loadSave, saveSave } from '../../src/games/boba-drop/logic/save'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeSave(overrides: Partial<DropSaveData> = {}): DropSaveData {
  return { ...createDefaultDropSave(), ...overrides }
}

function makeStats(overrides: Partial<DropStats> = {}): DropStats {
  return { ...createDefaultDropSave().stats, ...overrides }
}

// ===== THEMES =====

describe('DROP_THEMES', () => {
  it('test_has_6_themes', () => { expect(DROP_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(DROP_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(DROP_THEMES[0].cost).toBe(0); expect(DROP_THEMES[0].requiredHighScore).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < DROP_THEMES.length; i++) expect(DROP_THEMES[i].cost).toBeGreaterThanOrEqual(DROP_THEMES[i - 1].cost) })
  it('test_getDropThemeById_valid', () => { expect(getDropThemeById('classic').name).toBe('經典奶茶') })
  it('test_getDropThemeById_invalid', () => { expect(() => getDropThemeById('fake')).toThrow() })
})

// ===== ACHIEVEMENTS =====

describe('DROP_ACHIEVEMENTS', () => {
  it('test_has_10_achievements', () => { expect(DROP_ACHIEVEMENTS).toHaveLength(10) })
  it('test_unique_ids', () => { expect(new Set(DROP_ACHIEVEMENTS.map(a => a.id)).size).toBe(10) })
  it('test_all_have_rewards', () => { for (const a of DROP_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getDropAchievementById_valid', () => { expect(getDropAchievementById('first-drop').name).toBe('初次掉落') })
  it('test_getDropAchievementById_invalid', () => { expect(() => getDropAchievementById('fake')).toThrow() })
  it('test_first_drop_check', () => { const a = getDropAchievementById('first-drop'); expect(a.check(makeStats({ totalMerges: 0 }))).toBe(false); expect(a.check(makeStats({ totalMerges: 1 }))).toBe(true) })
  it('test_drop_master_check', () => { const a = getDropAchievementById('drop-master'); expect(a.check(makeStats({ totalMerges: 99 }))).toBe(false); expect(a.check(makeStats({ totalMerges: 100 }))).toBe(true) })
  it('test_super_boba_check', () => { const a = getDropAchievementById('super-boba'); expect(a.check(makeStats({ superBobas: 0 }))).toBe(false); expect(a.check(makeStats({ superBobas: 1 }))).toBe(true) })
  it('test_score_1000_check', () => { const a = getDropAchievementById('score-1000'); expect(a.check(makeStats({ bestScore: 999 }))).toBe(false); expect(a.check(makeStats({ bestScore: 1000 }))).toBe(true) })
  it('test_crowded_check', () => { const a = getDropAchievementById('crowded'); expect(a.check(makeStats({ biggestDrop: 14 }))).toBe(false); expect(a.check(makeStats({ biggestDrop: 15 }))).toBe(true) })
})

// ===== COINS =====

describe('coins', () => {
  it('test_mergeCoins_level0', () => { expect(mergeCoins(0)).toBe(0) })
  it('test_mergeCoins_level1', () => { expect(mergeCoins(1)).toBe(5) })
  it('test_mergeCoins_level3', () => { expect(mergeCoins(3)).toBe(45) })
  it('test_mergeCoins_level7', () => { expect(mergeCoins(7)).toBe(245) })
  it('test_scoreCoins', () => { expect(scoreCoins(0)).toBe(0); expect(scoreCoins(1000)).toBe(100); expect(scoreCoins(99)).toBe(9) })
  it('test_dailyRewardCoins', () => { expect(dailyRewardCoins()).toBe(50) })
})

// ===== THEME PURCHASE =====

describe('buyDropTheme', () => {
  it('test_canBuy_affordable', () => { const s = makeSave({ coins: 200, highScore: 500 }); expect(canBuyDropTheme(s, 'matcha')).toBe(true) })
  it('test_canBuy_insufficient_coins', () => { const s = makeSave({ coins: 50, highScore: 500 }); expect(canBuyDropTheme(s, 'matcha')).toBe(false) })
  it('test_canBuy_insufficient_highscore', () => { const s = makeSave({ coins: 500, highScore: 100 }); expect(canBuyDropTheme(s, 'matcha')).toBe(false) })
  it('test_canBuy_already_owned', () => { const s = makeSave({ coins: 500, highScore: 500, unlockedThemes: ['classic', 'matcha'] }); expect(canBuyDropTheme(s, 'matcha')).toBe(false) })
  it('test_buy_deducts_and_unlocks', () => { const s = makeSave({ coins: 200, highScore: 500 }); expect(buyDropTheme(s, 'matcha')).toBe(true); expect(s.coins).toBe(0); expect(s.unlockedThemes).toContain('matcha'); expect(s.equippedTheme).toBe('matcha') })
  it('test_buy_fails_insufficient', () => { const s = makeSave({ coins: 50 }); expect(buyDropTheme(s, 'taro')).toBe(false) })
})

describe('equipDropTheme', () => {
  it('test_equip_unlocked', () => { const s = makeSave({ unlockedThemes: ['classic', 'taro'] }); expect(equipDropTheme(s, 'taro')).toBe(true); expect(s.equippedTheme).toBe('taro') })
  it('test_equip_locked_fails', () => { const s = makeSave(); expect(equipDropTheme(s, 'galaxy')).toBe(false) })
})

describe('getAvailableDropThemes', () => {
  it('test_returns_all', () => { expect(getAvailableDropThemes(makeSave())).toHaveLength(DROP_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableDropThemes(makeSave()).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableDropThemes(makeSave()).find(t => t.theme.id === 'galaxy')!; expect(t.unlocked).toBe(false) })
})

// ===== ACHIEVEMENTS =====

describe('checkDropAchievements', () => {
  it('test_unlocks_first_drop', () => { const s = makeSave(); s.stats.totalMerges = 1; const u = checkDropAchievements(s); expect(u.some(a => a.id === 'first-drop')).toBe(true); expect(s.coins).toBe(25) })
  it('test_no_duplicate', () => { const s = makeSave({ achievements: ['first-drop'] }); s.stats.totalMerges = 1; expect(checkDropAchievements(s).length).toBe(0) })
  it('test_multiple', () => { const s = makeSave(); s.stats.totalMerges = 100; s.stats.bestTier = 7; s.stats.bestScore = 5000; const u = checkDropAchievements(s); expect(u.length).toBeGreaterThanOrEqual(3) })
})

// ===== ON MERGE =====

describe('onMerge', () => {
  it('test_awards_coins', () => { const s = makeSave(); const coins = onMerge(s, 2, 5); expect(coins).toBe(20); expect(s.coins).toBe(20); expect(s.stats.totalMerges).toBe(1) })
  it('test_tracks_best_tier', () => { const s = makeSave(); onMerge(s, 3, 5); onMerge(s, 2, 4); expect(s.stats.bestTier).toBe(3) })
  it('test_tracks_super_bobas', () => { const s = makeSave(); onMerge(s, 7, 3); expect(s.stats.superBobas).toBe(1) })
  it('test_tracks_biggest_drop', () => { const s = makeSave(); onMerge(s, 1, 10); onMerge(s, 1, 5); expect(s.stats.biggestDrop).toBe(10) })
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
  it('test_triggers_achievements', () => { const s = makeSave(); s.stats.totalMerges = 100; s.stats.bestTier = 7; s.stats.bestScore = 5000; const r = onGameEnd(s, 5000, false); expect(r.newAchievements.length).toBeGreaterThanOrEqual(2) })
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
  it('test_loadSave_migrates_old_format', () => { localStorage.setItem('boba-drop-save', JSON.stringify({ highScore: 500 })); const s = loadSave(); expect(s.highScore).toBe(500); expect(s.coins).toBe(0); expect(s.unlockedThemes).toEqual(['classic']) })
  it('test_loadSave_preserves_new_fields', () => { const data = createDefaultDropSave(); data.coins = 999; data.unlockedThemes = ['classic', 'taro']; saveSave(data); const loaded = loadSave(); expect(loaded.coins).toBe(999); expect(loaded.unlockedThemes).toContain('taro') })
  it('test_loadSave_handles_corrupted', () => { localStorage.setItem('boba-drop-save', 'BROKEN'); const s = loadSave(); expect(s.highScore).toBe(0) })
})

// ===== DEFAULT =====

describe('createDefaultDropSave', () => {
  it('test_has_all_fields', () => {
    const s = createDefaultDropSave()
    expect(s.highScore).toBe(0); expect(s.coins).toBe(0); expect(s.equippedTheme).toBe('classic')
    expect(s.stats.totalGames).toBe(0); expect(s.stats.totalMerges).toBe(0); expect(s.stats.bestTier).toBe(0)
    expect(s.lastDailyDate).toBe('')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LAB_THEMES, getLabThemeById } from '../../src/games/bubble-tea-lab/data/themes'
import {
  canBuyLabTheme, equipLabTheme, getAvailableLabThemes,
  isDailyRewardAvailable, claimDailyReward, DAILY_REWARD_COINS,
  checkMetaAchievements, META_ACHIEVEMENTS, type LabServeStats,
} from '../../src/games/bubble-tea-lab/composables/useMeta'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<LabServeStats> = {}): LabServeStats {
  return {
    totalServed: 0, perfectServed: 0, bestCombo: 0, highestLevel: 0,
    themesUnlocked: 1, dailyDays: 0, ingredientsUnlocked: 11, ...overrides,
  }
}

// ===== THEMES =====

describe('LAB_THEMES', () => {
  it('test_has_6_themes', () => { expect(LAB_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(LAB_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(LAB_THEMES[0].cost).toBe(0); expect(LAB_THEMES[0].requiredLevel).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < LAB_THEMES.length; i++) expect(LAB_THEMES[i].cost).toBeGreaterThanOrEqual(LAB_THEMES[i - 1].cost) })
  it('test_levels_increase', () => { for (let i = 2; i < LAB_THEMES.length; i++) expect(LAB_THEMES[i].requiredLevel).toBeGreaterThanOrEqual(LAB_THEMES[i - 1].requiredLevel) })
  it('test_all_have_emoji', () => { for (const t of LAB_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_bgGradient', () => { for (const t of LAB_THEMES) expect(t.bgGradient).toHaveLength(2) })
  it('test_getLabThemeById_valid', () => { expect(getLabThemeById('classic').name).toBe('經典實驗室') })
  it('test_getLabThemeById_invalid', () => { expect(() => getLabThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuyLabTheme', () => {
  it('test_affordable_with_level', () => { expect(canBuyLabTheme(200, 5, ['classic'], 'taro')).toBe(true) })
  it('test_insufficient_coins', () => { expect(canBuyLabTheme(50, 5, ['classic'], 'taro')).toBe(false) })
  it('test_insufficient_level', () => { expect(canBuyLabTheme(200, 1, ['classic'], 'taro')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyLabTheme(200, 5, ['classic', 'taro'], 'taro')).toBe(false) })
})

describe('equipLabTheme', () => {
  it('test_equip_unlocked', () => { expect(equipLabTheme(['classic', 'taro'], 'taro')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipLabTheme(['classic'], 'galaxy')).toBe(false) })
})

describe('getAvailableLabThemes', () => {
  it('test_returns_all', () => { expect(getAvailableLabThemes(9999, 99, ['classic'])).toHaveLength(LAB_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableLabThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableLabThemes(0, 0, ['classic']).find(t => t.theme.id === 'galaxy')!; expect(t.unlocked).toBe(false) })
  it('test_affordable_shows_canBuy', () => { const t = getAvailableLabThemes(200, 5, ['classic']).find(t => t.theme.id === 'taro')!; expect(t.canBuy).toBe(true) })
})

// ===== META ACHIEVEMENTS =====

describe('META_ACHIEVEMENTS', () => {
  it('test_has_7_achievements', () => { expect(META_ACHIEVEMENTS).toHaveLength(7) })
  it('test_unique_ids', () => { expect(new Set(META_ACHIEVEMENTS.map(a => a.id)).size).toBe(7) })
  it('test_all_have_rewards', () => { for (const a of META_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
})

describe('checkMetaAchievements', () => {
  it('test_unlocks_lab_master', () => { const u = checkMetaAchievements(makeStats({ totalServed: 100 }), []); expect(u.some(a => a.id === 'lab_master')).toBe(true) })
  it('test_unlocks_perfect_streak10', () => { const u = checkMetaAchievements(makeStats({ perfectServed: 10 }), []); expect(u.some(a => a.id === 'perfect_streak10')).toBe(true) })
  it('test_unlocks_combo_master', () => { const u = checkMetaAchievements(makeStats({ bestCombo: 10 }), []); expect(u.some(a => a.id === 'combo_master')).toBe(true) })
  it('test_unlocks_fashionista', () => { const u = checkMetaAchievements(makeStats({ themesUnlocked: 3 }), []); expect(u.some(a => a.id === 'fashionista')).toBe(true) })
  it('test_unlocks_daily_3', () => { const u = checkMetaAchievements(makeStats({ dailyDays: 3 }), []); expect(u.some(a => a.id === 'daily_3')).toBe(true) })
  it('test_unlocks_level_10', () => { const u = checkMetaAchievements(makeStats({ highestLevel: 10 }), []); expect(u.some(a => a.id === 'level_10')).toBe(true) })
  it('test_unlocks_ingredient_master', () => { const u = checkMetaAchievements(makeStats({ ingredientsUnlocked: 16 }), []); expect(u.some(a => a.id === 'ingredient_master')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkMetaAchievements(makeStats({ totalServed: 100 }), ['lab_master']); expect(u.some(a => a.id === 'lab_master')).toBe(false) })
  it('test_multiple', () => { const u = checkMetaAchievements(makeStats({ totalServed: 100, perfectServed: 10, bestCombo: 10 }), []); expect(u.length).toBeGreaterThanOrEqual(3) })
  it('test_insufficient_no_unlock', () => { const u = checkMetaAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_boundary_lab_master', () => { expect(checkMetaAchievements(makeStats({ totalServed: 99 }), []).some(a => a.id === 'lab_master')).toBe(false); expect(checkMetaAchievements(makeStats({ totalServed: 100 }), []).some(a => a.id === 'lab_master')).toBe(true) })
  it('test_boundary_combo_master', () => { expect(checkMetaAchievements(makeStats({ bestCombo: 9 }), []).some(a => a.id === 'combo_master')).toBe(false); expect(checkMetaAchievements(makeStats({ bestCombo: 10 }), []).some(a => a.id === 'combo_master')).toBe(true) })
  it('test_boundary_ingredient_master', () => { expect(checkMetaAchievements(makeStats({ ingredientsUnlocked: 15 }), []).some(a => a.id === 'ingredient_master')).toBe(false); expect(checkMetaAchievements(makeStats({ ingredientsUnlocked: 16 }), []).some(a => a.id === 'ingredient_master')).toBe(true) })
})

// ===== DAILY REWARD =====

describe('daily reward', () => {
  it('test_reward_amount', () => { expect(DAILY_REWARD_COINS).toBe(50) })
  it('test_available_initially', () => { expect(isDailyRewardAvailable('')).toBe(true) })
  it('test_not_available_after_claim', () => { expect(isDailyRewardAvailable(new Date().toISOString().slice(0, 10))).toBe(false) })
  it('test_claim_first_time', () => { const r = claimDailyReward(''); expect(r.claimed).toBe(true) })
  it('test_claim_already_claimed', () => { const r = claimDailyReward(new Date().toISOString().slice(0, 10)); expect(r.claimed).toBe(false) })
  it('test_claim_different_day', () => { const r = claimDailyReward('2020-01-01'); expect(r.claimed).toBe(true) })
})

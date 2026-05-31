import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEA_THEMES, getTeaThemeById } from '../../src/games/bubble-tea/data/themes'
import {
  canBuyTeaTheme, buyTeaTheme, equipTeaTheme, getAvailableTeaThemes,
  isDailyRewardAvailable, claimDailyReward, DAILY_REWARD_COINS,
  checkMetaAchievements, type ServeStats, META_ACHIEVEMENTS,
} from '../../src/games/bubble-tea/composables/useMeta'

// ===== THEMES =====

describe('TEA_THEMES', () => {
  it('test_has_6_themes', () => { expect(TEA_THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(TEA_THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_free', () => { expect(TEA_THEMES[0].cost).toBe(0); expect(TEA_THEMES[0].requiredLevel).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < TEA_THEMES.length; i++) expect(TEA_THEMES[i].cost).toBeGreaterThanOrEqual(TEA_THEMES[i - 1].cost) })
  it('test_required_levels_increase', () => { for (let i = 2; i < TEA_THEMES.length; i++) expect(TEA_THEMES[i].requiredLevel).toBeGreaterThanOrEqual(TEA_THEMES[i - 1].requiredLevel) })
  it('test_all_have_emoji', () => { for (const t of TEA_THEMES) expect(t.emoji).toBeTruthy() })
  it('test_all_have_bgGradient', () => { for (const t of TEA_THEMES) expect(t.bgGradient).toHaveLength(2) })
  it('test_getTeaThemeById_valid', () => { expect(getTeaThemeById('classic').name).toBe('經典奶茶') })
  it('test_getTeaThemeById_invalid', () => { expect(() => getTeaThemeById('fake')).toThrow() })
})

// ===== THEME PURCHASE =====

describe('canBuyTeaTheme', () => {
  it('test_affordable_with_level', () => { expect(canBuyTeaTheme(500, 10, ['classic'], 'matcha')).toBe(true) })
  it('test_insufficient_coins', () => { expect(canBuyTeaTheme(50, 10, ['classic'], 'matcha')).toBe(false) })
  it('test_insufficient_level', () => { expect(canBuyTeaTheme(500, 2, ['classic'], 'matcha')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyTeaTheme(500, 10, ['classic', 'matcha'], 'matcha')).toBe(false) })
  it('test_classic_already_owned', () => { expect(canBuyTeaTheme(9999, 99, ['classic'], 'classic')).toBe(false) })
})

describe('buyTeaTheme', () => {
  it('test_returns_cost', () => { const r = buyTeaTheme('matcha'); expect(r).not.toBeNull(); expect(r!.cost).toBe(300) })
  it('test_invalid_theme_throws', () => { expect(() => buyTeaTheme('fake')).toThrow() })
})

describe('equipTeaTheme', () => {
  it('test_equip_unlocked', () => { expect(equipTeaTheme(['classic', 'taro'], 'taro')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipTeaTheme(['classic'], 'galaxy')).toBe(false) })
})

describe('getAvailableTeaThemes', () => {
  it('test_returns_all_themes', () => { expect(getAvailableTeaThemes(9999, 99, ['classic'])).toHaveLength(TEA_THEMES.length) })
  it('test_classic_unlocked', () => { const t = getAvailableTeaThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!; expect(t.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const t = getAvailableTeaThemes(0, 0, ['classic']).find(t => t.theme.id === 'galaxy')!; expect(t.unlocked).toBe(false); expect(t.canBuy).toBe(false) })
  it('test_affordable_shows_canBuy', () => { const t = getAvailableTeaThemes(500, 10, ['classic']).find(t => t.theme.id === 'matcha')!; expect(t.canBuy).toBe(true) })
})

// ===== DAILY REWARD =====

describe('daily reward', () => {
  it('test_daily_reward_amount', () => { expect(DAILY_REWARD_COINS).toBe(50) })
  it('test_isDailyRewardAvailable_initially', () => { expect(isDailyRewardAvailable('')).toBe(true) })
  it('test_isDailyRewardAvailable_after_claim', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(isDailyRewardAvailable(today)).toBe(false)
  })
  it('test_claimDailyReward_first_time', () => { const r = claimDailyReward(''); expect(r.claimed).toBe(true); expect(r.today).toBeTruthy() })
  it('test_claimDailyReward_already_claimed', () => {
    const today = new Date().toISOString().slice(0, 10)
    const r = claimDailyReward(today); expect(r.claimed).toBe(false)
  })
  it('test_claimDailyReward_different_day', () => { const r = claimDailyReward('2020-01-01'); expect(r.claimed).toBe(true) })
})

// ===== META ACHIEVEMENTS =====

describe('META_ACHIEVEMENTS', () => {
  it('test_has_6_achievements', () => { expect(META_ACHIEVEMENTS).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(META_ACHIEVEMENTS.map(a => a.id)).size).toBe(6) })
  it('test_all_have_rewards', () => { for (const a of META_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
})

describe('checkMetaAchievements', () => {
  const makeStats = (overrides: Partial<ServeStats> = {}): ServeStats => ({
    totalServed: 0, perfectServed: 0, bestCombo: 0, highestLevel: 0, themesUnlocked: 1, dailyDays: 0, ...overrides,
  })

  it('test_unlocks_tea_master', () => {
    const stats = makeStats({ totalServed: 100 })
    const u = checkMetaAchievements(stats, [])
    expect(u.some(a => a.id === 'tea_master')).toBe(true)
  })
  it('test_unlocks_combo_master', () => {
    const stats = makeStats({ bestCombo: 10 })
    const u = checkMetaAchievements(stats, [])
    expect(u.some(a => a.id === 'combo_master')).toBe(true)
  })
  it('test_unlocks_fashionista', () => {
    const stats = makeStats({ themesUnlocked: 3 })
    const u = checkMetaAchievements(stats, [])
    expect(u.some(a => a.id === 'fashionista')).toBe(true)
  })
  it('test_unlocks_daily_3', () => {
    const stats = makeStats({ dailyDays: 3 })
    const u = checkMetaAchievements(stats, [])
    expect(u.some(a => a.id === 'daily_3')).toBe(true)
  })
  it('test_unlocks_level_10', () => {
    const stats = makeStats({ highestLevel: 10 })
    const u = checkMetaAchievements(stats, [])
    expect(u.some(a => a.id === 'level_10')).toBe(true)
  })
  it('test_no_duplicate', () => {
    const stats = makeStats({ totalServed: 100 })
    const u = checkMetaAchievements(stats, ['tea_master'])
    expect(u.some(a => a.id === 'tea_master')).toBe(false)
  })
  it('test_multiple_achievements', () => {
    const stats = makeStats({ totalServed: 100, bestCombo: 10, themesUnlocked: 3, dailyDays: 3, highestLevel: 10, perfectServed: 10 })
    const u = checkMetaAchievements(stats, [])
    expect(u.length).toBe(6)
  })
  it('test_insufficient_stats_no_unlock', () => {
    const stats = makeStats()
    const u = checkMetaAchievements(stats, [])
    expect(u.length).toBe(0)
  })
  it('test_teach_master_boundary', () => {
    expect(checkMetaAchievements(makeStats({ totalServed: 99 }), []).some(a => a.id === 'tea_master')).toBe(false)
    expect(checkMetaAchievements(makeStats({ totalServed: 100 }), []).some(a => a.id === 'tea_master')).toBe(true)
  })
  it('test_combo_master_boundary', () => {
    expect(checkMetaAchievements(makeStats({ bestCombo: 9 }), []).some(a => a.id === 'combo_master')).toBe(false)
    expect(checkMetaAchievements(makeStats({ bestCombo: 10 }), []).some(a => a.id === 'combo_master')).toBe(true)
  })
  it('test_perfect_streak10', () => {
    expect(checkMetaAchievements(makeStats({ perfectServed: 9 }), []).some(a => a.id === 'perfect_streak10')).toBe(false)
    expect(checkMetaAchievements(makeStats({ perfectServed: 10 }), []).some(a => a.id === 'perfect_streak10')).toBe(true)
  })
  it('test_fashionista_boundary', () => {
    expect(checkMetaAchievements(makeStats({ themesUnlocked: 2 }), []).some(a => a.id === 'fashionista')).toBe(false)
    expect(checkMetaAchievements(makeStats({ themesUnlocked: 3 }), []).some(a => a.id === 'fashionista')).toBe(true)
  })
  it('test_daily_3_boundary', () => {
    expect(checkMetaAchievements(makeStats({ dailyDays: 2 }), []).some(a => a.id === 'daily_3')).toBe(false)
    expect(checkMetaAchievements(makeStats({ dailyDays: 3 }), []).some(a => a.id === 'daily_3')).toBe(true)
  })
  it('test_level_10_boundary', () => {
    expect(checkMetaAchievements(makeStats({ highestLevel: 9 }), []).some(a => a.id === 'level_10')).toBe(false)
    expect(checkMetaAchievements(makeStats({ highestLevel: 10 }), []).some(a => a.id === 'level_10')).toBe(true)
  })
})

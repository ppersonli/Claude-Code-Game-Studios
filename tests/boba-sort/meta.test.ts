import { describe, it, expect, vi, beforeEach } from 'vitest'
import { THEMES, getThemeById } from '../../src/games/boba-sort/data/themes'
import { ACHIEVEMENTS, getAchievementById, type PlayerStats } from '../../src/games/boba-sort/data/achievements'
import {
  type Progress, createDefaultProgress, calculateLevelCoins, calculateDailyCoins,
  canBuyTheme, buyTheme, equipTheme, getEquippedTheme, getAvailableThemes,
  checkAchievements, onGameComplete, canBuyHint, buyHint, HINT_COST,
} from '../../src/games/boba-sort/composables/useMeta'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeProgress(overrides: Partial<Progress> = {}): Progress {
  return { ...createDefaultProgress(), ...overrides }
}

function makeStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return { ...createDefaultProgress().stats, ...overrides }
}

// ===== THEMES =====

describe('THEMES', () => {
  it('test_has_6_themes', () => { expect(THEMES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(THEMES.map(t => t.id)).size).toBe(6) })
  it('test_first_theme_free', () => { expect(THEMES[0].cost).toBe(0); expect(THEMES[0].requiredStars).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < THEMES.length; i++) expect(THEMES[i].cost).toBeGreaterThanOrEqual(THEMES[i - 1].cost) })
  it('test_getThemeById_valid', () => { expect(getThemeById('classic').name).toBe('經典') })
  it('test_getThemeById_invalid', () => { expect(() => getThemeById('fake')).toThrow() })
})

// ===== ACHIEVEMENTS =====

describe('ACHIEVEMENTS', () => {
  it('test_has_10_achievements', () => { expect(ACHIEVEMENTS).toHaveLength(10) })
  it('test_unique_ids', () => { expect(new Set(ACHIEVEMENTS.map(a => a.id)).size).toBe(10) })
  it('test_all_have_rewards', () => { for (const a of ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getAchievementById_valid', () => { expect(getAchievementById('first-sort').name).toBe('初次排序') })
  it('test_getAchievementById_invalid', () => { expect(() => getAchievementById('fake')).toThrow() })
  it('test_first_sort_check', () => { const a = getAchievementById('first-sort'); expect(a.check(makeStats({ totalWins: 0 }))).toBe(false); expect(a.check(makeStats({ totalWins: 1 }))).toBe(true) })
  it('test_combo_master_check', () => { const a = getAchievementById('combo-master'); expect(a.check(makeStats({ bestCombo: 4 }))).toBe(false); expect(a.check(makeStats({ bestCombo: 5 }))).toBe(true) })
  it('test_speed_demon_check', () => { const a = getAchievementById('speed-demon'); expect(a.check(makeStats({ fastestTime: 0 }))).toBe(false); expect(a.check(makeStats({ fastestTime: 59 }))).toBe(true) })
  it('test_perfect_level_check', () => { const a = getAchievementById('perfect-level'); expect(a.check(makeStats({ perfectLevels: 0 }))).toBe(false); expect(a.check(makeStats({ perfectLevels: 1 }))).toBe(true) })
  it('test_star_collector_check', () => { const a = getAchievementById('star-collector'); expect(a.check(makeStats({ totalStars: 9 }))).toBe(false); expect(a.check(makeStats({ totalStars: 10 }))).toBe(true) })
})

// ===== COINS =====

describe('coins', () => {
  it('test_level_coins_formula', () => { expect(calculateLevelCoins(0)).toBe(0); expect(calculateLevelCoins(1)).toBe(10); expect(calculateLevelCoins(3)).toBe(30) })
  it('test_daily_coins', () => { expect(calculateDailyCoins()).toBe(50) })
  it('test_hint_cost', () => { expect(HINT_COST).toBe(10) })
})

// ===== THEME PURCHASE =====

describe('buyTheme', () => {
  it('test_canBuy_affordable_with_stars', () => {
    const p = makeProgress({ coins: 200, totalStars: 10 })
    expect(canBuyTheme(p, 'matcha')).toBe(true)
  })
  it('test_canBuy_insufficient_coins', () => {
    const p = makeProgress({ coins: 50, totalStars: 10 })
    expect(canBuyTheme(p, 'matcha')).toBe(false)
  })
  it('test_canBuy_insufficient_stars', () => {
    const p = makeProgress({ coins: 500, totalStars: 2 })
    expect(canBuyTheme(p, 'matcha')).toBe(false)
  })
  it('test_canBuy_already_owned', () => {
    const p = makeProgress({ coins: 500, totalStars: 10, unlockedThemes: ['classic', 'matcha'] })
    expect(canBuyTheme(p, 'matcha')).toBe(false)
  })
  it('test_buyTheme_deducts_and_unlocks', () => {
    const p = makeProgress({ coins: 200, totalStars: 10 })
    expect(buyTheme(p, 'matcha')).toBe(true)
    expect(p.coins).toBe(0) // 200 - 200
    expect(p.unlockedThemes).toContain('matcha')
    expect(p.equippedTheme).toBe('matcha')
    expect(p.stats.themesUnlocked).toBe(2)
  })
  it('test_buyTheme_fails_insufficient', () => {
    const p = makeProgress({ coins: 50 })
    expect(buyTheme(p, 'taro')).toBe(false)
  })
})

describe('equipTheme', () => {
  it('test_equip_unlocked_theme', () => {
    const p = makeProgress({ unlockedThemes: ['classic', 'taro'] })
    expect(equipTheme(p, 'taro')).toBe(true)
    expect(p.equippedTheme).toBe('taro')
  })
  it('test_equip_locked_theme_fails', () => {
    const p = makeProgress()
    expect(equipTheme(p, 'galaxy')).toBe(false)
  })
})

describe('getAvailableThemes', () => {
  it('test_returns_all_themes', () => {
    const themes = getAvailableThemes(makeProgress())
    expect(themes).toHaveLength(THEMES.length)
  })
  it('test_classic_is_unlocked', () => {
    const themes = getAvailableThemes(makeProgress())
    const classic = themes.find(t => t.theme.id === 'classic')!
    expect(classic.unlocked).toBe(true)
  })
  it('test_locked_theme_not_owned', () => {
    const themes = getAvailableThemes(makeProgress())
    const galaxy = themes.find(t => t.theme.id === 'galaxy')!
    expect(galaxy.unlocked).toBe(false)
  })
})

// ===== ACHIEVEMENT CHECKING =====

describe('checkAchievements', () => {
  it('test_unlocks_first_sort', () => {
    const p = makeProgress()
    p.stats.totalWins = 1
    const unlocked = checkAchievements(p)
    expect(unlocked.some(a => a.id === 'first-sort')).toBe(true)
    expect(p.achievements).toContain('first-sort')
    expect(p.coins).toBe(25)
  })
  it('test_no_duplicate_unlock', () => {
    const p = makeProgress({ achievements: ['first-sort'] })
    p.stats.totalWins = 1
    const unlocked = checkAchievements(p)
    expect(unlocked.some(a => a.id === 'first-sort')).toBe(false)
  })
  it('test_multiple_achievements', () => {
    const p = makeProgress()
    p.stats.totalWins = 1
    p.stats.bestCombo = 5
    p.stats.perfectLevels = 1
    const unlocked = checkAchievements(p)
    expect(unlocked.length).toBeGreaterThanOrEqual(3)
  })
})

// ===== GAME COMPLETION =====

describe('onGameComplete', () => {
  it('test_awards_coins_for_stars', () => {
    const p = makeProgress()
    const result = onGameComplete(p, 3, 200, 5, 60, 0, false)
    expect(result.levelCoins).toBe(30)
    // p.coins includes level coins + any achievement rewards
    expect(p.coins).toBeGreaterThanOrEqual(30)
  })
  it('test_updates_level_stars', () => {
    const p = makeProgress()
    onGameComplete(p, 2, 150, 3, 90, 0, false)
    expect(p.levelStars[0]).toBe(2)
    expect(p.totalStars).toBe(2)
  })
  it('test_keeps_best_stars', () => {
    const p = makeProgress()
    onGameComplete(p, 2, 150, 3, 90, 0, false)
    onGameComplete(p, 1, 100, 1, 120, 0, false)
    expect(p.levelStars[0]).toBe(2)
    expect(p.totalStars).toBe(2)
  })
  it('test_daily_bonus', () => {
    const p = makeProgress()
    const result = onGameComplete(p, 1, 100, 1, 120, 0, true)
    expect(result.dailyCoins).toBe(50)
    expect(p.stats.dailyCompleted).toBe(1)
  })
  it('test_no_duplicate_daily', () => {
    const p = makeProgress()
    onGameComplete(p, 1, 100, 1, 120, 0, true)
    const result2 = onGameComplete(p, 1, 100, 1, 120, 1, true)
    expect(result2.dailyCoins).toBe(0)
  })
  it('test_updates_stats', () => {
    const p = makeProgress()
    onGameComplete(p, 3, 200, 5, 45, 0, false)
    expect(p.stats.totalGames).toBe(1)
    expect(p.stats.totalWins).toBe(1)
    expect(p.stats.bestCombo).toBe(5)
    expect(p.stats.perfectLevels).toBe(1)
    expect(p.stats.fastestTime).toBe(45)
  })
  it('test_tracks_fastest_time', () => {
    const p = makeProgress()
    onGameComplete(p, 1, 100, 1, 60, 0, false)
    onGameComplete(p, 1, 100, 1, 30, 1, false)
    expect(p.stats.fastestTime).toBe(30)
  })
  it('test_triggers_achievements', () => {
    const p = makeProgress()
    const result = onGameComplete(p, 3, 200, 5, 45, 0, false)
    expect(result.newAchievements.length).toBeGreaterThanOrEqual(2) // first-sort + combo-master + perfect-level
  })
})

// ===== HINT COST =====

describe('hint cost', () => {
  it('test_canBuyHint_with_coins', () => {
    expect(canBuyHint(makeProgress({ coins: 20 }))).toBe(true)
  })
  it('test_canBuyHint_insufficient', () => {
    expect(canBuyHint(makeProgress({ coins: 5 }))).toBe(false)
  })
  it('test_buyHint_deducts', () => {
    const p = makeProgress({ coins: 20 })
    expect(buyHint(p)).toBe(true)
    expect(p.coins).toBe(10)
  })
  it('test_buyHint_fails_insufficient', () => {
    const p = makeProgress({ coins: 5 })
    expect(buyHint(p)).toBe(false)
    expect(p.coins).toBe(5)
  })
})

// ===== DEFAULT PROGRESS =====

describe('createDefaultProgress', () => {
  it('test_has_all_fields', () => {
    const p = createDefaultProgress()
    expect(p.coins).toBe(0)
    expect(p.unlockedThemes).toEqual(['classic'])
    expect(p.equippedTheme).toBe('classic')
    expect(p.achievements).toEqual([])
    expect(p.stats.totalGames).toBe(0)
    expect(p.totalStars).toBe(0)
    expect(p.levelStars).toEqual([])
    expect(p.dailyCompleted).toEqual([])
  })
})

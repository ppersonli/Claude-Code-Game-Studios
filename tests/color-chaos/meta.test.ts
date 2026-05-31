import { describe, it, expect, vi, beforeEach } from 'vitest'
import { COLOR_PALETTES, getColorPaletteById } from '../../src/games/color-chaos/data/palettes'
import { CHAOS_ACHIEVEMENTS, getChaosAchievementById, type ChaosStats } from '../../src/games/color-chaos/data/achievements'
import {
  canBuyPalette, equipPalette, getAvailablePalettes,
  checkChaosAchievements,
  isDailyRewardAvailable, claimDailyReward, DAILY_REWARD_TICKETS,
} from '../../src/games/color-chaos/logic/meta'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

function makeStats(overrides: Partial<ChaosStats> = {}): ChaosStats {
  return {
    levelsCompleted: 0, totalStars: 0, threeStarLevels: 0,
    totalMoves: 0, highestLevel: 1, skinsUnlocked: 1,
    palettesUnlocked: 1, dailyCompleted: 0, ...overrides,
  }
}

// ===== PALETTES =====

describe('COLOR_PALETTES', () => {
  it('test_has_6_palettes', () => { expect(COLOR_PALETTES).toHaveLength(6) })
  it('test_unique_ids', () => { expect(new Set(COLOR_PALETTES.map(p => p.id)).size).toBe(6) })
  it('test_first_free', () => { expect(COLOR_PALETTES[0].cost).toBe(0); expect(COLOR_PALETTES[0].requiredStars).toBe(0) })
  it('test_costs_increase', () => { for (let i = 2; i < COLOR_PALETTES.length; i++) expect(COLOR_PALETTES[i].cost).toBeGreaterThanOrEqual(COLOR_PALETTES[i - 1].cost) })
  it('test_stars_increase', () => { for (let i = 2; i < COLOR_PALETTES.length; i++) expect(COLOR_PALETTES[i].requiredStars).toBeGreaterThanOrEqual(COLOR_PALETTES[i - 1].requiredStars) })
  it('test_all_have_emoji', () => { for (const p of COLOR_PALETTES) expect(p.emoji).toBeTruthy() })
  it('test_all_have_bgColors', () => { for (const p of COLOR_PALETTES) { expect(typeof p.bgColor1).toBe('number'); expect(typeof p.bgColor2).toBe('number') } })
  it('test_getColorPaletteById_valid', () => { expect(getColorPaletteById('classic').name).toBe('經典') })
  it('test_getColorPaletteById_invalid', () => { expect(() => getColorPaletteById('fake')).toThrow() })
})

// ===== PALETTE PURCHASE =====

describe('canBuyPalette', () => {
  it('test_affordable_with_stars', () => { expect(canBuyPalette(50, 10, ['classic'], 'sunset')).toBe(true) })
  it('test_insufficient_tickets', () => { expect(canBuyPalette(5, 10, ['classic'], 'sunset')).toBe(false) })
  it('test_insufficient_stars', () => { expect(canBuyPalette(100, 2, ['classic'], 'sunset')).toBe(false) })
  it('test_already_owned', () => { expect(canBuyPalette(100, 10, ['classic', 'sunset'], 'sunset')).toBe(false) })
  it('test_classic_already_owned', () => { expect(canBuyPalette(9999, 99, ['classic'], 'classic')).toBe(false) })
})

describe('equipPalette', () => {
  it('test_equip_unlocked', () => { expect(equipPalette(['classic', 'sunset'], 'sunset')).toBe(true) })
  it('test_equip_locked_fails', () => { expect(equipPalette(['classic'], 'void')).toBe(false) })
})

describe('getAvailablePalettes', () => {
  it('test_returns_all', () => { expect(getAvailablePalettes(9999, 99, ['classic'])).toHaveLength(COLOR_PALETTES.length) })
  it('test_classic_unlocked', () => { const p = getAvailablePalettes(0, 0, ['classic']).find(p => p.palette.id === 'classic')!; expect(p.unlocked).toBe(true) })
  it('test_locked_not_owned', () => { const p = getAvailablePalettes(0, 0, ['classic']).find(p => p.palette.id === 'void')!; expect(p.unlocked).toBe(false); expect(p.canBuy).toBe(false) })
  it('test_affordable_shows_canBuy', () => { const p = getAvailablePalettes(50, 10, ['classic']).find(p => p.palette.id === 'sunset')!; expect(p.canBuy).toBe(true) })
})

// ===== ACHIEVEMENTS =====

describe('CHAOS_ACHIEVEMENTS', () => {
  it('test_has_12_achievements', () => { expect(CHAOS_ACHIEVEMENTS).toHaveLength(12) })
  it('test_unique_ids', () => { expect(new Set(CHAOS_ACHIEVEMENTS.map(a => a.id)).size).toBe(12) })
  it('test_all_have_rewards', () => { for (const a of CHAOS_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0) })
  it('test_getChaosAchievementById_valid', () => { expect(getChaosAchievementById('first-sort').name).toBe('初次排序') })
  it('test_getChaosAchievementById_invalid', () => { expect(() => getChaosAchievementById('fake')).toThrow() })
})

describe('checkChaosAchievements', () => {
  it('test_unlocks_first_sort', () => { const u = checkChaosAchievements(makeStats({ levelsCompleted: 1 }), []); expect(u.some(a => a.id === 'first-sort')).toBe(true) })
  it('test_unlocks_ten_levels', () => { const u = checkChaosAchievements(makeStats({ levelsCompleted: 10 }), []); expect(u.some(a => a.id === 'ten-levels')).toBe(true) })
  it('test_unlocks_star_10', () => { const u = checkChaosAchievements(makeStats({ totalStars: 10 }), []); expect(u.some(a => a.id === 'star-10')).toBe(true) })
  it('test_unlocks_star_50', () => { const u = checkChaosAchievements(makeStats({ totalStars: 50 }), []); expect(u.some(a => a.id === 'star-50')).toBe(true) })
  it('test_unlocks_perfect_3', () => { const u = checkChaosAchievements(makeStats({ threeStarLevels: 3 }), []); expect(u.some(a => a.id === 'perfect-3')).toBe(true) })
  it('test_unlocks_level_50', () => { const u = checkChaosAchievements(makeStats({ highestLevel: 50 }), []); expect(u.some(a => a.id === 'level-50')).toBe(true) })
  it('test_unlocks_level_100', () => { const u = checkChaosAchievements(makeStats({ highestLevel: 100 }), []); expect(u.some(a => a.id === 'level-100')).toBe(true) })
  it('test_unlocks_skin_3', () => { const u = checkChaosAchievements(makeStats({ skinsUnlocked: 3 }), []); expect(u.some(a => a.id === 'skin-3')).toBe(true) })
  it('test_unlocks_palette_3', () => { const u = checkChaosAchievements(makeStats({ palettesUnlocked: 3 }), []); expect(u.some(a => a.id === 'palette-3')).toBe(true) })
  it('test_unlocks_daily_3', () => { const u = checkChaosAchievements(makeStats({ dailyCompleted: 3 }), []); expect(u.some(a => a.id === 'daily-3')).toBe(true) })
  it('test_unlocks_moves_1000', () => { const u = checkChaosAchievements(makeStats({ totalMoves: 1000 }), []); expect(u.some(a => a.id === 'moves-1000')).toBe(true) })
  it('test_unlocks_all_skins', () => { const u = checkChaosAchievements(makeStats({ skinsUnlocked: 10 }), []); expect(u.some(a => a.id === 'all-skins')).toBe(true) })
  it('test_no_duplicate', () => { const u = checkChaosAchievements(makeStats({ levelsCompleted: 1 }), ['first-sort']); expect(u.some(a => a.id === 'first-sort')).toBe(false) })
  it('test_multiple_achievements', () => { const u = checkChaosAchievements(makeStats({ levelsCompleted: 10, totalStars: 50, highestLevel: 100 }), []); expect(u.length).toBeGreaterThanOrEqual(3) })
  it('test_insufficient_no_unlock', () => { const u = checkChaosAchievements(makeStats(), []); expect(u.length).toBe(0) })
  it('test_boundary_levels_completed', () => { expect(checkChaosAchievements(makeStats({ levelsCompleted: 9 }), []).some(a => a.id === 'ten-levels')).toBe(false); expect(checkChaosAchievements(makeStats({ levelsCompleted: 10 }), []).some(a => a.id === 'ten-levels')).toBe(true) })
  it('test_boundary_three_star', () => { expect(checkChaosAchievements(makeStats({ threeStarLevels: 2 }), []).some(a => a.id === 'perfect-3')).toBe(false); expect(checkChaosAchievements(makeStats({ threeStarLevels: 3 }), []).some(a => a.id === 'perfect-3')).toBe(true) })
  it('test_boundary_level_100', () => { expect(checkChaosAchievements(makeStats({ highestLevel: 99 }), []).some(a => a.id === 'level-100')).toBe(false); expect(checkChaosAchievements(makeStats({ highestLevel: 100 }), []).some(a => a.id === 'level-100')).toBe(true) })
  it('test_boundary_all_skins', () => { expect(checkChaosAchievements(makeStats({ skinsUnlocked: 9 }), []).some(a => a.id === 'all-skins')).toBe(false); expect(checkChaosAchievements(makeStats({ skinsUnlocked: 10 }), []).some(a => a.id === 'all-skins')).toBe(true) })
  it('test_boundary_moves_1000', () => { expect(checkChaosAchievements(makeStats({ totalMoves: 999 }), []).some(a => a.id === 'moves-1000')).toBe(false); expect(checkChaosAchievements(makeStats({ totalMoves: 1000 }), []).some(a => a.id === 'moves-1000')).toBe(true) })
})

// ===== DAILY REWARD =====

describe('daily reward', () => {
  it('test_reward_amount', () => { expect(DAILY_REWARD_TICKETS).toBe(5) })
  it('test_available_initially', () => { expect(isDailyRewardAvailable('')).toBe(true) })
  it('test_not_available_after_claim', () => { expect(isDailyRewardAvailable(new Date().toISOString().slice(0, 10))).toBe(false) })
  it('test_claim_first_time', () => { const r = claimDailyReward(''); expect(r.claimed).toBe(true); expect(r.today).toBeTruthy() })
  it('test_claim_already_claimed', () => { const r = claimDailyReward(new Date().toISOString().slice(0, 10)); expect(r.claimed).toBe(false) })
  it('test_claim_different_day', () => { const r = claimDailyReward('2020-01-01'); expect(r.claimed).toBe(true) })
})

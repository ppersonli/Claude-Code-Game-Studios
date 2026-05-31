/**
 * Pure meta-system logic for Color Chaos.
 * Handles palettes, achievements, daily rewards.
 * Works alongside existing LevelManager + SkinManager persistence.
 */
import { COLOR_PALETTES, getColorPaletteById, type ColorPalette } from '../data/palettes'
import { CHAOS_ACHIEVEMENTS, type ChaosAchievement } from '../data/achievements'
export type { ChaosStats } from '../data/achievements'
import type { ChaosStats } from '../data/achievements'

// === Palette Management ===

export function canBuyPalette(tickets: number, totalStars: number, unlockedPalettes: string[], paletteId: string): boolean {
  const palette = getColorPaletteById(paletteId)
  if (unlockedPalettes.includes(paletteId)) return false
  if (tickets < palette.cost) return false
  if (totalStars < palette.requiredStars) return false
  return true
}

export function equipPalette(unlockedPalettes: string[], paletteId: string): boolean {
  return unlockedPalettes.includes(paletteId)
}

export function getAvailablePalettes(
  tickets: number, totalStars: number, unlockedPalettes: string[],
): { palette: ColorPalette; unlocked: boolean; canBuy: boolean }[] {
  return COLOR_PALETTES.map(palette => ({
    palette,
    unlocked: unlockedPalettes.includes(palette.id),
    canBuy: canBuyPalette(tickets, totalStars, unlockedPalettes, palette.id),
  }))
}

// === Achievements ===

export function checkChaosAchievements(
  stats: ChaosStats, existingAchievements: string[],
): ChaosAchievement[] {
  const newlyUnlocked: ChaosAchievement[] = []
  for (const a of CHAOS_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Daily Reward ===

export const DAILY_REWARD_TICKETS = 5

export function isDailyRewardAvailable(lastDailyDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return lastDailyDate !== today
}

export function claimDailyReward(lastDailyDate: string): { claimed: boolean; today: string } {
  const today = new Date().toISOString().slice(0, 10)
  if (lastDailyDate === today) return { claimed: false, today }
  return { claimed: true, today }
}

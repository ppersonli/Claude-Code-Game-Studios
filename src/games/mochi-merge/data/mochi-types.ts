/**
 * Mochi Merge mochi type definitions.
 * 6-tier merge chain: Small Mochi → Grand Mochi.
 */

export interface MochiInfo {
  name: string
  nameEn: string
  radius: number
  color: number
  emoji: string
}

export const MOCHI_TYPES: MochiInfo[] = [
  { name: '小饼', nameEn: 'Small Mochi', radius: 20, color: 0xFFB7C5, emoji: '🍡' },
  { name: '中饼', nameEn: 'Medium Mochi', radius: 28, color: 0x90EE90, emoji: '🟢' },
  { name: '大饼', nameEn: 'Large Mochi', radius: 36, color: 0xFFEB3B, emoji: '🟡' },
  { name: '团子串', nameEn: 'Dango Skewer', radius: 44, color: 0x64B5F6, emoji: '🔵' },
  { name: '饼塔', nameEn: 'Mochi Tower', radius: 54, color: 0xCE93D8, emoji: '🟣' },
  { name: '大福王', nameEn: 'Grand Mochi', radius: 66, color: 0xFFD700, emoji: '👑' },
]

export const MAX_MOCHI_LEVEL = MOCHI_TYPES.length - 1

/**
 * Get the max droppable level (levels 0-3 are droppable).
 */
export function getMaxDropLevel(): number {
  return Math.min(3, MAX_MOCHI_LEVEL)
}

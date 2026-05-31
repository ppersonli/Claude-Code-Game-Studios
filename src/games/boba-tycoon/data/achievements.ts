export interface TycoonAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number
  check: (stats: TycoonStats) => boolean
}

export interface TycoonStats {
  totalTaps: number
  totalEarned: number
  level: number
  prestigeCount: number
  locationsUnlocked: number
  recipesUnlocked: number
  staffHired: number
  themesUnlocked: number
  dailyCompleted: number
}

export const TYCOON_ACHIEVEMENTS: readonly TycoonAchievement[] = [
  { id: 'first-tap', name: '初次點擊', description: '點擊100次', emoji: '👆', reward: 25, check: s => s.totalTaps >= 100 },
  { id: 'tap-master', name: '點擊大師', description: '點擊10,000次', emoji: '🔥', reward: 100, check: s => s.totalTaps >= 10000 },
  { id: 'earn-10k', name: '萬元戶', description: '累計賺取$10,000', emoji: '💰', reward: 50, check: s => s.totalEarned >= 10000 },
  { id: 'earn-1m', name: '百萬富翁', description: '累計賺取$1,000,000', emoji: '💎', reward: 100, check: s => s.totalEarned >= 1000000 },
  { id: 'first-prestige', name: '初次轉生', description: '完成第一次轉生', emoji: '⭐', reward: 75, check: s => s.prestigeCount >= 1 },
  { id: 'prestige-5', name: '轉生達人', description: '轉生5次', emoji: '🌟', reward: 100, check: s => s.prestigeCount >= 5 },
  { id: 'all-locations', name: '全球佈局', description: '解鎖所有分店', emoji: '🌍', reward: 100, check: s => s.locationsUnlocked >= 6 },
  { id: 'all-recipes', name: '配方大全', description: '解鎖所有配方', emoji: '📖', reward: 100, check: s => s.recipesUnlocked >= 8 },
  { id: 'theme-collector', name: '主題收藏家', description: '解鎖3個主題', emoji: '🎨', reward: 75, check: s => s.themesUnlocked >= 3 },
  { id: 'daily-fan', name: '每日忠實', description: '完成3次每日挑戰', emoji: '📅', reward: 75, check: s => s.dailyCompleted >= 3 },
  { id: 'level-30', name: '三十級達人', description: '達到等級30', emoji: '🏅', reward: 100, check: s => s.level >= 30 },
  { id: 'staff-10', name: '團隊領袖', description: '累計僱用10名員工', emoji: '👥', reward: 75, check: s => s.staffHired >= 10 },
] as const

export function getTycoonAchievementById(id: string): TycoonAchievement {
  const a = TYCOON_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Tycoon achievement not found: ${id}`)
  return a
}

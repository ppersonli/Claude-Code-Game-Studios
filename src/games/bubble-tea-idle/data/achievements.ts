export interface IdleAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number
  check: (stats: IdleStats) => boolean
}

export interface IdleStats {
  totalTaps: number
  totalCupsSold: number
  totalEarned: number
  level: number
  prestigeCount: number
  locationsUnlocked: number
  recipesUnlocked: number
  staffHired: number
  themesUnlocked: number
  dailyCompleted: number
}

export const IDLE_ACHIEVEMENTS: readonly IdleAchievement[] = [
  { id: 'first-tap', name: '初次點擊', description: '點擊100次', emoji: '👆', reward: 25, check: s => s.totalTaps >= 100 },
  { id: 'tap-10000', name: '點擊大師', description: '點擊10,000次', emoji: '🔥', reward: 100, check: s => s.totalTaps >= 10000 },
  { id: 'cups-100', name: '百杯達人', description: '賣出100杯', emoji: '🧋', reward: 50, check: s => s.totalCupsSold >= 100 },
  { id: 'cups-1000', name: '千杯傳說', description: '賣出1000杯', emoji: '🏆', reward: 100, check: s => s.totalCupsSold >= 1000 },
  { id: 'earn-10k', name: '萬元戶', description: '累計賺取$10,000', emoji: '💰', reward: 50, check: s => s.totalEarned >= 10000 },
  { id: 'earn-1m', name: '百萬富翁', description: '累計賺取$1,000,000', emoji: '💎', reward: 100, check: s => s.totalEarned >= 1000000 },
  { id: 'earn-100m', name: '億萬富翁', description: '累計賺取$100,000,000', emoji: '👑', reward: 200, check: s => s.totalEarned >= 100000000 },
  { id: 'first-prestige', name: '初次轉生', description: '完成第一次轉生', emoji: '⭐', reward: 75, check: s => s.prestigeCount >= 1 },
  { id: 'prestige-5', name: '轉生達人', description: '轉生5次', emoji: '🌟', reward: 150, check: s => s.prestigeCount >= 5 },
  { id: 'all-locations', name: '全球佈局', description: '解鎖所有分店', emoji: '🌍', reward: 150, check: s => s.locationsUnlocked >= 5 },
  { id: 'all-recipes', name: '配方大全', description: '解鎖所有配方', emoji: '📖', reward: 150, check: s => s.recipesUnlocked >= 7 },
  { id: 'tea-master', name: '奶茶大師', description: '等級30且解鎖5個配方', emoji: '🏅', reward: 150, check: s => s.level >= 30 && s.recipesUnlocked >= 5 },
  { id: 'theme-3', name: '主題收藏家', description: '解鎖3個主題', emoji: '🎨', reward: 75, check: s => s.themesUnlocked >= 3 },
  { id: 'daily-3', name: '每日忠實', description: '完成3次每日獎勵', emoji: '📅', reward: 75, check: s => s.dailyCompleted >= 3 },
] as const

export function getIdleAchievementById(id: string): IdleAchievement {
  const a = IDLE_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Idle achievement not found: ${id}`)
  return a
}

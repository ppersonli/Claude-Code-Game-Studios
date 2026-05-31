export interface CafeAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number // coins
  check: (stats: CafeStats) => boolean
}

export interface CafeStats {
  totalCups: number
  totalClicks: number
  totalEarned: number
  highestLevel: number
  prestigeCount: number
  employeesHired: number
  recipesUnlocked: number
  themesUnlocked: number
  dailyCompleted: number
  gamesPlayed: number
}

export const CAFE_ACHIEVEMENTS: readonly CafeAchievement[] = [
  { id: 'first-cup', name: '第一杯', description: '製作第一杯咖啡', emoji: '☕', reward: 25, check: s => s.totalCups >= 1 },
  { id: 'cups-100', name: '百杯達人', description: '累計製作100杯', emoji: '🔥', reward: 75, check: s => s.totalCups >= 100 },
  { id: 'cups-1000', name: '千杯大師', description: '累計製作1000杯', emoji: '💥', reward: 150, check: s => s.totalCups >= 1000 },
  { id: 'clicks-500', name: '點擊達人', description: '累計點擊500次', emoji: '👆', reward: 50, check: s => s.totalClicks >= 500 },
  { id: 'clicks-5000', name: '點擊大師', description: '累計點擊5000次', emoji: '⚡', reward: 100, check: s => s.totalClicks >= 5000 },
  { id: 'earn-100k', name: '十萬富翁', description: '累計賺取$100,000', emoji: '💰', reward: 75, check: s => s.totalEarned >= 100000 },
  { id: 'earn-10m', name: '千萬富翁', description: '累計賺取$10,000,000', emoji: '💎', reward: 150, check: s => s.totalEarned >= 10000000 },
  { id: 'level-20', name: '二十級', description: '到達等級20', emoji: '📈', reward: 100, check: s => s.highestLevel >= 20 },
  { id: 'level-50', name: '五十級傳說', description: '到達等級50', emoji: '🚀', reward: 200, check: s => s.highestLevel >= 50 },
  { id: 'prestige-1', name: '初次轉生', description: '完成第一次轉生', emoji: '⭐', reward: 100, check: s => s.prestigeCount >= 1 },
  { id: 'prestige-5', name: '轉生達人', description: '轉生5次', emoji: '🌟', reward: 200, check: s => s.prestigeCount >= 5 },
  { id: 'barista-master', name: '咖啡大師', description: '解鎖6個配方且僱用10名員工', emoji: '🏅', reward: 150, check: s => s.recipesUnlocked >= 6 && s.employeesHired >= 10 },
  { id: 'theme-3', name: '主題收藏家', description: '解鎖3個主題', emoji: '🎨', reward: 75, check: s => s.themesUnlocked >= 3 },
  { id: 'daily-3', name: '每日忠實', description: '完成3次每日獎勵', emoji: '📅', reward: 75, check: s => s.dailyCompleted >= 3 },
] as const

export function getCafeAchievementById(id: string): CafeAchievement {
  const a = CAFE_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Cafe achievement not found: ${id}`)
  return a
}

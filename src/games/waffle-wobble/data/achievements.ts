export interface WaffleAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number // coins
  check: (stats: WaffleStats) => boolean
}

export interface WaffleStats {
  totalServed: number
  perfectServed: number
  totalLost: number
  highestLevel: number
  bestCombo: number
  totalCoinsEarned: number
  toppingsUnlocked: number
  themesUnlocked: number
  dailyCompleted: number
  gamesPlayed: number
}

export const WAFFLE_ACHIEVEMENTS: readonly WaffleAchievement[] = [
  { id: 'first-serve', name: '初次出餐', description: '成功送出第一份華夫', emoji: '🎯', reward: 25, check: s => s.totalServed >= 1 },
  { id: 'serve-50', name: '出餐達人', description: '累計送出50份華夫', emoji: '🔥', reward: 75, check: s => s.totalServed >= 50 },
  { id: 'serve-200', name: '華夫大師', description: '累計送出200份華夫', emoji: '💥', reward: 150, check: s => s.totalServed >= 200 },
  { id: 'perfect-10', name: '完美主義者', description: '10次完美出餐', emoji: '💎', reward: 75, check: s => s.perfectServed >= 10 },
  { id: 'perfect-50', name: '完美大師', description: '50次完美出餐', emoji: '👑', reward: 150, check: s => s.perfectServed >= 50 },
  { id: 'combo-5', name: '連擊新手', description: '達成5連擊', emoji: '⚡', reward: 50, check: s => s.bestCombo >= 5 },
  { id: 'combo-10', name: '連擊之王', description: '達成10連擊', emoji: '🌟', reward: 100, check: s => s.bestCombo >= 10 },
  { id: 'level-10', name: '十級達人', description: '到達等級10', emoji: '📈', reward: 75, check: s => s.highestLevel >= 10 },
  { id: 'level-25', name: '二十五級', description: '到達等級25', emoji: '🚀', reward: 150, check: s => s.highestLevel >= 25 },
  { id: 'toppings-5', name: '配料達人', description: '解鎖5種配料', emoji: '🧇', reward: 75, check: s => s.toppingsUnlocked >= 5 },
  { id: 'toppings-all', name: '全配料大師', description: '解鎖所有配料', emoji: '🏆', reward: 200, check: s => s.toppingsUnlocked >= 10 },
  { id: 'theme-3', name: '主題收藏家', description: '解鎖3個主題', emoji: '🎨', reward: 75, check: s => s.themesUnlocked >= 3 },
  { id: 'daily-3', name: '每日忠實', description: '完成3次每日獎勵', emoji: '📅', reward: 75, check: s => s.dailyCompleted >= 3 },
  { id: 'veteran', name: '資深玩家', description: '遊玩20場遊戲', emoji: '🏅', reward: 100, check: s => s.gamesPlayed >= 20 },
] as const

export function getWaffleAchievementById(id: string): WaffleAchievement {
  const a = WAFFLE_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Waffle achievement not found: ${id}`)
  return a
}

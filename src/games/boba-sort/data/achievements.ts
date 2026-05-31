export interface Achievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number
  check: (stats: PlayerStats) => boolean
}

export interface PlayerStats {
  totalGames: number
  totalWins: number
  totalStars: number
  bestCombo: number
  perfectLevels: number  // 3-star completions
  dailyCompleted: number
  fastestTime: number    // seconds, 0 = none
  themesUnlocked: number
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'first-sort', name: '初次排序', description: '完成第一關', emoji: '🎯', reward: 25, check: s => s.totalWins >= 1 },
  { id: 'combo-master', name: '連擊大師', description: '達成5連擊', emoji: '🔥', reward: 50, check: s => s.bestCombo >= 5 },
  { id: 'speed-demon', name: '速度惡魔', description: '60秒內完成一關', emoji: '⚡', reward: 75, check: s => s.fastestTime > 0 && s.fastestTime <= 60 },
  { id: 'perfect-level', name: '完美通關', description: '獲得3星評價', emoji: '⭐', reward: 50, check: s => s.perfectLevels >= 1 },
  { id: 'star-collector', name: '星星收集者', description: '累計獲得10顆星', emoji: '🌟', reward: 100, check: s => s.totalStars >= 10 },
  { id: 'daily-devotee', name: '每日忠實', description: '完成3次每日挑戰', emoji: '📅', reward: 75, check: s => s.dailyCompleted >= 3 },
  { id: 'fashionista', name: '時尚達人', description: '解鎖3個主題', emoji: '👗', reward: 50, check: s => s.themesUnlocked >= 3 },
  { id: 'veteran', name: '資深玩家', description: '完成10場遊戲', emoji: '🏅', reward: 100, check: s => s.totalGames >= 10 },
  { id: 'triple-star', name: '三星收割機', description: '獲得3個完美通關', emoji: '💎', reward: 100, check: s => s.perfectLevels >= 3 },
  { id: 'combo-god', name: '連擊之神', description: '達成8連擊', emoji: '👑', reward: 100, check: s => s.bestCombo >= 8 },
] as const

export function getAchievementById(id: string): Achievement {
  const a = ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Achievement not found: ${id}`)
  return a
}

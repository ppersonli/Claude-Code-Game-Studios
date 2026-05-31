export interface DropAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number
  check: (stats: DropStats) => boolean
}

export interface DropStats {
  totalGames: number
  totalMerges: number
  bestTier: number       // highest ingredient level created (0-7)
  bestScore: number
  totalPearls: number    // total pearls earned across games
  superBobas: number     // times created max-tier (level 7)
  dailyCompleted: number
  biggestDrop: number    // most ingredients on screen at once
}

export const DROP_ACHIEVEMENTS: readonly DropAchievement[] = [
  { id: 'first-drop', name: '初次掉落', description: '完成第一次合成', emoji: '🎯', reward: 25, check: s => s.totalMerges >= 1 },
  { id: 'drop-master', name: '掉落大師', description: '累計合成100次', emoji: '🔥', reward: 100, check: s => s.totalMerges >= 100 },
  { id: 'tier-5', name: '大珍珠製造者', description: '合成出大珍珠(5級)', emoji: '🟣', reward: 50, check: s => s.bestTier >= 5 },
  { id: 'tier-6', name: '奶茶杯匠人', description: '合成出奶茶杯(6級)', emoji: '🥛', reward: 75, check: s => s.bestTier >= 6 },
  { id: 'super-boba', name: '超級奶茶王', description: '合成出超級奶茶(7級)', emoji: '👑', reward: 100, check: s => s.superBobas >= 1 },
  { id: 'score-1000', name: '千分達人', description: '單局得分1000+', emoji: '🏆', reward: 75, check: s => s.bestScore >= 1000 },
  { id: 'score-5000', name: '五千傳說', description: '單局得分5000+', emoji: '💎', reward: 100, check: s => s.bestScore >= 5000 },
  { id: 'crowded', name: '擁擠杯中', description: '同時有15個以上配料', emoji: '🫧', reward: 50, check: s => s.biggestDrop >= 15 },
  { id: 'daily-fan', name: '每日一玩', description: '完成一次每日挑戰', emoji: '📅', reward: 50, check: s => s.dailyCompleted >= 1 },
  { id: 'veteran', name: '資深玩家', description: '完成20場遊戲', emoji: '🏅', reward: 100, check: s => s.totalGames >= 20 },
] as const

export function getDropAchievementById(id: string): DropAchievement {
  const a = DROP_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Drop achievement not found: ${id}`)
  return a
}

export interface MochiAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number
  check: (stats: MochiStats) => boolean
}

export interface MochiStats {
  totalGames: number
  totalMerges: number
  bestTier: number
  bestScore: number
  totalCoins: number
  grandMochis: number
  dailyCompleted: number
  biggestCount: number
}

export const MOCHI_ACHIEVEMENTS: readonly MochiAchievement[] = [
  { id: 'first-merge', name: '初次合成', description: '完成第一次合成', emoji: '🎯', reward: 25, check: s => s.totalMerges >= 1 },
  { id: 'merge-master', name: '合成大師', description: '累計合成100次', emoji: '🔥', reward: 100, check: s => s.totalMerges >= 100 },
  { id: 'tier-4', name: '團子串匠人', description: '合成出團子串(4級)', emoji: '🔵', reward: 50, check: s => s.bestTier >= 4 },
  { id: 'tier-5', name: '餅塔建築師', description: '合成出餅塔(5級)', emoji: '🟣', reward: 75, check: s => s.bestTier >= 5 },
  { id: 'grand-mochi', name: '大福王', description: '合成出大福王(6級)', emoji: '👑', reward: 100, check: s => s.grandMochis >= 1 },
  { id: 'score-500', name: '五百達人', description: '單局得分500+', emoji: '🏆', reward: 50, check: s => s.bestScore >= 500 },
  { id: 'score-2000', name: '兩千傳說', description: '單局得分2000+', emoji: '💎', reward: 100, check: s => s.bestScore >= 2000 },
  { id: 'crowded', name: '餅滿為患', description: '同時有12個以上麻糬', emoji: '🍡', reward: 50, check: s => s.biggestCount >= 12 },
  { id: 'daily-fan', name: '每日一玩', description: '完成一次每日挑戰', emoji: '📅', reward: 50, check: s => s.dailyCompleted >= 1 },
  { id: 'veteran', name: '資深玩家', description: '完成20場遊戲', emoji: '🏅', reward: 100, check: s => s.totalGames >= 20 },
] as const

export function getMochiAchievementById(id: string): MochiAchievement {
  const a = MOCHI_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Mochi achievement not found: ${id}`)
  return a
}

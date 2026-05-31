export interface MergeAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number
  check: (stats: MergeStats) => boolean
}

export interface MergeStats {
  totalGames: number
  totalMerges: number
  bestTier: number        // highest ingredient tier created (0-6)
  bestScore: number
  bestCombo: number       // consecutive merges without a non-merge drop
  totalPearls: number     // total pearls earned across games
  crystalBobas: number    // times created the max-tier (level 6)
  dailyCompleted: number
}

export const MERGE_ACHIEVEMENTS: readonly MergeAchievement[] = [
  { id: 'first-merge', name: '初次合成', description: '完成第一次合成', emoji: '🎯', reward: 25, check: s => s.totalMerges >= 1 },
  { id: 'merge-master', name: '合成大師', description: '累計合成50次', emoji: '🔥', reward: 75, check: s => s.totalMerges >= 50 },
  { id: 'tier-4', name: '紅豆製造者', description: '合成出紅豆(4級)', emoji: '🫘', reward: 50, check: s => s.bestTier >= 4 },
  { id: 'tier-5', name: '波波達人', description: '合成出波波(5級)', emoji: '🟤', reward: 75, check: s => s.bestTier >= 5 },
  { id: 'crystal-boba', name: '水晶之王', description: '合成出水晶波波(6級)', emoji: '💎', reward: 100, check: s => s.crystalBobas >= 1 },
  { id: 'score-500', name: '五百強', description: '單局得分500+', emoji: '🏆', reward: 50, check: s => s.bestScore >= 500 },
  { id: 'score-1000', name: '千分達人', description: '單局得分1000+', emoji: '👑', reward: 100, check: s => s.bestScore >= 1000 },
  { id: 'combo-5', name: '連鎖反應', description: '達成5連鎖合成', emoji: '⚡', reward: 75, check: s => s.bestCombo >= 5 },
  { id: 'daily-check', name: '每日一玩', description: '完成一次每日挑戰', emoji: '📅', reward: 50, check: s => s.dailyCompleted >= 1 },
  { id: 'veteran', name: '資深玩家', description: '完成10場遊戲', emoji: '🏅', reward: 100, check: s => s.totalGames >= 10 },
] as const

export function getMergeAchievementById(id: string): MergeAchievement {
  const a = MERGE_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Merge achievement not found: ${id}`)
  return a
}

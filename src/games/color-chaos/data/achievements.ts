export interface ChaosAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number // tickets
  check: (stats: ChaosStats) => boolean
}

export interface ChaosStats {
  levelsCompleted: number
  totalStars: number
  threeStarLevels: number
  totalMoves: number
  highestLevel: number
  skinsUnlocked: number
  palettesUnlocked: number
  dailyCompleted: number
}

export const CHAOS_ACHIEVEMENTS: readonly ChaosAchievement[] = [
  { id: 'first-sort', name: '初次排序', description: '完成第一關', emoji: '🎯', reward: 5, check: s => s.levelsCompleted >= 1 },
  { id: 'ten-levels', name: '十關達人', description: '完成10關', emoji: '🏅', reward: 15, check: s => s.levelsCompleted >= 10 },
  { id: 'star-10', name: '星星收集者', description: '累計獲得10顆星', emoji: '⭐', reward: 10, check: s => s.totalStars >= 10 },
  { id: 'star-50', name: '星海徜徉', description: '累計獲得50顆星', emoji: '🌟', reward: 25, check: s => s.totalStars >= 50 },
  { id: 'perfect-3', name: '完美主義者', description: '獲得3個三星通關', emoji: '💎', reward: 20, check: s => s.threeStarLevels >= 3 },
  { id: 'level-50', name: '半百之路', description: '到達第50關', emoji: '🚀', reward: 30, check: s => s.highestLevel >= 50 },
  { id: 'level-100', name: '百關傳說', description: '到達第100關', emoji: '👑', reward: 50, check: s => s.highestLevel >= 100 },
  { id: 'skin-3', name: '造型達人', description: '解鎖3個造型', emoji: '👗', reward: 15, check: s => s.skinsUnlocked >= 3 },
  { id: 'palette-3', name: '調色大師', description: '解鎖3個配色', emoji: '🎨', reward: 15, check: s => s.palettesUnlocked >= 3 },
  { id: 'daily-3', name: '每日忠實', description: '完成3次每日獎勵', emoji: '📅', reward: 20, check: s => s.dailyCompleted >= 3 },
  { id: 'moves-1000', name: '千步棋手', description: '累計移動1000次', emoji: '🧩', reward: 15, check: s => s.totalMoves >= 1000 },
  { id: 'all-skins', name: '全造型收藏', description: '解鎖所有造型', emoji: '🏆', reward: 50, check: s => s.skinsUnlocked >= 10 },
] as const

export function getChaosAchievementById(id: string): ChaosAchievement {
  const a = CHAOS_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Chaos achievement not found: ${id}`)
  return a
}

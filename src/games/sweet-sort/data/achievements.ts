export interface SweetAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number // coins
  check: (stats: SweetStats) => boolean
}

export interface SweetStats {
  levelsCompleted: number
  totalStars: number
  threeStarLevels: number
  highestLevel: number
  totalMoves: number
  bestCombo: number
  themesUnlocked: number
  dailyCompleted: number
  gamesPlayed: number
}

export const SWEET_ACHIEVEMENTS: readonly SweetAchievement[] = [
  { id: 'first-sort', name: '初次排序', description: '完成第一關', emoji: '🎯', reward: 25, check: s => s.levelsCompleted >= 1 },
  { id: 'ten-levels', name: '十關達人', description: '完成10關', emoji: '🏅', reward: 75, check: s => s.levelsCompleted >= 10 },
  { id: 'star-10', name: '星星收集者', description: '累計獲得10顆星', emoji: '⭐', reward: 50, check: s => s.totalStars >= 10 },
  { id: 'star-50', name: '星海徜徉', description: '累計獲得50顆星', emoji: '🌟', reward: 100, check: s => s.totalStars >= 50 },
  { id: 'star-100', name: '百星傳說', description: '累計獲得100顆星', emoji: '💫', reward: 200, check: s => s.totalStars >= 100 },
  { id: 'perfect-3', name: '完美主義者', description: '獲得3個三星通關', emoji: '💎', reward: 75, check: s => s.threeStarLevels >= 3 },
  { id: 'perfect-10', name: '完美大師', description: '獲得10個三星通關', emoji: '👑', reward: 150, check: s => s.threeStarLevels >= 10 },
  { id: 'level-20', name: '二十關達人', description: '到達第20關', emoji: '🚀', reward: 100, check: s => s.highestLevel >= 20 },
  { id: 'level-50', name: '五十關傳說', description: '到達第50關', emoji: '🏆', reward: 200, check: s => s.highestLevel >= 50 },
  { id: 'moves-1000', name: '千步棋手', description: '累計移動1000次', emoji: '🧩', reward: 75, check: s => s.totalMoves >= 1000 },
  { id: 'sweet-tooth', name: '甜食達人', description: '完成20關且獲得30顆星', emoji: '🍭', reward: 150, check: s => s.levelsCompleted >= 20 && s.totalStars >= 30 },
  { id: 'theme-3', name: '主題收藏家', description: '解鎖3個主題', emoji: '🎨', reward: 75, check: s => s.themesUnlocked >= 3 },
  { id: 'daily-3', name: '每日忠實', description: '完成3次每日獎勵', emoji: '📅', reward: 75, check: s => s.dailyCompleted >= 3 },
  { id: 'veteran', name: '資深玩家', description: '遊玩50場遊戲', emoji: '🎖️', reward: 100, check: s => s.gamesPlayed >= 50 },
] as const

export function getSweetAchievementById(id: string): SweetAchievement {
  const a = SWEET_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Sweet achievement not found: ${id}`)
  return a
}

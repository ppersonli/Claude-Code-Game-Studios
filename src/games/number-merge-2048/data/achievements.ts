export interface Merge2048Achievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number // coins
  check: (stats: Merge2048Stats) => boolean
}

export interface Merge2048Stats {
  highScore: number
  highestTile: number
  totalGames: number
  totalMoves: number
  totalMerges: number
  bestMoveCount: number // fewest moves to win (0 = never won)
  dailyCompleted: number
  themesUnlocked: number
}

export const MERGE_ACHIEVEMENTS: readonly Merge2048Achievement[] = [
  { id: 'first-merge', name: '初次合併', description: '合併出第一個 4', emoji: '🎯', reward: 10, check: s => s.highestTile >= 4 },
  { id: 'tile-128', name: '128達人', description: '合併出 128', emoji: '💯', reward: 50, check: s => s.highestTile >= 128 },
  { id: 'tile-512', name: '512大師', description: '合併出 512', emoji: '🔥', reward: 100, check: s => s.highestTile >= 512 },
  { id: 'tile-2048', name: '2048傳說', description: '合併出 2048', emoji: '👑', reward: 200, check: s => s.highestTile >= 2048 },
  { id: 'score-1000', name: '千分達人', description: '單局得分 1000+', emoji: '⭐', reward: 50, check: s => s.highScore >= 1000 },
  { id: 'score-5000', name: '五千傳說', description: '單局得分 5000+', emoji: '🌟', reward: 100, check: s => s.highScore >= 5000 },
  { id: 'score-10000', name: '萬分王者', description: '單局得分 10000+', emoji: '💎', reward: 200, check: s => s.highScore >= 10000 },
  { id: 'games-10', name: '十局老手', description: '累計遊玩 10 局', emoji: '🎮', reward: 25, check: s => s.totalGames >= 10 },
  { id: 'games-50', name: '五十局忠粉', description: '累計遊玩 50 局', emoji: '🏆', reward: 75, check: s => s.totalGames >= 50 },
  { id: 'moves-500', name: '滑動高手', description: '累計滑動 500 次', emoji: '👆', reward: 30, check: s => s.totalMoves >= 500 },
  { id: 'win-fast', name: '速通王者', description: '200步內達到 2048', emoji: '⚡', reward: 150, check: s => s.bestMoveCount > 0 && s.bestMoveCount <= 200 },
  { id: 'daily-3', name: '每日忠實', description: '領取 3 次每日獎勵', emoji: '📅', reward: 50, check: s => s.dailyCompleted >= 3 },
  { id: 'theme-3', name: '主題收藏家', description: '解鎖 3 個主題', emoji: '🎨', reward: 50, check: s => s.themesUnlocked >= 3 },
  { id: 'theme-all', name: '全主題大師', description: '解鎖全部主題', emoji: '🌈', reward: 200, check: s => s.themesUnlocked >= 6 },
] as const

export function getMergeAchievementById(id: string): Merge2048Achievement {
  const a = MERGE_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Merge achievement not found: ${id}`)
  return a
}

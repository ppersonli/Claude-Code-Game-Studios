export interface BlastAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number // coins
  check: (stats: BlastStats) => boolean
}

export interface BlastStats {
  highScore: number
  totalGames: number
  totalBlocksPlaced: number
  totalLinesCleared: number
  maxCombo: number
  maxLinesSingleMove: number
  dailyCompleted: number
  themesUnlocked: number
}

export const BLAST_ACHIEVEMENTS: readonly BlastAchievement[] = [
  { id: 'first-place', name: '初次放置', description: '放置第一個方塊', emoji: '🎯', reward: 10, check: s => s.totalBlocksPlaced >= 1 },
  { id: 'place-100', name: '百方達人', description: '累計放置100個方塊', emoji: '🧱', reward: 50, check: s => s.totalBlocksPlaced >= 100 },
  { id: 'place-500', name: '五百建造師', description: '累計放置500個方塊', emoji: '🏗️', reward: 100, check: s => s.totalBlocksPlaced >= 500 },
  { id: 'first-line', name: '初次消行', description: '消除第一行', emoji: '✨', reward: 15, check: s => s.totalLinesCleared >= 1 },
  { id: 'lines-50', name: '消行高手', description: '累計消除50行', emoji: '💥', reward: 75, check: s => s.totalLinesCleared >= 50 },
  { id: 'lines-200', name: '消行大師', description: '累計消除200行', emoji: '🔥', reward: 150, check: s => s.totalLinesCleared >= 200 },
  { id: 'combo-3', name: '三連消', description: '達成3連消', emoji: '⚡', reward: 50, check: s => s.maxCombo >= 3 },
  { id: 'combo-5', name: '五連消王', description: '達成5連消', emoji: '🌟', reward: 100, check: s => s.maxCombo >= 5 },
  { id: 'quad-clear', name: '四行消消樂', description: '一次消除4行', emoji: '💎', reward: 75, check: s => s.maxLinesSingleMove >= 4 },
  { id: 'score-1000', name: '千分達人', description: '單局得分1000+', emoji: '⭐', reward: 50, check: s => s.highScore >= 1000 },
  { id: 'score-5000', name: '五千傳說', description: '單局得分5000+', emoji: '🏆', reward: 100, check: s => s.highScore >= 5000 },
  { id: 'score-10000', name: '萬分王者', description: '單局得分10000+', emoji: '👑', reward: 200, check: s => s.highScore >= 10000 },
  { id: 'daily-3', name: '每日忠實', description: '領取3次每日獎勵', emoji: '📅', reward: 50, check: s => s.dailyCompleted >= 3 },
  { id: 'theme-3', name: '主題收藏家', description: '解鎖3個主題', emoji: '🎨', reward: 50, check: s => s.themesUnlocked >= 3 },
] as const

export function getBlastAchievementById(id: string): BlastAchievement {
  const a = BLAST_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Blast achievement not found: ${id}`)
  return a
}

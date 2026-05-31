export interface MemeAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number // coins
  check: (stats: MemeStats) => boolean
}

export interface MemeStats {
  totalGames: number
  totalWins: number
  totalMatches: number
  totalMisses: number
  bestCombo: number
  highestScore: number
  perfectGames: number // wins with 0 misses
  levelsCompleted: number // distinct levels won
  themesUnlocked: number
  dailyCompleted: number
}

export const MEME_ACHIEVEMENTS: readonly MemeAchievement[] = [
  { id: 'first-match', name: '初次配對', description: '完成第一次配對', emoji: '🎯', reward: 25, check: s => s.totalMatches >= 1 },
  { id: 'match-100', name: '配對達人', description: '累計配對100次', emoji: '🔥', reward: 75, check: s => s.totalMatches >= 100 },
  { id: 'match-1000', name: '配對大師', description: '累計配對1000次', emoji: '💥', reward: 150, check: s => s.totalMatches >= 1000 },
  { id: 'combo-5', name: '連擊新手', description: '達成5連擊', emoji: '⚡', reward: 50, check: s => s.bestCombo >= 5 },
  { id: 'combo-10', name: '連擊之王', description: '達成10連擊', emoji: '🌟', reward: 100, check: s => s.bestCombo >= 10 },
  { id: 'perfect-game', name: '完美遊戲', description: '零失誤通關', emoji: '💎', reward: 75, check: s => s.perfectGames >= 1 },
  { id: 'perfect-5', name: '完美五連', description: '5次零失誤通關', emoji: '👑', reward: 150, check: s => s.perfectGames >= 5 },
  { id: 'score-5000', name: '五千分', description: '單局得分5000+', emoji: '🏆', reward: 100, check: s => s.highestScore >= 5000 },
  { id: 'score-10000', name: '萬分傳說', description: '單局得分10000+', emoji: '🎖️', reward: 150, check: s => s.highestScore >= 10000 },
  { id: 'all-levels', name: '全關卡通關', description: '通關所有5個關卡', emoji: '🎮', reward: 100, check: s => s.levelsCompleted >= 5 },
  { id: 'theme-3', name: '主題收藏家', description: '解鎖3個主題', emoji: '🎨', reward: 75, check: s => s.themesUnlocked >= 3 },
  { id: 'daily-3', name: '每日忠實', description: '完成3次每日獎勵', emoji: '📅', reward: 75, check: s => s.dailyCompleted >= 3 },
  { id: 'meme-lord', name: '梗王', description: '累計贏得20場遊戲', emoji: '🗿', reward: 150, check: s => s.totalWins >= 20 },
  { id: 'veteran', name: '資深玩家', description: '累計遊玩50場', emoji: '🏅', reward: 100, check: s => s.totalGames >= 50 },
] as const

export function getMemeAchievementById(id: string): MemeAchievement {
  const a = MEME_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Meme achievement not found: ${id}`)
  return a
}

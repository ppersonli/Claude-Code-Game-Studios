export interface JellyAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number // coins
  check: (stats: JellyStats) => boolean
}

export interface JellyStats {
  totalScore: number
  highScore: number
  highestLevel: number
  totalMatches: number
  totalChains: number     // cascading chain moves
  bestChain: number       // highest chain count in a single move
  specialBombs: number    // bomb specials created
  specialRainbows: number // rainbow specials created
  themesUnlocked: number
  dailyCompleted: number
  gamesPlayed: number
}

export const JELLY_ACHIEVEMENTS: readonly JellyAchievement[] = [
  { id: 'first-match', name: '初次消除', description: '完成第一次消除', emoji: '🎯', reward: 25, check: s => s.totalMatches >= 1 },
  { id: 'match-100', name: '消除達人', description: '累計消除100次', emoji: '🔥', reward: 75, check: s => s.totalMatches >= 100 },
  { id: 'match-1000', name: '消除大師', description: '累計消除1000次', emoji: '💥', reward: 150, check: s => s.totalMatches >= 1000 },
  { id: 'chain-3', name: '連鎖新手', description: '達成3連鎖', emoji: '⚡', reward: 50, check: s => s.bestChain >= 3 },
  { id: 'chain-5', name: '連鎖大師', description: '達成5連鎖', emoji: '🌟', reward: 100, check: s => s.bestChain >= 5 },
  { id: 'score-5000', name: '五千分', description: '單局得分5000+', emoji: '🏆', reward: 75, check: s => s.highScore >= 5000 },
  { id: 'score-20000', name: '兩萬分', description: '單局得分20000+', emoji: '👑', reward: 150, check: s => s.highScore >= 20000 },
  { id: 'level-5', name: '五級達人', description: '到達等級5', emoji: '📈', reward: 50, check: s => s.highestLevel >= 5 },
  { id: 'level-15', name: '十五級傳說', description: '到達等級15', emoji: '🚀', reward: 100, check: s => s.highestLevel >= 15 },
  { id: 'bomb-10', name: '炸彈專家', description: '觸發10次炸彈', emoji: '💣', reward: 75, check: s => s.specialBombs >= 10 },
  { id: 'rainbow-5', name: '彩虹使者', description: '觸發5次彩虹', emoji: '🌈', reward: 100, check: s => s.specialRainbows >= 5 },
  { id: 'theme-3', name: '主題收藏家', description: '解鎖3個主題', emoji: '🎨', reward: 75, check: s => s.themesUnlocked >= 3 },
  { id: 'daily-3', name: '每日忠實', description: '完成3次每日獎勵', emoji: '📅', reward: 75, check: s => s.dailyCompleted >= 3 },
  { id: 'veteran', name: '資深玩家', description: '遊玩20場遊戲', emoji: '🏅', reward: 100, check: s => s.gamesPlayed >= 20 },
] as const

export function getJellyAchievementById(id: string): JellyAchievement {
  const a = JELLY_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Jelly achievement not found: ${id}`)
  return a
}

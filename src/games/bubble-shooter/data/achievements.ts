export interface ShooterAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number // coins
  check: (stats: ShooterStats) => boolean
}

export interface ShooterStats {
  levelsCompleted: number
  totalPopped: number     // total bubbles popped across all games
  totalFallen: number     // total floating bubbles knocked down
  highScore: number
  perfectLevels: number   // levels completed with no missed shots (shotsLeft == maxShots on win)
  maxLevel: number
  themesUnlocked: number
  dailyCompleted: number
  totalShots: number      // total shots fired across all games
}

export const SHOOTER_ACHIEVEMENTS: readonly ShooterAchievement[] = [
  { id: 'first-clear', name: '初次通關', description: '完成第一關', emoji: '🎯', reward: 25, check: s => s.levelsCompleted >= 1 },
  { id: 'ten-clears', name: '十關達人', description: '完成10關', emoji: '🏅', reward: 75, check: s => s.levelsCompleted >= 10 },
  { id: 'pop-100', name: '泡泡殺手', description: '累計消除100個泡泡', emoji: '💥', reward: 50, check: s => s.totalPopped >= 100 },
  { id: 'pop-1000', name: '泡泡終結者', description: '累計消除1000個泡泡', emoji: '🔥', reward: 100, check: s => s.totalPopped >= 1000 },
  { id: 'sharpshooter', name: '神射手', description: '完美通關（無失誤）', emoji: '🏹', reward: 75, check: s => s.perfectLevels >= 1 },
  { id: 'perfect-5', name: '完美五連', description: '5次完美通關', emoji: '💎', reward: 100, check: s => s.perfectLevels >= 5 },
  { id: 'score-1000', name: '千分達人', description: '單局得分1000+', emoji: '🏆', reward: 75, check: s => s.highScore >= 1000 },
  { id: 'score-5000', name: '五千傳說', description: '單局得分5000+', emoji: '👑', reward: 100, check: s => s.highScore >= 5000 },
  { id: 'level-25', name: '二十五關', description: '到達第25關', emoji: '🚀', reward: 100, check: s => s.maxLevel >= 25 },
  { id: 'level-50', name: '五十關傳說', description: '通關全部50關', emoji: '🌟', reward: 200, check: s => s.maxLevel >= 50 },
  { id: 'theme-3', name: '主題收藏家', description: '解鎖3個主題', emoji: '🎨', reward: 75, check: s => s.themesUnlocked >= 3 },
  { id: 'daily-3', name: '每日忠實', description: '完成3次每日獎勵', emoji: '📅', reward: 75, check: s => s.dailyCompleted >= 3 },
  { id: 'chain-5', name: '連鎖反應', description: '單次射擊消除+掉落10+個泡泡', emoji: '⚡', reward: 50, check: s => s.totalFallen >= 50 },
  { id: 'veteran', name: '資深玩家', description: '發射500發子彈', emoji: '🎯', reward: 100, check: s => s.totalShots >= 500 },
] as const

export function getShooterAchievementById(id: string): ShooterAchievement {
  const a = SHOOTER_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Shooter achievement not found: ${id}`)
  return a
}

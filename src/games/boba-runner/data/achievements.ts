export interface RunnerAchievement {
  id: string
  name: string
  description: string
  emoji: string
  reward: number // coins
  check: (stats: RunnerStats) => boolean
}

export interface RunnerStats {
  totalScore: number
  highScore: number
  totalPearls: number
  totalDistance: number
  totalJumps: number
  totalSlides: number
  shieldsUsed: number
  themesUnlocked: number
  dailyCompleted: number
  gamesPlayed: number
}

export const RUNNER_ACHIEVEMENTS: readonly RunnerAchievement[] = [
  { id: 'first-run', name: '初次奔跑', description: '完成第一場遊戲', emoji: '🎯', reward: 25, check: s => s.gamesPlayed >= 1 },
  { id: 'run-50', name: '奔跑達人', description: '遊玩50場遊戲', emoji: '🔥', reward: 100, check: s => s.gamesPlayed >= 50 },
  { id: 'score-100', name: '百分跑者', description: '單局得分100+', emoji: '🏆', reward: 50, check: s => s.highScore >= 100 },
  { id: 'score-500', name: '五百強', description: '單局得分500+', emoji: '💎', reward: 100, check: s => s.highScore >= 500 },
  { id: 'score-2000', name: '兩千傳說', description: '單局得分2000+', emoji: '👑', reward: 200, check: s => s.highScore >= 2000 },
  { id: 'pearls-100', name: '珍珠收集者', description: '累計收集100顆珍珠', emoji: '🟤', reward: 75, check: s => s.totalPearls >= 100 },
  { id: 'pearls-1000', name: '珍珠大師', description: '累計收集1000顆珍珠', emoji: '✨', reward: 150, check: s => s.totalPearls >= 1000 },
  { id: 'distance-10k', name: '萬米跑者', description: '累計跑10000米', emoji: '🏃', reward: 100, check: s => s.totalDistance >= 10000 },
  { id: 'distance-100k', name: '馬拉松大師', description: '累計跑100000米', emoji: '🏅', reward: 200, check: s => s.totalDistance >= 100000 },
  { id: 'jumper', name: '跳躍高手', description: '累計跳躍500次', emoji: '🦘', reward: 75, check: s => s.totalJumps >= 500 },
  { id: 'slider', name: '滑行達人', description: '累計滑行200次', emoji: '🛷', reward: 75, check: s => s.totalSlides >= 200 },
  { id: 'theme-3', name: '主題收藏家', description: '解鎖3個主題', emoji: '🎨', reward: 75, check: s => s.themesUnlocked >= 3 },
  { id: 'daily-3', name: '每日忠實', description: '完成3次每日獎勵', emoji: '📅', reward: 75, check: s => s.dailyCompleted >= 3 },
  { id: 'marathon', name: '馬拉松之王', description: '單局跑過500米', emoji: '🥇', reward: 150, check: s => s.totalDistance >= 500 },
] as const

export function getRunnerAchievementById(id: string): RunnerAchievement {
  const a = RUNNER_ACHIEVEMENTS.find(ac => ac.id === id)
  if (!a) throw new Error(`Runner achievement not found: ${id}`)
  return a
}

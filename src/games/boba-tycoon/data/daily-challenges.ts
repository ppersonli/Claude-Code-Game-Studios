export interface DailyChallenge {
  name: string
  desc: string
  emoji: string
  target: number
  reward: number
  type: 'earn' | 'tap' | 'serve'
}

export const DAILY_CHALLENGES: readonly DailyChallenge[] = [
  { name: '快速赚钱', desc: '在30秒内赚取$1000', emoji: '💰', target: 1000, reward: 200, type: 'earn' },
  { name: '疯狂点击', desc: '点击100次', emoji: '👆', target: 100, reward: 150, type: 'tap' },
  { name: '完美服务', desc: '服务50杯饮品', emoji: '🎯', target: 50, reward: 300, type: 'serve' },
  { name: '效率达人', desc: '在30秒内赚取$5000', emoji: '⚡', target: 5000, reward: 500, type: 'earn' },
  { name: '连击大师', desc: '点击200次', emoji: '🔥', target: 200, reward: 400, type: 'tap' },
] as const

export function getDailyChallenge(daySeed: number): DailyChallenge {
  const idx = Math.abs(daySeed) % DAILY_CHALLENGES.length
  return DAILY_CHALLENGES[idx]
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

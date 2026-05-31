export interface Upgrade {
  id: string
  name: string
  emoji: string
  description: string
  baseCost: number
  costMult: number
  maxLevel: number
}

export const UPGRADES: readonly Upgrade[] = [
  { id: 'tap-power', name: '点击力量', emoji: '👆', description: '每次点击+1', baseCost: 10, costMult: 1.5, maxLevel: 100 },
  { id: 'auto-click', name: '自动点击', emoji: '🤖', description: '每秒自动点击', baseCost: 50, costMult: 1.4, maxLevel: 50 },
  { id: 'crit-chance', name: '暴击概率', emoji: '💥', description: '暴击概率+2%', baseCost: 100, costMult: 1.8, maxLevel: 25 },
  { id: 'combo-mult', name: '连击倍率', emoji: '🔥', description: '连击奖励+5%', baseCost: 200, costMult: 2.0, maxLevel: 20 },
] as const

export interface Milestone {
  taps: number
  reward: number
  name: string
  emoji: string
}

export const MILESTONES: readonly Milestone[] = [
  { taps: 100, reward: 50, name: '新手', emoji: '🌱' },
  { taps: 500, reward: 200, name: '学徒', emoji: '🎓' },
  { taps: 1000, reward: 500, name: '达人', emoji: '⭐' },
  { taps: 5000, reward: 2000, name: '大师', emoji: '👑' },
  { taps: 10000, reward: 5000, name: '传说', emoji: '🏆' },
  { taps: 50000, reward: 20000, name: '神话', emoji: '✨' },
  { taps: 100000, reward: 50000, name: '至尊', emoji: '💎' },
] as const

export function getUpgradeCost(upgrade: Upgrade, level: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level))
}

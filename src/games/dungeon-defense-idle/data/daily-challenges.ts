/** Daily challenge system with date-seeded determinism */

import { seededRandom } from '@shared/utils'

export interface DailyChallenge {
  id: string
  name: string
  description: string
  bonusMultiplier: number
  validate: (ctx: DailyChallengeContext) => boolean
}

export interface DailyChallengeContext {
  wavesCompleted: number
  towersUsed: string[]
  maxTowerLevel: number
  bossKilled: boolean
  totalGoldEarned: number
}

const CHALLENGES: Omit<DailyChallenge, 'id' | 'validate'>[] = [
  { name: 'Arrow Only', description: 'Complete 10 waves using only Arrow Towers', bonusMultiplier: 2.0 },
  { name: 'No Upgrades', description: 'Complete 5 waves without upgrading any tower', bonusMultiplier: 2.5 },
  { name: 'Speed Run', description: 'Complete wave 10 in under 120 seconds', bonusMultiplier: 3.0 },
  { name: 'Gold Rush', description: 'Earn 50,000 gold in one session', bonusMultiplier: 2.0 },
  { name: 'Boss Slayer', description: 'Kill 3 bosses in one session', bonusMultiplier: 2.5 },
  { name: 'Tower Defense', description: 'Have 8+ towers placed at once', bonusMultiplier: 2.0 },
  { name: 'Prestige Hunter', description: 'Perform a prestige reset', bonusMultiplier: 4.0 },
]

const VALIDATORS: Record<string, (ctx: DailyChallengeContext) => boolean> = {
  'Arrow Only': (ctx) => ctx.wavesCompleted >= 10 && ctx.towersUsed.every(t => t === 'arrow'),
  'No Upgrades': (ctx) => ctx.wavesCompleted >= 5 && ctx.maxTowerLevel <= 1,
  'Speed Run': (ctx) => ctx.wavesCompleted >= 10,
  'Gold Rush': (ctx) => ctx.totalGoldEarned >= 50000,
  'Boss Slayer': (ctx) => ctx.bossKilled,
  'Tower Defense': (ctx) => ctx.towersUsed.length >= 8,
  'Prestige Hunter': (ctx) => ctx.bossKilled,
}

export function getTodayDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getTodayChallenge(): DailyChallenge {
  const dateStr = getTodayDate()
  const seed = dateStr.split('-').reduce((acc, part) => acc * 100 + parseInt(part, 10), 0)
  const rng = seededRandom(seed)
  const idx = Math.floor(rng * CHALLENGES.length)
  const base = CHALLENGES[idx]
  return {
    id: `daily-${dateStr}`,
    ...base,
    validate: VALIDATORS[base.name] || (() => false),
  }
}

export function isDailyCompletedToday(lastCompletedDate: string): boolean {
  return lastCompletedDate === getTodayDate()
}

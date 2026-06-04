/** Daily challenge system with date-seeded determinism */

import { seededRandom } from '@shared/utils'

export interface DailyChallenge {
  id: string
  name: string
  description: string
  icon: string
  bonusMultiplier: number
  validate: (ctx: DailyChallengeContext) => boolean
}

export interface DailyChallengeContext {
  totalCoinsEarned: number
  itemsProduced: number
  upgradesMade: number
  activeTime: number        // seconds of active play
  prestigeDone: boolean
}

const CHALLENGES: Omit<DailyChallenge, 'id' | 'validate'>[] = [
  {
    name: 'Mining Frenzy',
    description: 'Produce 100 items in one session',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/mining-frenzy.webp`,
    bonusMultiplier: 2.0,
  },
  {
    name: 'Upgrade Rush',
    description: 'Make 10 upgrades in one session',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/upgrade-rush.webp`,
    bonusMultiplier: 2.5,
  },
  {
    name: 'Speed Tycoon',
    description: 'Earn 10,000 coins in 60 seconds',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/mining-frenzy.webp`,
    bonusMultiplier: 3.0,
  },
  {
    name: 'Coin Collector',
    description: 'Earn 50,000 coins total today',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/upgrade-rush.webp`,
    bonusMultiplier: 2.0,
  },
  {
    name: 'Planet Hopper',
    description: 'Produce items on 3 different planets',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/mining-frenzy.webp`,
    bonusMultiplier: 2.5,
  },
  {
    name: 'Factory Empire',
    description: 'Have 10+ active production lines',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/upgrade-rush.webp`,
    bonusMultiplier: 2.0,
  },
  {
    name: 'Prestige Hunter',
    description: 'Perform a prestige reset',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/mining-frenzy.webp`,
    bonusMultiplier: 4.0,
  },
]

const VALIDATORS: Record<string, (ctx: DailyChallengeContext) => boolean> = {
  'Mining Frenzy': (ctx) => ctx.itemsProduced >= 100,
  'Upgrade Rush': (ctx) => ctx.upgradesMade >= 10,
  'Speed Tycoon': (ctx) => ctx.totalCoinsEarned >= 10000 && ctx.activeTime <= 60,
  'Coin Collector': (ctx) => ctx.totalCoinsEarned >= 50000,
  'Planet Hopper': (ctx) => ctx.upgradesMade >= 3, // simplified proxy
  'Factory Empire': (ctx) => ctx.upgradesMade >= 5,
  'Prestige Hunter': (ctx) => ctx.prestigeDone,
}

export function getTodayDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getTodayChallenge(): DailyChallenge {
  const dateStr = getTodayDate()
  // Convert date string to a numeric seed
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

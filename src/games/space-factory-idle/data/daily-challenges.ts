/** Daily challenge system with date-seeded determinism */

import { seededRandom } from '@shared/utils'

export interface DailyChallenge {
  id: string
  name: string
  description: string
  icon: string
  bonusMultiplier: number
  validate: (ctx: DailyChallengeContext) => boolean
  /** Structured goal for progress tracking */
  goal: { type: 'items' | 'upgrades' | 'coins' | 'coinsTime' | 'prestige'; target: number; timeLimit?: number }
}

export interface DailyChallengeContext {
  totalCoinsEarned: number
  itemsProduced: number
  upgradesMade: number
  activeTime: number        // seconds of active play
  prestigeDone: boolean
}

export interface DailyChallengeProgress {
  current: number
  target: number
  /** 0..1, clamped */
  percent: number
  /** Human-readable label, e.g. "47 / 100" */
  label: string
  completed: boolean
}

const CHALLENGES: Omit<DailyChallenge, 'id' | 'validate'>[] = [
  {
    name: 'Mining Frenzy',
    description: 'Produce 100 items in one session',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/mining-frenzy.webp`,
    bonusMultiplier: 2.0,
    goal: { type: 'items', target: 100 },
  },
  {
    name: 'Upgrade Rush',
    description: 'Make 10 upgrades in one session',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/upgrade-rush.webp`,
    bonusMultiplier: 2.5,
    goal: { type: 'upgrades', target: 10 },
  },
  {
    name: 'Speed Tycoon',
    description: 'Earn 10,000 coins in 60 seconds',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/mining-frenzy.webp`,
    bonusMultiplier: 3.0,
    goal: { type: 'coinsTime', target: 10000, timeLimit: 60 },
  },
  {
    name: 'Coin Collector',
    description: 'Earn 50,000 coins total today',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/upgrade-rush.webp`,
    bonusMultiplier: 2.0,
    goal: { type: 'coins', target: 50000 },
  },
  {
    name: 'Planet Hopper',
    description: 'Produce items on 3 different planets',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/mining-frenzy.webp`,
    bonusMultiplier: 2.5,
    goal: { type: 'upgrades', target: 3 },
  },
  {
    name: 'Factory Empire',
    description: 'Have 10+ active production lines',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/upgrade-rush.webp`,
    bonusMultiplier: 2.0,
    goal: { type: 'upgrades', target: 5 },
  },
  {
    name: 'Prestige Hunter',
    description: 'Perform a prestige reset',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/challenges/mining-frenzy.webp`,
    bonusMultiplier: 4.0,
    goal: { type: 'prestige', target: 1 },
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

/**
 * Complete today's daily challenge.
 * Updates the state with completion date, streak, and bonus reward.
 * Returns true if successfully completed, false if already completed today.
 */
export function completeDailyChallenge(
  state: { lastDailyCompleted: string; dailyStreak: number; coins: number; totalCoins: number },
  challenge: DailyChallenge,
): boolean {
  // Don't double-complete
  if (isDailyCompletedToday(state.lastDailyCompleted)) return false

  // Check if streak continues (last completion was yesterday)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

  const streakContinues = state.lastDailyCompleted === yesterdayStr

  // Mark completed
  state.lastDailyCompleted = getTodayDate()

  // Update streak
  if (streakContinues) {
    state.dailyStreak += 1
  } else {
    state.dailyStreak = 1
  }

  // Award bonus coins
  const bonus = Math.floor(state.coins * (challenge.bonusMultiplier - 1))
  if (bonus > 0) {
    state.coins += bonus
    state.totalCoins += bonus
  }

  return true
}

/**
 * Calculate progress toward a daily challenge goal.
 * Returns current/target values, percent, and a display label.
 */
export function getDailyChallengeProgress(
  challenge: DailyChallenge,
  ctx: DailyChallengeContext,
): DailyChallengeProgress {
  let current = 0
  const target = challenge.goal.target

  switch (challenge.goal.type) {
    case 'items':
      current = ctx.itemsProduced
      break
    case 'upgrades':
      current = ctx.upgradesMade
      break
    case 'coins':
      current = ctx.totalCoinsEarned
      break
    case 'coinsTime':
      current = ctx.totalCoinsEarned
      break
    case 'prestige':
      current = ctx.prestigeDone ? 1 : 0
      break
  }

  const clamped = Math.min(current, target)
  const percent = target > 0 ? clamped / target : 0
  const completed = clamped >= target

  return {
    current: clamped,
    target,
    percent,
    label: `${clamped} / ${target}`,
    completed,
  }
}

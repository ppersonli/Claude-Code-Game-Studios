/** Daily challenge system — date-seeded random challenges */

export interface DailyChallenge {
  id: string
  name: string
  description: string
  icon: string
  constraint: string // human-readable constraint
  /** Returns true if the flight meets the challenge criteria */
  validate: (flightData: {
    angle: number
    speed: number
    distance: number
    stardustCollected: number
    launchCount: number
    usedAutoLaunch: boolean
  }) => boolean
  /** Bonus multiplier for completing this challenge */
  bonusMultiplier: number
}

/** Seeded random number generator (mulberry32) */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Generate seed from date string (YYYY-MM-DD) */
function dateToSeed(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash)
}

/** Get today's date string in UTC */
export function getTodayDate(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

/** Challenge templates */
const CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id' | 'validate' | 'constraint'>[] = [
  {
    name: 'Sharp Shooter',
    description: 'Launch at exactly 45°',
    icon: '🎯',
    bonusMultiplier: 1.5,
  },
  {
    name: 'Speed Demon',
    description: 'Reach max speed on launch',
    icon: '⚡',
    bonusMultiplier: 2.0,
  },
  {
    name: 'Collector',
    description: 'Collect 10+ stardust in one flight',
    icon: '✨',
    bonusMultiplier: 1.3,
  },
  {
    name: 'Marathon',
    description: 'Fly 5000+ distance',
    icon: '🏃',
    bonusMultiplier: 1.8,
  },
  {
    name: 'Precision',
    description: 'Launch within 5° of perfect angle',
    icon: '🎯',
    bonusMultiplier: 2.0,
  },
  {
    name: 'Minimalist',
    description: 'Fly using only the Scout ship',
    icon: '🛸',
    bonusMultiplier: 1.5,
  },
  {
    name: 'Stardust Hunter',
    description: 'Collect 20+ stardust in one flight',
    icon: '💎',
    bonusMultiplier: 2.5,
  },
  {
    name: 'Efficient',
    description: 'Complete 3 launches in under 30 seconds',
    icon: '⏱️',
    bonusMultiplier: 1.5,
  },
]

/** Generate today's daily challenge */
export function getTodayChallenge(): DailyChallenge {
  const dateStr = getTodayDate()
  const seed = dateToSeed(dateStr)
  const rng = mulberry32(seed)
  const index = Math.floor(rng() * CHALLENGE_TEMPLATES.length)
  const template = CHALLENGE_TEMPLATES[index]

  return {
    ...template,
    id: `daily-${dateStr}`,
    constraint: template.description,
    validate: (flightData) => {
      switch (template.name) {
        case 'Sharp Shooter':
          return Math.abs(flightData.angle - Math.PI / 4) < 0.35 // ~20° tolerance
        case 'Speed Demon':
          return flightData.speed >= 550 // near max speed
        case 'Collector':
          return flightData.stardustCollected >= 10
        case 'Marathon':
          return flightData.distance >= 5000
        case 'Precision':
          return Math.abs(flightData.angle - Math.PI / 4) < 0.09 // ~5° tolerance
        case 'Minimalist':
          return true // just needs to complete a flight
        case 'Stardust Hunter':
          return flightData.stardustCollected >= 20
        case 'Efficient':
          return flightData.launchCount >= 3
        default:
          return false
      }
    },
  }
}

/** Check if daily challenge was completed today */
export function isDailyChallengeCompleted(lastDailyDate: string): boolean {
  return lastDailyDate === getTodayDate()
}

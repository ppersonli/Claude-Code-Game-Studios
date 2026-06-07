import type { GameState } from './game-state'

export interface DailyChallenge {
  id: string
  name: string
  description: string
  target: number
  reward: number
}

/** Seeded random number generator based on date string */
function seededRandom(seed: string): () => number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff
    return hash / 0x7fffffff
  }
}

/** Get today's date as YYYY-MM-DD string */
function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** Get yesterday's date as YYYY-MM-DD string */
function getYesterdayString(): string {
  const now = new Date()
  now.setDate(now.getDate() - 1)
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** Challenge templates */
const CHALLENGES = [
  { name: 'Hole in One', description: 'Get a hole in one on any level', target: 1, reward: 5 },
  { name: 'Star Collector', description: 'Earn 10 stars in a single session', target: 10, reward: 3 },
  { name: 'Par Master', description: 'Complete 5 levels at or under par', target: 5, reward: 4 },
  { name: 'Speed Runner', description: 'Complete 3 levels in under 30 seconds total', target: 3, reward: 6 },
  { name: 'Bounce King', description: 'Hit 50 bounces in a single level', target: 50, reward: 3 },
  { name: 'Portal Hopper', description: 'Use 5 portals in a single session', target: 5, reward: 4 },
]

/**
 * Get today's daily challenge
 * Deterministic based on date - same challenge all day
 */
export function getDailyChallenge(): DailyChallenge {
  const today = getTodayString()
  const rng = seededRandom(today)
  const index = Math.floor(rng() * CHALLENGES.length)
  const template = CHALLENGES[index]
  
  return {
    id: `daily-${today}`,
    name: template.name,
    description: template.description,
    target: template.target,
    reward: template.reward,
  }
}

/**
 * Check if today's challenge is completed
 */
export function isDailyChallengeCompleted(state: GameState): boolean {
  const today = getTodayString()
  return state.lastDailyChallengeDate === today
}

/**
 * Complete today's challenge and add reward
 */
export function completeDailyChallenge(state: GameState): GameState {
  if (isDailyChallengeCompleted(state)) {
    return state // Already completed today
  }
  
  const challenge = getDailyChallenge()
  const today = getTodayString()
  
  // Calculate new streak
  const yesterday = getYesterdayString()
  const lastDate = state.lastDailyChallengeDate
  const isConsecutive = lastDate === yesterday || lastDate === today
  const newStreak = isConsecutive ? state.dailyChallengeStreak + 1 : 1
  
  return {
    ...state,
    galaxyCoins: state.galaxyCoins + challenge.reward,
    dailyChallengesCompleted: state.dailyChallengesCompleted + 1,
    dailyChallengeStreak: newStreak,
    lastDailyChallengeDate: today,
  }
}

/**
 * Calculate current streak of consecutive daily challenges
 */
export function getDailyChallengeStreak(state: GameState): number {
  return state.dailyChallengeStreak
}

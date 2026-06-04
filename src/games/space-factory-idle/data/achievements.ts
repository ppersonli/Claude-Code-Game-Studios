/** Achievement definitions per GDD */

export interface Achievement {
  id: string
  name: string
  description: string
  condition: string       // human-readable condition
  reward: string          // human-readable reward
  icon: string
  /** Pure check function against game state */
  check: (state: AchievementCheckState) => boolean
}

export interface AchievementCheckState {
  totalProduced: number
  activeLines: number
  unlockedPlanets: string[]
  totalCoins: number
  prestigeCount: number
  allLinesAutomated: boolean
  employeeCounts: Record<string, number>
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-produce',
    name: 'First Production',
    description: 'Produce your first item',
    condition: 'Produce 1 item',
    reward: '100 coins',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/achievements/first-produce.webp`,
    check: (s) => s.totalProduced >= 1,
  },
  {
    id: 'factory-owner',
    name: 'Factory Owner',
    description: 'Own 5 production lines',
    condition: 'Have 5 active lines',
    reward: '500 coins',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/achievements/factory-owner.webp`,
    check: (s) => s.activeLines >= 5,
  },
  {
    id: 'star-traveler',
    name: 'Star Traveler',
    description: 'Unlock the 2nd planet',
    condition: 'Unlock 2 planets',
    reward: '1,000 coins',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/achievements/star-traveler.webp`,
    check: (s) => s.unlockedPlanets.length >= 2,
  },
  {
    id: 'millionaire',
    name: 'Millionaire',
    description: 'Earn 1,000,000 total coins',
    condition: 'Accumulate 1M coins',
    reward: 'First Prestige eligible',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/achievements/millionaire.webp`,
    check: (s) => s.totalCoins >= 1_000_000,
  },
  {
    id: 'galaxy-tour',
    name: 'Galaxy Tour',
    description: 'Unlock all planets',
    condition: 'Unlock all 6 planets',
    reward: 'Rare skin',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/achievements/galaxy-tour.webp`,
    check: (s) => s.unlockedPlanets.length >= 6,
  },
  {
    id: 'auto-master',
    name: 'Auto Master',
    description: 'Automate all production lines',
    condition: 'All lines automated',
    reward: 'Special title',
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/achievements/auto-master.webp`,
    check: (s) => s.allLinesAutomated && s.activeLines >= 3,
  },
]

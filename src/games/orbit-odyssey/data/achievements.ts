/** Achievement definitions */

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: string // human-readable condition
  check: (state: {
    totalLaunches: number
    bestDistance: number
    stardustTotal: number
    prestigeCount: number
    prestigeCores: number
    unlockedShips: string[]
    unlockedSystems: string[]
  }) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_flight',
    name: 'First Flight',
    description: 'Complete your first launch',
    icon: '🚀',
    condition: 'Total launches ≥ 1',
    check: (s) => s.totalLaunches >= 1,
  },
  {
    id: 'veteran_pilot',
    name: 'Veteran Pilot',
    description: 'Complete 100 launches',
    icon: '✈️',
    condition: 'Total launches ≥ 100',
    check: (s) => s.totalLaunches >= 100,
  },
  {
    id: 'master_pilot',
    name: 'Master Pilot',
    description: 'Complete 1000 launches',
    icon: '🏆',
    condition: 'Total launches ≥ 1000',
    check: (s) => s.totalLaunches >= 1000,
  },
  {
    id: 'light_year',
    name: 'Light Year',
    description: 'Fly 1,000 distance in a single flight',
    icon: '📏',
    condition: 'Best distance ≥ 1000',
    check: (s) => s.bestDistance >= 1000,
  },
  {
    id: 'deep_space',
    name: 'Deep Space',
    description: 'Fly 10,000 distance in a single flight',
    icon: '🌌',
    condition: 'Best distance ≥ 10000',
    check: (s) => s.bestDistance >= 10000,
  },
  {
    id: 'interstellar',
    name: 'Interstellar',
    description: 'Fly 100,000 distance in a single flight',
    icon: '💫',
    condition: 'Best distance ≥ 100000',
    check: (s) => s.bestDistance >= 100000,
  },
  {
    id: 'stardust_collector',
    name: 'Stardust Collector',
    description: 'Earn 10,000 total stardust',
    icon: '✨',
    condition: 'Total stardust ≥ 10000',
    check: (s) => s.stardustTotal >= 10000,
  },
  {
    id: 'cosmic_wealth',
    name: 'Cosmic Wealth',
    description: 'Earn 1,000,000 total stardust',
    icon: '💰',
    condition: 'Total stardust ≥ 1000000',
    check: (s) => s.stardustTotal >= 1000000,
  },
  {
    id: 'first_prestige',
    name: 'Rebirth',
    description: 'Prestige for the first time',
    icon: '⭐',
    condition: 'Prestige count ≥ 1',
    check: (s) => s.prestigeCount >= 1,
  },
  {
    id: 'prestige_master',
    name: 'Prestige Master',
    description: 'Prestige 10 times',
    icon: '🌟',
    condition: 'Prestige count ≥ 10',
    check: (s) => s.prestigeCount >= 10,
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Unlock all ships',
    icon: '🚀',
    condition: 'All 5 ships unlocked',
    check: (s) => s.unlockedShips.length >= 5,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Unlock all star systems',
    icon: '🗺️',
    condition: 'All 3 star systems unlocked',
    check: (s) => s.unlockedSystems.length >= 3,
  },
]

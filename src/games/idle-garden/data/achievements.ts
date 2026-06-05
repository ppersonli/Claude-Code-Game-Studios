/**
 * Idle Garden Tycoon — Achievement data
 * Milestone-based rewards for long-term progression.
 */

import type { GameState } from './types'

export interface AchievementData {
  id: string
  name: string
  description: string
  condition: (state: GameState) => boolean
  reward: number
  icon: string
}

export const ACHIEVEMENTS: AchievementData[] = [
  // Harvest milestones
  {
    id: 'first-harvest',
    name: 'First Harvest',
    description: 'Harvest your first flower.',
    condition: (s) => s.stats.totalHarvests >= 1,
    reward: 50,
    icon: '🌱',
  },
  {
    id: 'harvest-100',
    name: 'Busy Gardener',
    description: 'Harvest 100 flowers.',
    condition: (s) => s.stats.totalHarvests >= 100,
    reward: 2_000,
    icon: '🌻',
  },
  {
    id: 'harvest-1000',
    name: 'Master Harvester',
    description: 'Harvest 1,000 flowers.',
    condition: (s) => s.stats.totalHarvests >= 1000,
    reward: 20_000,
    icon: '🏆',
  },

  // Flower milestones
  {
    id: 'first-flower',
    name: 'Green Thumb',
    description: 'Grow your first flower.',
    condition: (s) => s.stats.totalFlowersGrown >= 1,
    reward: 25,
    icon: '🌱',
  },
  {
    id: 'flowers-100',
    name: 'Garden Enthusiast',
    description: 'Grow 100 flowers.',
    condition: (s) => s.stats.totalFlowersGrown >= 100,
    reward: 2_000,
    icon: '💐',
  },
  {
    id: 'flowers-1000',
    name: 'Flower Empire',
    description: 'Grow 1,000 flowers.',
    condition: (s) => s.stats.totalFlowersGrown >= 1000,
    reward: 20_000,
    icon: '🌺',
  },

  // Coin milestones
  {
    id: 'coins-10k',
    name: 'Penny Saver',
    description: 'Earn 10,000 total coins.',
    condition: (s) => s.stats.totalCoinsEarned >= 10_000,
    reward: 500,
    icon: '💰',
  },
  {
    id: 'coins-100k',
    name: 'Wealthy Gardener',
    description: 'Earn 100,000 total coins.',
    condition: (s) => s.stats.totalCoinsEarned >= 100_000,
    reward: 5_000,
    icon: '💎',
  },
  {
    id: 'coins-1m',
    name: 'Garden Tycoon',
    description: 'Earn 1,000,000 total coins.',
    condition: (s) => s.stats.totalCoinsEarned >= 1_000_000,
    reward: 50_000,
    icon: '👑',
  },

  // Level milestones
  {
    id: 'level-5',
    name: 'Getting Started',
    description: 'Reach level 5.',
    condition: (s) => s.level >= 5,
    reward: 300,
    icon: '⭐',
  },
  {
    id: 'level-10',
    name: 'Experienced Gardener',
    description: 'Reach level 10.',
    condition: (s) => s.level >= 10,
    reward: 2_000,
    icon: '🌟',
  },
  {
    id: 'level-20',
    name: 'Garden Veteran',
    description: 'Reach level 20.',
    condition: (s) => s.level >= 20,
    reward: 15_000,
    icon: '💫',
  },

  // Prestige milestones
  {
    id: 'first-prestige',
    name: 'New Beginnings',
    description: 'Prestige for the first time.',
    condition: (s) => s.prestigeCount >= 1,
    reward: 1_000,
    icon: '☀️',
  },
  {
    id: 'prestige-5',
    name: 'Seasoned Gardener',
    description: 'Prestige 5 times.',
    condition: (s) => s.prestigeCount >= 5,
    reward: 10_000,
    icon: '🌈',
  },

  // Decoration milestone
  {
    id: 'decorations-5',
    name: 'Interior Designer',
    description: 'Own 5 decorations.',
    condition: (s) => s.decorations.length >= 5,
    reward: 5_000,
    icon: '🎨',
  },
]

/**
 * Idle Garden Tycoon — Decoration data
 * Cosmetic items with passive bonuses.
 */

export interface DecorationData {
  id: string
  name: string
  description: string
  cost: number
  bonusType: 'growth' | 'price' | 'none'
  bonusValue: number
  unlockLevel: number
}

export const DECORATIONS: DecorationData[] = [
  {
    id: 'garden-gnome',
    name: 'Garden Gnome',
    description: 'A friendly gnome watches over your flowers. +5% growth speed.',
    cost: 500,
    bonusType: 'growth',
    bonusValue: 0.05,
    unlockLevel: 1,
  },
  {
    id: 'bird-bath',
    name: 'Bird Bath',
    description: 'Attracts songbirds to your garden. +5% sell price.',
    cost: 1_000,
    bonusType: 'price',
    bonusValue: 0.05,
    unlockLevel: 1,
  },
  {
    id: 'fairy-lights',
    name: 'Fairy Lights',
    description: 'Magical twinkling lights. +10% growth speed.',
    cost: 2_500,
    bonusType: 'growth',
    bonusValue: 0.10,
    unlockLevel: 2,
  },
  {
    id: 'stone-path',
    name: 'Stone Path',
    description: 'A winding path through your garden. +5% sell price.',
    cost: 5_000,
    bonusType: 'price',
    bonusValue: 0.05,
    unlockLevel: 2,
  },
  {
    id: 'fountain',
    name: 'Fountain',
    description: 'A beautiful water fountain. +10% growth speed.',
    cost: 10_000,
    bonusType: 'growth',
    bonusValue: 0.10,
    unlockLevel: 3,
  },
  {
    id: 'gazebo',
    name: 'Gazebo',
    description: 'A cozy garden gazebo. +10% sell price.',
    cost: 25_000,
    bonusType: 'price',
    bonusValue: 0.10,
    unlockLevel: 3,
  },
  {
    id: 'golden-statue',
    name: 'Golden Statue',
    description: 'A gleaming golden statue. +15% growth speed.',
    cost: 50_000,
    bonusType: 'growth',
    bonusValue: 0.15,
    unlockLevel: 4,
  },
  {
    id: 'enchanted-tree',
    name: 'Enchanted Tree',
    description: 'An ancient magical tree. +15% sell price.',
    cost: 100_000,
    bonusType: 'price',
    bonusValue: 0.15,
    unlockLevel: 5,
  },
]

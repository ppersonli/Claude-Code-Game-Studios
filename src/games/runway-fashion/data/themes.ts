import type { Theme } from './types'

export const THEMES: Theme[] = [
  { id: 'evening_gala', name: 'Elegant Gala', scene: 'red_carpet', requiredStyles: ['elegant', 'glamorous'], bonusStyles: ['elegant'], timeLimit: 18000, rewardMultiplier: 1.5, unlockLevel: 1, isWeekly: false },
  { id: 'campus', name: 'Campus Chic', scene: 'campus', requiredStyles: ['cute', 'casual'], bonusStyles: ['cute'], timeLimit: 15000, rewardMultiplier: 1.0, unlockLevel: 1, isWeekly: false },
  { id: 'street', name: 'Street Style', scene: 'street', requiredStyles: ['edgy', 'casual'], bonusStyles: ['edgy'], timeLimit: 15000, rewardMultiplier: 1.0, unlockLevel: 1, isWeekly: false },
  { id: 'beach', name: 'Beach Party', scene: 'beach', requiredStyles: ['casual', 'cute'], bonusStyles: ['casual'], timeLimit: 15000, rewardMultiplier: 1.0, unlockLevel: 1, isWeekly: false },
  { id: 'hollywood', name: 'Hollywood Glam', scene: 'awards', requiredStyles: ['glamorous', 'elegant'], bonusStyles: ['glamorous'], timeLimit: 20000, rewardMultiplier: 2.0, unlockLevel: 5, isWeekly: false },
]

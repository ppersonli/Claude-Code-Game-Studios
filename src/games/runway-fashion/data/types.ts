export type StyleTag = 'elegant' | 'casual' | 'glamorous' | 'cute' | 'edgy'

export type ClothingCategory = 'top' | 'bottom' | 'shoes' | 'accessory' | 'hair' | 'makeup'

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

export interface Clothing {
  id: string
  name: string
  category: ClothingCategory
  style: StyleTag[]
  color: string
  rarity: Rarity
  unlockLevel: number
  price: number
  image: string
}

export interface Theme {
  id: string
  name: string
  scene: string
  requiredStyles: StyleTag[]
  bonusStyles: StyleTag[]
  timeLimit: number
  rewardMultiplier: number
  unlockLevel: number
  isWeekly: boolean
}

export interface ScoringConfig {
  styleMatchWeight: number
  coordinationWeight: number
  performanceWeight: number
  creativityWeight: number
}

export interface GradeThreshold {
  grade: Grade
  minScore: number
  rewardMultiplier: number
}

export interface ScoreBreakdown {
  styleMatch: number
  coordination: number
  performance: number
  creativity: number
  total: number
  grade: Grade
  rewardMultiplier: number
}

export interface RunwayAction {
  id: string
  name: string
  bonusScore: number
  duration: number
}

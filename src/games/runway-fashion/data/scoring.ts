import type { ScoringConfig, GradeThreshold } from './types'

export const SCORING_CONFIG: ScoringConfig = {
  styleMatchWeight: 0.4,
  coordinationWeight: 0.3,
  performanceWeight: 0.2,
  creativityWeight: 0.1,
}

export const GRADE_THRESHOLDS: GradeThreshold[] = [
  { grade: 'S', minScore: 95, rewardMultiplier: 3.0 },
  { grade: 'A', minScore: 85, rewardMultiplier: 2.0 },
  { grade: 'B', minScore: 75, rewardMultiplier: 1.5 },
  { grade: 'C', minScore: 60, rewardMultiplier: 1.0 },
  { grade: 'D', minScore: 0, rewardMultiplier: 0.5 },
]

export const RUNWAY_ACTIONS = [
  { id: 'walk', name: 'Walk', bonusScore: 5, duration: 1000 },
  { id: 'twirl', name: 'Twirl', bonusScore: 15, duration: 2000 },
  { id: 'pose', name: 'Pose', bonusScore: 20, duration: 1500 },
  { id: 'wave', name: 'Wave', bonusScore: 10, duration: 1000 },
]

export const BASE_REWARD = 100

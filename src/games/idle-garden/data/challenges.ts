/**
 * Idle Garden Tycoon — Challenge template data
 * Templates for daily challenge generation.
 */

export interface ChallengeTemplate {
  id: string
  description: string   // contains {target} placeholder
  statKey: string        // key in state.stats (or special: 'comboCount')
  targetRange: [number, number]  // min/max target
  rewardBase: number     // base reward
  rewardPerUnit: number  // reward per target unit
}

export const CHALLENGES: ChallengeTemplate[] = [
  {
    id: 'harvest-x',
    description: 'Harvest {target} flowers today',
    statKey: 'totalHarvests',
    targetRange: [5, 30],
    rewardBase: 100,
    rewardPerUnit: 20,
  },
  {
    id: 'earn-x',
    description: 'Earn {target} coins today',
    statKey: 'totalCoinsEarned',
    targetRange: [500, 5000],
    rewardBase: 200,
    rewardPerUnit: 0.1,
  },
  {
    id: 'grow-x',
    description: 'Grow {target} flowers today',
    statKey: 'totalFlowersGrown',
    targetRange: [5, 25],
    rewardBase: 100,
    rewardPerUnit: 25,
  },
  {
    id: 'play-x',
    description: 'Play for {target} seconds today',
    statKey: 'totalPlayTime',
    targetRange: [60, 600],
    rewardBase: 50,
    rewardPerUnit: 1,
  },
  {
    id: 'combo-x',
    description: 'Reach a {target}x harvest combo',
    statKey: 'maxComboCount',
    targetRange: [2, 5],
    rewardBase: 300,
    rewardPerUnit: 100,
  },
]

/** Achievement definitions per GDD section 3.7 */

export interface Achievement {
  id: string
  name: string
  description: string
  reward: string
  check: (state: AchievementCheckState) => boolean
}

export interface AchievementCheckState {
  bestWave: number
  totalKills: number
  totalCoins: number
  prestigeCount: number
  unlockedDungeons: string[]
  consecutiveNoLeak: number
  bossKillTime: number   // seconds, 0 if no boss killed
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-defense',
    name: 'First Defense',
    description: 'Complete wave 1',
    reward: '100 coins',
    check: (s) => s.bestWave >= 1,
  },
  {
    id: 'unbreakable',
    name: 'Unbreakable',
    description: '5 consecutive waves with no leaks',
    reward: '500 coins',
    check: (s) => s.consecutiveNoLeak >= 5,
  },
  {
    id: 'gold-tycoon',
    name: 'Gold Tycoon',
    description: 'Earn 1,000,000 total coins',
    reward: 'First Prestige eligible',
    check: (s) => s.totalCoins >= 1_000_000,
  },
  {
    id: 'dungeon-conqueror',
    name: 'Dungeon Conqueror',
    description: 'Unlock all dungeons',
    reward: 'Rare skin',
    check: (s) => s.unlockedDungeons.length >= 5,
  },
  {
    id: 'speed-star',
    name: 'Speed Star',
    description: 'Kill a boss in under 10 seconds',
    reward: 'Special title',
    check: (s) => s.bossKillTime > 0 && s.bossKillTime <= 10,
  },
]

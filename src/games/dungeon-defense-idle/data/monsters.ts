/** Monster definitions per GDD section 3.2 */

export interface MonsterDef {
  id: string
  name: string
  baseHp: number
  speed: number          // cells per second
  armor: number          // damage reduction fraction (0-1)
  special: 'none' | 'armor' | 'ghost' | 'fly' | 'boss'
  color: number
  size: number           // radius in pixels
  spawnWave: number
  goldReward: number
}

export const MONSTERS: MonsterDef[] = [
  {
    id: 'goblin',
    name: 'Goblin',
    baseHp: 30,
    speed: 1.5,
    armor: 0,
    special: 'none',
    color: 0x4CAF50,
    size: 8,
    spawnWave: 1,
    goldReward: 5,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    baseHp: 60,
    speed: 1.0,
    armor: 0,
    special: 'none',
    color: 0xE0E0E0,
    size: 9,
    spawnWave: 5,
    goldReward: 10,
  },
  {
    id: 'troll',
    name: 'Troll',
    baseHp: 200,
    speed: 0.5,
    armor: 0.3,
    special: 'armor',
    color: 0x795548,
    size: 12,
    spawnWave: 10,
    goldReward: 25,
  },
  {
    id: 'ghost',
    name: 'Ghost',
    baseHp: 40,
    speed: 2.0,
    armor: 0,
    special: 'ghost',
    color: 0xB39DDB,
    size: 8,
    spawnWave: 15,
    goldReward: 15,
  },
  {
    id: 'dragon',
    name: 'Dragon',
    baseHp: 500,
    speed: 0.8,
    armor: 0.2,
    special: 'fly',
    color: 0xF44336,
    size: 14,
    spawnWave: 25,
    goldReward: 50,
  },
  {
    id: 'boss',
    name: 'Boss',
    baseHp: 2000,
    speed: 0.3,
    armor: 0.25,
    special: 'boss',
    color: 0xFF5722,
    size: 18,
    spawnWave: 10, // every 10 waves
    goldReward: 200,
  },
]

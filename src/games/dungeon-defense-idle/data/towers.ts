/** Tower definitions per GDD section 3.1 */

export interface TowerDef {
  id: string
  name: string
  attackType: 'single' | 'aoe' | 'slow' | 'pierce' | 'dot' | 'heal'
  range: number         // grid cells
  baseDamage: number
  attackSpeed: number   // attacks per second
  baseCost: number
  costMultiplier: number
  unlockWave: number
  color: number         // primary render color
  accentColor: number   // secondary render color
  description: string
}

export const TOWERS: TowerDef[] = [
  {
    id: 'arrow',
    name: 'Arrow Tower',
    attackType: 'single',
    range: 3,
    baseDamage: 10,
    attackSpeed: 1.5,
    baseCost: 50,
    costMultiplier: 1.18,
    unlockWave: 0,
    color: 0x8B4513,
    accentColor: 0xCD853F,
    description: 'Fast single-target ranged attack',
  },
  {
    id: 'magic',
    name: 'Magic Tower',
    attackType: 'aoe',
    range: 2,
    baseDamage: 25,
    attackSpeed: 0.6,
    baseCost: 150,
    costMultiplier: 1.18,
    unlockWave: 5,
    color: 0x6A0DAD,
    accentColor: 0x9B59B6,
    description: 'Area damage, slow attack speed',
  },
  {
    id: 'ice',
    name: 'Ice Tower',
    attackType: 'slow',
    range: 3,
    baseDamage: 8,
    attackSpeed: 1.0,
    baseCost: 120,
    costMultiplier: 1.18,
    unlockWave: 10,
    color: 0x00BCD4,
    accentColor: 0x80DEEA,
    description: 'Slows enemies 50% for 2s',
  },
  {
    id: 'cannon',
    name: 'Cannon Tower',
    attackType: 'pierce',
    range: 4,
    baseDamage: 40,
    attackSpeed: 0.4,
    baseCost: 300,
    costMultiplier: 1.18,
    unlockWave: 20,
    color: 0x455A64,
    accentColor: 0x90A4AE,
    description: 'Pierces multiple enemies in a line',
  },
  {
    id: 'poison',
    name: 'Poison Tower',
    attackType: 'dot',
    range: 2,
    baseDamage: 5,
    attackSpeed: 0.8,
    baseCost: 200,
    costMultiplier: 1.18,
    unlockWave: 30,
    color: 0x4CAF50,
    accentColor: 0x81C784,
    description: 'DOT: 4s poison, damage per second',
  },
  {
    id: 'holy',
    name: 'Holy Tower',
    attackType: 'heal',
    range: 3,
    baseDamage: 0,
    attackSpeed: 0.5,
    baseCost: 500,
    costMultiplier: 1.18,
    unlockWave: 0, // unlocked via prestige
    color: 0xFFD700,
    accentColor: 0xFFF176,
    description: 'Heals nearby towers, boosts attack',
  },
]

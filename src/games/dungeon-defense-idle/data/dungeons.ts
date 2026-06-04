/** Dungeon definitions per GDD section 3.5 */

export interface DungeonDef {
  id: string
  name: string
  unlockCondition: string
  unlockWave: number
  unlockPrestige: number
  terrainEffect: string
  terrainColor: number
  pathColor: number
  bgColor: number
}

export const DUNGEONS: DungeonDef[] = [
  {
    id: 'shadow',
    name: 'Shadow Dungeon',
    unlockCondition: 'Start',
    unlockWave: 0,
    unlockPrestige: 0,
    terrainEffect: 'Basic monsters',
    terrainColor: 0x1a1a2e,
    pathColor: 0x2d2d44,
    bgColor: 0x0d0d1a,
  },
  {
    id: 'fire',
    name: 'Fire Dungeon',
    unlockCondition: 'Reach wave 30',
    unlockWave: 30,
    unlockPrestige: 0,
    terrainEffect: 'Fire zones damage enemies',
    terrainColor: 0x3e1a00,
    pathColor: 0x5c2e00,
    bgColor: 0x1a0d00,
  },
  {
    id: 'frost',
    name: 'Frost Dungeon',
    unlockCondition: 'Prestige 1 time',
    unlockWave: 0,
    unlockPrestige: 1,
    terrainEffect: 'Frost zones slow enemies',
    terrainColor: 0x0a1a2e,
    pathColor: 0x1a3050,
    bgColor: 0x050d1a,
  },
  {
    id: 'poison',
    name: 'Poison Dungeon',
    unlockCondition: 'Prestige 2 times',
    unlockWave: 0,
    unlockPrestige: 2,
    terrainEffect: 'Poison zones deal DOT',
    terrainColor: 0x1a2e0a,
    pathColor: 0x2e4a1a,
    bgColor: 0x0d1a05,
  },
  {
    id: 'chaos',
    name: 'Chaos Dungeon',
    unlockCondition: 'Prestige 3 times',
    unlockWave: 0,
    unlockPrestige: 3,
    terrainEffect: 'Random zone effects',
    terrainColor: 0x2e0a2e,
    pathColor: 0x4a1a4a,
    bgColor: 0x1a051a,
  },
]

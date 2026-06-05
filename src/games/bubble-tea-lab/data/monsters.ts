/**
 * 萌宠探险 - 怪兽数据与区域定义
 */

export type MonsterZone = 'tea_garden' | 'ranch' | 'candy_cave' | 'orchard' | 'ice_field' | 'abyss'

export interface MonsterDrop {
  ingredientId: string
  chance: number // 0-1
}

export interface Monster {
  id: string
  name: string
  emoji: string
  hp: number
  zone: MonsterZone
  drops: MonsterDrop[]
  rareDrops?: MonsterDrop[]
  expReward: number
  minPlayerLevel: number
  isBoss?: boolean
}

export interface Zone {
  id: MonsterZone
  name: string
  emoji: string
  bgGradient: [string, string]
  minLevel: number          // 解锁所需玩家等级
  monstersRequired: number  // 击败多少只解锁下一区域
  monsters: Monster[]
}

// === Monsters ===

const teaSlimeGreen: Monster = {
  id: 'tea_slime_green', name: '绿茶史莱姆', emoji: '🍵',
  hp: 8, zone: 'tea_garden', minPlayerLevel: 1, expReward: 5,
  drops: [{ ingredientId: 'green_tea', chance: 0.7 }],
}

const teaSlimeBlack: Monster = {
  id: 'tea_slime_black', name: '红茶史莱姆', emoji: '☕',
  hp: 10, zone: 'tea_garden', minPlayerLevel: 1, expReward: 6,
  drops: [{ ingredientId: 'black_tea', chance: 0.7 }],
}

const leafFairy: Monster = {
  id: 'leaf_fairy', name: '茶叶精灵', emoji: '🍃',
  hp: 15, zone: 'tea_garden', minPlayerLevel: 2, expReward: 10,
  drops: [{ ingredientId: 'green_tea', chance: 0.5 }, { ingredientId: 'black_tea', chance: 0.5 }],
  rareDrops: [{ ingredientId: 'ice', chance: 0.2 }],
}

const milkCloud: Monster = {
  id: 'milk_cloud', name: '奶云朵', emoji: '🥛',
  hp: 10, zone: 'ranch', minPlayerLevel: 1, expReward: 6,
  drops: [{ ingredientId: 'milk', chance: 0.7 }],
}

const coconutPalm: Monster = {
  id: 'coconut_palm', name: '椰子蟹', emoji: '🥥',
  hp: 12, zone: 'ranch', minPlayerLevel: 2, expReward: 8,
  drops: [{ ingredientId: 'coconut', chance: 0.7 }],
}

const creamSheep: Monster = {
  id: 'cream_sheep', name: '奶油绵羊', emoji: '🐑',
  hp: 18, zone: 'ranch', minPlayerLevel: 3, expReward: 12,
  drops: [{ ingredientId: 'milk', chance: 0.6 }, { ingredientId: 'coconut', chance: 0.3 }],
  rareDrops: [{ ingredientId: 'cream', chance: 0.15 }],
}

const bobaBunny: Monster = {
  id: 'boba_bunny', name: '珍珠兔', emoji: '🐰',
  hp: 14, zone: 'candy_cave', minPlayerLevel: 2, expReward: 8,
  drops: [{ ingredientId: 'boba', chance: 0.7 }],
}

const jellyFish: Monster = {
  id: 'jelly_fish', name: '果冻水母', emoji: '🪼',
  hp: 16, zone: 'candy_cave', minPlayerLevel: 3, expReward: 10,
  drops: [{ ingredientId: 'jelly', chance: 0.7 }],
}

const puddingBear: Monster = {
  id: 'pudding_bear', name: '布丁熊', emoji: '🧸',
  hp: 25, zone: 'candy_cave', minPlayerLevel: 3, expReward: 15,
  drops: [{ ingredientId: 'pudding', chance: 0.6 }],
  rareDrops: [{ ingredientId: 'mochi', chance: 0.1 }],
  isBoss: true,
}

const strawberrySprite: Monster = {
  id: 'strawberry_sprite', name: '草莓精灵', emoji: '🍓',
  hp: 12, zone: 'orchard', minPlayerLevel: 2, expReward: 7,
  drops: [{ ingredientId: 'strawberry', chance: 0.7 }],
}

const mangoMonkey: Monster = {
  id: 'mango_monkey', name: '芒果猴', emoji: '🐵',
  hp: 14, zone: 'orchard', minPlayerLevel: 3, expReward: 9,
  drops: [{ ingredientId: 'mango', chance: 0.7 }],
}

const fruitParrot: Monster = {
  id: 'fruit_parrot', name: '水果鹦鹉', emoji: '🦜',
  hp: 20, zone: 'orchard', minPlayerLevel: 4, expReward: 14,
  drops: [{ ingredientId: 'strawberry', chance: 0.4 }, { ingredientId: 'mango', chance: 0.4 }],
  rareDrops: [{ ingredientId: 'popping_boba', chance: 0.1 }],
}

const iceBeast: Monster = {
  id: 'ice_beast', name: '冰晶兽', emoji: '🧊',
  hp: 16, zone: 'ice_field', minPlayerLevel: 3, expReward: 10,
  drops: [{ ingredientId: 'ice', chance: 0.7 }],
}

const snowFox: Monster = {
  id: 'snow_fox', name: '雪狐', emoji: '🦊',
  hp: 20, zone: 'ice_field', minPlayerLevel: 4, expReward: 14,
  drops: [{ ingredientId: 'ice', chance: 0.5 }],
  rareDrops: [{ ingredientId: 'cream', chance: 0.15 }],
}

const frostDragon: Monster = {
  id: 'frost_dragon', name: '霜龙', emoji: '🐉',
  hp: 40, zone: 'ice_field', minPlayerLevel: 5, expReward: 25,
  drops: [{ ingredientId: 'ice', chance: 0.8 }],
  rareDrops: [{ ingredientId: 'grass_jelly', chance: 0.2 }, { ingredientId: 'cream', chance: 0.2 }],
  isBoss: true,
}

const taroMonster: Monster = {
  id: 'taro_monster', name: '芋泥怪', emoji: '👾',
  hp: 50, zone: 'abyss', minPlayerLevel: 5, expReward: 30,
  drops: [{ ingredientId: 'taro', chance: 0.5 }],
  rareDrops: [{ ingredientId: 'mochi', chance: 0.2 }, { ingredientId: 'popping_boba', chance: 0.15 }],
  isBoss: true,
}

const shadowSlime: Monster = {
  id: 'shadow_slime', name: '暗影史莱姆', emoji: '🌑',
  hp: 30, zone: 'abyss', minPlayerLevel: 4, expReward: 20,
  drops: [{ ingredientId: 'red_bean', chance: 0.5 }, { ingredientId: 'grass_jelly', chance: 0.3 }],
  rareDrops: [{ ingredientId: 'taro', chance: 0.15 }],
}

// === Zones ===

export const ZONES: Zone[] = [
  {
    id: 'tea_garden', name: 'Tea Garden', emoji: '🍵',
    bgGradient: ['#a8e063', '#56ab2f'],
    minLevel: 1, monstersRequired: 5,
    monsters: [teaSlimeGreen, teaSlimeBlack, leafFairy],
  },
  {
    id: 'ranch', name: 'Milk Ranch', emoji: '🥛',
    bgGradient: ['#ffecd2', '#fcb69f'],
    minLevel: 1, monstersRequired: 8,
    monsters: [milkCloud, coconutPalm, creamSheep],
  },
  {
    id: 'candy_cave', name: 'Candy Cave', emoji: '🍬',
    bgGradient: ['#a18cd1', '#fbc2eb'],
    minLevel: 2, monstersRequired: 12,
    monsters: [bobaBunny, jellyFish, puddingBear],
  },
  {
    id: 'orchard', name: 'Fruit Orchard', emoji: '🍓',
    bgGradient: ['#f093fb', '#f5576c'],
    minLevel: 3, monstersRequired: 15,
    monsters: [strawberrySprite, mangoMonkey, fruitParrot],
  },
  {
    id: 'ice_field', name: 'Ice Field', emoji: '🧊',
    bgGradient: ['#667eea', '#764ba2'],
    minLevel: 4, monstersRequired: 20,
    monsters: [iceBeast, snowFox, frostDragon],
  },
  {
    id: 'abyss', name: 'The Abyss', emoji: '🌑',
    bgGradient: ['#2d1b69', '#11001c'],
    minLevel: 5, monstersRequired: 999,
    monsters: [shadowSlime, taroMonster],
  },
]

export function getZoneById(id: MonsterZone): Zone | undefined {
  return ZONES.find(z => z.id === id)
}

/** Pick a random monster from a zone (weighted to avoid bosses early) */
export function pickMonsterFromZone(zone: Zone, monstersDefeated: number): Monster {
  const nonBoss = zone.monsters.filter(m => !m.isBoss)
  const pool = nonBoss.length > 0 ? nonBoss : zone.monsters
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Check if boss should appear (every 10 kills) */
export function shouldSpawnBoss(monstersDefeatedTotal: number): boolean {
  return monstersDefeatedTotal > 0 && monstersDefeatedTotal % 10 === 0
}

/** Get boss from zone */
export function getBossFromZone(zone: Zone): Monster | null {
  return zone.monsters.find(m => m.isBoss) ?? null
}

/** Get monster by ID from all zones */
export function getMonsterById(id: string): Monster | undefined {
  for (const zone of ZONES) {
    const found = zone.monsters.find(m => m.id === id)
    if (found) return found
  }
  return undefined
}

/** Combat simulation — tower attacks, monster HP, wave spawning */

import type { TowerDef } from '../data/towers'
import type { MonsterDef } from '../data/monsters'
import { TOWERS } from '../data/towers'
import { MONSTERS } from '../data/monsters'
import { calcDamage, calcMonsterHp, calcWaveGold, calcWaveMonsterCount, calcCost, CONSTANTS } from './constants'
import type { GameState, TowerState, MonsterInstance } from './game-state'

/** Spawn monsters for a wave. Returns new MonsterInstance array. */
export function spawnWave(waveNumber: number, pixelWaypoints: { x: number; y: number }[]): MonsterInstance[] {
  const count = calcWaveMonsterCount(waveNumber)
  const monsters: MonsterInstance[] = []
  const isBoss = waveNumber % 10 === 0 && waveNumber > 0

  for (let i = 0; i < count; i++) {
    const def = pickMonsterForWave(waveNumber, isBoss, i, count)
    const hp = calcMonsterHp(def.baseHp, waveNumber)
    monsters.push({
      id: `m-${waveNumber}-${i}`,
      defId: def.id,
      hp,
      maxHp: hp,
      speed: def.speed,
      armor: def.armor,
      special: def.special,
      color: def.color,
      size: def.size,
      goldReward: calcWaveGold(def.goldReward, waveNumber),
      pos: { ...pixelWaypoints[0] },
      waypointIdx: 1,
      alive: true,
      slowUntil: 0,
      poisonUntil: 0,
      poisonDps: 0,
      spawnDelay: i * 0.8,  // stagger spawn
      spawned: false,
    })
  }
  return monsters
}

function pickMonsterForWave(wave: number, isBoss: boolean, index: number, total: number): MonsterDef {
  if (isBoss && index === total - 1) {
    return MONSTERS.find(m => m.id === 'boss')!
  }
  // Pick strongest available monster
  const available = MONSTERS.filter(m => m.id !== 'boss' && m.spawnWave <= wave)
  if (available.length === 0) return MONSTERS[0]
  // Weight towards later monsters
  const weights = available.map((m, i) => i + 1)
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * totalWeight
  for (let i = 0; i < available.length; i++) {
    r -= weights[i]
    if (r <= 0) return available[i]
  }
  return available[available.length - 1]
}

/** Process one tick of combat. Mutates monsters in-place. Returns gold earned. */
export function processCombatTick(
  towers: TowerState[],
  monsters: MonsterInstance[],
  towerDefs: Map<string, TowerDef>,
  heroMult: number,
  prestigeMult: number,
  now: number,
  deltaSec: number,
): { goldEarned: number; kills: number; leaked: number } {
  let goldEarned = 0
  let kills = 0
  let leaked = 0

  // Tower attacks
  for (const tower of towers) {
    const def = towerDefs.get(tower.defId)
    if (!def) continue

    // Check attack cooldown
    const attackInterval = 1 / (def.attackSpeed * (1 + (tower.level - 1) * 0.05))
    if (now - tower.lastAttackTime < attackInterval) continue

    // Find targets in range
    const rangePixels = def.range * CONSTANTS.CELL_SIZE
    const inRange = monsters.filter(m =>
      m.alive && m.spawned && dist(tower.pos, m.pos) <= rangePixels
    )
    if (inRange.length === 0) continue

    tower.lastAttackTime = now
    const dmg = calcDamage(def.baseDamage * (1 + (tower.level - 1) * 0.15), 1, heroMult, prestigeMult)

    switch (def.attackType) {
      case 'single': {
        const target = closestMonster(tower.pos, inRange)
        if (target) applyDamage(target, dmg)
        break
      }
      case 'aoe': {
        const target = closestMonster(tower.pos, inRange)
        if (target) {
          const aoeRange = rangePixels * 0.6
          for (const m of inRange) {
            if (dist(target.pos, m.pos) <= aoeRange) applyDamage(m, dmg)
          }
        }
        break
      }
      case 'slow': {
        const target = closestMonster(tower.pos, inRange)
        if (target) {
          applyDamage(target, dmg)
          target.slowUntil = Math.max(target.slowUntil, now + 2000)
        }
        break
      }
      case 'pierce': {
        // Hit all monsters in a line from tower through closest
        const sorted = [...inRange].sort((a, b) => dist(tower.pos, a.pos) - dist(tower.pos, b.pos))
        for (let i = 0; i < Math.min(3, sorted.length); i++) {
          applyDamage(sorted[i], dmg * (1 - i * 0.2))
        }
        break
      }
      case 'dot': {
        const target = closestMonster(tower.pos, inRange)
        if (target) {
          target.poisonUntil = Math.max(target.poisonUntil, now + 4000)
          target.poisonDps = Math.max(target.poisonDps, dmg * 0.5)
        }
        break
      }
      case 'heal': {
        // Heal towers don't attack monsters — they boost nearby towers
        tower.buffedUntil = Math.max(tower.buffedUntil || 0, now + 3000)
        break
      }
    }
  }

  // Process DOT and death
  for (const m of monsters) {
    if (!m.alive) continue

    // Poison DOT
    if (m.poisonUntil > now && m.poisonDps > 0) {
      m.hp -= m.poisonDps * deltaSec
    }

    // Death check
    if (m.hp <= 0) {
      m.alive = false
      goldEarned += m.goldReward
      kills++
    }
  }

  // Check for leaked monsters (reached end of path)
  for (const m of monsters) {
    if (m.alive && m.reachedEnd) {
      m.alive = false
      leaked++
    }
  }

  return { goldEarned, kills, leaked }
}

function applyDamage(m: MonsterInstance, rawDmg: number): void {
  const dmg = rawDmg * (1 - m.armor)
  m.hp -= dmg
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function closestMonster(from: { x: number; y: number }, monsters: MonsterInstance[]): MonsterInstance | null {
  let best: MonsterInstance | null = null
  let bestDist = Infinity
  for (const m of monsters) {
    const d = dist(from, m.pos)
    if (d < bestDist) { bestDist = d; best = m }
  }
  return best
}

/** Get tower placement cost */
export function getTowerCost(def: TowerDef, level: number): number {
  return calcCost(def.baseCost, def.costMultiplier, level - 1)
}

/** Get tower upgrade cost */
export function getTowerUpgradeCost(def: TowerDef, level: number): number {
  return calcCost(def.baseCost, def.costMultiplier, level)
}

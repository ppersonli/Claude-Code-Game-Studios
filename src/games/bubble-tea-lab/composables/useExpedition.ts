/**
 * 萌宠探险 - 核心逻辑 v2
 * 战斗系统: 节奏暴击 + 闪避 + 蓄力大招
 */
import { reactive } from 'vue'
import { ZONES, pickMonsterFromZone, shouldSpawnBoss, getBossFromZone, getZoneById } from '../data/monsters'
import type { Monster, MonsterZone } from '../data/monsters'

const STORAGE_PREFIX = 'btlab_'

function loadJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(STORAGE_PREFIX + key); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
function saveJson(key: string, value: unknown): void {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
}

export interface DropItem {
  ingredientId: string
  count: number
}

export type HitType = 'normal' | 'crit' | 'charge' | 'miss'

export interface ExpeditionState {
  active: boolean
  zoneId: MonsterZone | null
  currentMonster: Monster | null
  monsterHp: number
  monsterMaxHp: number
  combo: number
  maxCombo: number
  timer: number
  timerId: ReturnType<typeof setInterval> | null
  drops: DropItem[]
  monstersDefeated: number
  totalDamageDealt: number
  lastTapTime: number
  isDailyFirst: boolean

  // Monster attack system
  monsterAttackTimer: number   // seconds until monster attacks
  monsterAttackWindow: boolean // is dodge window active?
  monsterAttackId: ReturnType<typeof setInterval> | null

  // Persistent
  stamina: number
  staminaMax: number
  unlockedZones: MonsterZone[]
  monsterBestiary: string[]
  zoneKillCount: Record<string, number>
  totalMonstersDefeated: number
  lastExpeditionDate: string
}

const EXPEDITION_DURATION = 30
const STAMINA_MAX = 5
const STAMINA_REGEN_MINUTES = 10

// Monster attack timing: attacks every 4-7 seconds
const MONSTER_ATTACK_INTERVAL_MIN = 4
const MONSTER_ATTACK_INTERVAL_MAX = 7
const DODGE_WINDOW_SECONDS = 1.5  // how long the dodge window lasts

export function createExpeditionState(): ExpeditionState {
  const today = new Date().toISOString().slice(0, 10)
  return {
    active: false,
    zoneId: null,
    currentMonster: null,
    monsterHp: 0,
    monsterMaxHp: 0,
    combo: 0,
    maxCombo: 0,
    timer: EXPEDITION_DURATION,
    timerId: null,
    drops: [],
    monstersDefeated: 0,
    totalDamageDealt: 0,
    lastTapTime: 0,
    isDailyFirst: loadJson('last_expedition_date', '') !== today,

    monsterAttackTimer: randomAttackInterval(),
    monsterAttackWindow: false,
    monsterAttackId: null,

    stamina: loadJson('expedition_stamina', STAMINA_MAX),
    staminaMax: STAMINA_MAX,
    unlockedZones: loadJson('expedition_zones', ['tea_garden', 'ranch'] as MonsterZone[]),
    monsterBestiary: loadJson('expedition_bestiary', [] as string[]),
    zoneKillCount: loadJson('expedition_zone_kills', {} as Record<string, number>),
    totalMonstersDefeated: loadJson('expedition_total_kills', 0),
    lastExpeditionDate: loadJson('last_expedition_date', ''),
  }
}

function randomAttackInterval(): number {
  return MONSTER_ATTACK_INTERVAL_MIN + Math.random() * (MONSTER_ATTACK_INTERVAL_MAX - MONSTER_ATTACK_INTERVAL_MIN)
}

export function persistExpeditionState(exp: ExpeditionState): void {
  saveJson('expedition_stamina', exp.stamina)
  saveJson('expedition_zones', exp.unlockedZones)
  saveJson('expedition_bestiary', exp.monsterBestiary)
  saveJson('expedition_zone_kills', exp.zoneKillCount)
  saveJson('expedition_total_kills', exp.totalMonstersDefeated)
  saveJson('last_expedition_date', exp.lastExpeditionDate)
}

// === Expedition lifecycle ===

export function startExpedition(exp: ExpeditionState, zoneId: MonsterZone): boolean {
  if (exp.stamina <= 0) return false
  const zone = getZoneById(zoneId)
  if (!zone) return false
  if (!exp.unlockedZones.includes(zoneId)) return false

  exp.stamina--
  exp.active = true
  exp.zoneId = zoneId
  exp.combo = 0
  exp.maxCombo = 0
  exp.timer = EXPEDITION_DURATION
  exp.drops = []
  exp.monstersDefeated = 0
  exp.totalDamageDealt = 0
  exp.monsterAttackTimer = randomAttackInterval()
  exp.monsterAttackWindow = false

  const today = new Date().toISOString().slice(0, 10)
  exp.isDailyFirst = exp.lastExpeditionDate !== today
  exp.lastExpeditionDate = today

  spawnNextMonster(exp)

  // Main countdown
  exp.timerId = setInterval(() => {
    exp.timer--
    if (exp.timer <= 0) endExpedition(exp)
  }, 1000)

  // Monster attack countdown
  startMonsterAttackTimer(exp)

  return true
}

function startMonsterAttackTimer(exp: ExpeditionState): void {
  clearMonsterAttackTimer(exp)
  exp.monsterAttackTimer = randomAttackInterval()
  exp.monsterAttackWindow = false

  exp.monsterAttackId = setInterval(() => {
    if (!exp.active) { clearMonsterAttackTimer(exp); return }
    exp.monsterAttackTimer -= 0.1
    if (exp.monsterAttackTimer <= 0 && !exp.monsterAttackWindow) {
      // Open dodge window
      exp.monsterAttackWindow = true
      // Auto-resolve after dodge window
      setTimeout(() => {
        if (exp.monsterAttackWindow && exp.active) {
          // Player failed to dodge — combo reset
          exp.combo = 0
          exp.monsterAttackWindow = false
          exp.monsterAttackTimer = randomAttackInterval()
        }
      }, DODGE_WINDOW_SECONDS * 1000)
    }
  }, 100)
}

function clearMonsterAttackTimer(exp: ExpeditionState): void {
  if (exp.monsterAttackId) {
    clearInterval(exp.monsterAttackId)
    exp.monsterAttackId = null
  }
}

function spawnNextMonster(exp: ExpeditionState): void {
  if (!exp.zoneId) return
  const zone = getZoneById(exp.zoneId)
  if (!zone) return

  if (shouldSpawnBoss(exp.totalMonstersDefeated + exp.monstersDefeated)) {
    const boss = getBossFromZone(zone)
    if (boss) {
      exp.currentMonster = boss
      exp.monsterHp = boss.hp
      exp.monsterMaxHp = boss.hp
      return
    }
  }

  const monster = pickMonsterFromZone(zone, exp.monstersDefeated)
  exp.currentMonster = monster
  exp.monsterHp = monster.hp
  exp.monsterMaxHp = monster.hp
}

// === Combat ===

/** Normal tap attack — returns hit type based on timing ring phase (passed from UI) */
export function tapMonster(
  exp: ExpeditionState,
  isCrit: boolean = false,
): { damage: number; defeated: boolean; drops: DropItem[]; hitType: HitType } {
  if (!exp.currentMonster || !exp.active) return { damage: 0, defeated: false, drops: [], hitType: 'miss' }

  const now = Date.now()
  const timeSinceLastTap = now - exp.lastTapTime

  // Combo
  if (timeSinceLastTap < 500 && exp.lastTapTime > 0) {
    exp.combo++
  } else {
    exp.combo = 1
  }
  exp.maxCombo = Math.max(exp.maxCombo, exp.combo)
  exp.lastTapTime = now

  // Base damage with combo bonus
  let damage = 1
  if (exp.combo >= 20) damage = 4
  else if (exp.combo >= 10) damage = 3
  else if (exp.combo >= 5) damage = 2

  let hitType: HitType = 'normal'

  // Crit bonus
  if (isCrit) {
    damage *= 3
    hitType = 'crit'
  }

  exp.monsterHp = Math.max(0, exp.monsterHp - damage)
  exp.totalDamageDealt += damage

  if (exp.monsterHp <= 0) {
    const drops = defeatMonster(exp)
    return { damage, defeated: true, drops, hitType }
  }

  return { damage, defeated: false, drops: [], hitType }
}

/** Charge attack — damage scales with charge time (0.5-2.5s) */
export function chargeAttack(
  exp: ExpeditionState,
  chargeSeconds: number,
): { damage: number; defeated: boolean; drops: DropItem[]; hitType: HitType } {
  if (!exp.currentMonster || !exp.active) return { damage: 0, defeated: false, drops: [], hitType: 'miss' }

  exp.combo++
  exp.maxCombo = Math.max(exp.maxCombo, exp.combo)
  exp.lastTapTime = Date.now()

  // Charge damage: 5-20 based on charge duration
  const clampedCharge = Math.min(chargeSeconds, 2.5)
  const damage = Math.round(5 + (clampedCharge / 2.5) * 15)

  exp.monsterHp = Math.max(0, exp.monsterHp - damage)
  exp.totalDamageDealt += damage

  if (exp.monsterHp <= 0) {
    const drops = defeatMonster(exp)
    return { damage, defeated: true, drops, hitType: 'charge' }
  }

  return { damage, defeated: false, drops: [], hitType: 'charge' }
}

/** Dodge a monster attack — returns true if successful */
export function dodgeAttack(exp: ExpeditionState): boolean {
  if (!exp.monsterAttackWindow) return false
  exp.monsterAttackWindow = false
  exp.monsterAttackTimer = randomAttackInterval()
  // Successful dodge gives bonus combo
  exp.combo += 2
  exp.maxCombo = Math.max(exp.maxCombo, exp.combo)
  return true
}

function defeatMonster(exp: ExpeditionState): DropItem[] {
  if (!exp.currentMonster) return []

  const monster = exp.currentMonster
  exp.monstersDefeated++
  exp.totalMonstersDefeated++

  if (!exp.monsterBestiary.includes(monster.id)) {
    exp.monsterBestiary.push(monster.id)
  }

  if (exp.zoneId) {
    exp.zoneKillCount[exp.zoneId] = (exp.zoneKillCount[exp.zoneId] ?? 0) + 1
  }

  const drops: DropItem[] = []
  const dailyMultiplier = exp.isDailyFirst ? 2 : 1

  for (const drop of monster.drops) {
    if (Math.random() < drop.chance) {
      addDrop(drops, drop.ingredientId, 1 * dailyMultiplier)
    }
  }

  if (monster.rareDrops) {
    const comboBoost = Math.min(exp.combo * 0.02, 0.3)
    for (const drop of monster.rareDrops) {
      if (Math.random() < drop.chance + comboBoost) {
        addDrop(drops, drop.ingredientId, 1 * dailyMultiplier)
      }
    }
  }

  if (exp.maxCombo >= 30) {
    addDrop(drops, monster.drops[0]?.ingredientId ?? 'green_tea', 1)
  }

  for (const d of drops) {
    addDrop(exp.drops, d.ingredientId, d.count)
  }

  checkZoneUnlocks(exp)
  spawnNextMonster(exp)
  // Reset monster attack timer for new monster
  exp.monsterAttackTimer = randomAttackInterval()
  exp.monsterAttackWindow = false

  return drops
}

function addDrop(drops: DropItem[], ingredientId: string, count: number): void {
  const existing = drops.find(d => d.ingredientId === ingredientId)
  if (existing) {
    existing.count += count
  } else {
    drops.push({ ingredientId, count })
  }
}

function checkZoneUnlocks(exp: ExpeditionState): void {
  for (const zone of ZONES) {
    if (exp.unlockedZones.includes(zone.id)) continue
    const prevZoneIdx = ZONES.findIndex(z => z.id === zone.id) - 1
    if (prevZoneIdx < 0) continue
    const prevZone = ZONES[prevZoneIdx]
    const prevKills = exp.zoneKillCount[prevZone.id] ?? 0
    if (prevKills >= prevZone.monstersRequired) {
      exp.unlockedZones.push(zone.id)
    }
  }
}

// === End expedition ===

export function endExpedition(exp: ExpeditionState): DropItem[] {
  if (exp.timerId) {
    clearInterval(exp.timerId)
    exp.timerId = null
  }
  clearMonsterAttackTimer(exp)
  exp.active = false
  exp.currentMonster = null
  exp.monsterAttackWindow = false
  persistExpeditionState(exp)
  return [...exp.drops]
}

// === Stamina helpers ===

export function addStamina(exp: ExpeditionState, amount: number): void {
  exp.stamina = Math.min(exp.staminaMax, exp.stamina + amount)
  persistExpeditionState(exp)
}

export function getStaminaRegenTime(exp: ExpeditionState): number {
  if (exp.stamina >= exp.staminaMax) return 0
  const missing = exp.staminaMax - exp.stamina
  return missing * STAMINA_REGEN_MINUTES * 60
}

export { ZONES }
export type { Monster, MonsterZone }

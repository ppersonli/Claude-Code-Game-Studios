/**
 * Tower targeting — find enemies in range, fire projectiles.
 */
import type { Tower, Enemy, Projectile } from './types'
import type { TowerType } from './constants'
import { TOWER_STATS } from './constants'
import { distance } from './pathfinding'

/**
 * Find the nearest enemy within a tower's range.
 */
export function findTarget(tower: Tower, enemies: Enemy[], range: number): Enemy | null {
  let nearest: Enemy | null = null
  let nearestDist = Infinity

  for (const enemy of enemies) {
    if (!enemy.alive) continue
    const dist = distance(tower.x, tower.y, enemy.x, enemy.y)
    if (dist <= range && dist < nearestDist) {
      nearest = enemy
      nearestDist = dist
    }
  }
  return nearest
}

/**
 * Calculate projectile velocity toward a target.
 */
export function aimAt(fromX: number, fromY: number, toX: number, toY: number, speed: number): { vx: number; vy: number } {
  const dx = toX - fromX
  const dy = toY - fromY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return { vx: 0, vy: -speed }
  return { vx: (dx / dist) * speed, vy: (dy / dist) * speed }
}

/**
 * Check if a tower can fire (cooldown elapsed).
 */
export function canFire(tower: Tower, now: number, fireRate: number): boolean {
  return now - tower.lastFireTime >= fireRate
}

/**
 * Create a projectile from a tower targeting an enemy.
 */
export function createProjectile(
  tower: Tower,
  target: Enemy,
  nextId: number,
): { projectile: Projectile; id: number } {
  const stats = TOWER_STATS[tower.type as TowerType]
  const levelIdx = Math.min(tower.level - 1, 2)
  const vel = aimAt(tower.x, tower.y, target.x, target.y, stats.projectileSpeed)

  const projectile: Projectile = {
    id: nextId,
    x: tower.x,
    y: tower.y - 20, // spawn above tower
    vx: vel.vx,
    vy: vel.vy,
    damage: stats.damage[levelIdx],
    targetId: target.id,
    towerType: tower.type as TowerType,
    splashRadius: ('splashRadius' in stats) ? (stats as any).splashRadius[levelIdx] : 0,
    chainCount: ('chainCount' in stats) ? (stats as any).chainCount[levelIdx] : 1,
    slowAmount: ('slowAmount' in stats) ? (stats as any).slowAmount[levelIdx] : 0,
    slowDuration: ('slowDuration' in stats) ? (stats as any).slowDuration[levelIdx] : 0,
    color: stats.projectileColor,
    speed: stats.projectileSpeed,
  }

  return { projectile, id: nextId + 1 }
}

/**
 * Check if a projectile has reached its target area.
 */
export function projectileHitTarget(proj: Projectile, target: Enemy): boolean {
  const dist = distance(proj.x, proj.y, target.x, target.y)
  return dist < target.radius + 5
}

/**
 * Check if a projectile is off-screen.
 */
export function isProjectileOutOfBounds(proj: Projectile, gameW: number, gameH: number): boolean {
  return proj.x < -50 || proj.x > gameW + 50 || proj.y < -50 || proj.y > gameH + 50
}

/**
 * Apply damage to an enemy. Returns true if enemy dies.
 */
export function applyDamage(enemy: Enemy, damage: number): boolean {
  enemy.hp -= damage
  if (enemy.hp <= 0) {
    enemy.alive = false
    return true
  }
  return false
}

/**
 * Apply slow effect to an enemy.
 */
export function applySlow(enemy: Enemy, slowAmount: number, slowDuration: number, now: number): void {
  enemy.speed = enemy.baseSpeed * (1 - slowAmount)
  enemy.slowUntil = now + slowDuration
}

/**
 * Update enemy slow state — restore speed when slow expires.
 */
export function updateEnemySlow(enemy: Enemy, now: number): void {
  if (enemy.slowUntil > 0 && now >= enemy.slowUntil) {
    enemy.speed = enemy.baseSpeed
    enemy.slowUntil = 0
  }
}

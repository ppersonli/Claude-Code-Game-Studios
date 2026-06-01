import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateWave, getWaveEnemyCount, flattenWave, getEnemyStats } from '../../src/games/boba-tower-defense/logic/wave'
import {
  findTarget, aimAt, canFire, createProjectile, projectileHitTarget,
  isProjectileOutOfBounds, applyDamage, applySlow, updateEnemySlow,
} from '../../src/games/boba-tower-defense/logic/tower'
import { WAVES_PER_LEVEL, BOSS_WAVE_INTERVAL, ENEMY_STATS } from '../../src/games/boba-tower-defense/logic/constants'
import type { Tower, Enemy } from '../../src/games/boba-tower-defense/logic/types'
import { loadSave } from '../../src/games/boba-tower-defense/logic/save'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ═══════════════════════════════════════════════════════
// WAVE SPAWNING
// ═══════════════════════════════════════════════════════

describe('generateWave', () => {
  it('test_wave1_has_enemies', () => {
    const wave = generateWave(1, 1)
    expect(wave.enemies.length).toBeGreaterThan(0)
  })

  it('test_boss_wave_every_5th', () => {
    const w5 = generateWave(5, 1)
    expect(w5.isBoss).toBe(true)
    const w10 = generateWave(10, 1)
    expect(w10.isBoss).toBe(true)
  })

  it('test_non_boss_wave', () => {
    const w = generateWave(1, 1)
    expect(w.isBoss).toBe(false)
  })

  it('test_boss_has_ginger_boss', () => {
    const w = generateWave(5, 1)
    expect(w.enemies.some(e => e.type === 'ginger_boss')).toBe(true)
  })

  it('test_wave_count_increases', () => {
    const w1 = generateWave(1, 1)
    const w9 = generateWave(9, 1)
    expect(getWaveEnemyCount(w9)).toBeGreaterThan(getWaveEnemyCount(w1))
  })

  it('test_difficulty_tier_scales', () => {
    const w1 = generateWave(1, 1)
    const w5 = generateWave(1, 5)
    expect(w5.level).toBeGreaterThanOrEqual(w1.level)
  })

  it('test_higher_waves_have_more_types', () => {
    const w1 = generateWave(1, 1)
    const w9 = generateWave(9, 1)
    expect(w9.enemies.length).toBeGreaterThanOrEqual(w1.enemies.length)
  })
})

describe('getWaveEnemyCount', () => {
  it('test_counts_all_enemies', () => {
    const wave = { enemies: [{ type: 'lemon_scout' as const, count: 5 }, { type: 'lime_tank' as const, count: 3 }], level: 0, isBoss: false }
    expect(getWaveEnemyCount(wave)).toBe(8)
  })

  it('test_empty_wave', () => {
    expect(getWaveEnemyCount({ enemies: [], level: 0, isBoss: false })).toBe(0)
  })
})

describe('flattenWave', () => {
  it('test_interleaves_types', () => {
    const wave = { enemies: [{ type: 'lemon_scout' as const, count: 3 }, { type: 'lime_tank' as const, count: 2 }], level: 0, isBoss: false }
    const result = flattenWave(wave)
    expect(result).toHaveLength(5)
    // Should alternate between types
    expect(result[0]).toBe('lemon_scout')
    expect(result[1]).toBe('lime_tank')
    expect(result[2]).toBe('lemon_scout')
  })

  it('test_single_type', () => {
    const wave = { enemies: [{ type: 'lemon_scout' as const, count: 3 }], level: 0, isBoss: false }
    const result = flattenWave(wave)
    expect(result).toEqual(['lemon_scout', 'lemon_scout', 'lemon_scout'])
  })
})

describe('getEnemyStats', () => {
  it('test_lemon_scout_tier0', () => {
    const stats = getEnemyStats('lemon_scout', 0)
    expect(stats.name).toBe('檸檬偵察兵')
    expect(stats.hp).toBe(30)
    expect(stats.speed).toBe(2.5)
  })

  it('test_higher_tier_more_hp', () => {
    const s0 = getEnemyStats('lemon_scout', 0)
    const s4 = getEnemyStats('lemon_scout', 4)
    expect(s4.hp).toBeGreaterThan(s0.hp)
  })

  it('test_boss_is_high_hp', () => {
    const stats = getEnemyStats('ginger_boss', 0)
    expect(stats.hp).toBe(500)
    expect(stats.isBoss).toBe(true)
  })

  it('test_flyer_is_flying', () => {
    const stats = getEnemyStats('vinegar_flyer', 0)
    expect(stats.flying).toBe(true)
  })

  it('test_clamps_tier', () => {
    const stats = getEnemyStats('lemon_scout', 99)
    // Should use last tier (index 4)
    expect(stats.hp).toBe(ENEMY_STATS.lemon_scout.hp[4])
  })
})

// ═══════════════════════════════════════════════════════
// TOWER TARGETING
// ═══════════════════════════════════════════════════════

function makeTower(overrides: Partial<Tower> = {}): Tower {
  return {
    id: 1, type: 'classic', level: 1, row: 5, col: 5,
    x: 200, y: 200, lastFireTime: 0, target: null, ...overrides,
  }
}

function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 1, type: 'lemon_scout', level: 0, hp: 30, maxHp: 30,
    speed: 2.5, baseSpeed: 2.5, x: 250, y: 200, pathIndex: 0,
    reward: 5, alive: true, flying: false, isBoss: false,
    slowUntil: 0, chainHit: false, radius: 12, ...overrides,
  }
}

describe('findTarget', () => {
  it('test_finds_nearest_in_range', () => {
    const tower = makeTower({ x: 200, y: 200 })
    const enemies = [
      makeEnemy({ id: 1, x: 250, y: 200 }),
      makeEnemy({ id: 2, x: 300, y: 200 }),
    ]
    const target = findTarget(tower, enemies, 120)
    expect(target).not.toBeNull()
    expect(target!.id).toBe(1)
  })

  it('test_ignores_out_of_range', () => {
    const tower = makeTower({ x: 200, y: 200 })
    const enemies = [makeEnemy({ id: 1, x: 500, y: 500 })]
    expect(findTarget(tower, enemies, 120)).toBeNull()
  })

  it('test_ignores_dead_enemies', () => {
    const tower = makeTower({ x: 200, y: 200 })
    const enemies = [makeEnemy({ id: 1, x: 250, y: 200, alive: false })]
    expect(findTarget(tower, enemies, 120)).toBeNull()
  })

  it('test_returns_null_when_no_enemies', () => {
    expect(findTarget(makeTower(), [], 120)).toBeNull()
  })
})

describe('aimAt', () => {
  it('test_aims_at_target', () => {
    const vel = aimAt(0, 0, 100, 0, 10)
    expect(vel.vx).toBeCloseTo(10)
    expect(vel.vy).toBeCloseTo(0)
  })

  it('test_diagonal_aim', () => {
    const vel = aimAt(0, 0, 3, 4, 5)
    expect(vel.vx).toBeCloseTo(3)
    expect(vel.vy).toBeCloseTo(4)
  })

  it('test_same_position_returns_upward', () => {
    const vel = aimAt(100, 100, 100, 100, 10)
    expect(vel.vy).toBe(-10)
  })
})

describe('canFire', () => {
  it('test_can_fire_when_cooldown_elapsed', () => {
    const tower = makeTower({ lastFireTime: 1000 })
    expect(canFire(tower, 2000, 500)).toBe(true)
  })

  it('test_cannot_fire_during_cooldown', () => {
    const tower = makeTower({ lastFireTime: 1000 })
    expect(canFire(tower, 1200, 500)).toBe(false)
  })
})

describe('createProjectile', () => {
  it('test_creates_projectile_toward_target', () => {
    const tower = makeTower({ x: 200, y: 400, type: 'classic', level: 1 })
    const target = makeEnemy({ x: 250, y: 400 })
    const { projectile } = createProjectile(tower, target, 1)
    expect(projectile.vx).toBeGreaterThan(0)
    expect(projectile.damage).toBe(10)
    expect(projectile.color).toBe(0x3E2723)
  })
})

describe('projectileHitTarget', () => {
  it('test_hits_when_close', () => {
    const proj = { x: 200, y: 200 } as any
    const enemy = makeEnemy({ x: 205, y: 200 })
    expect(projectileHitTarget(proj, enemy)).toBe(true)
  })

  it('test_misses_when_far', () => {
    const proj = { x: 200, y: 200 } as any
    const enemy = makeEnemy({ x: 500, y: 500 })
    expect(projectileHitTarget(proj, enemy)).toBe(false)
  })
})

describe('isProjectileOutOfBounds', () => {
  it('test_in_bounds', () => {
    expect(isProjectileOutOfBounds({ x: 200, y: 200 } as any, 480, 854)).toBe(false)
  })
  it('test_out_left', () => {
    expect(isProjectileOutOfBounds({ x: -100, y: 200 } as any, 480, 854)).toBe(true)
  })
  it('test_out_bottom', () => {
    expect(isProjectileOutOfBounds({ x: 200, y: 1000 } as any, 480, 854)).toBe(true)
  })
})

describe('applyDamage', () => {
  it('test_reduces_hp', () => {
    const enemy = makeEnemy({ hp: 30 })
    applyDamage(enemy, 10)
    expect(enemy.hp).toBe(20)
    expect(enemy.alive).toBe(true)
  })

  it('test_kills_at_zero', () => {
    const enemy = makeEnemy({ hp: 10 })
    const killed = applyDamage(enemy, 10)
    expect(killed).toBe(true)
    expect(enemy.alive).toBe(false)
  })

  it('test_overkill', () => {
    const enemy = makeEnemy({ hp: 5 })
    const killed = applyDamage(enemy, 100)
    expect(killed).toBe(true)
    expect(enemy.hp).toBeLessThan(0)
  })
})

describe('applySlow / updateEnemySlow', () => {
  it('test_slows_enemy', () => {
    const enemy = makeEnemy({ speed: 3, baseSpeed: 3 })
    applySlow(enemy, 0.5, 2000, 1000)
    expect(enemy.speed).toBe(1.5)
    expect(enemy.slowUntil).toBe(3000)
  })

  it('test_slow_expires', () => {
    const enemy = makeEnemy({ speed: 1.5, baseSpeed: 3, slowUntil: 3000 })
    updateEnemySlow(enemy, 3001)
    expect(enemy.speed).toBe(3)
    expect(enemy.slowUntil).toBe(0)
  })

  it('test_slow_does_not_expire_early', () => {
    const enemy = makeEnemy({ speed: 1.5, baseSpeed: 3, slowUntil: 3000 })
    updateEnemySlow(enemy, 2000)
    expect(enemy.speed).toBe(1.5)
  })
})

// ═══════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════

describe('save', () => {
  beforeEach(() => { localStorage.clear() })

  it('test_loadSave_returns_defaults', () => {
    const save = loadSave()
    expect(save.highScore).toBe(0)
    expect(save.coins).toBe(0)
    expect(save.levelsCompleted).toEqual([])
    expect(save.unlockedTowers).toEqual(['classic'])
  })
})

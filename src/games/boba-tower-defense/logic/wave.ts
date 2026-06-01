/**
 * Wave spawning — generates wave configs with increasing difficulty.
 */
import { ENEMY_STATS, WAVES_PER_LEVEL, BOSS_WAVE_INTERVAL, type EnemyType } from './constants'
import type { WaveConfig } from './types'

/**
 * Generate a wave config for a given wave number (1-indexed) and level.
 * Boss waves occur every BOSS_WAVE_INTERVAL waves.
 * Difficulty increases enemy HP/speed tier based on level.
 */
export function generateWave(waveNumber: number, level: number): WaveConfig {
  const isBoss = waveNumber % BOSS_WAVE_INTERVAL === 0
  const difficultyTier = Math.min(4, level - 1) // 0-4

  if (isBoss) {
    return {
      enemies: [
        { type: 'ginger_boss', count: 1 },
        { type: 'lemon_scout', count: 2 + level },
      ],
      level: difficultyTier,
      isBoss: true,
    }
  }

  // Scale enemy count with wave number
  const baseCount = 3 + Math.floor(waveNumber * 0.5)
  const enemies: { type: EnemyType; count: number }[] = []

  // Wave composition varies by wave number
  if (waveNumber <= 3) {
    enemies.push({ type: 'lemon_scout', count: baseCount })
  } else if (waveNumber <= 6) {
    enemies.push({ type: 'lemon_scout', count: Math.ceil(baseCount * 0.6) })
    enemies.push({ type: 'lime_tank', count: Math.floor(baseCount * 0.4) })
  } else if (waveNumber <= 8) {
    enemies.push({ type: 'lemon_scout', count: Math.ceil(baseCount * 0.4) })
    enemies.push({ type: 'lime_tank', count: Math.ceil(baseCount * 0.3) })
    enemies.push({ type: 'vinegar_flyer', count: Math.floor(baseCount * 0.3) })
  } else {
    enemies.push({ type: 'lemon_scout', count: Math.ceil(baseCount * 0.3) })
    enemies.push({ type: 'lime_tank', count: Math.ceil(baseCount * 0.2) })
    enemies.push({ type: 'vinegar_flyer', count: Math.ceil(baseCount * 0.2) })
    enemies.push({ type: 'citrus_swarm', count: Math.max(1, Math.floor(baseCount * 0.3)) })
  }

  return { enemies, level: difficultyTier, isBoss: false }
}

/**
 * Get total enemy count for a wave.
 */
export function getWaveEnemyCount(wave: WaveConfig): number {
  return wave.enemies.reduce((sum, e) => sum + e.count, 0)
}

/**
 * Flatten a wave config into an ordered list of enemy types to spawn.
 * Enemies are interleaved for variety.
 */
export function flattenWave(wave: WaveConfig): EnemyType[] {
  const result: EnemyType[] = []
  const queues = wave.enemies.map(e => ({ type: e.type, remaining: e.count }))

  while (queues.some(q => q.remaining > 0)) {
    for (const q of queues) {
      if (q.remaining > 0) {
        result.push(q.type)
        q.remaining--
      }
    }
  }
  return result
}

/**
 * Get enemy stats scaled to a difficulty tier.
 */
export function getEnemyStats(type: EnemyType, tier: number) {
  const stats = ENEMY_STATS[type]
  const idx = Math.min(tier, stats.hp.length - 1)
  return {
    name: stats.name,
    emoji: stats.emoji,
    hp: stats.hp[idx],
    speed: stats.speed[idx],
    reward: stats.reward[idx],
    color: stats.color,
    radius: stats.radius,
    flying: 'flying' in stats ? (stats as any).flying : false,
    isBoss: 'isBoss' in stats ? (stats as any).isBoss : false,
  }
}

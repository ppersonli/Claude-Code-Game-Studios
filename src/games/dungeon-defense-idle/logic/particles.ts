/**
 * Particle system for visual effects.
 * Kill bursts, upgrade sparkles, prestige celebrations.
 */

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  lifetime: number
  maxLifetime: number
  color: number
  size: number
}

/**
 * Create burst particles when a monster is killed.
 */
export function createKillParticles(cx: number, cy: number, color: number): Particle[] {
  const count = 8 + Math.floor(Math.random() * 5)
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 40 + Math.random() * 80
    const life = 0.3 + Math.random() * 0.4
    particles.push({
      x: cx + (Math.random() - 0.5) * 10,
      y: cy + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lifetime: life,
      maxLifetime: life,
      color,
      size: 2 + Math.random() * 3,
    })
  }
  return particles
}

/**
 * Create upward sparkles for tower upgrade.
 */
export function createUpgradeParticles(cx: number, cy: number): Particle[] {
  const count = 10 + Math.floor(Math.random() * 6)
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const life = 0.4 + Math.random() * 0.5
    particles.push({
      x: cx + (Math.random() - 0.5) * 16,
      y: cy,
      vx: (Math.random() - 0.5) * 40,
      vy: -60 - Math.random() * 80,
      lifetime: life,
      maxLifetime: life,
      color: 0xFFD700,
      size: 2 + Math.random() * 2,
    })
  }
  return particles
}

/**
 * Create a big radial celebration for prestige reset.
 */
export function createPrestigeParticles(cx: number, cy: number): Particle[] {
  const count = 25 + Math.floor(Math.random() * 15)
  const particles: Particle[] = []
  const colors = [0x00e5ff, 0x00bcd4, 0x4dd0e1, 0x80deea, 0xb2ebf2]
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 80 + Math.random() * 150
    const life = 0.6 + Math.random() * 0.8
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lifetime: life,
      maxLifetime: life,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 4,
    })
  }
  return particles
}

/**
 * Tick all particles: move, age, remove dead ones.
 * Mutates the array in-place and returns the filtered result.
 */
export function tickParticles(particles: Particle[], deltaSec: number): Particle[] {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.lifetime -= deltaSec
    if (p.lifetime <= 0) {
      particles.splice(i, 1)
      continue
    }
    p.x += p.vx * deltaSec
    p.y += p.vy * deltaSec
    // Shrink as particle ages
    const ageRatio = p.lifetime / p.maxLifetime
    p.size = p.size * (0.5 + 0.5 * ageRatio)
  }
  return particles
}

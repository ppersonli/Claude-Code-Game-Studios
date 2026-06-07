import { describe, it, expect } from 'vitest'
import {
  createKillParticles,
  createUpgradeParticles,
  createPrestigeParticles,
  tickParticles,
  type Particle,
} from '../../src/games/dungeon-defense-idle/logic/particles'

describe('Particles', () => {
  describe('createKillParticles', () => {
    it('returns an array of particles', () => {
      const particles = createKillParticles(100, 200, 0xff0000)
      expect(Array.isArray(particles)).toBe(true)
      expect(particles.length).toBeGreaterThan(0)
    })

    it('places particles near the kill position', () => {
      const cx = 150, cy = 250
      const particles = createKillParticles(cx, cy, 0x00ff00)
      for (const p of particles) {
        expect(Math.abs(p.x - cx)).toBeLessThan(30)
        expect(Math.abs(p.y - cy)).toBeLessThan(30)
      }
    })

    it('particles have positive lifetime', () => {
      const particles = createKillParticles(0, 0, 0xff0000)
      for (const p of particles) {
        expect(p.lifetime).toBeGreaterThan(0)
        expect(p.maxLifetime).toBeGreaterThan(0)
      }
    })

    it('particles have velocity (non-zero vx or vy)', () => {
      const particles = createKillParticles(0, 0, 0xff0000)
      const hasMotion = particles.some(p => p.vx !== 0 || p.vy !== 0)
      expect(hasMotion).toBe(true)
    })

    it('particles use the provided color', () => {
      const color = 0x123456
      const particles = createKillParticles(0, 0, color)
      for (const p of particles) {
        expect(p.color).toBe(color)
      }
    })
  })

  describe('createUpgradeParticles', () => {
    it('returns particles for upgrade effect', () => {
      const particles = createUpgradeParticles(100, 200)
      expect(particles.length).toBeGreaterThan(0)
    })

    it('particles are golden/yellow colored', () => {
      const particles = createUpgradeParticles(0, 0)
      for (const p of particles) {
        expect(p.color).toBe(0xFFD700)
      }
    })

    it('particles move upward (negative vy)', () => {
      const particles = createUpgradeParticles(0, 0)
      const allUp = particles.every(p => p.vy < 0)
      expect(allUp).toBe(true)
    })
  })

  describe('createPrestigeParticles', () => {
    it('returns many particles for prestige celebration', () => {
      const particles = createPrestigeParticles(200, 300)
      expect(particles.length).toBeGreaterThanOrEqual(20)
    })

    it('particles spread in all directions', () => {
      const particles = createPrestigeParticles(0, 0)
      const hasUp = particles.some(p => p.vy < -50)
      const hasDown = particles.some(p => p.vy > 50)
      const hasLeft = particles.some(p => p.vx < -50)
      const hasRight = particles.some(p => p.vx > 50)
      expect(hasUp).toBe(true)
      expect(hasDown).toBe(true)
      expect(hasLeft).toBe(true)
      expect(hasRight).toBe(true)
    })

    it('particles have varied colors (blue/cyan palette)', () => {
      const particles = createPrestigeParticles(0, 0)
      const colors = new Set(particles.map(p => p.color))
      expect(colors.size).toBeGreaterThanOrEqual(2)
    })
  })

  describe('tickParticles', () => {
    it('decreases lifetime by delta', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 100, vy: 0, lifetime: 1.0, maxLifetime: 1.0, color: 0xff0000, size: 3 },
      ]
      tickParticles(particles, 0.5)
      expect(particles[0].lifetime).toBeCloseTo(0.5)
    })

    it('moves particles by velocity', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 100, vy: 50, lifetime: 1.0, maxLifetime: 1.0, color: 0xff0000, size: 3 },
      ]
      tickParticles(particles, 0.1)
      expect(particles[0].x).toBeCloseTo(10)
      expect(particles[0].y).toBeCloseTo(5)
    })

    it('removes dead particles (lifetime <= 0)', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 0, lifetime: 0.1, maxLifetime: 1.0, color: 0xff0000, size: 3 },
        { x: 5, y: 5, vx: 0, vy: 0, lifetime: 2.0, maxLifetime: 2.0, color: 0x00ff00, size: 3 },
      ]
      tickParticles(particles, 0.2)
      expect(particles.length).toBe(1)
      expect(particles[0].x).toBe(5)
    })

    it('reduces size as particle ages', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 0, lifetime: 1.0, maxLifetime: 1.0, color: 0xff0000, size: 6 },
      ]
      tickParticles(particles, 0.5)
      expect(particles[0].size).toBeLessThan(6)
      expect(particles[0].size).toBeGreaterThan(0)
    })

    it('returns the updated list (mutation)', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 0, lifetime: 0.05, maxLifetime: 1.0, color: 0xff0000, size: 3 },
      ]
      const result = tickParticles(particles, 0.1)
      expect(result.length).toBe(0)
    })
  })
})

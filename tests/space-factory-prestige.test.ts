import { describe, it, expect } from 'vitest';
import {
  calcStardustGain,
  canUnlockPlanet,
  calcUpgradeCost,
  calcWorkerSpeed,
  calcFactoryMultiplier,
  PLANET_COSTS,
} from '../src/games/space-factory-idle/logic/prestige';

describe('prestige system', () => {
  describe('calcStardustGain', () => {
    it('returns 0 below 1M coins', () => {
      expect(calcStardustGain(999_999)).toBe(0);
      expect(calcStardustGain(0)).toBe(0);
    });

    it('returns 1 at exactly 1M coins', () => {
      expect(calcStardustGain(1_000_000)).toBe(1);
    });

    it('returns floor(sqrt(coins / 1M))', () => {
      expect(calcStardustGain(4_000_000)).toBe(2);
      expect(calcStardustGain(9_000_000)).toBe(3);
      expect(calcStardustGain(100_000_000)).toBe(10);
    });

    it('floors fractional results', () => {
      // sqrt(2) ≈ 1.414 → floors to 1
      expect(calcStardustGain(2_000_000)).toBe(1);
    });
  });

  describe('canUnlockPlanet', () => {
    it('earth (index 0) is always unlocked', () => {
      expect(canUnlockPlanet(0, 0)).toBe(true);
    });

    it('moon requires 100 stardust', () => {
      expect(canUnlockPlanet(99, 1)).toBe(false);
      expect(canUnlockPlanet(100, 1)).toBe(true);
    });

    it('mars requires 1000 stardust', () => {
      expect(canUnlockPlanet(999, 2)).toBe(false);
      expect(canUnlockPlanet(1000, 2)).toBe(true);
    });

    it('rejects invalid planet index', () => {
      expect(canUnlockPlanet(100000, -1)).toBe(false);
      expect(canUnlockPlanet(100000, 99)).toBe(false);
    });
  });

  describe('calcUpgradeCost', () => {
    it('level 0 = base cost', () => {
      expect(calcUpgradeCost(100, 0)).toBe(100);
    });

    it('increases by ~12% per level', () => {
      expect(calcUpgradeCost(100, 1)).toBe(112);
      expect(calcUpgradeCost(100, 5)).toBe(176); // 100 × 1.12^5 ≈ 176
    });

    it('floors result', () => {
      expect(calcUpgradeCost(10, 3)).toBe(Math.floor(10 * Math.pow(1.12, 3)));
    });
  });

  describe('calcWorkerSpeed', () => {
    it('level 0 = base speed', () => {
      expect(calcWorkerSpeed(10, 0)).toBe(10);
    });

    it('adds 10% per level', () => {
      expect(calcWorkerSpeed(10, 1)).toBeCloseTo(11);
      expect(calcWorkerSpeed(10, 5)).toBeCloseTo(15);
    });
  });

  describe('calcFactoryMultiplier', () => {
    it('level 1 = 1x', () => {
      expect(calcFactoryMultiplier(1)).toBe(1);
    });

    it('level 2 = 1.5x', () => {
      expect(calcFactoryMultiplier(2)).toBe(1.5);
    });

    it('level 3+ adds 0.5 per level', () => {
      expect(calcFactoryMultiplier(3)).toBe(2.0);
      expect(calcFactoryMultiplier(4)).toBe(2.5);
    });
  });

  describe('PLANET_COSTS', () => {
    it('has 5 planets', () => {
      expect(PLANET_COSTS).toHaveLength(5);
    });

    it('costs increase exponentially', () => {
      for (let i = 1; i < PLANET_COSTS.length; i++) {
        expect(PLANET_COSTS[i]).toBeGreaterThan(PLANET_COSTS[i - 1]);
      }
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  calcBaseIncome,
  calcInflationMultiplier,
  calcPrestigeBonus,
  calcFinalIncome,
} from '../src/games/space-factory-idle/logic/income';

describe('income calculation', () => {
  describe('calcBaseIncome', () => {
    it('returns productValue × workerSpeed × factoryLevel', () => {
      expect(calcBaseIncome(10, 2, 3)).toBe(60);
    });

    it('returns 0 when any factor is 0', () => {
      expect(calcBaseIncome(10, 0, 3)).toBe(0);
      expect(calcBaseIncome(0, 2, 3)).toBe(0);
      expect(calcBaseIncome(10, 2, 0)).toBe(0);
    });

    it('handles fractional values', () => {
      expect(calcBaseIncome(1.5, 2, 3)).toBeCloseTo(9);
    });
  });

  describe('calcInflationMultiplier', () => {
    it('returns 1 at 0 minutes', () => {
      expect(calcInflationMultiplier(0)).toBe(1);
    });

    it('decays to ~0.75 at 30 minutes', () => {
      expect(calcInflationMultiplier(30)).toBeCloseTo(0.7692, 3);
    });

    it('decays to ~0.5 at 100 minutes', () => {
      expect(calcInflationMultiplier(100)).toBeCloseTo(0.5, 3);
    });

    it('never reaches 0', () => {
      expect(calcInflationMultiplier(10000)).toBeGreaterThan(0);
    });
  });

  describe('calcPrestigeBonus', () => {
    it('returns 1 with 0 stardust', () => {
      expect(calcPrestigeBonus(0)).toBe(1);
    });

    it('adds 10% per 100 stardust', () => {
      expect(calcPrestigeBonus(100)).toBeCloseTo(1.1, 5);
      expect(calcPrestigeBonus(500)).toBeCloseTo(1.5, 5);
    });
  });

  describe('calcFinalIncome', () => {
    it('combines base, inflation, and prestige', () => {
      // base = 10 × 2 × 3 = 60
      // inflation(30) = 1/1.3 ≈ 0.7692
      // prestige(100) = 1.1
      // final = 60 × 0.7692 × 1.1 ≈ 50.77
      const result = calcFinalIncome(10, 2, 3, 30, 100);
      expect(result).toBeCloseTo(50.7692, 2);
    });

    it('returns 0 when base income is 0', () => {
      expect(calcFinalIncome(0, 2, 3, 0, 0)).toBe(0);
    });
  });
});

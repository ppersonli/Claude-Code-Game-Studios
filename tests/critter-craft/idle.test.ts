import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IdleSystem } from '../../src/games/critter-craft/src/systems/IdleSystem';

describe('IdleSystem', () => {
  let idleSystem: IdleSystem;

  beforeEach(() => {
    vi.useFakeTimers();
    idleSystem = new IdleSystem();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Last Online Tracking', () => {
    it('should record last online time on updateLastOnline', () => {
      const before = Date.now();
      idleSystem.updateLastOnline();
      const after = Date.now();

      const lastOnline = idleSystem.getLastOnlineTime();
      expect(lastOnline).toBeGreaterThanOrEqual(before);
      expect(lastOnline).toBeLessThanOrEqual(after);
    });

    it('should return 0 when no last online time recorded', () => {
      expect(idleSystem.getLastOnlineTime()).toBe(0);
    });
  });

  describe('Offline Time Calculation', () => {
    it('should calculate minutes offline correctly', () => {
      const now = Date.now();
      idleSystem.setLastOnlineTime(now - 5 * 60 * 1000); // 5 minutes ago

      const minutes = idleSystem.calculateMinutesOffline();
      expect(minutes).toBeCloseTo(5, 0);
    });

    it('should return 0 when last online is in the future', () => {
      const future = Date.now() + 100000;
      idleSystem.setLastOnlineTime(future);

      const minutes = idleSystem.calculateMinutesOffline();
      expect(minutes).toBe(0);
    });

    it('should return 0 when no last online time is set', () => {
      const minutes = idleSystem.calculateMinutesOffline();
      expect(minutes).toBe(0);
    });
  });

  describe('Offline Earnings Calculation', () => {
    it('should calculate offline earnings based on production and time', () => {
      // Set last online 10 minutes ago
      idleSystem.setLastOnlineTime(Date.now() - 10 * 60 * 1000);

      // Production: 2 materials/minute, offline percentage: 50%
      const earnings = idleSystem.calculateOfflineEarnings(2, 0.5);

      // 10 minutes * 2 per minute * 0.5 = 10
      expect(earnings).toBeCloseTo(10, 1);
    });

    it('should apply ad multiplier to offline earnings', () => {
      idleSystem.setLastOnlineTime(Date.now() - 10 * 60 * 1000);

      const baseEarnings = idleSystem.calculateOfflineEarnings(2, 0.5);
      const multipliedEarnings = idleSystem.calculateOfflineEarningsWithMultiplier(2, 0.5, 3);

      // Base: 10, With 3x multiplier: 30
      expect(baseEarnings).toBeCloseTo(10, 1);
      expect(multipliedEarnings).toBeCloseTo(30, 1);
    });
  });

  describe('Multiple Animals Production', () => {
    it('should calculate total offline earnings for multiple animals', () => {
      idleSystem.setLastOnlineTime(Date.now() - 10 * 60 * 1000);

      const animals = [
        { productionRate: 1, material: 'yarn' },
        { productionRate: 1, material: 'wood' },
      ];

      const earnings = idleSystem.calculateMultiAnimalOfflineEarnings(animals, 0.5);

      // Cat: 10 * 1 * 0.5 = 5
      // Dog: 10 * 1 * 0.5 = 5
      // Total: 10
      expect(earnings).toBeCloseTo(10, 1);
    });
  });

  describe('Max Offline Cap', () => {
    it('should cap offline time at 24 hours', () => {
      // Set last online 48 hours ago
      idleSystem.setLastOnlineTime(Date.now() - 48 * 60 * 60 * 1000);

      const earnings = idleSystem.calculateOfflineEarnings(2, 0.5);

      // Capped at 24 hours = 1440 minutes
      // 1440 * 2 * 0.5 = 1440
      expect(earnings).toBeCloseTo(1440, 0);
    });
  });
});

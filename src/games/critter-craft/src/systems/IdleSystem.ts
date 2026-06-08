export interface AnimalProduction {
  productionRate: number;
  material: string;
}

export class IdleSystem {
  private lastOnlineTime: number = 0;
  private readonly maxOfflineMinutes = 24 * 60; // 24 hours

  /**
   * Record current time as last online
   */
  updateLastOnline(): void {
    this.lastOnlineTime = Date.now();
  }

  /**
   * Set last online time manually (for testing/loading)
   */
  setLastOnlineTime(timestamp: number): void {
    this.lastOnlineTime = timestamp;
  }

  /**
   * Get last online timestamp
   */
  getLastOnlineTime(): number {
    return this.lastOnlineTime;
  }

  /**
   * Calculate minutes since last online, capped at maxOfflineMinutes
   */
  calculateMinutesOffline(): number {
    if (this.lastOnlineTime === 0) return 0;

    const now = Date.now();
    const diffMs = now - this.lastOnlineTime;

    if (diffMs <= 0) return 0;

    const minutes = diffMs / (60 * 1000);
    return Math.min(minutes, this.maxOfflineMinutes);
  }

  /**
   * Calculate offline earnings for a single production rate
   * @param productionPerMinute - materials produced per minute
   * @param offlinePercentage - fraction of production earned offline (0-1)
   */
  calculateOfflineEarnings(productionPerMinute: number, offlinePercentage: number): number {
    const minutes = this.calculateMinutesOffline();
    return minutes * productionPerMinute * offlinePercentage;
  }

  /**
   * Calculate offline earnings with ad multiplier
   */
  calculateOfflineEarningsWithMultiplier(
    productionPerMinute: number,
    offlinePercentage: number,
    multiplier: number
  ): number {
    return this.calculateOfflineEarnings(productionPerMinute, offlinePercentage) * multiplier;
  }

  /**
   * Calculate total offline earnings for multiple animals
   */
  calculateMultiAnimalOfflineEarnings(
    animals: AnimalProduction[],
    offlinePercentage: number
  ): number {
    const minutes = this.calculateMinutesOffline();
    let total = 0;
    for (const animal of animals) {
      total += minutes * animal.productionRate * offlinePercentage;
    }
    return total;
  }
}

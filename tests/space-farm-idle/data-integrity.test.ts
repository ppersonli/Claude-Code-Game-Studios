import { describe, it, expect } from 'vitest'
import { CROPS, getCropsForPlanet, getCropById } from '../../src/games/space-farm-idle/data/crops'
import { PLANETS } from '../../src/games/space-farm-idle/data/planets'
import { UPGRADES, getUpgradeCost } from '../../src/games/space-farm-idle/data/upgrades'
import { WEATHERS, rollWeather } from '../../src/games/space-farm-idle/data/weather'
import { CONSTANTS } from '../../src/games/space-farm-idle/data/constants'

describe('data integrity', () => {
  describe('planets', () => {
    it('should have 5 planets', () => {
      expect(PLANETS).toHaveLength(5)
    })

    it('should have earth as first planet with 0 unlock cost', () => {
      const earth = PLANETS.find(p => p.id === 'earth')!
      expect(earth).toBeDefined()
      expect(earth.unlockCosmicSeeds).toBe(0)
    })

    it('should have increasing unlock costs', () => {
      for (let i = 1; i < PLANETS.length; i++) {
        expect(PLANETS[i].unlockCosmicSeeds).toBeGreaterThan(PLANETS[i - 1].unlockCosmicSeeds)
      }
    })

    it('should have unique ids', () => {
      const ids = PLANETS.map(p => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('should have icon paths using BASE_URL', () => {
      for (const planet of PLANETS) {
        expect(planet.icon).toContain('space-farm-idle')
      }
    })
  })

  describe('crops', () => {
    it('should have 3 crops per planet', () => {
      for (const planet of PLANETS) {
        const crops = getCropsForPlanet(planet.id)
        expect(crops).toHaveLength(3)
      }
    })

    it('should have total 15 crops', () => {
      expect(CROPS).toHaveLength(15)
    })

    it('should have unique crop ids', () => {
      const ids = CROPS.map(c => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('should have increasing base values per planet', () => {
      for (const planet of PLANETS) {
        const crops = getCropsForPlanet(planet.id)
        for (let i = 1; i < crops.length; i++) {
          expect(crops[i].baseValue).toBeGreaterThanOrEqual(crops[i - 1].baseValue)
        }
      }
    })

    it('should have increasing grow times across planets', () => {
      const earthCrops = getCropsForPlanet('earth')
      const moonCrops = getCropsForPlanet('moon')
      const marsCrops = getCropsForPlanet('mars')
      expect(moonCrops[0].growTimeSeconds).toBeGreaterThan(earthCrops[0].growTimeSeconds)
      expect(marsCrops[0].growTimeSeconds).toBeGreaterThan(moonCrops[0].growTimeSeconds)
    })

    it('should find crop by id', () => {
      const wheat = getCropById('wheat')
      expect(wheat).toBeDefined()
      expect(wheat!.name).toBe('Wheat')
      expect(wheat!.planetId).toBe('earth')
    })

    it('should return undefined for unknown id', () => {
      expect(getCropById('nonexistent')).toBeUndefined()
    })
  })

  describe('upgrades', () => {
    it('should have 6 upgrades', () => {
      expect(UPGRADES).toHaveLength(6)
    })

    it('should have unique ids', () => {
      const ids = UPGRADES.map(u => u.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('should have positive base costs', () => {
      for (const upgrade of UPGRADES) {
        expect(upgrade.baseCost).toBeGreaterThan(0)
      }
    })

    it('should have positive max levels', () => {
      for (const upgrade of UPGRADES) {
        expect(upgrade.maxLevel).toBeGreaterThan(0)
      }
    })
  })

  describe('getUpgradeCost', () => {
    it('should return base cost at level 0', () => {
      expect(getUpgradeCost(100, 0)).toBe(100)
    })

    it('should increase with level', () => {
      expect(getUpgradeCost(100, 1)).toBeGreaterThan(100)
      expect(getUpgradeCost(100, 5)).toBeGreaterThan(getUpgradeCost(100, 1))
    })

    it('should use 1.12 multiplier formula', () => {
      const base = 100
      const level = 3
      const expected = Math.floor(base * Math.pow(1.12, level))
      expect(getUpgradeCost(base, level)).toBe(expected)
    })
  })

  describe('weather', () => {
    it('should have 5 weather types', () => {
      expect(WEATHERS).toHaveLength(5)
    })

    it('should have probabilities summing to 1.0', () => {
      const totalProb = WEATHERS.reduce((sum, w) => sum + w.probability, 0)
      expect(totalProb).toBeCloseTo(1.0)
    })

    it('should have clear as most common (60%)', () => {
      const clear = WEATHERS.find(w => w.type === 'clear')!
      expect(clear.probability).toBe(0.60)
    })
  })

  describe('rollWeather', () => {
    it('should return a valid weather type', () => {
      const weather = rollWeather()
      expect(WEATHERS).toContainEqual(weather)
    })
  })

  describe('constants', () => {
    it('should have valid cost multiplier', () => {
      expect(CONSTANTS.COST_MULTIPLIER).toBe(1.12)
    })

    it('should have 30s auto-save interval', () => {
      expect(CONSTANTS.AUTO_SAVE_INTERVAL).toBe(30_000)
    })

    it('should have 50% offline efficiency', () => {
      expect(CONSTANTS.OFFLINE_EFFICIENCY).toBe(0.5)
    })

    it('should have 1M prestige divisor', () => {
      expect(CONSTANTS.PRESTIGE_DIVISOR).toBe(1_000_000)
    })

    it('should have 1.5x perfect harvest bonus', () => {
      expect(CONSTANTS.PERFECT_HARVEST_BONUS).toBe(1.5)
    })
  })
})

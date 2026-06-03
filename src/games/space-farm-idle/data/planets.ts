/** Planet definitions */

export interface Planet {
  id: string
  name: string
  unlockCosmicSeeds: number    // Cosmic Seeds needed to unlock
  color: string
  icon: string
}

export const PLANETS: Planet[] = [
  {
    id: 'earth',
    name: 'Earth',
    unlockCosmicSeeds: 0,
    color: '#4CAF50',
    icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/earth.webp`,
  },
  {
    id: 'moon',
    name: 'Moon',
    unlockCosmicSeeds: 100,
    color: '#9E9E9E',
    icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/moon.webp`,
  },
  {
    id: 'mars',
    name: 'Mars',
    unlockCosmicSeeds: 1000,
    color: '#FF5722',
    icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/mars.webp`,
  },
  {
    id: 'europa',
    name: 'Europa',
    unlockCosmicSeeds: 10000,
    color: '#03A9F4',
    icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/europa.webp`,
  },
  {
    id: 'titan',
    name: 'Titan',
    unlockCosmicSeeds: 100000,
    color: '#FF9800',
    icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/titan.webp`,
  },
]

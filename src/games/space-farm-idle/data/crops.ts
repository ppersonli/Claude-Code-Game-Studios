/** Crop definitions per planet */

export interface Crop {
  id: string
  planetId: string
  name: string
  baseValue: number
  growTimeSeconds: number
  icon: string
}

export const CROPS: Crop[] = [
  // Earth crops
  { id: 'wheat', planetId: 'earth', name: 'Wheat', baseValue: 10, growTimeSeconds: 30, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/wheat.webp` },
  { id: 'corn', planetId: 'earth', name: 'Corn', baseValue: 20, growTimeSeconds: 30, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/corn.webp` },
  { id: 'tomato', planetId: 'earth', name: 'Tomato', baseValue: 30, growTimeSeconds: 30, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/tomato.webp` },

  // Moon crops
  { id: 'helium-grass', planetId: 'moon', name: 'Helium Grass', baseValue: 50, growTimeSeconds: 60, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/helium-grass.webp` },
  { id: 'moonlight-flower', planetId: 'moon', name: 'Moonlight Flower', baseValue: 100, growTimeSeconds: 60, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/moonlight-flower.webp` },
  { id: 'meteor-bean', planetId: 'moon', name: 'Meteor Bean', baseValue: 150, growTimeSeconds: 60, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/moonlight-flower.webp` },

  // Mars crops
  { id: 'flame-vine', planetId: 'mars', name: 'Flame Vine', baseValue: 200, growTimeSeconds: 120, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/lava-berry.webp` },
  { id: 'lava-berry', planetId: 'mars', name: 'Lava Berry', baseValue: 400, growTimeSeconds: 120, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/lava-berry.webp` },
  { id: 'sand-crystal', planetId: 'mars', name: 'Sand Crystal', baseValue: 600, growTimeSeconds: 120, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/lava-berry.webp` },

  // Europa crops
  { id: 'ice-algae', planetId: 'europa', name: 'Ice Algae', baseValue: 800, growTimeSeconds: 240, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/helium-grass.webp` },
  { id: 'deep-mushroom', planetId: 'europa', name: 'Deep Mushroom', baseValue: 1600, growTimeSeconds: 240, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/helium-grass.webp` },
  { id: 'aurora-moss', planetId: 'europa', name: 'Aurora Moss', baseValue: 2400, growTimeSeconds: 240, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/moonlight-flower.webp` },

  // Titan crops
  { id: 'organic-fern', planetId: 'titan', name: 'Organic Fern', baseValue: 3000, growTimeSeconds: 480, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/lava-berry.webp` },
  { id: 'nitrogen-orchid', planetId: 'titan', name: 'Nitrogen Orchid', baseValue: 6000, growTimeSeconds: 480, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/moonlight-flower.webp` },
  { id: 'methane-vine', planetId: 'titan', name: 'Methane Vine', baseValue: 9000, growTimeSeconds: 480, icon: `${import.meta.env.BASE_URL}assets/space-farm-idle/lava-berry.webp` },
]

export function getCropsForPlanet(planetId: string): Crop[] {
  return CROPS.filter(c => c.planetId === planetId)
}

export function getCropById(id: string): Crop | undefined {
  return CROPS.find(c => c.id === id)
}

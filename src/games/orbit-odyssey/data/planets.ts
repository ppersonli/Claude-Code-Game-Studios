/** Planet and star system definitions */

export interface PlanetDef {
  id: string
  name: string
  x: number
  y: number
  radius: number
  mass: number
  color: number
  glowColor: number
  resourceType: 'stardust' | 'crystal' | 'plasma' | 'void'
  resourceValue: number
}

export interface StarSystemDef {
  id: string
  name: string
  unlockCost: number
  bgColor: number
  planets: PlanetDef[]
}

export const STAR_SYSTEMS: StarSystemDef[] = [
  {
    id: 'sol',
    name: 'Sol System',
    unlockCost: 0,
    bgColor: 0x0a0a2e,
    planets: [
      { id: 'mercury', name: 'Mercury', x: 200, y: 300, radius: 20, mass: 800, color: 0xb5b5b5, glowColor: 0x808080, resourceType: 'stardust', resourceValue: 1 },
      { id: 'venus', name: 'Venus', x: 400, y: 200, radius: 28, mass: 1200, color: 0xe8c56d, glowColor: 0xd4a03c, resourceType: 'stardust', resourceValue: 2 },
      { id: 'earth', name: 'Earth', x: 600, y: 350, radius: 30, mass: 1500, color: 0x4a90d9, glowColor: 0x2d6db5, resourceType: 'stardust', resourceValue: 3 },
      { id: 'mars', name: 'Mars', x: 350, y: 450, radius: 22, mass: 900, color: 0xc1440e, glowColor: 0x8b3008, resourceType: 'crystal', resourceValue: 2 },
      { id: 'jupiter', name: 'Jupiter', x: 650, y: 150, radius: 50, mass: 3000, color: 0xd4a76a, glowColor: 0xb8864e, resourceType: 'stardust', resourceValue: 5 },
    ],
  },
  {
    id: 'nebula',
    name: 'Nebula Expanse',
    unlockCost: 2000,
    bgColor: 0x1a0a2e,
    planets: [
      { id: 'crystal_world', name: 'Crystal World', x: 300, y: 250, radius: 35, mass: 2000, color: 0x9370db, glowColor: 0x7b5fc7, resourceType: 'crystal', resourceValue: 5 },
      { id: 'plasma_giant', name: 'Plasma Giant', x: 550, y: 180, radius: 45, mass: 2800, color: 0xff6b35, glowColor: 0xe55a28, resourceType: 'plasma', resourceValue: 3 },
      { id: 'ice_dwarf', name: 'Ice Dwarf', x: 150, y: 400, radius: 18, mass: 600, color: 0x00bfff, glowColor: 0x0099cc, resourceType: 'stardust', resourceValue: 4 },
      { id: 'toxic_cloud', name: 'Toxic Cloud', x: 450, y: 380, radius: 40, mass: 1800, color: 0x32cd32, glowColor: 0x228b22, resourceType: 'plasma', resourceValue: 4 },
      { id: 'magnetar', name: 'Magnetar', x: 680, y: 300, radius: 25, mass: 4000, color: 0xff2d95, glowColor: 0xcc2477, resourceType: 'crystal', resourceValue: 8 },
    ],
  },
  {
    id: 'void',
    name: 'Void Frontier',
    unlockCost: 10000,
    bgColor: 0x050515,
    planets: [
      { id: 'black_hole', name: 'Black Hole', x: 400, y: 300, radius: 60, mass: 8000, color: 0x1a1a1a, glowColor: 0x4a0080, resourceType: 'void', resourceValue: 10 },
      { id: 'neutron_star', name: 'Neutron Star', x: 200, y: 150, radius: 15, mass: 5000, color: 0xffffff, glowColor: 0x00d4ff, resourceType: 'void', resourceValue: 8 },
      { id: 'pulsar', name: 'Pulsar', x: 600, y: 200, radius: 20, mass: 3500, color: 0x00ff88, glowColor: 0x00cc6a, resourceType: 'plasma', resourceValue: 12 },
      { id: 'dark_matter', name: 'Dark Matter', x: 300, y: 450, radius: 35, mass: 6000, color: 0x2a0a3e, glowColor: 0x1a0a2e, resourceType: 'void', resourceValue: 15 },
      { id: 'quasar', name: 'Quasar', x: 550, y: 420, radius: 30, mass: 4500, color: 0xffd700, glowColor: 0xffaa00, resourceType: 'void', resourceValue: 20 },
    ],
  },
]

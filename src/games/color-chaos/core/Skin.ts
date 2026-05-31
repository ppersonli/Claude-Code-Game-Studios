export type SkinRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type SkinCategory = 'classic' | 'neon' | 'nature' | 'cosmic' | 'luxury'

export interface SkinVisuals {
  glassColor: number
  glassAlpha: number
  borderColor: number
  borderAlpha: number
  borderWidth: number
  rimColor: number
  highlightColor: number
  highlightAlpha: number
  glow?: { color: number; alpha: number; radius: number }
}

export interface Skin {
  id: string
  name: string
  description: string
  cost: number
  rarity: SkinRarity
  category: SkinCategory
  visuals: SkinVisuals
}

export const GAME_SKINS: Skin[] = [
  {
    id: 'classic',
    name: 'Classic Glass',
    description: 'The original crystal clear tube.',
    cost: 0,
    rarity: 'common',
    category: 'classic',
    visuals: {
      glassColor: 0xffffff,
      glassAlpha: 0.15,
      borderColor: 0xffffff,
      borderAlpha: 0.5,
      borderWidth: 3,
      rimColor: 0xffffff,
      highlightColor: 0xffffff,
      highlightAlpha: 0.08,
    },
  },
  {
    id: 'ocean-deep',
    name: 'Ocean Deep',
    description: 'Deep blue waters, calming and mysterious.',
    cost: 10,
    rarity: 'common',
    category: 'classic',
    visuals: {
      glassColor: 0x1a3a6a,
      glassAlpha: 0.35,
      borderColor: 0x44ddff,
      borderAlpha: 0.6,
      borderWidth: 3,
      rimColor: 0x44ddff,
      highlightColor: 0x88eeff,
      highlightAlpha: 0.12,
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'A touch of nature, framed in gold.',
    cost: 10,
    rarity: 'common',
    category: 'nature',
    visuals: {
      glassColor: 0x1a5a2a,
      glassAlpha: 0.3,
      borderColor: 0xddaa33,
      borderAlpha: 0.7,
      borderWidth: 3,
      rimColor: 0xddaa33,
      highlightColor: 0x88ff88,
      highlightAlpha: 0.1,
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange hues of a fading sun.',
    cost: 25,
    rarity: 'rare',
    category: 'nature',
    visuals: {
      glassColor: 0x6a3a1a,
      glassAlpha: 0.3,
      borderColor: 0xff8844,
      borderAlpha: 0.6,
      borderWidth: 3,
      rimColor: 0xffaa44,
      highlightColor: 0xffcc88,
      highlightAlpha: 0.12,
    },
  },
  {
    id: 'neon-pink',
    name: 'Neon Pink',
    description: 'Electric vibes with a neon glow.',
    cost: 25,
    rarity: 'rare',
    category: 'neon',
    visuals: {
      glassColor: 0xff44aa,
      glassAlpha: 0.15,
      borderColor: 0xff88cc,
      borderAlpha: 0.8,
      borderWidth: 3,
      rimColor: 0xff88cc,
      highlightColor: 0xffaadd,
      highlightAlpha: 0.15,
      glow: { color: 0xff44aa, alpha: 0.15, radius: 40 },
    },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Ice cold, crystal clear perfection.',
    cost: 30,
    rarity: 'rare',
    category: 'classic',
    visuals: {
      glassColor: 0xcceeFF,
      glassAlpha: 0.2,
      borderColor: 0xeeffff,
      borderAlpha: 0.7,
      borderWidth: 3,
      rimColor: 0xeeffff,
      highlightColor: 0xffffff,
      highlightAlpha: 0.15,
    },
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    description: 'Deep purple cosmos with starlight glow.',
    cost: 60,
    rarity: 'epic',
    category: 'cosmic',
    visuals: {
      glassColor: 0x2a1a4a,
      glassAlpha: 0.4,
      borderColor: 0xaa44ff,
      borderAlpha: 0.6,
      borderWidth: 3,
      rimColor: 0xcc66ff,
      highlightColor: 0xbb88ff,
      highlightAlpha: 0.12,
      glow: { color: 0x6622cc, alpha: 0.2, radius: 50 },
    },
  },
  {
    id: 'lava',
    name: 'Lava',
    description: 'Fiery red-orange with a pulsing heat.',
    cost: 60,
    rarity: 'epic',
    category: 'nature',
    visuals: {
      glassColor: 0x6a1a0a,
      glassAlpha: 0.35,
      borderColor: 0xff4422,
      borderAlpha: 0.7,
      borderWidth: 3,
      rimColor: 0xff6633,
      highlightColor: 0xff8844,
      highlightAlpha: 0.12,
      glow: { color: 0xff4400, alpha: 0.18, radius: 35 },
    },
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    description: 'Fit for royalty, gilded in pure gold.',
    cost: 100,
    rarity: 'epic',
    category: 'luxury',
    visuals: {
      glassColor: 0x4a3a0a,
      glassAlpha: 0.35,
      borderColor: 0xffdd44,
      borderAlpha: 0.8,
      borderWidth: 4,
      rimColor: 0xffdd44,
      highlightColor: 0xffee88,
      highlightAlpha: 0.15,
    },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'The northern lights, captured in glass.',
    cost: 200,
    rarity: 'legendary',
    category: 'cosmic',
    visuals: {
      glassColor: 0x1a4a3a,
      glassAlpha: 0.3,
      borderColor: 0x44ffcc,
      borderAlpha: 0.7,
      borderWidth: 3,
      rimColor: 0x44ffcc,
      highlightColor: 0x88ffd8,
      highlightAlpha: 0.15,
      glow: { color: 0x22ddaa, alpha: 0.2, radius: 45 },
    },
  },
]

export function getSkinById(id: string): Skin {
  const skin = GAME_SKINS.find(s => s.id === id)
  if (!skin) {
    throw new Error(`Skin with id "${id}" not found`)
  }
  return skin
}

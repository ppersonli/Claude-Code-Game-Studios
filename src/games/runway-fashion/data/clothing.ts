import type { Clothing } from './types'

export const CLOTHING: Clothing[] = [
  // Tops
  { id: 'top_tshirt', name: 'Basic Tee', category: 'top', style: ['casual', 'cute'], color: '#FF6B9D', rarity: 'common', unlockLevel: 1, price: 0, image: 'top_tshirt.webp' },
  { id: 'top_blouse', name: 'Elegant Blouse', category: 'top', style: ['elegant', 'casual'], color: '#FFFFFF', rarity: 'common', unlockLevel: 1, price: 0, image: 'top_blouse.webp' },
  { id: 'top_evening', name: 'Evening Top', category: 'top', style: ['glamorous', 'elegant'], color: '#8B0000', rarity: 'rare', unlockLevel: 3, price: 500, image: 'top_evening.webp' },
  { id: 'top_crop', name: 'Crop Top', category: 'top', style: ['edgy', 'casual'], color: '#000000', rarity: 'common', unlockLevel: 2, price: 200, image: 'top_crop.webp' },

  // Bottoms
  { id: 'bottom_skirt', name: 'Pleated Skirt', category: 'bottom', style: ['cute', 'casual'], color: '#FFB6C1', rarity: 'common', unlockLevel: 1, price: 0, image: 'bottom_skirt.webp' },
  { id: 'bottom_jeans', name: 'Jeans', category: 'bottom', style: ['casual', 'edgy'], color: '#4169E1', rarity: 'common', unlockLevel: 1, price: 0, image: 'bottom_jeans.webp' },
  { id: 'bottom_evening', name: 'Evening Gown', category: 'bottom', style: ['glamorous', 'elegant'], color: '#FFD700', rarity: 'rare', unlockLevel: 3, price: 600, image: 'bottom_evening.webp' },

  // Shoes
  { id: 'shoes_sneakers', name: 'Sneakers', category: 'shoes', style: ['casual', 'cute'], color: '#FFFFFF', rarity: 'common', unlockLevel: 1, price: 0, image: 'shoes_sneakers.webp' },
  { id: 'shoes_heels', name: 'High Heels', category: 'shoes', style: ['elegant', 'glamorous'], color: '#FF0000', rarity: 'rare', unlockLevel: 2, price: 300, image: 'shoes_heels.webp' },
  { id: 'shoes_boots', name: 'Boots', category: 'shoes', style: ['edgy', 'casual'], color: '#8B4513', rarity: 'common', unlockLevel: 2, price: 250, image: 'shoes_boots.webp' },

  // Accessories
  { id: 'acc_necklace', name: 'Necklace', category: 'accessory', style: ['elegant', 'glamorous'], color: '#FFD700', rarity: 'rare', unlockLevel: 2, price: 400, image: 'acc_necklace.webp' },
  { id: 'acc_bag', name: 'Handbag', category: 'accessory', style: ['casual', 'cute'], color: '#FF6B9D', rarity: 'common', unlockLevel: 1, price: 0, image: 'acc_bag.webp' },
  { id: 'acc_sunglasses', name: 'Sunglasses', category: 'accessory', style: ['edgy', 'glamorous'], color: '#000000', rarity: 'rare', unlockLevel: 3, price: 350, image: 'acc_sunglasses.webp' },

  // Hair
  { id: 'hair_long', name: 'Long Straight', category: 'hair', style: ['elegant', 'cute'], color: '#8B4513', rarity: 'common', unlockLevel: 1, price: 0, image: 'hair_long.webp' },
  { id: 'hair_short', name: 'Short Hair', category: 'hair', style: ['casual', 'edgy'], color: '#000000', rarity: 'common', unlockLevel: 1, price: 0, image: 'hair_short.webp' },
  { id: 'hair_updo', name: 'Updo', category: 'hair', style: ['elegant', 'glamorous'], color: '#DAA520', rarity: 'rare', unlockLevel: 3, price: 500, image: 'hair_updo.webp' },
]

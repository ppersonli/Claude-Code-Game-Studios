/**
 * Boba Drop ingredient definitions.
 * Each ingredient has a visual level, size, color, and display name.
 */

export interface IngredientInfo {
  name: string
  nameEn: string
  radius: number
  color: number
}

export const INGREDIENTS: IngredientInfo[] = [
  { name: '珍珠', nameEn: 'Tapioca', radius: 20, color: 0x3E2723 },
  { name: '芋圆', nameEn: 'Taro Ball', radius: 25, color: 0xCE93D8 },
  { name: '椰果', nameEn: 'Coconut Jelly', radius: 30, color: 0xF5F5F5 },
  { name: '水果丁', nameEn: 'Fruit Cube', radius: 35, color: 0xFF9800 },
  { name: '布丁', nameEn: 'Pudding', radius: 40, color: 0xFFEB3B },
  { name: '大珍珠', nameEn: 'Boba Pearl', radius: 48, color: 0x6A1B9A },
  { name: '奶茶杯', nameEn: 'Milk Tea Cup', radius: 56, color: 0xFFF8E1 },
  { name: '超级奶茶', nameEn: 'Super Boba', radius: 64, color: 0xFFD700 },
]

export const MAX_INGREDIENT_LEVEL = INGREDIENTS.length - 1

/**
 * Get the max droppable level (levels 0-4 are droppable).
 */
export function getMaxDropLevel(): number {
  return Math.min(4, MAX_INGREDIENT_LEVEL)
}

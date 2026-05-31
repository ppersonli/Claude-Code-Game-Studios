export interface IngredientInfo {
  level: number
  name: string
  nameEn: string
  radius: number
  color: number
}

export const INGREDIENTS: readonly IngredientInfo[] = [
  { level: 0, name: '西米', nameEn: 'Tapioca', radius: 18, color: 0xF5F5F5 },
  { level: 1, name: '椰果', nameEn: 'Coconut Jelly', radius: 24, color: 0xE8F5E9 },
  { level: 2, name: '布丁', nameEn: 'Pudding', radius: 30, color: 0xFFD54F },
  { level: 3, name: '芦荟', nameEn: 'Aloe Vera', radius: 38, color: 0x81C784 },
  { level: 4, name: '红豆', nameEn: 'Red Bean', radius: 45, color: 0xC62828 },
  { level: 5, name: '波波', nameEn: 'Boba Ball', radius: 54, color: 0x4E342E },
  { level: 6, name: '水晶波波', nameEn: 'Crystal Boba', radius: 64, color: 0x90CAF9 },
] as const

export const MAX_INGREDIENT_LEVEL = 6
export const MAX_DROP_LEVEL = 3

export function getIngredientByLevel(level: number): IngredientInfo {
  const info = INGREDIENTS[level]
  if (!info) throw new Error(`Invalid ingredient level: ${level}`)
  return info
}

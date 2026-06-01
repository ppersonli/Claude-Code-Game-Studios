import type { Ingredient } from '@types'

export const INGREDIENTS: readonly Ingredient[] = [
  { id: 'green_tea', name: '绿茶', img: `${import.meta.env.BASE_URL}assets/icon_green_tea.webp`, type: 'tea', color: '#7CB342' },
  { id: 'black_tea', name: '红茶', img: `${import.meta.env.BASE_URL}assets/icon_black_tea.webp`, type: 'tea', color: '#8B4513' },
  { id: 'milk', name: '牛奶', img: `${import.meta.env.BASE_URL}assets/icon_milk.webp`, type: 'liquid', color: '#FFF8E1' },
  { id: 'coconut', name: '椰奶', img: `${import.meta.env.BASE_URL}assets/icon_coconut.webp`, type: 'liquid', color: '#F5F5F5' },
  { id: 'boba', name: '珍珠', img: `${import.meta.env.BASE_URL}assets/icon_boba.webp`, type: 'topping', color: '#3E2723' },
  { id: 'jelly', name: '果冻', img: `${import.meta.env.BASE_URL}assets/icon_jelly.webp`, type: 'topping', color: '#E91E63' },
  { id: 'pudding', name: '布丁', img: `${import.meta.env.BASE_URL}assets/icon_pudding.webp`, type: 'topping', color: '#FFB300' },
  { id: 'ice', name: '冰块', img: `${import.meta.env.BASE_URL}assets/icon_ice.webp`, type: 'extra', color: '#B3E5FC' },
  { id: 'strawberry', name: '草莓', img: `${import.meta.env.BASE_URL}assets/icon_strawberry.webp`, type: 'fruit', color: '#F44336' },
  { id: 'mango', name: '芒果', img: `${import.meta.env.BASE_URL}assets/icon_mango.webp`, type: 'fruit', color: '#FF9800' },
  { id: 'red_bean', name: '红豆', img: `${import.meta.env.BASE_URL}assets/icon_red_bean.webp`, type: 'topping', color: '#8B4513' },
  { id: 'taro', name: '芋泥', img: `${import.meta.env.BASE_URL}assets/icon_taro.webp`, type: 'topping', color: '#9B59B6', locked: true, unlockCost: 100 },
  { id: 'grass_jelly', name: '仙草', img: `${import.meta.env.BASE_URL}assets/icon_grass_jelly.webp`, type: 'topping', color: '#1a1a2e', locked: true, unlockCost: 150 },
  { id: 'mochi', name: '麻薯', img: `${import.meta.env.BASE_URL}assets/icon_mochi.webp`, type: 'topping', color: '#FFB6C1', locked: true, unlockCost: 200 },
  { id: 'popping_boba', name: '爆珠', img: `${import.meta.env.BASE_URL}assets/icon_popping_boba.webp`, type: 'topping', color: '#FF6B6B', locked: true, unlockCost: 250 },
  { id: 'cream', name: '奶盖', img: `${import.meta.env.BASE_URL}assets/icon_cream.webp`, type: 'liquid', color: '#FFFDD0', locked: true, unlockCost: 300 },
] as const

export function isIngredientUnlocked(ingredient: Ingredient, unlockedIds: readonly string[]): boolean {
  if (!ingredient.locked) return true
  return unlockedIds.includes(ingredient.id)
}

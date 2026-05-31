/** Sort game ingredient definitions. Images reuse bubble-tea assets. */
export interface SortIngredient {
  id: string
  name: string
  img: string
  color: string
}

export const SORT_INGREDIENTS: SortIngredient[] = [
  { id: 'boba', name: '黑糖珍珠', img: './assets/icon_boba.webp', color: '#5C3317' },
  { id: 'taro', name: '芋頭', img: './assets/icon_taro.webp', color: '#9B59B6' },
  { id: 'mango', name: '芒果', img: './assets/icon_mango.webp', color: '#F39C12' },
  { id: 'strawberry', name: '草莓', img: './assets/icon_strawberry.webp', color: '#E74C3C' },
  { id: 'matcha', name: '抹茶', img: './assets/icon_green_tea.webp', color: '#27AE60' },
  { id: 'pudding', name: '布丁', img: './assets/icon_pudding.webp', color: '#F1C40F' },
  { id: 'jelly', name: '椰果', img: './assets/icon_jelly.webp', color: '#1ABC9C' },
  { id: 'red_bean', name: '紅豆', img: './assets/icon_red_bean.webp', color: '#C0392B' },
  { id: 'coconut', name: '椰奶', img: './assets/icon_coconut.webp', color: '#ECF0F1' },
  { id: 'milk', name: '鮮奶', img: './assets/icon_milk.webp', color: '#FDFEFE' },
]

/**
 * 配方图鉴系统数据
 * 记录玩家制作过的所有饮料配方
 */

export interface RecipeEntry {
  id: string
  name: string
  ingredients: string[] // ingredient IDs
  category: 'basic' | 'creative' | 'secret' | 'seasonal'
  img?: string
  firstMade?: number // timestamp
  timesMade: number
  isSecret: boolean
}

// 基础配方 (1-2种配料)
export const BASIC_RECIPES: RecipeEntry[] = [
  { id: 'classic_milk_tea', name: '经典奶茶', ingredients: ['black_tea', 'milk'], category: 'basic', timesMade: 0, isSecret: false },
  { id: 'green_milk_tea', name: '绿奶茶', ingredients: ['green_tea', 'milk'], category: 'basic', timesMade: 0, isSecret: false },
  { id: 'boba_milk_tea', name: '珍珠奶茶', ingredients: ['black_tea', 'milk', 'boba'], category: 'basic', timesMade: 0, isSecret: false },
  { id: 'coconut_tea', name: '椰香茶', ingredients: ['green_tea', 'coconut'], category: 'basic', timesMade: 0, isSecret: false },
  { id: 'strawberry_tea', name: '草莓茶', ingredients: ['green_tea', 'strawberry'], category: 'basic', timesMade: 0, isSecret: false },
  { id: 'mango_tea', name: '芒果茶', ingredients: ['green_tea', 'mango'], category: 'basic', timesMade: 0, isSecret: false },
  { id: 'red_bean_tea', name: '红豆茶', ingredients: ['black_tea', 'red_bean'], category: 'basic', timesMade: 0, isSecret: false },
  { id: 'taro_milk', name: '芋泥鲜奶', ingredients: ['milk', 'taro'], category: 'basic', timesMade: 0, isSecret: false },
  { id: 'grass_jelly_tea', name: '仙草茶', ingredients: ['black_tea', 'grass_jelly'], category: 'basic', timesMade: 0, isSecret: false },
  { id: 'mochi_milk', name: '麻薯鲜奶', ingredients: ['milk', 'mochi'], category: 'basic', timesMade: 0, isSecret: false },
]

// 创意特调 (3种配料)
export const CREATIVE_RECIPES: RecipeEntry[] = [
  { id: 'full_house', name: '全家福', ingredients: ['black_tea', 'milk', 'boba', 'jelly'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'fruit_paradise', name: '水果乐园', ingredients: ['green_tea', 'strawberry', 'mango'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'triple_topping', name: '三料奶茶', ingredients: ['black_tea', 'milk', 'boba', 'pudding'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'coconut_paradise', name: '椰香天堂', ingredients: ['coconut', 'boba', 'jelly'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'strawberry_mochi', name: '草莓麻薯', ingredients: ['milk', 'strawberry', 'mochi'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'mango_pudding', name: '芒果布丁', ingredients: ['green_tea', 'mango', 'pudding'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'red_bean_mochi', name: '红豆麻薯', ingredients: ['milk', 'red_bean', 'mochi'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'taro_boba', name: '芋泥珍珠', ingredients: ['milk', 'taro', 'boba'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'grass_jelly_coconut', name: '仙草椰奶', ingredients: ['coconut', 'grass_jelly', 'ice'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'popping_fruit', name: '爆珠水果', ingredients: ['green_tea', 'popping_boba', 'strawberry'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'cream_top', name: '奶盖奶茶', ingredients: ['black_tea', 'milk', 'cream'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'double_boba', name: '双珠奶茶', ingredients: ['black_tea', 'milk', 'boba', 'popping_boba'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'ice_cream_tea', name: '冰淇淋茶', ingredients: ['black_tea', 'ice', 'cream'], category: 'creative', timesMade: 0, isSecret: false },
  { id: 'fruit_jelly', name: '水果果冻', ingredients: ['green_tea', 'jelly', 'mango'], category: 'creative', timesMade: 0, isSecret: false },
]

// 隐藏配方 (特殊组合触发)
export const SECRET_RECIPES: RecipeEntry[] = [
  { id: 'super_deluxe', name: '超级豪华全家福', ingredients: ['black_tea', 'milk', 'boba', 'pudding', 'jelly'], category: 'secret', timesMade: 0, isSecret: true },
  { id: 'uji_kintoki', name: '宇治金时', ingredients: ['green_tea', 'milk', 'red_bean', 'red_bean'], category: 'secret', timesMade: 0, isSecret: true },
  { id: 'tropical_paradise', name: '热带天堂', ingredients: ['coconut', 'mango', 'strawberry', 'popping_boba'], category: 'secret', timesMade: 0, isSecret: true },
  { id: 'midnight_special', name: '午夜特调', ingredients: ['black_tea', 'grass_jelly', 'cream', 'ice'], category: 'secret', timesMade: 0, isSecret: true },
  { id: 'sweet_dream', name: '甜梦', ingredients: ['milk', 'taro', 'mochi', 'cream'], category: 'secret', timesMade: 0, isSecret: true },
]

// 季节限定配方
export const SEASONAL_RECIPES: RecipeEntry[] = [
  { id: 'sakura_tea', name: '樱花茶', ingredients: ['green_tea', 'sakura_jelly', 'sakura_syrup'], category: 'seasonal', timesMade: 0, isSecret: false },
  { id: 'halloween_poison', name: '万圣节毒药', ingredients: ['black_tea', 'eyeball_jelly', 'spider_web_coconut'], category: 'seasonal', timesMade: 0, isSecret: false },
  { id: 'christmas_special', name: '圣诞特饮', ingredients: ['milk', 'gingerbread', 'marshmallow', 'mint'], category: 'seasonal', timesMade: 0, isSecret: false },
]

export const ALL_RECIPES = [
  ...BASIC_RECIPES,
  ...CREATIVE_RECIPES,
  ...SECRET_RECIPES,
  ...SEASONAL_RECIPES,
]

/**
 * 检查当前杯内容物是否匹配某个配方
 */
export function matchRecipe(cupIngredients: string[]): RecipeEntry | null {
  for (const recipe of ALL_RECIPES) {
    if (recipe.ingredients.length !== cupIngredients.length) continue
    
    const sortedRecipe = [...recipe.ingredients].sort()
    const sortedCup = [...cupIngredients].sort()
    
    if (JSON.stringify(sortedRecipe) === JSON.stringify(sortedCup)) {
      return recipe
    }
  }
  return null
}

/**
 * 从localStorage加载配方图鉴
 */
export function loadRecipeBook(): Record<string, { firstMade: number; timesMade: number }> {
  try {
    const raw = localStorage.getItem('btlab_recipe_book')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * 保存配方图鉴到localStorage
 */
export function saveRecipeBook(book: Record<string, { firstMade: number; timesMade: number }>): void {
  localStorage.setItem('btlab_recipe_book', JSON.stringify(book))
}

/**
 * 记录新制作的配方
 */
export function recordRecipe(recipeId: string, book: Record<string, { firstMade: number; timesMade: number }>): void {
  if (!book[recipeId]) {
    book[recipeId] = { firstMade: Date.now(), timesMade: 1 }
  } else {
    book[recipeId].timesMade++
  }
  saveRecipeBook(book)
}

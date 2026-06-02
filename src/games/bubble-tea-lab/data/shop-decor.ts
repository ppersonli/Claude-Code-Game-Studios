/**
 * 店铺装修系统
 * 让玩家有长期目标和自定义体验
 */

export interface DecorItem {
  id: string
  name: string
  category: 'shop_front' | 'table' | 'wall' | 'shelf' | 'cup' | 'bgm' | 'light'
  img: string
  cost: number
  requiredLevel: number
  unlockCost: number
  description: string
  effect: {
    patienceBonus?: number // 增加顾客耐心(秒)
    tipBonus?: number // 增加小费倍率
    scoreBonus?: number // 增加得分倍率
  }
}

// 店面外观
export const SHOP_FRONTS: DecorItem[] = [
  {
    id: 'shop_front_classic',
    name: '经典门面',
    category: 'shop_front',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/shop_front_1.webp`,
    cost: 0,
    requiredLevel: 0,
    unlockCost: 0,
    description: '默认的经典门面',
    effect: {},
  },
  {
    id: 'shop_front_modern',
    name: '现代风格',
    category: 'shop_front',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/shop_front_2.webp`,
    cost: 500,
    requiredLevel: 5,
    unlockCost: 500,
    description: '简约现代的玻璃门面',
    effect: { patienceBonus: 3 },
  },
  {
    id: 'shop_front_vintage',
    name: '复古风格',
    category: 'shop_front',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/shop_front_3.webp`,
    cost: 1000,
    requiredLevel: 10,
    unlockCost: 1000,
    description: '木质复古门面',
    effect: { tipBonus: 0.1 },
  },
  {
    id: 'shop_front_fantasy',
    name: '梦幻风格',
    category: 'shop_front',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/shop_front_4.webp`,
    cost: 2000,
    requiredLevel: 15,
    unlockCost: 2000,
    description: '童话般的梦幻门面',
    effect: { patienceBonus: 5, tipBonus: 0.15 },
  },
  {
    id: 'shop_front_cyberpunk',
    name: '赛博朋克',
    category: 'shop_front',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/shop_front_5.webp`,
    cost: 3000,
    requiredLevel: 20,
    unlockCost: 3000,
    description: '未来感的赛博朋克风格',
    effect: { scoreBonus: 0.2, tipBonus: 0.2 },
  },
]

// 桌椅
export const TABLES: DecorItem[] = [
  {
    id: 'table_wooden',
    name: '木质桌椅',
    category: 'table',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/table_chair_1.webp`,
    cost: 0,
    requiredLevel: 0,
    unlockCost: 0,
    description: '基础木质桌椅',
    effect: {},
  },
  {
    id: 'table_modern',
    name: '现代桌椅',
    category: 'table',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/table_chair_2.webp`,
    cost: 300,
    requiredLevel: 3,
    unlockCost: 300,
    description: '舒适的现代风格',
    effect: { patienceBonus: 2 },
  },
  {
    id: 'table_cushion',
    name: '软垫座椅',
    category: 'table',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/table_chair_3.webp`,
    cost: 800,
    requiredLevel: 8,
    unlockCost: 800,
    description: '柔软舒适的座椅',
    effect: { patienceBonus: 4 },
  },
  {
    id: 'table_fantasy',
    name: '梦幻桌椅',
    category: 'table',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/table_chair_4.webp`,
    cost: 1500,
    requiredLevel: 12,
    unlockCost: 1500,
    description: '童话风格的座椅',
    effect: { patienceBonus: 5, tipBonus: 0.1 },
  },
  {
    id: 'table_luxury',
    name: '豪华座椅',
    category: 'table',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/table_chair_5.webp`,
    cost: 2500,
    requiredLevel: 18,
    unlockCost: 2500,
    description: '真皮豪华座椅',
    effect: { patienceBonus: 6, tipBonus: 0.2 },
  },
]

// 墙面装饰
export const WALL_POSTERS: DecorItem[] = [
  {
    id: 'wall_none',
    name: '无装饰',
    category: 'wall',
    img: '',
    cost: 0,
    requiredLevel: 0,
    unlockCost: 0,
    description: '空白墙面',
    effect: {},
  },
  {
    id: 'wall_menu',
    name: '菜单海报',
    category: 'wall',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/poster_1.webp`,
    cost: 200,
    requiredLevel: 2,
    unlockCost: 200,
    description: '展示特色饮品',
    effect: { scoreBonus: 0.05 },
  },
  {
    id: 'wall_motivational',
    name: '励志海报',
    category: 'wall',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/poster_2.webp`,
    cost: 300,
    requiredLevel: 4,
    unlockCost: 300,
    description: '激励员工的标语',
    effect: { patienceBonus: 2 },
  },
  {
    id: 'wall_seasonal',
    name: '季节海报',
    category: 'wall',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/poster_3.webp`,
    cost: 500,
    requiredLevel: 7,
    unlockCost: 500,
    description: '展示季节限定',
    effect: { tipBonus: 0.1 },
  },
  {
    id: 'wall_art',
    name: '艺术画作',
    category: 'wall',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/poster_4.webp`,
    cost: 1200,
    requiredLevel: 11,
    unlockCost: 1200,
    description: '高雅的艺术装饰',
    effect: { patienceBonus: 3, tipBonus: 0.15 },
  },
  {
    id: 'wall_neon',
    name: '霓虹灯牌',
    category: 'wall',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/poster_5.webp`,
    cost: 2000,
    requiredLevel: 16,
    unlockCost: 2000,
    description: '闪亮的霓虹灯',
    effect: { scoreBonus: 0.15, tipBonus: 0.2 },
  },
]

// 配料架
export const SHELVES: DecorItem[] = [
  {
    id: 'shelf_basic',
    name: '基础架子',
    category: 'shelf',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/shelf_1.webp`,
    cost: 0,
    requiredLevel: 0,
    unlockCost: 0,
    description: '简单的木质架子',
    effect: {},
  },
  {
    id: 'shelf_modern',
    name: '现代架子',
    category: 'shelf',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/shelf_2.webp`,
    cost: 600,
    requiredLevel: 6,
    unlockCost: 600,
    description: '整洁的现代风格',
    effect: { scoreBonus: 0.08 },
  },
  {
    id: 'shelf_luxury',
    name: '豪华架子',
    category: 'shelf',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/decorations/shelf_3.webp`,
    cost: 1500,
    requiredLevel: 14,
    unlockCost: 1500,
    description: '高端展示架',
    effect: { scoreBonus: 0.15, tipBonus: 0.1 },
  },
]

// 杯子皮肤
export const CUP_SKINS: DecorItem[] = [
  {
    id: 'cup_classic',
    name: '经典玻璃杯',
    category: 'cup',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/cups/cup_classic.webp`,
    cost: 0,
    requiredLevel: 0,
    unlockCost: 0,
    description: '透明玻璃杯',
    effect: {},
  },
  {
    id: 'cup_pink',
    name: '粉色塑料杯',
    category: 'cup',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/cups/cup_pink.webp`,
    cost: 300,
    requiredLevel: 3,
    unlockCost: 300,
    description: '可爱的粉色杯子',
    effect: { tipBonus: 0.05 },
  },
  {
    id: 'cup_wooden',
    name: '木质纹理杯',
    category: 'cup',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/cups/cup_wooden.webp`,
    cost: 800,
    requiredLevel: 9,
    unlockCost: 800,
    description: '日式木质杯',
    effect: { tipBonus: 0.1 },
  },
  {
    id: 'cup_metal',
    name: '金属赛博杯',
    category: 'cup',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/cups/cup_metal.webp`,
    cost: 1800,
    requiredLevel: 17,
    unlockCost: 1800,
    description: '未来感金属杯',
    effect: { scoreBonus: 0.12, tipBonus: 0.15 },
  },
  {
    id: 'cup_ceramic',
    name: '手绘陶瓷杯',
    category: 'cup',
    img: `${import.meta.env.BASE_URL}assets/bubble-tea-lab/cups/cup_ceramic.webp`,
    cost: 2500,
    requiredLevel: 22,
    unlockCost: 2500,
    description: '精美手绘陶瓷',
    effect: { patienceBonus: 3, tipBonus: 0.25 },
  },
]

export const ALL_DECOR = [
  ...SHOP_FRONTS,
  ...TABLES,
  ...WALL_POSTERS,
  ...SHELVES,
  ...CUP_SKINS,
]

/**
 * 装修配置状态
 */
export interface ShopDecorState {
  shopFront: string
  table: string
  wall: string
  shelf: string
  cup: string
  bgm: string
  light: string
}

export const DEFAULT_DECOR_STATE: ShopDecorState = {
  shopFront: 'shop_front_classic',
  table: 'table_wooden',
  wall: 'wall_none',
  shelf: 'shelf_basic',
  cup: 'cup_classic',
  bgm: 'bgm_default',
  light: 'light_default',
}

/**
 * 计算装修总效果
 */
export function calculateDecorEffect(decorState: ShopDecorState): {
  patienceBonus: number
  tipBonus: number
  scoreBonus: number
} {
  let patienceBonus = 0
  let tipBonus = 0
  let scoreBonus = 0

  const items = [
    decorState.shopFront,
    decorState.table,
    decorState.wall,
    decorState.shelf,
    decorState.cup,
  ]

  for (const itemId of items) {
    const item = ALL_DECOR.find(d => d.id === itemId)
    if (item) {
      patienceBonus += item.effect.patienceBonus ?? 0
      tipBonus += item.effect.tipBonus ?? 0
      scoreBonus += item.effect.scoreBonus ?? 0
    }
  }

  return { patienceBonus, tipBonus, scoreBonus }
}

/**
 * 从localStorage加载装修状态
 */
export function loadShopDecor(): ShopDecorState {
  try {
    const raw = localStorage.getItem('btlab_shop_decor')
    if (!raw) return { ...DEFAULT_DECOR_STATE }
    return { ...DEFAULT_DECOR_STATE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_DECOR_STATE }
  }
}

/**
 * 保存装修状态到localStorage
 */
export function saveShopDecor(decorState: ShopDecorState): void {
  localStorage.setItem('btlab_shop_decor', JSON.stringify(decorState))
}

/**
 * 获取可购买的装修物品
 */
export function getAvailableDecor(
  coins: number,
  level: number,
  unlockedDecor: string[],
  category: DecorItem['category'],
): { item: DecorItem; unlocked: boolean; canBuy: boolean }[] {
  const items = ALL_DECOR.filter(d => d.category === category)
  
  return items.map(item => ({
    item,
    unlocked: unlockedDecor.includes(item.id),
    canBuy: !unlockedDecor.includes(item.id) && 
            coins >= item.cost && 
            level >= item.requiredLevel,
  }))
}

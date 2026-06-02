/**
 * 顾客AI性格系统
 * 每个顾客有独特的行为模式、耐心值和偏好
 */

export interface CustomerPersonality {
  id: string
  name: string
  emoji: string
  patience: number // 秒
  preferredTypes: string[] // 喜欢的配料类型
  tipMultiplier: number
  behavior: 'normal' | 'impatient' | 'sweet-tooth' | 'health-conscious' | 'visual' | 'fickle' | 'vip' | 'mystery'
  description: string
  moodChangeInterval: number // 表情变化间隔(秒)
  rewardMultiplier: number
}

export const CUSTOMER_PERSONALITIES: CustomerPersonality[] = [
  {
    id: 'office_worker',
    name: '上班族',
    emoji: '🧑‍💼',
    patience: 15,
    preferredTypes: ['tea', 'liquid'],
    tipMultiplier: 1.5,
    behavior: 'impatient',
    description: '耐心低，要求简单，给小费高',
    moodChangeInterval: 3,
    rewardMultiplier: 1.2,
  },
  {
    id: 'student',
    name: '学生',
    emoji: '👧',
    patience: 25,
    preferredTypes: ['fruit', 'topping'],
    tipMultiplier: 1.0,
    behavior: 'sweet-tooth',
    description: '喜欢甜的，会抱怨太苦',
    moodChangeInterval: 5,
    rewardMultiplier: 1.0,
  },
  {
    id: 'grandpa',
    name: '老人家',
    emoji: '👴',
    patience: 40,
    preferredTypes: ['tea'],
    tipMultiplier: 0.8,
    behavior: 'health-conscious',
    description: '要求无糖/少冰，给小费低但稳定',
    moodChangeInterval: 8,
    rewardMultiplier: 0.9,
  },
  {
    id: 'blogger',
    name: '博主',
    emoji: '🤳',
    patience: 20,
    preferredTypes: ['fruit', 'liquid'],
    tipMultiplier: 2.0,
    behavior: 'visual',
    description: '要求"好看"的搭配，给超高小费+分享',
    moodChangeInterval: 4,
    rewardMultiplier: 1.5,
  },
  {
    id: 'demon',
    name: '恶魔顾客',
    emoji: '😈',
    patience: 30,
    preferredTypes: ['topping', 'extra'],
    tipMultiplier: 1.3,
    behavior: 'fickle',
    description: '随机改变主意！下单后可能改单',
    moodChangeInterval: 5,
    rewardMultiplier: 1.3,
  },
  {
    id: 'vip',
    name: 'VIP顾客',
    emoji: '🌈',
    patience: 35,
    preferredTypes: ['tea', 'liquid', 'topping'],
    tipMultiplier: 3.0,
    behavior: 'vip',
    description: '金色边框，要求3种以上配料，给3倍金币',
    moodChangeInterval: 7,
    rewardMultiplier: 3.0,
  },
  {
    id: 'mystery',
    name: '神秘顾客',
    emoji: '🎁',
    patience: 45,
    preferredTypes: [],
    tipMultiplier: 1.0,
    behavior: 'mystery',
    description: '隐藏需求，猜对给10倍奖励',
    moodChangeInterval: 9,
    rewardMultiplier: 10.0,
  },
]

/**
 * 顾客情绪状态
 */
export type CustomerMood = 'happy' | 'neutral' | 'worried' | 'angry'

export interface MoodState {
  mood: CustomerMood
  emoji: string
  patienceThreshold: number // 剩余耐心百分比阈值
}

export const MOOD_STATES: MoodState[] = [
  { mood: 'happy', emoji: '😊', patienceThreshold: 0.7 },
  { mood: 'neutral', emoji: '😐', patienceThreshold: 0.5 },
  { mood: 'worried', emoji: '😟', patienceThreshold: 0.3 },
  { mood: 'angry', emoji: '😡', patienceThreshold: 0 },
]

/**
 * 根据剩余耐心值计算当前情绪
 */
export function calculateMood(remainingPatience: number, maxPatience: number): CustomerMood {
  const ratio = remainingPatience / maxPatience
  
  if (ratio >= 0.7) return 'happy'
  if (ratio >= 0.5) return 'neutral'
  if (ratio >= 0.3) return 'worried'
  return 'angry'
}

/**
 * 获取情绪的emoji
 */
export function getMoodEmoji(mood: CustomerMood): string {
  const state = MOOD_STATES.find(s => s.mood === mood)
  return state?.emoji ?? '😐'
}

/**
 * 检查顾客是否应该离开(耐心耗尽)
 */
export function shouldCustomerLeave(remainingPatience: number): boolean {
  return remainingPatience <= 0
}

/**
 * 根据顾客性格生成订单偏好
 * 喜欢的配料类型有更高概率出现
 */
export function generatePreferredOrder(
  personality: CustomerPersonality,
  level: number,
  unlockedIngredients: readonly string[],
): string[] {
  // 注意: 这个函数需要调用方传入INGREDIENTS
  // 避免循环依赖
  return []
}

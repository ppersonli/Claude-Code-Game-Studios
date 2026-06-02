/**
 * 季节活动系统
 * 制造"限时"紧迫感，增加留存
 */

export interface SeasonalEvent {
  id: string
  name: string
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  holiday: string
  emoji: string
  startDate: { month: number; day: number } // 开始日期（月/日）
  endDate: { month: number; day: number }   // 结束日期（月/日）
  description: string
  
  // 限定内容
  limitedIngredients: string[] // 限定配料ID列表
  limitedCustomers: string[] // 限定顾客ID列表
  
  // 特殊效果
  specialEffects: {
    backgroundParticles?: 'sakura' | 'snow' | 'leaves' | 'bats' | 'fireworks'
    backgroundMusic?: string
    uiTheme?: string
    specialMechanics?: string[]
  }
  
  // 任务系统
  missions: SeasonalMission[]
  
  // 奖励
  rewards: {
    completionReward: number // 完成所有任务奖励
    exclusiveDecor?: string[] // 限定装修
    exclusiveRecipes?: string[] // 限定配方
  }
}

export interface SeasonalMission {
  id: string
  name: string
  description: string
  type: 'make_drinks' | 'perfect_serves' | 'use_ingredient' | 'serve_customer' | 'earn_coins'
  target: number // 目标数量
  reward: number // 金币奖励
  rewardType: 'coins' | 'ingredient' | 'decor'
  rewardItem?: string // 如果是配料/装修，指定ID
}

// === 春季活动 ===

export const SPRING_SAKURA: SeasonalEvent = {
  id: 'spring_sakura',
  name: '樱花季',
  season: 'spring',
  holiday: '春季限定',
  emoji: '🌸',
  startDate: { month: 3, day: 1 },
  endDate: { month: 4, day: 30 },
  description: '樱花飘落，制作浪漫樱花饮品',
  
  limitedIngredients: ['sakura_jelly', 'sakura_syrup'],
  limitedCustomers: ['kimono_girl'],
  
  specialEffects: {
    backgroundParticles: 'sakura',
    backgroundMusic: 'bgm_sakura',
    uiTheme: 'sakura_pink',
    specialMechanics: ['sakura_combo'],
  },
  
  missions: [
    {
      id: 'sakura_50',
      name: '樱花大师',
      description: '制作50杯含樱花配料的饮品',
      type: 'use_ingredient',
      target: 50,
      reward: 500,
      rewardType: 'coins',
    },
    {
      id: 'sakura_perfect',
      name: '完美樱花',
      description: '完成20次完美出杯',
      type: 'perfect_serves',
      target: 20,
      reward: 300,
      rewardType: 'coins',
    },
    {
      id: 'sakura_customer',
      name: '樱花顾客',
      description: '服务10位和服女生顾客',
      type: 'serve_customer',
      target: 10,
      reward: 400,
      rewardType: 'coins',
    },
  ],
  
  rewards: {
    completionReward: 1500,
    exclusiveDecor: ['wall_sakura_poster'],
    exclusiveRecipes: ['sakura_tea', 'sakura_milk_tea'],
  },
}

// === 万圣节活动 ===

export const HALLOWEEN_EVENT: SeasonalEvent = {
  id: 'halloween',
  name: '万圣节狂欢',
  season: 'autumn',
  holiday: '万圣节',
  emoji: '🎃',
  startDate: { month: 10, day: 1 },
  endDate: { month: 10, day: 31 },
  description: '恐怖又可爱的万圣节特饮',
  
  limitedIngredients: ['eyeball_jelly', 'spider_web_coconut'],
  limitedCustomers: ['vampire', 'witch', 'zombie'],
  
  specialEffects: {
    backgroundParticles: 'bats',
    backgroundMusic: 'bgm_halloween',
    uiTheme: 'halloween_orange',
    specialMechanics: ['dark_recipe', 'surprise_customer'],
  },
  
  missions: [
    {
      id: 'halloween_30',
      name: '万圣节调酒师',
      description: '制作30杯万圣节饮品',
      type: 'make_drinks',
      target: 30,
      reward: 600,
      rewardType: 'coins',
    },
    {
      id: 'halloween_dark',
      name: '黑暗配方',
      description: '解锁3个万圣节隐藏配方',
      type: 'use_ingredient',
      target: 3,
      reward: 800,
      rewardType: 'coins',
    },
    {
      id: 'halloween_earn',
      name: '万圣节富翁',
      description: '活动期间赚取2000金币',
      type: 'earn_coins',
      target: 2000,
      reward: 500,
      rewardType: 'coins',
    },
  ],
  
  rewards: {
    completionReward: 2000,
    exclusiveDecor: ['wall_halloween_poster', 'shelf_halloween'],
    exclusiveRecipes: ['halloween_poison', 'witch_brew'],
  },
}

// === 圣诞节活动 ===

export const CHRISTMAS_EVENT: SeasonalEvent = {
  id: 'christmas',
  name: '圣诞节温暖',
  season: 'winter',
  holiday: '圣诞节',
  emoji: '🎄',
  startDate: { month: 12, day: 1 },
  endDate: { month: 12, day: 31 },
  description: '温暖的圣诞特饮，礼物包装',
  
  limitedIngredients: ['gingerbread', 'marshmallow', 'mint'],
  limitedCustomers: ['santa', 'reindeer'],
  
  specialEffects: {
    backgroundParticles: 'snow',
    backgroundMusic: 'bgm_christmas',
    uiTheme: 'christmas_red_green',
    specialMechanics: ['gift_wrap', 'christmas_combo'],
  },
  
  missions: [
    {
      id: 'christmas_40',
      name: '圣诞特饮',
      description: '制作40杯圣诞节饮品',
      type: 'make_drinks',
      target: 40,
      reward: 700,
      rewardType: 'coins',
    },
    {
      id: 'christmas_gift',
      name: '礼物包装',
      description: '完成25次完美出杯（包装成礼物）',
      type: 'perfect_serves',
      target: 25,
      reward: 600,
      rewardType: 'coins',
    },
    {
      id: 'christmas_santa',
      name: '圣诞老人',
      description: '服务15位圣诞老人顾客',
      type: 'serve_customer',
      target: 15,
      reward: 500,
      rewardType: 'coins',
    },
  ],
  
  rewards: {
    completionReward: 2500,
    exclusiveDecor: ['wall_christmas_poster', 'cup_christmas'],
    exclusiveRecipes: ['christmas_special', 'hot_chocolate'],
  },
}

// === 夏季活动 ===

export const SUMMER_EVENT: SeasonalEvent = {
  id: 'summer_festival',
  name: '夏日祭典',
  season: 'summer',
  holiday: '夏季限定',
  emoji: '🎆',
  startDate: { month: 7, day: 1 },
  endDate: { month: 8, day: 31 },
  description: '清凉夏日，冰饮特惠',
  
  limitedIngredients: ['ice_cream', 'watermelon', 'lychee'],
  limitedCustomers: ['beach_girl', 'surfer'],
  
  specialEffects: {
    backgroundParticles: 'fireworks',
    backgroundMusic: 'bgm_summer',
    uiTheme: 'summer_blue',
    specialMechanics: ['ice_combo', 'summer_special'],
  },
  
  missions: [
    {
      id: 'summer_ice',
      name: '冰饮大师',
      description: '制作35杯冰饮',
      type: 'use_ingredient',
      target: 35,
      reward: 550,
      rewardType: 'coins',
    },
    {
      id: 'summer_combo',
      name: '夏日连击',
      description: '达成15连击',
      type: 'perfect_serves',
      target: 15,
      reward: 700,
      rewardType: 'coins',
    },
  ],
  
  rewards: {
    completionReward: 1800,
    exclusiveDecor: ['wall_summer_poster'],
    exclusiveRecipes: ['summer_cooler', 'tropical_punch'],
  },
}

export const ALL_EVENTS = [
  SPRING_SAKURA,
  SUMMER_EVENT,
  HALLOWEEN_EVENT,
  CHRISTMAS_EVENT,
]

/**
 * 检查当前是否在活动期间
 */
export function isEventActive(event: SeasonalEvent, currentDate: Date = new Date()): boolean {
  const month = currentDate.getMonth() + 1 // getMonth() 返回 0-11
  const day = currentDate.getDate()
  
  const current = { month, day }
  
  // 简单的日期比较（同年内）
  const startDate = new Date(2024, event.startDate.month - 1, event.startDate.day)
  const endDate = new Date(2024, event.endDate.month - 1, event.endDate.day)
  const now = new Date(2024, current.month - 1, current.day)
  
  return now >= startDate && now <= endDate
}

/**
 * 获取当前活跃的活动
 */
export function getActiveEvents(currentDate: Date = new Date()): SeasonalEvent[] {
  return ALL_EVENTS.filter(event => isEventActive(event, currentDate))
}

/**
 * 获取下一个即将开始的活动
 */
export function getNextEvent(currentDate: Date = new Date()): SeasonalEvent | null {
  const now = currentDate
  const sortedEvents = [...ALL_EVENTS].sort((a, b) => {
    const aStart = new Date(2024, a.startDate.month - 1, a.startDate.day)
    const bStart = new Date(2024, b.startDate.month - 1, b.startDate.day)
    return aStart.getTime() - bStart.getTime()
  })
  
  for (const event of sortedEvents) {
    const startDate = new Date(2024, event.startDate.month - 1, event.startDate.day)
    if (startDate > now) {
      return event
    }
  }
  
  return null
}

/**
 * 活动状态
 */
export interface EventProgress {
  eventId: string
  missions: Record<string, {
    progress: number
    completed: boolean
    claimed: boolean
  }>
  totalProgress: number
  completed: boolean
}

/**
 * 从localStorage加载活动进度
 */
export function loadEventProgress(): Record<string, EventProgress> {
  try {
    const raw = localStorage.getItem('btlab_event_progress')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * 保存活动进度到localStorage
 */
export function saveEventProgress(progress: Record<string, EventProgress>): void {
  localStorage.setItem('btlab_event_progress', JSON.stringify(progress))
}

/**
 * 更新任务进度
 */
export function updateMissionProgress(
  eventId: string,
  missionId: string,
  increment: number,
  progress: Record<string, EventProgress>,
): void {
  if (!progress[eventId]) {
    progress[eventId] = {
      eventId,
      missions: {},
      totalProgress: 0,
      completed: false,
    }
  }
  
  if (!progress[eventId].missions[missionId]) {
    progress[eventId].missions[missionId] = {
      progress: 0,
      completed: false,
      claimed: false,
    }
  }
  
  const mission = progress[eventId].missions[missionId]
  mission.progress = Math.min(mission.progress + increment, 999999)
  
  // 检查是否完成
  const event = ALL_EVENTS.find(e => e.id === eventId)
  const missionDef = event?.missions.find(m => m.id === missionId)
  
  if (missionDef && mission.progress >= missionDef.target && !mission.completed) {
    mission.completed = true
    mission.claimed = false // 可以领取奖励
  }
  
  // 更新总进度
  const totalMissions = event?.missions.length ?? 0
  const completedMissions = Object.values(progress[eventId].missions).filter(m => m.completed).length
  progress[eventId].totalProgress = completedMissions / totalMissions
  progress[eventId].completed = completedMissions === totalMissions
  
  saveEventProgress(progress)
}

/**
 * 领取任务奖励
 */
export function claimMissionReward(
  eventId: string,
  missionId: string,
  progress: Record<string, EventProgress>,
): number {
  const mission = progress[eventId]?.missions[missionId]
  if (!mission || mission.claimed || !mission.completed) return 0
  
  const event = ALL_EVENTS.find(e => e.id === eventId)
  const missionDef = event?.missions.find(m => m.id === missionId)
  
  if (!missionDef) return 0
  
  mission.claimed = true
  saveEventProgress(progress)
  
  return missionDef.reward
}

/**
 * 高级连击系统 (Juice System)
 * 让连击"爽到飞起"的多层级反馈系统
 */

export interface ComboEffect {
  level: number
  name: string
  description: string
  particles: 'none' | 'spark' | 'rainbow' | 'stars' | 'gold-explosion' | 'full-rainbow'
  screenShake: boolean
  slowMotion: boolean
  soundPitch: number
  visualEffects: string[]
}

export const COMBO_EFFECTS: ComboEffect[] = [
  {
    level: 1,
    name: '开始',
    description: '连击开始',
    particles: 'none',
    screenShake: false,
    slowMotion: false,
    soundPitch: 1.0,
    visualEffects: [],
  },
  {
    level: 2,
    name: '小火苗',
    description: '小火花粒子，轻微屏幕震动',
    particles: 'spark',
    screenShake: true,
    slowMotion: false,
    soundPitch: 1.1,
    visualEffects: ['small-sparks'],
  },
  {
    level: 3,
    name: '燃烧',
    description: '更多火花，明显震动',
    particles: 'spark',
    screenShake: true,
    slowMotion: false,
    soundPitch: 1.2,
    visualEffects: ['more-sparks', 'glow'],
  },
  {
    level: 4,
    name: '彩虹光环',
    description: '彩虹光环效果，音调升高',
    particles: 'rainbow',
    screenShake: true,
    slowMotion: false,
    soundPitch: 1.3,
    visualEffects: ['rainbow-ring', 'color-shift'],
  },
  {
    level: 5,
    name: '彩虹飞舞',
    description: '彩虹效果增强',
    particles: 'rainbow',
    screenShake: true,
    slowMotion: false,
    soundPitch: 1.4,
    visualEffects: ['rainbow-ring', 'color-shift', 'bigger-glow'],
  },
  {
    level: 6,
    name: '星星风暴',
    description: '屏幕边缘发光，大量星星粒子',
    particles: 'stars',
    screenShake: true,
    slowMotion: false,
    soundPitch: 1.5,
    visualEffects: ['edge-glow', 'star-storm', 'rainbow-ring'],
  },
  {
    level: 7,
    name: '星光灿烂',
    description: '更多星星，音效变调加速',
    particles: 'stars',
    screenShake: true,
    slowMotion: false,
    soundPitch: 1.6,
    visualEffects: ['edge-glow', 'more-stars', 'rainbow-ring'],
  },
  {
    level: 8,
    name: '星辰大海',
    description: '星星粒子爆发',
    particles: 'stars',
    screenShake: true,
    slowMotion: false,
    soundPitch: 1.7,
    visualEffects: ['edge-glow', 'star-explosion', 'rainbow-ring'],
  },
  {
    level: 9,
    name: '时间减缓',
    description: '时间减缓(slow-motion 0.5x持续1秒)，金色文字爆炸',
    particles: 'gold-explosion',
    screenShake: true,
    slowMotion: true,
    soundPitch: 1.8,
    visualEffects: ['slow-motion', 'gold-explosion', 'edge-glow'],
  },
  {
    level: 10,
    name: '时空扭曲',
    description: '时间减缓+更强效果',
    particles: 'gold-explosion',
    screenShake: true,
    slowMotion: true,
    soundPitch: 1.9,
    visualEffects: ['slow-motion', 'bigger-gold-explosion', 'edge-glow'],
  },
  {
    level: 11,
    name: '金色风暴',
    description: '金色文字爆炸',
    particles: 'gold-explosion',
    screenShake: true,
    slowMotion: true,
    soundPitch: 2.0,
    visualEffects: ['slow-motion', 'massive-gold', 'edge-glow'],
  },
  {
    level: 12,
    name: '黄金时代',
    description: '最强金色效果',
    particles: 'gold-explosion',
    screenShake: true,
    slowMotion: true,
    soundPitch: 2.1,
    visualEffects: ['slow-motion', 'ultimate-gold', 'edge-glow'],
  },
  {
    level: 13,
    name: '彩虹爆炸',
    description: '全屏彩虹特效，杯子发光，顾客跳舞',
    particles: 'full-rainbow',
    screenShake: true,
    slowMotion: true,
    soundPitch: 2.2,
    visualEffects: ['full-rainbow', 'cup-glow', 'customer-dance'],
  },
]

/**
 * 根据连击数获取效果等级
 */
export function getComboEffect(combo: number): ComboEffect {
  if (combo >= 13) return COMBO_EFFECTS[COMBO_EFFECTS.length - 1]
  return COMBO_EFFECTS[combo - 1] ?? COMBO_EFFECTS[0]
}

/**
 * 特殊连击触发条件
 */
export interface SpecialComboTrigger {
  name: string
  condition: (perfectStreak: number) => boolean
  duration: number // 秒
  effect: 'fever-time' | 'boss-rush'
  description: string
}

export const SPECIAL_COMBOS: SpecialComboTrigger[] = [
  {
    name: 'FEVER TIME',
    condition: (perfectStreak) => perfectStreak >= 3,
    duration: 5,
    effect: 'fever-time',
    description: '5秒内所有得分x2',
  },
  {
    name: 'BOSS RUSH',
    condition: (perfectStreak) => perfectStreak >= 5,
    duration: 30,
    effect: 'boss-rush',
    description: '出现超级VIP顾客，10倍奖励',
  },
]

/**
 * 检查是否触发特殊连击
 */
export function checkSpecialCombo(perfectStreak: number): SpecialComboTrigger | null {
  for (const trigger of SPECIAL_COMBOS) {
    if (trigger.condition(perfectStreak)) {
      return trigger
    }
  }
  return null
}

/**
 * 连击音效频率映射
 */
export function getComboSoundPitch(combo: number): number {
  const effect = getComboEffect(combo)
  return effect.soundPitch
}

/**
 * 连击得分倍率(增强版)
 */
export function getEnhancedComboMultiplier(combo: number, isFeverTime: boolean = false): number {
  let base = 1.0
  
  if (combo >= 13) base = 5.0
  else if (combo >= 9) base = 3.5
  else if (combo >= 6) base = 2.5
  else if (combo >= 4) base = 2.0
  else if (combo >= 2) base = 1.5
  
  // FEVER TIME额外x2
  if (isFeverTime) base *= 2
  
  return base
}

/**
 * 连击视觉特效配置
 */
export interface ComboVisualConfig {
  combo: number
  particleCount: number
  particleSpeed: number
  screenShakeIntensity: number
  textScale: number
  glowIntensity: number
}

export function getComboVisualConfig(combo: number): ComboVisualConfig {
  const effect = getComboEffect(combo)
  
  return {
    combo,
    particleCount: combo >= 13 ? 100 : combo >= 9 ? 60 : combo >= 6 ? 40 : combo >= 4 ? 20 : 10,
    particleSpeed: combo >= 9 ? 3 : combo >= 6 ? 2 : 1,
    screenShakeIntensity: combo >= 9 ? 8 : combo >= 6 ? 5 : combo >= 2 ? 3 : 0,
    textScale: combo >= 13 ? 3.0 : combo >= 9 ? 2.5 : combo >= 6 ? 2.0 : combo >= 2 ? 1.5 : 1.0,
    glowIntensity: combo >= 13 ? 1.0 : combo >= 9 ? 0.8 : combo >= 6 ? 0.6 : 0.3,
  }
}

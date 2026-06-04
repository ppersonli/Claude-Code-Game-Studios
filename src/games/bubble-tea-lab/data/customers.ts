import type { Customer, Achievement, GameState } from '@types'

export const CUSTOMERS: readonly Customer[] = [
  { name: '小美', img: `${import.meta.env.BASE_URL}assets/customer_girl.webp`, rarity: 'common', personalityId: 'student' },
  { name: '小明', img: `${import.meta.env.BASE_URL}assets/customer_boy.webp`, rarity: 'common', personalityId: 'office_worker' },
  { name: '酷哥', img: `${import.meta.env.BASE_URL}assets/customer_cool.webp`, rarity: 'common', personalityId: 'student' },
  { name: '甜心', img: `${import.meta.env.BASE_URL}assets/customer_sweet.webp`, rarity: 'common', personalityId: 'office_worker' },
  { name: '猫猫酱', img: `${import.meta.env.BASE_URL}assets/customer_catgirl.webp`, rarity: 'rare', tipBonus: 1.5, locked: true, unlockCost: 500, personalityId: 'blogger' },
  { name: '机器人', img: `${import.meta.env.BASE_URL}assets/customer_robot.webp`, rarity: 'rare', tipBonus: 1.5, locked: true, unlockCost: 800, personalityId: 'demon' },
  { name: 'VIP大人', img: `${import.meta.env.BASE_URL}assets/customer_vip.webp`, rarity: 'legendary', tipBonus: 2.0, locked: true, unlockCost: 1500, personalityId: 'vip' },
] as const

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'first_perfect', name: '初次完美', desc: '第一次完美调配', img: `${import.meta.env.BASE_URL}assets/achievement_first_perfect.webp`, check: (s: GameState) => s.perfectCount >= 1 },
  { id: 'combo5', name: '连击大师', desc: '达成5连击', img: `${import.meta.env.BASE_URL}assets/achievement_combo5.webp`, check: (s: GameState) => s.maxCombo >= 5 },
  { id: 'level5', name: '资深调配师', desc: '达到等级5', img: `${import.meta.env.BASE_URL}assets/achievement_level5.webp`, check: (s: GameState) => s.level >= 5 },
  { id: 'score100', name: '百分达人', desc: '获得100分', img: `${import.meta.env.BASE_URL}assets/achievement_100_score.webp`, check: (s: GameState) => s.score >= 100 },
  { id: 'combo10', name: '连击之神', desc: '达成10连击', img: `${import.meta.env.BASE_URL}assets/achievement_combo5.webp`, check: (s: GameState) => s.maxCombo >= 10 },
  { id: 'score500', name: '五百强', desc: '获得500分', img: `${import.meta.env.BASE_URL}assets/achievement_100_score.webp`, check: (s: GameState) => s.score >= 500 },
  { id: 'serve50', name: '服务之星', desc: '累计服务50杯', img: `${import.meta.env.BASE_URL}assets/achievement_level5.webp`, check: (s: GameState) => s.totalDrinksServed >= 50 },
  { id: 'daily_complete', name: '每日打卡', desc: '完成一次每日挑战', img: `${import.meta.env.BASE_URL}assets/badge_daily.webp`, check: (s: GameState) => s.dailyCompleted === true },
  { id: 'perfect_streak5', name: '完美五连', desc: '连续5次完美', img: `${import.meta.env.BASE_URL}assets/achievement_first_perfect.webp`, check: (s: GameState) => s.perfectCount >= 5 },
  { id: 'unlock_all_ingredients', name: '全料解锁', desc: '解锁所有食材', img: `${import.meta.env.BASE_URL}assets/achievement_level5.webp`, check: (s: GameState) => s.unlockedIngredients.length >= 5 },
] as const

export function isCustomerUnlocked(customer: Customer, unlockedNames: readonly string[]): boolean {
  if (!customer.locked) return true
  return unlockedNames.includes(customer.name)
}

export function selectCustomer(available: readonly Customer[], rand: number): Customer {
  const legendary = available.filter(c => c.rarity === 'legendary')
  const rare = available.filter(c => c.rarity === 'rare')
  const common = available.filter(c => c.rarity === 'common')

  if (legendary.length > 0 && rand < 0.05) {
    return legendary[Math.floor(rand * legendary.length)]
  } else if (rare.length > 0 && rand < 0.2) {
    return rare[Math.floor(rand * rare.length)]
  }
  return common.length > 0
    ? common[Math.floor(rand * common.length)]
    : available[0]
}

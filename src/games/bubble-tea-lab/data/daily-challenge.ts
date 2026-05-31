import type { DailyModifier } from '@types'

export const DAILY_MODIFIERS: readonly DailyModifier[] = [
  { name: '限时冲刺', desc: '限时60秒，服务尽可能多的顾客！', timeLimit: 60, scoreMultiplier: 1, icon: '⏰' },
  { name: '完美挑战', desc: '限时45秒，达成3次完美调配！', timeLimit: 45, scoreMultiplier: 1.5, icon: '✨', goal: { type: 'perfect', count: 3 } },
  { name: '等级冲刺', desc: '限时90秒，达到等级3！', timeLimit: 90, scoreMultiplier: 1.2, icon: '⬆️', goal: { type: 'level', count: 3 } },
  { name: '高分挑战', desc: '限时60秒，获得300分！', timeLimit: 60, scoreMultiplier: 2, icon: '🏆', goal: { type: 'score', count: 300 } },
  { name: '连击风暴', desc: '限时50秒，达成5连击！', timeLimit: 50, scoreMultiplier: 1.8, icon: '🔥', goal: { type: 'combo', count: 5 } },
] as const

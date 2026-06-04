/** Hero definitions per GDD section 3.3 */

export interface HeroDef {
  id: string
  name: string
  effect: string
  effectType: 'atk_boost' | 'aoe_boost' | 'speed_boost' | 'heal'
  effectValue: number
  unlockCondition: string
  unlockWave: number
  unlockPrestige: number
  color: number
}

export const HEROES: HeroDef[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    effect: '+20% tower attack damage',
    effectType: 'atk_boost',
    effectValue: 0.20,
    unlockCondition: 'Start',
    unlockWave: 0,
    unlockPrestige: 0,
    color: 0xE53935,
  },
  {
    id: 'mage',
    name: 'Mage',
    effect: '+30% AOE range',
    effectType: 'aoe_boost',
    effectValue: 0.30,
    unlockCondition: 'Reach wave 10',
    unlockWave: 10,
    unlockPrestige: 0,
    color: 0x7B1FA2,
  },
  {
    id: 'ranger',
    name: 'Ranger',
    effect: '+25% attack speed',
    effectType: 'speed_boost',
    effectValue: 0.25,
    unlockCondition: 'Reach wave 50',
    unlockWave: 50,
    unlockPrestige: 0,
    color: 0x2E7D32,
  },
  {
    id: 'priest',
    name: 'Priest',
    effect: 'Heal all towers over time',
    effectType: 'heal',
    effectValue: 5,
    unlockCondition: 'Prestige 2 times',
    unlockWave: 0,
    unlockPrestige: 2,
    color: 0xFFD600,
  },
]

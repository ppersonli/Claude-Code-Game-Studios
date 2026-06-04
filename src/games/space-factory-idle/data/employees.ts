/** Employee definitions per GDD */

export interface Employee {
  id: string
  name: string
  description: string
  effect: string
  baseCost: number
  costMultiplier: number
  icon: string
}

export const EMPLOYEES: Employee[] = [
  {
    id: 'intern',
    name: 'Intern',
    description: '+1 production line efficiency',
    effect: '+1 efficiency per line',
    baseCost: 50,
    costMultiplier: 1.15,
    icon: '👤',
  },
  {
    id: 'engineer',
    name: 'Engineer',
    description: '+10% output bonus',
    effect: '+10% output',
    baseCost: 200,
    costMultiplier: 1.12,
    icon: '👷',
  },
  {
    id: 'scientist',
    name: 'Scientist',
    description: 'Unlock new recipes',
    effect: 'Recipe unlock',
    baseCost: 1000,
    costMultiplier: 1.20,
    icon: '🧑‍🔬',
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Auto-upgrade production lines',
    effect: 'Auto-upgrade',
    baseCost: 5000,
    costMultiplier: 1.25,
    icon: '👔',
  },
  {
    id: 'director',
    name: 'Director',
    description: '+20% output on all planets',
    effect: '+20% global',
    baseCost: 20000,
    costMultiplier: 1.30,
    icon: '🎩',
  },
]

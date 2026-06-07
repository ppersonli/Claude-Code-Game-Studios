/**
 * Tutorial system for Dungeon Defense Idle.
 * Guides new players through core mechanics step by step.
 */

export interface TutorialStep {
  id: string
  title: string
  description: string
  order: number
  /** CSS selector or data-testid of the UI element to highlight */
  targetElement: string
}

export interface TutorialState {
  completedSteps: string[]
  currentStepIndex: number
  isActive: boolean
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'place-tower',
    title: 'Build Your Defense',
    description: 'Tap an empty grid cell to place an Arrow Tower. This is your first line of defense!',
    order: 1,
    targetElement: '[data-testid="phaser-container"]',
  },
  {
    id: 'start-wave',
    title: 'Start the Battle',
    description: 'Tap "Start Wave" to send monsters marching toward your tower.',
    order: 2,
    targetElement: '[data-testid="start-wave-btn"]',
  },
  {
    id: 'watch-combat',
    title: 'Watch the Action',
    description: 'Your towers automatically attack monsters. Earn gold for each kill!',
    order: 3,
    targetElement: '[data-testid="coin-display"]',
  },
  {
    id: 'upgrade-tower',
    title: 'Upgrade Your Tower',
    description: 'Tap a placed tower, then tap "⬆ Upgrade" to increase its damage.',
    order: 4,
    targetElement: '[data-testid="start-wave-btn"]',
  },
  {
    id: 'check-towers',
    title: 'Discover New Towers',
    description: 'Open the 🗼 tab to see all 6 tower types. New ones unlock as you progress!',
    order: 5,
    targetElement: '.tab-bar',
  },
  {
    id: 'prestige-intro',
    title: 'Prestige System',
    description: 'Once you earn 1M+ coins, reset for Dark Energy — a permanent damage multiplier!',
    order: 6,
    targetElement: '[data-testid="prestige-btn"]',
  },
]

export function getTutorialSteps(): TutorialStep[] {
  return [...TUTORIAL_STEPS]
}

export function startTutorial(): TutorialState {
  return {
    completedSteps: [],
    currentStepIndex: 0,
    isActive: true,
  }
}

export function markStepComplete(state: TutorialState, stepId: string): TutorialState {
  const alreadyCompleted = state.completedSteps.includes(stepId)
  const newCompleted = alreadyCompleted
    ? state.completedSteps
    : [...state.completedSteps, stepId]

  const allDone = newCompleted.length >= TUTORIAL_STEPS.length

  return {
    completedSteps: newCompleted,
    currentStepIndex: allDone ? TUTORIAL_STEPS.length : state.currentStepIndex + 1,
    isActive: !allDone,
  }
}

export function getNextStep(state: TutorialState): TutorialStep | null {
  if (isTutorialComplete(state)) return null

  const completed = new Set(state.completedSteps)
  const nextStep = TUTORIAL_STEPS.find(step => !completed.has(step.id))
  return nextStep ?? null
}

export function isTutorialComplete(state: TutorialState): boolean {
  return !state.isActive || state.completedSteps.length >= TUTORIAL_STEPS.length
}

export function getTutorialProgress(state: TutorialState): {
  completed: number
  total: number
  percentage: number
} {
  const total = TUTORIAL_STEPS.length
  const completed = state.completedSteps.length
  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  }
}

export function resetTutorial(): TutorialState {
  return startTutorial()
}

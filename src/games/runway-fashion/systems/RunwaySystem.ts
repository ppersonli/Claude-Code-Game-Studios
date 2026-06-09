import type { Theme } from '../data/types'

export type RunwayPhase = 'idle' | 'prepare' | 'walk' | 'pose' | 'done'

const PHASE_DURATIONS: Record<string, number> = {
  prepare: 3000,
  walk: 10000,
  pose: 3000,
}

const PHASE_ORDER: RunwayPhase[] = ['prepare', 'walk', 'pose', 'done']

export class RunwaySystem {
  private phase: RunwayPhase = 'idle'
  private timeRemaining = 0
  private theme: Theme | undefined
  private actionsPerformed: string[] = []
  private currentPhaseDuration = 0

  start(theme: Theme): void {
    this.theme = theme
    this.phase = 'prepare'
    this.timeRemaining = PHASE_DURATIONS.prepare
    this.currentPhaseDuration = PHASE_DURATIONS.prepare
    this.actionsPerformed = []
  }

  update(delta: number): void {
    if (this.phase === 'idle' || this.phase === 'done') return

    this.timeRemaining = Math.max(0, this.timeRemaining - delta)

    if (this.timeRemaining <= 0) {
      this.advanceToNextPhase()
    }
  }

  performAction(actionId: string): void {
    if (this.phase !== 'walk') return
    this.actionsPerformed.push(actionId)
  }

  getPhase(): RunwayPhase {
    return this.phase
  }

  getTheme(): Theme | undefined {
    return this.theme
  }

  getTimeRemaining(): number {
    return this.timeRemaining
  }

  getActionsPerformed(): string[] {
    return [...this.actionsPerformed]
  }

  isFinished(): boolean {
    return this.phase === 'done'
  }

  getFinalActions(): string[] {
    return [...this.actionsPerformed]
  }

  getPhaseProgress(): number {
    if (this.currentPhaseDuration === 0) return 0
    return Math.min(1, 1 - this.timeRemaining / this.currentPhaseDuration)
  }

  reset(): void {
    this.phase = 'idle'
    this.timeRemaining = 0
    this.theme = undefined
    this.actionsPerformed = []
    this.currentPhaseDuration = 0
  }

  private advanceToNextPhase(): void {
    const idx = PHASE_ORDER.indexOf(this.phase)
    if (idx < 0 || idx >= PHASE_ORDER.length - 1) {
      this.phase = 'done'
      return
    }
    this.phase = PHASE_ORDER[idx + 1]
    if (this.phase === 'done') {
      this.timeRemaining = 0
      this.currentPhaseDuration = 0
    } else {
      this.currentPhaseDuration = PHASE_DURATIONS[this.phase]
      this.timeRemaining = this.currentPhaseDuration
    }
  }
}

/**
 * Space Factory Idle — Random event system
 * Handles random events that affect production output.
 */

import { CONSTANTS } from './constants'
import type { GameState } from './game-state'

/* ── Event Data ─────────────────────────────────────────────────── */

export interface GameEvent {
  id: string
  nameKey: string
  duration: number // ms
  planetId: string | null // null = universal
  requiredPrestiges: number
  applyOutput: (output: number) => number
}

export const EVENTS: GameEvent[] = [
  {
    id: 'sandstorm',
    nameKey: 'event.sandstorm',
    duration: 30_000, // 30 seconds
    planetId: 'mars',
    requiredPrestiges: 0,
    applyOutput: (output) => output * 0.7, // -30%
  },
  {
    id: 'meteor_shower',
    nameKey: 'event.meteor_shower',
    duration: 60_000, // 60 seconds
    planetId: null, // universal
    requiredPrestiges: 0,
    applyOutput: (output) => output * 2, // x2
  },
  {
    id: 'alien_merchant',
    nameKey: 'event.alien_merchant',
    duration: 45_000, // 45 seconds
    planetId: null, // universal
    requiredPrestiges: 0,
    applyOutput: (output) => output, // no change (special effect)
  },
  {
    id: 'tech_breakthrough',
    nameKey: 'event.tech_breakthrough',
    duration: 90_000, // 90 seconds
    planetId: null, // universal
    requiredPrestiges: 5, // requires 5+ prestiges
    applyOutput: (output) => output * 1.5, // +50%
  },
  {
    id: 'black_hole',
    nameKey: 'event.black_hole',
    duration: 120_000, // 2 minutes
    planetId: null, // universal
    requiredPrestiges: 0,
    applyOutput: (output) => output * 3, // x3
  },
]

/* ── Event Functions ────────────────────────────────────────────── */

/**
 * Roll for a random event.
 * Returns null if no event triggers or if an event is already active.
 */
export function rollForEvent(state: GameState, planetId: string): GameEvent | null {
  // Don't stack events
  if (state.activeEvent) return null

  // Check if random roll passes
  if (Math.random() > CONSTANTS.EVENT_BASE_CHANCE) return null

  // Filter eligible events
  const eligible = EVENTS.filter(event => {
    // Check planet filter
    if (event.planetId !== null && event.planetId !== planetId) return false

    // Check prestige requirement
    if (event.requiredPrestiges > 0 && state.prestigeCount < event.requiredPrestiges) return false

    return true
  })

  if (eligible.length === 0) return null

  // Pick a random eligible event
  const index = Math.floor(Math.random() * eligible.length)
  return eligible[index]
}

/**
 * Activate an event on the state.
 */
export function activateEvent(state: GameState, event: GameEvent): void {
  state.activeEvent = event.id
  state.eventEndTime = Date.now() + event.duration
}

/**
 * Check if the active event has expired.
 * Returns true if event expired and clears it.
 */
export function checkEventExpiry(state: GameState): boolean {
  if (!state.activeEvent) return false

  if (Date.now() >= state.eventEndTime) {
    state.activeEvent = null
    state.eventEndTime = 0
    return true
  }

  return false
}

/**
 * Get the output multiplier for the current active event.
 */
export function getEventOutputMult(state: GameState): number {
  if (!state.activeEvent) return 1

  // Check if event has expired
  if (Date.now() >= state.eventEndTime) return 1

  const event = EVENTS.find(e => e.id === state.activeEvent)
  if (!event) return 1

  // Return the multiplier by applying to a reference value
  return event.applyOutput(1)
}

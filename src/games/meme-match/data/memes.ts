import type { Meme } from '@types'

/** All 15 meme characters with emoji placeholders. */
export const MEMES: readonly Meme[] = [
  // Tier 1 (Common)
  { id: 'doge', name: 'Doge', emoji: '🐕', tier: 1 },
  { id: 'pepe', name: 'Pepe', emoji: '🐸', tier: 1 },
  { id: 'wojak', name: 'Wojak', emoji: '😢', tier: 1 },
  { id: 'stonks', name: 'Stonks', emoji: '📈', tier: 1 },
  { id: 'this_is_fine', name: 'This Is Fine', emoji: '🔥', tier: 1 },

  // Tier 2 (Rare)
  { id: 'chad', name: 'Chad', emoji: '💪', tier: 2 },
  { id: 'npc', name: 'NPC', emoji: '🤖', tier: 2 },
  { id: 'soyjak', name: 'Soyjak', emoji: '😮', tier: 2 },
  { id: 'gigachad', name: 'GigaChad', emoji: '🗿', tier: 2 },
  { id: 'brain_expanding', name: 'Brain Expanding', emoji: '🧠', tier: 2 },

  // Tier 3 (Epic)
  { id: 'crying_cat', name: 'Crying Cat', emoji: '😿', tier: 3 },
  { id: 'surprised_pikachu', name: 'Surprised Pikachu', emoji: '😲', tier: 3 },
  { id: 'distracted_boyfriend', name: 'Distracted Boyfriend', emoji: '👀', tier: 3 },
  { id: 'roll_safe', name: 'Roll Safe', emoji: '🤔', tier: 3 },
  { id: 'drake', name: 'Drake', emoji: '🎤', tier: 3 },
] as const

/** Get a meme by id, or undefined if not found. */
export function getMemeById(id: string): Meme | undefined {
  return MEMES.find(m => m.id === id)
}

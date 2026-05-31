import { describe, it, expect } from 'vitest'
import { MEMES, getMemeById } from '../../src/games/meme-match/data/memes'

describe('MEMES', () => {
  it('has 15 memes', () => {
    expect(MEMES).toHaveLength(15)
  })

  it('each meme has required fields', () => {
    for (const meme of MEMES) {
      expect(meme.id).toBeTruthy()
      expect(meme.name).toBeTruthy()
      expect(meme.emoji).toBeTruthy()
      expect([1, 2, 3]).toContain(meme.tier)
    }
  })

  it('has unique ids', () => {
    const ids = MEMES.map(m => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has correct tier distribution (5 per tier)', () => {
    const tier1 = MEMES.filter(m => m.tier === 1)
    const tier2 = MEMES.filter(m => m.tier === 2)
    const tier3 = MEMES.filter(m => m.tier === 3)
    expect(tier1).toHaveLength(5)
    expect(tier2).toHaveLength(5)
    expect(tier3).toHaveLength(5)
  })

  it('has unique emojis', () => {
    const emojis = MEMES.map(m => m.emoji)
    expect(new Set(emojis).size).toBe(emojis.length)
  })
})

describe('getMemeById', () => {
  it('returns meme for valid id', () => {
    const meme = getMemeById('doge')
    expect(meme).toBeDefined()
    expect(meme!.name).toBe('Doge')
  })

  it('returns undefined for invalid id', () => {
    expect(getMemeById('nonexistent')).toBeUndefined()
  })
})

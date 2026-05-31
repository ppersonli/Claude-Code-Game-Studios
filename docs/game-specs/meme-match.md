# Game Spec: Meme Match (梗图记忆翻牌)

## Overview
A memory card-flip game with meme/internet culture characters. Players flip cards to find matching pairs before time runs out. Simple, addictive, and shareable.

## Why This Game
1. **3-second onboarding**: Everyone knows memory matching
2. **Viral potential**: "I matched all 20 pairs in 47s!" shareable scores
3. **Creative twist**: Meme characters instead of boring symbols
4. **Mobile-first**: Tap-to-flip works perfectly on touch
5. **NOT a classic clone**: Memory games exist but meme-themed ones are rare on CG/Poki
6. **Scalable content**: Add new meme sets as DLC/seasonal content

## Core Mechanics

### Gameplay Loop
1. Grid of face-down cards appears
2. Player taps a card → it flips to reveal a meme character
3. Player taps a second card → if match, both stay face-up; if not, both flip back
4. Goal: Match all pairs before timer runs out
5. Score = base points × time bonus × combo multiplier

### Grid Sizes (Difficulty Progression)
| Level | Grid | Pairs | Time | Unlock |
|-------|------|-------|------|--------|
| Easy | 4×3 | 6 | 60s | Default |
| Medium | 4×4 | 8 | 75s | Score 500 |
| Hard | 5×4 | 10 | 90s | Score 1500 |
| Expert | 6×4 | 12 | 100s | Score 3000 |
| Master | 6×5 | 15 | 120s | Score 5000 |

### Scoring
- Each match: +100 base points
- Combo bonus: consecutive matches without miss → ×1.5, ×2, ×2.5, ×3
- Time bonus: remaining time × 10 at end
- Perfect bonus (no misses): ×2 final multiplier

### Meme Characters (15 total for MVP)
Tier 1 (Common): Doge, Pepe, Wojak, Stonks, This Is Fine
Tier 2 (Rare): Chad, NPC, Soyjak, GigaChad, Brain Expanding
Tier 3 (Epic): Crying Cat, Surprised Pikachu, Distracted Boyfriend, Roll Safe, Drake

Each tier has distinct visual style:
- Tier 1: Simple, bold colors
- Tier 2: More detailed, gradient backgrounds
- Tier 3: Premium look, animated sparkle border

### Meta Systems
1. **Meme Collection**: Unlocked memes go into a collection book
2. **Daily Challenge**: Specific grid + character set, global leaderboard
3. **Themes**: Switch between "Classic Memes", "Food Memes", "Animal Memes"
4. **Streak System**: Daily login streak → bonus coins

## Technical Architecture

### File Structure
```
src/games/meme-match/
├── index.html
├── main.ts
├── App.vue
├── composables/
│   └── useGameLogic.ts      # Pure game state + logic (testable)
├── data/
│   ├── memes.ts             # Meme character definitions
│   └── levels.ts            # Level configurations
├── components/
│   ├── CardGrid.vue         # The card grid
│   ├── Card.vue             # Individual card with flip animation
│   ├── GameTimer.vue        # Countdown timer
│   ├── ScoreBoard.vue       # Score + combo display
│   └── MemeCollection.vue   # Collection book
└── assets/                  # Meme character images (generated)
```

### Shared Code to Reuse
- `src/shared/utils/index.ts` — pickRandomUnique, seededRandom, getDailySeed
- `src/shared/phaser/audio.ts` — audioEngine (adapt for Vue-only game)
- `src/types/index.ts` — extend with Meme types

### Build Integration
Add to `vite.config.ts` rollupOptions.input:
```ts
'meme-match': resolve(__dirname, 'src/games/meme-match/index.html'),
```

### Data Types
```ts
interface Meme {
  id: string
  name: string
  img: string           // path to webp
  tier: 1 | 2 | 3
  unlocked: boolean
}

interface CardState {
  id: number
  memeId: string
  flipped: boolean
  matched: boolean
}

interface GameLevel {
  id: number
  name: string
  cols: number
  rows: number
  timeLimit: number
  requiredScore: number
}

interface MatchResult {
  isMatch: boolean
  combo: number
  points: number
}
```

### Test Requirements (100% coverage)
1. **meme-match/game-logic.test.ts**
   - Card generation (correct pairs, randomization)
   - Match detection (correct/incorrect)
   - Scoring (base, combo, time bonus, perfect)
   - Game state transitions (start, playing, win, lose)
   - Timer countdown and game-over condition
   - Level unlocking logic

2. **meme-match/memes.test.ts**
   - All memes have required fields
   - Tier distribution is correct
   - IDs are unique

3. **meme-match/levels.test.ts**
   - Level configs are valid (rows×cols is even)
   - Progression is reasonable
   - Required scores are monotonically increasing

### Visual Design
- Background: Dark gradient (similar to BubbleTeaLab)
- Cards: Rounded rectangles with subtle shadow
- Flip animation: CSS 3D transform (perspective + rotateY)
- Match animation: Scale bounce + particle burst
- Miss animation: Shake + red flash
- Color palette: Purple/pink gradient theme

## Implementation Steps (for cc-game)
1. Create file structure + types
2. Implement pure game logic (useGameLogic.ts) — NO UI
3. Write comprehensive tests for game logic
4. Build Vue components (Card, CardGrid, GameTimer, ScoreBoard)
5. Wire up App.vue with all screens (start, game, result, collection)
6. Add CSS animations (flip, match, miss)
7. Integrate with vite.config.ts multi-entry
8. Generate meme character assets with Gemini API
9. Run full test suite, ensure 100% pass
10. Build and verify in browser

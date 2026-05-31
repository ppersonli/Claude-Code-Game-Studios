# Game Spec: Boba Sort (珍珠奶茶排序)

## Overview
A color-sorting puzzle game where players pour bubble tea ingredients between tubes to sort them by type. Kawaii bubble tea theme, ASMR satisfying pour animations, daily challenges. Combines the fastest-growing Casual Puzzle subgenre (Sort) with our existing bubble tea art assets.

## Why This Game
1. **Sort puzzles = #3 Casual Puzzle subgenre** — overtook Blast in 2026, $200M+/year
2. **3-second onboarding**: "Sort the colors into tubes" — everyone gets it instantly
3. **ASMR hook**: Satisfying pour animations + sound = TikTok shareable
4. **Daily challenges**: Date-seeded puzzles = return visits = more ad revenue
5. **Reuse assets**: All bubble tea ingredient .webp files from Bubble Tea Lab
6. **Hybrid casual potential**: Meta system (collection, progression, themes)
7. **Low competition on H5**: Most sort games are low-quality clones

## Core Mechanics

### Gameplay Loop
1. N tubes filled with mixed bubble tea ingredients (boba, taro, mango, etc.)
2. Player taps a tube → selects top ingredient → taps another tube to pour
3. Can only pour onto same ingredient OR into empty tube
4. Goal: Each tube contains only one type of ingredient
5. Score = moves efficiency × speed bonus × combo multiplier

### Difficulty Progression
| Level | Tubes | Ingredient Types | Items/Type | Target Moves |
|-------|-------|-----------------|------------|-------------|
| Easy | 4 | 3 | 4 | 15 |
| Medium | 5 | 4 | 4 | 25 |
| Hard | 6 | 5 | 4 | 35 |
| Expert | 7 | 6 | 4 | 50 |
| Master | 8 | 7 | 4 | 70 |

### Scoring
- Complete puzzle: +100 base
- Under target moves: +50 bonus
- Under target time: +50 bonus
- Combo: consecutive perfect sorts → ×1.5, ×2, ×2.5, ×3
- Stars: 3-star system (moves efficiency)

### Meta Systems
1. **Daily Challenge**: Same puzzle for all players, global leaderboard
2. **Ingredient Collection**: Unlock new ingredients (rare/legendary)
3. **Themes**: Classic, Ocean, Galaxy, Neon
4. **Streak System**: Daily login streak → bonus coins
5. **Achievement System**: Speed runs, perfect clears, combo chains

## Technical Architecture

### File Structure
```
src/games/boba-sort/
├── index.html
├── main.ts
├── App.vue
├── composables/
│   └── useGameLogic.ts      # Pure game state + logic (testable)
├── data/
│   ├── ingredients.ts       # Ingredient definitions (reuse from bubble-tea)
│   └── levels.ts            # Level configurations
├── components/
│   ├── TubeGrid.vue         # The tube grid
│   ├── Tube.vue             # Individual tube with pour animation
│   ├── GameTimer.vue        # Optional timer
│   ├── ScoreBoard.vue       # Score + stars display
│   └── DailyChallenge.vue   # Daily puzzle preview
└── assets/                  # Reuse from bubble-tea
```

### Shared Code to Reuse
- `src/shared/utils/index.ts` — seededRandom, getDailySeed
- `src/shared/phaser/audio.ts` — audioEngine
- `src/types/index.ts` — extend with Sort types
- `src/services/AdManager.ts` — CG SDK integration

### Data Types
```ts
interface SortIngredient {
  id: string
  name: string
  img: string
  color: string
  tier: 1 | 2 | 3
}

interface Tube {
  id: number
  contents: string[]  // ingredient IDs, bottom to top
  capacity: number    // max 4
}

interface SortLevel {
  id: number
  name: string
  tubes: number
  ingredientTypes: number
  itemsPerType: number
  targetMoves: number
  targetTime: number  // seconds
  requiredStars: number  // to unlock
}

interface SortState {
  tubes: Tube[]
  level: SortLevel
  moves: number
  score: number
  stars: number
  combo: number
  maxCombo: number
  selectedTube: number | null
  gameOver: boolean
  timeElapsed: number
  dailySeed: number
  totalCoins: number
  achievements: string[]
  unlockedThemes: string[]
  currentTheme: string
}
```

### Test Requirements (100% coverage)
1. **boba-sort/game-logic.test.ts**
   - Tube initialization (correct distribution)
   - Pour validation (same type, empty tube, full tube)
   - Win detection (all tubes sorted)
   - Scoring (base, moves bonus, time bonus, combo)
   - Star calculation (1-3 stars based on efficiency)
   - Undo functionality
   - Level unlocking logic

2. **boba-sort/levels.test.ts**
   - Level configs are solvable
   - Progression is reasonable
   - Required stars are monotonically increasing

3. **boba-sort/daily-challenge.test.ts**
   - Same seed produces same puzzle
   - Daily puzzle is solvable

### Visual Design
- Background: Gradient pastel (pink/purple)
- Tubes: Glass-like translucent with ingredient icons
- Pour animation: CSS transition (smooth slide down/up)
- Sort complete: Particle burst + bounce
- Color palette: Warm pastels (matching bubble tea theme)

### Ad Integration
- Midgame ad every 5 levels
- Rewarded ad: "🎬 Extra Tube" (adds 1 empty tube)
- Rewarded ad: "🎬 Undo 3 Moves" (after using all undos)

## Implementation Steps (for cc-game)
1. Create file structure + types
2. Implement pure game logic (useGameLogic.ts) — NO UI
3. Write comprehensive tests for game logic
4. Build Vue components (Tube, TubeGrid, ScoreBoard)
5. Wire up App.vue with all screens (start, game, result, daily)
6. Add CSS animations (pour, sort, bounce)
7. Integrate with vite.config.ts multi-entry
8. Integrate CG SDK via AdManager
9. Run full test suite, ensure 100% pass
10. Build and verify in browser

## Revenue Projection
- Sort puzzle category: $200M/year
- H5 eCPM (US/EU): $3-8
- Target: 500 DAU × 2 ads/session × $5 eCPM = $5/day = $150/month
- With daily challenges driving retention: D1 30-40%, D7 15-20%

# Block Blast Kawaii — Game Design Spec

## Overview
Block Blast Kawaii is a block puzzle grid game where players place tetromino-style blocks on a grid, clearing complete rows and columns. Kawaii animal-themed blocks with particle effects on clear. Combo multiplier system for multiple clears.

## Why This Game
- **Block Blast Master is #1 on CG** — proven mechanic with massive audience
- **No block puzzle in our portfolio** — fills a gap
- **Simple to learn, hard to master** — perfect for casual + retention
- **Daily challenges** — retention hook

## Core Mechanics

### Gameplay Loop
1. Player sees a 10×10 grid
2. 3 random blocks appear at bottom (tetromino shapes: I, O, T, L, S, Z, J)
3. Player drags a block onto the grid
4. Block snaps to grid cells
5. Complete rows/columns clear with particle effects
6. Combo multiplier: clearing multiple lines = more points
7. Game over when no more blocks can be placed

### Scoring
- 1 line: 100 points × combo
- 2 lines: 300 points × combo
- 3 lines: 600 points × combo
- 4 lines: 1000 points × combo
- Combo: +1 for each consecutive multi-line clear

### Difficulty Progression
- Levels 1-5: 5 block shapes, slow pace
- Levels 6-10: 7 block shapes, medium pace
- Levels 11+: All 8 shapes, fast pace, occasional special blocks

### Special Blocks (Ad Placements)
- **Bomb Block**: Clears 3×3 area (watch rewarded ad to get one)
- **Wildcard Block**: Fits anywhere (extra block choice)
- **Undo**: Revert last move (watch ad)

## Technical Architecture

### File Structure
```
src/games/block-blast-kawaii/
├── index.html           # Entry point
├── main.ts              # Vue mount
├── App.vue              # Main game component
├── composables/
│   ├── useGrid.ts       # Grid state (10×10 array)
│   ├── useBlock.ts      # Block shapes, rotation, placement
│   ├── useScoring.ts    # Score calculation, combos
│   └── useGameState.ts  # Save/load, level progression
├── components/
│   ├── GameBoard.vue    # Grid rendering
│   ├── BlockQueue.vue   # Shows next 3 blocks
│   ├── ScoreDisplay.vue # Score + combo
│   └── GameOver.vue     # Game over screen
└── assets/
    └── (Gemini-generated kawaii animal blocks)
```

### Shared Code to Reuse
- `src/shared/utils/index.ts` — seededRandom, getDailySeed
- `src/shared/vue/SocialPanel.vue` — share/favorite
- `src/shared/vue/LeaderboardPanel.vue` — score display
- `src/services/AdManager.ts` — ad integration
- `src/services/LeaderboardManager.ts` — score submission

### Data Types (src/types/index.ts)
```typescript
interface Block {
  shape: number[][]  // 2D matrix
  color: string
  type: 'I' | 'O' | 'T' | 'L' | 'S' | 'Z' | 'J'
}

interface GameState {
  grid: (string | null)[][]  // 10×10, null = empty
  score: number
  level: number
  combo: number
  blocksPlaced: number
}
```

### CSS/Visual Design
- **Grid**: 10×10, each cell 40×40px (desktop), responsive for mobile
- **Blocks**: Kawaii animal-themed (cat, dog, bunny, etc.) with cute faces
- **Clear Effect**: Particle burst + sparkle animation
- **Background**: Soft pastel gradient
- **Font**: Fredoka One for score, Nunito for UI

## Test Requirements

### Unit Tests (100% coverage)
1. `useGrid.ts` — grid creation, cell occupancy, line clearing
2. `useBlock.ts` — block shapes, rotation, collision detection
3. `useScoring.ts` — score calculation, combo multiplier
4. `useGameState.ts` — save/load, level progression

### Edge Cases to Test
- Block placement at grid edges
- Rotation near walls
- Multiple line clears in one move
- Game over detection (no valid placements)
- Score overflow (very high scores)
- Save/load corruption handling

### Integration Tests
- Game startup and initial state
- Block drag and drop
- Line clear animation trigger
- Game over detection and restart

## Implementation Steps

1. Create file structure (index.html, main.ts, App.vue)
2. Implement useGrid.ts (grid state, line clearing)
3. Implement useBlock.ts (block shapes, rotation, placement)
4. Implement useScoring.ts (score, combos)
5. Implement useGameState.ts (save/load, levels)
6. Build GameBoard.vue (grid rendering)
7. Build BlockQueue.vue (next blocks display)
8. Build ScoreDisplay.vue (score + combo)
9. Build GameOver.vue (game over screen)
10. Add CSS animations (clear effects, transitions)
11. Integrate AdManager (undo, bomb, extra block)
12. Integrate SocialPanel + LeaderboardPanel
13. Write all unit tests (100% coverage)
14. Write integration tests
15. Run npx vitest run — all pass
16. Run npx vue-tsc --noEmit — no errors
17. Register in vite.config.ts
18. Build and verify

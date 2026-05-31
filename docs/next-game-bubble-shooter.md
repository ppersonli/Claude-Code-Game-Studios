# Next Game: Bubble Shooter

Create a new game: bubble-shooter (Bubble Shooter / Boba Shooter).

## Core Gameplay
- Bottom launcher shoots colored boba/ingredient bubbles
- 3+ same-color bubbles connected = pop/eliminate
- Bubbles stick to top or other bubbles on contact
- Clear all bubbles = level complete

## Bubble Colors (6 types)
- Strawberry Pink
- Matcha Green
- Mango Yellow
- Blueberry Purple
- Coconut White
- Caramel Brown

## Technical Requirements
- Phaser 3 + Vue 3 + TypeScript
- Pure code rendering (circles + gloss effect), no image assets needed
- 50 levels (difficulty increases: more colors, fewer shots allowed)
- Level select screen
- Score system + localStorage save
- CG SDK integration (AdManager)
- ResultScene with 2x Score rewarded video
- 60+ unit tests covering core logic
- CG submission package to /tmp/cg-submit/bubble-shooter/
- Update vite.config.ts with new entry point
- Update tests/index.test.ts if needed

## Style
- Kawaii aesthetic
- Rounded UI
- Pink/purple gradient theme
- Emoji decorations where appropriate

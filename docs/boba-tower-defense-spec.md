# Boba Tower Defense — Game Design Spec

## Concept
**Merge + Tower Defense hybrid** with cute boba tea theme. Players place boba tea towers along a path to defend against waves of "sour" enemies (lemons, limes, vinegar bottles). Merge identical towers to upgrade them.

## Why This Game
- **Market:** TD market $7.73B (2026), 9% CAGR
- **Trend:** Merge+TD is #1 trending hybrid on both CrazyGames and Poki
- **Gap:** ZERO TD games in our 16-game portfolio
- **Unique:** Cute boba theme is unexplored in TD genre (all competitors use military/fantasy)
- **Reuse:** Merge mechanics from bubble-tea-merge, art style from existing games

## Core Mechanics

### Tower Types (5)
1. **Classic Boba** — shoots tapioca pearls (basic, single target)
2. **Taro Blaster** — area damage (splash)
3. **Matcha Sniper** — long range, slow fire, high damage
4. **Fruit Tea Slows** — slows enemies (debuff)
5. **Brown Sugar Boss** — chain lightning (hits multiple)

### Enemies (5 types)
1. **Lemon Scout** — fast, low HP
2. **Lime Tank** — slow, high HP
3. **Vinegar Flyer** — ignores path (flies over)
4. **Ginger Boss** — spawns minions
5. **Citrus Swarm** — many weak enemies

### Merge System
- Place 2 identical towers → merge into Level 2
- Place 2 Level 2 → merge into Level 3
- Max Level 3 per tower
- Merge increases: damage, range, special effect
- Visual: tower gets bigger, more decorations, sparkles

### Map Design
- Single path (S-curve or spiral)
- 10 waves per level
- 5 levels (unlockable)
- Boss wave every 5th wave

### Progression
- Stars (1-3) based on lives remaining
- Coins earned per wave
- Unlock new towers between levels
- Daily challenge (random modifier)

## Technical Architecture

### Files to Create
```
src/games/boba-tower-defense/
├── index.html
├── main.ts                    # Vue entry
├── App.vue                    # Vue wrapper
├── logic/
│   ├── constants.ts           # Tower/enemy/wave data
│   ├── types.ts               # TypeScript interfaces
│   ├── pathfinding.ts         # Enemy path logic
│   ├── wave.ts                # Wave spawning
│   ├── tower.ts               # Tower placement + targeting
│   ├── merge.ts               # Merge logic
│   └── __tests__/
│       ├── pathfinding.test.ts
│       ├── wave.test.ts
│       ├── tower.test.ts
│       └── merge.test.ts
├── phaser/
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── MenuScene.ts
│   │   ├── GameScene.ts
│   │   └── ResultScene.ts
│   ├── objects/
│   │   ├── Tower.ts           # Tower sprite + behavior
│   │   ├── Enemy.ts           # Enemy sprite + movement
│   │   └── Projectile.ts      # Bullet/pearl physics
│   └── helpers.ts
└── save.ts                    # LocalStorage save/load
```

### Key Technical Requirements
- **Path:** Pre-defined waypoints, enemies follow path
- **Targeting:** Towers target nearest enemy in range
- **Merge:** Drag tower onto identical tower to merge
- **Waves:** Timer-based spawning with increasing difficulty
- **Performance:** Object pooling for projectiles, max 50 enemies on screen
- **Mobile:** Touch to place, drag to merge, pinch to zoom

## Monetization
- **Rewarded Video:** Extra life, 2x coins, free tower
- **Interstitial:** Between levels (max 1 per 3 min)
- **Hybrid:** Cosmetic tower skins (future IAP)

## Success Metrics
- D1 retention: 35%+ (TD benchmark)
- Session length: 5-8 min (casual TD)
- ARPDAU: $0.10-$0.15
- Poki review: pass on first submission

## Art Style
- Cute kawaii boba tea theme (reuse existing assets)
- Towers: adorable boba cups with different toppings
- Enemies: cute but menacing sour fruits
- Path: colorful candy/tea themed
- Background: pastel gradient (pink/purple/teal)
- Particles: tapioca pearls, sparkles, fruit juice splashes

## Competitive Analysis (CrazyGames TD)
| Game | Rating | Our Advantage |
|------|--------|---------------|
| Mage Castle Idle Defense | — | Cuter art, merge mechanic |
| Tower Swap | — | Our merge is more intuitive |
| Brainrot Tower Defence | 9.3 | More polished, better art |
| Wall Wars | 8.9 | Our theme is more accessible |
| Kingdom Rush | — | We're free, browser-based |

## Development Timeline
- Day 1: Constants, types, pathfinding, merge logic + tests
- Day 2: Phaser scenes, tower/enemy objects
- Day 3: Wave system, UI, save/load
- Day 4: Polish, CG packaging, art assets
- Day 5: Submit to CrazyGames + Poki

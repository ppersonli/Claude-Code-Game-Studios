# CC Games - Game Status

## 2026-06-06 Cron Run — idle-garden Complete

### Portfolio Summary (Active Games)

| Game | Status | Unit Tests | E2E Tests | CG Package | Size |
|------|--------|------------|-----------|------------|------|
| bubble-tea-lab | ✅ Existing | ✅ | ✅ | ✅ | — |
| space-factory-idle | ✅ Complete | 196 ✅ | 17 ✅ | ✅ | 3.8MB |
| dungeon-defense-idle | ✅ Complete | — | 14 ✅ | ✅ | 1.6MB |
| orbit-odyssey | ✅ Existing | ✅ | ✅ | ✅ | — |
| space-farm-idle | ✅ Complete | 107 ✅ | 14/15 ✅ | ✅ | 1.1MB |
| **bounce-golf** | **✅ Complete** | **113 ✅** | **17 ✅** | **✅** | **29KB** |
| **idle-garden** | **✅ Ready** | **256 ✅** | **—** | **✅** | **1.3MB** |

### Test Results (2026-06-05)
- **idle-garden tests**: 256 passed ✅ (13 test files)
- **All games verified**: Production logic, save system, inflation, prestige, multipliers

### idle-garden — DEVELOPMENT STATUS (2026-06-05)

#### ✅ Phase 1: Core Systems (Complete)
- CurrencySystem: addCoins, spendCoins, canAfford, calcIncomePerSecond
- GardenSystem: plantFlower, harvestPot, waterPot, autoHarvest, autoWater
- PrestigeSystem: canPrestige, performPrestige, buySunPointUpgrade
- GameState: loadState, saveState, resetState, offline earnings

#### ✅ Phase 2: Complete Gameplay (Complete)
- 6 flower types (Sunflower, Tulip, Rose, Peony, Orchid, Rainbow)
- Upgrade shop (Auto-harvest, Auto-water, Growth Speed, Price Bonus)
- Prestige system (Sun Points, Growth/Price upgrades)
- Local save/load with localStorage
- Offline earnings (50% efficiency, 8hr cap)
- Leveling system with XP
- Seed selector UI
- 6 language support (EN, PT, ES, ID, TR, RU)

#### ✅ Phase 3: Art Assets & UI (Complete)
- 14 Gemini-generated art assets (bg-game, bg-menu, flowers, pot, coin, buttons, icon)
- Phaser GameScene with sprite-based rendering
- Settings screen (language, reset progress)
- Auto-save every 30s
- CG SDK integration (ads, gameplay tracking)

#### ✅ Phase 4: New Systems (Complete - TDD)
- **Decoration System**: 8 decorations, buy/display, bonus effects
  - Tests: decorations.test.ts (8 tests)
- **Achievements System**: 12 achievements, milestone rewards
  - Tests: achievements.test.ts (22 tests)
- **Daily Challenges**: 5 challenge templates, daily rotation, claim rewards
  - Tests: challenges.test.ts (33 tests)

#### ✅ Phase 5: Testing & Polish (Complete)
- [x] 256 unit tests passing (13 test files)
- [x] Vite build succeeds
- [x] All art assets verified (>5KB each)

#### ✅ Phase 6: CG Submission Package (Ready)
- [x] CG SDK integrated (CrazyGames SDK v3)
- [x] Package built: `dist/cg-idle-garden.zip` (1.3MB, 20 files)
- [x] index.html at root, all assets included
- [ ] Submit to CG Basic Launch (manual step)

### Git History (idle-garden)
```
c6592a9 feat(idle-garden): add decorations, achievements, and daily challenges systems (TDD)
0a90d5f feat(idle-garden): wire upgrades, use art assets, add settings screen
7f00717 feat(idle-garden): add all Gemini-generated art assets
fb4f69f feat(idle-garden): Phase 2 Phaser scenes, Vue UI, and i18n with TDD
ab3c45a feat(idle-garden): Phase 1 core systems with TDD — CurrencySystem, GardenSystem, PrestigeSystem
```

### Research Report Status
- **Report**: `~/Documents/Obsidian Vault/共享/Hermes Skills/game-research-report.md` (765 lines, 11 updates)
- **Status**: ✅ Complete — 6-platform research + 5 rounds of debate + competitive analysis
- **Recommendations**: Space Factory Idle (首选), Dungeon Defense Idle (蓝海), Space Farm Idle (推荐)
- **All 3 recommendations implemented**

### Next Steps
1. Submit idle-garden to CG Basic Launch (manual step — package ready at `dist/cg-idle-garden.zip`)
2. Monitor QA results for all submitted games
3. Iterate based on CG Basic Launch data

### Portfolio History
- bubble-tea-lab: Original game, kept as reference
- orbit-odyssey: Space exploration, completed
- space-factory-idle: #1 recommended game, completed 2026-06-03
- dungeon-defense-idle: #2 recommended (blue ocean), completed 2026-06-03
- space-farm-idle: #3 recommended, completed 2026-06-03
- bounce-golf: Mini-golf game, completed 2026-06-04
- idle-garden: Garden tycoon idle game, in progress 2026-06-05

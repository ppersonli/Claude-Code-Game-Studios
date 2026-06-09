# CC Games - Game Status

## 2026-06-09 Cron Run — Runway Fashion Complete

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
| **cafe-tycoon** | **✅ Complete** | **114 ✅** | **—** | **✅** | **910KB** |

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

### cafe-tycoon — DEVELOPMENT STATUS (2026-06-08)

#### ✅ Phase 1: Core Systems (Complete)
- EconomySystem: addCoins, spendCoins, canAfford, calculateEarnings
- SpawnSystem: customer generation timing, spawn rate
- SaveManager: load/save game state with localStorage
- OfflineRewardSystem: offline earnings calculation

#### ✅ Phase 2: Game Scenes (Complete)
- BootScene: asset loading with real Gemini-generated art
- MenuScene: main menu with background image
- GameScene: core gameplay loop with customer spawning

#### ✅ Phase 3: Art Assets (Complete)
- 5 Gemini-generated art assets (bg-game, bg, barista, customer, icon)
- All assets >5KB, webp format
- Phaser sprites using real images instead of emojis/rectangles

#### ✅ Phase 4: Testing (Complete)
- 114 unit tests passing (12 test files)
- EconomySystem, SpawnSystem, SaveManager, XPSystem, LevelSystem
- AchievementSystem, DrinkUnlockSystem, GameOrchestrator, OfflineRewardSystem
- AdIntegration, CGSdkIntegration

#### ✅ Phase 5: CG SDK Integration (Complete)
- AdManager integrated in main.ts
- gameplayStart/gameplayStop calls in GameScene
- Midgame ads every 8 customers served

#### ✅ Phase 6: Build & Package (Complete)
- Added to vite.config.ts build
- Added to game launcher (App.vue)
- CG package: dist/cg-cafe-tycoon.zip (910KB, 17 files)
- All art assets verified (>5KB each)

### Portfolio History
- bubble-tea-lab: Original game, kept as reference
- orbit-odyssey: Space exploration, completed
- space-factory-idle: #1 recommended game, completed 2026-06-03
- dungeon-defense-idle: #2 recommended (blue ocean), completed 2026-06-03
- space-farm-idle: #3 recommended, completed 2026-06-03
- bounce-golf: Mini-golf game, completed 2026-06-04
- idle-garden: Garden tycoon idle game, completed 2026-06-05
- cafe-tycoon: Coffee shop tycoon, completed 2026-06-08
- **pizza-slice-master**: Pizza cutting arcade, in progress 2026-06-08

### pizza-slice-master — DEVELOPMENT STATUS (2026-06-08)

#### ✅ Phase 1: Core Systems (Complete - TDD)
- **CuttingSystem**: processCut, precision calculation, score calculation, quality determination
  - Tests: CuttingSystem.test.ts (19 tests)
- **LevelSystem**: level calculation, ingredient/knife unlocking, level completion tracking
  - Tests: LevelSystem.test.ts (14 tests)
- **KnifeSystem**: knife selection, unlocking, purchase, stats
  - Tests: KnifeSystem.test.ts (12 tests)
- **UpgradeSystem**: upgrade levels, cost calculation, purchase, effects
  - Tests: UpgradeSystem.test.ts (15 tests)

#### ✅ Phase 2: Data Files (Complete)
- ingredients.ts: 5 ingredient types (pizza, cake, fruit, sushi, chocolate)
- knives.ts: 5 knife types with different stats
- levels.ts: 25 levels with increasing difficulty
- upgrades.ts: 5 upgrade types

#### ⏳ Phase 3: Game Scenes (Pending)
- BootScene, MenuScene, GameScene, LevelSelectScene, ShopScene
#### ✅ Phase 4: Testing (Complete)
- 67 unit tests passing (5 test files)
- CuttingSystem: 19 tests
- LevelSystem: 14 tests
- KnifeSystem: 12 tests
- UpgradeSystem: 15 tests
- SaveManager: 7 tests

#### ⏳ Phase 5: Art Assets (Queued)
- 9 art requests queued in asset-requests.md
- Waiting for Gemini art worker to process

#### ⏳ Phase 6: Build & Package (Pending)
- Vite build, CG SDK integration, package

### Test Results (2026-06-08)
- **pizza-slice-master tests**: 67 passed ✅ (5 test files)
- **axolotl-clicker tests**: 198 passed ✅ (10 test files)

### Portfolio Summary (Updated 2026-06-08)

| Game | Status | Unit Tests | CG Package | Size |
|------|--------|------------|------------|------|
| bubble-tea-lab | ✅ Existing | ✅ | ✅ | — |
| space-factory-idle | ✅ Complete | 196 ✅ | ✅ | 3.8MB |
| dungeon-defense-idle | ✅ Complete | — | ✅ | 1.6MB |
| orbit-odyssey | ✅ Existing | ✅ | ✅ | — |
| space-farm-idle | ✅ Complete | 107 ✅ | ✅ | 1.1MB |
| **bounce-golf** | **✅ Complete** | **113 ✅** | **✅** | **29KB** |
| **idle-garden** | **✅ Ready** | **256 ✅** | **✅** | **1.3MB** |
| **cafe-tycoon** | **✅ Complete** | **114 ✅** | **✅** | **910KB** |
| **axolotl-clicker** | **✅ Complete** | **198 ✅** | **✅** | **6.7MB** |
| pizza-slice-master | ⏳ In Progress | 67 ✅ | ⏳ | — |
| **runway-fashion** | **✅ Complete** | **130 ✅** | **—** | **✅** | **2.9MB** |

---

## 2026-06-09 Cron Run — Runway Fashion Complete

### runway-fashion — DEVELOPMENT STATUS (2026-06-09)

#### ✅ Phase 1: Core Systems (Complete - TDD)
- **ScoringSystem**: style match, coordination, performance, creativity, total score, grade
  - Tests: scoring-system.test.ts
- **DressUpSystem**: equip, unequip, getOutfit, swap, completion ratio
  - Tests: dressup-system.test.ts
- **RunwaySystem**: phase management (prepare/walk/pose/done), action tracking, timer
  - Tests: runway-system.test.ts
- **ThemeSystem**: theme selection, weekly themes, style hints, theme match calculation
  - Tests: theme-system.test.ts
- **SaveSystem**: load/save, coins, high score, clothing collection, grade tracking
  - Tests: save-system.test.ts

#### ✅ Phase 2: Data Files (Complete)
- types.ts: Clothing, Theme, ScoringConfig, Grade, ScoreBreakdown, RunwayAction
- clothing.ts: 15 clothing items (5 categories × 3 items)
- themes.ts: 5 themes (evening_gala, campus, street, beach, hollywood)
- scoring.ts: scoring weights, grade thresholds, runway actions
- constants.ts: game dimensions, phase durations, UI constants

#### ✅ Phase 3: Phaser Scenes (Complete)
- BootScene: asset loading with progress bar
- MenuScene: title screen with animated icon, play button
- ThemeSelectScene: theme selection with locked/unlocked states
- DressUpScene: clothing grid, tabs, model preview, style score bar
- RunwayScene: T台 walking, action buttons, judges, timer
- ResultScene: score breakdown, grade badge, coins earned, rewarded ad

#### ✅ Phase 4: Art Assets (Complete)
- 26 Gemini-generated art assets (>5KB each)
- bg-menu.webp, bg-runway.webp, bg-dressup.webp
- icon.webp, icon_coin.webp
- 15 clothing sprites (top, bottom, shoes, accessory, hair)
- models/, effects/, ui/ subdirectories

#### ✅ Phase 5: Build & CG Package (Complete)
- Vite build succeeds
- CG SDK integrated (AdManager in main.ts, rewarded ads in ResultScene)
- Package: dist/cg-runway-fashion.zip (2.9MB)
- All art assets verified (>5KB each)

#### ✅ Phase 6: Testing (Complete)
- 130 unit tests passing (5 test files)
- scoring-system.test.ts
- dressup-system.test.ts
- runway-system.test.ts
- theme-system.test.ts
- save-system.test.ts

### Git History (runway-fashion)
```
2026-06-09: Core systems (TDD), Phaser scenes, Vue app, art assets, build, CG package
```

### Next Steps
1. Submit to CrazyGames Basic Launch (manual)
2. Add more clothing items (expand from 15 to 50+)
3. Add weekly theme rotation
4. Add collection/gallery system
5. Polish: sound effects, particle effects
6. Test on mobile devices

---

## 2026-06-08 Cron Run — Axolotl Clicker Complete

### axolotl-clicker — DEVELOPMENT STATUS (2026-06-08)

#### ✅ Phase 1: Core Systems (Complete - TDD)
- **ClickSystem**: click value calculation, click upgrades, cost scaling
  - Tests: click.test.ts (17 tests)
- **IdleSystem**: production calculation, buy/upgrade axolotls, slot management
  - Tests: idle.test.ts (29 tests)
- **UpgradeSystem**: production speed, offline efficiency, quality boost
  - Tests: upgrade.test.ts (24 tests)
- **PrestigeSystem**: stardust calculation, prestige reset, multiplier
  - Tests: prestige.test.ts (17 tests)
- **SaveSystem**: create/save/load/reset state, offline earnings, play time
  - Tests: save.test.ts (22 tests)
- **AchievementSystem**: 15 achievements, milestone detection, award logic
  - Tests: achievement.test.ts (19 tests)

#### ✅ Phase 2: Data & Utils (Complete)
- axolotls.ts: 7 axolotl types (Pink Classic → Cosmic)
- constants.ts: all game constants, cost/formula functions
- types.ts: GameState, AxolotlInstance, AxolotlData
- numberFormat.ts: large number formatting (K/M/B/T)
- Tests: axolotls.test.ts (12 tests), numberFormat.test.ts (8 tests)

#### ✅ Phase 3: UI Systems (Complete - TDD)
- **UpgradePanelSystem**: available upgrades with cost/affordability
  - Tests: upgrade-panel.test.ts (10 tests)
- **PrestigeSummarySystem**: prestige preview with resets/preserves
  - Tests: prestige-summary.test.ts (12 tests)

#### ✅ Phase 4: Phaser Scenes (Complete)
- BootScene: asset loading with progress bar
- MenuScene: title screen with PLAY button
- GameScene: full gameplay with axolotl slots, upgrade buttons, prestige

#### ✅ Phase 5: Vue App (Complete)
- App.vue: Menu, Game, Shop, Prestige, Settings screens
- Phaser integration via container
- CG SDK ads integration (midgame + rewarded)
- Offline earnings popup with 2x ad bonus
- Achievement toasts

#### ✅ Phase 6: Art Assets (Complete)
- 10 Gemini-generated art assets (>5KB each)
- bg-menu.webp, bg-game.webp, coin.webp
- 7 axolotl sprites (pink, blue, golden, purple, rainbow, deep, cosmic)

#### ✅ Phase 7: Build & Package (Complete)
- Vite build succeeds
- CG SDK integrated (v3)
- Package: dist/cg-axolotl-clicker.zip (6.7MB)
- All art assets verified (>5KB each)

### Test Results Summary
- **axolotl-clicker**: 198 passed ✅ (10 test files)
  - click.test.ts: 17 tests
  - idle.test.ts: 29 tests
  - upgrade.test.ts: 24 tests
  - prestige.test.ts: 17 tests
  - save.test.ts: 22 tests
  - achievement.test.ts: 19 tests
  - axolotls.test.ts: 12 tests
  - numberFormat.test.ts: 8 tests
  - upgrade-panel.test.ts: 10 tests
  - prestige-summary.test.ts: 12 tests

### Git History (axolotl-clicker)
```
Previous sessions: Core systems, data files, Phaser scenes, Vue app
2026-06-08: CG package created, GAME_STATUS.md updated
```

### Next Steps
1. Submit to CrazyGames Basic Launch (manual)
2. Polish: consider adding sound effects, particle effects
3. Test on mobile devices

---

## 2026-06-08 Cron Run — Gravity Merge Complete

### gravity-merge — DEVELOPMENT STATUS (2026-06-08)

#### ✅ Phase 1: Core Systems (Complete - TDD)
- **MergeSystem**: collision detection, merge logic, level calculation, value calculation
  - Tests: merge.test.ts (17 tests)
- **PhysicsSystem**: gravity, friction, boundary collision, item collision, settled detection
  - Tests: physics.test.ts (25 tests)
- **SpawnSystem**: item creation, spawn ID, capacity, cooldown, config
  - Tests: spawn.test.ts (23 tests)

#### ✅ Phase 2: Data & Utils (Complete)
- types.ts: GameState, MergeItemInstance, SpawnConfig, Bounds
- constants.ts: game dimensions, physics constants, colors, spawn config
- items.ts: 10 item types (Stone → Sun)
- numberFormat.ts: large number formatting (K/M/B/T)
- Tests: numberFormat.test.ts (10 tests)

#### ✅ Phase 3: Phaser Scenes (Complete)
- BootScene: asset loading with progress bar
- MenuScene: title screen with PLAY button
- GameScene: full physics simulation + merge detection + effects

#### ✅ Phase 4: Vue App (Complete)
- App.vue: Menu, Game, Shop, Settings screens
- Phaser integration via container
- CG SDK ads integration (midgame + rewarded)
- Auto-save every 30s

#### ✅ Phase 5: Art Assets (Complete)
- 12 Gemini-generated art assets (>5KB each)
- bg-game.webp, icon.webp
- 10 item sprites (stone, water, seed, flower, crystal, gem, crown, star, moon, sun)
- All assets verified (>5KB, webp format)

#### ✅ Phase 6: Upgrade/Achievement/Save Systems (Complete - TDD)
|- **UpgradeSystem**: magnet, spring, bomb, doubleSpawn — cost/effect/levels
  - Tests: upgrade.test.ts (28 tests)
|- **AchievementSystem**: 8 achievements, milestone detection, award logic
  - Tests: achievement.test.ts (22 tests)
|- **SaveSystem**: create/save/load/reset state, offline earnings, play time
  - Tests: save.test.ts (20 tests)

#### ✅ Phase 7: Testing (Complete)
|- 135 unit tests passing (6 test files)
|- All core systems tested with TDD

#### ✅ Phase 8: Build & CG Package (Complete)
|- Vite build succeeds
|- CG SDK integrated (v3)
|- Package: dist/cg-gravity-merge.zip (5.4MB, 25 files)
|- All art assets verified (>5KB each)

### Test Results Summary
|- **gravity-merge**: 135 passed ✅ (6 test files)
  - merge.test.ts: 17 tests
  - physics.test.ts: 25 tests
  - spawn.test.ts: 23 tests
  - upgrade.test.ts: 28 tests
  - achievement.test.ts: 22 tests
  - save.test.ts: 20 tests

### Git History (gravity-merge)
```
2026-06-08: Phase 1-8 complete, TDD, 135 tests, 12 art assets, CG package
```

### Next Steps
1. Submit to CrazyGames Basic Launch (manual)
2. Polish: consider adding sound effects, particle effects
3. Test on mobile devices

### Portfolio Summary (Updated 2026-06-08)

| Game | Status | Unit Tests | CG Package | Size |
|------|--------|------------|------------|------|
| bubble-tea-lab | ✅ Existing | ✅ | ✅ | — |
| space-factory-idle | ✅ Complete | 196 ✅ | ✅ | 3.8MB |
| dungeon-defense-idle | ✅ Complete | — | ✅ | 1.6MB |
| orbit-odyssey | ✅ Existing | ✅ | ✅ | — |
| space-farm-idle | ✅ Complete | 107 ✅ | ✅ | 1.1MB |
| **bounce-golf** | **✅ Complete** | **113 ✅** | **✅** | **29KB** |
| **idle-garden** | **✅ Ready** | **256 ✅** | **✅** | **1.3MB** |
| **cafe-tycoon** | **✅ Complete** | **114 ✅** | **✅** | **910KB** |
| **axolotl-clicker** | **✅ Complete** | **198 ✅** | **✅** | **6.7MB** |
| pizza-slice-master | ⏳ In Progress | 67 ✅ | ⏳ | — |
| **gravity-merge** | **✅ Complete** | **135 ✅** | **✅** | **5.4MB** |
| **synth-kitchen** | **⏳ In Progress** | **76 ✅** | **⏳** | **797KB** |

### synth-kitchen — DEVELOPMENT STATUS (2026-06-09)

#### ✅ Phase 1: Core Systems (Complete - TDD)
- **MergeSystem**: canMerge, getMergeResult, performMerge, getMergeValue
  - Tests: merge.test.ts (19 tests)
- **KitchenSystem**: getAvailableRecipes, canCook, startCooking, updateCooking, collectCompleted
  - Tests: kitchen.test.ts (15 tests)
- **CustomerSystem**: createCustomer, updateCustomerPatience, canServeCustomer, serveCustomer, getCustomerReward
  - Tests: customer.test.ts (17 tests)
- **UpgradeSystem**: getUpgradeCost, canAffordUpgrade, applyUpgrade, getUpgradeEffect, getUpgradeLevel
  - Tests: upgrade.test.ts (14 tests)
- **SaveSystem**: createInitialState, saveGame, loadGame, mergeWithDefaults
  - Tests: save.test.ts (9 tests)

#### ✅ Phase 2: Data Files (Complete)
- types.ts: Ingredient, IngredientInstance, Recipe, Customer, CustomerInstance, Upgrade, GameState
- ingredients.ts: 19 ingredient types (4 tiers + 3 special)
- recipes.ts: 6 recipes (burger, pizza, pasta, taco, signature, specialty)
- upgrades.ts: 3 upgrade categories (kitchen, ingredient, customer)
- constants.ts: all game constants, physics, spawn, merge, customer, grid, XP, economy

#### ✅ Phase 3: Phaser Scenes (Complete)
- BootScene: asset loading with progress bar, all ingredient/customer/UI sprites
- MenuScene: title screen with background image, animated title
- GameScene: full physics simulation + merge detection + sprite rendering + effects

#### ✅ Phase 4: Vue App (Complete)
- App.vue: Phaser integration via container
- main.ts: Vue entry point
- index.html: meta tags, Google Fonts, responsive viewport

#### ✅ Phase 5: Build Integration (Complete)
- Added to vite.config.ts build
- Vite build succeeds
- CG SDK integrated (v3 via platformSdkPlugin)
- CG package: dist/cg-synth-kitchen.zip (797KB)

#### ⏳ Phase 6: Art Assets (Queued)
- 21 art requests queued in asset-requests.md
- Backgrounds: bg-game, bg-menu
- Ingredients: 16 sprites (4 tiers × 4 chains + 3 special)
- Customers: 4 sprites (normal, vip, critic, celebrity)
- UI: icon
- Status: Waiting for Gemini art worker to process

### Test Results (2026-06-09)
- **synth-kitchen tests**: 76 passed ✅ (5 test files)
  - merge.test.ts: 19 tests
  - kitchen.test.ts: 15 tests
  - customer.test.ts: 17 tests
  - upgrade.test.ts: 14 tests
  - save.test.ts: 9 tests

### Git History (synth-kitchen)
```
2026-06-09: Core systems (TDD), Phaser scenes, Vue app, build integration, CG package
```

### Research Report Status
- **Report**: game-research-report.md (V39, 2026-06-08)
- **Status**: ✅ Complete
- **Recommendations**: Synth Kitchen (#1), Space Station Tycoon (#2), Gravity Kitchen (#3)
- **Implemented**: Synth Kitchen (V39 #1 recommendation, NEW category: Merge + Management)

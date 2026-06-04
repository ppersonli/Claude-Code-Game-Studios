# CC Games - Game Status

## 2026-06-04 Cron Run — All Tests Passing

### Portfolio Summary (Active Games)

| Game | Status | Unit Tests | E2E Tests | CG Package | Size |
|------|--------|------------|-----------|------------|------|
| bubble-tea-lab | ✅ Existing | ✅ | ✅ | ✅ | — |
| space-factory-idle | ✅ Complete | 196 ✅ | 17 ✅ | ✅ | 3.8MB |
| dungeon-defense-idle | ✅ Complete | — | 14 ✅ | ✅ | 1.6MB |
| orbit-odyssey | ✅ Existing | ✅ | ✅ | ✅ | — |
| space-farm-idle | ✅ Complete | 107 ✅ | 14/15 ✅ | ✅ | 1.1MB |
| **bounce-golf** | **✅ Complete** | **113 ✅** | **17 ✅** | **✅** | **29KB** |

### Test Results (2026-06-04)
- **Total tests**: 1107 passed ✅
- **Test files**: 39/39 passed ✅
- **All games verified**: Production logic, save system, inflation, prestige, multipliers

### Research Report Status
- **Report**: `~/Documents/Obsidian Vault/共享/Hermes Skills/game-research-report.md` (765 lines, 11 updates)
- **Status**: ✅ Complete — 6-platform research + 5 rounds of debate + competitive analysis
- **Recommendations**: Space Factory Idle (首选), Dungeon Defense Idle (蓝海), Space Farm Idle (推荐)
- **All 3 recommendations implemented**

### Space Factory Idle — VERIFIED 2026-06-04

| Metric | Result |
|--------|--------|
| Unit tests | 196 passed (6 files) |
| E2E tests | 17/17 passed (36.8s) |
| CG Package | `/tmp/cg-submit/space-factory-idle/` (3.8MB) |
| CG SDK | v3 integrated, script order correct |
| Paths | Relative (./), verified |
| Mobile | Touch support, viewport meta |
| Save | localStorage + beforeunload listener |
| Art assets | 12+ webp files, all Gemini-generated |

**Features implemented:**
- 6 planets (Earth, Moon, Mars, Jupiter, Saturn, Galactic Core) with unique recipes
- Production lines with conveyor belt animations
- Employee system (Intern → Engineer → Scientist → Manager → Director)
- Prestige system (Stardust currency)
- Daily challenges (date-seeded random)
- Achievements system
- Auto-save every 30s
- Offline income (50% efficiency)
- CrazyGames SDK integration
- Neon cyberpunk visual style

### Bug Fixes (2026-06-04)
1. **SAVE_KEY mismatch** — Fixed to match test expectations (`space-factory-idle-state`)
2. **Missing constants** — Added `AD_UPGRADE_INTERVAL` and `AD_MIN_INTERVAL`
3. **Production multipliers** — `processProductionTick` now applies speed, quality, engineer, director, and prestige multipliers
4. **Inflation on sell** — `sellLine` now applies inflation to reduce sell price over time
5. **Return value** — `processProductionTick` now returns total coins earned
6. **Customer count** — Added missing common customer to bubble-tea-lab

### Next Steps
1. **Submit space-factory-idle to CG** — package ready at `/tmp/cg-submit/space-factory-idle/`
2. **Submit dungeon-defense-idle to CG** — package ready
3. **Submit space-farm-idle to CG** — package ready
4. **Submit bounce-golf to CG** — package ready
5. Monitor QA results for all submitted games
6. Iterate based on CG Basic Launch data

### Portfolio History
- bubble-tea-lab: Original game, kept as reference
- orbit-odyssey: Space exploration, completed
- space-factory-idle: #1 recommended game, completed 2026-06-03
- dungeon-defense-idle: #2 recommended (blue ocean), completed 2026-06-03
- space-farm-idle: #3 recommended, completed 2026-06-03

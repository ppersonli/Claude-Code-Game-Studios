# CC Games - Game Status

## 2026-06-01 Cron Run - Status Update

### Critical Fix: Poki SDK Leak in CG Packages
- **Root cause**: 13 out of 15 CG submission packages had Poki SDK script tag leaking into the HTML
- This was the same bug that caused mochi-merge's white screen on CG sandbox
- The Poki SDK script would 403/timeout in CG's iframe, blocking all subsequent script execution
- **Fix**: Updated vite.config.ts with `platformSdkPlugin()` that only injects the selected platform's SDK
- **Result**: Rebuilt all 15 CG packages from clean build - verified 0 Poki SDK tags in HTML files

### Bug Fix
- **block-blast-kawaii**: Fixed `canAnyBlockFit` type mismatch (expected `{matrix}[]`, received `Block[]`)
  - Updated `grid.ts` to accept `Block[]` and access `block.shape.matrix`
  - Updated 5 unit tests to use proper `Block` type format
  - Result: 4 failing tests → 2161/2161 pass

### Build & Package (Rebuilt)
- CG build successful: 15 games, all clean (CG SDK only)
- All 15 games repackaged at ~/Desktop/cc-games/cg-submit/
- Fresh ZIPs at /tmp/cg-submit/ (all under 2.5MB each)
- All packages verified: CG SDK only, flat structure, under 20MB

### Playwright Verification (all 15 games - REBUILT)
- ✅ block-blast-kawaii - Vue app loaded (title visible, app div present)
- ✅ number-merge-2048 - Vue app loaded
- ✅ boba-drop - Canvas 471x838
- ✅ jelly-pop - Canvas 471x838
- ✅ meme-match - Vue app loaded
- ✅ waffle-wobble - Canvas 471x838
- ✅ bubble-shooter - Canvas 471x838
- ✅ boba-tycoon - Canvas 471x838
- ✅ boba-runner - Canvas 471x838
- ✅ boba-clicker - Canvas 471x838
- ✅ boba-tower-defense - Canvas 471x838
- ✅ idle-coffee-shop - Canvas 471x838
- ✅ bubble-tea-lab - Vue app loaded
- ✅ color-chaos - Canvas 471x838
- ✅ mochi-merge - Canvas 471x838

### Cover Images
- 13 games: Full Gemini-generated covers (L/P/S)
- 2 games: Pillow-generated covers (Gemini unavailable):
  - block-blast-kawaii: Purple-pink gradient with block decorations
  - number-merge-2048: Orange-red gradient with number tiles
- **Note**: Pillow covers are functional but lower quality than Gemini. Consider regenerating when Gemini is available.

### Submission Status
- 3 games already submitted to CG: bubble-tea-lab, color-chaos, mochi-merge
- 12 games ready for CG submission (all have ZIP + covers)
- Total: 15 games ready for submission
- **IMPORTANT**: Rebuild was done this run - CG packages are now clean (no Poki SDK leak)

### Tests
- All 2161 tests passing (41 test files)
- vitest run time: 6.89s

### cc-game tmux Session (color-chaos skin system)
- Claude Code developed a skin/shop economy system for color-chaos
- 178 tests pass, 100% core coverage, TypeScript compiles clean
- Features: 10 skins (classic→aurora), ticket economy, shop scene
- Skin effects: glass color/tint, border, highlight, glow
- **Status**: Dev feature in separate repo (~/Desktop/cc-game), not yet merged to main cc-games

### Next Steps
1. **Submit remaining 12 games to CG** (requires user action via CG dashboard)
   - Fresh clean ZIPs ready at /tmp/cg-submit/
   - Cover images ready in cg-submit/
2. Monitor QA results for submitted games (especially mochi-merge white screen fix)
3. Consider regenerating Pillow covers with Gemini when available
4. Consider merging color-chaos skin system into main repo
5. Research new game mechanics for expansion

# cc-games Market Research Report — 2026-06-01

## Executive Summary

**Portfolio status:** 16 games built, 1741 tests, 17 CG packages, all passing.
**Current work:** CC adding meta systems to sweet-sort (last game without meta).
**Next priority:** Portfolio gap analysis + new game planning.

---

## 1. Market Data (2026 Benchmarks)

### Revenue Metrics
| Metric | Casual HTML5 | Midcore/RPG |
|--------|-------------|-------------|
| ARPDAU | $0.08-$0.15 | $0.25+ |
| eCPM (Rewarded, US) | $15-$28 | $15-$28 |
| eCPM (Rewarded, EU) | $8-$15 | $8-$15 |
| Opt-in Rate | 50-65% of DAU | 50-65% |
| Fill Rate | >95% | >95% |

### Market Size
- **HTML5 gaming market:** $6B+ (2026, Statista)
- **Casual puzzle market:** $8.7B
- **Sort puzzle category:** $200M/year (overtook Blast as #3)
- **Idle/tycoon market:** $14.2B, 10.5% CAGR

### Platform Comparison
| Platform | MAU | Revenue Split | Review Time |
|----------|-----|---------------|-------------|
| Poki | 625M+ | 50/50 | 2-4 weeks |
| CrazyGames | 35M | Similar | 1-2 weeks |
| Playgama | Growing | 80% dev | Fast |

---

## 2. Trending Games Analysis (June 2026)

### CrazyGames Hot Games
- **Idle/Clicker dominant:** Pickaxe Crusher Idle, Dungeon Clicker, Idle Monster Slayer, Idle Space Business Tycoon, Garden Idle, Painter's Voyage Idle, DualForce Idle, Plinko Idle
- **Merge:** Tower Merge, Dragons Merge
- **Puzzle:** Puzzle Block Master, Mystery Forest Match 3, Tile Match 3
- **Simulation:** I Am Taxi Prankster Sim, Diner Dash
- **Survival:** Swarm Survivor

### Poki Hot Games
- **Merge trending (🔥):** Duck Merge, Merge and Double, Watermelon Drop
- **Casual/Physics:** Level Devil, Slice Master, Bubble Tower
- **Tycoon:** Monkey Mart
- **Puzzle:** Brain Test, World of Screw
- **Kawaii:** Kawaii Fruits 3D, Cat Pizza, World of Yarn

### Key Insight: Idle Games Dominate CrazyGames
**7 out of ~40 hot games are idle/clicker** — this is the single most represented genre. Our idle games (boba-tycoon, boba-clicker, bubble-tea-idle, idle-coffee-shop) are well-positioned.

---

## 3. Portfolio Gap Analysis

### Our 16 Games by Category
| Category | Games | Count |
|----------|-------|-------|
| Sort Puzzle | boba-sort, sweet-sort | 2 |
| Idle/Tycoon | boba-tycoon, boba-clicker, bubble-tea-idle, idle-coffee-shop | 4 |
| Merge | bubble-tea-merge | 1 |
| Casual/Physics | boba-drop, jelly-pop, color-chaos | 3 |
| Shooter | bubble-shooter | 1 |
| Runner | boba-runner | 1 |
| Time Management | waffle-wobble, bubble-tea-lab | 2 |
| Matching | meme-match | 1 |
| Cooking/Serving | bubble-tea | 1 |

### Gaps vs Market Demand
| Hot Category | Our Coverage | Opportunity |
|--------------|-------------|-------------|
| **Tower Defense** | ❌ ZERO | CG has dedicated category, strong monetization |
| **Match-3** | ⚠️ Weak (meme-match is matching, not match-3) | $5B market but flatlined, risky |
| **Merge** | ⚠️ 1 game | Trending on Poki, could add more |
| **.io Multiplayer** | ❌ ZERO | Top category on CG, but technically complex |
| **Card/RPG** | ❌ ZERO | Dark Stones trending on CG |
| **Simulation** | ⚠️ Weak | I Am Taxi, Diner Dash trending |

---

## 4. Strategic Recommendations

### Tier 1: Build Next (High ROI, Low Risk)
1. **Tower Defense (bubble/boba themed)** — CG has dedicated category, zero competition in our portfolio, strong monetization via IAP (towers, heroes) + rewarded ads (extra lives, speed boost). Can reuse our cute art style.

2. **Merge Tycoon** — Poki trending (Duck Merge 🔥), we already have merge mechanics in bubble-tea-merge. Build a standalone merge-tycoon hybrid with idle progression.

### Tier 2: Consider (Medium ROI)
3. **Match-3 (proper)** — $5B market but flatlined. Only build if we can differentiate (our cute theme + hybrid casual meta). High risk of being lost in noise.

4. **Card Battle / Roguelike** — Trending on CG (Dark Stones). Technically complex but high ARPDAU ($0.25+ midcore).

### Tier 3: Avoid
- **.io Multiplayer** — Requires server infrastructure, real-time sync, anti-cheat. Too complex for current team.
- **Match-3 (standard)** — Candy Crush/Royal Match dominate, downloads declining 20%.
- **New Sort games** — We already have 2, market well-covered.

---

## 5. Monetization Best Practices (2026)

### Rewarded Video (Primary Revenue)
- **Placement:** Extra life, 2x coins, free spin, skip wait
- **Frequency:** Natural breaks only (end of level, after death)
- **Golden rule:** Pause game + mute audio during ad
- **Reward:** Only grant on `rewarded` state, never on `closed`

### Interstitial Ads (Secondary Revenue)
- **Max frequency:** 1 per 3 minutes
- **Placement:** Between levels, after game over
- **Risk:** +18% churn if overused

### Hybrid Monetization
- 95% of players → rewarded ads
- 5% whales → IAP offers (cosmetics, boosters, battle pass)
- Boosts LTV 30-45% vs ad-only

### B2B Licensing
- Non-exclusive: $300-$800 per platform
- Exclusive: $5,000-$25,000+
- We can license our 16 games to multiple portals

---

## 6. Revenue Projection

### Conservative Estimate (16 games, Poki + CG)
- **DAU per game:** 500-2,000 (based on H5 casual benchmarks)
- **Total DAU:** 8,000-32,000
- **ARPDAU:** $0.08-$0.15
- **Daily revenue:** $640-$4,800
- **Monthly revenue:** $19,200-$144,000

### With Tower Defense + Merge Tycoon (18 games)
- **Additional DAU:** 2,000-5,000 (hot categories)
- **Monthly uplift:** $4,800-$22,500

---

## Sources
- Playgama Blog: "10 Ways to Monetize HTML5 Games" (Apr 2026)
- Unity Gaming Report 2026
- Sensor Tower: Q1 2026 Mobile Game Rankings
- CrazyGames Hot Games (live scan Jun 1, 2026)
- Poki Homepage (live scan Jun 1, 2026)
- Gamigion: "Casual Puzzles in 2026" (May 28, 2026)
- Game Growth Advisor: "Hybrid Casual Games 2026 Playbook" (Apr 2026)

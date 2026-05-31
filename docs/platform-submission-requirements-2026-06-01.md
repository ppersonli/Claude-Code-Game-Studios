# Platform Submission Requirements — 2026-06-01

## CrazyGames Requirements

### Technical (Mandatory)
| Requirement | Limit | Notes |
|-------------|-------|-------|
| Total file size | ≤250MB | 1500 files max |
| Initial download | ≤50MB | ≤20MB for mobile homepage eligibility |
| Time to gameplay | ≤20 seconds | Measured from load to first Gameplay start event |
| Browser support | Chrome + Edge | Safari disabled if broken; must work on 4GB Chromebook |
| Paths | Relative only | Absolute paths fail to load |
| Fullscreen | No custom buttons | CG provides automatically; custom buttons interfere with monetization |
| Cross-promotion | FORBIDDEN | No links to other games/platforms (except Privacy Policy) |
| Content rating | PEGI 12 | Audience is 13+ |

### SDK Integration Levels
- **Basic**: Gameplay start event triggered when player reaches playable state. No ads allowed at this level.
- **Full**: Gameplay start/stop events + Data module for save progression + ad integration + user account module

### Cover Images (Required)
- **Landscape**: 1920×1080
- **Portrait**: 800×1200
- **Square**: 800×800
- Title should be **bottom-center** — CrazyGames overlays labels (NEW, TOP RATED, HOT) in **top-left corner**

### Preview Video (Required for Full Launch)
- Landscape 16:9 format
- 20 seconds max
- **No cursor visible** — park cursor outside recording area
- **Muted** — no audio in preview
- Side pillarboxes allowed for portrait games (letterboxes NOT allowed)
- Show variety, avoid text overlays/intros

### QA Process
- 5 testers review the game
- Each scores 1-10
- **8.0+ = Basic Launch** (soft launch with limited audience)
- After Basic Launch metrics → Full Launch (monetization + promotional placement)
- QA review takes ~14 days

### Quality Guidelines (What Testers Look For)
1. **Onboarding**: Get to gameplay quickly, implement in gameplay (not text walls), make skippable, prioritize visuals over text
2. **UI**: Clear buttons, no misleading sizes, no delays to confuse users
3. **Gameplay**: Clear goals, easy to learn, consistent controls, responsive to actions
4. **Uniqueness**: Not easily confused with similar games, unique name/iconography
5. **Aesthetics**: High quality graphics, consistent resolution, no compression artifacts, consistent art style throughout
6. **Audio**: Consistent levels, not too loud/quiet, complements visual experience
7. **Restricted keys**: Avoid Escape (closes fullscreen), Ctrl/Cmd+W (closes tab). Support AZERTY layouts.

### Mobile Requirements
- ≤20MB initial download for mobile homepage
- Touch support required if mobile supported
- Add CSS to prevent magnification/select on tablets:
  ```css
  body { -webkit-user-select: none; user-select: none; }
  ```
- iOS AudioContext handling: resume on touchend/click when suspended

---

## Poki Requirements

### File Size
- **Target: 8-10MB** (much smaller than CG's 50MB limit)
- Progressive loading recommended (load menu/tutorial first, rest in background)

### Orientation
- **Portrait strongly preferred** — 6% more players enter gameplay
- Portrait enables Gamebar Display ads (mobile title bar ads, auto-implemented, extra revenue)
- Landscape and both orientations supported but portrait is best

### Onboarding (Critical)
1. **Skip splash screens/title screens** — first-time players should jump straight into gameplay
2. **Safe beginner environment** — easy early levels, scale difficulty gradually
3. **Visual tutorials** — use images/animations/gestures, NOT text walls
4. **Gradual introduction** — introduce mechanics over multiple levels, avoid "frontal load"
5. **Mobile first** — design for mobile from the start

### Loading
- Loading bar with progression (prevents players thinking game is frozen)
- Visually engaging loading screen with game logo/visuals

### Testing
- Poki Playtest recordings — watch how players move through early game
- Fine-tune onboarding based on real player behavior

---

## Our Games Compliance Check

### Current State (17 games)
| Check | Status | Action Needed |
|-------|--------|---------------|
| File size ≤50MB | ✅ All 1.0-1.3MB zips | None |
| File size ≤20MB (mobile) | ✅ All under 20MB | None |
| CG SDK integration | ✅ Poki SDK + CG abstraction | Verify CG SDK events fire |
| Cover images | ⚠️ Missing for most games | Generate 3 sizes per game |
| Preview videos | ❌ None created | Record 20s gameplay per game |
| No cross-promotion | ⚠️ Home page links to other games | Remove cross-links from CG builds |
| PEGI 12 compliant | ✅ All boba/tea themed, no violence | None |
| Portrait support | ⚠️ Need to check each game | Verify mobile orientation |
| CSS user-select:none | ❓ Unknown | Add to all games |
| AudioContext iOS resume | ❓ Unknown | Add touchend handler |

### Priority Fixes Before Submission
1. **Generate cover images** (1920×1080, 800×1200, 800×800) for all 17 games
2. **Record preview videos** (20s, landscape, no cursor, muted)
3. **Remove cross-promotion** from CG builds (home page game links)
4. **Add user-select:none CSS** to all games
5. **Add iOS AudioContext resume** handler
6. **Verify orientation** settings for each game

---

## Revenue Optimization Tips

### CrazyGames
- Mobile homepage = ≤20MB initial download (our games qualify!)
- Full SDK integration needed for monetization
- Basic Launch → measure engagement → Full Launch
- QA rating 8+ = recognition, faster Full Launch

### Poki
- Portrait mode = +6% gameplay entries + Gamebar Display ads
- Fast onboarding = better engagement metrics = more visibility
- Progressive loading = less drop-off during loading
- Localization = more global reach

### Both Platforms
- Unique game names (not generic like "Sort Puzzle")
- Consistent art style throughout
- No boring/repetitive tasks
- Quick response to player actions
- Clear goals and progression

---

*Sources: CrazyGames docs.crazygames.com, Poki developers.poki.com, Shadow Blocks devlog (alastis.dev)*

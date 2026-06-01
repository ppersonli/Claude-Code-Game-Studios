import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  canBuyMergeTheme, equipMergeTheme, getAvailableMergeThemes,
  checkMergeAchievements, gameCoins, dailyRewardCoins,
  isDailyRewardAvailable, claimDailyReward,
} from '../../src/games/number-merge-2048/logic/meta'
import { MERGE_THEMES, getMergeThemeById, type Merge2048Theme } from '../../src/games/number-merge-2048/data/themes'
import { MERGE_ACHIEVEMENTS, getMergeAchievementById, type Merge2048Stats } from '../../src/games/number-merge-2048/data/achievements'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

beforeEach(() => {
  Object.keys(storage).forEach(k => delete storage[k])
})

function makeStats(overrides: Partial<Merge2048Stats> = {}): Merge2048Stats {
  return {
    highScore: 0, highestTile: 0, totalGames: 0, totalMoves: 0,
    totalMerges: 0, bestMoveCount: 0, dailyCompleted: 0, themesUnlocked: 1,
    ...overrides,
  }
}

// ==============================
// THEMES: Data integrity
// ==============================

describe('MERGE_THEMES', () => {
  it('test_has_6_themes', () => {
    expect(MERGE_THEMES).toHaveLength(6)
  })
  it('test_unique_ids', () => {
    expect(new Set(MERGE_THEMES.map(t => t.id)).size).toBe(6)
  })
  it('test_first_free', () => {
    expect(MERGE_THEMES[0].cost).toBe(0)
    expect(MERGE_THEMES[0].requiredScore).toBe(0)
  })
  it('test_classic_is_first', () => {
    expect(MERGE_THEMES[0].id).toBe('classic')
  })
  it('test_costs_increase', () => {
    for (let i = 2; i < MERGE_THEMES.length; i++)
      expect(MERGE_THEMES[i].cost).toBeGreaterThanOrEqual(MERGE_THEMES[i - 1].cost)
  })
  it('test_requiredScores_increase', () => {
    for (let i = 2; i < MERGE_THEMES.length; i++)
      expect(MERGE_THEMES[i].requiredScore).toBeGreaterThanOrEqual(MERGE_THEMES[i - 1].requiredScore)
  })
  it('test_all_have_emoji', () => {
    for (const t of MERGE_THEMES) expect(t.emoji).toBeTruthy()
  })
  it('test_all_have_bgColors', () => {
    for (const t of MERGE_THEMES) {
      expect(t.bgTop).toBeTruthy()
      expect(t.bgBot).toBeTruthy()
    }
  })
  it('test_all_have_accentColor', () => {
    for (const t of MERGE_THEMES) {
      expect(t.accentColor).toMatch(/^#/)
    }
  })
  it('test_all_have_description', () => {
    for (const t of MERGE_THEMES) expect(t.description).toBeTruthy()
  })
  it('test_all_have_gridBg', () => {
    for (const t of MERGE_THEMES) expect(t.gridBg).toBeTruthy()
  })
  it('test_all_have_cellBg', () => {
    for (const t of MERGE_THEMES) expect(t.cellBg).toBeTruthy()
  })
})

describe('getMergeThemeById', () => {
  it('test_finds_classic', () => {
    expect(getMergeThemeById('classic').name).toBe('經典粉')
  })
  it('test_finds_ocean', () => {
    expect(getMergeThemeById('ocean').name).toBe('海洋藍')
  })
  it('test_finds_galaxy', () => {
    expect(getMergeThemeById('galaxy').name).toBe('銀河夢')
  })
  it('test_invalid_throws', () => {
    expect(() => getMergeThemeById('fake')).toThrow()
  })
  it('test_invalid_error_message_includes_id', () => {
    expect(() => getMergeThemeById('xyz')).toThrow('xyz')
  })
})

// ==============================
// THEMES: Purchase logic
// ==============================

describe('canBuyMergeTheme', () => {
  it('test_affordable_with_score', () => {
    expect(canBuyMergeTheme(200, 1000, ['classic'], 'ocean')).toBe(true)
  })
  it('test_insufficient_coins', () => {
    expect(canBuyMergeTheme(50, 1000, ['classic'], 'ocean')).toBe(false)
  })
  it('test_insufficient_score', () => {
    expect(canBuyMergeTheme(200, 100, ['classic'], 'ocean')).toBe(false)
  })
  it('test_already_owned', () => {
    expect(canBuyMergeTheme(9999, 99999, ['classic', 'ocean'], 'ocean')).toBe(false)
  })
  it('test_exact_coins_affordable', () => {
    expect(canBuyMergeTheme(100, 500, ['classic'], 'ocean')).toBe(true)
  })
  it('test_exact_score_affordable', () => {
    expect(canBuyMergeTheme(100, 500, ['classic'], 'ocean')).toBe(true)
  })
  it('test_one_coin_short', () => {
    expect(canBuyMergeTheme(99, 500, ['classic'], 'ocean')).toBe(false)
  })
  it('test_one_score_short', () => {
    expect(canBuyMergeTheme(100, 499, ['classic'], 'ocean')).toBe(false)
  })
  it('test_galaxy_requires_20000_score', () => {
    expect(canBuyMergeTheme(5000, 20000, ['classic'], 'galaxy')).toBe(true)
    expect(canBuyMergeTheme(5000, 19999, ['classic'], 'galaxy')).toBe(false)
  })
  it('test_galaxy_requires_2000_coins', () => {
    expect(canBuyMergeTheme(2000, 20000, ['classic'], 'galaxy')).toBe(true)
    expect(canBuyMergeTheme(1999, 20000, ['classic'], 'galaxy')).toBe(false)
  })
})

describe('equipMergeTheme', () => {
  it('test_equip_unlocked', () => {
    expect(equipMergeTheme(['classic', 'ocean'], 'ocean')).toBe(true)
  })
  it('test_equip_locked_fails', () => {
    expect(equipMergeTheme(['classic'], 'galaxy')).toBe(false)
  })
  it('test_equip_classic', () => {
    expect(equipMergeTheme(['classic'], 'classic')).toBe(true)
  })
})

describe('getAvailableMergeThemes', () => {
  it('test_returns_all_themes', () => {
    expect(getAvailableMergeThemes(9999, 99999, ['classic'])).toHaveLength(6)
  })
  it('test_classic_unlocked', () => {
    const t = getAvailableMergeThemes(0, 0, ['classic']).find(t => t.theme.id === 'classic')!
    expect(t.unlocked).toBe(true)
  })
  it('test_locked_not_owned', () => {
    const t = getAvailableMergeThemes(0, 0, ['classic']).find(t => t.theme.id === 'galaxy')!
    expect(t.unlocked).toBe(false)
    expect(t.canBuy).toBe(false)
  })
  it('test_affordable_shows_canBuy', () => {
    const t = getAvailableMergeThemes(200, 1000, ['classic']).find(t => t.theme.id === 'ocean')!
    expect(t.canBuy).toBe(true)
  })
  it('test_all_unlocked_when_fully_bought', () => {
    const all = MERGE_THEMES.map(t => t.id)
    const result = getAvailableMergeThemes(0, 0, all)
    for (const t of result) expect(t.unlocked).toBe(true)
  })
  it('test_none_canBuy_when_broke', () => {
    const result = getAvailableMergeThemes(0, 0, ['classic'])
    const buyable = result.filter(t => t.canBuy)
    expect(buyable).toHaveLength(0)
  })
})

// ==============================
// ACHIEVEMENTS: Data integrity
// ==============================

describe('MERGE_ACHIEVEMENTS', () => {
  it('test_has_14_achievements', () => {
    expect(MERGE_ACHIEVEMENTS).toHaveLength(14)
  })
  it('test_unique_ids', () => {
    expect(new Set(MERGE_ACHIEVEMENTS.map(a => a.id)).size).toBe(14)
  })
  it('test_all_have_rewards', () => {
    for (const a of MERGE_ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0)
  })
  it('test_all_have_emoji', () => {
    for (const a of MERGE_ACHIEVEMENTS) expect(a.emoji).toBeTruthy()
  })
  it('test_all_have_name', () => {
    for (const a of MERGE_ACHIEVEMENTS) expect(a.name).toBeTruthy()
  })
  it('test_all_have_description', () => {
    for (const a of MERGE_ACHIEVEMENTS) expect(a.description).toBeTruthy()
  })
  it('test_all_have_check_function', () => {
    for (const a of MERGE_ACHIEVEMENTS) expect(typeof a.check).toBe('function')
  })
})

describe('getMergeAchievementById', () => {
  it('test_finds_first_merge', () => {
    expect(getMergeAchievementById('first-merge').name).toBe('初次合併')
  })
  it('test_finds_tile_2048', () => {
    expect(getMergeAchievementById('tile-2048').name).toBe('2048傳說')
  })
  it('test_finds_theme_all', () => {
    expect(getMergeAchievementById('theme-all').reward).toBe(200)
  })
  it('test_invalid_throws', () => {
    expect(() => getMergeAchievementById('fake')).toThrow()
  })
  it('test_invalid_error_message_includes_id', () => {
    expect(() => getMergeAchievementById('xyz')).toThrow('xyz')
  })
})

// ==============================
// ACHIEVEMENTS: Unlock logic
// ==============================

describe('checkMergeAchievements', () => {
  it('test_unlocks_first_merge', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 4 }), [])
    expect(u.some(a => a.id === 'first-merge')).toBe(true)
  })
  it('test_unlocks_tile_128', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 128 }), [])
    expect(u.some(a => a.id === 'tile-128')).toBe(true)
  })
  it('test_unlocks_tile_512', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 512 }), [])
    expect(u.some(a => a.id === 'tile-512')).toBe(true)
  })
  it('test_unlocks_tile_2048', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 2048 }), [])
    expect(u.some(a => a.id === 'tile-2048')).toBe(true)
  })
  it('test_unlocks_score_1000', () => {
    const u = checkMergeAchievements(makeStats({ highScore: 1000 }), [])
    expect(u.some(a => a.id === 'score-1000')).toBe(true)
  })
  it('test_unlocks_score_5000', () => {
    const u = checkMergeAchievements(makeStats({ highScore: 5000 }), [])
    expect(u.some(a => a.id === 'score-5000')).toBe(true)
  })
  it('test_unlocks_score_10000', () => {
    const u = checkMergeAchievements(makeStats({ highScore: 10000 }), [])
    expect(u.some(a => a.id === 'score-10000')).toBe(true)
  })
  it('test_unlocks_games_10', () => {
    const u = checkMergeAchievements(makeStats({ totalGames: 10 }), [])
    expect(u.some(a => a.id === 'games-10')).toBe(true)
  })
  it('test_unlocks_games_50', () => {
    const u = checkMergeAchievements(makeStats({ totalGames: 50 }), [])
    expect(u.some(a => a.id === 'games-50')).toBe(true)
  })
  it('test_unlocks_moves_500', () => {
    const u = checkMergeAchievements(makeStats({ totalMoves: 500 }), [])
    expect(u.some(a => a.id === 'moves-500')).toBe(true)
  })
  it('test_unlocks_win_fast', () => {
    const u = checkMergeAchievements(makeStats({ bestMoveCount: 150 }), [])
    expect(u.some(a => a.id === 'win-fast')).toBe(true)
  })
  it('test_unlocks_daily_3', () => {
    const u = checkMergeAchievements(makeStats({ dailyCompleted: 3 }), [])
    expect(u.some(a => a.id === 'daily-3')).toBe(true)
  })
  it('test_unlocks_theme_3', () => {
    const u = checkMergeAchievements(makeStats({ themesUnlocked: 3 }), [])
    expect(u.some(a => a.id === 'theme-3')).toBe(true)
  })
  it('test_unlocks_theme_all', () => {
    const u = checkMergeAchievements(makeStats({ themesUnlocked: 6 }), [])
    expect(u.some(a => a.id === 'theme-all')).toBe(true)
  })
  it('test_no_duplicate', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 4 }), ['first-merge'])
    expect(u.some(a => a.id === 'first-merge')).toBe(false)
  })
  it('test_multiple_achievements_at_once', () => {
    const u = checkMergeAchievements(makeStats({ highestTile: 2048, highScore: 10000 }), [])
    expect(u.length).toBeGreaterThanOrEqual(4)
  })
  it('test_insufficient_no_unlock', () => {
    const u = checkMergeAchievements(makeStats(), [])
    expect(u.length).toBe(0)
  })
  it('test_boundary_tile_128_below', () => {
    expect(checkMergeAchievements(makeStats({ highestTile: 127 }), []).some(a => a.id === 'tile-128')).toBe(false)
  })
  it('test_boundary_tile_128_at', () => {
    expect(checkMergeAchievements(makeStats({ highestTile: 128 }), []).some(a => a.id === 'tile-128')).toBe(true)
  })
  it('test_boundary_win_fast_201_no', () => {
    expect(checkMergeAchievements(makeStats({ bestMoveCount: 201 }), []).some(a => a.id === 'win-fast')).toBe(false)
  })
  it('test_boundary_win_fast_200_yes', () => {
    expect(checkMergeAchievements(makeStats({ bestMoveCount: 200 }), []).some(a => a.id === 'win-fast')).toBe(true)
  })
  it('test_boundary_win_fast_0_no', () => {
    expect(checkMergeAchievements(makeStats({ bestMoveCount: 0 }), []).some(a => a.id === 'win-fast')).toBe(false)
  })
  it('test_boundary_games_10_below', () => {
    expect(checkMergeAchievements(makeStats({ totalGames: 9 }), []).some(a => a.id === 'games-10')).toBe(false)
  })
  it('test_boundary_games_10_at', () => {
    expect(checkMergeAchievements(makeStats({ totalGames: 10 }), []).some(a => a.id === 'games-10')).toBe(true)
  })
  it('test_boundary_games_50', () => {
    expect(checkMergeAchievements(makeStats({ totalGames: 49 }), []).some(a => a.id === 'games-50')).toBe(false)
    expect(checkMergeAchievements(makeStats({ totalGames: 50 }), []).some(a => a.id === 'games-50')).toBe(true)
  })
  it('test_boundary_moves_500', () => {
    expect(checkMergeAchievements(makeStats({ totalMoves: 499 }), []).some(a => a.id === 'moves-500')).toBe(false)
    expect(checkMergeAchievements(makeStats({ totalMoves: 500 }), []).some(a => a.id === 'moves-500')).toBe(true)
  })
  it('test_boundary_score_1000', () => {
    expect(checkMergeAchievements(makeStats({ highScore: 999 }), []).some(a => a.id === 'score-1000')).toBe(false)
    expect(checkMergeAchievements(makeStats({ highScore: 1000 }), []).some(a => a.id === 'score-1000')).toBe(true)
  })
  it('test_boundary_score_5000', () => {
    expect(checkMergeAchievements(makeStats({ highScore: 4999 }), []).some(a => a.id === 'score-5000')).toBe(false)
    expect(checkMergeAchievements(makeStats({ highScore: 5000 }), []).some(a => a.id === 'score-5000')).toBe(true)
  })
  it('test_boundary_score_10000', () => {
    expect(checkMergeAchievements(makeStats({ highScore: 9999 }), []).some(a => a.id === 'score-10000')).toBe(false)
    expect(checkMergeAchievements(makeStats({ highScore: 10000 }), []).some(a => a.id === 'score-10000')).toBe(true)
  })
  it('test_boundary_daily_3', () => {
    expect(checkMergeAchievements(makeStats({ dailyCompleted: 2 }), []).some(a => a.id === 'daily-3')).toBe(false)
    expect(checkMergeAchievements(makeStats({ dailyCompleted: 3 }), []).some(a => a.id === 'daily-3')).toBe(true)
  })
  it('test_boundary_theme_3', () => {
    expect(checkMergeAchievements(makeStats({ themesUnlocked: 2 }), []).some(a => a.id === 'theme-3')).toBe(false)
    expect(checkMergeAchievements(makeStats({ themesUnlocked: 3 }), []).some(a => a.id === 'theme-3')).toBe(true)
  })
  it('test_boundary_theme_all', () => {
    expect(checkMergeAchievements(makeStats({ themesUnlocked: 5 }), []).some(a => a.id === 'theme-all')).toBe(false)
    expect(checkMergeAchievements(makeStats({ themesUnlocked: 6 }), []).some(a => a.id === 'theme-all')).toBe(true)
  })
})

// ==============================
// COINS
// ==============================

describe('gameCoins', () => {
  it('test_base_coins_from_score', () => {
    expect(gameCoins(100, false)).toBe(10)
  })
  it('test_win_bonus', () => {
    expect(gameCoins(100, true)).toBe(60)
  })
  it('test_zero_score_lose', () => {
    expect(gameCoins(0, false)).toBe(0)
  })
  it('test_zero_score_win', () => {
    expect(gameCoins(0, true)).toBe(50)
  })
  it('test_rounds_down', () => {
    expect(gameCoins(109, false)).toBe(10)
  })
  it('test_large_score', () => {
    expect(gameCoins(99999, false)).toBe(9999)
    expect(gameCoins(99999, true)).toBe(10049)
  })
})

describe('dailyRewardCoins', () => {
  it('test_returns_100', () => {
    expect(dailyRewardCoins()).toBe(100)
  })
})

// ==============================
// DAILY REWARD
// ==============================

describe('isDailyRewardAvailable', () => {
  it('test_available_with_empty_string', () => {
    expect(isDailyRewardAvailable('')).toBe(true)
  })
  it('test_available_with_old_date', () => {
    expect(isDailyRewardAvailable('2020-01-01')).toBe(true)
  })
  it('test_not_available_after_claim_today', () => {
    expect(isDailyRewardAvailable(new Date().toISOString().slice(0, 10))).toBe(false)
  })
})

describe('claimDailyReward', () => {
  it('test_first_time_claim', () => {
    const r = claimDailyReward('')
    expect(r.claimed).toBe(true)
    expect(r.today).toBeTruthy()
  })
  it('test_already_claimed_today', () => {
    const r = claimDailyReward(new Date().toISOString().slice(0, 10))
    expect(r.claimed).toBe(false)
  })
  it('test_different_day_claim', () => {
    const r = claimDailyReward('2020-01-01')
    expect(r.claimed).toBe(true)
  })
  it('test_today_is_iso_date', () => {
    const r = claimDailyReward('')
    expect(r.today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('test_returns_today_on_already_claimed', () => {
    const today = new Date().toISOString().slice(0, 10)
    const r = claimDailyReward(today)
    expect(r.today).toBe(today)
    expect(r.claimed).toBe(false)
  })
})

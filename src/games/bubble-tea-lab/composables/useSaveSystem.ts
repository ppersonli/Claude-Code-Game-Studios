/**
 * 统一的数据持久化管理
 * 管理所有localStorage数据的读写
 */

export interface GameSaveData {
  // 基础数据
  coins: number
  level: number
  totalDrinksServed: number
  perfectCount: number
  maxCombo: number
  highestLevel: number
  
  // 解锁内容
  unlockedIngredients: string[]
  unlockedCustomers: string[]
  unlockedThemes: string[]
  equippedTheme: string
  
  // 配方图鉴
  recipeBook: Record<string, { firstMade: number; timesMade: number }>
  
  // 成就
  achievements: string[]
  metaAchievements: string[]
  
  // 每日相关
  dailyStreak: number
  lastPlayDate: string
  lastDailyReward: string
  
  // 统计数据
  totalCoins: number
  highScore: number
  stats: {
    perfect: number
    maxCombo: number
    totalServed: number
    totalEarned: number
  }
  
  // 装修
  shopDecor: Record<string, string>
  
  // 设置
  settings: {
    soundEnabled: boolean
    musicVolume: number
    sfxVolume: number
  }
}

const SAVE_KEY = 'btlab_save_data'

const DEFAULT_SAVE: GameSaveData = {
  coins: 0,
  level: 1,
  totalDrinksServed: 0,
  perfectCount: 0,
  maxCombo: 0,
  highestLevel: 0,
  unlockedIngredients: [],
  unlockedCustomers: [],
  unlockedThemes: ['classic'],
  equippedTheme: 'classic',
  recipeBook: {},
  achievements: [],
  metaAchievements: [],
  dailyStreak: 0,
  lastPlayDate: '',
  lastDailyReward: '',
  totalCoins: 0,
  highScore: 0,
  stats: {
    perfect: 0,
    maxCombo: 0,
    totalServed: 0,
    totalEarned: 0,
  },
  shopDecor: {},
  settings: {
    soundEnabled: true,
    musicVolume: 0.7,
    sfxVolume: 0.8,
  },
}

/**
 * 保存游戏数据
 */
export function saveGame(data: Partial<GameSaveData>): void {
  try {
    const current = loadGame()
    const merged = { ...current, ...data }
    localStorage.setItem(SAVE_KEY, JSON.stringify(merged))
  } catch (error) {
    console.error('Failed to save game:', error)
  }
}

/**
 * 加载游戏数据
 */
export function loadGame(): GameSaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return { ...DEFAULT_SAVE }
    
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SAVE, ...parsed }
  } catch (error) {
    console.error('Failed to load game:', error)
    return { ...DEFAULT_SAVE }
  }
}

/**
 * 清除所有存档
 */
export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY)
}

/**
 * 导出存档为JSON字符串
 */
export function exportSave(): string {
  const data = loadGame()
  return JSON.stringify(data, null, 2)
}

/**
 * 从JSON字符串导入存档
 */
export function importSave(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as GameSaveData
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Failed to import save:', error)
    return false
  }
}

/**
 * 更新统计数据
 */
export function updateStats(updates: Partial<GameSaveData['stats']>): void {
  const save = loadGame()
  save.stats = { ...save.stats, ...updates }
  saveGame({ stats: save.stats })
}

/**
 * 检查是否是新的一天
 */
export function isNewDay(): boolean {
  const today = new Date().toISOString().slice(0, 10)
  const save = loadGame()
  return save.lastPlayDate !== today
}

/**
 * 记录每日登录
 */
export function recordDailyLogin(): { streak: number; isNewDay: boolean } {
  const save = loadGame()
  const today = new Date().toISOString().slice(0, 10)
  const wasNewDay = save.lastPlayDate !== today
  
  if (wasNewDay) {
    // 检查是否连续登录
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (save.lastPlayDate === yesterday) {
      save.dailyStreak++
    } else if (save.lastPlayDate !== today) {
      save.dailyStreak = 1
    }
    
    save.lastPlayDate = today
    saveGame({
      dailyStreak: save.dailyStreak,
      lastPlayDate: save.lastPlayDate,
    })
  }
  
  return {
    streak: save.dailyStreak,
    isNewDay: wasNewDay,
  }
}

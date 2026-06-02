/**
 * 轻量 i18n 模块
 * 不引入 vue-i18n，减少 bundle 体积
 */

import { ref, watch } from 'vue'

export type Locale = 'en' | 'fr' | 'de' | 'es' | 'it' | 'tr' | 'pt-BR' | 'ru' | 'ja' | 'ko'

export const SUPPORTED_LOCALES: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
]

const STORAGE_KEY = 'btlab_locale'

// 翻译字典类型
type Translations = Record<string, any>

// 当前语言
const currentLocale = ref<Locale>('en')
// 当前翻译
const currentMessages = ref<Translations>({})
// 备用翻译（英文）
let fallbackMessages: Translations = {}

// 翻译加载缓存
const loadedLocales = new Map<Locale, Translations>()

/**
 * 获取浏览器语言
 */
function getBrowserLocale(): Locale {
  try {
    const lang = navigator.language || (navigator as any).userLanguage || 'en'
    // 精确匹配
    if (SUPPORTED_LOCALES.some(l => l.code === lang)) return lang as Locale
    // 语言前缀匹配
    const prefix = lang.split('-')[0]
    const match = SUPPORTED_LOCALES.find(l => l.code.startsWith(prefix))
    if (match) return match.code
  } catch {}
  return 'en'
}

/**
 * 加载语言翻译文件
 */
async function loadLocale(locale: Locale): Promise<Translations> {
  if (loadedLocales.has(locale)) {
    return loadedLocales.get(locale)!
  }

  try {
    const mod = await import(`./locales/${locale}.ts`)
    const translations = mod.default || mod
    loadedLocales.set(locale, translations)
    return translations
  } catch (e) {
    console.warn(`Failed to load locale: ${locale}`, e)
    return {}
  }
}

/**
 * 设置当前语言
 */
export async function setLocale(locale: Locale): Promise<void> {
  const messages = await loadLocale(locale)
  
  currentLocale.value = locale
  currentMessages.value = messages
  
  // 保存到 localStorage
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {}
}

/**
 * 翻译函数
 * 支持嵌套 key，如 t('ingredients.green_tea')
 */
export function t(key: string, params?: Record<string, any>): string {
  const messages = currentMessages.value
  
  // 尝试从当前语言获取
  let value = getNestedValue(messages, key)
  
  // 如果没找到，尝试 fallback
  if (value === undefined || value === null) {
    value = getNestedValue(fallbackMessages, key)
  }
  
  // 如果还是没找到，返回 key 本身
  if (value === undefined || value === null) {
    return key
  }
  
  // 参数替换
  if (params && typeof value === 'string') {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  
  return String(value)
}

/**
 * 获取嵌套值
 */
function getNestedValue(obj: Translations, path: string): any {
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = current[part]
  }
  return current
}

/**
 * 获取当前语言代码
 */
export function getCurrentLocale(): Locale {
  return currentLocale.value
}

/**
 * 初始化 i18n
 */
export async function initI18n(): Promise<void> {
  // 加载 fallback（英文）
  fallbackMessages = await loadLocale('en')
  
  // 确定初始语言
  let initialLocale: Locale = 'en'
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LOCALES.some(l => l.code === saved)) {
      initialLocale = saved as Locale
    } else {
      initialLocale = getBrowserLocale()
    }
  } catch {
    initialLocale = getBrowserLocale()
  }
  
  await setLocale(initialLocale)
}

/**
 * Vue composable - 在组件中使用
 */
export function useI18n() {
  return {
    t,
    locale: currentLocale,
    setLocale,
    SUPPORTED_LOCALES,
  }
}

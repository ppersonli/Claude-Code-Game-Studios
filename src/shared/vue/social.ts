/**
 * Social features — platform-aware share/favorite logic.
 * Works with Poki (shareableURL), CrazyGames (no SDK share — uses native UI), and local (clipboard).
 */

export interface ShareConfig {
  gameName: string
  gameSlug: string
  shareText: string
}

export type PlatformType = 'poki' | 'crazygames' | 'local'

export function detectPlatform(): PlatformType {
  if (typeof window === 'undefined') return 'local'
  if ((window as any).PokiSDK) return 'poki'
  if ((window as any).CrazyGames?.SDK) return 'crazygames'
  return 'local'
}

export async function getShareUrl(config: ShareConfig): Promise<string> {
  const platform = detectPlatform()
  if (platform === 'poki') {
    try {
      const poki = (window as any).PokiSDK
      if (poki?.shareableURL) {
        return await poki.shareableURL({ id: config.gameSlug, type: 'game' })
      }
    } catch { /* fall through */ }
  }
  // CG and local: use current URL as base
  return window.location.href
}

export async function shareGame(config: ShareConfig): Promise<boolean> {
  const url = await getShareUrl(config)
  const text = `${config.shareText} ${url}`

  // Try native Web Share API first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({ title: config.gameName, text: config.shareText, url })
      return true
    } catch { /* user cancelled or unsupported */ }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Final fallback: execCommand
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }
}

// === Favorites (localStorage) ===

const FAVORITES_KEY = 'cc-games-favorites'

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function isFavorite(gameSlug: string): boolean {
  return getFavorites().includes(gameSlug)
}

export function toggleFavorite(gameSlug: string): boolean {
  const favs = getFavorites()
  const idx = favs.indexOf(gameSlug)
  if (idx >= 0) {
    favs.splice(idx, 1)
  } else {
    favs.push(gameSlug)
  }
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)) } catch { /* */ }
  return idx < 0 // true if now favorited
}

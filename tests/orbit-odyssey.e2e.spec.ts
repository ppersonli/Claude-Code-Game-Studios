/**
 * Orbit Odyssey — Playwright E2E Tests
 * Covers: page load, no JS errors, menu, game start, HUD,
 *         overlays, localStorage, mobile viewport
 */
import { test, expect, type Page } from '@playwright/test'
import { createServer, type Server } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'

const GAMES_DIR = process.cwd()
const DIST_DIR = join(GAMES_DIR, 'dist/cg')

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

let server: Server | null = null
let serverPort = 0

function startServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    if (server) { resolve(serverPort); return }
    server = createServer((req, res) => {
      const url = req.url || ''
      let filePath = join(DIST_DIR, url === '/' ? '/src/games/orbit-odyssey/index.html' : url)

      if (!existsSync(filePath)) {
        filePath = join(DIST_DIR, 'assets', url.replace(/^\.\//, ''))
      }
      if (!existsSync(filePath)) {
        filePath = join(DIST_DIR, url.replace(/^\.\//, ''))
      }
      if (!existsSync(filePath)) {
        res.writeHead(404); res.end('Not found'); return
      }
      const ext = extname(filePath)
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      res.end(readFileSync(filePath))
    })
    server.listen(0, '127.0.0.1', () => {
      const addr = server!.address()
      serverPort = typeof addr === 'object' && addr ? addr.port : 0
      resolve(serverPort)
    })
    server.on('error', reject)
  })
}

test.beforeAll(async () => {
  await startServer()
})

test.afterAll(() => {
  server?.close()
  server = null
})

const GAME_URL = () => `http://127.0.0.1:${serverPort}/src/games/orbit-odyssey/index.html`

test.describe('Orbit Odyssey - E2E', () => {
  test('should load without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto(GAME_URL())
    await page.waitForTimeout(3000)

    const criticalErrors = errors.filter(e => !e.includes('net::') && !e.includes('ERR_'))
    expect(criticalErrors).toHaveLength(0)
  })

  test('should display game title', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 5000 })
  })

  test('should have LAUNCH button on menu', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await expect(launchBtn).toBeVisible({ timeout: 5000 })
  })

  test('should start game when clicking LAUNCH', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await launchBtn.click()

    await page.waitForTimeout(1000)
    const hud = page.locator('.hud')
    await expect(hud).toBeVisible({ timeout: 5000 })
  })

  test('should show upgrade button in HUD', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await launchBtn.click()
    await page.waitForTimeout(1000)

    const upgradeBtn = page.locator('.hud-buttons button').first()
    await expect(upgradeBtn).toBeVisible()
  })

  test('should open upgrades panel', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await launchBtn.click()
    await page.waitForTimeout(1000)

    const upgradeBtn = page.locator('.hud-buttons button').first()
    await upgradeBtn.click()

    const upgradesTitle = page.locator('.overlay-header h2:has-text("Upgrades")')
    await expect(upgradesTitle).toBeVisible({ timeout: 3000 })
  })

  test('should show upgrade items with cost', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await launchBtn.click()
    await page.waitForTimeout(1000)

    const upgradeBtn = page.locator('.hud-buttons button').first()
    await upgradeBtn.click()
    await page.waitForTimeout(500)

    const upgradeItems = page.locator('.upgrade-item')
    const count = await upgradeItems.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('should open ships panel', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await launchBtn.click()
    await page.waitForTimeout(1000)

    const shipsBtn = page.locator('.hud-buttons button').nth(1)
    await shipsBtn.click()

    const shipsTitle = page.locator('.overlay-header h2:has-text("Ships")')
    await expect(shipsTitle).toBeVisible({ timeout: 3000 })
  })

  test('should show ship list with scout unlocked', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await launchBtn.click()
    await page.waitForTimeout(1000)

    const shipsBtn = page.locator('.hud-buttons button').nth(1)
    await shipsBtn.click()
    await page.waitForTimeout(500)

    const shipItems = page.locator('.ship-item')
    const count = await shipItems.count()
    expect(count).toBe(5)

    const scoutShip = page.locator('.ship-item').first()
    await expect(scoutShip).not.toHaveClass(/locked/)
  })

  test('should open star systems panel', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await launchBtn.click()
    await page.waitForTimeout(1000)

    const systemsBtn = page.locator('.hud-buttons button').nth(2)
    await systemsBtn.click()

    const systemsTitle = page.locator('.overlay-header h2:has-text("Star Systems")')
    await expect(systemsTitle).toBeVisible({ timeout: 3000 })
  })

  test('should return to menu from game', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await launchBtn.click()
    await page.waitForTimeout(1000)

    // Menu button is the ☰ button in hud-buttons
    const menuBtn = page.locator('.hud-buttons .btn-ghost')
    await menuBtn.click()

    await page.waitForTimeout(1000)
    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 5000 })
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 5000 })

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await expect(launchBtn).toBeVisible()
  })

  test('should save game state to localStorage', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await launchBtn.click()
    await page.waitForTimeout(2000)

    const saveData = await page.evaluate(() => {
      return localStorage.getItem('orbit-odyssey-save')
    })
    expect(saveData).not.toBeNull()

    const parsed = JSON.parse(saveData!)
    expect(parsed).toHaveProperty('stardust')
    expect(parsed).toHaveProperty('upgrades')
    expect(parsed).toHaveProperty('unlockedShips')
    expect(parsed).toHaveProperty('prestigeCount')
  })

  test('should show stardust counter in HUD', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const launchBtn = page.locator('button:has-text("LAUNCH")')
    await launchBtn.click()
    await page.waitForTimeout(1000)

    const stardustDisplay = page.locator('.resource.stardust')
    await expect(stardustDisplay).toBeVisible()
    await expect(stardustDisplay).toContainText('✨')
  })
})

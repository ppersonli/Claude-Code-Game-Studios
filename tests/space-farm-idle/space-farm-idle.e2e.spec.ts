/**
 * Space Farm Idle — Playwright E2E Tests
 * Covers: page load, no JS errors, menu, game start, crop planting,
 *         upgrades, planets, prestige, weather, localStorage, mobile
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
      let filePath = join(DIST_DIR, url === '/' ? '/src/games/space-farm-idle/index.html' : url)

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

const GAME_URL = () => `http://127.0.0.1:${serverPort}/src/games/space-farm-idle/index.html`

test.describe('Space Farm Idle E2E', () => {
  test('should load without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(GAME_URL())
    await page.waitForTimeout(3000)

    const fatalErrors = errors.filter(e =>
      !e.includes('ERR_CONNECTION_CLOSED') && !e.includes('Failed to load resource')
    )
    expect(fatalErrors).toHaveLength(0)
  })

  test('should display menu screen with title and start button', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 5000 })

    const titleMain = page.locator('.title-main')
    await expect(titleMain).toContainText('SPACE FARM')

    const startBtn = page.locator('[data-testid="start-btn"]')
    await expect(startBtn).toBeVisible()
  })

  test('should start game and show farm grid', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const startBtn = page.locator('[data-testid="start-btn"]')
    await startBtn.click()

    // Farm grid should appear
    const farmGrid = page.locator('.farm-grid')
    await expect(farmGrid).toBeVisible({ timeout: 5000 })

    // HUD should be visible
    const coinDisplay = page.locator('[data-testid="coin-display"]')
    await expect(coinDisplay).toBeVisible({ timeout: 5000 })
  })

  test('should plant a crop when clicking crop button', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('[data-testid="start-btn"]').click()

    // Wait for crop palette
    const cropBtn = page.locator('[data-testid="plant-wheat"]')
    await expect(cropBtn).toBeVisible({ timeout: 5000 })

    // Plant wheat
    await cropBtn.click()
    await page.waitForTimeout(500)

    // Should have a crop slot with content
    const slots = page.locator('.crop-slot:not(.empty)')
    await expect(slots).toHaveCount(1, { timeout: 3000 })
  })

  test('should show crop growth progress', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('[data-testid="start-btn"]').click()

    const cropBtn = page.locator('[data-testid="plant-wheat"]')
    await expect(cropBtn).toBeVisible({ timeout: 5000 })
    await cropBtn.click()

    // Wait a bit for growth
    await page.waitForTimeout(2000)

    // Progress label should show a percentage
    const slotLabel = page.locator('.slot-label').first()
    await expect(slotLabel).toBeVisible()
    const text = await slotLabel.textContent()
    expect(text).toMatch(/\d+%|HARVEST/)
  })

  test('should open upgrades overlay', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('[data-testid="start-btn"]').click()

    // Click upgrades tab (⬆️)
    const upgradeTab = page.locator('.tab-btn').nth(1)
    await upgradeTab.click()

    const overlayHeader = page.locator('.overlay-header h2')
    await expect(overlayHeader.first()).toBeVisible({ timeout: 5000 })
    await expect(overlayHeader.first()).toContainText('Upgrades')
  })

  test('should show upgrade cards', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('[data-testid="start-btn"]').click()
    await page.locator('.tab-btn').nth(1).click()

    const upgradeCards = page.locator('.upgrade-card')
    await expect(upgradeCards).toHaveCount(6, { timeout: 5000 })
  })

  test('should open planets overlay', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('[data-testid="start-btn"]').click()

    const planetTab = page.locator('.tab-btn').nth(2)
    await planetTab.click()

    const overlayHeader = page.locator('.overlay-header h2')
    await expect(overlayHeader.first()).toBeVisible({ timeout: 5000 })
    await expect(overlayHeader.first()).toContainText('Planets')
  })

  test('should show planet cards', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('[data-testid="start-btn"]').click()
    await page.locator('.tab-btn').nth(2).click()

    const planetCards = page.locator('.planet-card')
    await expect(planetCards).toHaveCount(5, { timeout: 5000 })
  })

  test('should show prestige screen with stats', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('[data-testid="start-btn"]').click()

    const prestigeTab = page.locator('.tab-btn').nth(3)
    await prestigeTab.click()

    const prestigeGrid = page.locator('.prestige-grid')
    await expect(prestigeGrid).toBeVisible({ timeout: 5000 })

    const statBoxes = page.locator('.prestige-stat')
    await expect(statBoxes).toHaveCount(4)
  })

  test('should show weather badge', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('[data-testid="start-btn"]').click()

    const weatherBadge = page.locator('.weather-badge')
    await expect(weatherBadge).toBeVisible({ timeout: 5000 })
  })

  test('should persist game state to localStorage', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('[data-testid="start-btn"]').click()
    await page.waitForTimeout(2000)

    // Plant a crop to have some state
    const cropBtn = page.locator('[data-testid="plant-wheat"]')
    if (await cropBtn.isVisible()) {
      await cropBtn.click()
    }

    await page.waitForTimeout(2000)

    const saveData = await page.evaluate(() => {
      return localStorage.getItem('space-farm-save')
    })
    expect(saveData).toBeTruthy()

    const parsed = JSON.parse(saveData!)
    expect(parsed).toHaveProperty('coins')
    expect(parsed).toHaveProperty('unlockedPlanets')
    expect(parsed).toHaveProperty('unlockedCrops')
  })

  test('should handle corrupted localStorage gracefully', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(1000)

    await page.evaluate(() => {
      localStorage.setItem('space-farm-save', 'CORRUPTED_JSON!!!')
    })

    await page.reload()
    await page.waitForTimeout(2000)

    const title = page.locator('.title-main')
    await expect(title).toBeVisible({ timeout: 5000 })

    const startBtn = page.locator('[data-testid="start-btn"]')
    await expect(startBtn).toBeVisible()
  })

  test('should return to menu from game', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('[data-testid="start-btn"]').click()

    // Click menu button (☰) — use broad selector like space-factory-idle
    const menuBtn = page.locator('.btn-icon')
    await menuBtn.click()
    await page.waitForTimeout(500)

    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 5000 })
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const title = page.locator('.title-main')
    await expect(title).toBeVisible({ timeout: 5000 })

    await page.locator('[data-testid="start-btn"]').click()

    const coinDisplay = page.locator('[data-testid="coin-display"]')
    await expect(coinDisplay).toBeVisible({ timeout: 5000 })
  })
})

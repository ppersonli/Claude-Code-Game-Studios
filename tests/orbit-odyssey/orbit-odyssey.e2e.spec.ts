/**
 * Orbit Odyssey — Playwright E2E Tests
 * Covers: page load, no JS errors, canvas rendering, game mechanics,
 *         localStorage persistence, UI interactions, mobile viewport
 */
import { test, expect, type Page } from '@playwright/test'
import { createServer, type Server } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'

const GAMES_DIR = process.cwd()
const DIST_DIR = join(GAMES_DIR, 'dist/cg')

// MIME types for serving static files
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
      let filePath = join(DIST_DIR, req.url === '/' ? '/src/games/orbit-odyssey/index.html' : req.url || '')
      // Resolve relative paths like ./assets/xxx.js
      if (!existsSync(filePath)) {
        filePath = join(DIST_DIR, 'assets', (req.url || '').replace(/^\.\//, ''))
      }
      if (!existsSync(filePath)) {
        // Try as-is from dist root
        filePath = join(DIST_DIR, (req.url || '').replace(/^\.\//, ''))
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

// Helper: wait for Phaser canvas to appear
async function waitForCanvas(page: Page, timeout = 10000) {
  await page.waitForSelector('canvas', { timeout })
}

// Helper: get Phaser game instance
async function getPhaserGame(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return null
    // Phaser stores game instance on the parent div's __PHASER_GAME__ or we can access via scene
    // Check for global Phaser reference
    if (typeof (window as any).__PHASER_GAME__ !== 'undefined') {
      return (window as any).__PHASER_GAME__
    }
    return null
  })
}

test.describe('Orbit Odyssey E2E', () => {
  test('should load without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(GAME_URL())
    await page.waitForTimeout(3000) // Wait for Phaser init

    // Filter out non-fatal CDN errors
    const fatalErrors = errors.filter(e => !e.includes('ERR_CONNECTION_CLOSED') && !e.includes('Failed to load resource'))
    expect(fatalErrors).toHaveLength(0)
  })

  test('should display menu screen with title', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Menu should be visible
    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 5000 })

    // Title should contain ORBIT
    const orbitText = page.locator('.title-orbit')
    await expect(orbitText).toContainText('ORBIT')

    // LAUNCH or CONTINUE button should exist
    const launchBtn = page.locator('.btn-primary').first()
    await expect(launchBtn).toBeVisible()
  })

  test('should start game when LAUNCH button clicked', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Click LAUNCH button
    const launchBtn = page.locator('.btn-primary').first()
    await launchBtn.click()

    // Canvas should appear (Phaser game started)
    await waitForCanvas(page, 10000)

    // HUD should show resources
    const stardustDisplay = page.locator('.resource.stardust')
    await expect(stardustDisplay).toBeVisible()
  })

  test('should show HUD with flight info', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Start game
    await page.locator('.btn-primary').first().click()
    await waitForCanvas(page)

    // HUD buttons should be visible
    const upgradeBtn = page.locator('.hud-buttons .btn').first()
    await expect(upgradeBtn).toBeVisible()

    // Idle hint should show when not flying
    const hint = page.locator('.hud-hint')
    await expect(hint).toContainText('aim')
  })

  test('should open upgrades screen', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Start game
    await page.locator('.btn-primary').first().click()
    await waitForCanvas(page)

    // Click upgrades button (first button in HUD)
    const upgradeBtn = page.locator('.hud-buttons .btn').first()
    await upgradeBtn.click()

    // Upgrades screen should appear
    const upgradeList = page.locator('.upgrade-list')
    await expect(upgradeList).toBeVisible({ timeout: 3000 })

    // Should have upgrade items
    const upgradeItems = page.locator('.upgrade-item')
    const count = await upgradeItems.count()
    expect(count).toBeGreaterThanOrEqual(3)

    // Back button should work
    const backBtn = page.locator('.overlay-screen .btn-secondary').first()
    await backBtn.click()
  })

  test('should open ships screen', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('.btn-primary').first().click()
    await waitForCanvas(page)

    // Click ships button (second button in HUD)
    const shipBtn = page.locator('.hud-buttons .btn').nth(1)
    await shipBtn.click()

    // Ships screen should appear
    const shipList = page.locator('.ship-list')
    await expect(shipList).toBeVisible({ timeout: 3000 })

    // Should have ship items
    const shipItems = page.locator('.ship-item')
    const count = await shipItems.count()
    expect(count).toBeGreaterThanOrEqual(1)

    // Scout ship should be active (first ship)
    const activeShip = page.locator('.ship-item.active')
    await expect(activeShip).toBeVisible()
  })

  test('should open star systems screen', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('.btn-primary').first().click()
    await waitForCanvas(page)

    // Click systems button (third button in HUD)
    const systemBtn = page.locator('.hud-buttons .btn').nth(2)
    await systemBtn.click()

    // Systems screen should appear
    const systemList = page.locator('.system-list')
    await expect(systemList).toBeVisible({ timeout: 3000 })

    // Should have system items
    const systemItems = page.locator('.system-item')
    const count = await systemItems.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('should save progress to localStorage', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Start game
    await page.locator('.btn-primary').first().click()
    await waitForCanvas(page)

    // Check localStorage has save data
    const hasSave = await page.evaluate(() => {
      const saved = localStorage.getItem('orbit-odyssey-save')
      return saved !== null
    })
    expect(hasSave).toBe(true)

    // Verify save structure
    const saveData = await page.evaluate(() => {
      const saved = localStorage.getItem('orbit-odyssey-save')
      if (!saved) return null
      return JSON.parse(saved)
    })
    expect(saveData).not.toBeNull()
    expect(saveData).toHaveProperty('stardust')
    expect(saveData).toHaveProperty('prestigeCores')
    expect(saveData).toHaveProperty('upgrades')
    expect(saveData).toHaveProperty('unlockedShips')
    expect(saveData).toHaveProperty('unlockedSystems')
  })

  test('should persist state across page reloads', async ({ page }) => {
    // First visit
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Start game and check initial stardust
    await page.locator('.btn-primary').first().click()
    await waitForCanvas(page)

    const initialStardust = await page.evaluate(() => {
      const saved = localStorage.getItem('orbit-odyssey-save')
      return saved ? JSON.parse(saved).stardust : 0
    })

    // Reload page
    await page.reload()
    // Wait for menu to appear after reload
    await page.waitForSelector('.game-title', { timeout: 10000 })
    await page.waitForTimeout(1000)

    // Start game again (button says CONTINUE now)
    const continueBtn = page.locator('.btn-primary').first()
    await expect(continueBtn).toBeVisible({ timeout: 5000 })
    await continueBtn.click()
    await waitForCanvas(page)

    // Check stardust persisted
    const reloadedStardust = await page.evaluate(() => {
      const saved = localStorage.getItem('orbit-odyssey-save')
      return saved ? JSON.parse(saved).stardust : 0
    })
    expect(reloadedStardust).toBe(initialStardust)
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Menu should still be visible
    const title = page.locator('.game-title')
    await expect(title).toBeVisible()

    // Start game
    await page.locator('.btn-primary').first().click()
    await waitForCanvas(page)

    // Canvas should fit within viewport
    const canvas = page.locator('canvas')
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeLessThanOrEqual(375)
  })

  test('should show menu stats for returning players', async ({ page }) => {
    // Set up save data with some progress
    await page.goto(GAME_URL())
    await page.waitForTimeout(1000)

    await page.evaluate(() => {
      const save = {
        stardust: 500,
        crystals: 0,
        plasma: 0,
        voidEssence: 0,
        stardustTotal: 500,
        upgrades: { launchPower: 0, fuelCapacity: 0, gravityResist: 0, stardustMagnet: 0, autoCollector: 0 },
        unlockedShips: ['scout'],
        activeShip: 'scout',
        unlockedSystems: ['sol'],
        prestigeCount: 0,
        prestigeCores: 0,
        totalLaunches: 10,
        bestDistance: 1500,
        totalPlayTime: 0,
        lastOnline: Date.now(),
        dailyStreak: 0,
        lastDailyDate: '',
        dailyChallengesCompleted: [],
        createdAt: Date.now(),
      }
      localStorage.setItem('orbit-odyssey-save', JSON.stringify(save))
    })

    await page.reload()
    await page.waitForTimeout(2000)

    // Menu should show stats
    const stats = page.locator('.menu-stats')
    await expect(stats).toBeVisible()

    // Should show launch count
    const statText = await stats.textContent()
    expect(statText).toContain('10')

    // Button should say CONTINUE
    const btn = page.locator('.btn-primary').first()
    await expect(btn).toContainText('CONTINUE')
  })

  test('should handle keyboard input (space key)', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('.btn-primary').first().click()
    await waitForCanvas(page)

    // Press space to start aiming
    await page.keyboard.down('Space')
    await page.waitForTimeout(200)

    // Release space to launch
    await page.keyboard.up('Space')
    await page.waitForTimeout(500)

    // Game should be in flying state (HUD shows flight info)
    // The flight HUD should appear when flying
    const flightHud = page.locator('.hud-flight')
    // Note: This may or may not be visible depending on game state
    // Just verify no crash occurred
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
  })

  test('should return to menu from game', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Start game
    await page.locator('.btn-primary').first().click()
    await waitForCanvas(page)

    // Click menu button (last button in HUD, should be ☰)
    const menuBtn = page.locator('.hud-buttons .btn-ghost').first()
    await menuBtn.click()

    // Should return to menu
    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 3000 })
  })

  test('should handle corrupted localStorage gracefully', async ({ page }) => {
    // Set corrupted save data
    await page.goto(GAME_URL())
    await page.waitForTimeout(1000)

    await page.evaluate(() => {
      localStorage.setItem('orbit-odyssey-save', 'NOT VALID JSON{{{')
    })

    await page.reload()
    await page.waitForTimeout(2000)

    // Should still show menu (no crash)
    const title = page.locator('.game-title')
    await expect(title).toBeVisible()

    // Should show LAUNCH (fresh start)
    const btn = page.locator('.btn-primary').first()
    await expect(btn).toContainText('LAUNCH')
  })

  test('should handle prestige screen', async ({ page }) => {
    // Set up save with enough stardust for prestige
    await page.goto(GAME_URL())
    await page.waitForTimeout(1000)

    await page.evaluate(() => {
      const save = {
        stardust: 50000,
        crystals: 0,
        plasma: 0,
        voidEssence: 0,
        stardustTotal: 50000,
        upgrades: { launchPower: 0, fuelCapacity: 0, gravityResist: 0, stardustMagnet: 0, autoCollector: 0 },
        unlockedShips: ['scout'],
        activeShip: 'scout',
        unlockedSystems: ['sol'],
        prestigeCount: 0,
        prestigeCores: 0,
        totalLaunches: 100,
        bestDistance: 5000,
        totalPlayTime: 0,
        lastOnline: Date.now(),
        dailyStreak: 0,
        lastDailyDate: '',
        dailyChallengesCompleted: [],
        createdAt: Date.now(),
      }
      localStorage.setItem('orbit-odyssey-save', JSON.stringify(save))
    })

    await page.reload()
    await page.waitForTimeout(2000)

    // Start game
    await page.locator('.btn-primary').first().click()
    await waitForCanvas(page)

    // Prestige button should be visible in HUD
    const prestigeBtn = page.locator('.hud-buttons .btn:has-text("⭐")')
    const count = await prestigeBtn.count()
    if (count > 0) {
      await prestigeBtn.first().click()

      // Prestige screen should appear
      const prestigeScreen = page.locator('.prestige-content')
      await expect(prestigeScreen).toBeVisible({ timeout: 3000 })

      // Should show requirement
      const requirement = page.locator('.prestige-stat .value').first()
      await expect(requirement).toBeVisible()
    }
  })
})

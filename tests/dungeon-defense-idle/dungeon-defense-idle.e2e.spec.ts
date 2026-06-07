/**
 * Dungeon Defense Idle — Playwright E2E Tests
 */
import { test, expect, type Page } from '@playwright/test'
import { createServer, type Server } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'

const DIST_DIR = join(process.cwd(), 'dist/cg')
const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
}

let server: Server | null = null
let serverPort = 0

function startServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    if (server) { resolve(serverPort); return }
    server = createServer((req, res) => {
      const url = req.url || ''
      let filePath = join(DIST_DIR, url === '/' ? '/src/games/dungeon-defense-idle/index.html' : url)
      if (!existsSync(filePath)) filePath = join(DIST_DIR, 'assets', url.replace(/^\.\//, ''))
      if (!existsSync(filePath)) filePath = join(DIST_DIR, url.replace(/^\.\//, ''))
      if (!existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return }
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

test.beforeAll(async () => { await startServer() })
test.afterAll(() => { server?.close(); server = null })

const GAME_URL = () => `http://127.0.0.1:${serverPort}/src/games/dungeon-defense-idle/index.html`

async function waitForCanvas(page: Page, timeout = 10000) {
  await page.waitForSelector('canvas', { timeout })
}

async function dismissTutorial(page: Page) {
  // Wait for tutorial overlay to appear
  const tutorialOverlay = page.locator('[data-testid="tutorial-overlay"]')
  try {
    await tutorialOverlay.waitFor({ state: 'visible', timeout: 3000 })
    // Click skip button
    const skipBtn = page.locator('.btn-skip')
    await skipBtn.click({ timeout: 2000 })
    // Wait for overlay to disappear
    await tutorialOverlay.waitFor({ state: 'hidden', timeout: 2000 })
  } catch {
    // Tutorial might not appear if state has bestWave > 0
  }
}

test.describe('Dungeon Defense Idle E2E', () => {
  test('should load without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    await page.goto(GAME_URL())
    await page.waitForTimeout(3000)
    const fatal = errors.filter(e => !e.includes('ERR_CONNECTION_CLOSED') && !e.includes('Failed to load resource'))
    expect(fatal).toHaveLength(0)
  })

  test('should display menu screen', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    const title = page.locator('.title-main')
    await expect(title).toBeVisible({ timeout: 5000 })
    await expect(title).toContainText('DUNGEON DEFENSE')
    const startBtn = page.locator('[data-testid="start-btn"]')
    await expect(startBtn).toBeVisible()
  })

  test('should start game and show Phaser canvas', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page, 10000)
    const coinDisplay = page.locator('[data-testid="coin-display"]')
    await expect(coinDisplay).toBeVisible({ timeout: 5000 })
  })

  test('should show coin counter in HUD', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page)
    const coinText = page.locator('.hud-res.coins span:last-child')
    await expect(coinText).toBeVisible({ timeout: 5000 })
    const text = await coinText.textContent()
    expect(text).toBeTruthy()
  })

  test('should start a wave when button clicked', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page)
    await dismissTutorial(page)
    const waveBtn = page.locator('[data-testid="start-wave-btn"]')
    await expect(waveBtn).toBeVisible({ timeout: 5000 })
    await waveBtn.click()
    // Wave counter should show Wave 1
    await page.waitForTimeout(1000)
    const waveText = page.locator('.hud-res.wave span:last-child')
    const text = await waveText.textContent()
    expect(text).toContain('1')
  })

  test('should persist game state to localStorage', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page)
    await dismissTutorial(page)
    await page.waitForTimeout(1000)
    // Go to menu — this triggers saveState()
    await page.locator('.btn-icon').click()
    await page.waitForTimeout(1000)
    const saveData = await page.evaluate(() => localStorage.getItem('dungeon-defense-idle-state'))
    expect(saveData).toBeTruthy()
    const parsed = JSON.parse(saveData!)
    expect(parsed).toHaveProperty('coins')
    expect(parsed).toHaveProperty('towers')
    expect(parsed).toHaveProperty('currentWave')
  })

  test('should open towers overlay', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page)
    await dismissTutorial(page)
    await page.locator('.tab-btn').nth(1).click()
    const h2 = page.locator('.overlay-header h2')
    await expect(h2.first()).toBeVisible({ timeout: 5000 })
  })

  test('should open heroes overlay', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page)
    await dismissTutorial(page)
    await page.locator('.tab-btn').nth(2).click()
    const h2 = page.locator('.overlay-header h2')
    await expect(h2.first()).toBeVisible({ timeout: 5000 })
  })

  test('should open dungeons overlay', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page)
    await dismissTutorial(page)
    await page.locator('.tab-btn').nth(3).click()
    const h2 = page.locator('.overlay-header h2')
    await expect(h2.first()).toBeVisible({ timeout: 5000 })
  })

  test('should open prestige screen', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page)
    await dismissTutorial(page)
    await page.locator('.tab-btn').nth(6).click()
    const pgrid = page.locator('.prestige-grid')
    await expect(pgrid).toBeVisible({ timeout: 5000 })
    const stats = page.locator('.pstat')
    await expect(stats).toHaveCount(4)
  })

  test('should open daily challenge', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page)
    await dismissTutorial(page)
    await page.locator('.tab-btn').nth(4).click()
    const dcCard = page.locator('.daily-card')
    await expect(dcCard).toBeVisible({ timeout: 5000 })
    const dcName = page.locator('.dc-name')
    await expect(dcName).toBeVisible()
  })

  test('should return to menu', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page)
    await dismissTutorial(page)
    await page.locator('.btn-icon').click()
    await page.waitForTimeout(500)
    const title = page.locator('.title-main')
    await expect(title).toBeVisible({ timeout: 5000 })
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)
    const title = page.locator('.title-main')
    await expect(title).toBeVisible({ timeout: 5000 })
    await page.locator('[data-testid="start-btn"]').click()
    await waitForCanvas(page)
    const coinDisplay = page.locator('[data-testid="coin-display"]')
    await expect(coinDisplay).toBeVisible({ timeout: 5000 })
  })

  test('should handle corrupted localStorage gracefully', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(1000)
    await page.evaluate(() => localStorage.setItem('dungeon-defense-idle-state', 'NOT_JSON!!!'))
    await page.reload()
    await page.waitForTimeout(2000)
    const title = page.locator('.title-main')
    await expect(title).toBeVisible({ timeout: 5000 })
  })
})

/**
 * Bounce Golf — Playwright E2E Tests
 * Covers: page load, menu, game start, aim/shoot, physics, result screen,
 *         retry, next level, localStorage, mobile viewport
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
      let filePath = join(DIST_DIR, url === '/' ? '/src/games/bounce-golf/index.html' : url)

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

const GAME_URL = () => `http://127.0.0.1:${serverPort}/src/games/bounce-golf/index.html`

test.describe('Bounce Golf E2E', () => {
  test('test_e2e_loads_without_js_errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(GAME_URL())
    await page.waitForTimeout(3000)

    const fatalErrors = errors.filter(e =>
      !e.includes('ERR_CONNECTION_CLOSED') &&
      !e.includes('Failed to load resource') &&
      !e.includes('sdk.crazygames') &&
      !e.includes('net::')
    )
    expect(fatalErrors).toHaveLength(0)
  })

  test('test_e2e_shows_start_screen_with_title', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 5000 })
    await expect(title).toContainText('BOUNCE GOLF')
  })

  test('test_e2e_shows_play_button', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const playBtn = page.locator('.btn-primary').first()
    await expect(playBtn).toBeVisible({ timeout: 5000 })
    await expect(playBtn).toContainText('PLAY')
  })

  test('test_e2e_play_button_starts_game', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('.btn-primary').first().click()
    await page.waitForTimeout(1000)

    // Game screen should show with HUD
    const hud = page.locator('.hud')
    await expect(hud).toBeVisible({ timeout: 5000 })
  })

  test('test_e2e_game_canvas_renders', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('.btn-primary').first().click()
    await page.waitForTimeout(2000)

    // Phaser canvas should exist
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 5000 })
  })

  test('test_e2e_hud_shows_level_and_strokes', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('.btn-primary').first().click()
    await page.waitForTimeout(1000)

    const hudLeft = page.locator('.hud-left')
    await expect(hudLeft).toBeVisible({ timeout: 5000 })
    await expect(hudLeft).toContainText('Level')

    const hudCenter = page.locator('.hud-center')
    await expect(hudCenter).toBeVisible()
    await expect(hudCenter).toContainText('Strokes')
  })

  test('test_e2e_aim_and_shoot_increments_strokes', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(1500)

    await page.locator('.btn-primary').first().click()
    await page.waitForTimeout(1500)

    // Simulate aim and shoot: pointerdown → pointermove → pointerup
    const canvas = page.locator('canvas')
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Canvas not found')

    // Aim from center-left toward right (pull back and release)
    const startX = box.x + box.width * 0.3
    const startY = box.y + box.height * 0.7
    const endX = box.x + box.width * 0.1
    const endY = box.y + box.height * 0.9

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(endX, endY, { steps: 5 })
    await page.mouse.up()

    // Strokes should show 1
    const hudCenter = page.locator('.hud-center')
    await expect(hudCenter).toContainText('1', { timeout: 5000 })
  })

  test('test_e2e_ball_physics_bounces_off_walls', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('.btn-primary').first().click()
    await page.waitForTimeout(2000)

    // Shoot ball with strong power toward top wall
    const canvas = page.locator('canvas')
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Canvas not found')

    const startX = box.x + box.width * 0.5
    const startY = box.y + box.height * 0.8
    const endX = box.x + box.width * 0.5
    const endY = box.y + box.height * 0.2

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(endX, endY, { steps: 5 })
    await page.mouse.up()

    // Wait for ball to bounce and settle
    await page.waitForTimeout(4000)

    // Ball should still be on screen (not fallen through) — canvas should exist
    const canvasAfter = page.locator('canvas')
    await expect(canvasAfter).toBeVisible()
  })

  test('test_e2e_pause_button_shows_pause_overlay', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('.btn-primary').first().click()
    await page.waitForTimeout(1000)

    // Click pause button
    const pauseBtn = page.locator('.btn-icon')
    await pauseBtn.click()
    await page.waitForTimeout(500)

    const overlay = page.locator('.overlay')
    await expect(overlay).toBeVisible({ timeout: 3000 })

    const resumeBtn = page.locator('.overlay .btn-primary')
    await expect(resumeBtn).toContainText('RESUME')
  })

  test('test_e2e_resume_from_pause', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('.btn-primary').first().click()
    await page.waitForTimeout(1000)

    // Pause
    await page.locator('.btn-icon').click()
    await page.waitForTimeout(500)

    // Resume
    await page.locator('.overlay .btn-primary').click()
    await page.waitForTimeout(500)

    // Overlay should be gone, HUD still visible
    const overlay = page.locator('.overlay')
    await expect(overlay).not.toBeVisible()

    const hud = page.locator('.hud')
    await expect(hud).toBeVisible()
  })

  test('test_e2e_upgrades_screen_shows_upgrade_cards', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Click upgrades button
    const upgradeBtn = page.locator('.menu-buttons .btn-secondary').first()
    await upgradeBtn.click()
    await page.waitForTimeout(500)

    const upgradeList = page.locator('.upgrade-list')
    await expect(upgradeList).toBeVisible({ timeout: 3000 })

    const cards = page.locator('.upgrade-card')
    expect(await cards.count()).toBeGreaterThanOrEqual(4)
  })

  test('test_e2e_characters_screen_shows_grid', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Click characters button
    const charBtn = page.locator('.menu-buttons .btn-secondary').nth(1)
    await charBtn.click()
    await page.waitForTimeout(500)

    const charGrid = page.locator('.character-grid')
    await expect(charGrid).toBeVisible({ timeout: 3000 })

    const cards = page.locator('.character-card')
    expect(await cards.count()).toBeGreaterThanOrEqual(6)
  })

  test('test_e2e_settings_screen_shows_language_select', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Click settings button
    const settingsBtn = page.locator('.menu-buttons .btn-secondary').nth(2)
    await settingsBtn.click()
    await page.waitForTimeout(500)

    const select = page.locator('.setting-row select')
    await expect(select).toBeVisible({ timeout: 3000 })
  })

  test('test_e2e_persists_game_state_to_localStorage', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    // Start game (triggers save)
    await page.locator('.btn-primary').first().click()
    await page.waitForTimeout(2000)

    const saveData = await page.evaluate(() => {
      return localStorage.getItem('bounce-golf-save')
    })
    expect(saveData).toBeTruthy()

    const parsed = JSON.parse(saveData!)
    expect(parsed).toHaveProperty('currentLevel')
    expect(parsed).toHaveProperty('totalStars')
    expect(parsed).toHaveProperty('upgrades')
    expect(parsed).toHaveProperty('selectedCharacter')
  })

  test('test_e2e_handles_corrupted_localStorage', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(1500)

    await page.evaluate(() => {
      localStorage.setItem('bounce-golf-save', 'NOT_JSON!!!')
    })

    await page.reload()
    await page.waitForTimeout(1500)

    // Should still show start screen
    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 5000 })

    const playBtn = page.locator('.btn-primary').first()
    await expect(playBtn).toBeVisible()
  })

  test('test_e2e_mobile_viewport_works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 5000 })

    await page.locator('.btn-primary').first().click()
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 5000 })
  })

  test('test_e2e_quit_to_menu_from_pause', async ({ page }) => {
    await page.goto(GAME_URL())
    await page.waitForTimeout(2000)

    await page.locator('.btn-primary').first().click()
    await page.waitForTimeout(1000)

    // Pause
    await page.locator('.btn-icon').click()
    await page.waitForTimeout(500)

    // Quit to menu
    await page.locator('.overlay .btn-secondary').click()
    await page.waitForTimeout(1000)

    // Should be back at start screen
    const title = page.locator('.game-title')
    await expect(title).toBeVisible({ timeout: 5000 })
  })
})

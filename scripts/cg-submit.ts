import { chromium } from 'playwright'
import { join } from 'path'

const CDP_URL = 'http://127.0.0.1:9223'
const GAME_DIR = join(process.cwd(), 'dist/cg/src/games/bubble-tea-lab')
const GAME_TITLE = 'Bubble Tea Lab'

async function main() {
  console.log('Connecting to CDP browser...')
  const browser = await chromium.connectOverCDP(CDP_URL)
  const contexts = browser.contexts()
  console.log(`Found ${contexts.length} contexts`)

  // Find the CG developer tab
  const pages = contexts.flatMap(c => c.pages())
  const cgPage = pages.find(p => p.url().includes('developer.crazygames.com'))

  if (!cgPage) {
    console.error('CG Developer tab not found! Open https://developer.crazygames.com/submit first.')
    await browser.close()
    process.exit(1)
  }

  const page = cgPage
  console.log(`Found CG tab: ${page.url()}`)

  // Make sure we're on submit page
  if (!page.url().includes('/submit')) {
    console.log('Navigating to submit page...')
    await page.goto('https://developer.crazygames.com/submit', { waitUntil: 'commit', timeout: 30000 })
    await page.waitForTimeout(3000)
  }

  // Wait for the form to load
  await page.waitForTimeout(2000)

  // Take a screenshot to see current state
  await page.screenshot({ path: '/tmp/cg-submit-01-initial.png', fullPage: true })
  console.log('Screenshot saved: /tmp/cg-submit-01-initial.png')

  // Print page content for debugging
  const title = await page.title()
  console.log(`Page title: ${title}`)

  // Look for form elements
  const inputs = await page.$$('input, select, textarea, button')
  console.log(`Found ${inputs.length} form elements`)
  for (const input of inputs) {
    const tag = await input.evaluate(el => el.tagName)
    const type = await input.evaluate(el => (el as HTMLInputElement).type || '')
    const name = await input.evaluate(el => (el as HTMLInputElement).name || (el as HTMLSelectElement).id || '')
    const placeholder = await input.evaluate(el => (el as HTMLInputElement).placeholder || '')
    const text = await input.evaluate(el => el.textContent?.trim().slice(0, 50) || '')
    console.log(`  ${tag} type=${type} name="${name}" placeholder="${placeholder}" text="${text}"`)
  }

  await browser.close()
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})

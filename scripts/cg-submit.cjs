const { chromium } = require('@playwright/test')
const path = require('path')

const CDP_URL = 'http://127.0.0.1:9223'
const GAME_DIR = path.join(process.cwd(), 'dist/cg/src/games/bubble-tea-lab')

async function main() {
  console.log('Connecting to CDP browser...')
  const browser = await chromium.connectOverCDP(CDP_URL)
  const contexts = browser.contexts()
  console.log(`Found ${contexts.length} contexts`)

  const pages = contexts.flatMap(c => c.pages())
  const cgPage = pages.find(p => p.url().includes('developer.crazygames.com'))

  if (!cgPage) {
    console.error('CG Developer tab not found!')
    await browser.close()
    process.exit(1)
  }

  const page = cgPage
  console.log(`Found CG tab: ${page.url()}`)

  if (!page.url().includes('/submit')) {
    console.log('Navigating to submit page...')
    await page.goto('https://developer.crazygames.com/submit', { waitUntil: 'commit', timeout: 30000 })
    await page.waitForTimeout(3000)
  }

  await page.waitForTimeout(2000)
  await page.screenshot({ path: '/tmp/cg-submit-01.png', fullPage: true })
  console.log('Screenshot: /tmp/cg-submit-01.png')

  const title = await page.title()
  console.log(`Page title: ${title}`)

  // List all interactive elements
  const elements = await page.evaluate(() => {
    const els = document.querySelectorAll('input, select, textarea, button, [role="button"], a[href]')
    return Array.from(els).map(el => ({
      tag: el.tagName,
      type: el.type || '',
      name: el.name || el.id || '',
      placeholder: el.placeholder || '',
      text: el.textContent?.trim().slice(0, 80) || '',
      className: el.className?.toString().slice(0, 60) || '',
    }))
  })

  console.log(`Found ${elements.length} interactive elements:`)
  for (const el of elements) {
    console.log(`  ${el.tag} type=${el.type} name="${el.name}" text="${el.text}" class="${el.className}"`)
  }

  await browser.close()
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})

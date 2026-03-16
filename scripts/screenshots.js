#!/usr/bin/env node
/**
 * scripts/screenshots.js
 *
 * Launches a headless Chromium browser, navigates every MeetPrep page,
 * and saves full-page screenshots to docs/screenshots/.
 *
 * ── Usage ──────────────────────────────────────────────────────────────────
 *   npm run screenshots
 *
 * ── Prerequisites ──────────────────────────────────────────────────────────
 *   1. Install the Playwright browser once:
 *        npm run screenshots:install
 *
 *   2. The dev server must be running:
 *        npm run dev
 *
 *   3. For authenticated pages, set these env vars (or add to .env.local):
 *        SCREENSHOT_EMAIL=your@email.com
 *        SCREENSHOT_PASSWORD=yourpassword
 *
 * ── Output ─────────────────────────────────────────────────────────────────
 *   docs/screenshots/
 *     01-landing.png
 *     02-login.png
 *     03-signup.png
 *     04-dashboard.png              (requires auth)
 *     05-dashboard-brief-ready.png  (requires auth + demo brief)
 *     06-brief-viewer.png           (public page)
 *     07-settings.png               (requires auth)
 *     08-settings-billing.png       (requires auth)
 *     09-brief-email-preview.png    (public page via /briefs/{id})
 */

const { chromium } = require('playwright')
const path         = require('path')
const fs           = require('fs')

// ── Config ──────────────────────────────────────────────────────────────────

// Read .env.local if it exists (simple key=value parser, no dependencies)
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnvLocal()

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
const EMAIL    = process.env.SCREENSHOT_EMAIL
const PASSWORD = process.env.SCREENSHOT_PASSWORD
const OUT_DIR  = path.join(__dirname, '..', 'docs', 'screenshots')
const VIEWPORT = { width: 1440, height: 900 }

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg)   { console.log(`  ${msg}`) }
function ok(file)   { console.log(`  ✅  Saved → ${path.relative(process.cwd(), file)}`) }
function warn(msg)  { console.warn(`  ⚠️   ${msg}`) }
function header(h)  { console.log(`\n── ${h} ${'─'.repeat(Math.max(0, 60 - h.length))}`) }

async function screenshot(page, filename, opts = {}) {
  const fullPath = path.join(OUT_DIR, filename)
  await page.screenshot({
    path: fullPath,
    fullPage: opts.fullPage !== false,
    animations: 'disabled',
  })
  ok(fullPath)
  return fullPath
}

async function waitForNetworkIdle(page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {})
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function signIn(page) {
  if (!EMAIL || !PASSWORD) {
    warn('SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD not set — skipping auth pages.')
    return false
  }

  log(`Signing in as ${EMAIL} …`)
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await waitForNetworkIdle(page)

  // Fill the sign-in form (adjust selectors if your form uses different names)
  await page.fill('input[type="email"]',    EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')

  // Wait for redirect away from /login
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15000 })
    .catch(() => { throw new Error('Sign-in failed — check SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD') })

  await waitForNetworkIdle(page)
  log('Signed in successfully.')
  return true
}

// ── Main ──────────────────────────────────────────────────────────────────────

;(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('\n📸  MeetPrep Screenshot Runner')
  console.log(`    Base URL : ${BASE_URL}`)
  console.log(`    Output   : ${OUT_DIR}`)
  console.log(`    Auth     : ${EMAIL ? EMAIL : 'not configured (public pages only)'}`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport:          VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme:       'light',
  })
  const page = await context.newPage()

  // Silence console noise from the app
  page.on('console', () => {})
  page.on('pageerror', () => {})

  let briefId = null
  let authOk  = false

  try {
    // ── 1. Landing page ──────────────────────────────────────────────────────
    header('Public pages')

    log('Navigating to landing page …')
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await waitForNetworkIdle(page)
    await screenshot(page, '01-landing.png')

    // ── 2. Login page ────────────────────────────────────────────────────────
    log('Navigating to /login …')
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
    await waitForNetworkIdle(page)
    await screenshot(page, '02-login.png')

    // ── 3. Signup page ───────────────────────────────────────────────────────
    log('Navigating to /signup …')
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' })
    await waitForNetworkIdle(page)
    await screenshot(page, '03-signup.png')

    // ── Authenticate ─────────────────────────────────────────────────────────
    header('Authenticated pages')
    authOk = await signIn(page)

    if (authOk) {
      // ── 4. Dashboard (default view) ────────────────────────────────────────
      log('Navigating to /dashboard …')
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
      await waitForNetworkIdle(page)
      await screenshot(page, '04-dashboard.png')

      // ── 5. Dashboard — scroll to show brief cards if any ──────────────────
      const hasBriefCard = await page.locator('[data-testid="meeting-card"], .meeting-card, [class*="MeetingCard"]').count() > 0
        || await page.locator('text=Brief Ready').count() > 0
        || await page.locator('text=Generating').count() > 0

      if (hasBriefCard) {
        await page.evaluate(() => window.scrollTo(0, 300))
        await page.waitForTimeout(300)
        await screenshot(page, '05-dashboard-with-cards.png')
      }

      // Try to find a brief ID to use for the brief viewer screenshot
      const briefLink = page.locator('a[href^="/briefs/"]').first()
      if (await briefLink.count() > 0) {
        const href = await briefLink.getAttribute('href')
        briefId = href?.split('/briefs/')[1] ?? null
        log(`Found brief ID: ${briefId}`)
      }

      // ── 6. Settings page ──────────────────────────────────────────────────
      log('Navigating to /settings …')
      await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' })
      await waitForNetworkIdle(page)
      await screenshot(page, '06-settings.png')

      // ── 7. Settings — scroll to billing section ────────────────────────────
      const billingSection = page.locator('text=Subscription, text=Billing, text=Upgrade').first()
      if (await billingSection.count() > 0) {
        await billingSection.scrollIntoViewIfNeeded()
        await page.waitForTimeout(300)
        await screenshot(page, '07-settings-billing.png')
      }
    }

    // ── 8. Brief viewer (public page) ────────────────────────────────────────
    header('Public brief viewer')

    if (briefId) {
      log(`Navigating to /briefs/${briefId} …`)
      await page.goto(`${BASE_URL}/briefs/${briefId}`, { waitUntil: 'domcontentloaded' })
      await waitForNetworkIdle(page)
      await screenshot(page, '08-brief-viewer-top.png', { fullPage: false })

      // Scroll to show middle sections
      await page.evaluate(() => window.scrollTo(0, 600))
      await page.waitForTimeout(300)
      await screenshot(page, '09-brief-viewer-mid.png', { fullPage: false })

      // Full page
      await page.evaluate(() => window.scrollTo(0, 0))
      await screenshot(page, '10-brief-viewer-full.png', { fullPage: true })
    } else {
      warn('No brief ID found — skipping brief viewer screenshots.')
      warn('Tip: sign in with a user who has at least one generated brief.')
    }

  } catch (err) {
    console.error(`\n❌  Screenshot runner failed: ${err.message}`)
    // Take a failure screenshot to help debug
    const failPath = path.join(OUT_DIR, '_FAILED.png')
    await page.screenshot({ path: failPath, fullPage: false }).catch(() => {})
    warn(`Failure screenshot saved → ${failPath}`)
  } finally {
    await browser.close()
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  header('Done')
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png') && !f.startsWith('_'))
  console.log(`\n  ${files.length} screenshot(s) saved to docs/screenshots/\n`)
  files.forEach(f => console.log(`    • ${f}`))
  console.log()
})()

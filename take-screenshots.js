const { chromium } = require('playwright');
const path = require('path');

const docsDir = '/home/runner/work/MeetPrep/MeetPrep/docs/screenshots';

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--allow-running-insecure-content',
      '--ignore-certificate-errors',
    ]
  });
  
  const pages = [
    { url: 'http://127.0.0.1:3000', name: '01-landing-page', title: 'Landing Page' },
    { url: 'http://127.0.0.1:3000/login', name: '02-login', title: 'Login Page' },
    { url: 'http://127.0.0.1:3000/signup', name: '03-signup', title: 'Sign Up Page' },
    { url: 'http://127.0.0.1:3000/dashboard', name: '04-dashboard', title: 'Dashboard' },
    { url: 'http://127.0.0.1:3000/settings', name: '05-settings', title: 'Settings' },
    { url: 'http://127.0.0.1:3000/roadmap', name: '06-roadmap', title: 'Roadmap' },
  ];

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  for (const p of pages) {
    const page = await context.newPage();
    try {
      console.log(`Navigating to ${p.url}`);
      await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      const filePath = path.join(docsDir, `${p.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`✓ Saved: ${p.name}.png`);
    } catch (e) {
      console.error(`✗ Failed ${p.url}: ${e.message.split('\n')[0]}`);
      try {
        const filePath = path.join(docsDir, `${p.name}.png`);
        await page.screenshot({ path: filePath, fullPage: true });
        console.log(`  Saved partial: ${p.name}.png`);
      } catch(e2) {
        console.error(`  Could not save screenshot: ${e2.message.split('\n')[0]}`);
      }
    }
    await page.close();
  }

  await browser.close();
  console.log('Done!');
})();

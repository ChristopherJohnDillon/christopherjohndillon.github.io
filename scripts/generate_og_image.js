#!/usr/bin/env node
/*
 * Generate images/og-image.png (1200x630) from scripts/og_template.html
 * using Playwright / headless Chromium.
 *
 * Usage:
 *   NODE_PATH=/opt/node22/lib/node_modules node scripts/generate_og_image.js
 *   # or after `npm i -g playwright && playwright install chromium`:
 *   node scripts/generate_og_image.js
 */
const path = require('path');
const fs = require('fs');

(async () => {
  const { chromium } = require('playwright');

  const repoRoot = path.resolve(__dirname, '..');
  const templatePath = path.join(__dirname, 'og_template.html');
  const outputPath = path.join(repoRoot, 'images', 'og-image.png');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto('file://' + templatePath, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  await page.screenshot({ path: outputPath, type: 'png', omitBackground: false });

  await browser.close();
  const { size } = fs.statSync(outputPath);
  console.log(`Wrote ${outputPath} (${(size / 1024).toFixed(1)} KB)`);
})();

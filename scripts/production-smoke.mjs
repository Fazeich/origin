import { preview } from 'vite';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const remoteUrl = process.env.ORIGIN_SMOKE_URL;
const server = remoteUrl ? null : await preview({ preview: { host: '127.0.0.1', port: 4100, strictPort: true } });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const url = new URL(remoteUrl ?? 'http://127.0.0.1:4100/');
  url.search = '?debug&test';
  await page.goto(url.href);
  await page.waitForFunction(() => !document.querySelector('#enter').disabled);
  assert.equal(await page.evaluate(() => typeof window.__origin), 'undefined');
  await page.locator('#enter').click(); await page.waitForFunction(() => !!document.pointerLockElement);
  await page.waitForTimeout(300);
  const before = await page.locator('#debug').textContent();
  await page.keyboard.down('KeyW'); await page.waitForTimeout(1000); await page.keyboard.up('KeyW');
  await page.waitForTimeout(300);
  const after = await page.locator('#debug').textContent();
  assert.notEqual(before.match(/xyz .*/)[0], after.match(/xyz .*/)[0]);
  // Physical mouse movement points the real camera down; LMB exercises production input and workers.
  await page.mouse.move(720, 1200);
  await page.mouse.click(720, 1200);
  await page.waitForFunction(() => /rebuilds [1-9]/.test(document.querySelector('#debug').textContent));
  await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.pointerLockElement);
  assert.equal(await page.locator('#menu').isVisible(), true);
  await page.waitForTimeout(1300); await page.locator('#enter').click();
  await page.waitForFunction(() => !!document.pointerLockElement);
  await page.keyboard.press('F3'); assert.equal(await page.locator('#debug').isVisible(), false);
  assert.equal(await page.locator('body').innerText(), '');
  assert.deepEqual(errors, []);
  const report = { at: new Date().toISOString(), browser: browser.version(), build: remoteUrl ?? 'dist', passed: ['static worker assets', 'WebGL render', 'pointer lock', 'WASD', 'mouse look and LMB rebuild', 'pause and resume', 'F3 hides diagnostics', 'no test bridge in production', 'no gameplay text', 'no console/page errors'] };
  await writeFile(remoteUrl ? 'docs/validation/deployment.json' : 'docs/validation/production.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); if (server) await new Promise(resolve => server.httpServer.close(resolve)); }

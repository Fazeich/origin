import { expect, test } from '@playwright/test';
import '../../src/debug/test-bridge';

test('playable world: workers, pointer lock, WASD, look, jump, destruction, foundation, streaming', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/?test&debug');
  await expect(page.locator('#enter')).toBeEnabled({ timeout: 60_000 });
  await page.waitForFunction(() => window.__origin?.stream.settled, { timeout: 60_000 });
  await page.screenshot({ path: testInfo.outputPath('menu.png') });
  await page.locator('#enter').click();
  await page.waitForFunction(() => document.pointerLockElement?.id === 'world');
  await expect(page.locator('#menu')).toBeHidden();
  const initial = await page.evaluate(() => ({ ...window.__origin!.player.position }));
  await page.keyboard.down('KeyW'); await page.waitForTimeout(1200); await page.keyboard.up('KeyW');
  const moved = await page.evaluate(() => ({ ...window.__origin!.player.position }));
  expect(Math.hypot(moved.x - initial.x, moved.z - initial.z)).toBeGreaterThan(2);
  const yaw = await page.evaluate(() => window.__origin!.player.yaw);
  await page.mouse.move(850, 430);
  expect(await page.evaluate(() => window.__origin!.player.yaw)).not.toBe(yaw);
  await page.waitForFunction(() => window.__origin!.player.grounded);
  const y = await page.evaluate(() => window.__origin!.player.position.y);
  await page.keyboard.press('Space'); await page.waitForTimeout(120);
  expect(await page.evaluate(() => window.__origin!.player.position.y)).toBeGreaterThan(y + 0.2);
  await page.waitForFunction(() => window.__origin!.player.grounded);
  // The real LMB handler must raycast and mutate data, then replace the chunk mesh asynchronously.
  await page.evaluate(() => { window.__origin!.player.pitch = -1.55; });
  const revision = await page.evaluate(() => window.__origin!.world.editVersion);
  await page.mouse.click(720, 450);
  await page.waitForFunction(v => window.__origin!.world.editVersion > v, revision);
  await page.waitForFunction(() => window.__origin!.stream.settled);
  expect(await page.evaluate(() => window.__origin!.stream.rebuildCount)).toBeGreaterThan(0);

  // Prepare a shaft through the same world API, large enough for the actual player collider.
  await page.evaluate(() => {
    const { world, player } = window.__origin!;
    player.position.x = -3.875; player.position.z = -3.875;
    for (let x = -18; x <= -14; x++) for (let z = -18; z <= -14; z++) for (let y = 1; y < world.config.worldHeightVoxels; y++) world.destroyVoxel(x, y, z);
    player.pitch = -1.55;
  });
  await page.waitForFunction(() => window.__origin!.player.position.y < 0.251 && window.__origin!.player.grounded);
  await page.waitForFunction(() => window.__origin!.stream.settled);
  const beforeBedrock = await page.evaluate(() => ({ edits: window.__origin!.world.editVersion, rebuilds: window.__origin!.stream.rebuildCount }));
  await page.mouse.click(720, 450); await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__origin!.world.getVoxel(-16, 0, -16))).toBe(5);
  expect(await page.evaluate(() => window.__origin!.world.editVersion)).toBe(beforeBedrock.edits);
  expect(await page.evaluate(() => window.__origin!.stream.rebuildCount)).toBe(beforeBedrock.rebuilds);
  await page.screenshot({ path: testInfo.outputPath('bedrock.png') });
  // Burst edits while worker responses are in flight; all accepted revisions must converge.
  await page.evaluate(() => { const w = window.__origin!.world; for (let x = -30; x < 0; x++) w.destroyVoxel(x, 15, -10); });
  await page.waitForTimeout(20);
  await page.evaluate(() => { const w = window.__origin!.world; for (let x = -30; x < 0; x++) w.destroyVoxel(x, 16, -10); });
  await page.waitForFunction(() => window.__origin!.stream.settled);
  expect(await page.evaluate(() => [...window.__origin!.world.chunks.values()].every(c => c.revision === c.meshRevision))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu')).toBeVisible();
  const paused = await page.evaluate(() => window.__origin!.player.position.y);
  await page.keyboard.press('KeyW'); await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__origin!.player.position.y)).toBe(paused);
  // Unload then return: sparse session edits must reappear in data AND rebuilt geometry.
  for (const x of [160, -3.875]) {
    await page.evaluate(x => { window.__origin!.player.position = { x, y: 20, z: -3.875 }; }, x);
    await page.waitForFunction(() => window.__origin!.stream.settled);
    await page.waitForTimeout(100);
  }
  await page.waitForFunction(() => window.__origin!.world.chunks.has('-1,0,-1') && window.__origin!.stream.settled);
  expect(await page.evaluate(() => window.__origin!.world.getVoxel(-16, 10, -16))).toBe(0);
  expect(await page.evaluate(() => window.__origin!.world.chunks.size)).toBeLessThanOrEqual(507);
  expect(errors).toEqual([]);
});

test('normal game UI has no tutorial, labels, debug or instructions', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#enter')).toBeEnabled({ timeout: 60_000 });
  await expect(page.locator('#debug')).toBeHidden();
  await page.locator('#enter').click(); await expect(page.locator('#menu')).toBeHidden();
  expect(await page.locator('body').innerText()).toBe('');
  expect(await page.evaluate(() => window.__origin)).toBeUndefined();
});

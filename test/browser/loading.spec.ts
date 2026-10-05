import { test, expect } from './test';

// Production chunks, rather than Vite's source-module loading, are tested here.
test('native positioning never requests the fixed chunk', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/loading.html');
  const item = page.getByTestId('a');
  await expect(item).toHaveCSS('position', 'sticky');
  await page.evaluate(() => window.scrollTo(0, 250));
  await expect.poll(() => item.evaluate(element => element.getBoundingClientRect().top)).toBe(20);
  await expect(page.getByTestId('height')).toHaveText('80');
  expect(requests.filter(url => /fixed-layout-.*\.js/.test(url))).toHaveLength(0);
});

test('delayed fallback keeps native positioning and child state until ready', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let requested = 0;
  await page.route(/fixed-layout-.*\.js/, async route => {
    requested++;
    await gate;
    await route.continue();
  });
  await page.goto('/loading.html');
  const item = page.getByTestId('a');
  await expect(item).toHaveCSS('position', 'sticky');
  const input = page.getByRole('textbox', { name: 'Preserved input' });
  await input.fill('state survives');
  await input.evaluate(element => { element.setAttribute('data-original', 'yes'); });
  await page.evaluate(() => window.scrollTo(0, 250));
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect.poll(() => requested).toBe(1);
  await expect(item).toHaveCSS('position', 'sticky');
  await expect(input).toHaveValue('state survives');
  // Scroll beyond the newly added heading while its fixed backend is delayed.
  await page.evaluate(() => window.scrollTo(0, 620));
  release();
  await expect(item.locator('.oe-sticky-content')).toHaveCSS('position', 'fixed');
  await expect(item.locator('.oe-sticky-content')).toHaveCSS('top', '20px');
  await expect(input).toHaveAttribute('data-original', 'yes');
  await page.evaluate(() => window.scrollTo(0, 620));
  await expect(page.getByTestId('b').locator('.oe-sticky-content')).toHaveCSS('top', '100px');
  await expect(page.getByTestId('height')).toHaveText('130');
  expect(requested).toBe(1);
});

test('missing sticky and ResizeObserver use the complete fixed fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'ResizeObserver', { value: undefined });
    CSS.supports = () => false;
  });
  await page.goto('/loading.html?multiple');
  await page.evaluate(() => window.scrollTo(0, 620));
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('position', 'fixed');
  await expect(page.getByTestId('b').locator('.oe-sticky-content')).toHaveCSS('top', '100px');
  await expect(page.getByTestId('height')).toHaveText('130');
});

test('failed chunk reports once and preserves readable content and input', async ({ page }) => {
  let requested = 0;
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/fixed-layout-.*\.js/, route => { requested++; return route.abort(); });
  await page.goto('/loading.html?multiple');
  const input = page.getByRole('textbox', { name: 'Preserved input' });
  await input.fill('still editable');
  await expect.poll(() => errors.length).toBe(1);
  for (const position of [250, 400, 620]) {
    await page.evaluate(y => window.scrollTo(0, y), position);
    await expect(input).toHaveValue('still editable');
  }
  expect(requested).toBe(1);
  expect(errors).toHaveLength(1);
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('position', 'static');
});

for (const mixed of ['item', 'container']) {
  test(`production entries share Context when mixing the ${mixed}`, async ({ page }) => {
    await page.goto(`/loading.html?multiple&mixed=${mixed}`);
    await page.evaluate(() => window.scrollTo(0, 620));
    await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('position', 'fixed');
    await expect(page.getByTestId('b').locator('.oe-sticky-content')).toHaveCSS('top', '100px');
    await expect(page.getByTestId('height')).toHaveText('130');
  });
}

test('disabled groups do not load the fixed chunk', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/loading.html?none');
  await page.evaluate(() => window.scrollTo(0, 620));
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('position', 'static');
  expect(requests.filter(url => /fixed-layout-.*\.js/.test(url))).toHaveLength(0);
});

test('unmounting while loading removes the waiting container', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let requested = 0;
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/fixed-layout-.*\.js/, async route => {
    requested++;
    await gate;
    await route.continue();
  });
  await page.goto('/loading.html?multiple');
  await expect.poll(() => requested).toBe(1);
  await page.getByRole('button', { name: 'Unmount' }).click();
  await expect(page.getByTestId('container')).toHaveCount(0);
  const loaded = page.waitForResponse(/fixed-layout-.*\.js/);
  release();
  await loaded;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(errors).toHaveLength(0);
  expect(requested).toBe(1);
});

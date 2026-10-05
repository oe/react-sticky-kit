import { test, expect, type Locator, type Page } from '@playwright/test';
const top = (node: Locator) => node.evaluate(e => e.getBoundingClientRect().top);
async function scroll(page: Page, y: number) {
  await page.evaluate(y => window.scrollTo(0, y), y);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
test('oversized content scrolls to its bottom and reverses without jumping', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 720 });
  await page.goto('/overflow.html');
  const a = page.getByTestId('a').locator('.oe-sticky-content');
  await scroll(page, 220);
  await expect.poll(() => top(a)).toBeCloseTo(-20, 0);
  await scroll(page, 600);
  await expect.poll(() => top(a)).toBeCloseTo(-210, 0);
  await scroll(page, 590);
  await expect.poll(() => top(a)).toBeCloseTo(-200, 0);
  await scroll(page, 300);
  await expect.poll(() => top(a)).toBeCloseTo(20, 0);
  await page.getByRole('button', { name: 'Shrink' }).click();
  await expect.poll(() => top(a)).toBeCloseTo(20, 0);
  await page.getByRole('button', { name: 'Disable' }).click();
  await expect(a).toHaveCSS('position', 'static');
});
test('stacked oversized items move as one group and do not overlap', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 720 });
  await page.goto('/overflow.html?multiple');
  const a = page.getByTestId('a').locator('.oe-sticky-content');
  const b = page.getByTestId('b').locator('.oe-sticky-content');
  await scroll(page, 600);
  await expect(b).toHaveCSS('position', 'static');
  await scroll(page, 800);
  await expect(b).toHaveCSS('position', 'fixed');
  await scroll(page, 1300);
  await expect.poll(() => top(b)).toBeCloseTo(290, 0);
  expect((await top(b)) - (await top(a))).toBeCloseTo(900, 0);
  await scroll(page, 1290);
  await expect.poll(() => top(b)).toBeCloseTo(300, 0);
});
test('auto uses native sticky for a short direct child and falls back for tall or multiple items', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 720 });
  await page.goto('/overflow.html?auto&short');
  const wrapper = page.getByTestId('a');
  const content = wrapper.locator('.oe-sticky-content');
  await expect(wrapper).toHaveCSS('position', 'sticky');
  await expect(wrapper).toHaveCSS('z-index', '400');
  await scroll(page, 500);
  await expect.poll(() => top(wrapper)).toBeCloseTo(20, 0);
  await page.getByRole('button', { name: 'Grow' }).click();
  await expect(wrapper).toHaveCSS('position', 'relative');
  await expect(content).toHaveCSS('position', 'fixed');
  await page.getByRole('button', { name: 'Shrink' }).click();
  await expect(wrapper).toHaveCSS('position', 'sticky');
  await page.getByRole('button', { name: 'Toggle items' }).click();
  await expect(wrapper).toHaveCSS('position', 'relative');
  await expect(content).toHaveCSS('position', 'fixed');
});
test('default pin behavior remains unchanged for tall content', async ({ page }) => {
  await page.goto('/overflow.html?pin');
  await scroll(page, 600);
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('top', '20px');
});
test('native detection rejects scroll ancestors and stretched wrappers', async ({ page }) => {
  await page.goto('/overflow.html?auto&short');
  const wrapper = page.getByTestId('a');
  await expect(wrapper).toHaveCSS('position', 'sticky');
  await page.locator('body').evaluate(el => { el.style.overflow = 'hidden'; });
  await expect(wrapper).toHaveCSS('position', 'relative');
  await page.locator('body').evaluate(el => { el.style.overflow = ''; });
  await expect(wrapper).toHaveCSS('position', 'sticky');
  await wrapper.evaluate(el => { el.style.minHeight = '900px'; });
  await expect(wrapper).toHaveCSS('position', 'relative');
});
test('overflow groups release at their container boundary and respond to viewport resizing', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 720 });
  await page.goto('/overflow.html');
  const a = page.getByTestId('a').locator('.oe-sticky-content');
  await scroll(page, 600);
  await expect.poll(() => top(a)).toBeCloseTo(-210, 0);
  await page.setViewportSize({ width: 1000, height: 1000 });
  await expect.poll(() => top(a)).toBeCloseTo(20, 0);
  const bottom = await page.getByTestId('container').evaluate(el => el.getBoundingClientRect().bottom + scrollY);
  await scroll(page, bottom - 40);
  await expect.poll(() => a.evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(40.1);
  await scroll(page, bottom + 10);
  await expect(a).toHaveCSS('position', 'static');
});
test('replace mode with oversized items still replaces and respects boundaries', async ({ page }) => {
  await page.goto('/overflow.html?multiple&replace');
  const a = page.getByTestId('a').locator('.oe-sticky-content');
  const b = page.getByTestId('b').locator('.oe-sticky-content');
  await scroll(page, 1600);
  await expect(a).toHaveCSS('position', 'static');
  await expect(b).toHaveCSS('top', '20px');
});
test('native short items need no library geometry reads while scrolling', async ({ page }) => {
  await page.goto('/overflow.html?auto&short');
  await expect(page.getByTestId('a')).toHaveCSS('position', 'sticky');
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    const original = Element.prototype.getBoundingClientRect;
    Object.assign(window, { geometryReads: 0 });
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList.contains('oe-sticky-container') || this.classList.contains('oe-sticky-item') || this.classList.contains('oe-sticky-content')) {
        const counters = window as unknown as { geometryReads: number };
        counters.geometryReads++;
      }
      return original.call(this);
    };
  });
  await scroll(page, 500);
  await scroll(page, 510);
  expect(await page.evaluate(() => (window as unknown as { geometryReads: number }).geometryReads)).toBe(0);
});
test('native cleanup works outside its container', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 720 });
  await page.goto('/overflow.html?auto&short');
  await expect(page.getByTestId('a')).toHaveCSS('position', 'sticky');
  await scroll(page, 3000);
  await page.getByRole('button', { name: 'Fixed strategy' }).click();
  await expect(page.getByTestId('a')).toHaveCSS('position', 'relative');
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('position', 'static');
});
test('auto falls back when native sticky support is unavailable', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(CSS, 'supports', { configurable: true, value: () => false }); });
  await page.goto('/overflow.html?auto&short');
  await scroll(page, 500);
  await expect(page.getByTestId('a')).toHaveCSS('position', 'relative');
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('position', 'fixed');
});
test('auto preserves height notifications and uses fixed when ResizeObserver is unavailable', async ({ page }) => {
  await page.goto('/overflow.html?auto&short&callback');
  await scroll(page, 500);
  await expect(page.getByTestId('sticky-height')).toHaveText('80');
  await scroll(page, 3000);
  await expect(page.getByTestId('sticky-height')).toHaveText('0');
  await page.addInitScript(() => { Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: undefined }); });
  await page.goto('/overflow.html?auto&short');
  await scroll(page, 500);
  await expect(page.getByTestId('a')).toHaveCSS('position', 'relative');
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('position', 'fixed');
});
test('zero-valued inline positioning overrides also exclude native selection', async ({ page }) => {
  await page.goto('/overflow.html?auto&short&inline');
  await scroll(page, 500);
  await expect(page.getByTestId('a')).toHaveCSS('position', 'relative');
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('top', '20px');
});
test('changing inline positioning clears native layout before measuring fixed coordinates', async ({ page }) => {
  await page.goto('/overflow.html?auto&short');
  await scroll(page, 500);
  await expect(page.getByTestId('a')).toHaveCSS('position', 'sticky');
  await page.getByRole('button', { name: 'Inline override' }).click();
  await expect(page.getByTestId('a')).toHaveCSS('position', 'relative');
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('top', '20px');
});
test('rejected native tall items do not repeat eligibility geometry during scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 720 });
  await page.goto('/overflow.html?auto');
  await scroll(page, 600);
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('position', 'fixed');
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    const original = Element.prototype.getBoundingClientRect;
    Object.assign(window, { geometryReads: 0 });
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList.contains('oe-sticky-container') || this.classList.contains('oe-sticky-item') || this.classList.contains('oe-sticky-content')) {
        (window as unknown as { geometryReads: number }).geometryReads++;
      }
      return original.call(this);
    };
  });
  await scroll(page, 610);
  await scroll(page, 620);
  expect(await page.evaluate(() => (window as unknown as { geometryReads: number }).geometryReads)).toBe(6);
  await page.getByRole('button', { name: 'Shrink' }).click();
  await expect(page.getByTestId('a')).toHaveCSS('position', 'sticky');
});

test('vertically stretched flex items stay fixed without idle geometry work', async ({ page }) => {
  await page.goto('/overflow.html?auto&short&stretch');
  const wrapper = page.getByTestId('a');
  await scroll(page, 500);
  await expect(wrapper.locator('.oe-sticky-content')).toHaveCSS('position', 'fixed');
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    const original = Element.prototype.getBoundingClientRect;
    Object.assign(window, { idleReads: 0 });
    Element.prototype.getBoundingClientRect = function () {
      (window as unknown as { idleReads: number }).idleReads++;
      return original.call(this);
    };
  });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as unknown as { idleReads: number }).idleReads)).toBe(0);
  await wrapper.evaluate(el => { el.style.alignSelf = 'flex-start'; });
  await page.getByRole('button', { name: 'Shrink' }).click();
  await expect(wrapper).toHaveCSS('position', 'sticky');
});

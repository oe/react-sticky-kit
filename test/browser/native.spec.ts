import { test, expect } from '@playwright/test';

test('native entry pins from CSS, preserves content and releases at its boundary', async ({ page }) => {
  await page.goto('/native.html');
  const item = page.getByTestId('item');
  await expect(item).toHaveCSS('position', 'sticky');
  await page.getByRole('textbox').fill('Still here');
  await page.evaluate(() => scrollTo(0, 500));
  await expect.poll(() => item.evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(20, 0);
  await page.getByRole('button', { name: 'Grow' }).click();
  await expect(item).toHaveCSS('height', '120px');
  await page.getByRole('button', { name: 'Offset' }).click();
  await expect.poll(() => item.evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(50, 0);
  await expect(page.getByRole('textbox')).toHaveValue('Still here');
  const bottom = await page.getByTestId('container').evaluate(el => el.getBoundingClientRect().bottom + scrollY);
  await page.evaluate(y => scrollTo(0, y - 40), bottom);
  await expect.poll(() => item.evaluate(el => el.getBoundingClientRect().bottom)).toBeCloseTo(40, 0);
});

test('native entry follows its scrolling ancestor and respects explicit inline overrides', async ({ page }) => {
  await page.goto('/native.html?scroll-root&override');
  const item = page.getByTestId('item');
  await expect(item).toHaveCSS('top', '40px');
  await expect(item).toHaveCSS('z-index', '0');
  await page.getByTestId('scroller').evaluate(el => { el.scrollTop = 300; });
  await expect.poll(() => item.evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(240, 0);
});

test('native entry has no library geometry or observer work without ResizeObserver or CSS.supports', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'ResizeObserver', { value: undefined });
    Object.defineProperty(CSS, 'supports', { value: undefined });
    const original = Element.prototype.getBoundingClientRect;
    Object.assign(window, { nativeReads: 0 });
    Element.prototype.getBoundingClientRect = function () {
      (window as unknown as { nativeReads: number }).nativeReads++;
      return original.call(this);
    };
  });
  await page.goto('/native.html');
  await expect(page.getByTestId('item')).toHaveCSS('position', 'sticky');
  await page.evaluate(() => scrollTo(0, 500));
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => (window as unknown as { nativeReads: number }).nativeReads)).toBe(0);
});

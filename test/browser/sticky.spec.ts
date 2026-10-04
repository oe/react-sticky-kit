import { test, expect } from '@playwright/test';

test('first activation, stacking, dynamic height, offset and disabling', async ({ page }) => {
  await page.goto('/fixture.html');
  await page.locator('.oe-sticky-item').first().waitFor();
  await page.evaluate(() => window.scrollTo(0, 220));
  const a = page.getByTestId('a').locator('.oe-sticky-content');
  const b = page.getByTestId('b').locator('.oe-sticky-content');
  await expect(a).toHaveCSS('position', 'fixed');
  await expect(a).toHaveCSS('top', '0px');
  await expect(page.getByTestId('container')).toHaveClass(/custom/);
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect(b).toHaveCSS('top', '40px');
  await page.getByRole('button', { name: 'Resize', exact: true }).click();
  await expect(b).toHaveCSS('top', '90px');
  await page.getByRole('button', { name: 'Offset', exact: true }).click();
  await expect(a).toHaveCSS('top', '25px');
  await expect(b).toHaveCSS('top', '115px');
  await page.getByRole('button', { name: 'Disable', exact: true }).click();
  await expect(a).toHaveCSS('position', 'static');
  await expect(b).toHaveCSS('position', 'static');
});

test('replace mode pushes the previous header out and respects the container bottom', async ({ page }) => {
  await page.goto('/fixture.html?mode=replace');
  await page.locator('.oe-sticky-item').first().waitFor();
  await page.evaluate(() => window.scrollTo(0, 720));
  const a = page.getByTestId('a').locator('.oe-sticky-content');
  const b = page.getByTestId('b').locator('.oe-sticky-content');
  await expect(a).toHaveCSS('top', '-20px');
  await page.evaluate(() => window.scrollTo(0, 741));
  await expect(a).toHaveCSS('position', 'static');
  await expect(b).toHaveCSS('top', '0px');
  await page.evaluate(() => window.scrollTo(0, 1260));
  await expect(b).toHaveCSS('top', '-20px');
  await page.evaluate(() => window.scrollTo(0, 1291));
  await expect(b).toHaveCSS('position', 'static');
});

test('keyed reorder updates stacking order', async ({ page }) => {
  await page.goto('/fixture.html');
  await page.locator('.oe-sticky-item').first().waitFor();
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.getByRole('button', { name: 'Reorder', exact: true }).click();
  // Reordering sections can change the viewport through browser scroll anchoring.
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect(page.getByTestId('b').locator('.oe-sticky-content')).toHaveCSS('top', '0px');
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('top', '50px');
});

test('unconstrained headers remain sticky after their container leaves', async ({ page }) => {
  await page.goto('/fixture.html?unconstrained');
  await page.locator('.oe-sticky-item').first().waitFor();
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('top', '0px');
  await expect(page.getByTestId('b').locator('.oe-sticky-content')).toHaveCSS('top', '40px');
});

test('captures scroll events from a scrollable element', async ({ page }) => {
  await page.goto('/fixture.html?element-scroll');
  await page.locator('.oe-sticky-item').first().waitFor();
  await page.getByTestId('scroller').evaluate(element => { element.scrollTop = 230; });
  await expect(page.getByTestId('a').locator('.oe-sticky-content')).toHaveCSS('position', 'fixed');
});


test('nested containers maintain independent sticky boundaries', async ({ page }) => {
  await page.goto('/fixture.html?nested');
  await page.locator('.oe-sticky-item').first().waitFor();
  await page.evaluate(() => window.scrollTo(0, 300));
  const outer = page.getByTestId('outer-header').locator('.oe-sticky-content');
  const inner = page.getByTestId('inner-header').locator('.oe-sticky-content');
  await expect(outer).toHaveCSS('top', '0px');
  await expect(inner).toHaveCSS('top', '30px');
  await page.evaluate(() => window.scrollTo(0, 450));
  await expect(inner).toHaveCSS('position', 'static');
  await expect(outer).toHaveCSS('position', 'fixed');
});

test('fixed widths follow viewport resize without rounding fractional layout', async ({ page }) => {
  await page.goto('/fixture.html');
  await page.locator('.oe-sticky-item').first().waitFor();
  await page.getByTestId('container').evaluate(element => { element.style.width = '75.5%'; });
  await page.evaluate(() => window.scrollTo(0, 220));
  const content = page.getByTestId('a').locator('.oe-sticky-content');
  await expect(content).toHaveCSS('position', 'fixed');
  await expect.poll(() => content.evaluate(element =>
    Math.abs(element.getBoundingClientRect().width - element.parentElement!.getBoundingClientRect().width)
  )).toBeLessThan(0.05);
  await page.setViewportSize({ width: 1000, height: 720 });
  await expect(content).toHaveCSS('width', '755px');
});

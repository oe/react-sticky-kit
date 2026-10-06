import { test, expect } from '@playwright/test';

test('keeps shared subscriptions working after a sibling container unmounts', async ({ page }) => {
  await page.goto('/regressions.html?case=multi');
  await page.getByTestId('first').waitFor();
  await page.evaluate(() => window.scrollTo(0, 220));
  await expect(page.getByTestId('first').locator('.oe-sticky-content')).toHaveCSS('position', 'fixed');
  await page.getByRole('button', { name: 'Remove first' }).click();
  await expect(page.getByTestId('first-container')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 220));
  const content = page.getByTestId('remaining').locator('.oe-sticky-content');
  await expect(content).toHaveCSS('position', 'fixed');
  await page.getByTestId('preceding').evaluate(element => { element.style.height = '500px'; });
  await expect(content).toHaveCSS('position', 'static');
  expect(await page.evaluate(() => window.scrollY)).toBe(220);
  await page.evaluate(() => window.scrollTo(0, 520));
  await expect(content).toHaveCSS('position', 'fixed');
  await page.getByTestId('remaining').evaluate(element => { (element.firstElementChild!.firstElementChild as HTMLElement).style.height = '80px'; });
  await expect(page.getByTestId('remaining')).toHaveCSS('height', '80px');
});

for (const sizing of ['border-box', 'content-box']) {
  for (const explicitHeight of [false, true]) {
    test(`preserves ${sizing} dimensions with padding and border${explicitHeight ? ' and explicit height' : ''}`, async ({ page }) => {
      await page.goto(`/regressions.html?case=box${sizing === 'content-box' ? '&content-box' : ''}${explicitHeight ? '&height' : ''}`);
    await page.locator('.oe-sticky-item').first().waitFor();
      const wrapper = page.getByTestId('item');
      const content = wrapper.locator('.oe-sticky-content');
      const before = await wrapper.evaluate(element => ({ height: element.getBoundingClientRect().height,
        width: element.firstElementChild!.getBoundingClientRect().width,
        bodyTop: element.nextElementSibling!.getBoundingClientRect().top }));
      await page.evaluate(() => window.scrollTo(0, 220));
      await expect(content).toHaveCSS('position', 'fixed');
      await expect.poll(() => wrapper.evaluate(element => element.getBoundingClientRect().height)).toBe(before.height);
      await expect.poll(() => content.evaluate(element => element.getBoundingClientRect().width)).toBe(before.width);
      await expect.poll(() => page.getByTestId('body').evaluate(element => element.getBoundingClientRect().top + window.scrollY)).toBe(before.bodyTop);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(content).toHaveCSS('position', 'static');
      await expect.poll(() => wrapper.evaluate(element => element.getBoundingClientRect().height)).toBe(before.height);
      expect(await content.getAttribute('style')).toBe('');
    });
  }
}

test('keeps an automatic inline height from collapsing when the content becomes fixed', async ({ page }) => {
  await page.goto('/regressions.html?case=box&height=auto');
  const wrapper = page.getByTestId('item');
  const before = await wrapper.evaluate(element => element.getBoundingClientRect().height);
  await page.evaluate(() => window.scrollTo(0, 220));
  await expect(wrapper.locator('.oe-sticky-content')).toHaveCSS('position', 'fixed');
  await expect.poll(() => wrapper.evaluate(element => element.getBoundingClientRect().height)).toBe(before);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(wrapper.locator('.oe-sticky-content')).toHaveCSS('position', 'static');
  expect(await wrapper.evaluate(element => element.style.height)).toBe('auto');
});

test('refreshes cached insets when only the item commits and its total padding stays unchanged', async ({ page }) => {
  await page.goto('/regressions.html?case=box');
  await page.getByTestId('item').waitFor();
  await page.evaluate(() => window.scrollTo(0, 220));
  const content = page.getByTestId('item').locator('.oe-sticky-content');
  await expect(content).toHaveCSS('left', '25px');
  await expect(content).toHaveCSS('width', '350px');
  await page.getByRole('button', { name: 'Shift padding' }).click();
  await expect(content).toHaveCSS('left', '45px');
  await expect(content).toHaveCSS('width', '350px');
});

test('keeps a fixed header aligned during horizontal element scrolling', async ({ page }) => {
  await page.goto('/regressions.html?case=horizontal');
  await page.locator('.oe-sticky-item').first().waitFor();
  await page.getByTestId('scroller').evaluate(element => { element.scrollTop = 230; });
  const content = page.getByTestId('item').locator('.oe-sticky-content');
  await expect(content).toHaveCSS('position', 'fixed');
  await page.getByTestId('scroller').evaluate(element => { element.scrollLeft = 150; });
  await expect.poll(() => content.evaluate(element => element.getBoundingClientRect().left)).toBe(-150);
  await page.getByTestId('scroller').evaluate(element => { element.scrollLeft = 0; });
  await expect(content).toHaveCSS('left', '0px');
});

test('refreshes cached insets across a media query even when item dimensions stay unchanged', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.goto('/regressions.html?case=box');
  await page.getByTestId('item').waitFor();
  await page.addStyleTag({ content: '@media (max-width: 900px) { .oe-sticky-item { padding-left: 40px !important; padding-right: 0 !important; } }' });
  await page.evaluate(() => window.scrollTo(0, 220));
  const content = page.getByTestId('item').locator('.oe-sticky-content');
  await expect(content).toHaveCSS('left', '25px');
  await page.setViewportSize({ width: 800, height: 720 });
  await expect(content).toHaveCSS('left', '45px');
  await expect(content).toHaveCSS('width', '350px');
  await page.setViewportSize({ width: 1200, height: 720 });
  await expect(content).toHaveCSS('left', '25px');
});

for (const fixedParent of [false, true]) {
  test(`updates when preceding content changes without scrolling${fixedParent ? ', with a fixed-height parent' : ''}`, async ({ page }) => {
    await page.goto(`/regressions.html?case=shift${fixedParent ? '&fixed-parent' : ''}`);
    await page.locator('.oe-sticky-item').first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 220));
    const content = page.getByTestId('item').locator('.oe-sticky-content');
    await expect(content).toHaveCSS('position', 'fixed');
    await page.getByTestId('preceding').evaluate(element => { element.style.height = '500px'; });
    await expect(content).toHaveCSS('position', 'static');
    expect(await page.evaluate(() => window.scrollY)).toBe(220);
    // Test reactivation at scroll zero, where native scroll anchoring cannot move the viewport.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId('preceding').evaluate(element => { element.style.height = '0px'; });
    await expect(content).toHaveCSS('position', 'fixed');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
}

test('updates observations after a preceding sibling is inserted', async ({ page }) => {
  await page.goto('/regressions.html?case=shift&fixed-parent');
  await page.locator('.oe-sticky-item').first().waitFor();
  await page.evaluate(() => window.scrollTo(0, 220));
  const content = page.getByTestId('item').locator('.oe-sticky-content');
  await expect(content).toHaveCSS('position', 'fixed');
  await page.getByTestId('container').evaluate(element => {
    const sibling = document.createElement('div');
    sibling.id = 'inserted';
    sibling.style.height = '300px';
    element.before(sibling);
  });
  await expect(content).toHaveCSS('position', 'static');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByTestId('preceding').evaluate(element => { element.style.height = '0px'; });
  await expect(content).toHaveCSS('position', 'static');
  await page.locator('#inserted').evaluate(element => { element.style.height = '0px'; });
  await expect(content).toHaveCSS('position', 'fixed');
});

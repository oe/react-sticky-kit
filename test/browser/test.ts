import { test as base } from '@playwright/test';
export { expect, type Locator, type Page } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, runFixture, testInfo) => {
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const target = new URL(url, 'http://127.0.0.1:5174');
      if (testInfo.project.name.endsWith('-auto')) target.searchParams.set('entry-auto', '');
      const response = await goto(target.href, options);
      // Dynamic fixture imports must mount before a scroll can be applied.
      await page.locator('.oe-sticky-item').first().waitFor();
      return response;
    };
    await runFixture(page);
  },
});

/**
 * Playwright Fixtures
 *
 * Custom fixtures that enhance Playwright's built-in page fixture
 * to automatically wait for the React app to be ready
 */

import { test as base } from '@playwright/test';

/**
 * Extended page fixture that automatically waits for React app to be ready
 * after navigation
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Intercept goto to add automatic wait for app ready
    const originalGoto = page.goto.bind(page);
    page.goto = async (url: string | URL, options?) => {
      const response = await originalGoto(url, options);

      // Wait for React app to be ready
      await page
        .waitForSelector('body[data-app-ready="true"]', { timeout: 15000 })
        .catch(() => {
          // Don't fail if app ready doesn't appear - some pages might not have it
          console.log(
            'Note: data-app-ready attribute not found after navigation to',
            url
          );
        });

      return response;
    };

    await use(page);
  },
});

export { expect } from '@playwright/test';

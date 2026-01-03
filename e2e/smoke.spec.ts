// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Basic smoke tests', () => {
  test('application loads successfully', async ({ page }) => {
    // Navigate to the app
    const response = await page.goto('/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Verify response is successful
    expect(response?.status()).toBeLessThan(500);

    // Verify page title contains expected keywords
    await expect(page).toHaveTitle(/ESTA|Tracker|Login|Welcome|Michigan/i);
  });

  test('page renders content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verify body has content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText?.length).toBeGreaterThan(0);
  });
});

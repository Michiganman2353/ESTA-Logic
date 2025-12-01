// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('@smoke Basic smoke test', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto(process.env.E2E_BASE_URL ?? 'http://localhost:5173');
    await expect(page).toHaveTitle(/ESTA|Tracker|Login|Welcome/i);
  });
});

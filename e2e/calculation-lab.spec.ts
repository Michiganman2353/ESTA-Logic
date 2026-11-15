import { expect, test } from '@playwright/test';

test.describe('Public Calculation Lab', () => {
  test('landing page links to the calculation lab without requiring authentication', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /understand and track michigan earned sick time/i,
      })
    ).toBeVisible();

    await page.getByRole('button', { name: /open calculation lab/i }).click();
    await expect(page).toHaveURL(/\/guided-flow$/);
  });

  test('calculation lab is public and explains the modeled rule boundaries', async ({ page }) => {
    await page.goto('/guided-flow');

    await expect(
      page.getByRole('heading', { name: /calculation lab/i })
    ).toBeVisible();

    await expect(page.getByText(/1 hour per 30 hours worked/i)).toBeVisible();
    await expect(page.getByText(/10 or fewer employees/i)).toBeVisible();
    await expect(page.getByText(/does not save/i)).toBeVisible();
  });

  test('landing page avoids unsupported categorical claims', async ({ page }) => {
    await page.goto('/');
    const body = (await page.locator('body').innerText()).toLowerCase();

    for (const prohibitedClaim of [
      '100% compliant',
      'guaranteed compliance',
      'legally bulletproof',
      'government approved',
      'audit proof',
      'military-grade',
      'bank-level security',
    ]) {
      expect(body).not.toContain(prohibitedClaim);
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Public interactive workspace demo', () => {
  test('is accessible without account credentials and plainly discloses synthetic data', async ({ page }) => {
    await page.goto('/workspace-demo');
    await expect(page.getByRole('heading', { name: 'Employer workspace' })).toBeVisible();
    await expect(page.getByText(/Sample data — not your account/i)).toBeVisible();
    await expect(page.getByText(/not a real roster/i)).toBeVisible();
  });

  test('lets a visitor simulate employee request and manager review without saving any records', async ({ page }) => {
    await page.goto('/workspace-demo');
    await page.getByRole('button', { name: 'Employee', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Employee workspace' })).toBeVisible();

    await page.getByLabel('Example requested date').fill('2027-02-10');
    await page.getByLabel('Example hours').fill('2.5');
    await page.getByRole('button', { name: 'Add request to demo queue' }).click();
    await expect(page.getByText(/not submitted to an employer/i)).toBeVisible();

    await page.getByRole('button', { name: 'Employer', exact: true }).click();
    await expect(page.getByText('3 pending')).toBeVisible();
    await page.getByRole('button', { name: 'Review example request' }).first().click();

    await expect(page.getByRole('button', { name: 'Approve in demo' })).toBeDisabled();
    await page.getByLabel('Manager decision note (required)').fill('Reviewed example details');
    await page.getByRole('button', { name: 'Approve in demo' }).click();

    await expect(page.getByText(/Demo request marked approved/i)).toBeVisible();
    await expect(page.getByText('2 pending')).toBeVisible();

    await page.reload();
    await expect(page.getByText('2 pending')).toBeVisible();
    await expect(page.getByText(/All names, balances, requests, and decisions below are simulated/i)).toBeVisible();
  });

  test('opens demo from the public homepage', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('hero-workspace-demo').click();
    await expect(page).toHaveURL(/\/workspace-demo$/);
    await expect(page.getByRole('heading', { name: 'Employer workspace' })).toBeVisible();
  });
});

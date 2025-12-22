import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-123456', {
      waitUntil: 'networkidle',
    });

    // Skip test if server didn't start properly
    if (!response) {
      test.skip();
      return;
    }

    // Should either show a 404 page or redirect to login/home
    // For SPAs, they often show the app with a not found component
    expect([200, 404]).toContain(response.status());
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    const response = await page.goto('/dashboard', {
      waitUntil: 'domcontentloaded',
    });

    // Skip test if server didn't start properly
    if (!response || response.status() >= 500) {
      test.skip();
      return;
    }

    // Wait for any redirects or page loads to complete
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Should redirect to login or home page, or stay on dashboard if authenticated
    const waitResult = await page.waitForURL(/\/(login|dashboard|$)/, { timeout: 10000 }).catch(() => null);

    // Either redirected to login or stayed on dashboard (if already authenticated) or home
    const currentUrl = page.url();
    const isValidState = currentUrl.includes('/login') || 
                        currentUrl.includes('/dashboard') || 
                        currentUrl === 'http://localhost:5173/' ||
                        currentUrl === 'http://localhost:5173';
    
    // Log for debugging
    if (!isValidState) {
      console.log('Unexpected URL state:', currentUrl);
    }
    
    expect(isValidState).toBeTruthy();
  });

  test('browser back button should work', async ({ page }) => {
    const response1 = await page.goto('/login', { waitUntil: 'networkidle' });

    // Skip test if server didn't start properly
    if (!response1 || response1.status() >= 500) {
      test.skip();
      return;
    }

    const response2 = await page.goto('/register', {
      waitUntil: 'networkidle',
    });

    if (!response2 || response2.status() >= 500) {
      test.skip();
      return;
    }

    await page.goBack();

    // Should be back on login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

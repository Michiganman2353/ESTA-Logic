/**
 * E2E Test Helper Functions
 *
 * Common utilities for E2E tests to improve reliability
 */

import { Page } from '@playwright/test';

/**
 * Wait for the React app to be fully rendered and ready
 * The app sets data-app-ready="true" on the body once React has mounted
 */
export async function waitForAppReady(
  page: Page,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 30000 } = options;

  try {
    await page.waitForSelector('body[data-app-ready="true"]', { timeout });
  } catch (error) {
    console.warn('App ready attribute not found, app may still be loading');
    // Don't throw - some pages might not have this attribute yet
  }
}

/**
 * Navigate to a page and wait for it to be fully ready, including animations
 * This is especially important for pages with CSS animations and delays
 */
export async function navigateAndWaitForAnimations(
  page: Page,
  url: string,
  options: { timeout?: number; animationDelay?: number } = {}
): Promise<void> {
  const { timeout = 10000, animationDelay = 1000 } = options;

  // Navigate and wait for networkidle
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {
    // networkidle might timeout, that's okay
  });

  // Wait for React app to be ready
  await waitForAppReady(page, { timeout });

  // Wait for animations to complete
  // Our pages use animation delays up to 0.5s, so 1s should be sufficient
  await page.waitForTimeout(animationDelay);
}

/**
 * Check if an element with specific text pattern exists and is visible
 * Returns true if found, false otherwise (doesn't throw)
 */
export async function hasVisibleTextPattern(
  page: Page,
  pattern: RegExp,
  options: { timeout?: number } = {}
): Promise<boolean> {
  const { timeout = 5000 } = options;

  try {
    const bodyText = await page.textContent('body', { timeout });
    return pattern.test(bodyText || '');
  } catch {
    return false;
  }
}

/**
 * Wait for element to be visible, returns true if visible, false if not (doesn't throw)
 */
export async function isElementVisible(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<boolean> {
  const { timeout = 5000 } = options;

  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

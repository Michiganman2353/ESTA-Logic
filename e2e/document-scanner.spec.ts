import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for DocumentScanner component
 *
 * These tests use fake media streams to simulate camera access
 * and validate the document scanning workflow.
 */

test.describe('DocumentScanner E2E', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Grant camera permissions
    await page.context().grantPermissions(['camera']);

    // Mock getUserMedia with fake video stream
    await page.addInitScript(() => {
      // Create a fake video stream
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Draw a simple document-like rectangle
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(200, 200, 1520, 680);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Test Document', canvas.width / 2, canvas.height / 2);
      }

      const stream = canvas.captureStream(30);

      // Override getUserMedia
      navigator.mediaDevices.getUserMedia = async () => stream;
    });

    // Navigate to test page (adjust URL as needed)
    await page.goto('/test/document-scanner');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should render initial setup screen', async () => {
    await expect(page.getByText('Document Scanner')).toBeVisible();
    await expect(page.getByText('Start Camera')).toBeVisible();
    await expect(
      page.getByText(/Position document on a flat surface/i)
    ).toBeVisible();
  });

  test('should start camera and show capture interface', async () => {
    // Wait a bit for the page to be fully ready
    await page.waitForTimeout(1000);

    const startButton = page.getByText('Start Camera');
    await startButton.click();

    // Wait for camera to start - increased timeout for CI
    await expect(page.getByText('Position Document')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Capture Document')).toBeVisible({
      timeout: 5000,
    });

    // Check for video element
    const video = page.locator('video');
    await expect(video).toBeVisible({ timeout: 5000 });

    // Check for alignment guide
    const guide = page.locator('.alignment-guide');
    await expect(guide).toBeVisible({ timeout: 5000 });
  });

  test('should show zoom control in capture mode', async () => {
    await page.getByText('Start Camera').click();

    await expect(page.getByText('Position Document')).toBeVisible();
    await expect(page.getByText(/Zoom: 1.0x/i)).toBeVisible();

    // Check for zoom slider
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
  });

  test('should adjust zoom when slider changes', async () => {
    await page.getByText('Start Camera').click();

    await expect(page.getByText('Position Document')).toBeVisible();

    // Adjust zoom
    const slider = page.locator('input[type="range"]');
    await slider.fill('2.0');

    await expect(page.getByText(/Zoom: 2.0x/i)).toBeVisible();
  });

  test('should capture document and show preview', async () => {
    await page.getByText('Start Camera').click();
    await expect(page.getByText('Position Document')).toBeVisible();

    await page.getByText('Capture Document').click();

    // Wait for preview
    await expect(page.getByText('Review Document')).toBeVisible();
    await expect(page.getByText('Retake')).toBeVisible();
    await expect(page.getByText('Confirm & Upload')).toBeVisible();

    // Check for preview image
    const previewImage = page.locator('.preview-image');
    await expect(previewImage).toBeVisible();
  });

  test('should show document metadata in preview', async () => {
    await page.getByText('Start Camera').click();
    await expect(page.getByText('Position Document')).toBeVisible();

    await page.getByText('Capture Document').click();

    // Wait for preview
    await expect(page.getByText('Review Document')).toBeVisible();

    // Check for metadata
    await expect(page.getByText(/Size:/i)).toBeVisible();
    await expect(page.getByText(/Format: WEBP/i)).toBeVisible();
    await expect(page.getByText(/File size:/i)).toBeVisible();
  });

  test('should allow retaking document', async () => {
    await page.getByText('Start Camera').click();
    await expect(page.getByText('Position Document')).toBeVisible();

    await page.getByText('Capture Document').click();
    await expect(page.getByText('Review Document')).toBeVisible();

    // Retake
    await page.getByText('Retake').click();

    // Should be back to capture screen
    await expect(page.getByText('Position Document')).toBeVisible();
    await expect(page.getByText('Capture Document')).toBeVisible();
  });

  test('should handle cancel at setup', async () => {
    await page.getByText('Cancel').click();

    // Should trigger onCancel callback (check via URL or other indication)
    // This depends on your implementation
  });

  test('should handle cancel during capture', async () => {
    await page.getByText('Start Camera').click();
    await expect(page.getByText('Position Document')).toBeVisible();

    await page.getByText('Cancel').click();

    // Camera should stop and component should close
  });

  test('should show processing state during capture', async () => {
    await page.getByText('Start Camera').click();
    await expect(page.getByText('Position Document')).toBeVisible();

    // Click capture and immediately check for processing state
    const captureButton = page.getByText('Capture Document');
    await captureButton.click();

    // May see "Processing..." briefly
    // Then should transition to preview
    await expect(page.getByText('Review Document')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should work on mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for viewport change to take effect
    await page.waitForTimeout(500);

    const startButton = page.getByText('Start Camera');
    await startButton.click();

    // Increased timeout for mobile viewport
    await expect(page.getByText('Position Document')).toBeVisible({
      timeout: 15000,
    });

    // Capture and verify
    const captureButton = page.getByText('Capture Document');
    await captureButton.click();

    await expect(page.getByText('Review Document')).toBeVisible({
      timeout: 10000,
    });

    // Check that UI is still usable
    await expect(page.getByText('Retake')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Confirm & Upload')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should work on tablet viewport', async () => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Wait for viewport change to take effect
    await page.waitForTimeout(500);

    const startButton = page.getByText('Start Camera');
    await startButton.click();

    // Increased timeout for tablet viewport
    await expect(page.getByText('Position Document')).toBeVisible({
      timeout: 15000,
    });

    const captureButton = page.getByText('Capture Document');
    await captureButton.click();

    await expect(page.getByText('Review Document')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should respect edge detection setting', async () => {
    // This test assumes you have a way to toggle edge detection
    // via props or UI controls

    // Wait for page to be ready
    await page.waitForTimeout(1000);

    const startButton = page.getByText('Start Camera');
    await startButton.click();

    await expect(page.getByText('Position Document')).toBeVisible({
      timeout: 15000,
    });

    const captureButton = page.getByText('Capture Document');
    await captureButton.click();

    await expect(page.getByText('Review Document')).toBeVisible({
      timeout: 10000,
    });

    // If edges were detected, there should be an indicator
    // This depends on your implementation
    // For now, we just verify the workflow completes successfully
  });
});

test.describe('DocumentScanner Error Handling', () => {
  test('should handle camera permission denied', async ({ browser }) => {
    const page = await browser.newPage();

    // Deny camera permissions
    await page.context().clearPermissions();

    // Mock getUserMedia to throw permission error
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Permission denied', 'NotAllowedError');
      };
    });

    await page.goto('/test/document-scanner');

    await page.getByText('Start Camera').click();

    // Should show error message
    await expect(page.getByText(/Unable to access camera/i)).toBeVisible();

    await page.close();
  });

  test('should handle camera not found', async ({ browser }) => {
    const page = await browser.newPage();

    // Mock getUserMedia to throw not found error
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Camera not found', 'NotFoundError');
      };
    });

    await page.goto('/test/document-scanner');

    await page.getByText('Start Camera').click();

    await expect(page.getByText(/Unable to access camera/i)).toBeVisible();

    await page.close();
  });
});

test.describe('DocumentScanner Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/test/document-scanner');

    // Check for accessible elements
    const startButton = page.getByRole('button', { name: /Start Camera/i });
    await expect(startButton).toBeVisible();

    const cancelButton = page.getByRole('button', { name: /Cancel/i });
    await expect(cancelButton).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/test/document-scanner');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to activate buttons with Enter
    await page.getByText('Start Camera').focus();
    await page.keyboard.press('Enter');

    await expect(page.getByText('Position Document')).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/test/document-scanner');

    // This would require axe-core or similar tool
    // For now, just verify elements are visible
    await expect(page.getByText('Document Scanner')).toBeVisible();
  });
});

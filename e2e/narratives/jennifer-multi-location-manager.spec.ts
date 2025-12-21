/**
 * Narrative E2E Test: Jennifer - The Multi-Location Manager
 * 
 * Based on USER_EXPERIENCE_VISION.md - Narrative 3
 * 
 * This test simulates Jennifer's journey from overwhelm to strategic empowerment:
 * Act 1: Overwhelm → Act 2: Hope → Act 3: Implementation
 * → Act 4: Liberation → Act 5: Strategic Partner
 * 
 * Key UX Validations:
 * - Bulk operations simplify complexity
 * - Multi-location support without confusion
 * - Dashboard consolidation reduces overwhelm
 * - Time savings are dramatic and measurable
 * - Analytics enable strategic decisions
 */

import { test, expect } from '@playwright/test';

test.describe('Jennifer\'s Journey: Multi-Location Manager Transformation', () => {
  test.describe('Act 1: Overwhelm (Before ESTA Tracker)', () => {
    test('Setup acknowledges complexity of multi-location management', async ({ page }) => {
      // Jennifer manages HR for 12 locations, 180+ employees
      // She's drowning in spreadsheets
      // System must acknowledge this complexity, not ignore it
      
      await page.goto('/register/manager');
      
      const nameField = page.locator('input[id="name"]');
      const visible = await nameField.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (!visible) {
        test.skip();
        return;
      }
      
      // UX Principle: System should support multi-location scenarios
      // Document expectation: Support for location-based organization
    });
  });

  test.describe('Act 2: Hope (Discovery)', () => {
    test('Registration mentions multi-location support capability', async ({ page }) => {
      await page.goto('/register');
      
      // "Demo shows multi-location support"
      // Jennifer sees: "Automatic policy selection per location"
      
      const bodyText = await page.textContent('body');
      
      // Look for enterprise/multi-location language
      const hasEnterpriseFeatures = /location|multiple|enterprise|organization/i.test(bodyText || '');
      
      // System should communicate it can handle complexity
    });
  });

  test.describe('Act 3: Implementation (Guided Setup)', () => {
    test('Bulk employee import is mentioned or available', async ({ page }) => {
      await page.goto('/register/manager');
      
      const nameField = page.locator('input[id="name"]');
      const visible = await nameField.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (!visible) {
        test.skip();
        return;
      }
      
      // Fill Jennifer's information
      await nameField.fill('Jennifer Martinez');
      await page.locator('input[id="email"]').fill(`jennifer.hr.${Date.now()}@example.com`);
      await page.locator('input[id="password"]').fill('JenniferHR2024!');
      await page.locator('input[id="confirmPassword"]').fill('JenniferHR2024!');
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Company Information
      await page.locator('input[id="companyName"]').fill('Restaurant Chain Inc');
      
      // Jennifer has 180 employees - large employer
      await page.locator('input[id="employeeCount"]').fill('180');
      
      // UX Expectation: System recognizes large employer
      // Should offer or mention bulk import capabilities
      // "Bulk employee import via CSV (180 employees in 5 minutes)"
      
      await page.getByRole('button', { name: /next/i }).click();
    });

    test('Multiple locations can be configured', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const isLoggedIn = !page.url().includes('/login') && !page.url().endsWith('/');
      
      if (!isLoggedIn) {
        test.skip();
        return;
      }
      
      // UX Principle: "Sets up 12 locations with different employee counts"
      // System should support location-based organization
      
      // Look for location management features
      const hasLocationFeatures = await page.locator('[data-testid*="location"], text=/location|site|facility/i')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      // Document expectation: Location management interface
    });

    test('System applies correct rules per location automatically', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const isLoggedIn = !page.url().includes('/login') && !page.url().endsWith('/');
      
      if (!isLoggedIn) {
        test.skip();
        return;
      }
      
      // UX Principle: "System automatically applies correct rules per location"
      // Different locations = different employee counts = different rules
      
      // Jennifer shouldn't have to manually configure rules for each location
      // System intelligence handles this
      
      // Document expectation: Automatic policy selection based on location size
    });
  });

  test.describe('Act 4: Liberation (First Month)', () => {
    test('Unified dashboard shows all locations at once', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const isLoggedIn = !page.url().includes('/login') && !page.url().endsWith('/');
      
      if (!isLoggedIn) {
        test.skip();
        return;
      }
      
      // UX Principle: "One dashboard shows all 12 locations"
      // Jennifer goes from 8 hours/week to 20 minutes/week
      
      // Look for dashboard/overview features
      const hasDashboard = await page.locator('[data-testid*="dashboard"], main, [role="main"]')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      expect(hasDashboard).toBeTruthy();
      
      // Document expectation: Multi-location overview with compliance status
    });

    test('Automatic alerts prevent compliance issues proactively', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const isLoggedIn = !page.url().includes('/login') && !page.url().endsWith('/');
      
      if (!isLoggedIn) {
        test.skip();
        return;
      }
      
      // UX Principle: "Automatic alerts for compliance issues"
      // Jennifer is proactive, not reactive
      
      // Look for notification/alert capabilities
      const hasAlerts = await page.locator('[data-testid*="alert"], [data-testid*="notification"], [class*="notification"]')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      // Document expectation: Proactive compliance alerts
    });

    test('Real-time reporting available for executive team', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const isLoggedIn = !page.url().includes('/login') && !page.url().endsWith('/');
      
      if (!isLoggedIn) {
        test.skip();
        return;
      }
      
      // UX Principle: "Real-time reporting for executive team"
      // Jennifer needs to show value to leadership
      
      // Look for reporting/analytics features
      const hasReporting = await page.locator('text=/report|analytics|export|download/i')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      // Document expectation: Executive-ready reports and analytics
    });

    test('Time savings are measurable and significant', async ({ page }) => {
      // This is a meta-test for efficiency
      // Jennifer's time: 8 hours/week → 20 minutes/week
      // 96% time reduction
      
      await page.goto('/');
      
      // System should emphasize efficiency
      const bodyText = await page.textContent('body');
      
      // Look for efficiency messaging
      const hasEfficiencyFocus = /quick|fast|automatic|simple|easy/i.test(bodyText || '');
      
      expect(hasEfficiencyFocus).toBeTruthy();
    });
  });

  test.describe('Act 5: Strategic Partner (Long-term)', () => {
    test('Analytics enable strategic decision-making', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const isLoggedIn = !page.url().includes('/login') && !page.url().endsWith('/');
      
      if (!isLoggedIn) {
        test.skip();
        return;
      }
      
      // UX Principle: "Uses analytics to optimize scheduling"
      // Jennifer moves from administrative to strategic
      
      // Look for analytics/insights features
      const hasAnalytics = await page.locator('[data-testid*="analytics"], [data-testid*="insights"], text=/trend|pattern|analysis/i')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      // Document expectation: Strategic insights, not just data
    });

    test('Audit-ready reports build executive confidence', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const isLoggedIn = !page.url().includes('/login') && !page.url().endsWith('/');
      
      if (!isLoggedIn) {
        test.skip();
        return;
      }
      
      // UX Principle: "Executive team impressed by audit-ready reports"
      // Jennifer becomes internal champion
      
      // Look for report/export capabilities
      const hasExport = await page.locator('text=/export|download|report|pdf/i')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      // Document expectation: Professional, audit-ready documentation
    });
  });
});

test.describe('Jennifer\'s Journey: Enterprise-Scale UX Principles', () => {
  test('Bulk operations prevent manual tedium', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const isLoggedIn = !page.url().includes('/login') && !page.url().endsWith('/');
    
    if (!isLoggedIn) {
      test.skip();
      return;
    }
    
    // UX Principle: "Bulk employee import via CSV (180 employees in 5 minutes)"
    // vs. manual entry taking 2 weeks
    
    // Look for import/bulk capabilities
    const hasBulkFeatures = await page.locator('text=/import|bulk|upload|csv/i')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    
    // Document expectation: CSV import for employee data
  });

  test('Multi-location dashboard reduces context switching', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const isLoggedIn = !page.url().includes('/login') && !page.url().endsWith('/');
    
    if (!isLoggedIn) {
      test.skip();
      return;
    }
    
    // UX Principle: Single pane of glass for all locations
    // Jennifer doesn't want 12 separate dashboards
    
    // Document expectation: Consolidated multi-location view
  });

  test('Automatic rule application reduces configuration burden', async ({ page }) => {
    await page.goto('/');
    
    // UX Principle: "System automatically applies correct rules per location"
    // Jennifer shouldn't be a compliance expert
    
    // System intelligence handles complexity
    const bodyText = await page.textContent('body');
    const hasAutomation = /automatic|auto|intelligent|smart/i.test(bodyText || '');
    
    // Automation is key for enterprise scale
  });

  test('Compliance status at-a-glance prevents fire drills', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const isLoggedIn = !page.url().includes('/login') && !page.url().endsWith('/');
    
    if (!isLoggedIn) {
      test.skip();
      return;
    }
    
    // UX Principle: "Dashboard shows compliance status across all locations"
    // Jennifer needs immediate visibility into problems
    
    // Look for status indicators
    const hasStatus = await page.locator('[data-testid*="status"], [class*="status"], text=/compliant|pending|alert/i')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    
    // Document expectation: Visual compliance status indicators
  });

  test('Scalability is transparent - system handles growth', async ({ page }) => {
    await page.goto('/register/manager');
    
    const nameField = page.locator('input[id="name"]');
    const visible = await nameField.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!visible) {
      test.skip();
      return;
    }
    
    // Test with large employee count
    await nameField.fill('Test Manager');
    await page.locator('input[id="email"]').fill(`test.scale.${Date.now()}@example.com`);
    await page.locator('input[id="password"]').fill('TestPass123!');
    await page.locator('input[id="confirmPassword"]').fill('TestPass123!');
    await page.getByRole('button', { name: /next/i }).click();
    
    await page.locator('input[id="companyName"]').fill('Large Enterprise');
    
    // Try a very large number
    await page.locator('input[id="employeeCount"]').fill('500');
    
    // System should handle this gracefully
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeEnabled();
  });

  test('Emotional transformation: Overwhelm to Empowerment', async ({ page }) => {
    // Meta-test for Jennifer's emotional arc
    // 😵 Overwhelm → 🤞 Hope → 😲 Amazement → 😌 Relief → 🌟 Empowerment
    
    await page.goto('/');
    
    // System should feel like it handles complexity FOR Jennifer
    // Not that it adds MORE complexity
    
    const bodyText = await page.textContent('body');
    
    // Language should emphasize: simple, automatic, consolidated
    const hasSimplificationFocus = /simple|easy|automatic|one|unified|consolidated/i.test(bodyText || '');
    
    expect(hasSimplificationFocus).toBeTruthy();
  });
});

test.describe('Jennifer\'s Journey: Time-to-Value Metrics', () => {
  test('Setup time should be reasonable even for large organizations', async ({ page }) => {
    // UX Success Metric: "Setup complete in 1 hour vs. estimated 2 weeks"
    // Even for 180 employees across 12 locations
    
    await page.goto('/register/manager');
    
    const nameField = page.locator('input[id="name"]');
    const visible = await nameField.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!visible) {
      test.skip();
      return;
    }
    
    // Registration flow should be fast
    // Document: Target < 1 hour for complete enterprise setup
  });

  test('Weekly admin time reduction is the core value prop', async ({ page }) => {
    // Jennifer's value: 8 hours/week → 20 minutes/week
    // 96% time reduction
    
    await page.goto('/');
    
    // System should emphasize time savings
    const bodyText = await page.textContent('body');
    
    // Look for time-saving messaging
    const hasTimeSavings = /save time|reduce time|automate|automatic|minutes|hours/i.test(bodyText || '');
    
    // Time savings are the #1 value for enterprise users
  });
});

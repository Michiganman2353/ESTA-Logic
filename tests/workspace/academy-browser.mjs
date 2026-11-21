import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.ACADEMY_BASE_URL ?? 'http://127.0.0.1:5180';
const artifacts =
  process.env.ACADEMY_ARTIFACTS_DIR ?? path.resolve('test-results/academy');
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const failures = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.setDefaultTimeout(30000);
  page.on('pageerror', (error) => failures.push(error.message));
  const writes = [];
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      /workspaceApi|firestore/.test(request.url())
    )
      writes.push(request.url());
  });
  // The academy must not depend on account or cloud-service availability.
  await page.route(
    /cloudfunctions\.net|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/,
    (route) => route.abort()
  );
  await page.goto(`${base}/interactive-world`, {
    waitUntil: 'domcontentloaded',
  });
  await page
    .getByRole('heading', { name: 'Explore ESTA Academy', exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole('button', { name: /0[1-6] .*→/ }).count(),
    6
  );
  const map = page.getByRole('region', { name: 'Academy exploration map' });
  await map.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(
    await page.locator('.academy-player').getAttribute('transform'),
    'translate(338 530)'
  );
  await page.getByRole('button', { name: 'Move west', exact: true }).click();
  assert.equal(
    await page.locator('.academy-player').getAttribute('transform'),
    'translate(320 530)'
  );
  const click = (name) =>
    page.getByRole('button', { name, exact: typeof name === 'string' }).click();
  const steps = [
    [
      /01 Employer Office/,
      'Accrual or frontloading?',
      'Try the accrual example',
      '2 hours, calculated for this period',
      'Complete the setup lesson',
    ],
    [
      /02 Payroll Desk/,
      'Practice reviewing a duplicate',
      null,
      'Resolve the duplicate email and payroll ID, then review again',
      'Complete the payroll lesson',
    ],
    [
      /03 Employee Center/,
      'Follow a practice request',
      null,
      'It is saved as a request and awaits an employer decision',
      'Complete the employee lesson',
    ],
    [
      /04 Compliance Inspector/,
      'Inspect a practice adjustment',
      null,
      'The source or reason supporting the adjustment',
      'Complete the records lesson',
    ],
  ];
  for (const [location, first, second, answer, complete] of steps) {
    await click(location);
    await click(first);
    if (second) await click(second);
    if (second) {
      await click('No time is earned');
      await page.getByText('Take another look.', { exact: true }).waitFor();
    }
    await click(answer);
    await click('Continue lesson');
    await click(complete);
  }
  assert.equal(await page.getByRole('progressbar').getAttribute('value'), '4');
  await page
    .getByText('You’ve connected the steps.', { exact: true })
    .waitFor();
  await click('Return to the inspector');
  await click('Connect all four lessons');
  await page
    .getByRole('heading', {
      name: 'From practice to a real process',
      exact: true,
    })
    .waitFor();
  await page.keyboard.press('Escape');
  assert.equal(
    await page
      .getByRole('button', { name: /04 Compliance Inspector/ })
      .evaluate((el) => document.activeElement === el),
    true
  );
  await click('Restart this visit');
  assert.equal(await page.getByRole('progressbar').getAttribute('value'), '0');
  await page.screenshot({
    path: path.join(artifacts, 'desktop.png'),
    fullPage: true,
  });
  assert.equal(
    writes.length,
    0,
    'Practice must not write authoritative records'
  );
  await page.getByRole('link', { name: 'Employer guide', exact: true }).click();
  await page
    .getByRole('heading', {
      name: 'Understand ESTA. Set up a practical process.',
      exact: true,
    })
    .waitFor();
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('button', { name: 'Explore ESTA Academy', exact: true })
    .click();
  await page
    .getByRole('heading', { name: 'Explore ESTA Academy', exact: true })
    .waitFor();
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  mobile.on('pageerror', (error) => failures.push(error.message));
  await mobile.route(
    /cloudfunctions\.net|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/,
    (route) => route.abort()
  );
  await mobile.goto(`${base}/interactive-world`, {
    waitUntil: 'domcontentloaded',
  });
  await mobile
    .getByRole('heading', { name: 'Explore ESTA Academy', exact: true })
    .waitFor();
  await mobile.getByRole('button', { name: 'Move east', exact: true }).tap();
  assert.equal(
    await mobile.locator('.academy-player').getAttribute('transform'),
    'translate(338 530)'
  );
  assert.equal(
    await mobile
      .locator('.academy-player')
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    '0s'
  );
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    ),
    true,
    'Mobile has no horizontal overflow'
  );
  await mobile.getByRole('button', { name: /03 Employee Center/ }).tap();
  await mobile
    .getByRole('heading', {
      name: 'Know where your request stands',
      exact: true,
    })
    .waitFor();
  await mobile
    .getByRole('button', { name: 'Close conversation', exact: true })
    .tap();
  await mobile.screenshot({
    path: path.join(artifacts, 'mobile.png'),
    fullPage: true,
  });
  assert.deepEqual(failures, []);
  console.log(
    'PASS academy browser: anonymous entry with unavailable cloud services; movement; four quests; conditional dialogue; focus recovery; links; no record writes; mobile touch and reduced motion.'
  );
} finally {
  await browser.close();
}

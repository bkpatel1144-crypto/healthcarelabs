/**
 * Monkey test: seeded random clicking, typing and key presses on every route,
 * as a guest, a patient and an admin. It fails on any uncaught exception,
 * React error, or an injected script actually running.
 *
 * Re-run a failure with the same seed:  MONKEY_SEED=1234 npx playwright test --project=monkey
 */
import { test, expect, type Page } from '@playwright/test';
import { makeAdmin, resetEmulators, uidForEmail } from './emulator';
import { completeWelcome } from './helpers';

const SEED = Number(process.env.MONKEY_SEED ?? Date.now() % 100_000);
const ACTIONS_PER_ROUTE = Number(process.env.MONKEY_ACTIONS ?? 30);

/** Mulberry32 — small, fast, reproducible. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const JUNK = [
  '',
  ' ',
  'a',
  '9876543210',
  '+91 98765 43210',
  '00000',
  'नमस्ते 😀 ✓ — “quotes”',
  'x'.repeat(5000),
  '<img src=x onerror="window.__xss=1">',
  '"><script>window.__xss=1</script>',
  "'; DROP TABLE bookings; --",
  '{{constructor.constructor("window.__xss=1")()}}',
  '2020-01-01',
  '9999-12-31',
  '-1',
  'test@test',
  'person@example.com',
];

const PUBLIC = ['/', '/terms', '/about-us', '/health-package', '/health-package/basic-health-check-up', '/my-offers', '/blog', '/contact-us', '/lab-locations', '/upload-prescription', '/help', '/partner-with-us', '/login', '/privacy-policy', '/this-page-does-not-exist'];
const ACCOUNT = ['/account', '/account/bookings', '/account/reports', '/account/requests', '/account/family', '/account/addresses', '/account/welcome', '/staff'];
const ADMIN = ['/admin', '/admin/bookings', '/admin/patients', '/admin/reports', '/admin/requests', '/admin/staff', '/admin/scheduling', '/admin/audit', '/admin/packages', '/admin/offers', '/admin/blog', '/admin/testimonials', '/admin/settings'];

function watch(page: Page, origin: string, errors: string[]) {
  page.on('pageerror', (e) => errors.push(`pageerror on ${page.url()}: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/tile\.openstreetmap|fonts\.g|net::ERR|Failed to load resource|ERR_ABORTED/.test(t)) return;
    // Firestore logs refused writes; the UI shows its own message for those.
    if (/PERMISSION_DENIED|permission-denied/.test(t)) return;
    errors.push(`console on ${page.url()}: ${t.slice(0, 300)}`);
  });
  page.on('dialog', (d) => {
    if (d.type() === 'alert' && /^1$/.test(d.message())) errors.push(`XSS alert fired on ${page.url()}`);
    void d.accept();
  });
  page.on('popup', (p) => void p.close());
  // Keep the monkey on this site: block navigations to any other origin.
  void page.route('**/*', (route) => {
    const req = route.request();
    if (req.isNavigationRequest() && req.frame() === page.mainFrame() && !req.url().startsWith(origin)) {
      return route.abort();
    }
    return route.continue();
  });
}

async function monkeyAround(page: Page, route: string, random: () => number, errors: string[], forbidden: RegExp) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  for (let i = 0; i < ACTIONS_PER_ROUTE; i += 1) {
    const roll = random();
    try {
      if (roll < 0.45) {
        const targets = page.locator(
          'button:visible:not([disabled]), a[href^="/"]:visible, a[href^="#"]:visible, [role="tab"]:visible, [role="option"]:visible, input[type="checkbox"]:visible',
        );
        const n = await targets.count();
        if (n === 0) continue;
        const el = targets.nth(Math.floor(random() * n));
        const label = ((await el.getAttribute('aria-label')) ?? (await el.innerText().catch(() => ''))).trim();
        if (forbidden.test(label)) continue;
        await el.click({ timeout: 1500, trial: false });
      } else if (roll < 0.8) {
        const fields = page.locator('input:visible:not([type="file"]):not([type="checkbox"]):not([disabled]), textarea:visible');
        const n = await fields.count();
        if (n === 0) continue;
        await fields.nth(Math.floor(random() * n)).fill(JUNK[Math.floor(random() * JUNK.length)], { timeout: 1500 });
      } else if (roll < 0.93) {
        const keys = ['Escape', 'Tab', 'Enter', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Shift+Tab', 'Control+k', '/'];
        await page.keyboard.press(keys[Math.floor(random() * keys.length)]);
      } else if (roll < 0.97) {
        await page.setViewportSize(random() < 0.5 ? { width: 375, height: 760 } : { width: 1280, height: 900 });
      } else {
        await page.goBack({ timeout: 3000 }).catch(() => {});
        // Back from the first page leaves the site entirely; return to it.
        if (!page.url().startsWith('http')) await page.goto(route);
      }
    } catch {
      // Elements detach and pages navigate mid-action; that is the point.
    }
    if (await page.evaluate(() => (window as unknown as { __xss?: number }).__xss === 1).catch(() => false)) {
      errors.push(`Injected script ran on ${page.url()}`);
    }
  }
  // After the chaos the app must still render something, not a blank root.
  const rootText = await page.locator('#root').innerText({ timeout: 5000 }).catch(() => '');
  if (rootText.trim().length === 0) errors.push(`Blank page after monkeying on ${route} (now ${page.url()})`);
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await resetEmulators();
});

test(`monkey: guest on every public page (seed ${SEED})`, async ({ page, baseURL }) => {
  test.setTimeout(10 * 60_000);
  const errors: string[] = [];
  watch(page, baseURL!, errors);
  const random = rng(SEED);
  for (const route of PUBLIC) await monkeyAround(page, route, random, errors, /^$/);
  expect(errors, errors.join('\n')).toEqual([]);
});

test(`monkey: patient in their account (seed ${SEED + 1})`, async ({ page, baseURL }) => {
  test.setTimeout(10 * 60_000);
  const errors: string[] = [];
  watch(page, baseURL!, errors);
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Email' }).click();
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.getByLabel('Full name').fill('Monkey Patient');
  await page.getByLabel('Email').fill('monkey@test.dev');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await completeWelcome(page, { phone: '9711111111' });

  const random = rng(SEED + 1);
  // Logging out mid-run would only test the login redirect over and over.
  for (const route of [...ACCOUNT, '/contact-us', '/upload-prescription', '/help']) {
    await monkeyAround(page, route, random, errors, /Log out/i);
  }
  expect(errors, errors.join('\n')).toEqual([]);
});

test(`monkey: admin in the panel (seed ${SEED + 2})`, async ({ page, baseURL }) => {
  test.setTimeout(10 * 60_000);
  const errors: string[] = [];
  watch(page, baseURL!, errors);
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Email' }).click();
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.getByLabel('Full name').fill('Monkey Admin');
  await page.getByLabel('Email').fill('monkey-admin@test.dev');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await completeWelcome(page, { phone: '9711111111' });
  await makeAdmin(await uidForEmail('monkey-admin@test.dev'));
  await page.goto('/admin');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  const random = rng(SEED + 2);
  for (const route of ADMIN) await monkeyAround(page, route, random, errors, /Log out|Back to site/i);
  expect(errors, errors.join('\n')).toEqual([]);
});

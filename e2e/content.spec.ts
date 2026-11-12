/**
 * Admin content management (packages, offers, blog, testimonials, settings)
 * checked step by step against what the public site then shows — plus Google
 * sign-in through the auth emulator's sign-in page.
 */
import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { makeAdmin, resetEmulators, uidForEmail } from './emulator';
import { completeWelcome } from './helpers';

test.describe.configure({ mode: 'serial' });

const ADMIN = { name: 'Content Admin', email: 'content-admin@test.dev', password: 'secret123' };
const errors: string[] = [];
let ctx: BrowserContext;
let admin: Page;

async function watched(browser: Browser): Promise<[BrowserContext, Page]> {
  const c = await browser.newContext({ acceptDownloads: true });
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(`pageerror on ${p.url()}: ${e.message}`));
  p.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/tile\.openstreetmap|fonts\.g|net::ERR|Failed to load resource/.test(t)) return;
    errors.push(`console on ${p.url()}: ${t.slice(0, 300)}`);
  });
  p.on('dialog', (d) => void d.accept());
  return [c, p];
}

async function pick(page: Page, combobox: string, option: string | RegExp) {
  await page.getByRole('combobox', { name: combobox }).click();
  await page.getByRole('option', { name: option }).first().click();
}

const dialog = () => admin.getByRole('dialog');

test.beforeAll(async ({ browser }) => {
  await resetEmulators();
  [ctx, admin] = await watched(browser);
  await admin.goto('/login');
  await admin.getByRole('tab', { name: 'Email' }).click();
  await admin.getByRole('button', { name: 'Create an account' }).click();
  await admin.getByLabel('Full name').fill(ADMIN.name);
  await admin.getByLabel('Email').fill(ADMIN.email);
  await admin.getByLabel('Password').fill(ADMIN.password);
  await admin.getByRole('button', { name: 'Create account' }).click();
  await completeWelcome(admin, { phone: '9700000001' });
  await makeAdmin(await uidForEmail(ADMIN.email));
  await admin.goto('/admin');
  await admin.reload();
  await expect(admin.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test.afterAll(async () => {
  await ctx?.close();
});

test.afterEach(() => {
  const found = errors.splice(0);
  expect(found, `Browser errors:\n${found.join('\n')}`).toEqual([]);
});

/* ---------------------------------------------------------------- packages */

test('packages: create, show publicly, edit, archive, restore, delete', async () => {
  await admin.goto('/admin/packages');
  await admin.getByRole('button', { name: 'New package' }).click();
  await dialog().getByRole('button', { name: 'Save package' }).click();
  await expect(dialog().getByRole('alert')).toContainText('needs a name');

  await dialog().getByLabel('Name').fill('Test Panel Alpha');
  await dialog().getByLabel('Summary').fill('A short test panel.');
  await dialog().getByLabel('Original price (₹)').fill('999');
  await dialog().getByLabel('Offer price (₹)').fill('799');
  await dialog().getByLabel('Report time').fill('24 hours');
  await dialog().getByLabel('Included tests').fill('Haemoglobin\n\nPlatelet count\n');
  await dialog().getByRole('button', { name: 'Save package' }).click();
  await expect(dialog()).toHaveCount(0);
  const row = admin.getByRole('row').filter({ hasText: 'Test Panel Alpha' });
  await expect(row).toContainText('/test-panel-alpha');
  await expect(row).toContainText('₹799');
  await expect(row.getByRole('cell').nth(1)).toHaveText('2'); // blank lines dropped

  await admin.goto('/health-package/test-panel-alpha');
  await expect(admin.getByRole('heading', { name: 'Test Panel Alpha', level: 1 })).toBeVisible();
  await expect(admin.getByText('Platelet count').first()).toBeVisible();

  await admin.goto('/admin/packages');
  await admin.getByRole('button', { name: 'Edit Test Panel Alpha' }).click();
  await dialog().getByLabel('Offer price (₹)').fill('699');
  await dialog().getByRole('button', { name: 'Save package' }).click();
  await expect(admin.getByRole('row').filter({ hasText: 'Test Panel Alpha' })).toContainText('₹699');

  await admin.getByRole('button', { name: 'Archive Test Panel Alpha' }).click();
  await expect(admin.getByRole('row').filter({ hasText: 'Test Panel Alpha' })).toHaveCount(0);
  await admin.goto('/health-package/test-panel-alpha');
  await expect(admin.getByRole('heading', { name: 'Test Panel Alpha', level: 1 })).toHaveCount(0);

  await admin.goto('/admin/packages');
  await admin.getByLabel('Show archived').check();
  await admin.getByRole('button', { name: 'Restore Test Panel Alpha' }).click();
  await admin.getByLabel('Show archived').uncheck();
  await expect(admin.getByRole('row').filter({ hasText: 'Test Panel Alpha' })).toBeVisible();

  await admin.getByPlaceholder('Search packages by name or test…').fill('platelet');
  await expect(admin.getByRole('row').filter({ hasText: 'Test Panel Alpha' })).toBeVisible();
  await admin.getByPlaceholder('Search packages by name or test…').fill('');

  await admin.getByRole('button', { name: 'Delete Test Panel Alpha' }).click();
  await admin.getByRole('button', { name: 'Yes, do it' }).click();
  await expect(admin.getByRole('row').filter({ hasText: 'Test Panel Alpha' })).toHaveCount(0);
});

test('packages: a second package cannot take an address already in use', async () => {
  await admin.goto('/admin/packages');
  await admin.getByRole('button', { name: 'New package' }).click();
  await dialog().getByLabel('Name').fill('Basic Health Check Up');
  await dialog().getByRole('button', { name: 'Save package' }).click();
  await expect(dialog().getByRole('alert')).toContainText(/already/i);
  await dialog().getByLabel('Slug').fill('Basic Health Check Up 2!');
  await dialog().getByRole('button', { name: 'Save package' }).click();
  await expect(dialog()).toHaveCount(0);
  // Typed slugs are normalised to a clean URL.
  await expect(admin.getByRole('row').filter({ hasText: '/basic-health-check-up-2' })).toBeVisible();
  await admin.getByRole('button', { name: 'Delete Basic Health Check Up (/basic-health-check-up-2)' }).click();
  await admin.getByRole('button', { name: 'Yes, do it' }).click();
});

test('packages: impossible prices are refused', async () => {
  await admin.goto('/admin/packages');
  await admin.getByRole('button', { name: 'New package' }).click();
  await dialog().getByLabel('Name').fill('Price Check Panel');
  await dialog().getByLabel('Original price (₹)').fill('-5');
  await dialog().getByRole('button', { name: 'Save package' }).click();
  await expect(dialog().getByRole('alert')).toContainText(/price/i);
  await dialog().getByLabel('Original price (₹)').fill('500');
  await dialog().getByLabel('Offer price (₹)').fill('900');
  await dialog().getByRole('button', { name: 'Save package' }).click();
  await expect(dialog().getByRole('alert')).toContainText(/offer price/i);
  await dialog().getByRole('button', { name: 'Cancel' }).click();
});

/* ------------------------------------------------------------------ offers */

test('offers: create linked to a package, edit, and no dead link once it is archived', async () => {
  await admin.goto('/admin/offers');
  await admin.getByRole('button', { name: 'New offer' }).click();
  await dialog().getByRole('button', { name: 'Save offer' }).click();
  await expect(dialog().getByRole('alert')).toContainText('needs a title');
  await dialog().getByLabel('Title').fill('Winter Wellness Deal');
  await dialog().getByLabel('Description').fill('Seasonal saving on the basic panel.');
  await pick(admin, 'Linked package', /Basic Health Check/i);
  await dialog().getByLabel('Original price (₹)').fill('1200');
  await dialog().getByLabel('Offer price (₹)').fill('999');
  await dialog().getByRole('button', { name: 'Save offer' }).click();
  await expect(dialog()).toHaveCount(0);

  await admin.goto('/my-offers');
  const card = admin.locator('article, li, section').filter({ hasText: 'Winter Wellness Deal' }).last();
  await expect(card).toBeVisible();
  await expect(card.getByRole('link').first()).toHaveAttribute('href', /basic-health-check-up/);

  // Archive the package the offer points at.
  await admin.goto('/admin/packages');
  await admin.getByRole('button', { name: /^Archive Basic Health Check/ }).first().click();
  await admin.goto('/my-offers');
  const links = await admin.locator('a[href*="/health-package/basic-health-check-up"]').count();
  expect(links, 'offer still links to an archived package').toBe(0);

  await admin.goto('/admin/packages');
  await admin.getByLabel('Show archived').check();
  await admin.getByRole('button', { name: /^Restore Basic Health Check/ }).first().click();

  await admin.goto('/admin/offers');
  await admin.getByRole('button', { name: 'Edit Winter Wellness Deal' }).click();
  await dialog().getByLabel('Offer price (₹)').fill('1500');
  await dialog().getByRole('button', { name: 'Save offer' }).click();
  await expect(dialog().getByRole('alert')).toContainText(/offer price/i);
  await dialog().getByLabel('Offer price (₹)').fill('899');
  await dialog().getByRole('button', { name: 'Save offer' }).click();
  await expect(dialog()).toHaveCount(0);
  await admin.getByRole('button', { name: 'Delete Winter Wellness Deal' }).click();
  await admin.getByRole('button', { name: 'Yes, do it' }).click();
  await expect(admin.getByText('Winter Wellness Deal')).toHaveCount(0);
});

/* -------------------------------------------------------------------- blog */

test('blog: create with sections, read publicly, block duplicate slug, delete', async () => {
  await admin.goto('/admin/blog');
  await admin.getByRole('button', { name: 'New article' }).click();
  await dialog().getByRole('button', { name: 'Save article' }).click();
  await expect(dialog().getByRole('alert')).toContainText('needs a title');
  await dialog().getByLabel('Title').fill('Why Fasting Matters Before a Lipid Test');
  await dialog().getByLabel('Excerpt').fill('What eating does to your numbers.');
  await dialog().getByLabel('Article body').fill('## The short answer\nFood raises triglycerides for hours.\n- Fast 10–12 hours\n- Water is fine');
  await dialog().getByRole('button', { name: 'Save article' }).click();
  await expect(dialog()).toHaveCount(0);

  await admin.goto('/blog/why-fasting-matters-before-a-lipid-test');
  await expect(admin.getByRole('heading', { name: 'The short answer' })).toBeVisible();
  await expect(admin.getByText('Water is fine')).toBeVisible();

  await admin.goto('/admin/blog');
  await admin.getByRole('button', { name: 'New article' }).click();
  await dialog().getByLabel('Title').fill('Why Fasting Matters Before a Lipid Test');
  await dialog().getByRole('button', { name: 'Save article' }).click();
  await expect(dialog().getByRole('alert')).toContainText(/already/i);
  await dialog().getByRole('button', { name: 'Cancel' }).click();

  await admin.getByRole('button', { name: 'Delete Why Fasting Matters Before a Lipid Test' }).click();
  await admin.getByRole('button', { name: 'Yes, do it' }).click();
  await admin.goto('/blog/why-fasting-matters-before-a-lipid-test');
  await expect(admin.getByRole('heading', { name: 'The short answer' })).toHaveCount(0);
});

/* ------------------------------------------------------------ testimonials */

test('testimonials: validate, create, edit, delete', async () => {
  await admin.goto('/admin/testimonials');
  await admin.getByRole('button', { name: /Add testimonial|New testimonial/ }).click();
  await dialog().getByRole('button', { name: 'Save testimonial' }).click();
  await expect(dialog().getByRole('alert')).toContainText('name and a quote');
  await dialog().getByLabel('Name').fill('Meera Joshi');
  await pick(admin, 'Rating', '4 stars');
  await dialog().getByLabel('Quote').fill('Home collection was on time and painless.');
  await dialog().getByRole('button', { name: 'Save testimonial' }).click();
  await expect(admin.getByText('Home collection was on time and painless.')).toBeVisible();
  await expect(admin.getByLabel('4 out of 5').first()).toBeVisible();

  await admin.getByRole('button', { name: 'Edit Meera Joshi' }).click();
  await dialog().getByLabel('Quote').fill('Edited quote text for the test.');
  await dialog().getByRole('button', { name: 'Save testimonial' }).click();
  await expect(admin.getByText('Edited quote text for the test.')).toBeVisible();
  await admin.getByRole('button', { name: 'Delete Meera Joshi' }).click();
  await admin.getByRole('button', { name: 'Yes, do it' }).click();
  await expect(admin.getByText('Edited quote text for the test.')).toHaveCount(0);
});

/* ---------------------------------------------------------------- settings */

test('settings: export, bad imports are refused safely, good import, reset', async () => {
  await admin.goto('/admin/settings');
  const [download] = await Promise.all([
    admin.waitForEvent('download'),
    admin.getByRole('button', { name: 'Export JSON' }).click(),
  ]);
  const chunks: Buffer[] = [];
  for await (const c of await download.createReadStream()) chunks.push(c as Buffer);
  const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(Array.isArray(exported.packages)).toBe(true);
  expect(exported.packages.length).toBeGreaterThan(3);

  const importText = async (name: string, text: string) =>
    admin.getByLabel('Choose a JSON file to import').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(text) });

  await importText('broken.json', '{ this is not json');
  await expect(admin.locator('p[role="status"]')).toContainText(/JSON|could not/i);

  // Structurally wrong content must be refused, not crash the public site.
  await importText('wrong-shape.json', JSON.stringify({ packages: [{ foo: 1 }], blogs: 'nope', offers: [null] }));
  await expect(admin.locator('p[role="status"]')).not.toContainText('Import complete');
  for (const path of ['/', '/health-package', '/my-offers', '/blog']) {
    await admin.goto(path);
    await expect(admin.locator('#root')).not.toBeEmpty();
  }

  // An empty catalogue is valid and must still render every page.
  await admin.goto('/admin/settings');
  await importText('empty.json', JSON.stringify({ packages: [], offers: [], blogs: [], testimonials: [] }));
  await expect(admin.locator('p[role="status"]')).toContainText('Import complete');
  for (const path of ['/', '/health-package', '/my-offers', '/blog', '/health-package/basic-health-check-up', '/contact-us']) {
    await admin.goto(path);
    await expect(admin.locator('main, #main').first()).toBeVisible();
  }

  await admin.goto('/admin/settings');
  await importText('backup.json', JSON.stringify(exported));
  await expect(admin.locator('p[role="status"]')).toContainText('Import complete');
  await admin.goto('/health-package/basic-health-check-up');
  await expect(admin.getByRole('heading', { level: 1 })).toContainText(/Basic Health/i);

  await admin.goto('/admin/settings');
  await admin.getByRole('button', { name: 'Reset to shipped data' }).click();
  await admin.getByRole('button', { name: 'Yes, do it' }).click();
  await expect(admin.locator('p[role="status"]')).toContainText('reset');
});

/* ------------------------------------------------------------ Google login */

test('Google sign-in creates an account with the Google name and email', async ({ browser }) => {
  const [c, page] = await watched(browser);
  await page.goto('/login');
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Continue with Google' }).click(),
  ]);
  await popup.waitForLoadState();
  // The auth emulator's stand-in for Google's account chooser.
  await popup.getByText('Add new account').click();
  await popup.locator('#email-input').fill('google.user@gmail.com');
  await popup.locator('#display-name-input').fill('Google User');
  await popup.getByRole('button', { name: /Sign in with Google/i }).click();
  await expect(page).toHaveURL(/\/account\/welcome/, { timeout: 20_000 });
  await expect(page.getByLabel('Full name')).toHaveValue('Google User');
  await expect(page.getByLabel('Email')).toHaveValue('google.user@gmail.com');
  await completeWelcome(page, { phone: '9700000002' });
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('Google User').first()).toBeVisible();
  await expect(page.getByText('google.user@gmail.com').first()).toBeVisible();
  await c.close();
});

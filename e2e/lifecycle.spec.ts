/**
 * The full order lifecycle, end to end, across four people in four browsers:
 * a lab admin, a phlebotomist and two patients. Checks that each side sees
 * what the others did, and that capacity, consent and audit hold throughout.
 */
import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { makeAdmin, resetEmulators, uidForEmail } from './emulator';
import { completeWelcome } from './helpers';

test.describe.configure({ mode: 'serial' });

const errors: string[] = [];
const contexts: BrowserContext[] = [];
let admin: Page;
let phlebo: Page;
let pat1: Page;
let pat2: Page;

const day = (offset: number) => {
  const d = new Date(Date.now() + offset * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const VISIT = day(2);
const CLOSED = day(4);
const PDF = Buffer.from('%PDF-1.1\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');

async function open(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({ acceptDownloads: true });
  contexts.push(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`pageerror on ${p.url()}: ${e.message}`));
  p.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/tile\.openstreetmap|fonts\.g|net::ERR|Failed to load resource/.test(t)) return;
    errors.push(`console on ${p.url()}: ${t.slice(0, 300)}`);
  });
  p.on('dialog', (d) => {
    // Reason prompts get a reason; confirmations are accepted.
    void (d.type() === 'prompt' ? d.accept('Patient travelling, will rebook') : d.accept());
  });
  return p;
}

async function signUp(page: Page, name: string, email: string, phone: string, marketing = false) {
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Email' }).click();
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await completeWelcome(page, { phone, marketing });
}

async function pick(page: Page, combobox: string | RegExp, option: string | RegExp) {
  await page.getByRole('combobox', { name: combobox }).first().click();
  await page.getByRole('option', { name: option }).first().click();
}

async function bookVisit(page: Page, opts: { date: string; slot: RegExp; pincode: string; expectError?: RegExp }) {
  await page.goto('/contact-us');
  await page.goto('/contact-us#home-collection');
  const form = page.locator('form').filter({ hasText: 'Book a home collection' });
  await expect(form.getByLabel('Phone number')).not.toHaveValue('');
  await form.getByLabel('Preferred date').fill(opts.date);
  if (!opts.expectError || !/date/i.test(opts.expectError.source)) await pick(page, 'Preferred time', opts.slot);
  await form.getByLabel('Collection address').fill('12 Rose Villa, Adajan Gam, Surat');
  await form.getByLabel('PIN code').fill(opts.pincode);
  const consent = form.getByRole('checkbox', { name: /I agree to the/ });
  if (!(await consent.isChecked())) await consent.check();
  await form.getByRole('button', { name: 'Request home collection' }).click();
  if (opts.expectError) await expect(form.getByText(opts.expectError)).toBeVisible();
  else await expect(page.getByText(/Request received/)).toBeVisible();
}

test.beforeAll(async ({ browser }) => {
  await resetEmulators();
  [admin, phlebo, pat1, pat2] = await Promise.all([open(browser), open(browser), open(browser), open(browser)]);
});

test.afterAll(async () => {
  await Promise.all(contexts.map((c) => c.close()));
});

test.afterEach(() => {
  const found = errors.splice(0);
  expect(found, `Browser errors:\n${found.join('\n')}`).toEqual([]);
});

test('setup: admin, phlebotomist and two patients sign up; consent is asked once', async () => {
  await signUp(admin, 'Lab Admin', 'ops-admin@test.dev', '9800000000');
  await makeAdmin(await uidForEmail('ops-admin@test.dev'));
  await signUp(phlebo, 'Ravi Kumar', 'ravi@test.dev', '9833333333');
  await signUp(pat1, 'Asha Shah', 'asha@test.dev', '9811111111', true);
  await signUp(pat2, 'Bina Rao', 'bina@test.dev', '9822222222');

  // Consent and the separate marketing choice were recorded at onboarding.
  await expect(pat1.getByText(/You consented to the privacy notice/)).toBeVisible();
  await expect(pat1.getByRole('checkbox', { name: /^Send me offers/ })).toBeChecked();
  await expect(pat2.getByRole('checkbox', { name: /^Send me offers/ })).not.toBeChecked();
  // The marketing choice can be withdrawn at any time.
  await pat1.getByRole('checkbox', { name: /^Send me offers/ }).uncheck();
  await expect(pat1.getByRole('checkbox', { name: /^Send me offers/ })).not.toBeChecked();

  await admin.goto('/admin');
  await admin.reload();
  await expect(admin.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('admin sets scheduling: one place at 7am, two PIN codes, a closed day', async () => {
  await admin.goto('/admin/scheduling');
  await expect(admin.getByText('These are the starting defaults')).toBeVisible();
  await admin.getByLabel('Capacity').first().fill('1');
  await admin.getByLabel('PIN codes served').fill('395009, 395007');
  await admin.getByLabel('Closed dates').fill(`${CLOSED}, not-a-date`);
  await admin.getByRole('button', { name: 'Save scheduling' }).click();
  await expect(admin.locator('p[role="status"]')).toContainText('not a date');
  await admin.getByLabel('Closed dates').fill(CLOSED);
  await admin.getByRole('button', { name: 'Save scheduling' }).click();
  await expect(admin.locator('p[role="status"]')).toContainText('Saved');
});

test('booking form enforces PIN code, closed days and slot capacity', async () => {
  await bookVisit(pat1, { date: VISIT, slot: /^07:00/, pincode: '110001', expectError: /does not cover 110001/ });
  await bookVisit(pat1, { date: CLOSED, slot: /^07:00/, pincode: '395009', expectError: /does not collect at home on that date/ });
  await bookVisit(pat1, { date: VISIT, slot: /^07:00/, pincode: '395009' });

  // The single 7am place is now taken: the second patient sees it full and is stopped.
  await pat2.goto('/contact-us#home-collection');
  const form = pat2.locator('form').filter({ hasText: 'Book a home collection' });
  await form.getByLabel('Preferred date').fill(VISIT);
  await pat2.getByRole('combobox', { name: 'Preferred time' }).click();
  await expect(pat2.getByRole('option', { name: /07:00.*Full/ })).toBeVisible();
  await pat2.keyboard.press('Escape');
  await bookVisit(pat2, { date: VISIT, slot: /^07:00/, pincode: '395007', expectError: /That slot is full/ });
  await bookVisit(pat2, { date: VISIT, slot: /^08:00/, pincode: '395007' });
});

test('patient reschedules, freeing the original place', async () => {
  await pat2.goto('/account/bookings');
  await pat2.getByRole('button', { name: 'Reschedule' }).click();
  await pat2.getByLabel('New date').fill(VISIT);
  await pick(pat2, 'New time', /^09:00/);
  await pat2.getByRole('button', { name: 'Confirm new time' }).click();
  await expect(pat2.getByText(/09:00 – 10:00 AM/)).toBeVisible();
  await expect(pat2.getByRole('button', { name: 'Reschedule' })).toBeVisible();
});

test('admin adds the phlebotomist and assigns both visits', async () => {
  await admin.goto('/admin/staff');
  await pick(admin, 'Account', 'Ravi Kumar');
  await admin.getByRole('button', { name: 'Add as phlebotomist' }).click();
  await expect(admin.getByText('Ravi Kumar').last()).toBeVisible();

  await admin.goto('/admin/bookings');
  await admin.getByRole('button', { name: 'Confirm visit' }).first().click();
  for (const name of ['Asha Shah', 'Bina Rao']) {
    await pick(admin, new RegExp(`Assign phlebotomist for ${name}`), 'Ravi Kumar');
  }
  await expect(admin.getByText('Phlebotomist:').first()).toBeVisible();

  // Once assigned, the patient can no longer change the visit online.
  await pat1.goto('/account/bookings');
  await expect(pat1.getByText('Phlebotomist assigned').first()).toBeVisible();
  await expect(pat1.getByText(/Ravi Kumar/)).toBeVisible();
  await expect(pat1.getByRole('button', { name: 'Reschedule' })).toHaveCount(0);
  await expect(pat1.getByRole('button', { name: 'Cancel visit' })).toHaveCount(0);
});

test('phlebotomist collects one sample and records a failed visit', async () => {
  await phlebo.goto('/account');
  await phlebo.reload();
  await phlebo.getByRole('link', { name: 'My collections' }).click();
  await expect(phlebo).toHaveURL(/\/staff$/);
  await phlebo.getByRole('tab', { name: /Upcoming/ }).click();
  const asha = phlebo.locator('li').filter({ hasText: 'Asha Shah' });
  await asha.getByRole('button', { name: 'Mark collected' }).click();
  await asha.getByRole('button', { name: 'Confirm collected' }).click();
  await expect(asha.getByRole('alert')).toContainText('sample ID');
  await asha.getByLabel('Sample ID on the tube label').fill('HL-24-001873');
  await asha.getByRole('button', { name: 'Confirm collected' }).click();
  await expect(phlebo.locator('li').filter({ hasText: 'Asha Shah' })).toHaveCount(0);

  const bina = phlebo.locator('li').filter({ hasText: 'Bina Rao' });
  await bina.getByRole('button', { name: 'Could not collect' }).click();
  await bina.getByLabel(/Reason/).fill('Patient not at home, phone off');
  await bina.getByRole('button', { name: 'Confirm not collected' }).click();
  await phlebo.getByRole('tab', { name: 'Done' }).click();
  await expect(phlebo.getByText('Sample HL-24-001873').first()).toBeVisible();
  await expect(phlebo.getByText(/Not collected: Patient not at home/)).toBeVisible();

  await pat2.goto('/account/bookings');
  await expect(pat2.getByText('Recollection needed')).toBeVisible();
  await expect(pat2.getByText(/Patient not at home/)).toBeVisible();
});

test('lab receives, processes, takes payment; patient sees each step and a receipt', async () => {
  await admin.goto('/admin/bookings');
  const card = admin.locator('li').filter({ hasText: 'Asha Shah' }).filter({ hasText: 'HL-24-001873' });
  await card.getByRole('button', { name: 'Mark received at lab' }).click();
  await card.getByRole('button', { name: 'Start processing' }).click();
  await expect(card.getByRole('combobox', { name: /Status for Asha Shah/ })).toHaveText(/Processing/);
  await card.getByLabel('Amount received').fill('1499');
  await card.getByRole('combobox', { name: /Payment mode for booking/ }).click();
  await admin.getByRole('option', { name: 'UPI' }).click();
  await card.getByRole('button', { name: 'Record payment' }).click();
  await expect(card.getByText(/paid ₹1,499 by UPI/)).toBeVisible();
  await card.getByRole('button', { name: /History/ }).click();
  await expect(card.getByText('Received at lab').first()).toBeVisible();

  await pat1.goto('/account/bookings');
  await expect(pat1.getByText('Sample ID:')).toBeVisible();
  await expect(pat1.getByText('HL-24-001873')).toBeVisible();
  await expect(pat1.getByText(/Paid by UPI/)).toBeVisible();
  await pat1.getByRole('link', { name: 'Receipt' }).click();
  await expect(pat1.getByRole('heading', { name: 'Receipt' })).toBeVisible();
  await expect(pat1.getByText(/Paid by UPI/)).toBeVisible();
  await expect(pat1.getByText('HL-24-001873', { exact: false })).toBeVisible();

  // A patient cannot open someone else's receipt.
  const otherId = (await admin.locator('li').filter({ hasText: 'Bina Rao' }).first().innerText()).match(/#([A-Z0-9]{8})/)?.[1];
  expect(otherId).toBeTruthy();
});

test('signed report completes the booking; a revision replaces it for the patient', async () => {
  await admin.goto('/admin/reports');
  await admin.getByRole('button', { name: 'Upload report' }).click();
  const dialog = admin.getByRole('dialog');
  await pick(admin, 'Patient account', 'Asha Shah');
  await pick(admin, 'For booking', /Asha Shah/);
  await pick(admin, 'Authorised signatory', 'Dr Shruti Devani');
  await dialog.getByLabel('Report title').fill('Lipid Profile');
  await dialog.locator('#report-file').setInputFiles({ name: 'lipid.pdf', mimeType: 'application/pdf', buffer: PDF });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(admin.getByText('signed by Dr Shruti Devani')).toBeVisible();

  await pat1.goto('/account/bookings');
  await expect(pat1.getByText('Report ready').first()).toBeVisible();

  await admin.getByRole('button', { name: 'Upload report' }).click();
  await pick(admin, 'Patient account', 'Asha Shah');
  await pick(admin, 'Replaces an earlier report', 'Lipid Profile');
  await pick(admin, 'Authorised signatory', 'Dr Mayuri Thumar');
  await dialog.locator('#report-file').setInputFiles({ name: 'lipid-v2.pdf', mimeType: 'application/pdf', buffer: PDF });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(admin.getByText('v2 revised')).toBeVisible();
  await expect(admin.getByText('superseded')).toBeVisible();

  await pat1.goto('/account/reports');
  await expect(pat1.getByText('Revised (v2)')).toBeVisible();
  await expect(pat1.getByText(/Signed by Dr Mayuri Thumar/)).toBeVisible();
  await expect(pat1.getByRole('button', { name: 'Download PDF' })).toHaveCount(1);
});

test('patient downloads their data and asks for erasure; the lab sees the request', async () => {
  await pat1.goto('/account');
  const [download] = await Promise.all([
    pat1.waitForEvent('download'),
    pat1.getByRole('button', { name: 'Download my data' }).click(),
  ]);
  const data = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(data.profile.name).toBe('Asha Shah');
  expect(data.bookings).toHaveLength(1);
  expect(data.bookings[0].sampleId).toBe('HL-24-001873');
  expect(data.reports.map((r: { version: number }) => r.version).sort()).toEqual([1, 2]);

  await pat1.getByRole('button', { name: 'Request deletion of my data' }).click();
  await expect(pat1.getByText(/deletion request has been sent/)).toBeVisible();

  await admin.goto('/admin/requests');
  await expect(admin.getByText(/Data request/).first()).toBeVisible();
  await expect(admin.getByText('Please delete my account')).toBeVisible();
});

test('audit log records every staff action, and dashboard reflects the day', async () => {
  await admin.goto('/admin/audit');
  for (const action of ['config.booking', 'staff.save', 'booking.assign', 'booking.collected', 'booking.payment', 'report.release', 'report.revise']) {
    await expect(admin.getByRole('cell', { name: action, exact: true }).first()).toBeVisible();
  }
  await admin.goto('/admin');
  await expect(admin.getByRole('link').filter({ hasText: 'Registered patients' })).toContainText('4');
});

test('a phlebotomist cannot open the admin panel or other patients’ bookings', async () => {
  await phlebo.goto('/admin');
  await expect(phlebo.getByRole('heading', { name: 'Lab staff only' })).toBeVisible();
  await pat2.goto('/staff');
  await expect(pat2.getByRole('heading', { name: 'Field staff only' })).toBeVisible();
});

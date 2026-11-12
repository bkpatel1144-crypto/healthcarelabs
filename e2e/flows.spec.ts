/**
 * End-to-end journeys through the real UI, backed by the emulators.
 *
 * One patient (Alice) and one lab admin, each in their own browser context,
 * walk through every create / update / delete the site offers, and each side
 * checks it sees what the other did.
 */
import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { listRaw, makeAdmin, otpFor, resetEmulators, uidForEmail } from './emulator';
import { completeWelcome } from './helpers';

test.describe.configure({ mode: 'serial' });

const PATIENT = { name: 'Alice Patel', email: 'alice@test.dev', password: 'secret123', phone: '9876543210' };
const ADMIN = { name: 'Lab Admin', email: 'admin@test.dev', password: 'secret123' };

const tomorrow = () => {
  const d = new Date(Date.now() + 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** A tiny but valid PDF, so the download can be checked byte-for-byte. */
const PDF = Buffer.from(
  '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
);
/** 1×1 PNG. */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');

let patientCtx: BrowserContext;
let adminCtx: BrowserContext;
let patient: Page;
let admin: Page;
const errors: string[] = [];

async function newWatchedPage(browser: Browser): Promise<[BrowserContext, Page]> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // Map tiles and fonts are fetched from the internet; their failures are not app bugs.
    if (/tile\.openstreetmap|fonts\.g|net::ERR|Failed to load resource/.test(t)) return;
    errors.push(`console: ${t}`);
  });
  page.on('dialog', (d) => void d.accept());
  return [ctx, page];
}

async function pick(page: Page, combobox: string, option: string | RegExp) {
  await page.getByRole('combobox', { name: combobox }).click();
  await page.getByRole('option', { name: option }).first().click();
}

/** Email sign-up up to (not through) the first-sign-in step. */
async function signUp(page: Page, who: { name: string; email: string; password: string }) {
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Email' }).click();
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.getByLabel('Full name').fill(who.name);
  await page.getByLabel('Email').fill(who.email);
  await page.getByLabel('Password').fill(who.password);
  await page.getByRole('button', { name: 'Create account' }).click();
}

async function logIn(page: Page, who: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Email' }).click();
  await page.getByLabel('Email').fill(who.email);
  await page.getByLabel('Password').fill(who.password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
}

test.beforeAll(async ({ browser }) => {
  await resetEmulators();
  [patientCtx, patient] = await newWatchedPage(browser);
  [adminCtx, admin] = await newWatchedPage(browser);
});

test.afterAll(async () => {
  await patientCtx?.close();
  await adminCtx?.close();
});

test.afterEach(() => {
  const found = errors.splice(0);
  expect(found, `Browser errors:\n${found.join('\n')}`).toEqual([]);
});

/* ------------------------------------------------------------ access gates */

test('signed-out visitors are sent to login, with a way back', async () => {
  await patient.goto('/account/bookings');
  await expect(patient).toHaveURL(/\/login\?next=%2Faccount%2Fbookings/);
  await patient.goto('/admin');
  await expect(patient).toHaveURL(/\/login\?next=%2Fadmin/);
});

test('login form rejects bad input with readable messages', async () => {
  await patient.goto('/login');
  await patient.getByRole('button', { name: 'Send OTP' }).click();
  await expect(patient.getByRole('alert')).toContainText('valid 10-digit');
  await patient.getByLabel('Mobile number').fill('12345');
  await patient.getByRole('button', { name: 'Send OTP' }).click();
  await expect(patient.getByRole('alert')).toContainText('valid 10-digit');

  await patient.getByRole('tab', { name: 'Email' }).click();
  await patient.getByLabel('Email').fill('not-an-email');
  await patient.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(patient.getByRole('alert')).toContainText('valid email');
  await patient.getByLabel('Email').fill('nobody@test.dev');
  await patient.getByLabel('Password').fill('123');
  await patient.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(patient.getByRole('alert')).toContainText('at least 6');
  await patient.getByLabel('Password').fill('wrongpass');
  await patient.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(patient.getByRole('alert')).toContainText(/incorrect|No account/);
});

/* ----------------------------------------------------------------- patient */

test('first sign-in: complete-your-profile step asks only for what is missing', async () => {
  await signUp(patient, PATIENT);
  await expect(patient).toHaveURL(/\/account\/welcome/);
  // What sign-up already knows is filled in.
  await expect(patient.getByLabel('Full name')).toHaveValue(PATIENT.name);
  await expect(patient.getByLabel('Email')).toHaveValue(PATIENT.email);
  // Everything booking needs is required, consent included.
  await patient.getByRole('button', { name: 'Save and continue' }).click();
  await expect(patient.getByText(/valid 10-digit mobile number/)).toBeVisible();
  await expect(patient.getByText(/reference ranges on reports depend on it/)).toBeVisible();
  await expect(patient.getByText(/reference ranges depend on age/)).toBeVisible();
  await expect(patient.getByText(/Consent is needed/)).toBeVisible();
  await completeWelcome(patient, { phone: PATIENT.phone });
  await expect(patient).toHaveURL(/\/account$/);
  await expect(patient.getByRole('definition').filter({ hasText: PATIENT.name })).toBeVisible();
  await expect(patient.getByText(/You consented to the privacy notice/)).toBeVisible();
  // Signing in again does not ask twice.
  await patient.goto('/login');
  await expect(patient).toHaveURL(/\/account$/);
});

test('signing up twice with the same email is refused', async ({ browser }) => {
  const [ctx, page] = await newWatchedPage(browser);
  await signUp(page, PATIENT);
  await expect(page.getByRole('alert')).toContainText('already uses that email');
  await ctx.close();
});

test('profile: validation, save, edit', async () => {
  await patient.goto('/account');
  await patient.getByRole('button', { name: 'Edit' }).click().catch(() => {});
  await patient.getByLabel('Full name').fill('A');
  await patient.getByLabel('Mobile number').fill('12345');
  await patient.getByRole('button', { name: 'Save profile' }).click();
  await expect(patient.getByText('Enter your full name.')).toBeVisible();
  await expect(patient.getByText('valid 10-digit')).toBeVisible();

  await patient.getByLabel('Full name').fill(PATIENT.name);
  await patient.getByLabel('Mobile number').fill(PATIENT.phone);
  await pick(patient, 'Gender', 'Female');
  await patient.getByLabel('Date of birth').fill('1990-04-12');
  await patient.getByRole('button', { name: 'Save profile' }).click();
  await expect(patient.getByRole('definition').filter({ hasText: `+91 ${PATIENT.phone}` })).toBeVisible();
  await expect(patient.getByText(/Female · \d+ years/)).toBeVisible();

  await patient.getByRole('button', { name: 'Edit' }).click();
  await patient.getByLabel('Full name').fill('Alice R. Patel');
  await patient.getByRole('button', { name: 'Save profile' }).click();
  await expect(patient.getByText('Alice R. Patel').first()).toBeVisible();
  await patient.getByRole('button', { name: 'Edit' }).click();
  await patient.getByLabel('Full name').fill(PATIENT.name);
  await patient.getByRole('button', { name: 'Save profile' }).click();
  await expect(patient.getByRole('button', { name: 'Edit' })).toBeVisible();
});

test('family members: add, validate, edit, delete', async () => {
  await patient.goto('/account/family');
  await patient.getByRole('button', { name: 'Add member' }).click();
  await patient.getByRole('button', { name: 'Save' }).click();
  await expect(patient.getByRole('alert')).toContainText('full name');
  await patient.getByLabel('Full name').fill('Kiran Patel');
  await patient.getByRole('button', { name: 'Save' }).click();
  await expect(patient.getByRole('alert')).toContainText('related');
  await pick(patient, 'Relation', 'Mother');
  await pick(patient, 'Gender', 'Female');
  await patient.getByLabel('Date of birth').fill('1962-02-01');
  await patient.getByRole('button', { name: 'Save' }).click();
  await expect(patient.getByText('Kiran Patel')).toBeVisible();

  await patient.getByRole('button', { name: 'Add member' }).click();
  await patient.getByLabel('Full name').fill('Temp Person');
  await pick(patient, 'Relation', 'Brother');
  await patient.getByRole('button', { name: 'Save' }).click();
  await expect(patient.getByText('Temp Person')).toBeVisible();

  await patient.getByRole('button', { name: 'Edit Temp Person' }).click();
  await patient.getByLabel('Full name').fill('Temp Renamed');
  await patient.getByRole('button', { name: 'Save' }).click();
  await expect(patient.getByText('Temp Renamed')).toBeVisible();
  await patient.getByRole('button', { name: 'Delete Temp Renamed' }).click();
  await expect(patient.getByText('Temp Renamed')).toHaveCount(0);
  await expect(patient.getByText('Kiran Patel')).toBeVisible();
});

test('addresses: add, validate, edit, delete', async () => {
  await patient.goto('/account/addresses');
  await patient.getByRole('button', { name: 'Add address' }).click();
  await patient.getByLabel('House no., street, area').fill('short');
  await patient.getByRole('button', { name: 'Save' }).click();
  await expect(patient.getByRole('alert')).toContainText('house number');
  await patient.getByLabel('House no., street, area').fill('12 Rose Villa, Adajan Gam');
  await patient.getByLabel('City').fill('Surat');
  await patient.getByLabel('PIN code').fill('3950');
  await patient.getByRole('button', { name: 'Save' }).click();
  await expect(patient.getByRole('alert')).toContainText('6-digit');
  await patient.getByLabel('PIN code').fill('395009');
  await patient.getByRole('button', { name: 'Save' }).click();
  await expect(patient.getByText('12 Rose Villa, Adajan Gam, Surat, 395009')).toBeVisible();

  await patient.getByRole('button', { name: 'Add address' }).click();
  await pick(patient, 'Save as', 'Office');
  await patient.getByLabel('House no., street, area').fill('5th floor, Tech Park, Vesu');
  await patient.getByLabel('City').fill('Surat');
  await patient.getByLabel('PIN code').fill('395007');
  await patient.getByRole('button', { name: 'Save' }).click();
  await patient.getByRole('button', { name: 'Edit Office' }).click();
  await patient.getByLabel('Landmark').fill('Near VR Mall');
  await patient.getByRole('button', { name: 'Save' }).click();
  await expect(patient.getByText(/Near VR Mall/)).toBeVisible();
  await patient.getByRole('button', { name: 'Delete Office' }).click();
  await expect(patient.getByText(/Tech Park/)).toHaveCount(0);
});

test('booking while logged in: plan, family member, saved address', async () => {
  await patient.goto('/health-package');
  await patient.getByRole('button', { name: 'Add to visit' }).first().click();
  await patient.getByRole('button', { name: 'Add to visit' }).first().click();
  await patient.goto('/contact-us#home-collection');
  const form = patient.locator('form').filter({ hasText: 'Book a home collection' });
  await expect(form.getByText('Booking for your planned visit')).toBeVisible();

  // Profile details are prefilled…
  await expect(form.getByLabel('Phone number')).toHaveValue(PATIENT.phone);
  await expect(form.getByLabel('Full name')).toHaveValue(PATIENT.name);
  // …and a field the patient clears stays cleared (regression: it used to refill).
  await form.getByLabel('Full name').fill('');
  await form.getByRole('button', { name: 'Request home collection' }).click();
  await expect(form.getByText('Please tell us your name.')).toBeVisible();
  await expect(form.getByText('Choose a preferred date.')).toBeVisible();
  await expect(form.getByLabel('Full name')).toHaveValue('');

  // A typed past date is refused even though the picker would not offer it.
  await form.getByLabel('Preferred date').fill('2020-01-01');
  await form.getByRole('button', { name: 'Request home collection' }).click();
  await expect(form.getByText('Choose today or a later date.')).toBeVisible();

  await form.getByRole('button', { name: 'Kiran Patel' }).click();
  await expect(form.getByLabel('Full name')).toHaveValue('Kiran Patel');
  await expect(form.getByLabel('Phone number')).toHaveValue(PATIENT.phone);
  await form.getByRole('button', { name: 'Use Home address' }).click();
  await expect(form.getByLabel('Collection address')).toHaveValue('12 Rose Villa, Adajan Gam, Surat');
  await expect(form.getByLabel('PIN code')).toHaveValue('395009');
  // Consent is required before the booking is accepted.
  // Consent given at onboarding carries over; unticking it blocks the booking.
  const consentBox = form.getByRole('checkbox', { name: /I agree to the/ });
  await expect(consentBox).toBeChecked();
  await consentBox.uncheck();
  await form.getByRole('button', { name: 'Request home collection' }).click();
  await expect(form.getByText('Please accept the privacy notice')).toBeVisible();
  await consentBox.check();
  await form.getByLabel('Preferred date').fill(tomorrow());
  await pick(patient, 'Preferred time', /^07:00/);
  await form.getByRole('button', { name: 'Request home collection' }).click();
  await expect(patient.getByText('Request received, Kiran.')).toBeVisible();
  await expect(patient.getByRole('link', { name: 'My bookings' })).toBeVisible();

  // The visit plan was handed over and cleared.
  await expect(patient.getByRole('button', { name: 'Your visit plan is empty' })).toBeVisible();
});

test('second booking, then the patient cancels it', async () => {
  // Still on the success screen from the last test; start a fresh request.
  await patient.getByRole('button', { name: 'Book another visit' }).click();
  const form = patient.locator('form').filter({ hasText: 'Book a home collection' });
  // The reset form keeps the patient's own details.
  await expect(form.getByLabel('Full name')).toHaveValue(PATIENT.name);
  await pick(patient, 'Package or test', /Basic Health/i);
  await form.getByRole('button', { name: 'Use Home address' }).click();
  await form.getByLabel('Preferred date').fill(tomorrow());
  await pick(patient, 'Preferred time', /^04:00/);
  // Consent was recorded on the account with the first booking.
  await expect(form.getByRole('checkbox', { name: /I agree to the/ })).toBeChecked();
  await form.getByRole('button', { name: 'Request home collection' }).click();
  await expect(patient.getByText(/Request received/)).toBeVisible();

  await patient.goto('/account/bookings');
  await expect(patient.locator('li').filter({ hasText: 'Booking #' })).toHaveCount(2);
  const second = patient.locator('li').filter({ hasText: /Basic Health/i }).filter({ hasText: 'Booking #' });
  await second.getByRole('button', { name: 'Cancel visit' }).click();
  await expect(second.getByText('Cancelled', { exact: true })).toBeVisible();
  await expect(second.getByText('This visit was cancelled.')).toBeVisible();
  await expect(second.getByRole('button', { name: 'Cancel visit' })).toHaveCount(0);
});

test('prescription upload, support and partnership requests', async () => {
  await patient.goto('/upload-prescription');
  await patient.getByRole('button', { name: 'Send prescription' }).click();
  await expect(patient.getByText('Attach a photo or PDF.')).toBeVisible();
  await patient.locator('input[type="file"]').setInputFiles({ name: 'rx.png', mimeType: 'image/png', buffer: PNG });
  await expect(patient.getByText('rx.png')).toBeVisible();
  await patient.getByRole('button', { name: 'Send prescription' }).click();
  await expect(patient.getByText('Prescription received.')).toBeVisible();

  await patient.goto('/help');
  await patient.getByRole('tab', { name: 'Reports' }).click();
  await expect(patient.getByText('Where do I find my report?')).toBeVisible();
  const support = patient.locator('#support-form form');
  await support.getByRole('button', { name: 'Send to support' }).click();
  await expect(support.getByText(/Choose a/)).toBeVisible();
  await pick(patient, 'What is it about?', 'Report');
  await support.getByLabel('Describe the problem').fill('My report from yesterday is not showing yet.');
  await support.getByRole('button', { name: 'Send to support' }).click();
  await expect(patient.getByText(/your request is with the team/)).toBeVisible();

  await patient.goto('/account/requests');
  await expect(patient.getByText('rx.png')).toBeVisible();
  await expect(patient.getByText('My report from yesterday')).toBeVisible();
});

/* ------------------------------------------------------------------- admin */

test('a normal account cannot use the admin panel', async () => {
  await signUp(admin, ADMIN);
  await completeWelcome(admin, { phone: '9700000000' });
  await expect(admin).toHaveURL(/\/account$/);
  await admin.goto('/admin');
  await expect(admin.getByRole('heading', { name: 'Lab staff only' })).toBeVisible();
});

test('admin: dashboard counts and booking management', async () => {
  await makeAdmin(await uidForEmail(ADMIN.email));
  await admin.goto('/admin');
  await admin.reload();
  await expect(admin.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  const tile = (label: string) => admin.getByRole('link').filter({ hasText: label });
  await expect(tile('Bookings to confirm')).toContainText('1');
  await expect(tile('Prescriptions to quote')).toContainText('1');
  await expect(tile('Open requests')).toContainText('2');
  await expect(tile('Registered patients')).toContainText('2');

  await admin.goto('/admin/bookings');
  const card = admin.locator('li').filter({ hasText: 'Kiran Patel' }).filter({ hasText: 'registered patient' });
  await expect(card).toHaveCount(1);
  await pick(admin, 'Status for Kiran Patel', 'Confirmed');
  await card.getByLabel('Note shown to the patient').fill('Phlebotomist Ravi will arrive 7:15 AM');
  await card.getByRole('button', { name: 'Save note' }).click();
  await expect(card.getByRole('button', { name: 'Save note' })).toBeDisabled();

  // Filters: cancelled ones are hidden under "Open", visible under "All".
  await expect(admin.getByText('Basic Health', { exact: false })).toHaveCount(0);
  await pick(admin, 'Filter by status', 'All');
  await expect(admin.locator('li').filter({ hasText: 'Cancelled' }).first()).toBeVisible();
  await admin.getByPlaceholder(/Search name/).fill('nobody-matches-this');
  await expect(admin.getByText('No bookings match.')).toBeVisible();
});

test('admin: patients list and detail', async () => {
  await admin.goto('/admin/patients');
  await admin.getByRole('button', { name: `Open ${PATIENT.name}` }).click();
  const dialog = admin.getByRole('dialog');
  await expect(dialog.getByText('Family members (1)')).toBeVisible();
  await expect(dialog.getByText('Bookings (2)')).toBeVisible();
  await expect(dialog.getByText(`+91 ${PATIENT.phone}`)).toBeVisible();
  await admin.keyboard.press('Escape');
});

test('admin: upload a report, patient downloads it', async () => {
  await admin.goto('/admin/reports');
  await admin.getByRole('button', { name: 'Upload report' }).click();
  const dialog = admin.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('patient');
  await pick(admin, 'Patient account', PATIENT.name);
  await pick(admin, 'For booking', /Kiran Patel/);
  await expect(dialog.getByLabel('Name on report')).toHaveValue('Kiran Patel');
  await dialog.getByLabel('Report title').fill('Complete Blood Count');
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('authorised signatory');
  await pick(admin, 'Authorised signatory', 'Dr Mayuri Thumar');
  await dialog.locator('#report-file').setInputFiles({ name: 'cbc.pdf', mimeType: 'application/pdf', buffer: PDF });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(admin.getByText('Complete Blood Count')).toBeVisible();

  await patient.goto('/account/reports');
  await expect(patient.getByText('Complete Blood Count')).toBeVisible();
  const [download] = await Promise.all([
    patient.waitForEvent('download'),
    patient.getByRole('button', { name: 'Download PDF' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('cbc.pdf');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  expect(Buffer.concat(chunks).equals(PDF)).toBe(true);
});

test('admin: reply to the prescription, patient sees it', async () => {
  await admin.goto('/admin/requests');
  await admin.getByRole('tab', { name: /Prescriptions/ }).click();
  const card = admin.locator('li').filter({ hasText: 'Prescription' }).first();
  const [popup] = await Promise.all([
    admin.waitForEvent('popup'),
    card.getByRole('button', { name: /Open photo/ }).click(),
  ]);
  await popup.close();
  await card.getByLabel(/Reply/).fill('Tests: CBC and HbA1c. Total ₹650. We will call you to book.');
  await card.getByRole('button', { name: 'Save reply' }).click();
  await expect(card.getByRole('combobox')).toHaveText(/In progress/);

  await patient.goto('/account/requests');
  await expect(patient.getByText('Reply from the lab')).toBeVisible();
  await expect(patient.getByText(/Total ₹650/)).toBeVisible();
  await expect(patient.getByText('In progress')).toBeVisible();
});

test('patient sees the released report and the lab’s note on the booking', async () => {
  await patient.goto('/account/bookings');
  const card = patient.locator('li').filter({ hasText: 'Kiran Patel' }).filter({ hasText: 'Booking #' });
  // Releasing the linked report completed the booking.
  await expect(card.getByText('Report ready').first()).toBeVisible();
  await expect(card.getByRole('link', { name: 'View report' })).toBeVisible();
  await expect(card.getByText('Phlebotomist Ravi will arrive 7:15 AM')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Cancel visit' })).toHaveCount(0);
});

test('admin: resolve and delete requests, delete a report', async () => {
  await admin.goto('/admin/requests');
  const support = admin.locator('li').filter({ hasText: 'My report from yesterday' });
  await pick(admin, `Status of support request from ${PATIENT.name}`, 'Resolved');
  await expect(support).toHaveCount(0); // hidden once resolved
  await admin.getByLabel('Show resolved').check();
  await expect(admin.locator('li').filter({ hasText: 'My report from yesterday' })).toBeVisible();

  await admin.goto('/admin/reports');
  await admin.getByRole('button', { name: 'Delete Complete Blood Count' }).click();
  await admin.getByRole('button', { name: 'Yes, do it' }).click();
  await expect(admin.getByText('No reports uploaded yet.')).toBeVisible();
  const chunks = await listRaw('reports');
  expect(chunks).toHaveLength(0);
});

/* ------------------------------------------------------------------- guest */

test('guest: contact, partnership and home-collection without logging in', async ({ browser }) => {
  const [ctx, page] = await newWatchedPage(browser);

  await page.goto('/contact-us');
  const contact = page.locator('form').filter({ has: page.getByLabel('Message') });
  await contact.getByRole('button', { name: 'Send message' }).click();
  await expect(contact.getByText('Please tell us your name.')).toBeVisible();
  // Fields stop at the limits the security rules enforce (regression: a long
  // name used to pass the form and fail on the server with a vague error).
  await contact.getByLabel('Full name').pressSequentially('x'.repeat(130), { delay: 0 });
  await expect(contact.getByLabel('Full name')).toHaveValue('x'.repeat(100));
  await contact.getByLabel('Full name').fill('Guest Visitor');
  await contact.getByLabel('Phone number').fill('9123456789');
  await contact.getByLabel('Message').fill('Do you do home collection in Vesu on Sundays?');
  await contact.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('your message has reached the lab')).toBeVisible();

  await page.goto('/partner-with-us');
  await page.getByLabel('Full name').fill('Corporate HR');
  await page.getByLabel('Mobile number').fill('9000000001');
  await pick(page, 'Type of partnership', 'Corporate health check-ups');
  await page.getByLabel('Tell us about it').fill('We have 250 employees in Surat and need annual check-ups.');
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page.getByText('Enquiry received.')).toBeVisible();

  await page.goto('/upload-prescription');
  await expect(page.getByText('Log in to upload')).toBeVisible();

  await page.goto('/contact-us#home-collection');
  const form = page.locator('form').filter({ hasText: 'Book a home collection' });
  await expect(form.getByRole('link', { name: 'Log in' })).toBeVisible();
  await form.getByLabel('Full name').fill('Guest Booker');
  await form.getByLabel('Phone number').fill('+91 91234 56780');
  await form.getByLabel('Preferred date').fill(tomorrow());
  await pick(page, 'Preferred time', /^08:00/);
  await form.getByLabel('Collection address').fill('44 Lake View, Piplod, Surat');
  await form.getByLabel('PIN code').fill('395007');
  await form.getByRole('checkbox', { name: /I agree to the/ }).check();
  await form.getByRole('button', { name: 'Request home collection' }).click();
  await expect(page.getByText('Request received, Guest.')).toBeVisible();

  const bookings = await listRaw('bookings');
  const guestBooking = bookings.find((b) => b.fields.patientName.stringValue === 'Guest Booker');
  expect(guestBooking?.fields.uid).toEqual({ nullValue: null });
  expect(guestBooking?.fields.phone.stringValue).toBe('9123456780');
  await ctx.close();
});

/* ---------------------------------------------------------------- OTP login */

test('mobile OTP: send, wrong code, right code, logout', async ({ browser }) => {
  const [ctx, page] = await newWatchedPage(browser);
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9988776655');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page.getByText('OTP sent to')).toBeVisible();
  await page.getByLabel('Enter OTP').fill('000000');
  await page.getByRole('button', { name: /Verify/ }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
  await page.getByLabel('Enter OTP').fill(await otpFor('+919988776655'));
  await page.getByRole('button', { name: /Verify/ }).click();
  // First OTP sign-in goes through "Complete your profile", with the
  // verified number filled in and locked.
  await expect(page).toHaveURL(/\/account\/welcome/);
  await expect(page.getByLabel('Mobile number')).toHaveValue('9988776655');
  await expect(page.getByLabel('Mobile number')).toHaveAttribute('readonly', '');
  await expect(page.getByText('Verified by OTP')).toBeVisible();
  await page.getByLabel('Full name').fill('Otp User');
  await completeWelcome(page);
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('Verified')).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login/);
  await ctx.close();
});

import { expect, type Page } from '@playwright/test';

export async function pick(page: Page, combobox: string | RegExp, option: string | RegExp) {
  await page.getByRole('combobox', { name: combobox }).first().click();
  await page.getByRole('option', { name: option }).first().click();
}

/** Fills the "Complete your profile" step that follows a first sign-in. */
export async function completeWelcome(
  page: Page,
  details: { phone?: string; gender?: 'Male' | 'Female' | 'Other'; dob?: string; marketing?: boolean } = {},
) {
  await expect(page).toHaveURL(/\/account\/welcome/);
  await expect(page.getByRole('heading', { name: 'Complete your profile' })).toBeVisible();
  // The name typed at sign-up arrives a moment after the page opens.
  await expect(page.getByLabel('Full name')).not.toHaveValue('');
  const phone = page.getByLabel('Mobile number');
  if (details.phone && !(await phone.getAttribute('readonly'))) await phone.fill(details.phone);
  await pick(page, 'Gender', details.gender ?? 'Female');
  await page.getByLabel('Date of birth').fill(details.dob ?? '1990-04-12');
  await page.getByRole('checkbox', { name: /I agree to the/ }).check();
  if (details.marketing) await page.getByRole('checkbox', { name: /offers and health check reminders/ }).check();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page).not.toHaveURL(/\/account\/welcome/);
}

/** Email sign-up straight through onboarding. */
export async function signUp(page: Page, who: { name: string; email: string; phone: string; password?: string }) {
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Email' }).click();
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.getByLabel('Full name').fill(who.name);
  await page.getByLabel('Email').fill(who.email);
  await page.getByLabel('Password').fill(who.password ?? 'secret123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await completeWelcome(page, { phone: who.phone });
}

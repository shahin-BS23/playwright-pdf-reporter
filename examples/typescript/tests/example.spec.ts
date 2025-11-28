import { test, expect } from '@playwright/test';

test.describe('Sample Storefront Smoke', () => {
  test('loads homepage hero', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    await expect(page.getByRole('heading', { name: 'Playwright enables' })).toBeVisible();
  });

  test('has docs link', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    await page.getByRole('link', { name: 'Get started' }).click();
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  });
});


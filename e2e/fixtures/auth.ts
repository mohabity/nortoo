import { test as base, type Page } from "@playwright/test";

// Test user credentials (must exist in the DB or be created by global-setup)
const TEST_EMAIL = process.env.TEST_MERCHANT_EMAIL || "test@nortoo.ma";
const TEST_PASSWORD = process.env.TEST_MERCHANT_PASSWORD || "TestPassword123!";

/**
 * Login via the UI login form.
 */
async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByLabel(/mot de passe|password/i).fill(password);
  await page.getByRole("button", { name: /connexion|sign in|se connecter/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard**", { timeout: 15_000 });
}

/**
 * Extended test fixture with an authenticated page.
 * Logs in once and reuses the session for all tests in the file.
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await loginViaUI(page, TEST_EMAIL, TEST_PASSWORD);
    await use(page);
  },
});

export { expect } from "@playwright/test";
export { TEST_EMAIL, TEST_PASSWORD };

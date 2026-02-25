import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads with form fields", async ({ page }) => {
    await page.goto("/login");

    // Verify login form is present
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByLabel(/mot de passe|password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /connexion|sign in|se connecter/i })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("textbox", { name: /email/i }).fill("wrong@email.com");
    await page.getByLabel(/mot de passe|password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /connexion|sign in|se connecter/i }).click();

    // Should show an error message (stays on login page)
    await expect(page).toHaveURL(/\/login/);
    // Error text should appear
    await expect(page.locator("[role='alert'], .text-rose, .text-red-500, p:has-text('erreur'), p:has-text('error'), p:has-text('incorrect')").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("register page loads with form fields", async ({ page }) => {
    await page.goto("/register");

    // Verify register form fields
    await expect(page.getByRole("textbox", { name: /nom|name/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /créer|register|s'inscrire/i })).toBeVisible();
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /réinitialiser|reset|envoyer/i })).toBeVisible();
  });

  test("login redirects to dashboard on success", async ({ page }) => {
    const email = process.env.TEST_MERCHANT_EMAIL;
    const password = process.env.TEST_MERCHANT_PASSWORD;

    // Skip if no test credentials configured
    test.skip(!email || !password, "Test credentials not configured");

    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill(email!);
    await page.getByLabel(/mot de passe|password/i).fill(password!);
    await page.getByRole("button", { name: /connexion|sign in|se connecter/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });
});

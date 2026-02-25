import { test, expect } from "./fixtures/auth";

test.describe("Settings Page", () => {
  test("settings page loads with tabs", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Tab navigation should be visible
    const profileTab = page.getByRole("button", { name: /profil|profile/i }).first();
    await expect(profileTab).toBeVisible({ timeout: 10_000 });
  });

  test("can navigate between tabs", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Click Scoring tab
    const scoringTab = page.getByRole("button", { name: /scoring/i }).first();
    await scoringTab.click();

    // Scoring content should appear (threshold sliders or inputs)
    await expect(page.locator("text=/seuil|threshold|verify|flag|block/i").first()).toBeVisible({
      timeout: 5_000,
    });

    // Click API tab
    const apiTab = page.getByRole("button", { name: /api/i }).first();
    await apiTab.click();

    // API key section should appear
    await expect(page.locator("text=/clé api|api key|nt_live_|cp_live_/i").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("team tab shows team management", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Click Team tab
    const teamTab = page.getByRole("button", { name: /équipe|team/i }).first();
    await teamTab.click();

    // Should show team members or invite button
    await expect(page.locator("text=/inviter|invite|membre|member/i").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("privacy tab shows retention settings", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Click Privacy tab
    const privacyTab = page.getByRole("button", { name: /confidentialité|privacy/i }).first();
    await privacyTab.click();

    // Should show data retention settings
    await expect(page.locator("text=/rétention|retention|données|data|09-08/i").first()).toBeVisible({
      timeout: 5_000,
    });
  });
});

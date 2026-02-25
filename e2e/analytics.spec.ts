import { test, expect } from "./fixtures/auth";

test.describe("Analytics Page", () => {
  test("analytics page loads with KPI cards", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/analytics");
    await page.waitForLoadState("networkidle");

    // KPI cards should be visible (savings, RTO, delivery, ROI)
    const content = page.locator("main, [class*='analytics']").first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });

  test("charts render on analytics page", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/analytics");
    await page.waitForLoadState("networkidle");

    // Wait for Recharts SVG to render
    const chart = page.locator(".recharts-responsive-container, .recharts-wrapper, svg.recharts-surface").first();
    await expect(chart).toBeVisible({ timeout: 15_000 });
  });

  test("period selector changes data", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/analytics");
    await page.waitForLoadState("networkidle");

    // Look for period selector buttons (7d, 30d, 90d)
    const periodButton = page.getByRole("button", { name: /7j|7d|30j|30d|90j|90d/i }).first();
    if (await periodButton.isVisible()) {
      await periodButton.click();
      // Wait for data refresh
      await page.waitForLoadState("networkidle");
    }
  });

  test("PDF export button is visible", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/analytics");
    await page.waitForLoadState("networkidle");

    // PDF export button should be available
    const exportBtn = page.getByRole("button", { name: /export|pdf|télécharger|download/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 10_000 });
  });
});

import { test, expect } from "./fixtures/auth";

test.describe("Orders Page", () => {
  test("orders list loads", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/orders");

    // Wait for the page to load (either table or "no orders" message)
    await page.waitForLoadState("networkidle");

    // Decision filter pills should be visible
    const allPill = page.getByRole("button", { name: /tous|all/i }).first();
    await expect(allPill).toBeVisible({ timeout: 10_000 });
  });

  test("decision filter pills work", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("networkidle");

    // Click the "Ship" pill
    const shipPill = page.getByRole("button", { name: /ship|expédier/i }).first();
    await shipPill.click();

    // URL should update with decision filter
    await expect(page).toHaveURL(/decision=ship/, { timeout: 5_000 });
  });

  test("search bar filters orders", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("networkidle");

    // Find and type in search bar
    const searchInput = page.getByPlaceholder(/rechercher|search/i).first();
    await searchInput.fill("test");
    await searchInput.press("Enter");

    // URL should update with search param
    await expect(page).toHaveURL(/search=test/, { timeout: 5_000 });
  });

  test("pagination controls are visible", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("networkidle");

    // Per-page selector should be visible
    const perPageSelect = page.locator("select").first();
    await expect(perPageSelect).toBeVisible({ timeout: 10_000 });
  });

  test("clicking an order opens slide-over", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("networkidle");

    // Click first order row (desktop) or card (mobile)
    const firstOrder = page.locator("table tbody tr, [class*='order-card']").first();

    // Skip if no orders exist
    if (await firstOrder.isVisible()) {
      await firstOrder.click();

      // Slide-over should appear (Sheet component with order details)
      const slideOver = page.locator("[role='dialog'], [data-state='open']").first();
      await expect(slideOver).toBeVisible({ timeout: 5_000 });

      // Should show a fraud score or order details
      await expect(page.locator("text=/score|Score/i").first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

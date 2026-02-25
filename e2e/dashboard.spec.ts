import { test, expect } from "./fixtures/auth";

test.describe("Dashboard Overview", () => {
  test("displays KPI cards", async ({ authenticatedPage: page }) => {
    // Dashboard should be loaded after auth
    await expect(page).toHaveURL(/\/dashboard/);

    // KPI cards should be visible (look for common KPI card elements)
    // The dashboard has 4 KPI cards in a horizontal scroll / grid
    const kpiCards = page.locator("[data-testid='kpi-card'], .snap-start").first();
    await expect(kpiCards).toBeVisible({ timeout: 10_000 });
  });

  test("displays chart area", async ({ authenticatedPage: page }) => {
    // Chart should render (Recharts creates SVG or canvas)
    const chartContainer = page.locator(".recharts-responsive-container, .recharts-wrapper, svg.recharts-surface").first();
    await expect(chartContainer).toBeVisible({ timeout: 15_000 });
  });

  test("displays recent orders", async ({ authenticatedPage: page }) => {
    // Wait for orders to load — either table rows or order cards
    const ordersContainer = page.locator("table, [class*='order-card'], [class*='OrderCard']").first();
    await expect(ordersContainer).toBeVisible({ timeout: 15_000 });
  });

  test("navigation works — sidebar links on desktop", async ({ authenticatedPage: page }) => {
    // Click on Orders in sidebar/nav
    const ordersLink = page.getByRole("link", { name: /commandes|orders/i }).first();
    await ordersLink.click();
    await expect(page).toHaveURL(/\/dashboard\/orders/, { timeout: 10_000 });

    // Navigate to Analytics
    const analyticsLink = page.getByRole("link", { name: /analytics|analytique/i }).first();
    await analyticsLink.click();
    await expect(page).toHaveURL(/\/dashboard\/analytics/, { timeout: 10_000 });

    // Navigate to Settings
    const settingsLink = page.getByRole("link", { name: /paramètres|settings|réglages/i }).first();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/dashboard\/settings/, { timeout: 10_000 });

    // Navigate back to Dashboard
    const dashboardLink = page.getByRole("link", { name: /tableau de bord|dashboard|accueil/i }).first();
    await dashboardLink.click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  });
});

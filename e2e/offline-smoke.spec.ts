import { test, expect } from "@playwright/test";

test.describe("Offline smoke", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /bon retour parmi nous/i })).toBeVisible();
  });

  test("sync page responds", async ({ page }) => {
    const response = await page.goto("/dashboard/sync");
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/dashboard\/sync/);
    await expect(
      page.getByText(/Synchronisation|mode hors ligne|Chargement/i)
    ).toBeVisible({ timeout: 15_000 });
  });
});

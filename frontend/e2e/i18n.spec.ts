import { test, expect } from "@playwright/test";

/**
 * i18n URL-routing E2E — /:lang segments drive the UI language.
 * No backend needed: the login page renders before any API call.
 */

test.describe("Language routing", () => {
  test("/fr/login renders the app in French", async ({ page }) => {
    await page.goto("/fr/login");
    await expect(page).toHaveURL(/\/fr\/login/);
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Mot de passe")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Se connecter/ }),
    ).toBeVisible();
  });

  test("/en/login renders the app in English", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page).toHaveURL(/\/en\/login/);
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/ })).toBeVisible();
  });

  test("legacy /login redirects to /fr/login (default language)", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/fr\/login/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Connexion" }),
    ).toBeVisible();
  });

  test("legacy path preserves the rest of the URL (/catalog → /fr/catalog/…)", async ({
    page,
  }) => {
    await page.goto("/catalog/articles");
    await expect(page).toHaveURL(/\/fr\/catalog\/articles/, {
      timeout: 10_000,
    });
  });

  test("unknown language segment redirects to /fr", async ({ page }) => {
    await page.goto("/de/login");
    await expect(page).toHaveURL(/\/fr\/login/, { timeout: 10_000 });
  });

  test('root "/" redirects to the default language', async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(fr|en)/, { timeout: 10_000 });
  });

  test("the header switcher flips FR → EN on the same path", async ({
    page,
  }) => {
    await page.goto("/fr/login");
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible({
      timeout: 10_000,
    });

    // Open the language dropdown and pick English.
    await page
      .getByRole("button", { name: /Changer de langue|langue/i })
      .first()
      .click();
    await page.getByRole("button", { name: /English/ }).click();

    await expect(page).toHaveURL(/\/en\/login/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("button", { name: /Se connecter/ }),
    ).toHaveCount(0);
  });
});

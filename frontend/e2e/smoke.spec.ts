import { test, expect, type Page } from "@playwright/test";

/**
 * E2E smoke suite — exercises the full communication loop with a mocked
 * backend: axios request → route handler → response → UI state.
 * A real backend is not needed; the request/response contract asserted here
 * mirrors swagger.json exactly (login payload {login, motDePasse}, /auth/me
 * bootstrap, French list endpoints returning bare arrays).
 */

const FAKE_JWT = "e2e-header.e2e-payload.e2e-signature";

const MOCK_USER = {
  id: 1,
  nom: "Dupont",
  prenom: "Marie",
  login: "marie.dupont",
  role: "ADMIN",
  entrepriseId: 1,
  mail: "marie@sgs.fr",
  numTel: "0102030405",
};

/** Mock every endpoint the shell + pages touch after login.
 *
 * The app calls the API SAME-ORIGIN (VITE_API_URL=/api, dev-proxied to
 * localhost:8081), so mocks intercept http://localhost:5173/api/...
 * IMPORTANT: anchor the pattern to the origin plus the /api prefix. A broad
 * glob (star-star-slash-api-slash-star-star) also matches the Vite dev
 * server's own module URLs (e.g. /src/api/client.ts), serving JSON instead
 * of JS and preventing the app from ever booting.
 */
const API_ORIGIN = "http://localhost:5173";

async function mockBackend(page: Page) {
  await page.route(`${API_ORIGIN}/api/**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path.endsWith("/api/auth/login") && method === "POST") {
      const body = route.request().postDataJSON() as {
        login?: string;
        motDePasse?: string;
      };
      // Contract assertion: the login payload must use the French field names.
      expect(body).toHaveProperty("login");
      expect(body).toHaveProperty("motDePasse");
      if (body.motDePasse === "wrong") {
        return route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ message: "Identifiants invalides" }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ token: FAKE_JWT, user: MOCK_USER }),
      });
    }

    if (path.endsWith("/api/auth/me")) {
      const auth = route.request().headers()["authorization"];
      if (auth !== `Bearer ${FAKE_JWT}`) {
        return route.fulfill({
          status: 401,
          contentType: "application/json",
          body: "{}",
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    }

    if (path.endsWith("/api/dashboard/kpis")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          valeurStock: 152000.5,
          nbArticlesEnAlerte: 3,
          nbCommandesClientEnCours: 7,
          nbCommandesFournisseurEnAttente: 2,
          nbVentesDuMois: 41,
          chiffreAffairesDuMois: 84210.75,
        }),
      });
    }

    if (path.endsWith("/api/categories")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: 1, code: "CAT-1", designation: "Outillage" },
        ]),
      });
    }
    if (path.endsWith("/api/articles")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: 10,
            codeArticle: "ART-1",
            designation: "Clé à molette",
            prixUnitaireHt: 20,
            tauxTva: 0.2,
            stockActuel: 12,
            seuilMin: 3,
            categorie: { id: 1, designation: "Outillage" },
          },
        ]),
      });
    }
    if (path.endsWith("/api/clients")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: 20, nom: "Martin", prenom: "Luc" }]),
      });
    }
    if (path.endsWith("/api/fournisseurs")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
    if (path.endsWith("/api/commandes-client")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
    if (path.endsWith("/api/commandes-fournisseur")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
    if (path.endsWith("/api/notifications")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            type: "STOCK_BAS",
            message: "Clé à molette sous le seuil",
            articleId: 10,
            articleDesignation: "Clé à molette",
          },
        ]),
      });
    }
    if (path.includes("/api/stock/")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
    if (path.endsWith("/api/utilisateurs")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
    if (path.endsWith("/api/entreprises")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
    if (path.includes("/api/mouvements-stock")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

test.beforeEach(async ({ context }) => {
  // Strip storage so each test starts logged-out.
  await context.clearCookies();
});

test.describe("Authentication loop", () => {
  test("shows inline error on invalid credentials (403 → banner)", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/login");

    await page
      .getByLabel(/login|identifiant/i)
      .first()
      .fill("marie.dupont");
    // Role query: the eye toggle button's aria-label also contains "mot de passe".
    await page.getByRole("textbox", { name: /^Mot de passe$/ }).fill("wrong");
    await page.getByRole("button", { name: /connexion|se connecter/i }).click();

    // The specific backend error message must surface in the inline banner.
    await expect(page.getByText("Identifiants invalides")).toBeVisible({
      timeout: 10_000,
    });
    // No token must be stored on failure.
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token"),
    );
    expect(token).toBeNull();
  });

  test("login → dashboard renders KPIs from the mapped response", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/login");

    await page
      .getByLabel(/login|identifiant/i)
      .first()
      .fill("marie.dupont");
    await page.getByRole("textbox", { name: /^Mot de passe$/ }).fill("s3cret");
    await page.getByRole("button", { name: /connexion|se connecter/i }).click();

    // Redirected into the app shell.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // KPI values come from DashboardKpisDTO via the mapper (CA = 84 210,75 €).
    await expect(page.getByText("CA ce mois-ci")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("body")).toContainText("84");

    // Token persisted as the single auth source.
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token"),
    );
    expect(token).toBe(FAKE_JWT);
  });
});

test.describe("Navigation & guarding", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await mockBackend(page);
    // /auth/me returns 401 with no token → login.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("unknown route shows the branded 404 (no silent redirect)", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/login");
    await page.evaluate(
      (token) => localStorage.setItem("access_token", token),
      FAKE_JWT,
    );
    // Seed the persisted user so the shell hydrates instantly.
    await page.evaluate((user) => {
      localStorage.setItem(
        "user",
        JSON.stringify({ state: { user }, version: 0 }),
      );
    }, MOCK_USER);

    await page.goto("/definitely-not-a-route");
    await expect(page.getByText("Page introuvable")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("sidebar renders grouped navigation after login", async ({ page }) => {
    await mockBackend(page);
    await page.goto("/login");
    await page.evaluate(
      (token) => localStorage.setItem("access_token", token),
      FAKE_JWT,
    );
    await page.evaluate((user) => {
      localStorage.setItem(
        "user",
        JSON.stringify({ state: { user }, version: 0 }),
      );
    }, MOCK_USER);

    await page.goto("/dashboard");
    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Catalogue")).toBeVisible();
    await expect(page.getByText("Transactions")).toBeVisible();
  });
});

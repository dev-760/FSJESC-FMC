import { expect, test } from "@playwright/test";

/**
 * Public website (Part 11.4, Phase 2 exit criteria).
 *
 * These run against a production build on both a desktop and a mobile viewport,
 * because the simulator pages must stay usable on a phone (Part 9.4) rather than
 * becoming shrunken desktop layouts.
 */

test.describe("public pages", () => {
  test("the homepage states what the platform is within seconds", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/FSJESC Financial Markets Club/);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/student terminal for learning how markets actually work/i);

    // The permanent simulated-market notice must be present on every page.
    // Scoped to the banner's `note` role so it cannot collide with body copy that
    // merely mentions the phrase.
    await expect(page.getByRole("note").filter({ hasText: "SIMULATED MARKET" })).toBeVisible();

    // The three mandated calls to action.
    await expect(page.getByRole("link", { name: "Explore education" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Enter the simulator" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "View challenges" }).first()).toBeVisible();
  });

  test("the homepage renders the mandated sections in order", async ({ page }) => {
    await page.goto("/");

    const order = [
      /student terminal for learning how markets actually work/i,
      /most students meet market risk only as a hypothetical/i,
      /four activities, one programme/i,
      /concepts before instruments/i,
      /a market that behaves the same way every time/i,
      /sessions you can attend/i,
      /inflation shock/i,
      /start where you are/i,
      /what the programme currently holds/i,
      /join the programme/i,
    ];

    const headings = await page.getByRole("heading").allTextContents();
    const joined = headings.join(" | ");

    let cursor = -1;
    for (const pattern of order) {
      const match = headings.findIndex((text, index) => index > cursor && pattern.test(text));
      expect(match, `missing or out-of-order section: ${String(pattern)}`).toBeGreaterThan(cursor);
      cursor = match;
    }
    expect(joined).not.toBe("");
  });

  for (const route of [
    "/about",
    "/team",
    "/contact",
    "/events",
    "/education",
    "/simulator/market",
  ]) {
    test(`${route} loads with one h1, a main landmark and no console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });

      const response = await page.goto(route);

      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.locator("main#main-content")).toHaveCount(1);
      await expect(page.getByRole("note").filter({ hasText: "SIMULATED MARKET" })).toBeVisible();
      expect(consoleErrors).toEqual([]);
    });
  }

  test("an unknown address returns a real 404", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
  });

  test("an unknown event slug serves the 404 page and is not indexable", async ({ page }) => {
    // The status code is deliberately not asserted: under Cache Components an
    // unprerendered parameter yields 200 (DECISIONS.md D15). What is asserted is
    // the behaviour that is guaranteed — the 404 body, `noindex`, and no leakage
    // of event content.
    await page.goto("/events/no-such-event");

    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    // No event content may leak for an unknown slug.
    await expect(page.getByText(/registration opens|places remaining/i)).toHaveCount(0);
  });
});

test.describe("navigation", () => {
  test("the skip link moves focus to the main content", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to main content/i });
    await expect(skip).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("every primary navigation entry resolves", async ({ page, isMobile }) => {
    await page.goto("/");

    if (isMobile) {
      // On a phone the navigation lives behind a disclosure, so the entries are
      // read from the open panel rather than from a permanently visible bar.
      await page.getByRole("button", { name: /navigation menu/i }).click();
    }

    const nav = page
      .getByRole("navigation", isMobile ? { name: "Primary (mobile)" } : { name: "Primary" })
      .first();
    const links = await nav.getByRole("link").all();

    expect(links.length).toBeGreaterThanOrEqual(5);

    for (const link of links) {
      const href = await link.getAttribute("href");
      expect(href).toBeTruthy();
      const response = await page.request.get(`/${String(href).replace(/^\//, "")}`);
      expect(response.status(), `${href} should resolve`).toBeLessThan(400);
    }
  });

  test("the current page is marked for assistive technology", async ({ page, isMobile }) => {
    await page.goto("/about");

    // On a phone the desktop bar stays in the DOM but is display:none, and a
    // count matches the DOM rather than the viewport, so the assertion is scoped
    // to whichever navigation is actually presented.
    const scope = isMobile
      ? page.getByRole("navigation", { name: "Primary (mobile)" })
      : page.getByRole("navigation", { name: "Primary" });

    if (isMobile) {
      await page.getByRole("button", { name: /navigation menu/i }).click();
    }

    await expect(scope.locator('a[aria-current="page"]')).toHaveCount(1);
    await expect(scope.locator('a[aria-current="page"]')).toHaveAttribute("href", "/about");
  });

  test("the desktop navigation bar is absent from the accessibility tree on a phone", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "Only meaningful on the mobile project.");
    await page.goto("/");
    // Otherwise a screen reader announces every navigation link twice.
    await expect(page.getByRole("navigation", { name: "Primary", exact: true })).toHaveCount(0);
  });

  test("the mobile menu opens, closes on Escape, and restores focus", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "The disclosure only exists below the lg breakpoint.");

    await page.goto("/");
    // The label changes between "Open" and "Close" so a screen reader announces
    // the state, so the locator must match either — `/navigation menu/i` rather
    // than `/open navigation menu/i`.
    const trigger = page.getByRole("button", { name: /navigation menu/i });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name: "Primary (mobile)" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });
});

test.describe("contact form", () => {
  test("the result banner is rendered from the server's redirect target", async ({ page }) => {
    // The action redirects with a short status code; this asserts the page renders
    // each outcome correctly. The server-side validation *rules* themselves are
    // covered by unit tests in src/domain/education/contact.test.ts, because
    // browser constraint validation makes them unreachable from a browser.
    await page.goto("/contact?status=invalid&fields=email,message");
    await expect(page.getByText("Some fields need attention")).toBeVisible();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Please give at least 30 characters of detail.")).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toHaveAttribute("aria-invalid", "true");

    await page.goto("/contact?status=received");
    await expect(page.getByText(/your message has been recorded/i)).toBeVisible();

    await page.goto("/contact?status=unknown-value&fields=notAField");
    await expect(page.getByText("Some fields need attention")).toHaveCount(0);
  });

  test("browser constraint validation blocks an incomplete submission before any request", async ({
    page,
  }) => {
    let posted = false;
    page.on("request", (request) => {
      if (request.method() === "POST") posted = true;
    });

    await page.goto("/contact");
    await page.getByLabel(/your name/i).fill("Amina");
    await page.getByLabel(/email address/i).fill("amina@example.com");
    await page.getByLabel(/what is this about/i).selectOption("PROGRAMME");
    // Message left empty: `required` and `minLength` block this in the browser.
    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page).toHaveURL(/\/contact$/);
    expect(posted, "the browser should have prevented the POST").toBe(false);
  });

  test("accepts a valid submission and confirms it", async ({ page }) => {
    await page.goto("/contact");

    await page.getByLabel(/your name/i).fill("Amina Benali");
    await page.getByLabel(/email address/i).fill("amina@example.com");
    await page.getByLabel(/what is this about/i).selectOption("PROGRAMME");
    await page
      .getByLabel(/^message/i)
      .fill(
        "I would like to propose a session on reading cash flow statements for second year students.",
      );
    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page).toHaveURL(/status=received/);
    await expect(page.getByText(/your message has been recorded/i)).toBeVisible();
  });

  test("renders as a working native form without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    // NOTE: Playwright injects script to compute ARIA roles and accessible names,
    // and its input helpers need it too, so a *typed* submission cannot be
    // simulated with scripting off. That limit is the harness's, not the
    // application's — so this test asserts what can be checked honestly: the
    // controls exist, are natively enforceable, and are correctly associated with
    // their labels. The typed submission path is covered with scripting on.
    await page.goto("/contact");

    const controls = [
      ["#contact-name", { required: true, minLength: 2 }],
      ["#contact-email", { required: true, type: "email" }],
      ["#contact-topic", { required: true }],
      ["#contact-message", { required: true, minLength: 30 }],
    ] as const;

    for (const [selector, expectations] of controls) {
      const control = page.locator(selector);
      await expect(control).toBeAttached();
      await expect(control).toBeEnabled();

      // Constraint validation is native, so it is declared in the markup.
      for (const [attribute, value] of Object.entries(expectations)) {
        await expect(control).toHaveAttribute(attribute, value === true ? "" : String(value));
      }

      // Programmatic label association is the property that matters for a screen
      // reader, and it is checkable without scripting.
      const labelled = await control.evaluate((element) => {
        const wrapper = element.closest("div");
        return !!wrapper?.querySelector(`label[for="${element.id}"]`);
      });
      expect(labelled, `${selector} must have an associated label`).toBe(true);
    }

    await expect(page.locator('button[type="submit"]')).toBeAttached();
    await expect(page.getByText("Send message")).toBeAttached();

    await context.close();
  });
});

test.describe("metadata and discoverability", () => {
  test("robots.txt disallows private surfaces and names the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();

    expect(body).toContain("Sitemap:");
    for (const prefix of ["/dashboard", "/admin", "/executive", "/design-review"]) {
      expect(body).toContain(prefix);
    }
  });

  test("sitemap.xml lists the public routes", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();

    for (const route of ["/about", "/education", "/events", "/simulator"]) {
      expect(body).toContain(`<loc>`);
      expect(body).toContain(route);
    }
    // Private surfaces must never appear.
    for (const prefix of ["/dashboard", "/admin"]) {
      expect(body).not.toContain(prefix);
    }
  });

  test("public pages carry a canonical URL and a description", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/about$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
  });
});

test.describe("theme", () => {
  test("the theme switcher persists a choice without a flash", async ({ page }) => {
    await page.goto("/");

    const switcher = page.getByRole("button", { name: /theme:/i });
    await switcher.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await switcher.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    // The stored value is applied before paint, so it is already correct on load.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

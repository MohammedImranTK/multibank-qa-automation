const { test, expect } = require('../fixtures/pageFixtures');
const { ConfigManager } = require('../src/utils/ConfigManager');
const { TestDataProvider } = require('../src/utils/TestDataProvider');
const { checkAllLinks } = require('../src/utils/linkChecker');

const config = ConfigManager.getInstance();
const data = TestDataProvider.getInstance();

test.describe('Negative / Edge Cases', () => {
  test.describe('Invalid route handling', () => {
    for (const route of data.getInvalidRoutes()) {
      test(`unknown route "${route}" renders a friendly 404, not a crash`, async ({
        page,
        notFoundPage,
      }) => {
        const response = await page.goto(config.url(route), { waitUntil: 'domcontentloaded' });

        // The app resolves unknown routes client-side to a custom 404 view
        // rather than a server-level 404 status — assert the actual user-facing
        // contract (friendly page), and only require a non-5xx transport status.
        if (response) {
          expect(response.status(), `${route} should not 5xx`).toBeLessThan(500);
        }

        await expect(notFoundPage.heading).toBeVisible();
        await expect(notFoundPage.backHomeButton).toBeVisible();

        const homePathname = new URL(config.url('/')).pathname;
        await notFoundPage.goHome();
        await page.waitForURL((url) => url.pathname === homePathname);
        expect(page.url()).toBe(config.url('/'));
      });
    }
  });

  test.describe('Broken link detection', () => {
    test('every navigation link resolves without a client/server error', async ({
      homePage,
      request,
    }) => {
      await homePage.goto();

      const hrefs = [];
      for (const item of data.getPrimaryNavItems()) {
        const href = await homePage.nav.getNavItemHref(item.name);
        hrefs.push(item.external ? href : config.resolveHref(href));
      }

      const results = await checkAllLinks(request, hrefs);
      const broken = results.filter((result) => !result.ok);

      expect(
        broken,
        `Broken links found: ${broken.map((b) => `${b.url} (${b.status ?? b.error})`).join(', ')}`
      ).toHaveLength(0);
    });
  });

  test.describe('Viewport regression at a mobile breakpoint', () => {
    test('navigation remains usable and content has no horizontal overflow at 375px width', async ({
      page,
      homePage,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await homePage.goto();

      const desktopNavVisible = await homePage.nav.isDesktopNavVisible().catch(() => false);
      expect(desktopNavVisible, 'full desktop nav should collapse on mobile').toBe(false);

      await expect(
        homePage.nav.mobileMenuToggle,
        'a mobile menu toggle should be present instead'
      ).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(hasHorizontalOverflow, 'page should not overflow horizontally at 375px').toBe(false);
    });
  });
});

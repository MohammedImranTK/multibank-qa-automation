const { test, expect } = require('../fixtures/pageFixtures');
const { ConfigManager } = require('../src/utils/ConfigManager');
const { TestDataProvider } = require('../src/utils/TestDataProvider');
const { checkAllLinks } = require('../src/utils/linkChecker');
const NetworkConditions = require('../src/utils/NetworkConditions');

const config = ConfigManager.getInstance();
const data = TestDataProvider.getInstance();

test.describe('Negative / Edge Cases', () => {
  test.describe('Invalid route handling', () => {
    for (const route of data.getInvalidRoutes()) {
      test(
        `unknown route "${route}" renders a friendly 404, not a crash`,
        { tag: ['@negative', '@regression'] },
        async ({ page, homePage, notFoundPage }) => {
          const response = await test.step('Navigate to an unknown route', async () => {
            return page.goto(config.url(route), { waitUntil: 'domcontentloaded' });
          });

          await test.step('App resolves it to a friendly 404, not a server/transport error', async () => {
            // The app resolves unknown routes client-side to a custom 404 view
            // rather than a server-level 404 status — assert the actual
            // user-facing contract, and only require a non-5xx transport status.
            if (response) {
              expect(response.status(), `${route} should not 5xx`).toBeLessThan(500);
            }
            await expect(notFoundPage.heading).toBeVisible();
            await expect(notFoundPage.backHomeButton).toBeVisible();
          });

          await test.step('"Back to Homepage" returns to a working homepage', async () => {
            await notFoundPage.goHome();
            await expect(homePage.heroHeading).toBeVisible();
            expect(page.url()).toBe(`${config.url('/')}`);
          });
        }
      );
    }
  });

  test.describe('Broken link detection', () => {
    test(
      'every navigation link resolves without a client/server error',
      { tag: ['@negative', '@regression'] },
      async ({ homePage, request }) => {
        await homePage.goto();

        const hrefs = await test.step('Collect every primary nav link href', async () => {
          const collected = [];
          for (const item of data.getPrimaryNavItems()) {
            const href = await homePage.nav.getNavItemHref(item.name);
            collected.push(item.external ? href : config.resolveHref(href));
          }
          return collected;
        });

        await test.step('Resolve each href over real HTTP', async () => {
          const results = await checkAllLinks(request, hrefs);
          const broken = results.filter((result) => !result.ok);

          expect(
            broken,
            `Broken links found: ${broken.map((b) => `${b.url} (${b.status ?? b.error})`).join(', ')}`
          ).toHaveLength(0);
        });
      }
    );
  });

  test.describe('Viewport regression at a mobile breakpoint', () => {
    test(
      'navigation remains usable and content has no horizontal overflow at 375px width',
      { tag: ['@negative', '@regression', '@mobile'] },
      async ({ page, homePage }) => {
        await test.step('Load the homepage at a 375px mobile viewport', async () => {
          await page.setViewportSize({ width: 375, height: 812 });
          await homePage.goto();
        });

        await test.step('Desktop nav collapses in favor of a mobile menu toggle', async () => {
          const desktopNavVisible = await homePage.nav.isDesktopNavVisible().catch(() => false);
          expect(desktopNavVisible, 'full desktop nav should collapse on mobile').toBe(false);
          await expect(
            homePage.nav.mobileMenuToggle,
            'a mobile menu toggle should be present instead'
          ).toBeVisible();
        });

        await test.step('Page content has no horizontal overflow', async () => {
          const hasHorizontalOverflow = await page.evaluate(
            () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
          );
          expect(hasHorizontalOverflow, 'page should not overflow horizontally at 375px').toBe(
            false
          );
        });
      }
    );
  });

  test.describe('Content loading timeout handling', () => {
    test(
      'spot market table renders correctly despite a slow network, without crashing',
      { tag: ['@negative', '@regression'] },
      async ({ page, explorePage }) => {
        await test.step('Simulate a slow backend (every response delayed 2s)', async () => {
          await NetworkConditions.throttle(page, '**/*', 2000);
        });

        await test.step('Navigate to the Explore page under slow-network conditions', async () => {
          // Best-effort: a heavily throttled first paint can still exceed the
          // default navigation timeout on some CI runners — that is not the
          // failure this test cares about, so swallow it and assert on the
          // actual outcome (does the content eventually render?) below.
          await page
            .goto(config.url('/explore'), { waitUntil: 'domcontentloaded', timeout: 20_000 })
            .catch(() => null);
        });

        await test.step('Market content eventually renders, and no crash/blank page occurs', async () => {
          const rendered = await explorePage.waitForVisibleWithin(
            explorePage.marketsHeading,
            20_000
          );
          expect(rendered, 'spot market heading should render once slow content arrives').toBe(
            true
          );
          await expect(explorePage.pricesTable).toBeVisible();
        });
      }
    );
  });
});

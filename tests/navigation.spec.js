const { test, expect } = require('../fixtures/pageFixtures');
const { TestDataProvider } = require('../src/utils/TestDataProvider');

const data = TestDataProvider.getInstance();

test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('top navigation renders with all expected items visible', async ({ homePage }) => {
    await expect(homePage.nav.nav).toBeVisible();

    for (const item of data.getPrimaryNavItems()) {
      await expect(
        homePage.nav.navLink(item.name),
        `Expected nav item "${item.name}" to be visible`
      ).toBeVisible();
    }
  });

  for (const item of data.getPrimaryNavItems()) {
    test(`"${item.name}" nav item links to the correct destination`, async ({ homePage, page }) => {
      const href = await homePage.nav.getNavItemHref(item.name);
      expect(href, `href for "${item.name}"`).toBeTruthy();

      if (item.external) {
        expect(href).toContain(new URL(item.path).hostname);
        return;
      }

      await homePage.nav.clickNavItem(item.name);
      // Client-side routing updates history/content asynchronously and does
      // not fire a fresh 'domcontentloaded' event, so assert on the URL
      // directly rather than racing a load-state wait against it.
      await page.waitForURL((url) => url.pathname.includes(item.path));
      expect(page.url()).toContain(item.path);
    });
  }

  test('navigation behaves correctly at standard desktop viewport sizes', async ({ page, homePage }) => {
    const desktopViewports = [
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ];

    for (const viewport of desktopViewports) {
      await page.setViewportSize(viewport);
      await expect(
        homePage.nav.nav,
        `Nav should render at ${viewport.width}x${viewport.height}`
      ).toBeVisible();

      const visibleNames = await homePage.nav.getVisibleDesktopLinkNames();
      for (const item of data.getPrimaryNavItems()) {
        expect(visibleNames, `"${item.name}" visible at ${viewport.width}px`).toContain(item.name);
      }
    }
  });
});

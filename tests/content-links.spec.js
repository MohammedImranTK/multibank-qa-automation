const { test, expect } = require('../fixtures/pageFixtures');
const { TestDataProvider } = require('../src/utils/TestDataProvider');
const { checkLinkStatus } = require('../src/utils/linkChecker');

const data = TestDataProvider.getInstance();

test.describe('Content & Links', () => {
  test(
    'marketing banners render in the expected page region',
    { tag: ['@content', '@regression'] },
    async ({ explorePage }) => {
      await explorePage.goto();

      const count = await explorePage.bannerCards.count();
      expect(count, 'expected marketing/promo banner cards on the Explore page').toBeGreaterThan(
        0
      );

      await test.step('Every banner card is visible', async () => {
        for (let i = 0; i < count; i += 1) {
          await expect(explorePage.bannerCards.nth(i)).toBeVisible();
        }
      });

      await test.step('Banners render above the spot market table', async () => {
        // "Expected region": inside main content, above the spot market
        // table — not part of header/nav or footer chrome. The page has no
        // <main> landmark, so region is asserted via bounding-box position
        // rather than DOM containment.
        const bannerBox = await explorePage.bannerCards.first().boundingBox();
        const marketBox = await explorePage.marketsHeading.boundingBox();
        expect(bannerBox, 'banner should have a bounding box').not.toBeNull();
        expect(marketBox, 'market heading should have a bounding box').not.toBeNull();
        expect(bannerBox.y, 'banners should render above the spot market table').toBeLessThan(
          marketBox.y
        );
      });
    }
  );

  test(
    'App Store and Google Play download links resolve correctly',
    { tag: ['@content', '@regression'] },
    async ({ homePage, request }) => {
      await homePage.goto();

      const hasDedicatedBadges = await homePage.hasDedicatedStoreBadges();

      if (hasDedicatedBadges) {
        const appStoreHref = await homePage.appStoreLink.getAttribute('href');
        const googlePlayHref = await homePage.googlePlayLink.getAttribute('href');

        const [appStoreResult, googlePlayResult] = await Promise.all([
          checkLinkStatus(request, appStoreHref),
          checkLinkStatus(request, googlePlayHref),
        ]);

        expect(appStoreResult.ok, `App Store link should resolve: ${appStoreHref}`).toBe(true);
        expect(googlePlayResult.ok, `Google Play link should resolve: ${googlePlayHref}`).toBe(
          true
        );
        return;
      }

      // This build exposes a single universal "Download the app" deep link
      // (device-detecting redirector) instead of two dedicated store badges.
      // See README > Assumptions.
      await expect(homePage.nav.downloadAppLink).toBeVisible();
      const href = await homePage.nav.downloadAppLink.getAttribute('href');
      const result = await checkLinkStatus(request, href);
      expect(result.ok, `Download app link should resolve without error: ${href}`).toBe(true);
    }
  );

  test(
    'About Us > Why MultiBank page renders all expected components with correct headings and section text',
    { tag: ['@content', '@regression'] },
    async ({ companyPage }) => {
      await companyPage.goto();

      await expect(companyPage.sectionHeading(data.getWhyMultiBankHeading())).toBeVisible();

      await test.step('All content section headings render', async () => {
        for (const section of data.getCompanyContentSections()) {
          await expect(
            companyPage.sectionHeading(section),
            `Section heading "${section}" should render`
          ).toBeVisible();
        }
      });

      await test.step('All stat cards render with value + label', async () => {
        for (const stat of data.getCompanyStatCards()) {
          await expect(
            companyPage.page.getByText(stat.value, { exact: true }),
            `Stat value "${stat.value}" should render`
          ).toBeVisible();
          await expect(
            companyPage.page.getByText(stat.label, { exact: true }),
            `Stat label "${stat.label}" should render`
          ).toBeVisible();
        }
      });

      await test.step('All trust highlights render', async () => {
        for (const highlight of data.getCompanyTrustHighlights()) {
          await expect(
            companyPage.contentText(highlight),
            `Trust highlight "${highlight}" should render`
          ).toBeVisible();
        }
      });
    }
  );
});

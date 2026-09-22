const { test, expect } = require('../fixtures/pageFixtures');
const { TestDataProvider } = require('../src/utils/TestDataProvider');
const { checkLinkStatus } = require('../src/utils/linkChecker');

const data = TestDataProvider.getInstance();

test.describe('Content & Links', () => {
  test('marketing banners render in the expected page region', async ({ explorePage }) => {
    await explorePage.goto();

    const count = await explorePage.bannerCards.count();
    expect(count, 'expected marketing/promo banner cards on the Explore page').toBeGreaterThan(0);

    // "Expected region": inside main content, above the spot market table —
    // not part of header/nav or footer chrome.
    for (let i = 0; i < count; i += 1) {
      await expect(explorePage.bannerCards.nth(i)).toBeVisible();
    }

    const bannerBox = await explorePage.bannerCards.first().boundingBox();
    const marketBox = await explorePage.marketsHeading.boundingBox();
    expect(bannerBox, 'banner should have a bounding box').not.toBeNull();
    expect(marketBox, 'market heading should have a bounding box').not.toBeNull();
    expect(bannerBox.y, 'banners should render above the spot market table').toBeLessThan(
      marketBox.y
    );
  });

  test('App Store and Google Play download links resolve correctly', async ({
    homePage,
    request,
  }) => {
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
      expect(googlePlayResult.ok, `Google Play link should resolve: ${googlePlayHref}`).toBe(true);
      return;
    }

    // This build exposes a single universal "Download the app" deep link
    // (device-detecting redirector) instead of two dedicated store badges.
    // See README > Assumptions.
    await expect(homePage.nav.downloadAppLink).toBeVisible();
    const href = await homePage.nav.downloadAppLink.getAttribute('href');
    const result = await checkLinkStatus(request, href);
    expect(result.ok, `Download app link should resolve without error: ${href}`).toBe(true);
  });

  test('About Us > Why MultiBank page renders all expected components with correct headings and section text', async ({
    companyPage,
  }) => {
    await companyPage.goto();

    await expect(companyPage.sectionHeading(data.getWhyMultiBankHeading())).toBeVisible();

    for (const section of data.getCompanyContentSections()) {
      await expect(
        companyPage.sectionHeading(section),
        `Section heading "${section}" should render`
      ).toBeVisible();
    }

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

    for (const highlight of data.getCompanyTrustHighlights()) {
      await expect(
        companyPage.contentText(highlight),
        `Trust highlight "${highlight}" should render`
      ).toBeVisible();
    }
  });
});

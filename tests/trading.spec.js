const { test, expect } = require('../fixtures/pageFixtures');
const { TestDataProvider } = require('../src/utils/TestDataProvider');

const data = TestDataProvider.getInstance();

test.describe('Trading Functionality', () => {
  test.beforeEach(async ({ explorePage }) => {
    await explorePage.goto();
  });

  test('spot trading section renders and displays trading pairs', async ({ explorePage }) => {
    await expect(explorePage.marketsHeading).toBeVisible();
    await expect(explorePage.pricesTable).toBeVisible();

    const pairCount = await explorePage.getPairCount();
    expect(pairCount, 'expected at least one trading pair row').toBeGreaterThan(0);
  });

  test('trading pairs are correctly grouped into categories', async ({ explorePage }) => {
    for (const category of data.getExploreMarketCategories()) {
      await expect(
        explorePage.categoryTab(category),
        `Category tab "${category}" should render`
      ).toBeVisible();
    }

    // Switching category should keep the table populated (grouping is live, not just cosmetic).
    for (const category of data.getExploreMarketCategories()) {
      await explorePage.selectCategory(category);
      const count = await explorePage.getPairCount();
      expect(count, `"${category}" tab should list at least one pair`).toBeGreaterThan(0);
    }
  });

  test('trading pairs are grouped into categories on the homepage market module', async ({
    homePage,
  }) => {
    await homePage.goto();
    const headings = await homePage.getMarketCategoryHeadings();

    for (const category of data.getHomepageMarketCategories()) {
      expect(headings, `Homepage should show "${category}" category`).toContain(category);
    }

    for (const category of data.getHomepageMarketCategories()) {
      const assets = await homePage.getAssetsInCategory(category);
      expect(assets.length, `"${category}" card should list assets`).toBeGreaterThan(0);
    }
  });

  test('trading pair entries contain the expected data fields', async ({ explorePage }) => {
    const pairs = await explorePage.getVisiblePairs(5);
    expect(pairs.length).toBeGreaterThan(0);

    for (const pair of pairs) {
      expect(pair.symbol, 'symbol field').toBeTruthy();
      expect(pair.name, 'name field').toBeTruthy();
      expect(pair.href, 'detail link href').toMatch(/^\/explore\//);
      expect(pair.priceText, `price field for ${pair.symbol}`).toMatch(/^\$[\d,.]+/);
      expect(pair.changeText, `% change field for ${pair.symbol}`).toMatch(/%$/);
    }

    const symbolsPresent = pairs.map((pair) => pair.symbol);
    const overlap = data
      .getSampleAssetSymbols()
      .filter((symbol) => symbolsPresent.includes(symbol));
    expect(overlap.length, 'at least one known major asset should appear').toBeGreaterThan(0);
  });
});

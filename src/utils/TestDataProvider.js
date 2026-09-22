const navigation = require('../data/navigation.data');
const trading = require('../data/trading.data');
const company = require('../data/company.data');
const routes = require('../data/routes.data');

/**
 * Single, cached access point for all static test data/fixtures.
 * Singleton: tests should never `require('../data/xyz.data')` directly —
 * routing every lookup through one provider means test data can later move
 * to an API/CMS/JSON-per-environment source without touching call sites.
 */
class TestDataProvider {
  constructor() {
    if (TestDataProvider._instance) {
      return TestDataProvider._instance;
    }
    this._navigation = navigation;
    this._trading = trading;
    this._company = company;
    this._routes = routes;
    TestDataProvider._instance = this;
  }

  static getInstance() {
    if (!TestDataProvider._instance) {
      TestDataProvider._instance = new TestDataProvider();
    }
    return TestDataProvider._instance;
  }

  getPrimaryNavItems() {
    return this._navigation.PRIMARY_NAV_ITEMS;
  }

  getUtilityLinks() {
    return this._navigation.UTILITY_LINKS;
  }

  getExploreMarketCategories() {
    return this._trading.EXPLORE_MARKET_CATEGORIES;
  }

  getHomepageMarketCategories() {
    return this._trading.HOMEPAGE_MARKET_CATEGORIES;
  }

  getSampleAssetSymbols() {
    return this._trading.SAMPLE_ASSET_SYMBOLS;
  }

  getWhyMultiBankHeading() {
    return this._company.WHY_MULTIBANK_HEADING;
  }

  getCompanyStatCards() {
    return this._company.STAT_CARDS;
  }

  getCompanyContentSections() {
    return this._company.CONTENT_SECTIONS;
  }

  getCompanyTrustHighlights() {
    return this._company.TRUST_HIGHLIGHTS;
  }

  getInvalidRoutes() {
    return this._routes.INVALID_ROUTES;
  }

  getNotFoundHeading() {
    return this._routes.NOT_FOUND_HEADING;
  }
}

module.exports = { TestDataProvider };

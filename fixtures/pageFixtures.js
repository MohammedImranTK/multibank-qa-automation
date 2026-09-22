const base = require('@playwright/test');
const { HomePage } = require('../src/pages/HomePage');
const { ExplorePage } = require('../src/pages/ExplorePage');
const { CompanyPage } = require('../src/pages/CompanyPage');
const { NotFoundPage } = require('../src/pages/NotFoundPage');

/**
 * Custom Playwright fixtures wiring each Page Object to the per-test `page`
 * instance. Centralizing construction here means tests never call
 * `new HomePage(page)` themselves — one place to change if a page object's
 * constructor signature ever changes (DRY).
 */
const test = base.test.extend({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  explorePage: async ({ page }, use) => {
    await use(new ExplorePage(page));
  },
  companyPage: async ({ page }, use) => {
    await use(new CompanyPage(page));
  },
  notFoundPage: async ({ page }, use) => {
    await use(new NotFoundPage(page));
  },
});

const { expect } = base;

module.exports = { test, expect };

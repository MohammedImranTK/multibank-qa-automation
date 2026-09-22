const base = require('@playwright/test');
const { HomePage } = require('../src/pages/HomePage');
const { ExplorePage } = require('../src/pages/ExplorePage');
const { CompanyPage } = require('../src/pages/CompanyPage');
const { NotFoundPage } = require('../src/pages/NotFoundPage');
const { Logger } = require('../src/utils/Logger');

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

  /**
   * Per-test lifecycle (the "before/after each" equivalent), applied to
   * every test in every spec file via `auto: true` instead of each file
   * declaring its own beforeEach/afterEach. Logs start/end and, on failure,
   * attaches browser console errors + the final URL to the HTML report so a
   * failure can be diagnosed from the report alone, without re-running.
   */
  lifecycle: [
    async ({ page }, use, testInfo) => {
      const logger = Logger.getInstance();
      const consoleErrors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));

      logger.step(testInfo.title, `START (project: ${testInfo.project.name})`);
      const startedAt = Date.now();

      await use();

      const durationMs = Date.now() - startedAt;
      logger.step(testInfo.title, `END -> ${testInfo.status} in ${durationMs}ms`);

      if (testInfo.status !== testInfo.expectedStatus) {
        if (consoleErrors.length) {
          await testInfo.attach('browser-console-errors', {
            body: consoleErrors.join('\n'),
            contentType: 'text/plain',
          });
        }
        await testInfo.attach('final-page-url', {
          body: page.url(),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
});

const { expect } = base;

module.exports = { test, expect };

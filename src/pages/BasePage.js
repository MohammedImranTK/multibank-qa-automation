const { ConfigManager } = require('../utils/ConfigManager');
const { Logger } = require('../utils/Logger');
const { dismissSubscribeModal } = require('../utils/InterstitialHandler');

/**
 * Common behaviour shared by every page object: navigation, load-state
 * waiting, and a couple of resilience helpers (timeout-bounded content
 * waits, response-status checks) used by the negative/edge-case tests.
 *
 * Page objects intentionally expose only *behaviour* (goto, methods that
 * return data or perform actions) — locators live in each subclass so a
 * broken selector only ever needs a one-file fix.
 */
class BasePage {
  constructor(page) {
    this.page = page;
    this.config = ConfigManager.getInstance();
    this.logger = Logger.getInstance();
  }

  async goto(path = '/') {
    const url = this.config.url(path);
    this.logger.step(this.constructor.name, `Navigating to ${url}`);
    const response = await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('load');
    await dismissSubscribeModal(this.page);
    return response;
  }

  async title() {
    return this.page.title();
  }

  async currentUrl() {
    return this.page.url();
  }

  /**
   * Waits for a locator to reach a visible state within `timeoutMs`,
   * returning a boolean instead of throwing — used by tests that assert
   * *how* a timeout/slow-content scenario is handled rather than failing
   * the whole test on the first sign of a slow network.
   */
  async waitForVisibleWithin(locator, timeoutMs) {
    try {
      await locator.first().waitFor({ state: 'visible', timeout: timeoutMs });
      return true;
    } catch (error) {
      this.logger.warn(this.constructor.name, `Timed out waiting for element: ${error.message}`);
      return false;
    }
  }
}

module.exports = { BasePage };

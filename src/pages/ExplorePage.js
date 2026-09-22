const { BasePage } = require('./BasePage');
const { NavigationComponent } = require('../components/NavigationComponent');

const PATH = '/explore';

/**
 * The public spot market price table (/en-AE/explore) is the reachable,
 * login-free surface for "trading functionality" on this build — there is
 * no anonymous order-entry screen, so pair discovery/data-field coverage is
 * exercised here instead.
 */
class ExplorePage extends BasePage {
  constructor(page) {
    super(page);
    this.nav = new NavigationComponent(page);

    this.marketsHeading = page.getByRole('heading', { name: 'Spot market' });
    this.pricesTable = page.getByRole('table');
    this.pairLinks = this.pricesTable.locator('a[href^="/explore/"]');

    // Category tabs rendered above the price table (Hot / Gainers / Losers).
    this.categoryTab = (name) =>
      page.getByRole('tab', { name, exact: true }).or(page.getByRole('button', { name, exact: true }));

    // Promo/marketing banner cards rendered between the hero and the market table.
    // (The page has no <main> landmark, so region is asserted via bounding-box
    // position in the test rather than DOM containment.)
    this.bannerCards = page.getByText(
      /Earn interest on your assets|Get crypto with your card|Deposits using card or wire transfer/
    );
  }

  async goto() {
    return super.goto(PATH);
  }

  async selectCategory(name) {
    await this.categoryTab(name).click();
  }

  async getPairCount() {
    return this.pairLinks.count();
  }

  /**
   * Reads up to `limit` visible trading-pair rows and returns their data
   * fields. Locators are role/text based (no CSS class coupling) so the row
   * shape survives styling refactors.
   */
  async getVisiblePairs(limit = 10) {
    const total = Math.min(await this.pairLinks.count(), limit);
    const pairs = [];

    for (let i = 0; i < total; i += 1) {
      const link = this.pairLinks.nth(i);
      // DOM shape: <tr><td><a>...</a></td><td>price</td><td>change%</td><td>chart</td></tr>
      const row = link.locator('xpath=ancestor::tr[1]');

      const [symbolAndName, href] = await Promise.all([link.innerText(), link.getAttribute('href')]);
      const [symbol, name] = symbolAndName.split('\n').map((part) => part.trim());

      const priceLocator = row.getByText(/^\$[\d,.]+/).first();
      const changeLocator = row.getByText(/%$/).first();

      pairs.push({
        symbol,
        name,
        href,
        priceText: (await priceLocator.count()) ? (await priceLocator.innerText()).trim() : null,
        changeText: (await changeLocator.count()) ? (await changeLocator.innerText()).trim() : null,
      });
    }

    return pairs;
  }
}

module.exports = { ExplorePage };

const { BasePage } = require('./BasePage');
const { NavigationComponent } = require('../components/NavigationComponent');

const PATH = '/';

class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.nav = new NavigationComponent(page);

    this.heroHeading = page.getByRole('heading', { name: 'Crypto for everyone' });
    // "Catch your next trade" module: three categorized asset cards.
    this.marketModuleHeading = page.getByRole('heading', { name: 'Catch your next trade' });
    this.appStoreLink = page.getByRole('link', { name: /app store/i });
    this.googlePlayLink = page.getByRole('link', { name: /google play/i });
  }

  async goto() {
    return super.goto(PATH);
  }

  categoryCard(categoryName) {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByRole('heading', { name: categoryName, exact: true }) })
      .first();
  }

  async getMarketCategoryHeadings() {
    await this.marketModuleHeading.scrollIntoViewIfNeeded();
    const headings = await this.page.getByRole('heading').allTextContents();
    return headings.map((text) => text.trim());
  }

  /**
   * Returns the asset rows (symbol/name + price) rendered inside a given
   * category card, e.g. categoryName = "Top Gainers".
   */
  async getAssetsInCategory(categoryName) {
    const card = this.categoryCard(categoryName);
    await card.scrollIntoViewIfNeeded();
    const rows = card.locator('a, li').filter({ hasText: /\$/ });
    const count = await rows.count();
    const assets = [];
    for (let i = 0; i < count; i += 1) {
      const text = (await rows.nth(i).innerText()).trim();
      if (text) assets.push(text);
    }
    return assets;
  }

  /**
   * Locates the App Store / Google Play download links, wherever they
   * render on the page. On this build the site only exposes a single
   * universal "Download the app" deep link rather than two store badges —
   * see content-links.spec.js, which checks whichever variant is present.
   */
  async hasDedicatedStoreBadges() {
    const appStoreCount = await this.appStoreLink.count();
    const googlePlayCount = await this.googlePlayLink.count();
    return appStoreCount > 0 && googlePlayCount > 0;
  }
}

module.exports = { HomePage };

const { TestDataProvider } = require('../utils/TestDataProvider');
const { dismissSubscribeModal } = require('../utils/InterstitialHandler');

/**
 * The top navigation bar is present, identical, and independently
 * verifiable on every page of the site. Modelling it once as a component
 * (composed into page objects, not duplicated inside them) is the DRY
 * mechanism that keeps nav-related locator changes to a single file.
 */
class NavigationComponent {
  constructor(page) {
    this.page = page;
    this.data = TestDataProvider.getInstance();

    this.nav = page.getByRole('navigation', { name: 'Main' });
    this.mobileMenuToggle = page.getByRole('button', { name: /menu|open navigation/i });
    this.signInLink = page.getByRole('link', { name: 'Sign in' });
    this.signUpLink = page.getByRole('link', { name: 'Sign up' });
    this.downloadAppLink = page.getByRole('link', { name: 'Download the app' });
  }

  navLink(name) {
    return this.nav.getByRole('link', { name, exact: true });
  }

  async isDesktopNavVisible() {
    return this.nav.isVisible();
  }

  async getVisibleDesktopLinkNames() {
    const links = await this.nav.getByRole('link').all();
    const names = [];
    for (const link of links) {
      if (await link.isVisible()) {
        names.push((await link.textContent())?.trim());
      }
    }
    return names;
  }

  async clickNavItem(name) {
    // Defensive re-check: the subscribe interstitial (handled once already
    // in BasePage.goto()) has been observed appearing on a short delay
    // after initial load, which would otherwise land right in the gap
    // between goto() finishing and this click firing.
    await dismissSubscribeModal(this.page, 500);
    await this.navLink(name).click();
  }

  async getNavItemHref(name) {
    return this.navLink(name).getAttribute('href');
  }

  async openMobileMenu() {
    await this.mobileMenuToggle.click();
  }
}

module.exports = { NavigationComponent };

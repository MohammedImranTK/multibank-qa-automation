const { BasePage } = require('./BasePage');

class NotFoundPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Page not found' });
    this.backHomeButton = page.getByRole('link', { name: 'Back to Homepage' });
  }

  async isDisplayed() {
    return this.heading.isVisible();
  }

  async goHome() {
    await this.backHomeButton.click();
  }
}

module.exports = { NotFoundPage };

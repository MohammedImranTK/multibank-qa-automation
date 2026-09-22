const { BasePage } = require('./BasePage');
const { NavigationComponent } = require('../components/NavigationComponent');

const PATH = '/company';

/**
 * The "Company" nav item lands directly on the "Why MultiBank Group?"
 * content (there is no separate About Us > Why MultiBank sub-route on this
 * build) — see README "Assumptions" for the mapping to the brief's wording.
 */
class CompanyPage extends BasePage {
  constructor(page) {
    super(page);
    this.nav = new NavigationComponent(page);

    this.pageHeading = page.getByRole('heading', { level: 1 });
  }

  async goto() {
    return super.goto(PATH);
  }

  sectionHeading(text) {
    return this.page.getByRole('heading', { name: text });
  }

  contentText(text) {
    return this.page.getByText(text, { exact: true });
  }

  statCard(value) {
    return this.page.getByText(value, { exact: true });
  }
}

module.exports = { CompanyPage };

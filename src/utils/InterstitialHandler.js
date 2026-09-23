const { Logger } = require('./Logger');

/**
 * Dismisses known marketing interstitials that can overlay the page and
 * intercept interaction with the UI underneath.
 *
 * Specifically: a "Subscribe to mb.insider" newsletter modal was observed
 * appearing reliably in CI (fresh, cookie-less browser context on every
 * run) but not on a local dev machine that had already dismissed it once
 * in an earlier manual session — see issues/002-ci-subscribe-modal.md.
 * A real user hitting this modal on their first visit would face the same
 * thing, so a robust suite handles it rather than assuming it never shows.
 *
 * Deliberately matched by visible text/role, not a CSS class, so it
 * survives the marketing team re-skinning the popup without breaking tests.
 */
async function dismissSubscribeModal(page, timeoutMs = 2000) {
  const logger = Logger.getInstance();
  const modal = page.getByText(/subscribe to/i).first();

  try {
    await modal.waitFor({ state: 'visible', timeout: timeoutMs });
  } catch {
    return false; // not present within the window — nothing to dismiss
  }

  logger.warn('InterstitialHandler', 'Dismissing "Subscribe to..." interstitial modal');

  const closeButton = page.getByRole('button', { name: /close/i }).first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  } else {
    await page.keyboard.press('Escape');
  }

  await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  return true;
}

module.exports = { dismissSubscribeModal };

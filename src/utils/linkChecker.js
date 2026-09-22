const { Logger } = require('./Logger');

/**
 * Resolves a URL via Playwright's APIRequestContext (real HTTP, no browser
 * rendering needed) and reports whether it's "broken" — used by both the
 * broken-link-detection negative test and the App Store/Google Play link
 * check, since both boil down to "does this link resolve without a 4xx/5xx".
 *
 * Falls back from HEAD to GET because some CDNs/edge servers (App Store,
 * Play Store redirectors included) reject HEAD with a 405.
 */
async function checkLinkStatus(request, url) {
  const logger = Logger.getInstance();
  try {
    let response = await request.head(url, { maxRedirects: 5 });
    if (response.status() === 405) {
      response = await request.get(url, { maxRedirects: 5 });
    }
    const status = response.status();
    return { url, ok: status < 400, status };
  } catch (error) {
    logger.warn('linkChecker', `Failed to resolve ${url}: ${error.message}`);
    return { url, ok: false, status: null, error: error.message };
  }
}

async function checkAllLinks(request, urls) {
  const results = await Promise.all(urls.map((url) => checkLinkStatus(request, url)));
  return results;
}

module.exports = { checkLinkStatus, checkAllLinks };

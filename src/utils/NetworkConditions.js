/**
 * Simulates a slow backend/network by delaying every response matching
 * `urlPattern` before letting it continue. Reusable by any test that needs
 * to assert "how does the app behave while content is still loading"
 * (loading state, no crash, eventual render) without relying on
 * CDP-only device throttling.
 */
async function throttle(page, urlPattern, delayMs) {
  await page.route(urlPattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

async function clear(page, urlPattern) {
  await page.unroute(urlPattern);
}

module.exports = { throttle, clear };

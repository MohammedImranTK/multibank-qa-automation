/**
 * Trading-pair fixtures captured from /en-AE/explore and the homepage
 * "Catch your next trade" module. The platform has no login-free order
 * book/depth chart, so "spot trading" here refers to the public spot market
 * price table — the documented, reachable scope for this assessment.
 */

// Category tabs above the spot market table on the Explore page.
const EXPLORE_MARKET_CATEGORIES = ['Hot', 'Gainers', 'Losers'];

// Category cards in the homepage "Catch your next trade" module.
const HOMEPAGE_MARKET_CATEGORIES = ['Top Gainers', 'Trending Now', 'Top Losers'];

// A representative, stable-enough asset to assert row shape against.
// Price/percent values are live and intentionally NOT asserted on exact
// figures — only presence, type and format are checked (see trading.spec.js).
const SAMPLE_ASSET_SYMBOLS = ['BTC', 'ETH', 'XRP'];

module.exports = {
  EXPLORE_MARKET_CATEGORIES,
  HOMEPAGE_MARKET_CATEGORIES,
  SAMPLE_ASSET_SYMBOLS,
};

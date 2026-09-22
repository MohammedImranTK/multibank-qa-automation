// Routes are locale-relative: ConfigManager.url() prefixes them with
// BASE_URL (which already includes the /en-AE locale segment).
const INVALID_ROUTES = [
  '/this-route-does-not-exist-xyz',
  '/trade/UNKNOWN-PAIR-9999',
  '/admin/settings',
];

const NOT_FOUND_HEADING = 'Page not found';

module.exports = { INVALID_ROUTES, NOT_FOUND_HEADING };

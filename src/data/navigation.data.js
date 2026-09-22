/**
 * Expected primary navigation, captured from a live inspection of
 * https://mb.io/en-AE on 2026-09-22. Hrefs are relative to BASE_URL's origin
 * except where the destination is an external domain.
 */
const PRIMARY_NAV_ITEMS = [
  { name: 'Explore', path: '/en-AE/explore', external: false },
  { name: 'Features', path: '/en-AE/features', external: false },
  { name: 'OTC Desk', path: '/en-AE/features/otc-desk', external: false },
  { name: 'Company', path: '/en-AE/company', external: false },
  { name: 'Support', path: '/en-AE/support', external: false },
  { name: 'Blog', path: '/en-AE/blog', external: false },
  { name: '$MBG', path: 'https://token.multibankgroup.com/en', external: true },
];

const UTILITY_LINKS = {
  signIn: { name: 'Sign in', hrefIncludes: 'trade.mb.io/login' },
  signUp: { name: 'Sign up', hrefIncludes: 'trade.mb.io/register' },
  downloadApp: { name: 'Download the app', hrefIncludes: 'mbio.go.link' },
};

module.exports = { PRIMARY_NAV_ITEMS, UTILITY_LINKS };

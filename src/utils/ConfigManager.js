const dotenv = require('dotenv');

dotenv.config();

/**
 * Centralized, environment-aware configuration.
 * Singleton: env parsing/validation should happen exactly once per process,
 * and every page object / test should read from one source of truth instead
 * of scattering `process.env.X` lookups (and inconsistent defaults) across
 * the codebase.
 */
class ConfigManager {
  constructor() {
    if (ConfigManager._instance) {
      return ConfigManager._instance;
    }

    this.baseUrl = process.env.BASE_URL || 'https://mb.io/en-AE';
    this.actionTimeout = Number(process.env.ACTION_TIMEOUT || 15000);
    this.navigationTimeout = Number(process.env.NAVIGATION_TIMEOUT || 30000);
    this.traceMode = process.env.TRACE_MODE || 'retain-on-failure';

    ConfigManager._instance = this;
  }

  static getInstance() {
    if (!ConfigManager._instance) {
      ConfigManager._instance = new ConfigManager();
    }
    return ConfigManager._instance;
  }

  /**
   * Joins `path` onto `baseUrl` with plain string concatenation instead of
   * WHATWG URL resolution. `new URL(absolutePath, base)` replaces the base's
   * entire pathname (per spec), which silently drops the /en-AE locale
   * segment baked into BASE_URL for any root-relative path — this keeps the
   * locale intact for every route, including '/'.
   */
  url(path = '/') {
    const base = this.baseUrl.replace(/\/+$/, '');
    if (!path || path === '/') return base;
    const suffix = path.startsWith('/') ? path : `/${path}`;
    return `${base}${suffix}`;
  }

  /**
   * Resolves a real anchor `href` pulled from the DOM (root-relative or
   * relative) against the site origin. Distinct from url(): that method
   * joins a *known config path* onto BASE_URL (which includes the locale),
   * while this resolves whatever href the browser actually rendered —
   * WHATWG resolution is the correct semantics here.
   */
  resolveHref(href) {
    return new URL(href, this.baseUrl).toString();
  }
}

module.exports = { ConfigManager };

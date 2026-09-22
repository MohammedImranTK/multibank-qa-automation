const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * Lightweight leveled logger, shared as a single instance across the whole
 * run so test step output stays consistently formatted and ordered in CI
 * logs (interleaved console.log calls from many files get messy otherwise).
 */
class Logger {
  constructor() {
    if (Logger._instance) {
      return Logger._instance;
    }
    this.level = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;
    Logger._instance = this;
  }

  static getInstance() {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    return Logger._instance;
  }

  _write(level, scope, message) {
    if (LEVELS[level] < this.level) return;
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] [${level.toUpperCase()}] [${scope}] ${message}`);
  }

  debug(scope, message) {
    this._write('debug', scope, message);
  }

  info(scope, message) {
    this._write('info', scope, message);
  }

  warn(scope, message) {
    this._write('warn', scope, message);
  }

  error(scope, message) {
    this._write('error', scope, message);
  }

  step(scope, message) {
    this.info(scope, `STEP -> ${message}`);
  }
}

module.exports = { Logger };

const { request } = require('@playwright/test');
const { ConfigManager } = require('../src/utils/ConfigManager');
const { Logger } = require('../src/utils/Logger');

/**
 * Suite-level setup (the "before class" equivalent): runs once before any
 * test in any worker starts. Fails the whole run fast with one clear error
 * if the target environment is unreachable, instead of letting every test
 * time out individually and burying the real cause in 20+ failures.
 */
module.exports = async function globalSetup() {
  const config = ConfigManager.getInstance();
  const logger = Logger.getInstance();

  logger.info('GlobalSetup', `Suite starting against ${config.baseUrl}`);

  const context = await request.newContext();
  try {
    const response = await context.get(config.baseUrl, { timeout: 15_000 });
    if (!response.ok()) {
      throw new Error(
        `Environment health check failed: GET ${config.baseUrl} returned ${response.status()}. Aborting run.`
      );
    }
    logger.info('GlobalSetup', `Environment healthy (HTTP ${response.status()})`);
  } finally {
    await context.dispose();
  }

  process.env.__SUITE_STARTED_AT = String(Date.now());
};

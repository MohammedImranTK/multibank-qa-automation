const { Logger } = require('../src/utils/Logger');

/**
 * Suite-level teardown (the "after class" equivalent): runs once after every
 * test in every worker has finished. Currently just reports total wall-clock
 * duration; the natural place to add e.g. a Slack summary post-run.
 */
module.exports = async function globalTeardown() {
  const logger = Logger.getInstance();
  const startedAt = Number(process.env.__SUITE_STARTED_AT || Date.now());
  const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  logger.info('GlobalTeardown', `Suite finished in ${durationSec}s`);
};

const { defineConfig, devices } = require('@playwright/test');
const { ConfigManager } = require('./src/utils/ConfigManager');

const config = ConfigManager.getInstance();
const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./config/global-setup.js'),
  globalTeardown: require.resolve('./config/global-teardown.js'),
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit-report.xml' }],
  ],

  use: {
    baseURL: config.baseUrl,
    actionTimeout: config.actionTimeout,
    navigationTimeout: config.navigationTimeout,
    trace: config.traceMode,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
    {
      // Scoped to only the test(s) tagged @mobile: the rest of the suite
      // asserts desktop nav structure/hrefs that a collapsed mobile nav
      // doesn't expose, so re-running them under this project would be
      // testing the wrong thing rather than adding real coverage.
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      grep: /@mobile/,
    },
  ],
});

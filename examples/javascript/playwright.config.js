// @ts-check
const { devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
const config = {
  testDir: './tests',
  timeout: 60_000,
  use: {
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  reporter: [
    ['list'],
    [
      'playwright-pdf-reporter',
      {
        outputDir: './reports',
        fileName: 'js-demo-report.pdf',
        theme: 'dark',
        includeScreenshots: true,
        reportType: 'summary'
      }
    ]
  ]
};

module.exports = config;


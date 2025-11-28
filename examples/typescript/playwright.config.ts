import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    }
  ],
  reporters: [
    ['list'],
    [
      'playwright-pdf-reporter',
      {
        outputDir: './reports',
        fileName: 'ts-demo-report.pdf',
        metadata: {
          title: 'TypeScript Sample Suite',
          project: 'Sample Storefront',
          author: 'Sample QA'
        },
        historicalDataPath: './reports/history.json'
      }
    ]
  ]
});


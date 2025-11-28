# Installing Playwright PDF Reporter

Follow the steps below to integrate the reporter into any Playwright project.

## 1. Install Packages

```bash
npm install --save-dev playwright-pdf-reporter @playwright/test
```

> `@playwright/test` is declared as a peer dependency so make sure it matches the version used by your project/CI.

## 2. Update `playwright.config.(ts|js)`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporters: [
    ['list'],
    [
      'playwright-pdf-reporter',
      {
        outputDir: './reports',
        fileName: 'test-report.pdf',
        includeScreenshots: true,
        historicalDataPath: './reports/history.json',
        metadata: { title: 'Nightly Regression' }
      }
    ]
  ]
});
```

## 3. Run Your Tests

```bash
npx playwright test
```

Artifacts produced:

- `./reports/test-report.pdf` – polished PDF report
- `./reports/test-report.html` – HTML summary (if `includeHtml` is true)
- `./reports/history.json` – running history for trend charts (optional)

## 4. (Optional) Commit CI/CD Automation

- Upload PDF as build artifact.
- Email/share the PDF post-run.
- Version-control `history.json` for long-term trend analysis.

You’re ready to ship PDF automation insights from every Playwright run!


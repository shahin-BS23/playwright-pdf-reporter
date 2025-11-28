# Playwright PDF Reporter

Generate rich PDF artifacts from your Playwright test runs with zero manual effort. This reporter consumes Playwright’s native result objects/JSON output, renders a comprehensive HTML dashboard (charts, screenshots, historical trends, etc.), and finally converts it into a printable, shareable PDF using Playwright’s own Chromium engine for pixel-perfect fidelity.

## ✨ Features

- **Drop-in Reporter** – add to your `playwright.config.(ts|js)` and receive PDFs automatically after every run.
- **HTML → PDF Pipeline** – clean HTML dashboard rendered with EJS + Chart.js, converted via Playwright Chromium to PDF.
- **Rich Sections** – Execution summary, objectives, environment info, step breakdown, attachments, failure categorization, automation metrics, trends, and more.
- **Screenshots & Attachments** – Inline base64 embeds keep PDFs self-contained.
- **Themes & Modes** – Light/dark themes, summary/execution/defect/full modes.
- **Historical Insights** – Feed previous runs to highlight trends and stability.
- **TypeScript Native** – First-class typings plus CommonJS output for compatibility.
- **CI-friendly** – Deterministic outputs, metadata tags, PDF metadata, HTML artifact optional.
- **Nested Step Trees** – Captures Playwright step hierarchy, rendered identically in HTML & PDF.
- **Retry Timeline** – Each attempt (with failure screenshots) is summarized so flaky tests stand out.

## 📦 Installation

```bash
npm install playwright-pdf-reporter --save-dev
```

Peer dependency:

```bash
npm install @playwright/test --save-dev
```

## ⚙️ Usage

### 1. Wire it into Playwright

`playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    [
      'playwright-pdf-reporter',
      {
        outputDir: 'playwright-report/pdf',
        fileName: 'test-report.pdf',
        theme: 'dark',
        includeScreenshots: true,
        includeHtml: true,
        historicalDataPath: 'playwright-report/pdf/history.json',
        reportType: 'full',
        trendLabel: 'Release Train',
        metadata: {
          title: 'Release Smoke',
          project: 'Checkout Platform',
          author: 'QA Guild',
          build: process.env.BUILD_ID
        }
      }
    ]
  ]
});
```

### 2. Run Playwright

```bash
npx playwright test
```

Upon completion you’ll find:

- `./reports/release-smoke.pdf`
- `./reports/release-smoke.html` (if `includeHtml` is true)
- `./reports/history.json` (if `historicalDataPath` supplied)

### Reporter Options

| Option               | Type                 | Default                     | Description                                                                 |
| -------------------- | -------------------- | --------------------------- | --------------------------------------------------------------------------- |
| `outputDir`          | `string`             | `playwright-report/pdf`     | Destination directory for report artifacts                                  |
| `fileName`           | `string`             | `test-report.pdf`           | PDF file name (forced `.pdf` extension)                                     |
| `theme`              | `'light' \| 'dark'`  | `light`                     | Report theme                                                                |
| `includeScreenshots` | `boolean`            | `true`                      | Embed screenshot attachments as inline base64 images                        |
| `includeHtml`        | `boolean`            | `true`                      | Persist the intermediate HTML dashboard                                     |
| `historicalDataPath` | `string`             | `playwright-report/pdf/history.json` | JSON file used to plot historical trends                         |
| `reportType`         | `'summary' \| 'execution' \| 'defect' \| 'full'` | `full` | Controls sections included in the report                                    |
| `metadata`           | `ReportMetadata`     | `{}`                        | Title, author, build, project, tags, etc.                                   |
| `scope`              | `TestScope`          | defaults provided           | Objectives, datasets, criteria, risks, alignment                            |
| `customSections`     | `CustomSections`     | defaults provided           | Challenges, lessons learned, recommendations                                |
| `bugTrackerBaseUrl`  | `string`             | `undefined`                 | Prefix when auto-linking `#123` references in error stacks                  |
| `trendLabel`         | `string`             | `Overall`                   | Label applied to trend charts                                               |

### Steps & Retries Included

- Playwright step hierarchies (including nested steps) are captured per attempt and rendered inline so both HTML and PDF stay in sync.
- Retries are summarized in their own section showing every attempt, status, duration, and failure screenshots, making flaky behavior easy to inspect.

See `src/types.ts` for the full contract.

## 🧰 API

```ts
import PlaywrightPdfReporter from 'playwright-pdf-reporter';
```

| Export | Description |
| ------ | ----------- |
| `PlaywrightPdfReporter` (default) | Reporter class implementing Playwright’s Reporter API |
| `ReporterOptions` | Shape of the configuration object |

## 📁 Examples

- `examples/typescript` – Playwright TS project using the reporter.
- `examples/javascript` – Same setup but with JS config.

Each example includes:

```
examples/<lang>/
├─ tests/example.spec.<ts|js>
└─ playwright.config.<ts|js>
```

Run them via:

```bash
npm run sample:ts
# or
npm run sample:js
```

## 🧪 Testing & Docs

```bash
npm run test        # vitest
npm run typecheck   # tsc --noEmit
npm run build       # emit dist
npm run docs        # typedoc -> docs/
```

## 🛠️ Development Notes

- Source lives under `src/` (TypeScript).
- `templates/report.ejs` contains the HTML shell.
- Build output is emitted to `dist/` with declarations.
- Reporter logs the PDF path on completion (`console.log`).

## 📄 License

MIT © Playwright PDF Reporter Authors


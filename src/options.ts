import path from 'path';
import { ReporterOptions, ReporterOptionsResolved } from './types';

const defaultOptions: ReporterOptionsResolved = {
  outputDir: 'playwright-report/pdf',
  fileName: 'test-report.pdf',
  theme: 'light',
  includeScreenshots: true,
  includeHtml: true,
  reportType: 'full',
  historicalDataPath: 'playwright-report/pdf/history.json',
  trendLabel: 'Overall',
  metadata: {},
  scope: {},
  customSections: {},
  bugTrackerBaseUrl: undefined
};

export const resolveOptions = (options?: ReporterOptions): ReporterOptionsResolved => {
  const merged: ReporterOptionsResolved = {
    ...defaultOptions,
    ...options,
    metadata: {
      ...defaultOptions.metadata,
      ...options?.metadata
    },
    scope: {
      ...defaultOptions.scope,
      ...options?.scope
    },
    customSections: {
      ...defaultOptions.customSections,
      ...options?.customSections
    }
  };

  merged.outputDir = path.normalize(merged.outputDir || defaultOptions.outputDir);
  if (merged.historicalDataPath) {
    merged.historicalDataPath = path.normalize(merged.historicalDataPath);
  } else if (defaultOptions.historicalDataPath) {
    merged.historicalDataPath = path.normalize(defaultOptions.historicalDataPath);
  }

  if (!merged.fileName?.toLowerCase().endsWith('.pdf')) {
    merged.fileName = `${(merged.fileName ?? defaultOptions.fileName).replace(/\.pdf$/i, '')}.pdf`;
  }

  merged.reportType = merged.reportType ?? defaultOptions.reportType;
  merged.theme = merged.theme ?? defaultOptions.theme;
  merged.includeScreenshots = merged.includeScreenshots ?? defaultOptions.includeScreenshots;
  merged.includeHtml = merged.includeHtml ?? defaultOptions.includeHtml;
  merged.trendLabel = merged.trendLabel ?? defaultOptions.trendLabel;

  return merged;
};


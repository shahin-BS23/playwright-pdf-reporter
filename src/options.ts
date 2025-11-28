import path from 'path';
import { ReporterOptions, ReporterOptionsResolved } from './types';

const defaultOptions: ReporterOptionsResolved = {
  outputDir: 'reports/pdf',
  fileName: 'playwright-test-report.pdf',
  theme: 'light',
  includeScreenshots: true,
  includeHtml: true,
  reportType: 'full',
  historicalDataPath: undefined,
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


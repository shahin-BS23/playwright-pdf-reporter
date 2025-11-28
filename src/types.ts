import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
  TestStatus
} from '@playwright/test/reporter';

export type ReportMode = 'summary' | 'execution' | 'defect' | 'full';

export interface ReporterOptions {
  outputDir?: string;
  fileName?: string;
  theme?: 'light' | 'dark';
  includeScreenshots?: boolean;
  includeHtml?: boolean;
  historicalDataPath?: string;
  reportType?: ReportMode;
  metadata?: ReportMetadata;
  scope?: TestScope;
  customSections?: CustomSections;
  trendLabel?: string;
  bugTrackerBaseUrl?: string;
}

export interface ReportMetadata {
  title?: string;
  author?: string;
  build?: string;
  environment?: string;
  project?: string;
  release?: string;
  ciLink?: string;
  tags?: string[];
}

export interface TestScope {
  objectives?: string[];
  dataSets?: string[];
  passCriteria?: string[];
  risks?: string[];
  alignment?: string;
}

export interface CustomSections {
  challenges?: string[];
  lessonsLearned?: string[];
  recommendations?: string[];
}

export interface AttachmentSummary {
  name: string;
  contentType: string;
  path?: string;
  body?: string;
}

export interface CaseDetail {
  id: string;
  title: string;
  path: string;
  status: TestStatus;
  duration: number;
  projectName: string;
  location?: string;
  annotations: Record<string, string>;
  steps: string[];
  attachments: AttachmentSummary[];
  errors: ParsedError[];
  startedAt?: number;
  completedAt?: number;
}

export interface ParsedError {
  message: string;
  stack?: string;
  value?: TestError;
  issueLink?: string;
  category: FailureCategory;
  severity: FailureSeverity;
}

export type FailureCategory = 'functional' | 'compatibility' | 'performance' | 'infrastructure' | 'flaky' | 'unknown';
export type FailureSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SummaryStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  durationMs: number;
  startTime: number;
  endTime: number;
}

export interface AutomationMetrics {
  coveragePercent: number;
  reliabilityScore: number;
  maintainabilityIndex: number;
  reusabilityScore: number;
}

export interface EnvironmentInfo {
  browsers: string[];
  devices: string[];
  operatingSystems: string[];
  configMatrix: Array<Record<string, string>>;
}

export interface HistoricalEntry {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  coveragePercent: number;
  reliabilityScore: number;
}

export interface ReportData {
  options: ReporterOptionsResolved;
  summary: SummaryStats;
  scope: TestScopeResolved;
  metadata: ReportMetadataResolved;
  environment: EnvironmentInfo;
  cases: CaseDetail[];
  failures: CaseDetail[];
  metrics: AutomationMetrics;
  history: HistoricalEntry[];
  sections: CustomSectionsResolved;
  warnings: string[];
  reporterVersion: string;
}

export interface ReporterOptionsResolved extends ReporterOptions {
  outputDir: string;
  fileName: string;
  theme: 'light' | 'dark';
  includeScreenshots: boolean;
  includeHtml: boolean;
  historicalDataPath?: string;
  reportType: ReportMode;
  trendLabel: string;
  metadata: ReportMetadata;
  scope: TestScope;
  customSections: CustomSections;
  bugTrackerBaseUrl?: string;
}

export type TestScopeResolved = Required<TestScope>;
export type ReportMetadataResolved = Required<ReportMetadata>;
export type CustomSectionsResolved = Required<CustomSections>;

export { Reporter, FullConfig, Suite, FullResult, TestResult, TestCase, TestStatus };


import type { FullConfig } from './types';
import {
  AutomationMetrics,
  CaseDetail,
  CustomSectionsResolved,
  HistoricalEntry,
  ReportData,
  ReportMetadataResolved,
  ReporterOptionsResolved,
  SummaryStats,
  TestScopeResolved
} from './types';
import { clamp, percent } from './utils/format';
import pkg from '../package.json';

export const buildReportData = (
  cases: CaseDetail[],
  config: FullConfig | undefined,
  options: ReporterOptionsResolved,
  warnings: string[],
  historyEntries: HistoricalEntry[]
): ReportData => {
  const summary = computeSummary(cases);
  const metadata = resolveMetadata(options);
  const scope = resolveScope(options);
  const sections = resolveSections(options);
  const environment = buildEnvironment(config);
  const failures = cases.filter((item) => item.status !== 'passed');
  const metrics = computeMetrics(summary);
  const history = historyEntries.slice(-20);

  return {
    options,
    summary,
    scope,
    metadata,
    environment,
    cases,
    failures,
    metrics,
    history,
    sections,
    warnings,
    reporterVersion: pkg.version
  };
};

const computeSummary = (cases: CaseDetail[]): SummaryStats => {
  const total = cases.length;
  const passed = cases.filter((c) => c.status === 'passed').length;
  const failed = cases.filter((c) => c.status === 'failed' || c.status === 'timedOut').length;
  const skipped = cases.filter((c) => c.status === 'skipped').length;
  const flaky = cases.filter((c) => {
    if (c.annotations['flaky']) {
      return true;
    }
    if (!c.attempts || c.attempts.length < 2) {
      return false;
    }
    const latest = c.attempts[c.attempts.length - 1];
    const hadFailure = c.attempts.some((attempt) => attempt.status === 'failed');
    return latest?.status === 'passed' && hadFailure;
  }).length;
  const durationMs = cases.reduce((acc, c) => acc + (c.duration || 0), 0);
  const startTime = Math.min(...cases.map((c) => c.startedAt ?? Date.now()));
  const endTime = Math.max(...cases.map((c) => c.completedAt ?? Date.now()));

  return {
    total,
    passed,
    failed,
    skipped,
    flaky,
    durationMs,
    startTime: Number.isFinite(startTime) ? startTime : Date.now(),
    endTime: Number.isFinite(endTime) ? endTime : Date.now()
  };
};

const computeMetrics = (summary: SummaryStats): AutomationMetrics => {
  const executed = summary.total - summary.skipped;
  const coveragePercent = clamp(percent(executed, summary.total || 1));
  const reliabilityScore = clamp(percent(summary.passed, executed || 1));
  const maintainabilityIndex = clamp(100 - summary.failed * 5, 40, 100);
  const reusabilityScore = clamp(70 + summary.passed * 2 - summary.failed * 3, 40, 100);
  return {
    coveragePercent,
    reliabilityScore,
    maintainabilityIndex,
    reusabilityScore
  };
};

const resolveMetadata = (options: ReporterOptionsResolved): ReportMetadataResolved => ({
  title: options.metadata?.title ?? 'Playwright Automation Report',
  author: options.metadata?.author ?? process.env.GIT_AUTHOR_NAME ?? 'Automation Bot',
  build: options.metadata?.build ?? process.env.BUILD_ID ?? 'local',
  environment: options.metadata?.environment ?? process.env.NODE_ENV ?? 'local',
  project: options.metadata?.project ?? 'default',
  release: options.metadata?.release ?? process.env.RELEASE_NAME ?? 'rolling',
  ciLink: options.metadata?.ciLink ?? process.env.CI_JOB_URL ?? '',
  tags: options.metadata?.tags ?? []
});

const resolveScope = (options: ReporterOptionsResolved): TestScopeResolved => ({
  objectives: options.scope?.objectives ?? [
    'Validate end-to-end user journeys',
    'Ensure regression stability for critical flows'
  ],
  dataSets: options.scope?.dataSets ?? ['Synthetic test data', 'Seeded accounts'],
  passCriteria: options.scope?.passCriteria ?? [
    'All P0/P1 cases pass',
    'No critical regressions filed'
  ],
  risks: options.scope?.risks ?? ['Flaky network environments', '3rd party dependencies'],
  alignment: options.scope?.alignment ?? 'Supports release readiness and CI quality gates'
});

const resolveSections = (options: ReporterOptionsResolved): CustomSectionsResolved => ({
  challenges:
    options.customSections?.challenges ?? [
      'Intermittent latency from downstream APIs',
      'Maintenance of shared fixtures across suites'
    ],
  lessonsLearned:
    options.customSections?.lessonsLearned ?? [
      'Parallelizing specs reduced suite time by 30%',
      'Centralized test data catalog improved reusability'
    ],
  recommendations:
    options.customSections?.recommendations ?? [
      'Stabilize flaky selectors using resilient locating strategies',
      'Automate build health checks with PDF summaries in CI'
    ]
});

const buildEnvironment = (config?: FullConfig) => {
  if (!config) {
    return {
      browsers: ['chromium'],
      devices: [],
      operatingSystems: [process.platform],
      configMatrix: []
    };
  }

  const browsers = new Set<string>();
  const devices = new Set<string>();
  const osVersions = new Set<string>();
  const configMatrix: Array<Record<string, string>> = [];

  for (const project of config.projects ?? []) {
    const use = project.use as Record<string, unknown>;
    if (typeof use.browserName === 'string') {
      browsers.add(use.browserName);
    }
    if (typeof use.channel === 'string') {
      browsers.add(`${use.browserName ?? 'chromium'} (${use.channel})`);
    }
    if (typeof use.device === 'string') {
      devices.add(use.device);
    }
    if (typeof use.viewport === 'object' && use.viewport) {
      configMatrix.push({
        project: project.name,
        viewport: `${(use.viewport as { width: number; height: number }).width}x${
          (use.viewport as { width: number; height: number }).height
        }`,
        headless: `${use.headless ?? true}`
      });
    } else {
      configMatrix.push({
        project: project.name,
        headless: `${use.headless ?? true}`
      });
    }
    if (typeof use.platform === 'string') {
      osVersions.add(use.platform);
    }
  }

  if (!osVersions.size) {
    osVersions.add(process.platform);
  }

  return {
    browsers: Array.from(browsers),
    devices: Array.from(devices),
    operatingSystems: Array.from(osVersions),
    configMatrix
  };
};


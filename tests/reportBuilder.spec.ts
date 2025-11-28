import { describe, it, expect } from 'vitest';
import { buildReportData } from '../src/reportBuilder';
import { ReporterOptionsResolved, CaseDetail, StepDetail } from '../src/types';

const options = {
  outputDir: 'reports',
  fileName: 'report.pdf',
  theme: 'light',
  includeScreenshots: true,
  includeHtml: true,
  reportType: 'full',
  trendLabel: 'Overall',
  metadata: {},
  scope: {},
  customSections: {}
} as ReporterOptionsResolved;

const step = (title: string, overrides: Partial<StepDetail> = {}): StepDetail => ({
  title,
  status: 'passed',
  steps: [],
  ...overrides
});

const mockCases: CaseDetail[] = [
  {
    id: 'case-1',
    title: 'passes',
    path: 'suite › passes',
    status: 'passed',
    duration: 1200,
    projectName: 'chromium',
    annotations: {},
    steps: [step('root')],
    attachments: [],
    errors: [],
    attempts: [
      {
        index: 0,
        status: 'passed',
        duration: 1200,
        steps: [step('root')],
        attachments: [],
        errors: [],
        startedAt: Date.now(),
        completedAt: Date.now()
      }
    ],
    startedAt: Date.now(),
    completedAt: Date.now()
  },
  {
    id: 'case-2',
    title: 'fails',
    path: 'suite › fails',
    status: 'failed',
    duration: 900,
    projectName: 'chromium',
    annotations: {},
    steps: [step('root', { status: 'failed' })],
    attachments: [],
    errors: [
      {
        message: 'Timeout',
        category: 'performance',
        severity: 'high'
      } as any
    ],
    attempts: [
      {
        index: 0,
        status: 'failed',
        duration: 900,
        steps: [step('root', { status: 'failed' })],
        attachments: [],
        errors: [
          {
            message: 'Timeout',
            category: 'performance',
            severity: 'high'
          } as any
        ],
        startedAt: Date.now(),
        completedAt: Date.now()
      }
    ],
    startedAt: Date.now(),
    completedAt: Date.now()
  }
];

describe('buildReportData', () => {
  it('computes summary statistics', () => {
    const report = buildReportData(mockCases, undefined, options, [], []);
    expect(report.summary.total).toBe(2);
    expect(report.summary.passed).toBe(1);
    expect(report.summary.failed).toBe(1);
    expect(report.failures.length).toBe(1);
    expect(report.metrics.reliabilityScore).toBeGreaterThan(0);
  });

  it('uses history entries when provided', () => {
    const history = [
      {
        timestamp: new Date().toISOString(),
        total: 10,
        passed: 9,
        failed: 1,
        skipped: 0,
        durationMs: 1000,
        coveragePercent: 80,
        reliabilityScore: 90
      }
    ];
    const report = buildReportData(mockCases, undefined, options, [], history);
    expect(report.history).toHaveLength(1);
    expect(report.history[0].passed).toBe(9);
  });

  it('marks tests as flaky when retries pass after a failure', () => {
    const flakyCase: CaseDetail = {
      id: 'case-3',
      title: 'flaky test',
      path: 'suite › flaky',
      status: 'passed',
      duration: 2000,
      projectName: 'chromium',
      annotations: {},
      steps: [step('final')],
      attachments: [],
      errors: [],
      attempts: [
        {
          index: 0,
          status: 'failed',
          duration: 1000,
          steps: [step('attempt-1', { status: 'failed' })],
          attachments: [],
          errors: [
            {
              message: 'boom',
              category: 'functional',
              severity: 'high'
            } as any
          ],
          startedAt: Date.now(),
          completedAt: Date.now()
        },
        {
          index: 1,
          status: 'passed',
          duration: 1000,
          steps: [step('attempt-2')],
          attachments: [],
          errors: [],
          startedAt: Date.now(),
          completedAt: Date.now()
        }
      ],
      startedAt: Date.now(),
      completedAt: Date.now()
    };

    const report = buildReportData([...mockCases, flakyCase], undefined, options, [], []);
    expect(report.summary.flaky).toBeGreaterThanOrEqual(1);
  });
});


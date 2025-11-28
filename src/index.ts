import path from 'path';
import {
  AttachmentSummary,
  AttemptDetail,
  CaseDetail,
  FailureCategory,
  FailureSeverity,
  FullConfig,
  FullResult,
  ParsedError,
  Reporter,
  ReporterOptions,
  ReporterOptionsResolved,
  StepDetail,
  Suite,
  TestCase,
  TestResult,
  TestStatus
} from './types';
import { resolveOptions } from './options';
import { buildReportData } from './reportBuilder';
import { readHistory, writeHistory } from './historyManager';
import { htmlToPdf, persistHtmlArtifact } from './pdfGenerator';
import { renderReportHtml } from './templateRenderer';
import { readBinarySafe } from './utils/fs';
import { slugify } from './utils/format';

export default class PlaywrightPdfReporter implements Reporter {
  private readonly options: ReporterOptionsResolved;
  private config?: FullConfig;
  private suite?: Suite;
  private readonly cases: CaseDetail[] = [];
  private readonly caseMap = new Map<string, CaseDetail>();
  private readonly warnings: string[] = [];

  constructor(options?: ReporterOptions) {
    this.options = resolveOptions(options);
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suite = suite;
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    const key = this.caseKey(test);
    const attempt = await this.toAttemptDetail(test, result);
    let existing = this.caseMap.get(key);
    if (!existing) {
      existing = this.initializeCaseDetail(test, attempt);
      this.caseMap.set(key, existing);
      this.cases.push(existing);
    } else {
      this.mergeAttempt(existing, attempt);
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    if (!this.cases.length) {
      this.warnings.push('No test cases were executed.');
    }

    const history = await readHistory(this.options.historicalDataPath);
    const report = buildReportData(this.cases, this.config, this.options, this.warnings, history);
    const html = await renderReportHtml(report);
    const outputDir = path.resolve(this.options.outputDir);
    const pdfPath = path.join(outputDir, this.options.fileName);

    await htmlToPdf(html, pdfPath, report.metadata);
    if (this.options.includeHtml) {
      const htmlPath = path.join(
        outputDir,
        this.options.fileName.replace(/\.pdf$/i, '.html')
      );
      await persistHtmlArtifact(html, htmlPath);
    }

    const newEntry = {
      timestamp: new Date().toISOString(),
      total: report.summary.total,
      passed: report.summary.passed,
      failed: report.summary.failed,
      skipped: report.summary.skipped,
      durationMs: report.summary.durationMs,
      coveragePercent: report.metrics.coveragePercent,
      reliabilityScore: report.metrics.reliabilityScore
    };
    await writeHistory(this.options.historicalDataPath, [...history, newEntry]);
    console.log(`playwright-pdf-reporter: PDF generated at ${pdfPath}`);
  }

  private caseKey(test: TestCase): string {
    return test.id ?? slugify(test.titlePath().join('-'));
  }

  private buildCaseId(test: TestCase): string {
    return slugify(test.titlePath().join('-')) || `case-${this.cases.length + 1}`;
  }

  private initializeCaseDetail(test: TestCase, attempt: AttemptDetail): CaseDetail {
    return {
      id: this.buildCaseId(test),
      title: test.title,
      path: test.titlePath().join(' › '),
      status: attempt.status,
      duration: attempt.duration,
      projectName: test.parent?.project()?.name ?? 'default',
      location: test.location?.file ? `${test.location.file}:${test.location.line}` : undefined,
      annotations: Object.fromEntries(
        test.annotations.map((annotation) => [annotation.type, annotation.description ?? ''])
      ),
      steps: attempt.steps,
      attachments: attempt.attachments,
      errors: attempt.errors,
      attempts: [attempt],
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt
    };
  }

  private mergeAttempt(detail: CaseDetail, attempt: AttemptDetail): void {
    detail.duration += attempt.duration;
    detail.attempts.push(attempt);
    detail.attempts.sort((a, b) => a.index - b.index);
    const latest = detail.attempts[detail.attempts.length - 1];
    detail.status = latest.status;
    detail.steps = latest.steps;
    detail.attachments = latest.attachments;
    detail.errors = latest.errors;
    detail.startedAt =
      detail.startedAt !== undefined && attempt.startedAt !== undefined
        ? Math.min(detail.startedAt, attempt.startedAt)
        : detail.startedAt ?? attempt.startedAt;
    detail.completedAt =
      detail.completedAt !== undefined && attempt.completedAt !== undefined
        ? Math.max(detail.completedAt, attempt.completedAt)
        : detail.completedAt ?? attempt.completedAt;
  }

  private async toAttemptDetail(test: TestCase, result: TestResult): Promise<AttemptDetail> {
    const attachments = await this.collectAttachments(result);
    return {
      index: result.retry ?? 0,
      status: mapStatus(result.status),
      duration: result.duration,
      steps: extractSteps(result),
      attachments,
      errors: mapErrors(result, this.options.bugTrackerBaseUrl),
      startedAt: result.startTime?.getTime(),
      completedAt:
        result.startTime && result.duration ? result.startTime.getTime() + result.duration : undefined
    };
  }

  private async collectAttachments(result: TestResult): Promise<AttachmentSummary[]> {
    const entries = result.attachments ?? [];
    const output: AttachmentSummary[] = [];
    for (const attachment of entries) {
      const summary: AttachmentSummary = {
        name: attachment.name ?? attachment.contentType ?? 'attachment',
        contentType: attachment.contentType ?? 'application/octet-stream',
        path: attachment.path
      };
      if (
        this.options.includeScreenshots &&
        attachment.path &&
        summary.contentType.startsWith('image/')
      ) {
        const buffer = await readBinarySafe(attachment.path);
        if (buffer) {
          summary.body = `data:${summary.contentType};base64,${buffer.toString('base64')}`;
        }
      }
      output.push(summary);
    }
    return output;
  }
}

const mapErrors = (result: TestResult, bugTrackerBaseUrl?: string): ParsedError[] =>
  (result.errors ?? []).map((error) => ({
    message: error.message ?? 'Unknown error',
    stack: error.stack,
    value: error,
    issueLink: deriveIssueLink(error, bugTrackerBaseUrl),
    category: categorizeFailure(error),
    severity: classifySeverity(error)
  }));

const mapStatus = (status: TestStatus | undefined): TestStatus => {
  if (status === 'timedOut') return 'failed';
  return status ?? 'skipped';
};

type RawStep = {
  title: string;
  category?: string;
  duration?: number;
  error?: unknown;
  steps?: RawStep[];
};

const HOOK_KEYWORDS = ['beforeall', 'afterall', 'beforeeach', 'aftereach'];
const IGNORED_STEP_CATEGORIES = new Set(['hook', 'fixture']);

const extractSteps = (result: TestResult): StepDetail[] => {
  const rawSteps = (result as unknown as { steps?: RawStep[] }).steps;
  if (!Array.isArray(rawSteps)) {
    return [];
  }

  const shouldIgnore = (step: RawStep): boolean => {
    const category = step.category?.toLowerCase();
    if (category && IGNORED_STEP_CATEGORIES.has(category)) {
      return true;
    }
    const normalizedTitle = step.title?.toLowerCase() ?? '';
    return HOOK_KEYWORDS.some((keyword) => normalizedTitle.includes(keyword));
  };

  const toStepList = (step: RawStep): StepDetail[] => {
    const childSteps = Array.isArray(step.steps) ? step.steps.flatMap(toStepList) : [];
    if (shouldIgnore(step)) {
      return childSteps;
    }
    return [
      {
        title: step.title,
        status: step.error ? 'failed' : 'passed',
        category: step.category,
        duration: step.duration,
        steps: childSteps
      }
    ];
  };

  return rawSteps.flatMap(toStepList);
};

const deriveIssueLink = (error: TestResult['errors'][number], base?: string): string | undefined => {
  if (!base || !error?.message) {
    return undefined;
  }
  const match = error.message.match(/#(\d+)/);
  if (!match) return undefined;
  return `${base.replace(/\/$/, '')}/${match[1]}`;
};

const categorizeFailure = (error: TestResult['errors'][number]): FailureCategory => {
  const message = error?.message ?? '';
  if (/timeout/i.test(message)) return 'performance';
  if (/not found|selector/i.test(message)) return 'functional';
  if (/browser|protocol|websocket/i.test(message)) return 'compatibility';
  if (/network|fetch|timeout|ECONN/i.test(message)) return 'infrastructure';
  return 'unknown';
};

const classifySeverity = (error: TestResult['errors'][number]): FailureSeverity => {
  if (!error?.message) return 'medium';
  if (/critical|crash|data loss/i.test(error.message)) return 'critical';
  if (/timeout|not found|detached/i.test(error.message)) return 'high';
  if (/flaky|retry/i.test(error.message)) return 'low';
  return 'medium';
};

export { PlaywrightPdfReporter };
export type { ReporterOptions } from './types';


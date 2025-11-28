import path from 'path';
import {
  AttachmentSummary,
  CaseDetail,
  FullConfig,
  FullResult,
  Reporter,
  ReporterOptions,
  ReporterOptionsResolved,
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
  private readonly warnings: string[] = [];

  constructor(options?: ReporterOptions) {
    this.options = resolveOptions(options);
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suite = suite;
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    const detail = await this.toCaseDetail(test, result);
    this.cases.push(detail);
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

  private async toCaseDetail(test: TestCase, result: TestResult): Promise<CaseDetail> {
    const id = slugify(test.titlePath().join('-')) || `case-${this.cases.length + 1}`;
    const attachments = await this.collectAttachments(result);
    return {
      id,
      title: test.title,
      path: test.titlePath().join(' › '),
      status: mapStatus(result.status),
      duration: result.duration,
      projectName: test.parent?.project()?.name ?? 'default',
      location: test.location?.file ? `${test.location.file}:${test.location.line}` : undefined,
      annotations: Object.fromEntries(
        test.annotations.map((annotation) => [annotation.type, annotation.description ?? ''])
      ),
      steps: extractSteps(result),
      attachments,
      errors: (result.errors ?? []).map((error) => ({
        message: error.message ?? 'Unknown error',
        stack: error.stack,
        value: error,
        issueLink: deriveIssueLink(error, this.options.bugTrackerBaseUrl),
        category: categorizeFailure(error),
        severity: classifySeverity(error)
      })),
      startedAt: result.startTime?.getTime(),
      completedAt: result.startTime && result.duration ? result.startTime.getTime() + result.duration : undefined
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

const mapStatus = (status: TestStatus | undefined): TestStatus => {
  if (status === 'timedOut') return 'failed';
  return status ?? 'skipped';
};

const extractSteps = (result: TestResult): string[] => {
  const rawSteps = (result as unknown as { steps?: Array<{ title: string; category?: string; error?: TestResult['errors']; duration?: number }> }).steps;
  if (!Array.isArray(rawSteps)) {
    return [];
  }
  return rawSteps.map((step) => {
    const status = step.error ? '❌' : '✅';
    return `${status} ${step.title}${step.category ? ` (${step.category})` : ''}`;
  });
};

const deriveIssueLink = (error: TestResult['errors'][number], base?: string): string | undefined => {
  if (!base || !error?.message) {
    return undefined;
  }
  const match = error.message.match(/#(\d+)/);
  if (!match) return undefined;
  return `${base.replace(/\/$/, '')}/${match[1]}`;
};

const categorizeFailure = (error: TestResult['errors'][number]) => {
  const message = error?.message ?? '';
  if (/timeout/i.test(message)) return 'performance';
  if (/not found|selector/i.test(message)) return 'functional';
  if (/browser|protocol|websocket/i.test(message)) return 'compatibility';
  if (/network|fetch|timeout|ECONN/i.test(message)) return 'infrastructure';
  return 'unknown';
};

const classifySeverity = (error: TestResult['errors'][number]) => {
  if (!error?.message) return 'medium';
  if (/critical|crash|data loss/i.test(error.message)) return 'critical';
  if (/timeout|not found|detached/i.test(error.message)) return 'high';
  if (/flaky|retry/i.test(error.message)) return 'low';
  return 'medium';
};

export { PlaywrightPdfReporter };
export type { ReporterOptions } from './types';


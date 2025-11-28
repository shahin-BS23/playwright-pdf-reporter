import { promises as fs } from 'fs';
import path from 'path';
import ejs from 'ejs';
import { ReportData, StepDetail } from './types';
import { loadChartBundle } from './chartLoader';
import { formatDuration, percent, toDateTimeString, formatNumber } from './utils/format';

type CompiledTemplate = (data: Record<string, unknown>) => string;

let cachedTemplate: CompiledTemplate | undefined;

const getTemplate = async (): Promise<CompiledTemplate> => {
  if (cachedTemplate) {
    return cachedTemplate;
  }
  const templatePath = path.resolve(__dirname, '..', 'templates', 'report.ejs');
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  cachedTemplate = ejs.compile(templateContent, { client: false });
  return cachedTemplate;
};

export const renderReportHtml = async (report: ReportData): Promise<string> => {
  const template = await getTemplate();
  const chartScript = await loadChartBundle();
  return template({
    data: report,
    chartScript,
    helpers: {
      formatDuration,
      percent,
      toDateTimeString,
      formatNumber,
      renderSteps: (steps: StepDetail[]) => renderStepTree(steps),
      escapeHtml,
      renderErrorMessage
    }
  });
};

const escapeHtml = (value: string): string =>
  value
    ?.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;') ?? '';

const renderStepTree = (steps: StepDetail[]): string => {
  if (!steps || !steps.length) {
    return '';
  }
  const build = (nodes: StepDetail[]): string =>
    nodes
      .map((node) => {
        const icon = node.status === 'failed' ? '❌' : '✅';
        const category = node.category ? ` <span class="step-category">(${escapeHtml(node.category)})</span>` : '';
        const duration =
          typeof node.duration === 'number' && node.duration > 0
            ? ` <span class="step-duration">${escapeHtml(formatDuration(node.duration))}</span>`
            : '';
        const children =
          node.steps && node.steps.length ? `<ul class="steps-tree">${build(node.steps)}</ul>` : '';
        return `<li><span class="step-node step-${node.status}">${icon} ${escapeHtml(node.title)}${category}${duration}</span>${children}</li>`;
      })
      .join('');

  return `<ul class="steps-tree">${build(steps)}</ul>`;
};

const renderErrorMessage = (message?: string): string => {
  if (!message) {
    return '<span class="error-line muted">No error message supplied.</span>';
  }
  const lines = message.split(/\r?\n/);
  const html = lines
    .map((line) => {
      const trimmed = line.trim();
      const classes = ['error-line'];
      if (/Expected:/i.test(trimmed)) {
        classes.push('expected');
      } else if (/Received:/i.test(trimmed)) {
        classes.push('received');
      } else if (/at\s/i.test(trimmed)) {
        classes.push('stack');
      }
      return `<span class="${classes.join(' ')}">${escapeHtml(line)}</span>`;
    })
    .join('<br />');
  return html;
};


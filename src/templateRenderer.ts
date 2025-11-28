import { promises as fs } from 'fs';
import path from 'path';
import ejs from 'ejs';
import { ReportData } from './types';
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
      formatNumber
    }
  });
};


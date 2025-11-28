import { promises as fs } from 'fs';
import path from 'path';

let cachedChartBundle: string | undefined;

export const loadChartBundle = async (): Promise<string> => {
  if (cachedChartBundle) {
    return cachedChartBundle;
  }

  const chartEntry = require.resolve('chart.js');
  const chartPath = path.resolve(path.dirname(chartEntry), 'chart.umd.js');
  cachedChartBundle = await fs.readFile(chartPath, 'utf-8');
  return cachedChartBundle;
};


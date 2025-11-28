import { promises as fs } from 'fs';

let cachedChartBundle: string | undefined;

export const loadChartBundle = async (): Promise<string> => {
  if (cachedChartBundle) {
    return cachedChartBundle;
  }

  const chartPath = require.resolve('chart.js/dist/chart.umd.js');
  cachedChartBundle = await fs.readFile(chartPath, 'utf-8');
  return cachedChartBundle;
};


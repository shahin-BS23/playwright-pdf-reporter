import { promises as fs } from 'fs';
import path from 'path';

let cachedChartBundle: string | undefined;

export const loadChartBundle = async (): Promise<string> => {
  if (cachedChartBundle) {
    return cachedChartBundle;
  }

  const chartPackageJson = require.resolve('chart.js/package.json');
  const chartPath = path.resolve(path.dirname(chartPackageJson), 'dist', 'chart.umd.js');
  cachedChartBundle = await fs.readFile(chartPath, 'utf-8');
  return cachedChartBundle;
};


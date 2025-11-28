import path from 'path';
import { HistoricalEntry } from './types';
import { fileExists, readFileSafe, writeFileSafe, ensureDir } from './utils/fs';

export const readHistory = async (historyPath?: string): Promise<HistoricalEntry[]> => {
  if (!historyPath) {
    return [];
  }
  const absolute = path.resolve(historyPath);
  if (!(await fileExists(absolute))) {
    return [];
  }
  const raw = await readFileSafe(absolute);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as HistoricalEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeHistory = async (
  historyPath: string | undefined,
  entries: HistoricalEntry[]
): Promise<void> => {
  if (!historyPath) return;
  const absolute = path.resolve(historyPath);
  await ensureDir(path.dirname(absolute));
  await writeFileSafe(absolute, JSON.stringify(entries, null, 2));
};


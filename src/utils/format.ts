export const formatDuration = (ms: number): string => {
  if (!ms || Number.isNaN(ms)) {
    return '0s';
  }
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remainingSeconds = seconds % 60;
  const remainingMinutes = mins % 60;

  const parts: string[] = [];
  if (hrs) parts.push(`${hrs}h`);
  if (remainingMinutes) parts.push(`${remainingMinutes}m`);
  if (remainingSeconds || parts.length === 0) parts.push(`${remainingSeconds}s`);
  return parts.join(' ');
};

export const percent = (value: number, total: number): number => {
  if (!total) return 0;
  return Math.round((value / total) * 10000) / 100;
};

export const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(Math.max(value, min), max);

export const toDateTimeString = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const formatNumber = (value: number): string =>
  Intl.NumberFormat().format(value);

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');


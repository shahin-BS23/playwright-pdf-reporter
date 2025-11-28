import path from 'path';
import { describe, it, expect } from 'vitest';
import { resolveOptions } from '../src/options';

describe('resolveOptions', () => {
  it('applies defaults when no options provided', () => {
    const result = resolveOptions();
    expect(result.outputDir).toBe(path.normalize('playwright-report/pdf'));
    expect(result.fileName).toBe('test-report.pdf');
    expect(result.includeScreenshots).toBe(true);
    expect(result.reportType).toBe('full');
    expect(result.historicalDataPath).toBe(path.normalize('playwright-report/pdf/history.json'));
  });

  it('normalizes file names and merges nested objects', () => {
    const result = resolveOptions({
      fileName: 'summary',
      metadata: { title: 'Custom Title' },
      scope: { objectives: ['Smoke'] }
    });
    expect(result.fileName).toBe('summary.pdf');
    expect(result.metadata.title).toBe('Custom Title');
    expect(result.scope.objectives).toEqual(['Smoke']);
    expect(result.scope.risks).toBeUndefined();
  });
});


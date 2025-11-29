import path from 'path';
import { chromium } from 'playwright-core';
import { ReportMetadataResolved } from './types';
import { ensureDir, writeFileSafe } from './utils/fs';

export const htmlToPdf = async (
  html: string,
  pdfPath: string,
  metadata: ReportMetadataResolved
): Promise<void> => {
  await ensureDir(path.dirname(pdfPath));
  const browser = await chromium.launch({
    headless: true
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.addStyleTag({
      content: `
        @page {
          size: A4;
          margin: 24px;
        }
      `
    });
    await page.evaluate(
      ({ title, author }) => {
        document.title = title;
        document.documentElement.setAttribute('data-author', author);
      },
      { title: metadata.title, author: metadata.author }
    );
    // Give charts/layout a brief moment to settle without adding a large delay.
    await page.waitForTimeout(100);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false
    });
  } finally {
    await browser.close();
  }
};

export const persistHtmlArtifact = async (html: string, filePath: string): Promise<void> => {
  await writeFileSafe(filePath, html, 'utf-8');
};


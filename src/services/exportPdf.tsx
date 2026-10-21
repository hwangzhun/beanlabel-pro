import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { PrintJobItem } from '../types';
import { A4Page } from '../components/A4PrintLayout';
import { A4, MM_TO_CSS_PX, paginateQueue, PRINT_DPI } from '../utils/printLayout';
import { waitForPrintAssets, withTimeout } from '../utils/printAssets';
import { JPEG_QUALITY, PDF_IMAGE_COMPRESSION } from '../config/print_to_pdf_quality.config';

/** Render just one unscaled page at a time so mobile devices don't hold all canvases. */
export async function exportQueuePdf(queue: PrintJobItem[], onProgress: (current: number, total: number) => void): Promise<Blob> {
  const pages = paginateQueue(queue);
  if (!pages.length) throw new Error('请先添加标签到打印队列');
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, { position: 'fixed', left: '-10000px', top: '0', width: '210mm', pointerEvents: 'none' });
  document.body.appendChild(host);
  // html2canvas measures baselines in the live document using a hidden inline
  // image. Tailwind's img display:block breaks that probe and clips flavor text.
  const baselineStyle = document.createElement('style');
  baselineStyle.textContent = 'body > div[style*="visibility: hidden"] > img { display: inline; }';
  document.head.appendChild(baselineStyle);
  const root = createRoot(host);
  try {
    for (const [index, page] of pages.entries()) {
      onProgress(index + 1, pages.length);
      flushSync(() => root.render(<A4Page key={index} page={page} />));
      const element = host.querySelector<HTMLElement>('[data-print-page]')!;
      await waitForPrintAssets(element);
      // Canvas height stays below Safari's dimension limits at 300 DPI.
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = Math.round(A4.width / 25.4 * PRINT_DPI);
      outputCanvas.height = Math.round(A4.height / 25.4 * PRINT_DPI);
      try {
        const canvas = await html2canvas(element, {
          canvas: outputCanvas, width: A4.width * MM_TO_CSS_PX, height: A4.height * MM_TO_CSS_PX,
          scale: PRINT_DPI / 96, backgroundColor: '#ffffff', useCORS: true, allowTaint: false,
          logging: false, imageTimeout: 30000, windowWidth: 1280, windowHeight: 1200,
          onclone: async clonedDocument => { await withTimeout(clonedDocument.fonts.ready, '导出时字体加载超时，请重试'); },
        });
        if (index > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(canvas.toDataURL('image/jpeg', JPEG_QUALITY), 'JPEG', 0, 0, A4.width, A4.height, undefined, PDF_IMAGE_COMPRESSION);
      } finally {
        outputCanvas.width = 0;
        outputCanvas.height = 0;
      }
    }
    return pdf.output('blob');
  } finally {
    root.unmount();
    host.remove();
    baselineStyle.remove();
  }
}

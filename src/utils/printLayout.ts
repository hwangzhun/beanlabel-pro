import type { LabelSize, PrintJobItem } from '../types';

export const A4 = { width: 210, height: 297 };
export const MM_TO_CSS_PX = 96 / 25.4;
export const PRINT_DPI = 300;
export function getPrintGrid(size: LabelSize) {
  return size === '60x85'
    ? { cols: 3, rows: 3, capacity: 9, width: 60, height: 85 }
    : { cols: 2, rows: 4, capacity: 8, width: 105, height: 74.25 };
}
export interface PrintLabel {
  uniqueId: string;
  jobId: string;
  bean: PrintJobItem['bean'];
}
export interface PrintPage { size: LabelSize; items: PrintLabel[] }
/** A size change starts a new page, keeping the queue's original order. */
export function paginateQueue(queue: PrintJobItem[]): PrintPage[] {
  const pages: PrintPage[] = [];
  for (const job of queue) {
    if (!Number.isSafeInteger(job.quantity) || job.quantity < 1) continue;
    const size = job.bean.labelSize || '105x74';
    for (let index = 0; index < job.quantity; index++) {
      let page = pages.at(-1);
      if (!page || page.size !== size || page.items.length === getPrintGrid(size).capacity) {
        page = { size, items: [] };
        pages.push(page);
      }
      page.items.push({ uniqueId: `${job.id}-${index}`, jobId: job.id, bean: job.bean });
    }
  }
  return pages;
}
export function fitLabel(canvasWidth: number, canvasHeight: number, size: LabelSize) {
  const grid = getPrintGrid(size);
  const width = grid.width * MM_TO_CSS_PX;
  const height = grid.height * MM_TO_CSS_PX;
  const scale = Math.min(width / canvasWidth, height / canvasHeight);
  return { scale, left: (width - canvasWidth * scale) / 2, top: (height - canvasHeight * scale) / 2 };
}

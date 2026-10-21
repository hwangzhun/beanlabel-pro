import React from 'react';
import type { PrintJobItem } from '../types';
import { Label } from './Label';
import { X } from 'lucide-react';
import { LABEL_CONFIG } from '../config/labelConfig';
import { A4, fitLabel, getPrintGrid, paginateQueue, type PrintPage } from '../utils/printLayout';

export const A4Page: React.FC<{ page: PrintPage; onRemoveItem?: (id: string) => void }> = ({ page, onRemoveItem }) => {
  const grid = getPrintGrid(page.size);
  const fit = fitLabel(LABEL_CONFIG.width, LABEL_CONFIG.height, page.size);
  return (
    <div className="print-page relative bg-white shrink-0" data-print-page data-label-size={page.size}
      style={{ width: `${A4.width}mm`, height: `${A4.height}mm`, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${grid.cols}, ${grid.width}mm)`,
        gridTemplateRows: `repeat(${grid.rows}, ${grid.height}mm)`, justifyContent: 'center', alignContent: 'start' }}>
        {page.items.map(item => (
          <div key={item.uniqueId} className="relative" style={{ width: `${grid.width}mm`, height: `${grid.height}mm`, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: fit.left, top: fit.top, width: LABEL_CONFIG.width, height: LABEL_CONFIG.height,
              transform: `scale(${fit.scale})`, transformOrigin: 'top left' }}>
              <Label bean={item.bean} showBorder={false} />
            </div>
            {onRemoveItem && <button type="button" data-html2canvas-ignore onClick={() => onRemoveItem(item.uniqueId)}
              aria-label={`移除 ${item.bean.name || '标签'} 一张`} title="移除此标签"
              className="absolute top-1 right-1 z-10 bg-white/90 text-red-600 border border-red-100 rounded-full p-1">
              <X size={14} />
            </button>}
          </div>
        ))}
      </div>
    </div>
  );
};
export const A4PrintLayout: React.FC<{
  queue: PrintJobItem[]; onRemoveItem?: (id: string) => void; printRef?: React.RefObject<HTMLDivElement | null>;
}> = ({ queue, onRemoveItem, printRef }) => {
  const pages = paginateQueue(queue);
  return <div ref={printRef} className="flex flex-col items-center gap-6 py-4">
    {pages.length === 0 ? <div style={{ width: '210mm', height: '297mm' }} className="bg-white flex items-center justify-center text-gray-400">队列为空</div>
      : pages.map((page, index) => <div key={index} className="shadow-xl"><A4Page page={page} onRemoveItem={onRemoveItem} /></div>)}
  </div>;
};

import type { PrintJobItem } from '../types';
export const QUEUE_STORAGE_KEY = 'beanlabel.printQueue.v1';
export function parsePrintQueue(raw: string | null): PrintJobItem[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const ids = new Set<string>();
    return value.filter((item): item is PrintJobItem => {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id || ids.has(item.id)) return false;
      const bean = item.bean;
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 15 || !bean || typeof bean !== 'object') return false;
      const strings = ['id', 'country', 'nameCnPrefix', 'nameCnSuffix', 'nameEnPrefix', 'nameEnSuffix', 'process', 'roastLevel', 'altitude', 'flavorCn', 'flavorEn'];
      if (!strings.every(key => typeof bean[key] === 'string')) return false;
      if (!['105x74', '60x85'].includes(bean.labelSize) || !['espresso', 'pour_over'].includes(bean.brewingMethod)) return false;
      if (!['default', 'kraft', 'dark', 'minimal'].includes(bean.backgroundTheme) || !Number.isFinite(bean.acidityValue)) return false;
      if (['name', 'origin', 'weight', 'roastDate'].some(key => bean[key] !== undefined && typeof bean[key] !== 'string')) return false;
      ids.add(item.id);
      return true;
    });
  } catch { return []; }
}
export function restorePrintQueue(): PrintJobItem[] {
  try { return parsePrintQueue(sessionStorage.getItem(QUEUE_STORAGE_KEY)); } catch { return []; }
}
export function localToday(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateQueue, fitLabel, getPrintGrid, MM_TO_CSS_PX } from '../src/utils/printLayout.ts';
import { parsePrintQueue, restorePrintQueue, QUEUE_STORAGE_KEY } from '../src/utils/printQueue.ts';
import { INITIAL_BEAN } from '../src/types.ts';
const job = (id, quantity, size = '105x74') => ({ id, quantity, bean: { ...INITIAL_BEAN, id: `bean-${id}`, labelSize: size } });

test('empty queues have no printable pages', () => assert.deepEqual(paginateQueue([]), []));
test('quantities expand across full pages without changing order or IDs', () => {
  const pages = paginateQueue([job('a', 9), job('b', 8)]);
  assert.deepEqual(pages.map(page => page.items.length), [8, 8, 1]);
  assert.deepEqual(pages.flatMap(page => page.items.map(item => item.uniqueId)), [
    ...Array.from({ length: 9 }, (_, i) => `a-${i}`), ...Array.from({ length: 8 }, (_, i) => `b-${i}`),
  ]);
});
test('nine portrait labels fit on one page; the tenth starts another', () => {
  assert.deepEqual(paginateQueue([job('a', 10, '60x85')]).map(page => page.items.length), [9, 1]);
});
test('a size transition starts a page even when previous or later sizes match', () => {
  const pages = paginateQueue([job('a', 1), job('b', 2, '60x85'), job('c', 1)]);
  assert.deepEqual(pages.map(page => [page.size, page.items.length]), [['105x74', 1], ['60x85', 2], ['105x74', 1]]);
});
test('both label sizes fit the entire canvas and are centered without cropping', () => {
  for (const size of ['105x74', '60x85']) {
    const fit = fitLabel(1240, 877, size);
    const grid = getPrintGrid(size);
    assert.ok(fit.left >= 0 && fit.top >= 0);
    assert.ok(Math.abs(1240 * fit.scale + fit.left * 2 - grid.width * MM_TO_CSS_PX) < 0.0001);
    assert.ok(Math.abs(877 * fit.scale + fit.top * 2 - grid.height * MM_TO_CSS_PX) < 0.0001);
    assert.ok(grid.width * grid.cols <= 210 && grid.height * grid.rows <= 297);
  }
});
test('queue storage round-trips separate bean snapshots and parameters', () => {
  const source = job('a', 2); source.bean.weight = '200g'; source.bean.roastDate = '2026-10-10';
  const restored = parsePrintQueue(JSON.stringify([source]));
  assert.deepEqual(restored, [source]);
  restored[0].bean.weight = '300g';
  assert.equal(source.bean.weight, '200g');
});
test('corrupt storage, duplicates, invalid quantities and malformed beans are discarded', () => {
  for (const raw of [null, 'bad json', '{}', 'null']) assert.deepEqual(parsePrintQueue(raw), []);
  const valid = job('a', 1);
  const invalid = [job('zero', 0), job('fraction', 1.5), job('large', 16), { ...job('invalid', 1), bean: {} }, { ...job('invalid2', 1), bean: { ...INITIAL_BEAN, flavorCn: {} } }];
  assert.deepEqual(parsePrintQueue(JSON.stringify([valid, ...invalid, valid])), [valid]);
});
test('session restore reads its versioned key and safely handles denied storage', () => {
  globalThis.sessionStorage = { getItem: key => { assert.equal(key, QUEUE_STORAGE_KEY); return JSON.stringify([job('a', 1)]); } };
  assert.equal(restorePrintQueue().length, 1);
  globalThis.sessionStorage = { getItem: () => { throw new Error('denied'); } };
  assert.deepEqual(restorePrintQueue(), []);
  delete globalThis.sessionStorage;
});

// Management layout and navigation checks use only intercepted, in-memory labels.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { INITIAL_BEAN } from '../src/types.ts';
const base = process.env.BEANLABEL_TEST_URL || 'http://127.0.0.1:2000';
const output = process.env.BEANLABEL_TEST_OUTPUT || '/tmp/beanlabel-verification';
await fs.mkdir(output, { recursive: true });
const records = Array.from({ length: 24 }, (_, i) => ({ ...INITIAL_BEAN, id: `layout-${i}`, nameCnPrefix: `精品咖啡 ${i}`, nameCnSuffix: '埃塞俄比亚高海拔水洗花香长名称', country: 'ethiopia', labelSize: i % 2 ? '60x85' : '105x74' }));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/templates')) return request.respond({ status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: JSON.stringify(records) });
    return request.continue();
  });
  await browser.setCookie({ name: 'beanlabel_design_auth', value: 'authenticated', url: base });
  const click = async text => {
    const handle = await page.evaluateHandle(text => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text && el.getClientRects().length), text);
    assert.ok(handle.asElement(), `visible button: ${text}`);
    await handle.asElement().click();
    await handle.dispose();
  };
  const assertViewport = async () => {
    assert.ok(await page.evaluate(() => document.body.scrollWidth <= innerWidth), 'no horizontal overflow');
    assert.ok(await page.$eval('.manage-header-actions', el => { const r = el.getBoundingClientRect(); return r.right <= innerWidth && r.bottom <= innerHeight; }), 'header actions fit viewport');
  };
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewport({ width, height: 900 });
    await page.goto(`${base}/#/edit`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#manage-search', { visible: true });
    await assertViewport();
    assert.equal(await page.$eval('.manage-label-grid', el => getComputedStyle(el).gridTemplateColumns.split(' ').length), width >= 1200 ? 3 : width >= 768 ? 2 : 1);
    await page.screenshot({ path: `${output}/manage-library-top-${width}.png` });
    await page.click('#manage-search', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#manage-search', '精品咖啡');
    const scrollTop = await page.$eval('.manage-library', el => { el.scrollTop = 350; return el.scrollTop; });
    assert.ok(scrollTop > 0, 'fixture provides a scrollable library');
    // Select a card in the current viewport, without changing the scroll offset.
    await page.evaluate(() => {
      const panel = document.querySelector('.manage-library').getBoundingClientRect();
      [...document.querySelectorAll('.manage-card-action button')].find(el => { const r = el.getBoundingClientRect(); return r.top > panel.top && r.bottom < panel.bottom; }).focus({ preventScroll: true });
    });
    await page.keyboard.press('Enter');
    await page.waitForSelector('.manage-editor', { visible: true });
    assert.equal(await page.$eval('.manage-page-title', el => el === document.activeElement), true, 'editor heading receives focus');
    await assertViewport();
    await page.screenshot({ path: `${output}/manage-editor-top-${width}.png` });
    await page.$eval('.manage-form-panel', el => { el.scrollTop = el.scrollHeight; });
    assert.ok(await page.$eval('.manage-header-actions button', el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), 'save remains visible while form scrolls');
    if (width < 992) await click('预览');
    await page.waitForFunction(() => {
      const paper = document.querySelector('.manage-preview-panel .label-artwork');
      const stage = document.querySelector('.manage-preview-panel .manage-preview-stage');
      if (!paper || !stage) return false;
      const p = paper.getBoundingClientRect(), s = stage.getBoundingClientRect();
      return p.width > 100 && p.height > 100 && p.left >= s.left - 1 && p.right <= s.right + 1 && p.top >= s.top - 1 && p.bottom <= s.bottom + 1;
    });
    await page.screenshot({ path: `${output}/manage-editor-${width}.png` });
    await click('放大预览');
    await page.waitForSelector('[role="dialog"]', { visible: true });
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), 'preview dialog traps focus');
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { hidden: true });
    await page.waitForFunction(() => document.activeElement?.textContent.includes('放大预览'));
    await click('返回标签库');
    await page.waitForSelector('#manage-search', { visible: true });
    await assertViewport();
    assert.equal(await page.$eval('#manage-search', el => el.value), '精品咖啡', 'search is preserved');
    assert.equal(await page.$eval('.manage-library', el => el.scrollTop), scrollTop, 'scroll position is preserved');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent.trim()), '编辑标签', 'focus returns to selected card');
    await page.screenshot({ path: `${output}/manage-library-${width}.png` });
  }
  for (const id of ['layout-0', 'layout-1']) {
    await page.goto(`${base}/#/edit?id=${id}`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.manage-editor', { visible: true });
    await click('预览');
    await page.waitForFunction(() => document.querySelector('.manage-preview-panel .label-artwork')?.getBoundingClientRect().height > 100);
    await page.screenshot({ path: `${output}/manage-${id}-portrait-or-landscape.png` });
    await click('信息');
    await page.$eval('input[placeholder="前缀 (Light)"]', el => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '未保存的修改'); el.dispatchEvent(new Event('input', { bubbles: true })); });
    const dismissed = new Promise(resolve => page.once('dialog', async dialog => { await dialog.dismiss(); resolve(); }));
    await click('返回标签库'); await dismissed;
    assert.ok(await page.$('.manage-editor'), 'canceling discard keeps editor');
    const accepted = new Promise(resolve => page.once('dialog', async dialog => { await dialog.accept(); resolve(); }));
    await click('返回标签库'); await accepted;
    await page.waitForSelector('#manage-search', { visible: true });
    await click('新建标签');
    assert.equal(await page.$eval('input[placeholder="前缀 (Light)"]', el => el.value), '', 'discarded values do not leak into a new label');
    await click('保存标签');
    await page.waitForSelector('[role="alert"]', { visible: true });
    assert.ok(await page.$eval('[role="alert"]', el => el.textContent.includes('标签名称不能为空')));
  }
  assert.deepEqual(errors, []);
  console.log('PASS: management 1440/1024/768/390 layouts, preview fitting/modal focus, search/scroll/focus restoration, direct links, discard and validation');
} finally { await browser.close(); }

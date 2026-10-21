// All CRUD requests are intercepted in memory; this check never writes real labels.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { INITIAL_BEAN } from '../src/types.ts';
const base = process.env.BEANLABEL_TEST_URL || 'http://127.0.0.1:2000';
const output = process.env.BEANLABEL_TEST_OUTPUT || '/tmp/beanlabel-verification';
await fs.mkdir(output, { recursive: true });
const fixture = (id, size = '105x74') => ({ ...INITIAL_BEAN, id, country: 'ethiopia', labelSize: size,
  name: id, nameCnPrefix: '埃塞俄比亚高海拔精品咖啡测试名称', nameCnSuffix: '水洗花香', nameEnPrefix: 'Ethiopia High Altitude Specialty Coffee Long Name', nameEnSuffix: 'Floral Washed',
  process: '水洗', roastLevel: '浅烘', altitude: '1800', flavorCn: '茉莉花、柑橘、蜂蜜', flavorEn: 'Jasmine, Citrus, Honey' });
const browser = await puppeteer.launch({ headless: true, acceptInsecureCerts: true, args: ['--no-sandbox'] });
let backendPdfRequests = 0;
let oldFontRequests = 0;
let failList = false;
let failSave = false;
let failDelete = false;
let failImage = false;
let failFonts = false;
let failAI = false;
let records = [fixture('horizontal'), fixture('portrait', '60x85')];
const pageErrors = [];
async function prepare(page) {
  await page.setRequestInterception(true);
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', async request => {
    const url = new URL(request.url());
    if (url.hostname.includes('myqcloud.com')) oldFontRequests++;
    if (url.pathname === '/api/export-pdf') { backendPdfRequests++; return request.abort(); }
    if (failFonts && url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/misans@')) return request.abort();
    if (failImage && url.pathname === '/flags/ethiopia.png') return request.abort();
    if (url.pathname.endsWith('/chat/completions')) {
      const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      const isName = JSON.parse(request.postData()).messages.at(-1).content.includes('中文前缀');
      return request.respond({ status: failAI ? 500 : 200, headers, body: JSON.stringify(failAI ? { error: { message: '测试 AI 服务不可用' } } : { choices: [{ message: { content: isName ? '英文前缀：Ethiopia\n英文后缀：Floral' : '中文描述：茉莉、蜂蜜\n英文描述：Jasmine, Honey' } }] }) });
    }
    if (url.pathname.startsWith('/api/templates')) {
      const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (request.method() === 'POST') {
        if (failSave) return request.respond({ status: 500, headers, body: '{}' });
        const record = JSON.parse(request.postData());
        records = [...records.filter(item => item.id !== record.id), record];
        return request.respond({ status: 200, headers, body: JSON.stringify(record) });
      }
      if (request.method() === 'DELETE') {
        if (failDelete) return request.respond({ status: 500, headers, body: '{}' });
        records = records.filter(item => item.id !== decodeURIComponent(url.pathname.split('/').at(-1)));
        return request.respond({ status: 200, headers, body: '{}' });
      }
      return request.respond({ status: failList ? 500 : 200, headers, body: JSON.stringify(records) });
    }
    return request.continue();
  });
}
async function click(page, text) {
  const handle = await page.evaluateHandle(text => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text && button.getClientRects().length > 0), text);
  const element = handle.asElement();
  assert.ok(element, `button ${text} exists`);
  await element.click(); await handle.dispose();
}
async function input(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.$eval(selector, (element, value) => {
    Object.getOwnPropertyDescriptor(element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, String(value));
}
async function add(page, query, count) {
  if (page.viewport().width < 992) await click(page, '选择标签');
  await input(page, '#print-search', query);
  await click(page, '加入队列');
  await input(page, '[role="dialog"] input[name="quantity"]', count);
  await input(page, '[role="dialog"] input[name="weight"]', 200);
  await click(page, '确认加入队列');
  await page.waitForSelector('[role="dialog"]', { hidden: true });
}
async function queue(page) { return page.evaluate(() => JSON.parse(sessionStorage.getItem('beanlabel.printQueue.v1'))); }
async function exportPdf(page, filename) {
  await click(page, '下载 PDF');
  await page.waitForFunction(() => document.querySelector('footer a[href^="blob:"]') || document.querySelector('[role="alert"]'), { timeout: 120000 });
  const error = await page.$eval('body', node => node.querySelector('[role="alert"]')?.textContent || '');
  assert.equal(error, '', 'PDF export succeeds');
  const bytes = await page.evaluate(async () => {
    const response = await fetch(document.querySelector('footer a').href);
    return [...new Uint8Array(await response.arrayBuffer())];
  });
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-');
  await fs.writeFile(`${output}/${filename}`, Buffer.from(bytes));
}
try {
  const page = await browser.newPage();
  await prepare(page);
  await page.setViewport({ width: 1360, height: 900 });
  await page.goto(base, { waitUntil: 'networkidle2' });
  assert.ok(await page.$eval('footer button', button => button.disabled), 'empty queue disables export');
  await input(page, '#print-search', 'horizontal');
  await click(page, '加入队列');
  await page.waitForFunction(() => document.activeElement?.closest('[role="dialog"]'));
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
  assert.ok(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), 'modal traps keyboard focus');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  await page.waitForFunction(() => document.activeElement?.textContent.includes('加入队列'));
  assert.equal((await queue(page)).length, 0, 'Escape cancels without changing queue');
  await add(page, 'horizontal', 9);
  await add(page, 'portrait', 10);
  const initialQueue = await queue(page);
  assert.deepEqual(initialQueue.map(item => item.quantity), [9, 10]);
  if (page.viewport().width < 992) await click(page, '预览');
  assert.deepEqual(await page.$$eval('[data-print-page]', els => els.map(el => el.dataset.labelSize)), ['105x74','105x74','60x85','60x85']);
  await page.screenshot({path:`${output}/preview-desktop.png`});
  await exportPdf(page, 'mixed-300dpi.pdf');
  assert.equal(await page.$$eval('body > div[aria-hidden="true"]', els => els.length), 0, 'temporary export root is removed');
  await page.reload({ waitUntil: 'networkidle2' });
  assert.deepEqual(await queue(page), initialQueue, 'reload restores all parameters');

  await click(page, '修改参数');
  await input(page, '[role="dialog"] input[name="weight"]', 250);
  await input(page, '[role="dialog"] input[name="quantity"]', 8);
  await click(page, '保存参数');
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  assert.equal((await queue(page))[0].bean.weight, '250g');
  assert.equal(records[0].weight, undefined, 'print parameters do not mutate saved templates');

  // Existing password gate is exercised without touching application data.
  await click(page, '标签管理');
  await page.waitForSelector('input[type="password"]');
  await page.screenshot({path:`${output}/login-desktop.png`});
  await input(page, 'input[type="password"]', 'incorrect-password');
  await page.$eval('input[type="password"]', element => element.form.requestSubmit());
  await page.waitForSelector('[role="alert"]');
  assert.ok(await page.$eval('[role="alert"]', node => node.textContent.includes('密码错误')));
  await input(page, 'input[type="password"]', '司马');
  await page.$eval('input[type="password"]', element => element.form.requestSubmit());
  await page.waitForSelector('#manage-search');
  await page.screenshot({path:`${output}/manage-desktop.png`});
  await input(page, '#manage-search', '埃塞俄比亚');
  assert.equal(await page.$$eval('section[aria-label="标签列表"] article', nodes => nodes.length), 2, 'origin search works');
  await click(page, '新建标签');
  await input(page, 'input[placeholder="前缀 (Light)"]', '新标签');
  let dialogCount = 0;
  page.on('dialog', async dialog => { dialogCount++; await dialog.dismiss(); });
  await click(page, '打印台');
  await page.waitForFunction(() => location.hash.startsWith('#/edit') && document.querySelector('input[placeholder="前缀 (Light)"]'));
  assert.ok(page.url().includes('#/edit'), 'cancelled navigation keeps editor');
  assert.equal(dialogCount, 1);
  failSave = true;
  await click(page, '保存标签');
  await page.waitForSelector('[role="alert"]');
  assert.ok(await page.$eval('[role="alert"]', element => element.textContent.includes('保存失败')));
  assert.equal(await page.$eval('input[placeholder="前缀 (Light)"]', element => element.value), '新标签');
  failSave = false;
  await click(page, '保存标签');
  await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('已保存'));
  assert.equal(dialogCount, 1, 'successful save does not prompt to clear form');
  assert.equal(records.length, 3);
  await input(page, 'input[placeholder="前缀 (Light)"]', '更新标签');
  await click(page, '保存标签');
  await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('已保存'));
  await page.waitForFunction(() => !document.querySelector('.manage-workspace fieldset')?.disabled);
  assert.equal(records.length, 3, 'editing updates the same record');

  await click(page, '返回标签库');
  assert.equal(await page.$eval('#manage-search', el => el.value), '埃塞俄比亚', 'return preserves library search');
  await input(page, '#manage-search', '更新标签');
  assert.equal(await page.$$eval('section[aria-label="标签列表"] article', els => els.length), 1);
  page.removeAllListeners('dialog');
  page.on('dialog', async dialog => dialog.accept());
  failDelete = true;
  await page.click('button[aria-label^="更多操作："]');
  await page.waitForSelector('[role="menuitem"]', { visible: true });
  await page.click('[role="menuitem"]');
  await page.waitForSelector('[role="dialog"]', { visible: true });
  await click(page, '确认删除');
  await page.waitForSelector('[role="alert"]');
  assert.equal(records.length, 3, 'failed deletion retains records');
  failDelete = false;
  await click(page, '确认删除');
  await page.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].some(el => el.textContent.includes('已删除')));
  assert.equal(records.length, 2);
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  await click(page, '打印台');
  await page.waitForSelector('#print-search');
  assert.equal((await queue(page)).length, 2, 'management round trip keeps queue');

  console.log('PASS: desktop CRUD, modal focus/Escape, login failure, dirty guard');

  // Same controls and export on a touch/mobile viewport.
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await click(page, '打印队列 (18)');
  await page.screenshot({path:`${output}/queue-mobile.png`});
  await click(page, '清空');
  await add(page, 'portrait', 1);
  if (page.viewport().width < 992) await click(page, '预览');
  await page.screenshot({path:`${output}/preview-mobile.png`});
  await exportPdf(page, 'mobile-300dpi.pdf');
  await click(page, '打印队列 (1)');
  await click(page, '删除');
  assert.equal((await queue(page)).length, 0);

  // Failed image requests must retain the queue and allow retry.
  await add(page, 'horizontal', 1);
  const beforeFailure = await queue(page);
  await page.setCacheEnabled(false);
  failImage = true;
  await click(page, '下载 PDF');
  await page.waitForSelector('[role="alert"]', { timeout: 60000 });
  assert.ok(await page.$eval('[role="alert"]', element => element.textContent.includes('图片')));
  assert.deepEqual(await queue(page), beforeFailure);
  assert.equal(await page.$eval('footer button', button => button.disabled), false);
  failImage = false;
  await exportPdf(page, 'retry-300dpi.pdf');
  failList = true;
  await page.reload({waitUntil:'networkidle2'});
  await page.waitForSelector('[role="alert"]');
  failList = false;
  await click(page, '重新加载');
  await page.waitForSelector('article');
  assert.equal(await page.$eval('body', body => body.scrollWidth <= window.innerWidth), true, 'mobile page has no horizontal overflow');
  const fontContext = await browser.createBrowserContext();
  const fontPage = await fontContext.newPage();
  await prepare(fontPage);
  await fontPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  failFonts = true;
  await fontPage.goto(base, { waitUntil: 'networkidle2' });
  await add(fontPage, 'horizontal', 1);
  await click(fontPage, '下载 PDF');
  await fontPage.waitForSelector('[role="alert"]', { timeout: 60000 });
  assert.ok(await fontPage.$eval('[role="alert"]', el => el.textContent.includes('MiSans')));
  assert.equal((await queue(fontPage)).length, 1, 'font failure preserves queue');
  assert.equal(await fontPage.$eval('footer button', button => button.disabled), false);
  failFonts = false;
  await fontPage.reload({ waitUntil: 'networkidle2' });
  await exportPdf(fontPage, 'font-retry-300dpi.pdf');
  await fontContext.close();
  // Mantine inputs, searchable selects, AI feedback, and mobile editor layout.
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await click(page, '标签管理');
  await page.waitForSelector('#manage-search');
  await click(page, '新建标签');
  await input(page, 'input[placeholder="前缀 (Light)"]', '测试咖啡');
  await click(page, 'AI翻译');
  await page.waitForFunction(() => document.querySelector('input[placeholder="Prefix"]').value === 'Ethiopia');
  await input(page, 'textarea[name="flavorCn"]', '花香蜂蜜');
  await click(page, 'AI处理');
  await page.waitForFunction(() => document.querySelector('textarea[name="flavorEn"]').value === 'Jasmine, Honey');
  failAI = true;
  await click(page, 'AI翻译');
  await page.waitForSelector('[role="alert"]');
  assert.equal(await page.$eval('input[placeholder="Prefix"]', el => el.value), 'Ethiopia', 'AI failure retains the existing name');
  failAI = false;
  await click(page, 'AI翻译');
  await page.waitForFunction(() => !document.querySelector('.manage-workspace fieldset fieldset')?.disabled);
  await page.click('input[placeholder="请选择国家/产地"]');
  await page.type('input[placeholder="请选择国家/产地"]', 'Ethiopia');
  await page.waitForSelector('[role="option"]');
  await page.click('[role="option"]');
  assert.equal(await page.$eval('input[name="country"]', el => el.value), 'ethiopia');
  await page.keyboard.press('Escape');
  await page.screenshot({path:`${output}/manage-mobile.png`});
  assert.equal(await page.$eval('body', body => body.scrollWidth <= innerWidth), true, 'mobile editor has no horizontal overflow');
  await click(page, '保存标签');
  await page.waitForFunction(() => !document.querySelector('.manage-workspace > main fieldset')?.disabled);
  await click(page, '打印台');
  await page.waitForSelector('#print-search', { visible: true });
  await input(page, '#print-search', 'horizontal');
  await click(page, '加入队列');
  await page.waitForSelector('[role="dialog"]', {visible: true});
  await page.click('#print-roast-date');
  await page.waitForSelector('[aria-label="下个月"]');
  await page.click('[role="dialog"] input[name="weight"]');
  await page.focus('#print-roast-date');
  await input(page, '#print-roast-date', '2026-10-10');
  await page.click('[role="dialog"] h2');
  await page.waitForSelector('[aria-label="下个月"]', { hidden: true });
  assert.equal(await page.$eval('#print-roast-date', el => el.value), '2026-10-10');
  await page.screenshot({path:`${output}/parameters-mobile.png`});
  await input(page, 'input[name="quantity"]', '');
  await click(page, '确认加入队列');
  assert.ok(await page.$('[role="dialog"]'), 'empty required quantity keeps the modal open');
  const countBefore = (await queue(page)).length;
  await input(page, 'input[name="quantity"]', '2');
  await input(page, 'input[name="weight"]', '');
  await page.$eval('[role="dialog"] form', form => { form.requestSubmit(); form.requestSubmit(); });
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  const afterDoubleSubmit = await queue(page);
  assert.equal(afterDoubleSubmit.length, countBefore + 1, 'duplicate submits add only one item');
  assert.equal(afterDoubleSubmit.at(-1).bean.roastDate, '2026-10-10');
  assert.equal(afterDoubleSubmit.at(-1).bean.weight, '0g', 'empty weight preserves zero default');
  assert.equal(afterDoubleSubmit.at(-1).quantity, 2);
  console.log('PASS: Mantine mobile editor, searchable selects, AI success/failure/retry, Chinese calendar, required quantity and duplicate submit');
  console.log('PASS: font failure retains queue and can retry');
  console.log('PASS: Chromium desktop/mobile CRUD, dirty guard, search, queue edits/restoration, mixed-size PDF, image failure/retry, list failure/retry');
  assert.equal(backendPdfRequests, 0);
  assert.equal(oldFontRequests, 0);
  assert.deepEqual(pageErrors, []);
  console.log('PASS: no backend PDF requests, old COS fonts, or browser exceptions');
} finally { await browser.close(); }

export const LABEL_FONT_FAMILY = '"MiSans VF"';

export async function withTimeout<T>(promise: Promise<T>, message: string, milliseconds = 30000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([promise, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    })]);
  } finally { clearTimeout(timer!); }
}

/** Load the font slices for actual text and weights, not just fonts already requested. */
export async function waitForPrintAssets(element: HTMLElement) {
  const textByWeight = new Map<string, string>();
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim();
    const parent = node.parentElement;
    if (!text || !parent || parent.closest('[data-html2canvas-ignore]')) continue;
    const weight = getComputedStyle(parent).fontWeight;
    textByWeight.set(weight, (textByWeight.get(weight) || '') + text);
  }
  await withTimeout(Promise.all([...textByWeight].map(async ([weight, text]) => {
    const descriptor = `${weight} 16px ${LABEL_FONT_FAMILY}`;
    let faces: FontFace[];
    try { faces = await document.fonts.load(descriptor, text); }
    catch { throw new Error('MiSans 字体加载失败，请检查网络后重试'); }
    if (!faces.length || !document.fonts.check(descriptor, text)) throw new Error('MiSans 字体未加载，请检查网络后重试');
  })), 'MiSans 字体加载超时，请检查网络后重试');
  await withTimeout(document.fonts.ready, 'MiSans 字体加载超时，请重试');
  const images = [...element.querySelectorAll('img')];
  await withTimeout(Promise.all(images.map(async image => {
    try {
      await image.decode();
      if (!image.naturalWidth) throw new Error('empty image');
    } catch {
      throw new Error(`标签图片加载失败：${image.getAttribute('src') || '未知图片'}，请重试`);
    }
  })), '标签图片加载超时，请检查网络后重试');
  // Label can replace a failed image with a fallback; do not export that silently.
  if (element.querySelector('[data-asset-error]')) throw new Error('标签图片加载失败，请检查网络后重试');
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  if (element.querySelector('[data-asset-error]')) throw new Error('标签图片加载失败，请检查网络后重试');
}

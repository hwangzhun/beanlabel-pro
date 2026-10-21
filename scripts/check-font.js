// 检查固定 CDN 样式及一个实际字体切片，不再要求上传本地 TTF。
const stylesheet = 'https://cdn.jsdelivr.net/npm/misans@5.0.0/lib/Normal/MiSansVF.min.css';
try {
  const response = await fetch(stylesheet, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`CSS HTTP ${response.status}`);
  const css = await response.text();
  const slice = css.match(/url\(['"]?([^'"\)]+)['"]?\)/)?.[1];
  if (!slice || !css.includes('MiSans VF')) throw new Error('未找到 MiSans VF 字体定义');
  const font = await fetch(new URL(slice, stylesheet), { method: 'HEAD', signal: AbortSignal.timeout(30000) });
  if (!font.ok) throw new Error(`字体 HTTP ${font.status}`);
  console.log('MiSans VF 5.0.0 CDN 样式及字体切片可用。');
} catch (error) {
  console.error(`字体检查失败：${error.message}`);
  process.exitCode = 1;
}

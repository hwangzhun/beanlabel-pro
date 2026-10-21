// 文字宽度测量工具函数
// 使用 Canvas API 精确测量文字宽度

/**
 * 测量文字宽度
 * @param text 要测量的文字
 * @param fontSize 字体大小（像素）
 * @param fontFamily 字体族
 * @param fontWeight 字重
 * @returns 文字宽度（像素）
 */
export const measureTextWidth = (
  text: string, 
  fontSize: number, 
  fontFamily: string, 
  fontWeight: string | number
): number => {
  if (!text) return 0;
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  
  // 设置字体样式
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  
  // 测量文字宽度
  return context.measureText(text).width;
};

/**
 * 计算调整后的字体大小
 * 如果文字宽度超过最大宽度，则等比例缩小
 * @param prefix 前缀文字
 * @param suffix 后缀文字
 * @param divider 分隔符
 * @param baseFontSize 基础字体大小
 * @param fontFamily 字体族
 * @param prefixWeight 前缀字重
 * @param dividerWeight 分隔符字重
 * @param suffixWeight 后缀字重
 * @param maxWidth 最大宽度（像素）
 * @returns 调整后的字体大小
 */
export const calculateAdjustedFontSize = (
  prefix: string,
  suffix: string,
  divider: string,
  baseFontSize: number,
  fontFamily: string,
  prefixWeight: string | number,
  dividerWeight: string | number,
  suffixWeight: string | number,
  maxWidth: number
): number => {
  // 如果所有文字都为空，返回基础字体大小
  if (!prefix && !suffix && !divider) {
    return baseFontSize;
  }
  
  // 分别测量各部分宽度（因为字重可能不同）
  const prefixWidth = measureTextWidth(prefix, baseFontSize, fontFamily, prefixWeight);
  const dividerWidth = measureTextWidth(divider, baseFontSize, fontFamily, dividerWeight);
  const suffixWidth = measureTextWidth(suffix, baseFontSize, fontFamily, suffixWeight);
  
  // 计算总宽度
  const totalWidth = prefixWidth + dividerWidth + suffixWidth;
  
  // 如果总宽度不超过最大宽度，返回基础字体大小
  if (totalWidth <= maxWidth) {
    return baseFontSize;
  }
  
  // 等比例缩小
  const scale = maxWidth / totalWidth;
  return baseFontSize * scale;
};

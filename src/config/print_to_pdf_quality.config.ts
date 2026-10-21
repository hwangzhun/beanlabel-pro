/**
 * PDF 生成质量配置
 * 
 * 用于控制 PDF 输出的文件大小和质量平衡
 */

import type { ImageCompression } from 'jspdf';

/**
 * JPEG 图片质量
 * 范围: 0.0 - 1.0
 * - 0.85-0.90: 较小文件，质量可接受
 * - 0.92-0.95: 平衡选择，推荐用于打印
 * - 0.96-1.0: 高质量，文件较大
 */
export const JPEG_QUALITY: number = 0.92;

/**
 * jsPDF addImage 压缩模式
 * 
 * 可选值:
 * - "NONE": 不压缩，文件最大，质量最高
 * - "FAST": 快速压缩，文件较小，速度最快
 * - "MEDIUM": 中等压缩，平衡质量和文件大小
 * - "SLOW": 慢速压缩，文件最小，但处理时间最长
 * 
 * 参考文档: https://github.com/parallax/jsPDF
 */
export const PDF_IMAGE_COMPRESSION: ImageCompression = 'FAST';


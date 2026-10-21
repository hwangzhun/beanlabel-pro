import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志目录
const LOG_DIR = path.join(__dirname, 'logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// 控制台格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// 创建 logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 错误日志单独保存
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // 所有日志
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
    // 控制台输出
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// ========== 打印历史记录功能 ==========

const PRINT_HISTORY_FILE = path.join(LOG_DIR, 'print-history.json');

/**
 * 读取打印历史记录
 */
export async function getPrintHistory() {
  try {
    if (!fs.existsSync(PRINT_HISTORY_FILE)) {
      return [];
    }
    const data = await fs.promises.readFile(PRINT_HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('读取打印历史失败', { error: error.message });
    return [];
  }
}

/**
 * 保存打印记录
 * @param {Object} record - 打印记录
 * @param {Array} record.queue - 打印队列
 * @param {number} record.totalLabels - 总标签数
 * @param {number} record.pdfSizeKB - PDF 大小（KB）
 * @param {boolean} record.success - 是否成功
 * @param {string} [record.error] - 错误信息（如果失败）
 */
export async function savePrintRecord(record) {
  try {
    const history = await getPrintHistory();
    
    // 提取模板摘要信息
    const templates = record.queue.map(item => ({
      id: item.bean?.id || 'unknown',
      name: item.bean?.nameCnPrefix 
        ? `${item.bean.nameCnPrefix}${item.bean.nameCnSuffix || ''}`
        : item.bean?.nameEnPrefix || '未知模板',
      quantity: item.quantity || 1,
    }));

    const printRecord = {
      id: generateRecordId(),
      timestamp: new Date().toISOString(),
      templates,
      totalLabels: record.totalLabels,
      totalTemplates: record.queue.length,
      pdfSizeKB: record.pdfSizeKB,
      success: record.success,
      error: record.error || null,
      duration: record.duration || null, // 耗时（毫秒）
    };

    history.unshift(printRecord); // 新记录放在最前面

    // 只保留最近 500 条记录
    const MAX_RECORDS = 500;
    if (history.length > MAX_RECORDS) {
      history.length = MAX_RECORDS;
    }

    await fs.promises.writeFile(
      PRINT_HISTORY_FILE,
      JSON.stringify(history, null, 2),
      'utf-8'
    );

    logger.info('打印记录已保存', { 
      recordId: printRecord.id,
      totalLabels: printRecord.totalLabels,
      success: printRecord.success 
    });

    return printRecord;
  } catch (error) {
    logger.error('保存打印记录失败', { error: error.message });
    throw error;
  }
}

/**
 * 生成记录 ID
 */
function generateRecordId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.random().toString(36).slice(2, 6);
  return `${dateStr}_${timeStr}_${random}`;
}

/**
 * 获取打印统计信息
 */
export async function getPrintStats() {
  const history = await getPrintHistory();
  
  const stats = {
    totalPrints: history.length,
    successPrints: history.filter(r => r.success).length,
    failedPrints: history.filter(r => !r.success).length,
    totalLabels: history.reduce((sum, r) => sum + (r.totalLabels || 0), 0),
    // 按日统计（最近7天）
    dailyStats: {},
  };

  // 统计最近 7 天
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  history.forEach(record => {
    const recordDate = new Date(record.timestamp);
    if (recordDate >= sevenDaysAgo) {
      const dateKey = record.timestamp.slice(0, 10);
      if (!stats.dailyStats[dateKey]) {
        stats.dailyStats[dateKey] = { prints: 0, labels: 0 };
      }
      stats.dailyStats[dateKey].prints++;
      stats.dailyStats[dateKey].labels += record.totalLabels || 0;
    }
  });

  return stats;
}

export default logger;

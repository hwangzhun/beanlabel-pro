import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import logger, { savePrintRecord, getPrintHistory, getPrintStats } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// 默认后端端口由 3001 调整为 2001，如需修改可通过环境变量 PORT 覆盖
const PORT = process.env.PORT || 2001;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'templates.json');
const DIST_DIR = path.join(__dirname, 'dist');
const PDF_TEMPLATE_PATH = path.join(__dirname, 'pdf-template.html');

// Label 配置（与前端 labelConfig.ts 保持一致）
const LABEL_CONFIG = {
  width: 1240,  // px
  height: 877,  // px
  elements: {
    country: { x: 35, y: 80 },
    nameCn: { x: 35, y: 550 },
    nameEn: { x: 35, y: 320 },
    params: { x: 35, y: 440 },
    divider: { x: 35, y: 575 },
    flavorCn: { x: 35, y: 600 },
    flavorEn: { x: 35, y: 706 },
    slider: { x: 695, y: 780 },
    method: { x: 690, y: 140 },
    bestBefore: { x: 35, y: 830 },
    roastDate: { x: 35, y: 800 },
    weight: { x: 527, y: 487 },
  },
  styles: {
    countryFontSize: 32,
    nameCnFontSize: 69,
    nameEnFontSize: 29,
    paramFontSize: 28,
    paramGap: 48,
    flavorCnFontSize: 42,
    flavorEnFontSize: 26,
    dividerWidth: 600,
    dividerHeight: 2,
    dividerColor: '#cccccc',
    flavorCnFontWeight: 500,
    flavorCnLetterSpacing: 0,
    flavorCnLineHeight: 1.07,
    flavorGap: 8,
    flavorEnFontWeight: 200,
    flavorEnLetterSpacing: 0,
    flavorEnLineHeight: 1.07,
    bestBeforeFontSize: 20,
    bestBeforeFontWeight: 400,
    roastDateFontSize: 20,
    roastDateFontWeight: 400,
    weightFontSize: 29,
    weightFontWeight: 500,
    colors: {
      nameCnPrefix: '#000000',
      nameCnDivider: '#000000',
      nameCnSuffix: '#000000',
      nameEnPrefix: '#000000',
      nameEnDivider: '#000000',
      nameEnSuffix: '#000000',
      paramText: '#000000',
      paramIcon: '#000000',
      flavorCn: '#000000',
      flavorEn: '#000000',
      methodIcon: '#000000',
      methodText: '#000000',
      weight: '#000000',
      roastDate: '#7e463a',
      bestBefore: '#000000',
    },
  },
};

// Puppeteer 浏览器实例（复用以提高性能）
let browserInstance = null;

async function getBrowser() {
  // 检查浏览器是否仍然连接
  if (browserInstance) {
    try {
      await browserInstance.version(); // 测试连接
    } catch (error) {
      logger.warn('浏览器连接已断开，重新启动...');
      browserInstance = null;
    }
  }
  
  if (!browserInstance) {
    logger.info('启动 Puppeteer 浏览器...');
    
    // 配置选项
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-web-security', // 允许加载本地资源
        '--disable-features=IsolateOrigins,site-per-process', // 减少内存使用
      ],
    };
    
    // 如果设置了环境变量，使用系统安装的 Chrome/Chromium
    if (process.env.CHROME_PATH) {
      launchOptions.executablePath = process.env.CHROME_PATH;
      logger.info('使用系统 Chrome', { path: process.env.CHROME_PATH });
    } else {
      // 尝试自动检测系统安装的 Chrome/Chromium
      const { execSync } = await import('child_process');
      try {
        // 尝试查找 chromium-browser
        const chromiumPath = execSync('which chromium-browser', { encoding: 'utf-8', stdio: 'pipe' }).trim();
        if (chromiumPath) {
          launchOptions.executablePath = chromiumPath;
          logger.info('自动检测到系统 Chromium', { path: chromiumPath });
        }
      } catch (e) {
        try {
          // 尝试查找 google-chrome
          const chromePath = execSync('which google-chrome', { encoding: 'utf-8', stdio: 'pipe' }).trim();
          if (chromePath) {
            launchOptions.executablePath = chromePath;
            logger.info('自动检测到系统 Chrome', { path: chromePath });
          }
        } catch (e2) {
          // 如果都找不到，使用 Puppeteer 自带的 Chrome
          logger.info('使用 Puppeteer 自带的 Chrome');
        }
      }
    }
    
    try {
      browserInstance = await puppeteer.launch(launchOptions);
      logger.info('Puppeteer 浏览器已启动');
    } catch (error) {
      logger.error('启动浏览器失败', { error: error.message });
      if (error.message.includes('libatk') || error.message.includes('shared libraries')) {
        logger.error('缺少系统依赖库，请运行 install-deps.sh 或设置 CHROME_PATH 环境变量');
      }
      throw error;
    }
    
    // 监听浏览器断开连接事件
    browserInstance.on('disconnected', () => {
      logger.warn('Puppeteer 浏览器已断开连接');
      browserInstance = null;
    });
  }
  return browserInstance;
}

// 关闭浏览器（进程退出时调用）
async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    logger.info('Puppeteer 浏览器已关闭');
  }
}

// 进程退出时清理
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});

// 简单的 ID 生成器，确保每个模板都有唯一标识
function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // 只记录 API 请求，忽略静态资源
    if (req.path.startsWith('/api')) {
      logger.info(`${req.method} ${req.path}`, {
        status: res.statusCode,
        duration: `${duration}ms`,
      });
    }
  });
  next();
});

// 确保 public 目录也被提供静态文件服务（用于 PDF 生成）
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use('/public', express.static(PUBLIC_DIR));

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    logger.error('创建数据目录失败', { error: error.message });
  }
}

// 读取所有模板
async function getAllTemplates() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const templates = JSON.parse(data);

    // 修复旧数据缺少 id 的问题，防止删除时请求路径为空导致 404
    let hasFixedId = false;
    const normalized = templates.map(t => {
      if (!t.id) {
        hasFixedId = true;
        return { ...t, id: generateId() };
      }
      return t;
    });

    if (hasFixedId) {
      await writeTemplates(normalized);
    }

    return normalized;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // 文件不存在，返回空数组
    }
    throw error;
  }
}

// 写入模板数据
async function writeTemplates(templates) {
  await fs.writeFile(DATA_FILE, JSON.stringify(templates, null, 2), 'utf-8');
}

// API 路由

// 获取所有模板
app.get('/api/templates', async (req, res) => {
  try {
    const templates = await getAllTemplates();
    res.json(templates);
  } catch (error) {
    logger.error('获取模板失败', { error: error.message });
    res.status(500).json({ error: '获取模板失败' });
  }
});

// 获取单个模板
app.get('/api/templates/:id', async (req, res) => {
  try {
    const templates = await getAllTemplates();
    const template = templates.find(t => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }
    res.json(template);
  } catch (error) {
    logger.error('获取模板失败', { id: req.params.id, error: error.message });
    res.status(500).json({ error: '获取模板失败' });
  }
});

// 保存模板（新增或更新）
app.post('/api/templates', async (req, res) => {
  try {
    const template = req.body;
    if (!template.id) {
      return res.status(400).json({ error: '模板 ID 不能为空' });
    }

    const templates = await getAllTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    
    const isUpdate = index >= 0;
    if (isUpdate) {
      templates[index] = template; // 更新
    } else {
      templates.push(template); // 新增
    }
    
    await writeTemplates(templates);
    logger.info(`模板${isUpdate ? '更新' : '创建'}成功`, { 
      id: template.id, 
      name: template.nameCnPrefix || template.nameEnPrefix 
    });
    res.json(template);
  } catch (error) {
    logger.error('保存模板失败', { error: error.message });
    res.status(500).json({ error: '保存模板失败' });
  }
});

// 删除模板
app.delete('/api/templates/:id', async (req, res) => {
  try {
    const templates = await getAllTemplates();
    const filtered = templates.filter(t => t.id !== req.params.id);
    
    if (filtered.length === templates.length) {
      return res.status(404).json({ error: '模板不存在' });
    }
    
    await writeTemplates(filtered);
    logger.info('模板删除成功', { id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('删除模板失败', { id: req.params.id, error: error.message });
    res.status(500).json({ error: '删除模板失败' });
  }
});

// 导出 PDF（使用 Puppeteer）
app.post('/api/export-pdf', async (req, res) => {
  const startTime = Date.now();
  let totalQuantity = 0;
  const { queue } = req.body;

  try {
    if (!Array.isArray(queue) || queue.length === 0) {
      return res.status(400).json({ error: '打印队列为空' });
    }

    // 计算总标签数量
    queue.forEach((item) => {
      totalQuantity += item.quantity || 0;
    });

    logger.info('开始生成 PDF', { 
      queueLength: queue.length, 
      totalLabels: totalQuantity 
    });

    // 获取浏览器实例
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // 设置页面超时
    page.setDefaultTimeout(60000); // 60秒超时
    page.setDefaultNavigationTimeout(60000);

    try {
      // 读取 HTML 模板
      const templateHtml = await fs.readFile(PDF_TEMPLATE_PATH, 'utf-8');
      
      // 构建 base URL（用于访问静态资源）
      const baseUrl = `http://localhost:${PORT}`;

      // 设置页面内容，使用 baseUrl 让相对路径可以正确解析
      await page.setContent(templateHtml, {
        waitUntil: 'domcontentloaded',
        baseURL: baseUrl,
      });

      // 监听控制台输出（用于调试）
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[PDF渲染]')) {
          logger.debug('PDF渲染', { message: text });
        }
      });

      // 注入数据并渲染
      await page.evaluate((data) => {
        window.renderLabels(data);
      }, {
        queue,
        config: LABEL_CONFIG,
        baseUrl: baseUrl,
      });

      // 等待字体加载
      await page.evaluateHandle('document.fonts.ready');
      
      // 等待一段时间确保渲染完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 生成 PDF
      const pdfUint8Array = await page.pdf({
        width: '2480px',
        height: '3508px',
        printBackground: true,
        preferCSSPageSize: false,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        scale: 1,
      });

      // 转换为 Node.js Buffer
      const pdfBuffer = Buffer.from(pdfUint8Array);
      const pdfSizeKB = parseFloat((pdfBuffer.length / 1024).toFixed(2));
      const duration = Date.now() - startTime;

      logger.info('PDF 生成成功', { 
        totalLabels: totalQuantity,
        pdfSizeKB,
        duration: `${duration}ms`
      });

      // 保存打印历史记录
      await savePrintRecord({
        queue,
        totalLabels: totalQuantity,
        pdfSizeKB,
        success: true,
        duration,
      });

      // 设置响应头
      const fileName = `coffee_labels_${new Date().toISOString().slice(0, 10)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // 使用 end() 发送二进制数据
      res.end(pdfBuffer);
    } finally {
      // 关闭页面（但保持浏览器实例）
      await page.close();
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('导出 PDF 失败', { error: error.message, duration: `${duration}ms` });
    
    // 记录失败的打印历史
    await savePrintRecord({
      queue: queue || [],
      totalLabels: totalQuantity,
      pdfSizeKB: 0,
      success: false,
      error: error.message,
      duration,
    }).catch(e => logger.error('保存打印失败记录时出错', { error: e.message }));

    if (!res.headersSent) {
      res.status(500).json({ error: '导出 PDF 失败: ' + error.message });
    }
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 获取打印历史记录
app.get('/api/print-history', async (req, res) => {
  try {
    const history = await getPrintHistory();
    // 支持分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    res.json({
      total: history.length,
      page,
      limit,
      data: history.slice(start, end),
    });
  } catch (error) {
    logger.error('获取打印历史失败', { error: error.message });
    res.status(500).json({ error: '获取打印历史失败' });
  }
});

// 获取打印统计
app.get('/api/print-stats', async (req, res) => {
  try {
    const stats = await getPrintStats();
    res.json(stats);
  } catch (error) {
    logger.error('获取打印统计失败', { error: error.message });
    res.status(500).json({ error: '获取打印统计失败' });
  }
});

// 静态文件 & SPA 入口（前端打包后的 dist）
// 先提供静态资源，再兜底返回 index.html，保证前后端一起部署
// 注意：Vite 构建时会将 public/ 目录的内容复制到 dist/ 根目录
app.use(express.static(DIST_DIR));
// 同时提供 public 目录的静态服务（用于 PDF 生成时访问图片）
app.use(express.static(PUBLIC_DIR));
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// 启动服务器
async function startServer() {
  await ensureDataDir();
  
  // 兼容 PDF 接口按需启动浏览器，标签管理启动不依赖 Chromium。
  app.listen(PORT, () => {
    logger.info('服务器已启动', { 
      url: `http://localhost:${PORT}`,
      dataFile: DATA_FILE,
      logDir: path.join(__dirname, 'logs')
    });
  });
}

startServer().catch(error => {
  logger.error('服务器启动失败', { error: error.message });
  process.exit(1);
});

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const DEPLOY_DIR = path.join(projectRoot, 'deploy');

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fsp.copyFile(src, dest);
}

async function copyDir(src, dest) {
  await ensureDir(dest);
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  console.log('构建部署包到 deploy/ 目录...');

  const distDir = path.join(projectRoot, 'dist');

  // 简单校验：确保已经执行过 vite build
  if (!fs.existsSync(distDir)) {
    console.error('错误：未找到 dist 目录，请先运行 npm run build');
    process.exit(1);
  }

  // 清空 deploy 目录
  if (fs.existsSync(DEPLOY_DIR)) {
    console.log('清理旧的 deploy 目录...');
    await fsp.rm(DEPLOY_DIR, { recursive: true, force: true });
  }
  await ensureDir(DEPLOY_DIR);

  // 1. 拷贝前端构建产物
  console.log('拷贝 dist/ 到 deploy/dist...');
  await copyDir(distDir, path.join(DEPLOY_DIR, 'dist'));

  // 2. 拷贝运行所需的后端文件
  const filesToCopy = [
    'server.js',
    'logger.js',
    'package.json',
    'package-lock.json',
    '.env.example',
    'ecosystem.config.cjs',
    'pdf-template.html',
    'README.md',
  ];

  console.log('拷贝后端运行文件...');
  for (const file of filesToCopy) {
    const src = path.join(projectRoot, file);
    if (fs.existsSync(src)) {
      await copyFile(src, path.join(DEPLOY_DIR, file));
    }
  }

  // 3. 拷贝 public 目录（包含图片资源，PDF 生成需要）
  const publicDir = path.join(projectRoot, 'public');
  if (fs.existsSync(publicDir)) {
    console.log('拷贝 public/ 目录...');
    await copyDir(publicDir, path.join(DEPLOY_DIR, 'public'));
  }

  // 4. 拷贝依赖安装脚本
  const installScript = path.join(projectRoot, 'scripts', 'install-deps.sh');
  if (fs.existsSync(installScript)) {
    console.log('拷贝依赖安装脚本...');
    await copyFile(installScript, path.join(DEPLOY_DIR, 'install-deps.sh'));
  }

  // 部署包只包含程序；标签数据由服务器首次保存时创建。
  await ensureDir(path.join(DEPLOY_DIR, 'data'));
  await copyDir(path.join(projectRoot, 'docs'), path.join(DEPLOY_DIR, 'docs'));

  console.log('✅ 部署构建完成，输出目录：deploy/');
  console.log('你可以把 deploy/ 整个目录上传到服务器，然后在该目录下运行：');
  console.log('  npm install');
  console.log('  pm2 start ecosystem.config.cjs --env production');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



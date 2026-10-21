# 部署说明

## 从源码部署

1. 安装 Node.js 22.18+ 并执行 `npm ci`。
2. 复制 `.env.example` 为 `.env.production.local`，填写 `VITE_API_URL` 为浏览器可以访问的后端地址。
3. 执行 `npm run build`，然后执行 `npm run server`，或使用 `pm2 start ecosystem.config.cjs --env production`。

后端默认监听 `2001`，同时提供 `dist/` 前端和 `/api/` 接口。可通过 `PORT` 环境变量修改端口；PM2 部署时检查 `ecosystem.config.cjs` 的端口配置。

`.env.local` 在生产构建时也会加载，避免在其中配置与生产冲突的变量。前端环境变量在构建时生效，修改后需重新构建。

## 生成独立部署包

```bash
npm run build:deploy
```

上传输出的 `deploy/` 整个目录到服务器，在该目录执行：

```bash
npm ci --omit=dev
node server.js
# 或使用已安装的 PM2：
pm2 start ecosystem.config.cjs --env production
```

部署包含已构建前端、后端、静态图片、锁文件、配置示例和文档，不复制本地标签数据及环境配置文件。前端构建会内嵌使用的 VITE 配置。部署包用于运行程序；需要重新构建时请回到完整源码目录。

标签保存在 `data/templates.json`，日志在 `logs/`，目录由程序自动创建。更新部署时保留服务器已有的 `data/`，不要用空目录覆盖。

## 旧 PDF 接口

浏览器 PDF 下载不依赖服务器 Chromium。只有使用旧 `/api/export-pdf` 接口时才需要安装 Puppeteer 系统依赖；Linux 可参考 `scripts/install-deps.sh`，确认适用于服务器发行版后运行。旧接口中文字体也需在服务器安装。

## GitHub 提交范围

源码、`public/`、测试、文档、配置示例及 `package-lock.json` 应提交。真实环境配置、用户数据、日志、依赖和构建产物已由 `.gitignore` 排除。

请使用 Git 提交和推送；不要将整个本地目录直接拖入网页上传，否则可能绕过 `.gitignore`。

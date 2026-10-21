# BeanLabel Pro

咖啡豆标签管理和打印工具，支持桌面与移动端编辑、打印队列、A4 预览和浏览器 PDF 导出。

## 本地运行

需要 Node.js 22.18+，可使用 `nvm use` 切换到 Node.js 22。

```bash
npm ci
cp .env.example .env.local
npm run dev:full
```

打开 `http://localhost:2000`，后端默认监听 `2001`。AI 功能可选，需要在 `.env.local` 填写 `VITE_SILICONFLOW_API_KEY`。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev:full` | 同时启动前后端 |
| `npm run dev` | 仅启动前端 |
| `npm run server` | 仅启动后端 |
| `npm run typecheck` | TypeScript 检查 |
| `npm test` | 分页与队列单元测试 |
| `npm run build` | 生成前端 dist/ |
| `npm run build:deploy` | 生成独立部署包 deploy/ |
| `npm run preview` | 预览前端构建，后端需另行启动 |
| `npm run test:browser` | 桌面和移动端浏览器测试 |
| `npm run test:browser:manage` | 标签管理浏览器测试 |

## 目录结构

```text
src/
  components/        界面及标签组件
  config/            API、认证和标签配置
  services/          数据、AI 和 PDF 服务
  styles/            界面样式
  utils/             分页、队列、资源加载等工具
  App.tsx            应用路由
  index.tsx          前端入口
  theme.ts           Mantine 主题
  types.ts           数据类型
public/              图片资源
scripts/             构建、字体检查和依赖安装脚本
tests/               单元测试及浏览器测试
docs/                使用与部署说明
server.js            Express 服务
logger.js            后端日志与旧接口打印历史
pdf-template.html    兼容旧 PDF 接口的模板
ecosystem.config.cjs PM2 配置
```

`data/`、`logs/`、`node_modules/`、`dist/` 和 `deploy/` 是本地数据或生成目录，不提交到 Git。初始标签库为空；保存标签时后端创建 `data/templates.json`。

## 环境配置

只提交 `.env.example`。本地配置放在 `.env.local`，生产构建配置放在 `.env.production.local`，两者均已忽略。

| 变量 | 说明 |
| --- | --- |
| `VITE_API_URL` | 后端地址，默认 http://localhost:2001 |
| `VITE_SILICONFLOW_API_KEY` | 可选 AI 密钥 |
| `VITE_DESIGN_PASSWORD` | 可选管理页密码，默认“司马” |

Vite 会把 `VITE_*` 配置编译到浏览器代码中；管理页密码仅用于前端入口保护，不能代替服务端鉴权。公开部署时不要把共享私密密钥配置到前端。

## 使用和部署

- [使用说明](docs/usage.md)
- [部署说明](docs/deployment.md)

技术栈：React 19、TypeScript、Vite、Mantine、Express、html2canvas 和 jsPDF。标签样式使用 Tailwind CDN；MiSans 字体通过 jsDelivr 加载。

# 使用说明

## 标签与打印

1. `#/edit` 为标签管理入口。输入管理密码后，可以新建、搜索、编辑和删除标签。默认密码为“司马”，可通过 `VITE_DESIGN_PASSWORD` 覆盖。
2. `#/print` 为默认打印台。选择标签，设置烘焙日期、重量和数量后加入队列。打印参数只影响队列副本。
3. 点击预览检查 A4 排版，再下载 PDF。105×74 mm 横版每页 8 张，60×85 mm 每页 9 张；不同尺寸自动换页。
4. PDF 为 300 DPI 图片型文件。打印请选择“实际大小 / 100%”，避免缩放。

打印队列保存在当前标签页的 sessionStorage，刷新或往返管理页可以恢复，关闭标签页后结束。Safari 如未自动下载，可点击生成后的下载链接保存或分享文件。

## 字体与图片

界面与标签使用 MiSans VF，字体遵循[小米字体许可](https://hyperos.mi.com/font/zh/)。图片统一放在 `public/`，通过 `/flags/...` 等路径访问。

导出 PDF 前会等待字体和图片加载；加载失败会停止导出，保留队列。可执行 `node scripts/check-font.js` 检查字体 CDN。

当前前端在浏览器内生成 PDF。后端 `/api/export-pdf` 为旧接口兼容保留，仅此接口记录后端打印历史。

## 浏览器验证

先启动 `npm run dev`，再运行 `npm run test:browser` 或 `npm run test:browser:manage`。需要 Puppeteer Chromium 及系统依赖。

测试在内存中模拟 API 数据，不写入真实标签。默认前端地址为 `http://127.0.0.1:2000`，可通过 `BEANLABEL_TEST_URL` 覆盖；产物默认写入 `/tmp/beanlabel-verification`，可用 `BEANLABEL_TEST_OUTPUT` 指定目录。

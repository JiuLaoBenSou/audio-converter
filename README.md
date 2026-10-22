# 音频转换工具 · NCM/QMC转Mp3

[在线使用](https://zhuanmp3.com/)

选择音乐文件，在浏览器本地转换、试听并下载，支持批量和 ZIP。转换代码本身不上传音频，没有后端音频处理。页面包含 Google AdSense 广告脚本，会向第三方发起网络请求；代码接入不代表已获审核或已投放广告。

点击单个“下载”或“打包下载”，下载发起后会显示可关闭的自愿打赏窗口。支持切换支付宝和微信收款码，不打赏也不影响下载。

## 使用

- 普通 OGG/OPUS、FLAC、WAV、M4A/MP4、AAC 等转成 192 kbps MP3；已有 MP3 原样保留。
- 特殊格式恢复原编码：NCM、部分 QMC/MFLAC/MGG/TKM/BKC、KWM、KGM/KGMA/VPR、UC、XM、MG3D、X2M/X3M、TM。
- 需要额外密钥的 QQ/酷狗版本直接提示暂不支持；没有手填密钥入口。JOOX 暂不能恢复。不同文件版本的兼容性仍可能有差异。
- 单文件100 MiB、最多20个文件；普通音频转码最长20分钟。WMA/APE/AIFF/DFF等受浏览器解码能力限制，可能无法处理。
- 转码会有损，不提升音质；普通音频转码暂不保留封面/标签。原文件不被修改。

只有应用和依赖代码从本站加载。音乐通过文件选择器进入浏览器内存，并由本地 Worker 处理。页面 CSP 禁止网络连接；站点托管商仍可能记录普通网页访问日志。

## 开发与验证

需要 Node.js 22；生成测试夹具和独立媒体验证需 FFmpeg / FFprobe。

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run fixtures
npm test
npm run verify:media
npm run build
npm run dev
```

本地地址 `http://127.0.0.1:4317/`。只能通过 HTTP/HTTPS 打开，直接双击 HTML 不支持完整 Worker 流程。

测试音频全部由脚本生成原创正弦音。已验证的桌面浏览器为 Chrome/Edge；Firefox、Safari、手机真机和真实特殊格式的广泛兼容性仍待补充。

## 发布

`main` 保存应用源码，`gh-pages` 分支只保存验证后 **dist/** 的静态文件，由 GitHub Pages 提供网站。更新源码后需重新构建并发布静态分支。测试输出、音乐、研究目录和本地报告不进入站点。

## 第三方许可

详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 [licenses/](licenses/)。MP3 编码使用 LAME；库作为独立可替换 ES 模块提供，对应源码包和 LGPL/GPL 文本随站点发布。算法参考和固定提交均在归属文件中列明。

维护：2026-10-21，Codex 按项目用户授权准备首个公开版本。

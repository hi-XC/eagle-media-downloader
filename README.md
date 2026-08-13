# 素材下载助手（Media Downloader）

[English](./README.en.md) | 中文

用于将无需登录即可访问的 Instagram 公开图片帖、视频帖和轮播帖（Carousel）导入 [Eagle](https://cn.eagle.cool/)。当前版本只接受 `https://instagram.com/p/<shortcode>` 及其合法子域名形式的帖子链接。

**当前版本：v0.2.3（Eagle 插件中心重新上架候选版）**

> 已在 macOS 和 Windows 版 Eagle 4.0 中完成实机测试。

## 支持范围

| 内容 | 支持状态 |
| --- | --- |
| Instagram 公开图片帖或视频帖 | 支持 |
| Instagram 公开轮播帖（Carousel） | 支持纯图片、纯视频和图片与视频混合内容 |
| Instagram Reel、Story 或其他网站 | 不支持 |
| 私密、需要登录或访问受限的内容 | 不支持 |
| 浏览器 Cookie | 不读取 |

## 功能

- 将每张可访问的图片和每个视频作为独立项目导入
- 显示帖子解析状态、总体下载进度和当前素材进度
- 单个素材处理失败时，保留其他已成功下载的素材
- 下载完成后自动导入 Eagle，并记录来源信息
- 支持窗口置顶、中英文界面，以及浅色和深色主题
- 导入时不自动添加来源平台标签

## 界面

| 输入链接 | 正在下载 |
| --- | --- |
| ![等待输入帖子链接](./docs/screenshots/idle.png?v=0.2.3) | ![显示当前素材和总体下载进度](./docs/screenshots/downloading.png?v=0.2.3) |

| 已完成 | 设置 |
| --- | --- |
| ![显示已完成的下载项目](./docs/screenshots/completed.png?v=0.2.3) | ![下载引擎设置](./docs/screenshots/settings.png?v=0.2.3) |

## 安装

环境要求：Eagle 4.0 或更高版本，并保持网络连接。

`v0.2.3` 正在准备重新提交 Eagle 插件中心，公开下载地址将在首个正式 Release 发布后补充。

开发者可以克隆本仓库并运行 `npm run package` 生成安装包，再打开 `.eagleplugin` 文件并按照 Eagle 的提示完成安装。

安装包不包含 `yt-dlp` 或 `ffmpeg`。首次使用时，插件会在设置页检查这两项依赖。若缺少 `yt-dlp`，请点击「安装」；插件会从 yt-dlp 官方 GitHub Release 下载固定版本并校验 SHA-256。若缺少 FFmpeg，请安装 Eagle 官方 FFmpeg 依赖。两项依赖均准备就绪后，插件才会开放主界面。

## 使用

1. 复制一个无需登录即可访问的 Instagram 公开帖子链接。
2. 将链接粘贴到插件输入框。
3. 点击下载按钮。
4. 等待插件将素材导入 Eagle。

## 开发

```bash
npm install
npm test
npm run build
npm run package
```

源代码位于 `js/`，构建后的 Eagle 插件位于 `Plugin/`。项目使用 esbuild、i18next 和 yt-dlp。后续计划见 [ROADMAP.md](./ROADMAP.md)。

## 问题反馈

通过 [GitHub Issues](https://github.com/hi-XC/eagle-media-downloader/issues) 提交问题。请提供操作系统、Eagle 版本、插件版本和错误提示。只有在链接及其内容可以公开分享时，才提供原始帖子链接。

## 许可证与使用范围

本项目使用 MIT 许可证。完整版权声明见 [LICENSE](./LICENSE)。

MIT 许可证仅适用于本项目代码，不授予任何第三方素材的版权或使用许可。请仅下载有权保存和使用的公开素材，并遵守相关平台条款和适用法律。

## 致谢

项目由 XC 维护，基于 [fansanqiu/eagle-video-downloader](https://github.com/fansanqiu/eagle-video-downloader) 开发。该上游项目源自 [OlivierEstevez/eagle-twitter-video-downloader](https://github.com/OlivierEstevez/eagle-twitter-video-downloader)。感谢上游维护者及贡献者的工作。

隐私处理方式见 [PRIVACY.md](./PRIVACY.md)。第三方组件和运行时依赖说明见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

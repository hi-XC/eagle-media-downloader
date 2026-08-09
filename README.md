# Eagle Media Downloader

[English](./README.en.md) | 中文

> 当前版本为独立开发预览版，暂用名“媒体下载器”。项目由 XC 维护，基于 fansanqiu 的 MIT 开源项目开发，并使用独立的 Eagle 插件 ID。

从 1000+ 网站直接下载视频到 Eagle。基于 [yt-dlp](https://github.com/yt-dlp/yt-dlp) 构建。

## 支持的平台

YouTube、Twitter / X、TikTok、Bilibili、Instagram、Vimeo 以及[更多平台](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)。

## 功能特性

支持 1000+ 视频网站，首次运行自动下载 yt-dlp，使用 Eagle 内置 ffmpeg 合并音视频，下载完成后自动导入到 Eagle 并保存元数据，支持中英文界面，显示实时下载进度。

开发版新增 Instagram 帖子与 Carousel 支持：按原顺序下载纯图片、纯视频或混合内容，每个素材作为独立 Eagle 项目导入。当前仅处理无需登录即可访问的公开内容，不读取浏览器 Cookie。

## 安装方式

从 [GitHub Releases](https://github.com/hi-XC/eagle-media-downloader/releases) 下载最新的 `.eagleplugin` 安装包并打开安装。插件通过 Eagle 审核后，也会提供插件中心安装方式。

## 首次运行

首次启动时插件会自动下载 yt-dlp（约 30MB）。ffmpeg 直接使用 Eagle 内置版本，无需额外下载。

## 使用方法

1. 复制视频链接
2. 粘贴到插件输入框
3. 点击下载按钮
4. 下载完成后自动导入到 Eagle

## 开发

```bash
npm install      # 安装依赖
npm run build    # 构建插件
npm run dev      # 开发模式（监听文件变化）
```

项目使用 esbuild 打包，i18next 国际化，yt-dlp 负责视频提取，ffmpeg 由 Eagle 内置提供。

## 系统要求

Eagle 4.0 或更高版本，需要网络连接。

## 开源协议

本项目使用 MIT 许可证，完整版权声明见 [LICENSE](./LICENSE)。

软件许可证不授予任何第三方素材的使用权。请仅下载你有权保存和使用的公开素材，并遵守相关平台条款和适用法律。

## 致谢

本项目基于 [fansanqiu/eagle-video-downloader](https://github.com/fansanqiu/eagle-video-downloader) 开发；该项目源自 [OlivierEstevez/eagle-twitter-video-downloader](https://github.com/OlivierEstevez/eagle-twitter-video-downloader)。感谢两位上游维护者及贡献者的工作。

第三方组件及运行时依赖说明见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

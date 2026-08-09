# Eagle Media Downloader 发布说明

本文档用于准备 GitHub Release 和后续 Eagle 插件中心提交。公开名称仍可在正式上架前调整。

## 插件名称

中文：媒体下载器

英文：Media Downloader

## 简短描述

中文：将公开帖文中的图片和视频下载并导入 Eagle。

英文：Download images and videos from public posts directly into Eagle.

## 详细说明（中文）

媒体下载器是一款由 XC 维护的 Eagle 插件。当前开发预览版重点支持无需登录即可访问的 Instagram 公开帖子，包括纯图片、纯视频以及图片和视频混合的 Carousel。

插件会按照原帖顺序处理素材，并将每个成功下载的项目分别导入 Eagle。下载过程中显示解析状态、总体进度和当前项目进度；单个素材失败不会影响其他成功项目。插件不会读取浏览器 Cookie，也不会处理需要登录才能访问的内容。

首次运行时插件会下载 yt-dlp，并优先使用 Eagle 内置的 ffmpeg。系统要求为 Eagle 4.0 或更高版本，并需要网络连接。

软件许可证不授予任何第三方素材的使用权。请仅下载你有权保存和使用的公开素材，并遵守相关平台条款和适用法律。

项目基于 fansanqiu/eagle-video-downloader 开发，该项目源自 OlivierEstevez/eagle-twitter-video-downloader。完整来源与许可证信息见项目仓库。

## Detailed Description (English)

Media Downloader is an Eagle plugin maintained by XC. The current development preview focuses on public Instagram posts available without login, including image-only, video-only, and mixed-media carousels.

The plugin preserves the original post order and imports each successfully downloaded item separately into Eagle. It displays parsing status, overall progress, and current-item progress. A failed item does not discard other successful downloads. The plugin does not read browser cookies or process login-required content.

On first launch, the plugin downloads yt-dlp and prefers Eagle's built-in ffmpeg. Eagle 4.0 or higher and an internet connection are required.

The software license does not grant rights to third-party media. Only download public media that you are authorized to save and use, and comply with applicable platform terms and laws.

The project is based on fansanqiu/eagle-video-downloader, which was derived from OlivierEstevez/eagle-twitter-video-downloader. See the project repository for complete attribution and license information.

## 建议标签 / Suggested Tags

中文：媒体下载、Instagram、图片下载、视频下载、Carousel、yt-dlp

English: media downloader, Instagram, image downloader, video downloader, carousel, yt-dlp

## v0.1.0 更新内容

- 支持 Instagram 公开帖子和混合 Carousel
- 按原帖顺序分别导入图片和视频
- 显示解析、总体和当前项目进度
- 单项失败时保留其他成功素材
- 支持窗口置顶
- 不读取浏览器 Cookie 或处理登录内容

# 素材下载助手发布说明

本文档用于准备 GitHub Release 和 Eagle 插件中心提交。

## 插件名称

中文：素材下载助手

英文：Media Downloader

## 简短描述

中文：将公开 Instagram 帖子和轮播帖中的图片与视频分别导入 Eagle。

英文：Import images and videos from public Instagram posts and carousels directly into Eagle.

## 详细说明（中文）

素材下载助手可将无需登录即可访问的公开 Instagram 图片帖、视频帖及混合媒体轮播帖导入当前 Eagle 素材库。

首次使用时，插件会在设置页检查 yt-dlp 和 FFmpeg。若缺少 yt-dlp，请点击「安装」；插件会从 yt-dlp 官方 GitHub Release 下载固定版本并校验 SHA-256。若缺少 FFmpeg，请安装 Eagle 官方 FFmpeg 依赖。两项依赖均准备就绪后，插件才会开放主界面。

每张可访问的图片和每个视频都会作为独立项目导入当前素材库。插件会显示解析状态、总体进度和当前素材进度；单个素材失败时，其他已成功导入的素材会保留。

插件只接受符合支持范围的 Instagram HTTPS 帖子链接，并直接连接 Instagram 及其素材分发域名。插件不读取浏览器 Cookie、浏览历史或账号凭据，也不处理私密或需要登录的内容。来源链接、素材标题及最多 500 个字符的公开帖子描述会保存到导入项目中。

软件许可证不授予任何第三方素材的使用权。请仅下载你有权保存和使用的公开素材，并遵守相关平台条款和适用法律。

项目基于 fansanqiu/eagle-video-downloader 开发，该项目源自 OlivierEstevez/eagle-twitter-video-downloader。完整来源与许可证信息见项目仓库。

## Detailed Description (English)

Media Downloader imports media from publicly accessible Instagram image posts, video posts, and mixed-media carousels into the current Eagle library.

On first use, the settings page checks for yt-dlp and FFmpeg. If yt-dlp is missing, select Install to download a pinned release from the official yt-dlp GitHub repository and verify its SHA-256 checksum. If FFmpeg is missing, install Eagle's official FFmpeg dependency. The main view becomes available after both components are ready.

Each accessible image and video is imported as a separate item into the current library. The plugin shows parsing status, overall progress, and current-item progress. If an individual item fails, other successfully imported items are retained.

The plugin accepts only supported Instagram HTTPS post URLs and connects directly to Instagram and its media delivery domains. It does not access browser cookies, browsing history, account credentials, private posts, or login-required content. The source URL, media title, and up to 500 characters of the public post description are saved with imported items.

The software license does not grant rights to third-party media. Only download public media that you are authorized to save and use, and comply with applicable platform terms and laws.

The project is based on fansanqiu/eagle-video-downloader, which was derived from OlivierEstevez/eagle-twitter-video-downloader. See the project repository for complete attribution and license information.

## 建议标签 / Suggested Tags

中文：媒体下载、Instagram、图片下载、视频下载、Carousel、yt-dlp

English: media downloader, Instagram, image downloader, video downloader, carousel, yt-dlp

## v0.2.3 更新内容

- 支持 Instagram 公开帖子和混合 Carousel
- 将每张可访问的图片和每个视频作为独立项目导入
- 显示解析、总体和当前项目进度
- 单项失败时保留其他成功素材
- 支持窗口置顶
- 支持中英文界面以及浅色和深色主题
- 设置页显示当前插件版本
- 使用 Eagle 官方 FFmpeg 依赖
- 不读取浏览器 Cookie 或处理登录内容
- 仅接受 Instagram HTTPS `/p/<shortcode>` 帖子链接，并验证重定向目的地

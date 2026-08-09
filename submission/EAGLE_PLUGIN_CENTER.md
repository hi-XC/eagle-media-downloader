# Eagle 插件中心上架资料

本文档用于准备 Eagle 插件中心首次审核。正式提交前，需要完成 Windows 实机测试并更新正式截图。

## 当前状态

| 项目 | 状态 |
| --- | --- |
| 插件功能 | 可用，重点支持 Instagram 公开帖子和 Carousel |
| macOS 测试 | 已完成基础验证 |
| Windows 测试 | `0.2.0` 核心流程通过；`0.2.1` 界面修复待复测 |
| 图标 | 512 x 512 PNG，已准备 |
| 功能截图 | 已准备 4 张预览图；正式名称确认后需输出 2 倍分辨率版本 |
| 封面图 | 待正式名称确认后重制 |
| FFmpeg | 已改用 Eagle 官方依赖插件 |
| yt-dlp | 固定版本、官方地址、SHA-256 校验 |
| 隐私政策 | 已准备中英文版本 |
| 支持渠道 | GitHub Issues |
| 插件名称 | `Media Downloader` / `素材下载助手` |
| 审核测试方式 | 审核人员可使用任意无需登录的公开 Instagram 帖子 |

## 插件名称

`Media Downloader` / `素材下载助手`

注意：英文名称与插件中心已有的视频下载类插件较接近。提交时需要准确说明图片、视频和 Carousel 导入能力，以降低被要求修改名称的可能性。

## 商店简短描述

### 简体中文

将公开 Instagram 帖子和轮播帖中的图片与视频按原顺序导入 Eagle。

### English

Import images and videos from public Instagram posts and carousels directly into Eagle.

## 商店详细描述

### 简体中文

素材下载助手用于将公开 Instagram 帖子中的图片和视频导入 Eagle。

- 每张图片和每个视频分别导入，并保留帖子中的原始顺序。
- 支持纯图片、纯视频，以及图片和视频混合的 Carousel。
- 显示解析状态、总体进度和当前素材进度。
- 单个素材处理失败时，保留其他已成功导入的素材。
- 记录公开来源链接、素材标题和帖子描述，不自动添加平台标签。
- 不读取浏览器 Cookie、浏览历史或账号凭据，不支持私密或需要登录的内容。

插件首次运行时会从 yt-dlp 官方 GitHub Release 下载固定版本，并校验 SHA-256。FFmpeg 由 Eagle 官方依赖插件安装和管理。

### English

Media Downloader brings images and videos from public Instagram posts into Eagle.

- Imports each image and video separately in the original post order.
- Supports image-only, video-only, and mixed-media carousels.
- Shows parsing status, overall progress, and current-item progress.
- Keeps successfully imported media when an individual item fails.
- Records the public source URL, media title, and post description without adding platform tags automatically.
- Does not access browser cookies, browsing history, account credentials, private posts, or login-required content.

On first launch, the plugin downloads a pinned yt-dlp release from the official GitHub repository and verifies its SHA-256. FFmpeg is installed and managed through Eagle's official dependency plugin.

## 关键词

`media`, `download`, `instagram`, `carousel`, `image`, `video`

## 链接

- 作者：XC
- 项目主页：https://github.com/hi-XC/eagle-media-downloader
- 支持：https://github.com/hi-XC/eagle-media-downloader/issues
- 隐私政策：https://github.com/hi-XC/eagle-media-downloader/blob/main/PRIVACY.md
- 源代码：https://github.com/hi-XC/eagle-media-downloader

## 首次发布说明

### 简体中文

- 支持导入 Instagram 公开图片帖、视频帖和混合轮播帖。
- 按原始顺序分别导入每项素材。
- 增加逐项进度、总体进度和窗口置顶。
- 不自动添加来源平台标签。
- 使用 Eagle 官方 FFmpeg 依赖，并校验运行时下载的 yt-dlp。

### English

- Imports public Instagram image posts, video posts, and mixed-media carousels.
- Preserves the original order and imports each media item separately.
- Adds per-item progress, overall progress, and an always-on-top option.
- Does not add platform tags automatically.
- Uses Eagle's official FFmpeg dependency and verifies the downloaded yt-dlp executable.

## 提交前检查

1. 按 [Windows 实机测试清单](./WINDOWS_TEST.md) 完成测试并记录结果。
2. Windows 测试通过后，保留 `platform: all`；未通过时，首版改为仅支持 macOS。
3. 在安装了正式包的 Eagle 中重新截取主界面、下载中、完成和设置页。
4. 确认隐私政策和支持链接可以公开访问。
5. 使用 Eagle 的「Pack Plugin」生成最终 `.eagleplugin` 文件。
6. 在干净环境中安装最终包，完成首次依赖安装和完整下载测试。

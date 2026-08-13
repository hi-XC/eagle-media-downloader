# Eagle 插件中心上架资料

本文档用于准备 Eagle 插件中心首次审核。Windows 实机测试、正式截图和封面图均已完成。

## 当前状态

| 项目 | 状态 |
| --- | --- |
| 插件功能 | 仅支持 Instagram 公开 `/p/<shortcode>` 帖子和 Carousel |
| macOS 测试 | 已完成基础验证 |
| Windows 测试 | `0.2.2` 全部通过；`0.2.3` 的平台无关安全规则已通过自动化回归测试 |
| 最终上架包 | `media-downloader-v0.2.3.eagleplugin`，已通过完整性检查 |
| 图标 | 512 x 512 PNG，已准备 |
| 功能截图 | 中英文各 4 张，800 × 600 px，已完成 |
| 封面图 | 中英文各 1 张，1560 × 1040 px，已完成 |
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

将公开 Instagram 帖子和轮播帖中的图片与视频分别导入 Eagle。

### English

Import images and videos from public Instagram posts and carousels directly into Eagle.

## 商店详细描述

### 简体中文

<p>素材下载助手可将无需登录即可访问的公开 Instagram 图片帖、视频帖及混合媒体轮播帖导入当前 Eagle 素材库。</p><p>首次使用时，插件会在设置页检查 yt-dlp 和 FFmpeg。若缺少 yt-dlp，请点击“安装”，插件会从 yt-dlp 官方 GitHub Release 下载固定版本并校验 SHA-256；若缺少 FFmpeg，请安装 Eagle 官方 FFmpeg 依赖。两项依赖均准备就绪后，插件才会开放主界面。</p><p>使用方法：</p><ol><li>复制公开 Instagram 帖子链接。</li><li>打开插件，粘贴链接并开始下载。</li><li>等待解析、下载和导入完成。每张可访问的图片和每个视频都会作为独立项目导入当前素材库。</li></ol><p>插件会显示解析状态、总体进度和当前素材进度。单个素材失败时，其他已成功导入的素材会保留。</p><p>插件会直接连接所提交的来源网站及其素材分发域名，不读取浏览器 Cookie、浏览历史或账号凭据，也不处理私密或需要登录的内容。来源链接、素材标题及最多 500 个字符的公开帖子描述会保存到导入项目中。</p>

### English

<p>Media Downloader imports media from publicly accessible Instagram image posts, video posts, and mixed-media carousels into the current Eagle library.</p><p>On first use, the settings page checks for yt-dlp and FFmpeg. If yt-dlp is missing, select Install to download a pinned release from the official yt-dlp GitHub repository and verify its SHA-256 checksum. If FFmpeg is missing, install Eagle's official FFmpeg dependency. The main view becomes available after both components are ready.</p><p>How to use:</p><ol><li>Copy the URL of a public Instagram post that is accessible without signing in.</li><li>Open the plugin, paste the URL, and start the download.</li><li>Wait for parsing, downloading, and importing to finish. Each accessible image and video is imported as a separate item into the current library.</li></ol><p>The plugin shows parsing status, overall progress, and current-item progress. If an individual item fails, other successfully imported items are retained.</p><p>The plugin connects directly to the submitted source website and its media delivery domains. It does not access browser cookies, browsing history, account credentials, private posts, or login-required content. The source URL, media title, and up to 500 characters of the public post description are saved with imported items.</p>

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
- 将每张可访问的图片和每个视频作为独立项目导入。
- 增加逐项进度、总体进度和窗口置顶。
- 不自动添加来源平台标签。
- 使用 Eagle 官方 FFmpeg 依赖，并校验运行时下载的 yt-dlp。
- 将网络入口限制为 Instagram HTTPS `/p/<shortcode>` 帖子，并验证重定向目的地。

### English

- Imports public Instagram image posts, video posts, and mixed-media carousels.
- Imports each accessible image and video as a separate item.
- Adds per-item progress, overall progress, and an always-on-top option.
- Does not add platform tags automatically.
- Uses Eagle's official FFmpeg dependency and verifies the downloaded yt-dlp executable.
- Restricts network entry points to Instagram HTTPS `/p/<shortcode>` posts and validates redirect destinations.

## 提交前检查

1. 按 [Windows 实机测试清单](./WINDOWS_TEST.md) 完成测试并记录结果。
2. Windows 测试通过后，保留 `platform: all`；未通过时，首版改为仅支持 macOS。
3. 上传 `submission/assets` 中对应语言的封面图和功能截图。
4. 确认隐私政策和支持链接可以公开访问。
5. 使用 Eagle 的「Pack Plugin」生成最终 `.eagleplugin` 文件。
6. 在干净环境中安装最终包，完成首次依赖安装和完整下载测试。

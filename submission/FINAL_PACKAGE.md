# 最终上架包

生成日期：2026 年 8 月 13 日

| 项目 | 内容 |
| --- | --- |
| 文件 | `media-downloader-v0.2.3.eagleplugin` |
| 插件版本 | `0.2.3` |
| 支持平台 | macOS、Windows |
| 文件大小 | 211 KB |
| SHA-256 | `20d11c8f9ba591eeeeae0b06c5f5172bb218fc6b014866fa7ab4cef00300fafb` |

## 已检查

- 压缩包结构完整，无损坏文件。
- `manifest.json` 版本为 `0.2.3`，平台为 `all`。
- 仅声明 Eagle 官方 `ffmpeg` 依赖。
- 不包含运行时下载的 `yt-dlp`、`node_modules` 或系统隐藏文件。
- 包内包含 README、隐私政策、许可证和第三方组件说明。
- 所有来源入口均限制为 Instagram HTTPS `/p/<shortcode>` 帖子链接。
- yt-dlp 启动前会检查 HTTP 重定向目的地。
- 重定向检查使用 Eagle 的 Chromium 网络层，可沿用系统代理配置。

`.eagleplugin` 文件属于本地发布产物，不提交到 Git 仓库。上传前可使用本页的 SHA-256 校验值确认文件未发生变化。

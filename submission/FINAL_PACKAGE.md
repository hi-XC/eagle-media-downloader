# 最终上架包

生成日期：2026 年 8 月 17 日

| 项目 | 内容 |
| --- | --- |
| 文件 | `media-downloader-v0.2.4.eagleplugin` |
| 插件版本 | `0.2.4` |
| 支持平台 | macOS、Windows |
| 文件大小 | 220 KB（225,625 bytes） |
| SHA-256 | `c2522bac58d5e14b1a7f0f784de06608d157290e71ee12ea9e92d13bea9fed93` |

## 已检查

- 压缩包结构完整，无损坏文件。
- `manifest.json` 版本为 `0.2.4`，平台为 `all`。
- 仅声明 Eagle 官方 `ffmpeg` 依赖。
- 不包含运行时下载的 `yt-dlp`、`node_modules` 或系统隐藏文件。
- 包内包含 README、隐私政策、许可证和第三方组件说明。
- 所有来源入口均限制为 Instagram HTTPS `/p/<shortcode>` 帖子链接。
- yt-dlp 启动前会检查 HTTP 重定向目的地。
- 重定向检查优先使用 Eagle 的网络会话；在 macOS 上也可沿用已启用的系统 HTTP(S) 代理。

`.eagleplugin` 文件属于本地发布产物，不提交到 Git 仓库。上传前可使用本页的 SHA-256 校验值确认文件未发生变化。

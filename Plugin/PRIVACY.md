# Privacy and Data Handling

Media Downloader processes only supported public Instagram post links submitted by the user. Source URLs must use HTTPS, belong to `instagram.com` or a valid subdomain, and use the `/p/<shortcode>` path. It does not use an author-controlled server, analytics, advertising, browser cookies, browsing history, account credentials, or private posts.

The plugin connects directly to Instagram and its Instagram/Facebook media delivery domains. It validates source URLs before queueing, retrying, or invoking yt-dlp, and requires HTTP redirect destinations to remain within the supported Instagram post URL policy. It uses Eagle APIs to import media and downloads a pinned, SHA-256-verified yt-dlp executable from the official yt-dlp GitHub Release when required. FFmpeg is provided through Eagle's official dependency plugin.

The source URL, media title, and up to 500 characters of the public post description are stored with the imported Eagle item. Temporary media files are removed after a normal import, but may remain in the operating system's temporary directory if Eagle or the plugin exits unexpectedly.

Full policy: https://github.com/hi-XC/eagle-media-downloader/blob/main/PRIVACY.md

Support: https://github.com/hi-XC/eagle-media-downloader/issues

---

# 隐私与数据处理

素材下载助手只处理用户主动提交且符合支持范围的 Instagram 公开帖子链接。来源链接必须使用 HTTPS，主机须为 `instagram.com` 或其合法子域名，路径须为 `/p/<shortcode>`。插件不使用作者自建服务器，不包含分析或广告功能，也不读取浏览器 Cookie、浏览历史、账号凭据或私密帖子。

插件会直接连接 Instagram 及 Instagram/Facebook 素材分发域名，并通过 Eagle API 导入素材。插件会在任务进入队列、重试和调用 yt-dlp 前校验来源链接，并要求 HTTP 重定向目标仍符合 Instagram 帖子链接规则。需要安装 yt-dlp 时，插件只从 yt-dlp 官方 GitHub Release 下载固定版本，并在使用前校验 SHA-256。FFmpeg 由 Eagle 官方依赖插件提供。

插件会将来源链接、素材标题和不超过 500 个字符的公开帖子描述写入 Eagle 素材信息。正常完成导入后，插件会删除临时素材文件；如果 Eagle 或插件意外退出，临时文件可能保留在操作系统的临时目录中。

完整政策：https://github.com/hi-XC/eagle-media-downloader/blob/main/PRIVACY.md

支持：https://github.com/hi-XC/eagle-media-downloader/issues

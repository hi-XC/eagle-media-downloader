# Privacy Policy

Last updated: August 13, 2026

## Summary

Media Downloader processes only supported public Instagram post links submitted by the user. Source URLs must use HTTPS, belong to `instagram.com` or a valid subdomain, and use the `/p/<shortcode>` path. The plugin does not operate an author-controlled server, include analytics or advertising, or read browser cookies, browsing history, account credentials, or private posts.

## Data Processed

When a user starts a download, the plugin processes:

- the submitted post URL;
- public metadata returned by Instagram, such as the post title and description;
- public images and videos selected for import;
- download progress and error messages shown in the plugin window.

The plugin records the source URL, media title, and up to 500 characters of the public post description in the imported Eagle item. It does not add platform tags automatically.

## Network Connections

The plugin connects directly to:

- Instagram and the Instagram/Facebook media delivery domains required to process the submitted public post;
- Eagle APIs used to import media into the current Eagle library;
- the official yt-dlp GitHub Release when yt-dlp must be installed or updated.

The plugin applies the same source URL policy before queueing, retrying, or invoking yt-dlp. HTTP redirects are checked before yt-dlp starts and must remain within the supported Instagram post URL policy. Submitted links and media are not sent to a server operated by the plugin author. Instagram, GitHub, and Eagle handle data under their own terms and privacy policies.

## Local Storage

The plugin stores the always-on-top preference locally. It also stores the verified yt-dlp executable inside the plugin directory. Downloaded video files and image fallbacks are created in the operating system's temporary directory and are removed after import when processing completes normally. Temporary files may remain if Eagle or the plugin exits unexpectedly.

Imported media and source metadata remain in the user's Eagle library until the user removes them.

## User Control

The plugin runs only after a user submits a link and starts the download. It does not access private or login-required content and does not attempt to sign in to a source platform. Users should submit only public links and media they are authorized to save and use.

## Contact

Questions and privacy requests may be submitted through [GitHub Issues](https://github.com/hi-XC/eagle-media-downloader/issues).

---

# 隐私政策

最后更新：2026 年 8 月 13 日

## 摘要

素材下载助手只处理用户主动提交且符合支持范围的 Instagram 公开帖子链接。来源链接必须使用 HTTPS，主机须为 `instagram.com` 或其合法子域名，路径须为 `/p/<shortcode>`。插件不使用作者自建服务器，不包含分析或广告功能，也不读取浏览器 Cookie、浏览历史、账号凭据或私密帖子。

## 处理的数据

用户开始下载后，插件会处理以下数据：

- 用户提交的帖子链接；
- Instagram 返回的公开信息，例如帖子标题和描述；
- 准备导入的公开图片和视频；
- 插件窗口中显示的下载进度和错误信息。

插件会将来源链接、素材标题和不超过 500 个字符的公开帖子描述写入 Eagle 素材信息。插件不会自动添加来源平台标签。

## 网络连接

插件会直接连接以下服务：

- 处理公开帖子所需的 Instagram 及 Instagram/Facebook 素材分发域名；
- 将素材导入当前 Eagle 素材库所需的 Eagle API；
- 安装或更新 yt-dlp 时使用的 yt-dlp 官方 GitHub Release。

插件会在任务进入队列、重试和调用 yt-dlp 前执行同一套来源链接校验。yt-dlp 启动前，插件会逐跳检查 HTTP 重定向；目标地址仍须符合 Instagram 帖子链接规则。插件不会将链接或素材发送到插件作者控制的服务器。Instagram、GitHub 和 Eagle 会按照各自的条款和隐私政策处理数据。

## 本地存储

插件会在本地保存窗口置顶偏好，并在插件目录内保存已经校验的 yt-dlp 可执行文件。视频和图片备用文件会暂存在操作系统的临时目录中；正常完成导入后，插件会删除这些临时文件。如果 Eagle 或插件意外退出，临时文件可能保留。

导入的素材和来源信息会保留在 Eagle 素材库中，直至用户自行删除。

## 用户控制

只有在用户提交链接并开始下载后，插件才会运行。插件不访问私密或需要登录的内容，也不会尝试登录来源平台。用户应仅提交公开链接，并确保有权保存和使用对应素材。

## 联系方式

如需咨询隐私处理方式，可通过 [GitHub Issues](https://github.com/hi-XC/eagle-media-downloader/issues) 联系维护者。

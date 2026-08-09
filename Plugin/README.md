# Reviewer Notes / 审核说明

## Purpose

This plugin imports images and videos from user-submitted public post links into the current Eagle library. The current release focuses on public Instagram posts and carousels. It does not access private or login-required content.

本插件将用户主动提交的公开帖子中的图片和视频导入当前 Eagle 素材库。当前版本重点支持 Instagram 公开帖子和轮播帖，不访问私密或需要登录的内容。

## Runtime Dependencies

- The package does not bundle executable binaries.
- FFmpeg is declared as an Eagle dependency in `manifest.json` and is resolved through `eagle.extraModule.ffmpeg`.
- yt-dlp `2026.07.04` is downloaded only from the official yt-dlp GitHub Release. The executable is verified with a platform-specific SHA-256 hash before use.
- The plugin does not use download mirrors or disable TLS certificate verification.

## Data and Network Use

- User-submitted public links are processed directly against the source website and its media delivery domains.
- The plugin has no author-controlled server, analytics, advertising, or telemetry.
- Browser cookies, browsing history, account credentials, and private posts are not accessed.
- The source URL, media title, and up to 500 characters of the public description are stored with imported Eagle items.

See `PRIVACY.md` and `THIRD_PARTY_NOTICES.md` for details.

## Review Steps

1. Install the plugin in Eagle 4.0 or later.
2. Accept Eagle's prompt to install the official FFmpeg dependency if it is not already installed.
3. Open the plugin. Install yt-dlp from the settings view when prompted.
4. Paste a publicly accessible Instagram post URL, including a carousel when available.
5. Start the download and confirm that each accessible image or video is imported as a separate Eagle item in the original post order.
6. Confirm that imported items include the public source URL and do not receive automatic platform tags.

Support: https://github.com/hi-XC/eagle-media-downloader/issues

Privacy: https://github.com/hi-XC/eagle-media-downloader/blob/main/PRIVACY.md

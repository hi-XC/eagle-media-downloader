# Eagle Media Downloader

English | [中文](./README.md)

Download images and videos from public posts directly into [Eagle](https://eagle.cool/). The current development preview focuses on Instagram posts and carousels while retaining the upstream project's yt-dlp-based video download support.

**[Download v0.1.0 Development Preview](https://github.com/hi-XC/eagle-media-downloader/releases/tag/v0.1.0)**

> The current version has been tested on macOS with Eagle 4.0. Full Windows testing is still pending.

## Current Scope

| Content | Status |
| --- | --- |
| Public Instagram posts | Images and videos supported |
| Public Instagram carousels | Image-only, video-only, and mixed content supported |
| Other yt-dlp video sites | Upstream support retained; not tested individually |
| Private, login-required, or restricted content | Not supported |
| Browser cookies | Not accessed |

## Features

- Imports carousel images and videos separately in their original order
- Shows parsing status, overall progress, and current-item progress
- Keeps successful items when an individual download fails
- Imports completed media into Eagle with source information
- Supports always-on-top mode, Chinese and English, and light and dark themes
- Does not add platform tags automatically

## Interface

| Paste a Link | Download Progress |
| --- | --- |
| ![Idle interface](./docs/screenshots/idle.png) | ![Download progress](./docs/screenshots/downloading.png) |

| Completed | Settings |
| --- | --- |
| ![Completed downloads](./docs/screenshots/completed.png) | ![Settings](./docs/screenshots/settings.png) |

## Installation

Eagle 4.0 or higher and an internet connection are required.

1. Open the [v0.1.0 release](https://github.com/hi-XC/eagle-media-downloader/releases/tag/v0.1.0).
2. Under `Assets`, download `eagle-media-downloader-v0.1.0.eagleplugin`.
3. Open the package and follow the Eagle installation prompt.

The package does not include `yt-dlp` or `ffmpeg`. On first launch, the plugin downloads `yt-dlp`. It prefers Eagle's built-in `ffmpeg` when audio and video processing is required.

## Usage

1. Copy a public post link.
2. Paste the link into the plugin input field.
3. Click the download button.
4. Wait for the media to be imported into Eagle.

## Development

```bash
npm install
npm test
npm run build
npm run package
```

Source files are in `js/`, and the built Eagle plugin is in `Plugin/`. The project uses esbuild, i18next, and yt-dlp. See [ROADMAP.md](./ROADMAP.md) for planned work.

## Support

When opening a [GitHub Issue](https://github.com/hi-XC/eagle-media-downloader/issues), include the operating system, Eagle version, plugin version, and error message. Only provide a public post URL when it is safe to share publicly.

## License and Usage

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for the complete copyright notices.

The software license does not grant rights to third-party media. Only download public media that you are authorized to save and use, and comply with applicable platform terms and laws.

## Acknowledgements

Maintained by XC and based on [fansanqiu/eagle-video-downloader](https://github.com/fansanqiu/eagle-video-downloader), which was derived from [OlivierEstevez/eagle-twitter-video-downloader](https://github.com/OlivierEstevez/eagle-twitter-video-downloader). Thanks to the upstream maintainers and contributors.

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for third-party components and runtime dependencies.

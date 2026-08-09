# Media Downloader for Eagle

English | [中文](./README.md)

Download images and videos from public posts directly into [Eagle](https://eagle.cool/). The current version focuses on public Instagram posts, including image posts, video posts, and carousels. Video download support for other sites is inherited from the upstream yt-dlp-based project and has not been tested individually.

**Current version: v0.2.2 (Eagle Plugin Center submission candidate)**

> Tested with Eagle 4.0 on macOS and Windows.

## Supported Content

| Content | Status |
| --- | --- |
| Public Instagram image or video posts | Supported |
| Public Instagram carousel posts | Image-only, video-only, and mixed-media carousels supported |
| Other video sites supported by yt-dlp | Upstream capability retained; not tested individually in this release |
| Private, login-required, or access-restricted content | Not supported |
| Browser cookies | Not accessed |

## Features

- Imports every image and video separately in the original post order
- Shows post parsing status, overall progress, and current-item progress
- Keeps other successful downloads when an individual item fails
- Imports completed media into Eagle and records source information
- Supports always-on-top mode, Chinese and English interfaces, and light and dark themes
- Does not add platform tags automatically during import

## Interface

| Paste a Link | Downloading |
| --- | --- |
| ![Waiting for a post link](./docs/screenshots/idle.png?v=0.2.2) | ![Current item and overall download progress](./docs/screenshots/downloading.png?v=0.2.2) |

| Completed | Settings |
| --- | --- |
| ![Completed downloads](./docs/screenshots/completed.png?v=0.2.2) | ![Download engine settings](./docs/screenshots/settings.png?v=0.2.2) |

## Installation

Requirements: Eagle 4.0 or higher and an internet connection.

`v0.2.2` is being prepared for submission to the Eagle Plugin Center. A public download link will be added with the first formal GitHub Release.

Developers can clone this repository, run `npm run package`, and open the generated `.eagleplugin` file to install it through Eagle.

The package does not include `yt-dlp` or `ffmpeg`. On first launch, the plugin downloads a pinned version from the official yt-dlp GitHub Release and verifies its integrity. FFmpeg is provided and managed through Eagle's official dependency plugin.

## Usage

1. Copy a post link that is accessible without signing in.
2. Paste the link into the plugin input field.
3. Click the download button.
4. Wait for the plugin to import the media into Eagle.

## Development

```bash
npm install
npm test
npm run build
npm run package
```

Source files are in `js/`, and the built Eagle plugin is in `Plugin/`. The project uses esbuild, i18next, and yt-dlp. See [ROADMAP.md](./ROADMAP.md) for planned work.

## Support

Open an issue through [GitHub Issues](https://github.com/hi-XC/eagle-media-downloader/issues). Include the operating system, Eagle version, plugin version, and error message. Only provide the original post link when the link and its content may be shared publicly.

## License and Usage

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for the complete copyright notices.

The MIT License applies only to this project's code. It does not grant copyright or usage rights for third-party media. Only download public media that you are authorized to save and use, and comply with applicable platform terms and laws.

## Acknowledgements

Maintained by XC and based on [fansanqiu/eagle-video-downloader](https://github.com/fansanqiu/eagle-video-downloader). That upstream project was derived from [OlivierEstevez/eagle-twitter-video-downloader](https://github.com/OlivierEstevez/eagle-twitter-video-downloader). Thanks to the upstream maintainers and contributors.

See [PRIVACY.md](./PRIVACY.md) for data handling details and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for third-party components and runtime dependencies.

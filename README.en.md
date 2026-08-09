# Eagle Media Downloader

English | [中文](./README.md)

> This is an independent development preview temporarily named Media Downloader. It is maintained by XC, based on fansanqiu's MIT-licensed project, and uses a separate Eagle plugin ID.

Download videos directly to Eagle from 1000+ websites. Built on [yt-dlp](https://github.com/yt-dlp/yt-dlp).

## Supported Platforms

YouTube, Twitter / X, TikTok, Bilibili, Instagram, Vimeo, and [many more](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md).

## Features

Supports 1000+ video websites. Downloads yt-dlp automatically on first run. Uses Eagle's built-in ffmpeg for audio/video merging. Automatically imports downloaded videos to Eagle with metadata. Supports Chinese and English interfaces with real-time progress display.

The development build adds Instagram post and carousel support. It preserves the original item order, supports image-only, video-only, and mixed carousels, and imports every item separately. It only handles public content available without login and does not read browser cookies.

## Installation

Download the latest `.eagleplugin` package from [GitHub Releases](https://github.com/hi-XC/eagle-media-downloader/releases) and open it to install. Plugin Center installation will be added after Eagle review.

## First Run

On first launch the plugin automatically downloads yt-dlp (~30MB). ffmpeg uses Eagle's built-in version — no additional download required.

## Usage

1. Copy a video link
2. Paste it into the plugin input box
3. Click the download button
4. The video is automatically imported to Eagle after download

## Development

```bash
npm install      # Install dependencies
npm run build    # Build plugin
npm run dev      # Development mode (watch for changes)
```

The project uses esbuild for bundling, i18next for internationalization, yt-dlp for video extraction, and Eagle's built-in ffmpeg.

## System Requirements

Eagle 4.0 or higher. Internet connection required.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for the complete copyright notices.

The software license does not grant rights to third-party media. Only download public media that you are authorized to save and use, and comply with applicable platform terms and laws.

## Acknowledgements

This project is based on [fansanqiu/eagle-video-downloader](https://github.com/fansanqiu/eagle-video-downloader), which was derived from [OlivierEstevez/eagle-twitter-video-downloader](https://github.com/OlivierEstevez/eagle-twitter-video-downloader). Thanks to both upstream maintainers and their contributors.

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for third-party components and runtime dependencies.

# Third-Party Notices

This project is distributed under the MIT License. It also uses or downloads the following third-party components.

## Bundled Dependency

- [i18next](https://github.com/i18next/i18next), MIT License. It is bundled into the plugin JavaScript during the build.

## Runtime Dependencies

The `.eagleplugin` package does not include yt-dlp or ffmpeg binaries. The plugin may use Eagle's built-in ffmpeg or download these tools at runtime when needed.

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) is primarily published under The Unlicense. Some release executables contain components under additional licenses; refer to the license notices shipped with the selected yt-dlp release.
- [FFmpeg](https://ffmpeg.org/) licensing depends on the selected build and configuration. On Windows, the optional fallback installer uses a GPL build published by [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds). On macOS, it may use a build provided by [eagle-app/eagle-plugin-ffmpeg](https://github.com/eagle-app/eagle-plugin-ffmpeg).

The third-party projects are independent of this repository. Their names and links are provided for attribution and license reference only.

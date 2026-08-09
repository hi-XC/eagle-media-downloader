# Third-Party Notices

This project is distributed under the MIT License. It also uses or downloads the following third-party components.

## Bundled Dependency

- [i18next](https://github.com/i18next/i18next), MIT License. It is bundled into the plugin JavaScript during the build.

## Runtime Dependencies

The `.eagleplugin` package does not include yt-dlp or FFmpeg binaries.

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) is downloaded from its official GitHub Release at runtime. The plugin pins the release version and verifies the downloaded executable with SHA-256 before use. yt-dlp is primarily published under The Unlicense. Some release executables contain components under additional licenses; refer to the notices included with the selected release.
- [FFmpeg](https://ffmpeg.org/) is supplied through Eagle's official FFmpeg dependency plugin. Its license depends on the build and configuration distributed by Eagle.

The third-party projects are independent of this repository. Their names and links are provided for attribution and license reference only.

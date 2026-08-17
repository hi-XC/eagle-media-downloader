# Third-Party Notices

This plugin is distributed under the MIT License. It also uses or downloads the following third-party components.

## Bundled Dependency

- [i18next](https://github.com/i18next/i18next), MIT License. It is bundled into the plugin JavaScript during the build.
- [https-proxy-agent](https://github.com/TooTallNate/proxy-agents), MIT License, and its bundled MIT-licensed dependencies `agent-base` and `debug`. They allow the plugin's HTTPS safety checks to use an enabled system HTTP(S) proxy.

## Runtime Dependencies

This package does not include yt-dlp or FFmpeg binaries.

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) is downloaded from its official GitHub Release at runtime. The plugin pins the release version and verifies the downloaded executable with SHA-256 before use. yt-dlp is primarily published under The Unlicense. Some release executables contain components under additional licenses; refer to the notices included with the selected release.
- [FFmpeg](https://ffmpeg.org/) is supplied through Eagle's official FFmpeg dependency plugin. Its license depends on the build and configuration distributed by Eagle.

The third-party projects are independent of this plugin. Their names and links are provided for attribution and license reference only.

# Roadmap

`v0.1.0` is the first usable development baseline. The following items are intentionally deferred so the current Instagram workflow can remain stable.

## Next Iterations

- Add a post-content selection panel inspired by [FastDL](https://fastdl.app/) and [SnapInsta](https://snapinsta.to/). After parsing a carousel, show every image and video, select all by default, and download only the items the user keeps checked.
- Improve media-type detection when Instagram and yt-dlp disagree about whether a carousel item is an image or a video.
- Refine progress feedback for Eagle `addFromURL` image imports, which currently expose item completion but not byte-level transfer progress.
- Complete Windows runtime and packaging tests.
- Add mixed image and video post support for X / Twitter, Threads, and Xiaohongshu in separate iterations.
- Finalize the public plugin name, store description, screenshots, privacy statement, and submission package.

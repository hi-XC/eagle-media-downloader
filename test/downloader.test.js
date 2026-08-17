const test = require("node:test");
const assert = require("node:assert/strict");

global.i18next = {
  t(key) {
    return key === "error.unknown" ? "Unknown" : "Untitled";
  },
};

const {
  buildInstagramCollectionInfo,
  canonicalizeInstagramPostUrl,
  isInstagramPostUrl,
  parseYtDlpProgressLine,
  selectInstagramImageUrl,
  createCollectionProgressHandler,
  createThumbnailProgressOutputHandler,
  parseElectronProxyRules,
  parseMacSystemProxy,
  resolveYtDlpProxy,
} = require("../js/downloader");

test("recognizes and canonicalizes Instagram post URLs", () => {
  const url = "https://www.instagram.com/p/ABC123/?img_index=2#fragment";
  assert.equal(isInstagramPostUrl(url), true);
  assert.equal(canonicalizeInstagramPostUrl(url), "https://www.instagram.com/p/ABC123/");
  assert.equal(isInstagramPostUrl("https://instagram.com/p/ABC_123-/"), true);
  assert.equal(isInstagramPostUrl("https://m.instagram.com/p/ABC123/"), true);
  assert.equal(isInstagramPostUrl("http://www.instagram.com/p/ABC123/"), false);
  assert.equal(isInstagramPostUrl("https://www.instagram.com/reel/ABC123/"), false);
  assert.equal(isInstagramPostUrl("https://www.instagram.com/p/ABC123/comments/"), false);
  assert.equal(isInstagramPostUrl("https://www.instagram.com.evil.test/p/ABC123/"), false);
  assert.equal(isInstagramPostUrl("https://127.0.0.1/p/ABC123/"), false);
  assert.equal(isInstagramPostUrl("https://localhost/p/ABC123/"), false);
  assert.equal(isInstagramPostUrl("https://user@instagram.com/p/ABC123/"), false);
  assert.equal(isInstagramPostUrl("https://instagram.com:8443/p/ABC123/"), false);
  assert.throws(() => canonicalizeInstagramPostUrl("https://example.com/p/ABC123/"));
});

test("treats a single Instagram post as a one-item collection", () => {
  const sourceUrl = "https://www.instagram.com/p/ABC123/";
  const collection = buildInstagramCollectionInfo({
    id: "video-1",
    title: "Post by example",
    formats: [{ url: "https://scontent.cdninstagram.com/video.mp4" }],
  }, sourceUrl);

  assert.equal(collection.type, "collection");
  assert.equal(collection.items.length, 1);
  assert.equal(collection.items[0].type, "video");
  assert.equal(collection.items[0].index, 1);
});

test("keeps carousel order and classifies videos and images", () => {
  const sourceUrl = "https://www.instagram.com/p/ABC123/";
  const info = {
    id: "ABC123",
    title: "Post by example",
    uploader: "Example",
    entries: [
      { id: "video-1", formats: [{ url: "https://example.com/video.mp4" }] },
      {
        id: "image-2",
        formats: [],
        thumbnail: "https://scontent.cdninstagram.com/image-2.jpg",
      },
      { id: "unknown-3", formats: [], thumbnails: [] },
    ],
  };

  const collection = buildInstagramCollectionInfo(info, sourceUrl);

  assert.equal(collection.type, "collection");
  assert.deepEqual(collection.items.map((item) => item.type), ["video", "image", "unsupported"]);
  assert.deepEqual(collection.items.map((item) => item.index), [1, 2, 3]);
  assert.deepEqual(collection.items.map((item) => item.title), [
    "Post by example 01",
    "Post by example 02",
    "Post by example 03",
  ]);
});

test("accepts Instagram CDN images and rejects unrelated hosts", () => {
  assert.equal(
    selectInstagramImageUrl({
      thumbnail: "https://example.com/not-instagram.jpg",
      thumbnails: [
        { url: "https://scontent.cdninstagram.com/full-size.jpg" },
      ],
    }),
    "https://scontent.cdninstagram.com/full-size.jpg",
  );

  assert.equal(
    selectInstagramImageUrl({ thumbnail: "https://127.0.0.1/private.jpg" }),
    null,
  );
});

test("parses structured yt-dlp progress output", () => {
  assert.deepEqual(
    parseYtDlpProgressLine("__EAGLE_PROGRESS__|5| 50.0%| 1.25MiB/s|00:04"),
    {
      percent: 50,
      playlistIndex: 5,
      totalSize: "",
      currentSpeed: "1.25MiB/s",
      eta: "00:04",
    },
  );
});

test("maps batch progress to a monotonic collection position", () => {
  const updates = [];
  const reportProgress = createCollectionProgressHandler(
    (progress) => updates.push(progress),
    [{ index: 1 }, { index: 2 }, { index: 5 }],
    0,
    12,
  );

  reportProgress({ playlistIndex: 5, percent: 50, currentSpeed: "1MiB/s" });

  assert.equal(updates[0].itemIndex, 3);
  assert.equal(updates[0].itemTotal, 12);
  assert.equal(updates[0].overallPercent, 100 / 4.8);
});

test("reports image entries as they start and finish", () => {
  const updates = [];
  const reportOutput = createThumbnailProgressOutputHandler(
    (progress) => updates.push(progress),
    [{ index: 3 }, { index: 4 }],
    3,
    12,
  );

  reportOutput("[download] Downloading item 1 of 2\n");
  reportOutput("[info] Writing video thumbnail 13 to: /tmp/03_image.jpg\n");

  assert.deepEqual(
    updates.map(({ itemIndex, itemTotal, percent }) => ({ itemIndex, itemTotal, percent })),
    [
      { itemIndex: 4, itemTotal: 12, percent: 0 },
      { itemIndex: 4, itemTotal: 12, percent: 100 },
    ],
  );
});

test("converts Electron proxy rules into yt-dlp proxy URLs", () => {
  assert.equal(parseElectronProxyRules("DIRECT"), null);
  assert.equal(
    parseElectronProxyRules("PROXY 127.0.0.1:7897; DIRECT"),
    "http://127.0.0.1:7897/",
  );
  assert.equal(
    parseElectronProxyRules("SOCKS5 127.0.0.1:7897"),
    "socks5://127.0.0.1:7897",
  );
  assert.equal(
    parseElectronProxyRules("HTTPS proxy.example.com:443"),
    "https://proxy.example.com/",
  );
  assert.equal(parseElectronProxyRules("PROXY user:pass@127.0.0.1:7897"), null);
  assert.equal(parseElectronProxyRules("PROXY 127.0.0.1:7897/path"), null);
});

test("reads the proxy from the active Electron session", async () => {
  const calls = [];
  const proxy = await resolveYtDlpProxy(
    "https://www.instagram.com/p/ABC123/",
    {
      async resolveProxy(url) {
        calls.push(url);
        return "PROXY 127.0.0.1:7897; DIRECT";
      },
    },
  );

  assert.deepEqual(calls, ["https://www.instagram.com/p/ABC123/"]);
  assert.equal(proxy, "http://127.0.0.1:7897/");
});

test("reads an enabled HTTPS proxy from macOS system settings", () => {
  const settings = `<dictionary> {
    HTTPSEnable : 1
    HTTPSPort : 7897
    HTTPSProxy : 127.0.0.1
  }`;

  assert.equal(parseMacSystemProxy(settings), "http://127.0.0.1:7897/");
  assert.equal(parseMacSystemProxy(settings.replace("HTTPSEnable : 1", "HTTPSEnable : 0")), null);
  assert.equal(parseMacSystemProxy(settings.replace("HTTPSPort : 7897", "HTTPSPort : 70000")), null);
});

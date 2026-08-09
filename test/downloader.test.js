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
} = require("../js/downloader");

test("recognizes and canonicalizes Instagram post URLs", () => {
  const url = "https://www.instagram.com/p/ABC123/?img_index=2#fragment";
  assert.equal(isInstagramPostUrl(url), true);
  assert.equal(canonicalizeInstagramPostUrl(url), "https://www.instagram.com/p/ABC123/");
  assert.equal(isInstagramPostUrl("https://www.instagram.com/reel/ABC123/"), false);
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

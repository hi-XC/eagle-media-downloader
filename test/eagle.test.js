const test = require("node:test");
const assert = require("node:assert/strict");

global.i18next = {
  t() {
    return "Downloaded media";
  },
};

const { importToEagle, importRemoteImagesToEagle } = require("../js/eagle");

test("imports media without automatically adding tags", async () => {
  let receivedOptions;
  global.eagle = {
    item: {
      async addFromPath(_mediaPath, options) {
        receivedOptions = options;
        return "item-id";
      },
    },
  };

  await importToEagle(
    "/tmp/media.jpg",
    {
      title: "Carousel item 01",
      description: "Description",
      extractor: "Instagram",
    },
    "https://www.instagram.com/p/ABC123/",
  );

  assert.equal(Object.hasOwn(receivedOptions, "tags"), false);
  assert.equal(receivedOptions.name, "Carousel item 01");
  assert.equal(receivedOptions.website, "https://www.instagram.com/p/ABC123/");
});

test("imports remote carousel images with at most eight concurrent Eagle requests", async () => {
  let activeRequests = 0;
  let maxActiveRequests = 0;
  const receivedOptions = [];

  global.eagle = {
    item: {
      async addFromURL(url, options) {
        activeRequests++;
        maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
        receivedOptions.push({ url, options });
        await new Promise((resolve) => setTimeout(resolve, 5));
        activeRequests--;
        return `item-${url}`;
      },
    },
  };

  const items = Array.from({ length: 20 }, (_, index) => ({
    type: "image",
    index: index + 1,
    title: `Carousel item ${String(index + 1).padStart(2, "0")}`,
    imageUrl: `https://scontent.cdninstagram.com/image-${index + 1}.jpg`,
  }));
  const updates = [];
  const outcome = await importRemoteImagesToEagle(
    items,
    "https://www.instagram.com/p/ABC123/",
    (progress) => updates.push(progress),
  );

  assert.equal(outcome.failures.length, 0);
  assert.equal(outcome.imported.length, 20);
  assert.equal(maxActiveRequests, 8);
  assert.deepEqual(outcome.imported.map((result) => result.item.index), items.map((item) => item.index));
  assert.equal(updates.some((progress) => progress.activeItems === 8), true);
  assert.equal(Object.hasOwn(receivedOptions[0].options, "tags"), false);
});

test("returns failed remote images for refresh or yt-dlp fallback", async () => {
  global.eagle = {
    item: {
      async addFromURL(url) {
        if (url.includes("image-2")) throw new Error("network failed");
        return "item-id";
      },
    },
  };

  const items = [
    { index: 1, title: "01", imageUrl: "https://scontent.cdninstagram.com/image-1.jpg" },
    { index: 2, title: "02", imageUrl: "https://scontent.cdninstagram.com/image-2.jpg" },
  ];
  const outcome = await importRemoteImagesToEagle(items, "https://www.instagram.com/p/ABC123/");

  assert.deepEqual(outcome.imported.map((result) => result.item.index), [1]);
  assert.deepEqual(outcome.failures.map((failure) => failure.item.index), [2]);
  assert.equal(outcome.failures[0].error, "network failed");
});

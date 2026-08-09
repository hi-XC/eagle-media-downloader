const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("uses Eagle's FFmpeg dependency and keeps store keywords within policy", () => {
  const manifest = JSON.parse(read("Plugin/manifest.json"));

  assert.deepEqual(manifest.dependencies, ["ffmpeg"]);
  assert.ok(manifest.keywords.length <= 6);
  assert.equal(new Set(manifest.keywords).size, manifest.keywords.length);
});

test("does not bypass TLS verification or use executable download mirrors", () => {
  const runtimeSource = [read("js/binary.js"), read("js/downloader.js")].join("\n");

  assert.doesNotMatch(runtimeSource, /rejectUnauthorized\s*:\s*false/);
  assert.doesNotMatch(runtimeSource, /--no-check-certificate/);
  assert.doesNotMatch(runtimeSource, /gh-proxy|ghfast/i);
  assert.doesNotMatch(runtimeSource, /\/releases\/latest\/download\//);
});

test("includes reviewer, privacy, and third-party notices in the package", () => {
  for (const relativePath of ["Plugin/README.md", "Plugin/PRIVACY.md", "Plugin/THIRD_PARTY_NOTICES.md"]) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `${relativePath} is missing`);
  }
});

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

test("limits runtime downloads to supported Instagram post URLs", () => {
  const downloader = read("js/downloader.js");
  const ui = read("js/ui.js");
  const policy = read("js/url-policy.js");

  assert.doesNotMatch(downloader, /bilibili|b23\.tv|vimeo/i);
  assert.doesNotMatch(downloader, /--dump-json/);
  assert.match(downloader, /validateYtDlpArgs\(args\)/);
  assert.match(downloader, /verifyInstagramRedirectChain/);
  assert.match(downloader, /redirect: "manual"/);
  assert.match(downloader, /requestOptions\.session = electronSession/);
  assert.match(downloader, /request\.followRedirect\(\)/);
  assert.match(ui, /isInstagramPostUrl/);
  assert.match(policy, /parsed\.protocol !== "https:"/);
  assert.match(policy, /INSTAGRAM_POST_PATH/);
});

test("keeps release metadata aligned with the implemented dependency flow", () => {
  const manifest = JSON.parse(read("Plugin/manifest.json"));
  const packageJson = JSON.parse(read("package.json"));
  const listing = read("submission/EAGLE_PLUGIN_CENTER.md");
  const readmes = [read("README.md"), read("README.en.md"), read("Plugin/README.md")].join("\n");

  assert.equal(packageJson.version, manifest.version);
  assert.doesNotMatch(listing, /original post order|原帖顺序|原始顺序|按原顺序/i);
  assert.doesNotMatch(readmes, /other video sites|其他网站的视频/i);
  assert.doesNotMatch(readmes, /on first launch, the plugin downloads|首次运行时，插件.*下载/i);
  assert.match(listing, /select Install|点击“安装”/);
});

test("includes reviewer, privacy, and third-party notices in the package", () => {
  for (const relativePath of ["Plugin/README.md", "Plugin/PRIVACY.md", "Plugin/THIRD_PARTY_NOTICES.md"]) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `${relativePath} is missing`);
  }
});

test("defines visible light palettes for Eagle theme changes", () => {
  const css = read("Plugin/styles/ui-refresh.css");

  assert.match(css, /html\[theme="light"\]\s*{/);
  assert.match(css, /html\[theme="lightgray"\]\s*{/);
  assert.match(css, /--fg1:\s*rgba\(0, 0, 0,/);
});

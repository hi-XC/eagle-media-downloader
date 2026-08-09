// Renders production HTML and CSS with deterministic visual-QA states.
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "../Plugin");

const mockScript = `
<style>html, body { width: 400px; max-width: 400px; }</style>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const state = new URLSearchParams(location.search).get("state") || "idle";
  const theme = new URLSearchParams(location.search).get("theme") || "dark";
  const appName = document.getElementById("appName");
  const main = document.getElementById("mainContainer");
  const deps = document.getElementById("depsContainer");
  const logo = document.getElementById("appLogo");
  const settings = document.getElementById("depsEntryBtn");
  const back = document.getElementById("depsBackBtn");
  const input = document.getElementById("urlInput");

  document.documentElement.setAttribute("theme", theme);

  appName.textContent = "Media Downloader";
  input.placeholder = "Paste a post link";

  if (state === "settings") {
    main.classList.add("hidden");
    deps.classList.remove("hidden");
    logo.classList.add("hidden");
    settings.classList.add("hidden");
    back.classList.remove("hidden");
    appName.textContent = "Settings";
    document.getElementById("depsEngineTitle").textContent = "Download engine";
    document.getElementById("ytdlpDesc").textContent = "Video extraction & download engine";
    document.getElementById("ffmpegDesc").textContent = "Video merging & transcoding engine";
    document.getElementById("pluginVersion").textContent = "Version 0.2.2";

    const setDependency = (prefix, status, detail, hasMenu) => {
      document.getElementById(prefix + "Status").textContent = status;
      document.getElementById(prefix + "Status").className = "dep-status ok";
      document.getElementById(prefix + "Detail").textContent = detail;
      if (hasMenu) {
        document.querySelector("[data-dependency=" + prefix + "]").classList.add("menu-enabled", "more-visible");
      }
    };

    setDependency("ytdlp", "Up to date", "Version 2026.07.04", true);
    setDependency("ffmpeg", "Managed by Eagle", "Version 6.1", false);
    const ffmpegMore = document.querySelector('[data-dependency="ffmpeg"] .dep-more-btn');
    ffmpegMore.disabled = true;
    return;
  }

  main.classList.remove("hidden");
  const list = document.querySelector(".download-list");
  const item = (className, title, overall, meta, progress) => [
    '<div class="download-item ' + className + '">',
    '<div class="item-heading">',
    '<img class="item-state-icon" src="assets/icon_check.svg">',
    '<div class="item-title">' + title + '</div>',
    '<span class="item-overall">' + overall + '</span>',
    '</div>',
    '<span class="item-meta">' + meta + '</span>',
    '<div class="item-progress-bar"><div class="item-progress-fill" style="width:' + progress + '%"></div></div>',
    '<div class="item-actions hidden"></div>',
    '</div>',
  ].join("");

  if (state === "fetching") {
    list.innerHTML = item("preparing", "Post by rubioydelamo", "", "Reading post information · 12s", 32);
  }
  if (state === "downloading") {
    list.innerHTML = item("downloading", "Post by rubioydelamo", "38%", "Item 5/12 · 50% · 1.37 MB/s", 38);
  }
  if (state === "completed") {
    document.getElementById("completedSummary").classList.remove("hidden");
    document.getElementById("completedSummaryText").textContent = "2 completed";
    const clear = document.getElementById("completedClearBtn");
    clear.classList.remove("hidden");
    clear.textContent = "Clear";
    list.innerHTML = item("completed", "rubioydelamo", "12/12", "", 100)
      + item("completed", "paulin_watches", "4/4", "", 100);
  }
});
</script>`;

const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

http.createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  const relativePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const filePath = path.join(root, relativePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }

  try {
    let content = fs.readFileSync(filePath);
    if (relativePath === "index.html") {
      content = Buffer.from(content.toString()
        .replace('<script type="text/javascript" src="dist/plugin.js"></script>', "")
        .replace("</body>", mockScript + "</body>"));
    }
    response.setHeader("Content-Type", mimeTypes[path.extname(filePath)] || "application/octet-stream");
    response.end(content);
  } catch (error) {
    response.writeHead(404).end();
  }
}).listen(4187, "127.0.0.1", () => {
  console.log("preview http://127.0.0.1:4187");
});

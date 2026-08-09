// Renders production HTML and CSS with deterministic visual-QA states.
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "../Plugin");

const mockScript = `
<style>html, body { width: 400px; max-width: 400px; }</style>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const state = params.get("state") || "idle";
  const theme = params.get("theme") || "dark";
  const locale = params.get("locale") || "en";
  const zh = locale === "zh_CN";
  const appName = document.getElementById("appName");
  const main = document.getElementById("mainContainer");
  const deps = document.getElementById("depsContainer");
  const logo = document.getElementById("appLogo");
  const settings = document.getElementById("depsEntryBtn");
  const back = document.getElementById("depsBackBtn");
  const input = document.getElementById("urlInput");
  const addButton = document.getElementById("addButton");

  document.documentElement.setAttribute("theme", theme);

  appName.textContent = zh ? "素材下载助手" : "Media Downloader";
  input.placeholder = zh ? "粘贴帖子链接" : "Paste a post link";
  addButton.classList.add("disabled");
  addButton.disabled = true;

  if (state === "settings") {
    main.classList.add("hidden");
    deps.classList.remove("hidden");
    logo.classList.add("hidden");
    settings.classList.add("hidden");
    back.classList.remove("hidden");
    appName.textContent = zh ? "设置" : "Settings";
    document.getElementById("depsEngineTitle").textContent = zh ? "下载引擎" : "Download engine";
    document.getElementById("ytdlpDesc").textContent = "Video extraction & download engine";
    document.getElementById("ffmpegDesc").textContent = "Video merging & transcoding engine";
    document.getElementById("pluginVersion").textContent = zh ? "版本 0.2.2" : "Version 0.2.2";

    const setDependency = (prefix, status, detail, hasMenu) => {
      document.getElementById(prefix + "Status").textContent = status;
      document.getElementById(prefix + "Status").className = "dep-status ok";
      document.getElementById(prefix + "Detail").textContent = detail;
      if (hasMenu) {
        document.querySelector("[data-dependency=" + prefix + "]").classList.add("menu-enabled", "more-visible");
      }
    };

    setDependency("ytdlp", zh ? "已是最新版" : "Up to date", zh ? "版本：2026.07.04" : "Version: 2026.07.04", true);
    setDependency("ffmpeg", zh ? "由 Eagle 管理" : "Managed by Eagle", zh ? "版本：6.1" : "Version: 6.1", false);
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
    list.innerHTML = item("preparing", "Post by sample_creator", "", zh ? "正在解析素材 · 已等待 12 秒" : "Parsing media · 12s elapsed", 32);
  }
  if (state === "downloading") {
    list.innerHTML = item("downloading", "Post by sample_creator", "38%", zh ? "第 5/12 项 · 50% · 1.37 MB/s" : "Item 5/12 · 50% · 1.37 MB/s", 38);
  }
  if (state === "completed") {
    document.getElementById("completedSummary").classList.remove("hidden");
    document.getElementById("completedSummaryText").textContent = zh ? "已完成 2 项" : "2 completed";
    const clear = document.getElementById("completedClearBtn");
    clear.classList.remove("hidden");
    clear.textContent = zh ? "清除" : "Clear";
    list.innerHTML = item("completed", "sample_creator", "12/12", "", 100)
      + item("completed", "sample_studio", "4/4", "", 100);
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
  if (url.pathname === "/store-cover.html") {
    response.setHeader("Content-Type", "text/html");
    response.end(fs.readFileSync(path.resolve(__dirname, "store-cover.html")));
    return;
  }
  if (url.pathname === "/store-screenshots.html") {
    response.setHeader("Content-Type", "text/html");
    response.end(fs.readFileSync(path.resolve(__dirname, "store-screenshots.html")));
    return;
  }
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

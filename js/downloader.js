/**
 * 视频下载模块
 * 处理视频下载核心逻辑
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

const { getYtDlpPath, getFfmpegPath, BIN_DIR, downloadYtDlp } = require("./binary");

const INSTAGRAM_HOSTS = ["instagram.com"];
const INSTAGRAM_MEDIA_HOSTS = ["cdninstagram.com", "fbcdn.net"];
const PROGRESS_PREFIX = "__EAGLE_PROGRESS__";
const INSTAGRAM_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function matchesDomain(hostname, domains) {
  const host = hostname.toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function isInstagramPostUrl(url) {
  try {
    const parsed = new URL(url);
    return matchesDomain(parsed.hostname, INSTAGRAM_HOSTS) && /^\/p\/[^/]+/.test(parsed.pathname);
  } catch (error) {
    return false;
  }
}

function canonicalizeInstagramPostUrl(url) {
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  if (!parsed.pathname.endsWith("/")) parsed.pathname += "/";
  return parsed.toString();
}

function isAllowedInstagramMediaUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && matchesDomain(parsed.hostname, INSTAGRAM_MEDIA_HOSTS);
  } catch (error) {
    return false;
  }
}

function selectInstagramImageUrl(entry) {
  const candidates = [
    entry.thumbnail,
    ...(entry.thumbnails || []).slice().reverse().map((thumbnail) => thumbnail.url),
  ];
  return candidates.find((url) => url && isAllowedInstagramMediaUrl(url)) || null;
}

function buildInstagramCollectionInfo(info, sourceUrl) {
  const entries = (info.entries || []).filter(Boolean);
  if (entries.length === 0) return null;

  const title = info.title || info.playlist_title || i18next.t("error.untitledVideo");
  const description = info.description || "";
  const uploader = info.uploader || info.channel || i18next.t("error.unknown");
  const total = entries.length;
  const digits = Math.max(2, String(total).length);

  const items = entries.map((entry, itemIndex) => {
    const index = itemIndex + 1;
    const formats = entry.formats || [];
    const type = formats.length > 0 ? "video" : selectInstagramImageUrl(entry) ? "image" : "unsupported";

    return {
      type,
      index,
      total,
      entryId: entry.id || String(index),
      imageUrl: type === "image" ? selectInstagramImageUrl(entry) : null,
      title: `${title} ${String(index).padStart(digits, "0")}`,
      description: entry.description || description,
      duration: entry.duration || 0,
      thumbnail: entry.thumbnail || null,
      uploader: entry.uploader || uploader,
      extractor: "Instagram",
      webpage_url: sourceUrl,
      id: entry.id || null,
    };
  });

  return {
    type: "collection",
    title,
    description,
    uploader,
    extractor: "Instagram",
    webpage_url: sourceUrl,
    id: info.id || null,
    items,
  };
}

/**
 * 判断 spawn 错误是否表示二进制文件本身已损坏（而非权限/路径问题）
 * - EBADMACHO (macOS, errno 88)：Mach-O 文件损坏，常见于下载中断
 * - ENOEXEC：可执行文件格式错误
 */
function isCorruptedBinaryError(error) {
  return error.code === "EBADMACHO" || error.code === "ENOEXEC" || error.errno === -88;
}

function getProgressArgs() {
  return [
    "--progress",
    "--newline",
    "--no-colors",
    "--progress-delta",
    "0.2",
    "--progress-template",
    `download:${PROGRESS_PREFIX}|%(info.playlist_index)s|%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s`,
  ];
}

function parseYtDlpProgressLine(line) {
  const structuredMatch = line.match(
    new RegExp(`${PROGRESS_PREFIX}\\|([^|]*)\\|([^|]*)\\|([^|]*)\\|([^\\r\\n]*)`),
  );

  if (structuredMatch) {
    const playlistIndex = Number.parseInt(structuredMatch[1].trim(), 10);
    const percent = Number.parseFloat(structuredMatch[2].replace("%", "").trim());
    if (!Number.isFinite(percent)) return null;

    const normalizeField = (value) => {
      const normalized = value.trim();
      return normalized === "NA" ? "" : normalized;
    };

    return {
      percent,
      playlistIndex: Number.isFinite(playlistIndex) ? playlistIndex : null,
      totalSize: "",
      currentSpeed: normalizeField(structuredMatch[3]),
      eta: normalizeField(structuredMatch[4]),
    };
  }

  const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%/);
  if (!progressMatch) return null;

  const sizeMatch = line.match(/of\s+~?\s*(\S+)/);
  const speedMatch = line.match(/at\s+(\S+)/);
  const etaMatch = line.match(/ETA\s+(\S+)/);

  return {
    percent: Number.parseFloat(progressMatch[1]),
    playlistIndex: null,
    totalSize: sizeMatch ? sizeMatch[1] : "",
    currentSpeed: speedMatch ? speedMatch[1] : "",
    eta: etaMatch ? etaMatch[1] : "",
  };
}

function createCollectionProgressHandler(onProgress, items, offset, total) {
  if (!onProgress) return null;

  return (progress) => {
    const matchedIndex = items.findIndex((item) => item.index === progress.playlistIndex);
    const batchPosition = matchedIndex >= 0 ? matchedIndex + 1 : 1;
    const itemIndex = offset + batchPosition;
    const overallPercent = ((itemIndex - 1) + progress.percent / 100) / total * 100;

    onProgress({
      ...progress,
      itemIndex,
      itemTotal: total,
      overallPercent: Math.min(100, Math.max(0, overallPercent)),
    });
  };
}

function createThumbnailProgressOutputHandler(onProgress, items, offset, total) {
  const reportProgress = createCollectionProgressHandler(onProgress, items, offset, total);
  if (!reportProgress) return null;

  let outputBuffer = "";

  return (output) => {
    outputBuffer += output;
    const lines = outputBuffer.split(/\r?\n|\r/);
    outputBuffer = lines.pop() || "";

    for (const line of lines) {
      const startMatch = line.match(/\[download\] Downloading item (\d+) of \d+/);
      if (startMatch) {
        const batchPosition = Number.parseInt(startMatch[1], 10);
        const item = items[batchPosition - 1];
        if (item) {
          reportProgress({
            playlistIndex: item.index,
            percent: 0,
            currentSpeed: "",
            eta: "",
          });
        }
        continue;
      }

      const completedMatch = line.match(/Writing video thumbnail .*[/\\](\d+)_/);
      if (completedMatch) {
        const playlistIndex = Number.parseInt(completedMatch[1], 10);
        reportProgress({
          playlistIndex,
          percent: 100,
          currentSpeed: "",
          eta: "",
        });
      }
    }
  };
}

/**
 * 执行 yt-dlp 命令
 */
function execYtDlp(args, onProgress, onOutput, allowRecovery = true) {
  return new Promise((resolve, reject) => {
    const ytdlp = getYtDlpPath();

    if (!fs.existsSync(ytdlp)) {
      reject(new Error(i18next.t("error.ytdlpNotInstalled")));
      return;
    }

    // 确保二进制文件有执行权限（文件可能因拷贝/恢复等操作丢失权限）
    if (os.platform() !== 'win32') {
      try { fs.chmodSync(ytdlp, '755'); } catch (e) {}
    }

    // 二进制文件损坏时：删除并重新下载，再重试一次（仅一次，避免死循环）
    const recoverFromCorruptBinary = (error) => {
      try { fs.unlinkSync(ytdlp); } catch (e) {}
      downloadYtDlp()
        .then(() => execYtDlp(args, onProgress, onOutput, false))
        .then(resolve)
        .catch(() => reject(new Error(`${i18next.t("error.failedToExecuteYtdlp")}: ${error.message}`)));
    };

    let proc;
    try {
      proc = spawn(ytdlp, args, { cwd: BIN_DIR });
    } catch (error) {
      if (allowRecovery && isCorruptedBinaryError(error)) {
        recoverFromCorruptBinary(error);
        return;
      }
      reject(new Error(`${i18next.t("error.failedToExecuteYtdlp")}: ${error.message}`));
      return;
    }

    let stdout = "";
    let stderr = "";
    let progressBuffer = "";

    const reportProgressLine = (line) => {
      if (!onProgress) return;
      const progress = parseYtDlpProgressLine(line);
      if (progress) onProgress(progress);
    };

    proc.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;

      if (onOutput) onOutput(output);

      progressBuffer += output;
      const lines = progressBuffer.split(/\r?\n|\r/);
      progressBuffer = lines.pop() || "";
      lines.forEach(reportProgressLine);
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("error", (error) => {
      if (allowRecovery && isCorruptedBinaryError(error)) {
        recoverFromCorruptBinary(error);
        return;
      }

      let detail = error.message;
      if (error.code === "ENOENT") {
        detail = i18next.t("error.ytdlpNotFound") + " (ENOENT)";
      } else if (error.code === "EACCES") {
        detail = i18next.t("error.ytdlpPermissionDenied") + " (EACCES)";
      }
      reject(new Error(`${i18next.t("error.failedToExecuteYtdlp")}: ${detail}`));
    });

    proc.on("close", (code) => {
      if (progressBuffer) reportProgressLine(progressBuffer);
      if (code === 0) {
        resolve(stdout);
      } else {
        // SSL 错误时自动重试，添加 --no-check-certificate
        const isSSLError = stderr.includes("SSL") || stderr.includes("ssl");
        const alreadySkipping = args.includes("--no-check-certificate");
        if (isSSLError && !alreadySkipping) {
          execYtDlp([...args, "--no-check-certificate"], onProgress, onOutput)
            .then(resolve)
            .catch(() =>
              reject(new Error(`${i18next.t("error.ytdlpExitedWithCode")} ${code}: ${stderr}`))
            );
          return;
        }

        // BiliBili 412 时自动补充站点参数重试一次
        const is412 = stderr.includes("HTTP Error 412");
        const alreadyHasReferer = args.includes("--referer");
        if (is412 && !alreadyHasReferer) {
          const urlArg = args.find(a => a.startsWith('http'));
          const extraArgs = urlArg ? getSiteArgs(urlArg) : [];
          if (extraArgs.length > 0) {
            execYtDlp([...args, ...extraArgs], onProgress, onOutput)
              .then(resolve)
              .catch(() =>
                reject(new Error(`${i18next.t("error.ytdlpExitedWithCode")} ${code}: ${stderr}`))
              );
            return;
          }
        }

        reject(
          new Error(`${i18next.t("error.ytdlpExitedWithCode")} ${code}: ${stderr}`),
        );
      }
    });
  });
}

/**
 * 返回特定站点需要的额外 yt-dlp 参数
 * BiliBili：补充 Referer 和 User-Agent，避免 HTTP 412
 */
function getSiteArgs(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host === 'bilibili.com' || host === 'b23.tv') {
      return [
        '--referer', 'https://www.bilibili.com',
        '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ];
    }
    if (matchesDomain(host, INSTAGRAM_HOSTS)) {
      return [
        '--referer', 'https://www.instagram.com/',
        '--add-header', `User-Agent:${INSTAGRAM_USER_AGENT}`,
      ];
    }
  } catch (e) {}
  return [];
}

/**
 * 标准化 URL，处理特殊情况
 * - Vimeo: 将 vimeo.com/ID 转换为 player.vimeo.com/video/ID 以绕过登录限制
 */
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);

    if (
      urlObj.hostname === "vimeo.com" ||
      urlObj.hostname === "www.vimeo.com"
    ) {
      const pathParts = urlObj.pathname.split("/").filter((p) => p);
      const videoId = pathParts.find((part) => /^\d+$/.test(part));

      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return url;
  } catch (error) {
    return url;
  }
}

/**
 * 获取视频信息
 */
async function getVideoInfo(url) {
  url = normalizeUrl(url);

  if (isInstagramPostUrl(url)) {
    const sourceUrl = canonicalizeInstagramPostUrl(url);
    const args = [
      "--dump-single-json",
      "--ignore-no-formats-error",
      "--skip-download",
      "--no-warnings",
      ...getSiteArgs(sourceUrl),
      sourceUrl,
    ];
    const output = await execYtDlp(args);
    const info = JSON.parse(output.trim());
    const collection = buildInstagramCollectionInfo(info, sourceUrl);
    if (collection) return collection;
  }

  const args = ["--dump-json", "--no-warnings", ...getSiteArgs(url), url];

  const output = await execYtDlp(args);
  const info = JSON.parse(output.trim().split("\n")[0]);

  return {
    title: info.title || i18next.t("error.untitledVideo"),
    description: info.description || "",
    duration: info.duration || 0,
    thumbnail: info.thumbnail || null,
    uploader: info.uploader || info.channel || i18next.t("error.unknown"),
    extractor: info.extractor || i18next.t("error.unknown"),
    webpage_url: info.webpage_url || url,
    id: info.id || null,
  };
}

/**
 * 净化文件名
 */
function sanitizeFilename(filename) {
  return String(filename || i18next.t("error.untitledVideo"))
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

/**
 * 获取下载临时目录
 */
function getTempDir() {
  const tempDir = path.join(os.tmpdir(), "eagle-video-downloader");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

async function refreshInstagramImageItems(url, imageItems) {
  const refreshedInfo = await getVideoInfo(url);
  if (refreshedInfo.type !== "collection") return imageItems;

  const refreshedByIndex = new Map(
    refreshedInfo.items
      .filter((item) => item.type === "image" && item.imageUrl)
      .map((item) => [item.index, item]),
  );

  return imageItems.map((item) => refreshedByIndex.get(item.index) || item);
}

async function downloadInstagramImageFallbacks(url, imageItems) {
  if (imageItems.length === 0) return { files: [], failures: [] };

  const outputDir = fs.mkdtempSync(path.join(getTempDir(), "instagram-images-"));
  const total = Math.max(...imageItems.map((item) => item.total || item.index));
  const digits = Math.max(2, String(total).length);
  const canonicalUrl = canonicalizeInstagramPostUrl(url);
  const outputTemplate = path.join(outputDir, `%(playlist_index)0${digits}d_%(id)s.%(ext)s`);
  const args = [
    canonicalUrl,
    "-o",
    outputTemplate,
    "--playlist-items",
    imageItems.map((item) => item.index).join(","),
    "--skip-download",
    "--write-thumbnail",
    "--ignore-errors",
    "--ignore-no-formats-error",
    "--no-warnings",
    ...getSiteArgs(canonicalUrl),
  ];

  try {
    await execYtDlp(args);
  } catch (error) {
    // Keep thumbnails completed before a later item failed.
  }

  const downloadedNames = fs.readdirSync(outputDir);
  const files = [];
  const failures = [];
  for (const item of imageItems) {
    const prefix = `${String(item.index).padStart(digits, "0")}_${item.entryId}.`;
    const filename = downloadedNames.find((name) => name.startsWith(prefix));
    if (filename) {
      files.push({ path: path.join(outputDir, filename), metadata: item, filename });
    } else {
      failures.push({ index: item.index, type: item.type });
    }
  }

  files.sort((left, right) => left.metadata.index - right.metadata.index);
  if (files.length === 0) {
    try { fs.rmdirSync(outputDir); } catch (error) {}
  }
  return { files, failures };
}

async function downloadInstagramCollection(url, collection, onProgress, onStatus) {
  const outputDir = fs.mkdtempSync(path.join(getTempDir(), "instagram-"));
  const files = [];
  const failures = [];
  const digits = Math.max(2, String(collection.items.length).length);
  const canonicalUrl = canonicalizeInstagramPostUrl(url);
  const videoItems = collection.items.filter((item) => item.type === "video");

  if (onStatus) onStatus(i18next.t("ui.downloading"));

  if (videoItems.length > 0) {
    const outputTemplate = path.join(outputDir, `%(playlist_index)0${digits}d_%(id)s.%(ext)s`);
    const args = [
      canonicalUrl,
      "-o",
      outputTemplate,
      "-f",
      "bestvideo+bestaudio/best",
      "--merge-output-format",
      "mp4",
      "--playlist-items",
      videoItems.map((item) => item.index).join(","),
      "--ignore-errors",
      "--ignore-no-formats-error",
      "--no-warnings",
      ...getProgressArgs(),
      ...getSiteArgs(canonicalUrl),
    ];

    const ffmpeg = getFfmpegPath();
    if (ffmpeg && fs.existsSync(ffmpeg)) {
      args.push("--ffmpeg-location", path.dirname(ffmpeg));
    }

    try {
      await execYtDlp(
        args,
        createCollectionProgressHandler(onProgress, videoItems, 0, collection.items.length),
      );
    } catch (error) {
      // Keep any files yt-dlp completed before a later item failed.
    }

    const downloadedNames = fs.readdirSync(outputDir);
    for (const item of videoItems) {
      const prefix = `${String(item.index).padStart(digits, "0")}_${item.entryId}.`;
      const filename = downloadedNames.find((name) => name.startsWith(prefix));
      if (filename) {
        files.push({ path: path.join(outputDir, filename), metadata: item, filename });
      } else {
        failures.push({ index: item.index, type: item.type });
      }
    }
  }

  const imageItems = collection.items.filter((entry) => entry.type === "image");

  for (const item of collection.items.filter((entry) => entry.type === "unsupported")) {
    failures.push({ index: item.index, type: item.type });
  }

  files.sort((left, right) => left.metadata.index - right.metadata.index);

  if (files.length === 0) {
    try { fs.rmdirSync(outputDir); } catch (error) {}
  }
  if (files.length === 0 && imageItems.length === 0) {
    throw new Error(i18next.t("error.fileNotFound"));
  }

  return { files, total: collection.items.length, failures };
}

/**
 * 下载视频
 * @param {string} url - 视频 URL
 * @param {Function} onProgress - 进度回调
 * @param {Function} onStatus - 状态回调
 * @param {Object} preloadedInfo - 可选，预先获取的视频信息，避免重复请求
 * @returns {Promise<Object>} - 返回成功文件、总数和失败项
 */
async function downloadVideo(url, onProgress, onStatus, preloadedInfo = null) {
  let videoInfo;

  if (preloadedInfo) {
    // 使用预先获取的信息
    videoInfo = preloadedInfo;
  } else {
    // 需要获取信息
    if (onStatus) onStatus(i18next.t("download.fetchingInfo"));
    try {
      videoInfo = await getVideoInfo(url);
      if (onStatus) onStatus(`${i18next.t("download.foundVideo")}: ${videoInfo.title}`);
    } catch (error) {
      videoInfo = {
        title: i18next.t("error.untitledVideo"),
        extractor: i18next.t("error.unknown"),
      };
    }
  }

  if (videoInfo.type === "collection") {
    return downloadInstagramCollection(url, videoInfo, onProgress, onStatus);
  }

  const outputDir = getTempDir();
  const sanitizedTitle = sanitizeFilename(videoInfo.title);
  
  // 使用模板支持多视频下载：%(title)s_%(autonumber)s.%(ext)s
  const outputTemplate = path.join(outputDir, `${sanitizedTitle}_%(autonumber)s.%(ext)s`);

  url = normalizeUrl(url);

  const args = [
    url,
    "-o",
    outputTemplate,
    "-f",
    "bestvideo+bestaudio/best",
    "--merge-output-format",
    "mp4",
    "--no-warnings",
    ...getProgressArgs(),
    ...getSiteArgs(url),
  ];

  const ffmpeg = getFfmpegPath();
  if (ffmpeg && fs.existsSync(ffmpeg)) {
    args.push("--ffmpeg-location", path.dirname(ffmpeg));
  }

  if (onStatus) onStatus(i18next.t("ui.downloading"));

  // 记录下载前的文件列表
  const filesBefore = new Set(fs.existsSync(outputDir) ? fs.readdirSync(outputDir) : []);

  await execYtDlp(args, onProgress);

  // 获取下载后新增的文件
  const filesAfter = fs.readdirSync(outputDir);
  const newFiles = filesAfter.filter(f => !filesBefore.has(f) && f.startsWith(sanitizedTitle));

  if (newFiles.length === 0) {
    throw new Error(i18next.t("error.fileNotFound"));
  }

  // 返回所有下载的视频
  return {
    files: newFiles.map(filename => ({
      path: path.join(outputDir, filename),
      metadata: videoInfo,
      filename: filename,
    })),
    total: newFiles.length,
    failures: [],
  };
}

/**
 * 清理临时文件
 */
function cleanup(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      const parentDir = path.dirname(filePath);
      const tempDir = getTempDir();
      if (parentDir !== tempDir && parentDir.startsWith(`${tempDir}${path.sep}`)) {
        try { fs.rmdirSync(parentDir); } catch (error) {}
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

module.exports = {
  downloadVideo,
  getVideoInfo,
  cleanup,
  buildInstagramCollectionInfo,
  canonicalizeInstagramPostUrl,
  isInstagramPostUrl,
  selectInstagramImageUrl,
  parseYtDlpProgressLine,
  createCollectionProgressHandler,
  createThumbnailProgressOutputHandler,
  refreshInstagramImageItems,
  downloadInstagramImageFallbacks,
};

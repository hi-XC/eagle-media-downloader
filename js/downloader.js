/**
 * 视频下载模块
 * 处理视频下载核心逻辑
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const https = require("https");
const { spawn } = require("child_process");

const { getYtDlpPath, getFfmpegPath, BIN_DIR, downloadYtDlp } = require("./binary");
const {
  canonicalizeInstagramPostUrl,
  isAllowedInstagramMediaUrl,
  isInstagramPostUrl,
  resolveInstagramRedirect,
} = require("./url-policy");

const PROGRESS_PREFIX = "__EAGLE_PROGRESS__";
const INSTAGRAM_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function selectInstagramImageUrl(entry) {
  const candidates = [
    entry.thumbnail,
    ...(entry.thumbnails || []).slice().reverse().map((thumbnail) => thumbnail.url),
  ];
  return candidates.find((url) => url && isAllowedInstagramMediaUrl(url)) || null;
}

function buildInstagramCollectionInfo(info, sourceUrl) {
  const listedEntries = (info.entries || []).filter(Boolean);
  const entries = listedEntries.length > 0 ? listedEntries : [info];

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

function invalidInstagramUrlError() {
  return new Error(i18next.t("error.invalidUrl"));
}

function validateYtDlpArgs(args) {
  let sourceCount = 0;

  for (let index = 0; index < args.length; index++) {
    const value = args[index];
    if (value === "--referer") {
      if (args[index + 1] !== "https://www.instagram.com/") {
        throw invalidInstagramUrlError();
      }
      index++;
      continue;
    }

    if (typeof value === "string" && /^https?:\/\//i.test(value)) {
      if (!isInstagramPostUrl(value)) throw invalidInstagramUrlError();
      sourceCount++;
    }
  }

  if (sourceCount !== 1) throw invalidInstagramUrlError();
}

function getElectronNet() {
  try {
    const electron = require("electron");
    return electron.net || electron.remote?.net || null;
  } catch (error) {
    return null;
  }
}

function verifyWithElectronNet(requestUrl, electronNet) {
  return new Promise((resolve, reject) => {
    let currentUrl = requestUrl;
    let redirectCount = 0;
    let settled = false;

    const request = electronNet.request({
      method: "GET",
      url: requestUrl,
      redirect: "manual",
      useSessionCookies: false,
      headers: {
        "User-Agent": INSTAGRAM_USER_AGENT,
        Range: "bytes=0-0",
      },
    });

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(currentUrl);
    };

    const timer = setTimeout(() => {
      request.abort();
      finish(new Error(i18next.t("error.redirectCheckFailed")));
    }, 20000);

    request.on("redirect", (_statusCode, _method, redirectUrl) => {
      try {
        redirectCount++;
        if (redirectCount > 5) throw invalidInstagramUrlError();
        currentUrl = resolveInstagramRedirect(currentUrl, redirectUrl);
        request.followRedirect();
      } catch (error) {
        request.abort();
        finish(invalidInstagramUrlError());
      }
    });
    request.on("response", (response) => {
      response.destroy?.();
      finish();
    });
    request.on("error", (error) => finish(error));
    request.end();
  });
}

function verifyWithNodeHttps(requestUrl, redirectsRemaining = 5, visited = new Set()) {
  if (visited.has(requestUrl) || redirectsRemaining < 0) {
    return Promise.reject(invalidInstagramUrlError());
  }
  visited.add(requestUrl);

  return new Promise((resolve, reject) => {
    const request = https.request(requestUrl, {
      method: "GET",
      headers: {
        "User-Agent": INSTAGRAM_USER_AGENT,
        Range: "bytes=0-0",
      },
    }, (response) => {
      const status = response.statusCode || 0;
      const location = response.headers.location;
      response.destroy();

      if (status >= 300 && status < 400) {
        if (!location) {
          reject(invalidInstagramUrlError());
          return;
        }

        let nextUrl;
        try {
          nextUrl = resolveInstagramRedirect(requestUrl, location);
        } catch (error) {
          reject(invalidInstagramUrlError());
          return;
        }

        verifyWithNodeHttps(nextUrl, redirectsRemaining - 1, visited)
          .then(resolve)
          .catch(reject);
        return;
      }

      resolve(requestUrl);
    });

    request.setTimeout(20000, () => {
      request.destroy(new Error(i18next.t("error.redirectCheckFailed")));
    });
    request.on("error", reject);
    request.end();
  });
}

function verifyInstagramRedirectChain(url) {
  let requestUrl;
  try {
    requestUrl = canonicalizeInstagramPostUrl(url);
  } catch (error) {
    return Promise.reject(invalidInstagramUrlError());
  }

  const electronNet = getElectronNet();
  return electronNet
    ? verifyWithElectronNet(requestUrl, electronNet)
    : verifyWithNodeHttps(requestUrl);
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
    try {
      validateYtDlpArgs(args);
    } catch (error) {
      reject(error);
      return;
    }

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
        reject(
          new Error(`${i18next.t("error.ytdlpExitedWithCode")} ${code}: ${stderr}`),
        );
      }
    });
  });
}

function getInstagramArgs(url) {
  canonicalizeInstagramPostUrl(url);
  return [
    "--referer", "https://www.instagram.com/",
    "--add-header", `User-Agent:${INSTAGRAM_USER_AGENT}`,
  ];
}

/**
 * 获取视频信息
 */
async function getVideoInfo(url) {
  let sourceUrl;
  try {
    sourceUrl = canonicalizeInstagramPostUrl(url);
  } catch (error) {
    throw invalidInstagramUrlError();
  }
  await verifyInstagramRedirectChain(sourceUrl);

  const args = [
    "--dump-single-json",
    "--ignore-no-formats-error",
    "--skip-download",
    "--no-warnings",
    ...getInstagramArgs(sourceUrl),
    sourceUrl,
  ];
  const output = await execYtDlp(args);
  const info = JSON.parse(output.trim());
  return buildInstagramCollectionInfo(info, sourceUrl);
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
  await verifyInstagramRedirectChain(canonicalUrl);
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
    ...getInstagramArgs(canonicalUrl),
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
  await verifyInstagramRedirectChain(canonicalUrl);
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
      ...getInstagramArgs(canonicalUrl),
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
  let sourceUrl;
  try {
    sourceUrl = canonicalizeInstagramPostUrl(url);
  } catch (error) {
    throw invalidInstagramUrlError();
  }
  let videoInfo;

  if (preloadedInfo) {
    // 使用预先获取的信息
    videoInfo = preloadedInfo;
  } else {
    // 需要获取信息
    if (onStatus) onStatus(i18next.t("download.fetchingInfo"));
    videoInfo = await getVideoInfo(sourceUrl);
    if (onStatus) onStatus(`${i18next.t("download.foundVideo")}: ${videoInfo.title}`);
  }

  if (videoInfo.type !== "collection") throw invalidInstagramUrlError();
  return downloadInstagramCollection(sourceUrl, videoInfo, onProgress, onStatus);
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
  verifyInstagramRedirectChain,
  refreshInstagramImageItems,
  downloadInstagramImageFallbacks,
};

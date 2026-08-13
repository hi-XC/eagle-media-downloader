/**
 * Eagle 视频下载插件
 * 主入口 - 处理插件初始化和下载队列管理
 */

const i18next = require("i18next");
const {
  isYtDlpInstalled,
  downloadYtDlp,
  uninstallYtDlp,
  getYtDlpUpdateInfo,
  getInstalledYtDlpVersion,
  getLatestYtDlpVersion,
  setFfmpegPath,
  getFfmpegSource,
  getFfmpegVersion,
} = require("./binary");
const downloader = require("./downloader");
const { canonicalizeInstagramPostUrl } = require("./url-policy");
const eagleApi = require("./eagle");
const ui = require("./ui");

// 状态管理
let isInitialized = false;

const ALWAYS_ON_TOP_KEY = "eagle-media-downloader.alwaysOnTop";
let isAlwaysOnTop = false;

// 下载队列
const downloadQueue = [];
const MAX_CONCURRENT = 3;
let activeCount = 0;
let queueIdCounter = 0;

/**
 * 初始化 i18next
 */
async function initI18n() {
  const enTranslation = require("../Plugin/_locales/en.json");
  const zhCNTranslation = require("../Plugin/_locales/zh_CN.json");

  await i18next.init({
    lng: eagle.app.locale || "en",
    fallbackLng: "en",
    resources: {
      en: { translation: enTranslation },
      zh_CN: { translation: zhCNTranslation },
    },
  });
  
  // 将 i18next 设置为全局变量，供其他模块使用
  global.i18next = i18next;
}

/**
 * 应用翻译到 UI 元素
 */
function applyTranslations() {
  const appName = document.getElementById("appName");
  if (appName) appName.textContent = i18next.t("ui.appTitle");

  const urlInput = document.getElementById("urlInput");
  if (urlInput) urlInput.placeholder = i18next.t("ui.inputPlaceholder");

  const addButton = document.getElementById("addButton");
  if (addButton) addButton.setAttribute("aria-label", i18next.t("ui.downloadBtn"));

  const settingsButton = document.getElementById("depsEntryBtn");
  if (settingsButton) settingsButton.title = i18next.t("deps.title");

  const backButton = document.getElementById("depsBackBtn");
  if (backButton) backButton.setAttribute("aria-label", i18next.t("deps.back"));
}

/**
 * 初始化插件
 */
eagle.onPluginCreate(async (plugin) => {
  await initI18n();
  applyTranslations();
  ui.setPluginVersion(plugin?.manifest?.version);
  ui.updateTheme();
  setupEventListeners();
  await initializeAlwaysOnTop();
  await initializeBinaries();
});

/**
 * 处理主题变更
 */
eagle.onThemeChanged(() => {
  ui.updateTheme();
});

/**
 * 设置 UI 事件监听器
 */
function setupEventListeners() {
  ui.setupDependencyMenus();

  document.getElementById("closeButton").addEventListener("click", () => {
    window.close();
  });

  document.getElementById("alwaysOnTopBtn").addEventListener("click", toggleAlwaysOnTop);

  document.getElementById("updateBannerBtn").addEventListener("click", handleUpdateClick);

  document.getElementById("depsEntryBtn").addEventListener("click", openDepsPage);
  document.getElementById("depsBackBtn").addEventListener("click", closeDepsPage);
  document.getElementById("completedClearBtn").addEventListener("click", clearCompletedDownloads);

  // yt-dlp 操作按钮事件委托
  document.getElementById("ytdlpActions").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ytdlp-action]");
    if (btn) handleYtdlpAction(btn.dataset.ytdlpAction);
  });

  // ffmpeg 操作按钮事件委托
  document.getElementById("ffmpegActions").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ffmpeg-action]");
    if (btn) handleFfmpegAction(btn.dataset.ffmpegAction);
  });

  document.addEventListener("startDownload", (e) => {
    addToQueue(e.detail.url);
  });

  // 下载列表事件委托（重试、复制链接）
  document.querySelector(".download-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id);
    if (action === "retry") retryDownload(id);
    if (action === "copyError") copyError(id);
    if (action === "copy") copyUrl(id);
  });
}

async function initializeAlwaysOnTop() {
  isAlwaysOnTop = localStorage.getItem(ALWAYS_ON_TOP_KEY) === "true";
  try {
    await eagle.window.setAlwaysOnTop(isAlwaysOnTop);
  } catch (error) {
    isAlwaysOnTop = false;
  }
  ui.updateAlwaysOnTopButton(isAlwaysOnTop);
}

async function toggleAlwaysOnTop() {
  const nextValue = !isAlwaysOnTop;
  try {
    await eagle.window.setAlwaysOnTop(nextValue);
    isAlwaysOnTop = nextValue;
    localStorage.setItem(ALWAYS_ON_TOP_KEY, String(nextValue));
    ui.updateAlwaysOnTopButton(isAlwaysOnTop);
  } catch (error) {
    console.error("Failed to update always-on-top state:", error);
  }
}

/**
 * 初始化二进制文件
 * yt-dlp 和 ffmpeg 均为必需依赖，缺失时进入依赖管理页（门槛模式）强制安装
 */
async function initializeBinaries() {
  await syncFfmpegDependency();

  if (depsReady()) {
    isInitialized = true;
    initializeMainUI();
    // 后台检查 yt-dlp 是否有新版本，有则提示用户
    checkForUpdateAndNotify();
    return;
  }

  // 缺少必要依赖：进入依赖管理页门槛模式，装齐后自动进入主界面
  ui.showDepsPage({ gating: true });
  loadDepsInfo();
}

async function syncFfmpegDependency() {
  const ffmpegModule = eagle.extraModule?.ffmpeg;
  if (!ffmpegModule) {
    setFfmpegPath(null);
    return false;
  }

  try {
    const installed = await ffmpegModule.isInstalled();
    if (!installed) {
      setFfmpegPath(null);
      return false;
    }
    const paths = await ffmpegModule.getPaths();
    setFfmpegPath(paths?.ffmpeg);
    return !!getFfmpegSource();
  } catch (error) {
    setFfmpegPath(null);
    console.error("Failed to resolve Eagle FFmpeg dependency:", error);
    return false;
  }
}

/**
 * 是否已具备使用插件所需的全部依赖（yt-dlp + ffmpeg）
 */
function depsReady() {
  return isYtDlpInstalled() && !!getFfmpegSource();
}

/**
 * 依赖状态变化后调用：
 * - 已就绪且尚未初始化 → 退出门槛模式，进入主界面
 * - 未就绪 → 锁定依赖页（门槛模式）
 */
function refreshDepsGatingState() {
  if (depsReady()) {
    if (!isInitialized) {
      isInitialized = true;
      ui.hideDepsPage();
      initializeMainUI();
      checkForUpdateAndNotify();
    }
  } else {
    isInitialized = false;
    ui.setDepsGating(true);
  }
}

/**
 * 初始化主 UI
 */
function initializeMainUI() {
  ui.showMainUI();
  ui.setupInputBar();
  const urlInput = document.getElementById("urlInput");
  if (urlInput) urlInput.focus();
}

/**
 * 添加下载任务到队列
 */
function addToQueue(url) {
  if (!isInitialized) return;

  let sourceUrl;
  try {
    sourceUrl = canonicalizeInstagramPostUrl(url);
  } catch (error) {
    return;
  }

  const item = {
    id: ++queueIdCounter,
    url: sourceUrl,
    title: sourceUrl,
    state: "waiting",
    progress: 0,
    itemProgress: 0,
    currentItem: 1,
    totalItems: 1,
    completedItems: 0,
    activeItems: 0,
    parallel: false,
    elapsedSeconds: 0,
    speed: "",
    error: null,
  };

  downloadQueue.push(item);
  ui.appendQueueItem(item);
  processQueue();
}

/**
 * 处理队列，启动等待中的任务（最多 MAX_CONCURRENT 个并发）
 */
function processQueue() {
  while (activeCount < MAX_CONCURRENT) {
    const nextItem = downloadQueue.find((item) => item.state === "waiting");
    if (!nextItem) break;
    activeCount++;
    executeDownload(nextItem);
  }
}

async function importInstagramImages(imageItems, sourceUrl, onProgress) {
  if (imageItems.length === 0) return { importedCount: 0, failures: [] };

  let importedCount = 0;
  let pendingItems = imageItems;
  let latestErrors = new Map();

  const runRemotePass = async (items) => {
    const importedBeforePass = importedCount;
    const outcome = await eagleApi.importRemoteImagesToEagle(
      items,
      sourceUrl,
      (progress) => onProgress?.({
        activeItems: progress.activeItems,
        completedItems: importedBeforePass + progress.completedItems,
      }),
    );
    importedCount += outcome.imported.length;
    latestErrors = new Map(outcome.failures.map((failure) => [failure.item.index, failure.error]));
    return outcome.failures.map((failure) => failure.item);
  };

  pendingItems = await runRemotePass(pendingItems);

  if (pendingItems.length > 0) {
    try {
      pendingItems = await downloader.refreshInstagramImageItems(sourceUrl, pendingItems);
    } catch (error) {
      // Retry the original URLs before using the yt-dlp fallback.
    }
    pendingItems = await runRemotePass(pendingItems);
  }

  if (pendingItems.length > 0) {
    const fallbackOutcome = await downloader.downloadInstagramImageFallbacks(sourceUrl, pendingItems);
    const fallbackFailures = new Map(
      fallbackOutcome.failures.map((failure) => [failure.index, failure]),
    );

    for (const result of fallbackOutcome.files) {
      onProgress?.({ activeItems: 1, completedItems: importedCount });
      try {
        await eagleApi.importToEagle(result.path, result.metadata, sourceUrl);
        importedCount++;
      } catch (error) {
        fallbackFailures.set(result.metadata.index, {
          index: result.metadata.index,
          type: result.metadata.type,
          error: error.message,
        });
      } finally {
        downloader.cleanup(result.path);
        onProgress?.({ activeItems: 0, completedItems: importedCount });
      }
    }

    pendingItems = pendingItems.filter((item) => fallbackFailures.has(item.index));
    latestErrors = new Map(pendingItems.map((item) => [
      item.index,
      fallbackFailures.get(item.index)?.error || latestErrors.get(item.index),
    ]));
  }

  return {
    importedCount,
    failures: pendingItems.map((item) => ({
      index: item.index,
      type: item.type,
      error: latestErrors.get(item.index),
    })),
  };
}

/**
 * 执行单个下载任务
 */
async function executeDownload(item) {
  let preparingTimer = null;
  try {
    item.url = canonicalizeInstagramPostUrl(item.url);
    item.state = "preparing";
    item.elapsedSeconds = 0;
    ui.updateQueueItem(item.id, item);

    const preparingStartedAt = Date.now();
    preparingTimer = setInterval(() => {
      item.elapsedSeconds = Math.floor((Date.now() - preparingStartedAt) / 1000);
      ui.updateQueueItem(item.id, item);
    }, 1000);

    const videoInfo = await downloader.getVideoInfo(item.url);
    clearInterval(preparingTimer);
    preparingTimer = null;
    item.title = videoInfo.title || i18next.t("error.untitledVideo");
    item.state = "downloading";
    item.progress = 0;
    item.itemProgress = 0;
    item.currentItem = 1;
    item.totalItems = videoInfo.type === "collection" ? videoInfo.items.length : 1;
    item.completedItems = 0;
    item.activeItems = 0;
    item.parallel = false;
    ui.updateQueueItem(item.id, item);

    const sourceUrl = videoInfo.webpage_url || item.url;
    const collectionItems = videoInfo.type === "collection" ? videoInfo.items : [];
    const imageItems = collectionItems.filter((entry) => entry.type === "image");
    const videoItemCount = videoInfo.type === "collection"
      ? collectionItems.filter((entry) => entry.type === "video").length
      : 1;
    const progressState = {
      imageActive: 0,
      imageCompleted: 0,
      imagePending: imageItems.length > 0,
      videoActive: videoItemCount > 0,
      videoUnits: 0,
      speed: "",
    };

    const renderCombinedProgress = () => {
      const completedVideoUnits = Math.min(videoItemCount, progressState.videoUnits);
      const overallPercent = (completedVideoUnits + progressState.imageCompleted)
        / item.totalItems * 100;
      item.progress = Math.max(item.progress, Math.min(100, overallPercent));
      item.completedItems = Math.min(
        item.totalItems,
        Math.floor(completedVideoUnits) + progressState.imageCompleted,
      );
      item.activeItems = progressState.imageActive + (progressState.videoActive ? 1 : 0);
      item.parallel = progressState.imagePending;
      item.speed = progressState.speed;
      ui.updateQueueItem(item.id, item);
    };

    const imageImportPromise = importInstagramImages(
      imageItems,
      sourceUrl,
      (progress) => {
        progressState.imageActive = progress.activeItems;
        progressState.imageCompleted = progress.completedItems;
        renderCombinedProgress();
      },
    ).finally(() => {
      progressState.imageActive = 0;
      progressState.imagePending = false;
      renderCombinedProgress();
    });

    const downloadPromise = downloader.downloadVideo(
      item.url,
      (progress) => {
        const videoOverallPercent = progress.overallPercent ?? progress.percent ?? 0;
        progressState.videoUnits = videoOverallPercent / 100 * item.totalItems;
        progressState.speed = progress.currentSpeed || "";
        item.itemProgress = progress.percent ?? 0;
        item.currentItem = progress.itemIndex || 1;
        item.totalItems = progress.itemTotal || item.totalItems;
        renderCombinedProgress();
      },
      null,
      videoInfo,
    ).finally(() => {
      progressState.videoActive = false;
      progressState.videoUnits = videoItemCount;
      progressState.speed = "";
      renderCombinedProgress();
    });

    const [outcome, imageOutcome] = await Promise.all([downloadPromise, imageImportPromise]);

    let importedCount = imageOutcome.importedCount;
    const failures = [...outcome.failures, ...imageOutcome.failures];

    for (const result of outcome.files) {
      try {
        await eagleApi.importToEagle(result.path, result.metadata, sourceUrl);
        importedCount++;
      } catch (error) {
        failures.push({
          index: result.metadata.index || importedCount + 1,
          type: result.metadata.type || "media",
          error: error.message,
        });
      } finally {
        downloader.cleanup(result.path);
      }
    }

    if (importedCount === 0) {
      throw new Error(failures[0]?.error || i18next.t("error.eagleImportFailed"));
    }

    item.state = "completed";
    item.progress = 100;
    item.speed = "";
    item.activeItems = 0;
    item.parallel = false;
    item.completedItems = importedCount;
    item.totalItems = outcome.total;
    item.summary = i18next.t("queue.completedCount", {
      completed: importedCount,
      total: outcome.total,
    });
    item.error = failures.length > 0
      ? failures.map((failure) => `#${failure.index}: ${failure.error || i18next.t("queue.error")}`).join("\n")
      : null;
    ui.updateQueueItem(item.id, item);
  } catch (error) {
    item.state = "error";
    item.error = error.message || i18next.t("download.failed");
    ui.updateQueueItem(item.id, item);
  } finally {
    if (preparingTimer) clearInterval(preparingTimer);
    activeCount--;
    processQueue();
  }
}

/**
 * 重试失败的下载任务
 */
function retryDownload(id) {
  const item = downloadQueue.find((item) => item.id === id);
  if (!item || item.state !== "error") return;

  item.state = "waiting";
  item.progress = 0;
  item.itemProgress = 0;
  item.currentItem = 1;
  item.totalItems = 1;
  item.completedItems = 0;
  item.activeItems = 0;
  item.parallel = false;
  item.elapsedSeconds = 0;
  item.error = null;
  item.speed = "";
  ui.updateQueueItem(item.id, item);
  processQueue();
}

function clearCompletedDownloads() {
  const completedIds = downloadQueue
    .filter((item) => item.state === "completed")
    .map((item) => item.id);

  for (let index = downloadQueue.length - 1; index >= 0; index--) {
    if (downloadQueue[index].state === "completed") downloadQueue.splice(index, 1);
  }

  ui.removeQueueItems(completedIds);
}

/**
 * 复制下载任务的错误信息
 */
async function copyError(id) {
  const item = downloadQueue.find((item) => item.id === id);
  if (!item || !item.error) return;
  try {
    await navigator.clipboard.writeText(item.error);
    ui.showCopiedErrorFeedback(id);
  } catch (error) {
    console.error("Failed to copy error:", error);
  }
}

/**
 * 后台检查 yt-dlp 版本，有新版本时显示更新横幅
 */
async function checkForUpdateAndNotify() {
  try {
    const { hasUpdate, latestVersion } = await getYtDlpUpdateInfo();
    if (hasUpdate) {
      ui.showUpdateAvailable(latestVersion);
    }
  } catch (e) {
    // 检查失败时静默忽略，不影响主功能
  }
}

/**
 * 打开依赖管理页面并加载信息
 */
function openDepsPage() {
  ui.showDepsPage();
  loadDepsInfo();
}

/**
 * 关闭依赖管理页面，回到主界面
 */
function closeDepsPage() {
  ui.hideDepsPage();
}

/**
 * 加载并展示各依赖的当前状态
 *
 * @param {Object} [options]
 * @param {string} [options.ytdlpKnownLatest] 刚下载完成的 yt-dlp 版本号——
 *   下载源本身就是 GitHub 最新发布版，因此无需再走"检查更新"流程，
 *   直接渲染为 latest 状态，避免安装/更新完成后出现多余的"检查更新中"闪烁
 */
async function loadDepsInfo(options = {}) {
  const ytdlpInstalled = isYtDlpInstalled();
  ui.updateFfmpegCard('checking');
  const ffmpegReady = await syncFfmpegDependency();

  if (ffmpegReady) {
    ui.updateFfmpegCard('eagle', {});
  } else {
    ui.updateFfmpegCard('missing');
  }

  if (!ytdlpInstalled) {
    ui.updateYtdlpCard("missing");
    return;
  }

  if (options.ytdlpKnownLatest) {
    ui.updateYtdlpCard("latest", { version: options.ytdlpKnownLatest });
  } else {
    loadYtdlpUpdateStatus();
  }

  if (ffmpegReady) {
    getFfmpegVersion().then((ffmpegVersion) => {
      ui.updateFfmpegCard('eagle', { version: ffmpegVersion });
    }).catch(() => {});
  }
}

/**
 * 检查 yt-dlp 是否有更新并渲染对应卡片状态
 * 阶段 1（后台，~200ms）：spawn 子进程取本地版本号 → 补充版本显示
 * 阶段 2：与当前审核版本允许安装的版本比较
 */
function loadYtdlpUpdateStatus() {
  // 同步阶段即刻显示"检查更新中..."，版本号由后台 spawn 补充
  ui.updateYtdlpCard("installed", { checkingUpdate: true });

  // 两条异步线同时启动，互不等待
  const installedVersionP = getInstalledYtDlpVersion();
  const latestVersionP    = getLatestYtDlpVersion();

  // 线 1：本地版本（spawn，~200ms）到了立刻补充版本号
  installedVersionP.then((installedVersion) => {
    if (!installedVersion) { ui.updateYtdlpCard("missing"); return; }
    ui.updateYtdlpCard("installed", { version: installedVersion, checkingUpdate: true });

    // 等最新版本结果到达后更新徽章
    latestVersionP.then((latestVersion) => {
      if (installedVersion !== latestVersion) {
        ui.updateYtdlpCard("outdated", { installedVersion, latestVersion });
      } else {
        ui.updateYtdlpCard("latest", { version: installedVersion });
      }
    }).catch(() => {
      // 版本信息不可用时，保留已安装状态
      ui.updateYtdlpCard("installed", { version: installedVersion });
    });
  }).catch(() => {});
}

/**
 * 打开 Eagle 官方 FFmpeg 依赖安装页
 */
async function handleFfmpegAction() {
  ui.updateFfmpegCard('checking');
  try {
    await eagle.extraModule.ffmpeg.install();
    await loadDepsInfo();
    refreshDepsGatingState();
  } catch (error) {
    ui.updateFfmpegCard('error', { message: error.message });
  }
}

/**
 * 执行 yt-dlp 操作：install / update / reinstall / uninstall
 */
async function handleYtdlpAction(action) {
  if (action === "uninstall") {
    uninstallYtDlp();
    ui.updateYtdlpCard("missing");
    ui.hideUpdateBanner();   // 同步隐藏主界面的更新横幅
    refreshDepsGatingState();
    return;
  }

  const statusKey = {
    install: "deps.installing",
    update: "deps.updating",
    reinstall: "deps.reinstalling",
  }[action] || "deps.updating";

  const doneKey = {
    install: "deps.doneInstalled",
    update: "deps.doneUpdated",
    reinstall: "deps.doneReinstalled",
  }[action] || "deps.doneInstalled";

  const statusText = i18next.t(statusKey);
  ui.updateYtdlpCard("busy", { statusText, percent: 0 });

  try {
    await downloadYtDlp((progress) => {
      ui.updateYtdlpCard("busy", { statusText, percent: progress });
    });

    const version = await getInstalledYtDlpVersion();
    ui.updateYtdlpCard("done", { statusText: i18next.t(doneKey), version });

    // 更新或安装成功后隐藏主界面的更新横幅
    if (action === "update") ui.hideUpdateBanner();

    // 1.5 秒后重新渲染：刚下载的就是最新版，无需再走"检查更新"流程
    setTimeout(() => {
      loadDepsInfo({ ytdlpKnownLatest: version });
      refreshDepsGatingState();
    }, 1500);
  } catch (e) {
    ui.updateYtdlpCard("error", { message: e.message, retryAction: action });
  }
}

/**
 * 处理用户点击「更新」按钮
 */
async function handleUpdateClick() {
  ui.setUpdateBannerUpdating(0);
  try {
    await downloadYtDlp((progress) => {
      ui.setUpdateBannerUpdating(progress);
    });
    ui.setUpdateBannerDone();
    setTimeout(() => ui.hideUpdateBanner(), 2000);
  } catch (e) {
    ui.hideUpdateBanner();
  }
}

/**
 * 复制下载任务的 URL
 */
async function copyUrl(id) {
  const item = downloadQueue.find((item) => item.id === id);
  if (!item) return;

  try {
    await navigator.clipboard.writeText(item.url);
    ui.showCopiedFeedback(id);
  } catch (error) {
    console.error("Failed to copy URL:", error);
  }
}

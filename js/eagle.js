/**
 * Eagle 集成模块
 * 处理与 Eagle 应用的交互
 */

const {
  canonicalizeInstagramPostUrl,
  isAllowedInstagramMediaUrl,
} = require("./url-policy");

function buildImportOptions(metadata, sourceUrl) {
  return {
    name: metadata.title || i18next.t("error.downloadedVideo"),
    website: canonicalizeInstagramPostUrl(sourceUrl),
    annotation: metadata.description ? metadata.description.slice(0, 500) : "",
  };
}

/**
 * 导入本地文件到 Eagle
 */
async function importToEagle(videoPath, metadata, sourceUrl) {
  if (typeof eagle === "undefined") {
    throw new Error(i18next.t("error.eagleApiNotAvailable"));
  }

  try {
    const itemId = await eagle.item.addFromPath(
      videoPath,
      buildImportOptions(metadata, sourceUrl),
    );
    return itemId;
  } catch (error) {
    throw new Error(`${i18next.t("error.eagleImportFailed")}: ${error.message}`);
  }
}

async function importRemoteImagesToEagle(items, sourceUrl, onProgress, maxConcurrency = 8) {
  if (typeof eagle === "undefined") {
    throw new Error(i18next.t("error.eagleApiNotAvailable"));
  }

  const imported = [];
  const failures = [];
  let cursor = 0;
  let activeItems = 0;

  const reportProgress = () => {
    if (!onProgress) return;
    onProgress({
      activeItems,
      completedItems: imported.length,
      processedItems: imported.length + failures.length,
      totalItems: items.length,
    });
  };

  const worker = async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      activeItems++;
      reportProgress();
      try {
        if (!isAllowedInstagramMediaUrl(item.imageUrl)) {
          throw new Error(i18next.t("error.invalidUrl"));
        }
        const itemId = await eagle.item.addFromURL(
          item.imageUrl,
          buildImportOptions(item, sourceUrl),
        );
        imported.push({ item, itemId });
      } catch (error) {
        failures.push({ item, error: error.message });
      } finally {
        activeItems--;
        reportProgress();
      }
    }
  };

  const workerCount = Math.min(maxConcurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  imported.sort((left, right) => left.item.index - right.item.index);
  failures.sort((left, right) => left.item.index - right.item.index);
  return { imported, failures };
}

module.exports = {
  importToEagle,
  importRemoteImagesToEagle,
};

/**
 * 二进制文件管理模块
 * 处理 yt-dlp 的可信下载，以及 Eagle FFmpeg 依赖的路径配置
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const crypto = require('crypto');
const { spawn } = require('child_process');

// 插件路径（__dirname 运行时指向 dist/，向上一级即 Plugin/ 根目录）
const PLUGIN_ROOT = path.join(__dirname, '..');
const BIN_DIR = path.join(PLUGIN_ROOT, 'bin');

const PINNED_YTDLP = {
    version: '2026.07.04',
    assets: {
        'yt-dlp.exe': '52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8',
        'yt-dlp_macos': '498bd0dae17855c599d371d68ec5bafc439a9d8640e838be25c765a9792f261b',
        'yt-dlp_linux': '6bbb3d314cde4febe36e5fa1d55462e29c974f63444e707871834f6d8cc210ae',
    },
};

let eagleFfmpegPath = null;

function verifySha256(filePath, expectedHash) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    if (hash.toLowerCase() !== expectedHash.toLowerCase()) {
        try { fs.unlinkSync(filePath); } catch (e) {}
        throw new Error(`SHA-256 verification failed for ${path.basename(filePath)}`);
    }
}

/**
 * 获取特定平台的 yt-dlp 二进制文件名
 */
function getYtDlpBinaryName() {
    const platform = os.platform();
    switch (platform) {
        case 'win32':
            return 'yt-dlp.exe';
        case 'darwin':
            return 'yt-dlp_macos';
        case 'linux':
            return 'yt-dlp_linux';
        default:
            return 'yt-dlp';
    }
}

/**
 * 获取 yt-dlp 二进制文件路径
 */
function getYtDlpPath() {
    return path.join(BIN_DIR, getYtDlpBinaryName());
}

/**
 * 检查 yt-dlp 是否已安装
 */
function isYtDlpInstalled() {
    return fs.existsSync(getYtDlpPath());
}

function setFfmpegPath(filePath) {
    eagleFfmpegPath = filePath && fs.existsSync(filePath) ? filePath : null;
}

function getFfmpegSource() {
    return eagleFfmpegPath ? 'eagle' : null;
}

function getFfmpegPath() {
    return eagleFfmpegPath;
}

// 下载空闲超时：连续这么久没有任何数据传输，视为连接卡死
const DOWNLOAD_IDLE_TIMEOUT_MS = 15000;
// 卡死/中断后的最大自动重试次数
const DOWNLOAD_MAX_RETRIES = 2;

/**
 * 下载文件并显示进度
 * - 先下载到临时文件 `${destPath}.download`，成功后再原子替换 destPath，
 *   避免「更新/重装」时下载失败把当前可用的旧二进制一并删除
 * - 空闲超时：连接建立后若长时间收不到数据（中途断流但未收到 FIN/RST），主动中断
 * - 失败（超时或连接中断）时自动重试，重试耗尽后清理临时文件并 reject，destPath 保持不变
 */
function downloadFile(url, destPath, onProgress, retriesLeft = DOWNLOAD_MAX_RETRIES, idleTimeoutMs = DOWNLOAD_IDLE_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        const tmpPath = `${destPath}.download`;
        const file = fs.createWriteStream(tmpPath);
        let settled = false;

        const cleanupFile = () => {
            file.close();
            if (fs.existsSync(tmpPath)) {
                try { fs.unlinkSync(tmpPath); } catch (e) {}
            }
        };

        const handleFailure = (error) => {
            if (settled) return;
            settled = true;
            request.destroy();
            cleanupFile();

            if (retriesLeft > 0) {
                downloadFile(url, destPath, onProgress, retriesLeft - 1, idleTimeoutMs).then(resolve).catch(reject);
            } else {
                reject(error);
            }
        };

        const request = https.get(url, (response) => {
            // 处理重定向（301/302/307/308）
            if ([301, 302, 307, 308].includes(response.statusCode)) {
                settled = true;
                cleanupFile();
                const redirectUrl = response.headers.location;
                if (!redirectUrl || !redirectUrl.startsWith('https://')) {
                    reject(new Error(`Insecure redirect rejected: ${redirectUrl}`));
                    return;
                }
                downloadFile(redirectUrl, destPath, onProgress, retriesLeft, idleTimeoutMs)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                settled = true;
                cleanupFile();
                reject(new Error(`Download failed with status ${response.statusCode}`));
                return;
            }

            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloadedSize = 0;

            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                if (onProgress && totalSize) {
                    onProgress(Math.round((downloadedSize / totalSize) * 100));
                }
            });

            response.on('error', handleFailure);

            response.pipe(file);

            file.on('finish', () => {
                if (settled) return;
                settled = true;
                file.close(() => {
                    try {
                        fs.renameSync(tmpPath, destPath);
                        resolve(destPath);
                    } catch (e) {
                        if (fs.existsSync(tmpPath)) {
                            try { fs.unlinkSync(tmpPath); } catch (_) {}
                        }
                        reject(e);
                    }
                });
            });

            file.on('error', handleFailure);
        });

        // 空闲超时：收不到响应头或数据传输中途停滞都会触发
        request.setTimeout(idleTimeoutMs, () => {
            handleFailure(new Error('Download timed out: no data received'));
        });

        request.on('error', handleFailure);
    });
}

function getYtDlpDownloadInfo() {
    const binaryName = getYtDlpBinaryName();
    const sha256 = PINNED_YTDLP.assets[binaryName];
    if (!sha256) {
        throw new Error(`Unsupported platform: ${os.platform()}`);
    }
    return {
        url: `https://github.com/yt-dlp/yt-dlp/releases/download/${PINNED_YTDLP.version}/${binaryName}`,
        sha256,
        version: PINNED_YTDLP.version,
    };
}

/**
 * 下载并校验锁定版本的 yt-dlp 二进制文件
 * @param {Function} onProgress 进度回调
 */
async function downloadYtDlp(onProgress) {
    if (!fs.existsSync(BIN_DIR)) {
        fs.mkdirSync(BIN_DIR, { recursive: true });
    }

    const destPath = getYtDlpPath();
    const { url, sha256 } = getYtDlpDownloadInfo();
    await downloadFile(url, destPath, onProgress);
    verifySha256(destPath, sha256);

    if (os.platform() !== 'win32') {
        fs.chmodSync(destPath, '755');
    }

    return destPath;
}

/**
 * 获取已安装的 yt-dlp 版本号
 * 返回版本字符串（如 "2024.11.18"），无法运行时返回 null
 */
function getInstalledYtDlpVersion() {
    return new Promise((resolve) => {
        const ytdlp = getYtDlpPath();
        if (!fs.existsSync(ytdlp)) {
            resolve(null);
            return;
        }
        const proc = spawn(ytdlp, ['--version']);
        let output = '';
        proc.stdout.on('data', (d) => { output += d.toString(); });
        proc.on('close', () => resolve(output.trim() || null));
        proc.on('error', () => resolve(null));
    });
}

/**
 * 获取当前审核版本允许安装的 yt-dlp 版本号
 */
async function getLatestYtDlpVersion() {
    return PINNED_YTDLP.version;
}

/**
 * 检查 yt-dlp 是否需要更新，如需要则重新下载
 * - 二进制存在但无法运行 → 重新下载
 * - 版本低于最新版 → 重新下载
 * 返回 true 表示执行了更新，false 表示无需更新
 */
async function checkAndUpdateYtDlp(onProgress) {
    const installedVersion = await getInstalledYtDlpVersion();

    if (!installedVersion) {
        // 文件存在但无法执行，重新下载
        await downloadYtDlp(onProgress);
        return true;
    }

    const latestVersion = await getLatestYtDlpVersion();
    if (installedVersion !== latestVersion) {
        await downloadYtDlp(onProgress);
        return true;
    }
    return false;
}

/**
 * 获取 Eagle 官方 FFmpeg 依赖的版本号
 * 返回版本字符串（如 "6.1.1"），无法运行时返回 null
 */
function getFfmpegVersion() {
    return new Promise((resolve) => {
        const ffmpegPath = getFfmpegPath();
        if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
            resolve(null);
            return;
        }
        const proc = spawn(ffmpegPath, ['-version']);
        let output = '';
        proc.stdout.on('data', (d) => { output += d.toString(); });
        proc.stderr.on('data', (d) => { output += d.toString(); });
        proc.on('close', () => {
            const match = output.match(/ffmpeg version (\S+)/);
            resolve(match ? match[1] : null);
        });
        proc.on('error', () => resolve(null));
    });
}

/**
 * 卸载 yt-dlp（删除二进制文件，清理空目录）
 */
function uninstallYtDlp() {
    const ytdlp = getYtDlpPath();
    if (fs.existsSync(ytdlp)) {
        fs.unlinkSync(ytdlp);
    }
    try {
        if (fs.existsSync(BIN_DIR) && fs.readdirSync(BIN_DIR).length === 0) {
            fs.rmdirSync(BIN_DIR);
        }
    } catch (e) {}
}

/**
 * 检查是否有可用的 yt-dlp 更新，不执行下载
 * 返回 { hasUpdate, latestVersion, installedVersion }
 */
async function getYtDlpUpdateInfo() {
    const installedVersion = await getInstalledYtDlpVersion();
    if (!installedVersion) {
        return { hasUpdate: false, latestVersion: null, installedVersion: null };
    }
    try {
        const latestVersion = await getLatestYtDlpVersion();
        return {
            hasUpdate: installedVersion !== latestVersion,
            latestVersion,
            installedVersion,
        };
    } catch (e) {
        return { hasUpdate: false, latestVersion: null, installedVersion };
    }
}

module.exports = {
    BIN_DIR,
    getYtDlpPath,
    setFfmpegPath,
    getFfmpegPath,
    getFfmpegVersion,
    getFfmpegSource,
    isYtDlpInstalled,
    downloadYtDlp,
    uninstallYtDlp,
    checkAndUpdateYtDlp,
    getInstalledYtDlpVersion,
    getLatestYtDlpVersion,
    getYtDlpUpdateInfo,
};

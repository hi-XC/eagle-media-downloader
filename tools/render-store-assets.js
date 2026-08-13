const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = "http://127.0.0.1:4187";

const captures = [
  ["submission/assets/cover-zh-CN.png", "/store-cover.html?locale=zh_CN", 780, 520, 2],
  ["submission/assets/cover-en.png", "/store-cover.html?locale=en", 780, 520, 2],
];

const states = [
  ["01-input.png", "idle", "dark"],
  ["02-downloading.png", "downloading", "dark"],
  ["03-completed.png", "completed", "dark"],
  ["04-settings.png", "settings", "light"],
];

for (const [directory, locale] of [["en", "en"], ["zh-CN", "zh_CN"]]) {
  for (const [filename, state, theme] of states) {
    captures.push([
      `submission/assets/screenshots/${directory}/${filename}`,
      `/?state=${state}&theme=${theme}&locale=${locale}`,
      400,
      300,
      2,
    ]);
  }
}

for (const [filename, state, theme] of states) {
  const docsName = state === "idle" ? "idle.png" : filename.replace(/^\d+-/, "");
  captures.push([
    `docs/screenshots/${docsName}`,
    `/?state=${state}&theme=${theme}&locale=en`,
    400,
    300,
    2,
  ]);
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getDebuggerUrl(port) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return (await response.json()).webSocketDebuggerUrl;
    } catch (error) {}
    await delay(100);
  }
  throw new Error("Chrome DevTools endpoint did not start");
}

async function main() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "media-downloader-chrome-"));
  const port = 9223;
  const browser = spawn(chrome, [
    "--headless=new",
    "--hide-scrollbars",
    "--disable-gpu",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    "--no-first-run",
    "--no-sandbox",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore" });

  try {
    const debuggerUrl = await getDebuggerUrl(port);
    const socket = new WebSocket(debuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });

    let messageId = 0;
    const pending = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const handler = pending.get(message.id);
      if (!handler) return;
      pending.delete(message.id);
      if (message.error) handler.reject(new Error(message.error.message));
      else handler.resolve(message.result);
    });

    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const id = ++messageId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });

    for (const [relativeOutput, url, width, height, scale] of captures) {
      const output = path.join(root, relativeOutput);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      const { targetId } = await send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: scale,
        mobile: false,
      }, sessionId);
      await send("Page.enable", {}, sessionId);
      await send("Page.navigate", { url: `${baseUrl}${url}` }, sessionId);
      await delay(1500);
      const { data } = await send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
      }, sessionId);
      fs.writeFileSync(output, Buffer.from(data, "base64"));
      await send("Target.closeTarget", { targetId });
      console.log(relativeOutput);
    }

    socket.close();
  } finally {
    browser.kill("SIGKILL");
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

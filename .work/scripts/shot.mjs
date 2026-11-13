// Usage: node shot.mjs <url> <width> <height> <out.png> [waitMs] [reducedMotion]
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const [url, width = "1440", height = "900", out = "shot.png", waitMs = "3000", reduced = "1"] =
  process.argv.slice(2);
const PORT = 9333;
const BIN = `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`;

const chrome = spawn(BIN, [
  `--remote-debugging-port=${PORT}`,
  "--disable-gpu",
  "--no-sandbox",
  "--hide-scrollbars",
  ...(reduced === "1" ? ["--force-prefers-reduced-motion"] : []),
  `--window-size=${width},${height}`,
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(path, method = "GET") {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}${path}`, { method });
      return await res.json();
    } catch {
      await sleep(200);
    }
  }
  throw new Error("devtools not ready");
}

const target = await getJson("/json/new?about:blank", "PUT");
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

await new Promise((r) => ws.addEventListener("open", r));
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
});

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(width),
  height: Number(height),
  deviceScaleFactor: 1,
  mobile: Number(width) < 500,
});
await send("Page.navigate", { url });
await sleep(Number(waitMs));

const metrics = await send("Runtime.evaluate", {
  expression: `(() => {
    const f = document.querySelector('footer');
    const r = f ? f.getBoundingClientRect() : null;
    return JSON.stringify({
      docHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      footer: r ? { top: r.top + window.scrollY, height: r.height } : null,
      errors: window.__err ?? null,
    });
  })()`,
  returnByValue: true,
});
console.log(metrics.result.value);

const { data } = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
});
writeFileSync(out, Buffer.from(data, "base64"));
ws.close();
chrome.kill();
process.exit(0);

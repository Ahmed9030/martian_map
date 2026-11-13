// Usage: node eval.mjs <url> <width> <height> <expressionFile>
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const [url, width = "1440", height = "900", file, reduced = "1"] = process.argv.slice(2);
const expression = readFileSync(file, "utf8");
const PORT = 9334;
const BIN = `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`;

const chrome = spawn(BIN, [
  `--remote-debugging-port=${PORT}`,
  "--disable-gpu",
  "--no-sandbox",
  "--hide-scrollbars",
  ...(reduced === "1" ? ["--force-prefers-reduced-motion"] : []),
  "about:blank",
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(path, method = "GET") {
  for (let i = 0; i < 60; i++) {
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
await sleep(Number(process.env.WAIT ?? 4000));
const res = await send("Runtime.evaluate", {
  expression,
  returnByValue: true,
  awaitPromise: true,
});
console.log(JSON.stringify(res.result.value ?? res.result.description, null, 2));
if (process.env.SHOT) {
  const { writeFileSync } = await import("node:fs");
  const clip = process.env.CLIP ? (() => { const [x, y, w, h] = process.env.CLIP.split(",").map(Number); return { x, y, width: w, height: h, scale: 1 }; })() : undefined;
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, ...(clip ? { clip } : {}) });
  writeFileSync(process.env.SHOT, Buffer.from(shot.data, "base64"));
}
ws.close();
chrome.kill();
process.exit(0);

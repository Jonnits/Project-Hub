import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const HOST = "127.0.0.1";
export const PORT = 43127;
export const APP_URL = `http://${HOST}:${PORT}`;
export const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

export function isMain(metaUrl) {
  const entry = process.argv[1];
  if (!entry) return false;
  return metaUrl === pathToFileURL(path.resolve(entry)).href;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function isUp() {
  try {
    const response = await fetch(APP_URL, {
      redirect: "manual",
      signal: AbortSignal.timeout(1500),
    });
    return response.status > 0;
  } catch {
    return false;
  }
}

export async function waitUntilUp(tries = 60) {
  for (let i = 0; i < tries; i++) {
    if (await isUp()) return true;
    await sleep(500);
  }
  return false;
}

export async function ensureBuild() {
  if (existsSync(path.join(ROOT, ".next", "BUILD_ID"))) return;
  if (!existsSync(NEXT_BIN)) {
    throw new Error("Run npm install inside the Project Hub folder first.");
  }
  const code = await runForeground(process.execPath, [NEXT_BIN, "build"]);
  if (code !== 0) throw new Error("Project Hub failed to build.");
}

export function runForeground(command, args, extra = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
      ...extra,
    });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

export function startNextForeground() {
  return runForeground(process.execPath, [
    NEXT_BIN,
    "start",
    "--hostname",
    HOST,
    "--port",
    String(PORT),
  ]);
}

export function startServeDetached() {
  const child = spawn(process.execPath, [path.join(ROOT, "desktop", "serve.mjs")], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
    env: process.env,
  });
  child.unref();
}

export function openWindow() {
  if (process.platform === "darwin") {
    return runForeground("open", ["-na", "Google Chrome", "--args", `--app=${APP_URL}`]).then(
      (code) => {
        if (code === 0) return;
        return runForeground("open", [APP_URL]);
      }
    );
  }
  if (process.platform === "win32") {
    return runForeground("cmd", ["/c", "start", "", APP_URL]);
  }
  return runForeground("xdg-open", [APP_URL]).catch(() => 0);
}

export function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

import { execFileSync } from "node:child_process";
import { chmod, copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { APP_URL, ensureBuild, isMain, ROOT, xmlEscape } from "./lib.mjs";

const LABEL = "local.projecthub";
const APP_NAME = "Project Hub.app";

function home(...parts) {
  return path.join(os.homedir(), ...parts);
}

function uid() {
  return String(process.getuid?.() ?? "");
}

async function pngToIcns(pngPath, icnsPath) {
  const { readFile } = await import("node:fs/promises");
  const png = await readFile(pngPath);
  const chunk = Buffer.concat([Buffer.from("ic09"), uint32(8 + png.length), png]);
  await writeFile(icnsPath, Buffer.concat([Buffer.from("icns"), uint32(8 + chunk.length), chunk]));
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
}

function plist(root, node) {
  const logs = home("Library", "Logs", "ProjectHub");
  const pathEnv = `${path.dirname(node)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xmlEscape(node)}</string>
    <string>${xmlEscape(path.join(root, "desktop", "serve.mjs"))}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${xmlEscape(root)}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${xmlEscape(path.join(logs, "stdout.log"))}</string>
  <key>StandardErrorPath</key>
  <string>${xmlEscape(path.join(logs, "stderr.log"))}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${xmlEscape(pathEnv)}</string>
  </dict>
</dict>
</plist>
`;
}

function infoPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Project Hub</string>
  <key>CFBundleDisplayName</key>
  <string>Project Hub</string>
  <key>CFBundleIdentifier</key>
  <string>local.projecthub</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleExecutable</key>
  <string>Project Hub</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleVersion</key>
  <string>0.1.0</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
`;
}

function appLauncher(root, node) {
  const pathEnv = `${path.dirname(node)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin`;
  return `#!/bin/bash
export PATH="${pathEnv}"
cd "${root}"
exec "${node}" "${path.join(root, "desktop", "launch.mjs")}"
`;
}

function launchctl(args) {
  try {
    execFileSync("launchctl", args, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

async function removeApp() {
  const plistPath = home("Library", "LaunchAgents", `${LABEL}.plist`);
  const appPath = home("Applications", APP_NAME);
  launchctl(["bootout", `gui/${uid()}`, plistPath]);
  launchctl(["unload", plistPath]);
  await rm(plistPath, { force: true });
  await rm(appPath, { recursive: true, force: true });
  console.log("Removed Project Hub from Applications and stopped the login service.");
}

async function installApp() {
  if (process.platform !== "darwin") {
    console.log("This installer writes a Mac app. On this machine, run: npm run app");
    return;
  }

  const node = process.execPath;
  await ensureBuild();

  const logs = home("Library", "Logs", "ProjectHub");
  const agents = home("Library", "LaunchAgents");
  const appRoot = home("Applications", APP_NAME);
  const macOS = path.join(appRoot, "Contents", "MacOS");
  const resources = path.join(appRoot, "Contents", "Resources");
  const plistPath = path.join(agents, `${LABEL}.plist`);
  const executable = path.join(macOS, "Project Hub");

  await mkdir(logs, { recursive: true });
  await mkdir(agents, { recursive: true });
  await mkdir(macOS, { recursive: true });
  await mkdir(resources, { recursive: true });

  await writeFile(plistPath, plist(ROOT, node));
  await writeFile(path.join(appRoot, "Contents", "Info.plist"), infoPlist());
  await writeFile(executable, appLauncher(ROOT, node));
  await chmod(executable, 0o755);
  await pngToIcns(path.join(ROOT, "public", "icons", "icon-512.png"), path.join(resources, "AppIcon.icns"));

  const pngIcon = path.join(ROOT, "public", "icons", "icon-512.png");
  await copyFile(pngIcon, path.join(resources, "icon-512.png"));

  launchctl(["bootout", `gui/${uid()}`, plistPath]);
  if (!launchctl(["bootstrap", `gui/${uid()}`, plistPath])) {
    launchctl(["load", "-w", plistPath]);
  }
  launchctl(["enable", `gui/${uid()}/${LABEL}`]);
  launchctl(["kickstart", "-k", `gui/${uid()}/${LABEL}`]);

  console.log(`Installed ${appRoot}`);
  console.log(`The board starts with this Mac and stays up at ${APP_URL}.`);
  console.log("Open Project Hub from Spotlight, or drag it from Applications to the Dock.");
}

if (isMain(import.meta.url)) {
  const remove = process.argv.includes("--remove");
  (remove ? removeApp() : installApp()).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

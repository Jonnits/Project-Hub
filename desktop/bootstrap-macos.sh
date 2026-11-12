#!/bin/bash
# Pin this clone as the Mac app. The board starts at login and stays up
# when the window closes. Run from the Project Hub folder, or set ROOT.
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
fi

ROOT="${PROJECT_HUB_ROOT:-$HOME/Desktop/Project-Hub}"
NODE="$(command -v node)"
NPM="$(command -v npm)"
NEXT="$ROOT/node_modules/next/dist/bin/next"
LABEL="local.projecthub"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
APP="$HOME/Applications/Project Hub.app"
LOGDIR="$HOME/Library/Logs/ProjectHub"
UID_NUM="$(id -u)"
HOST="127.0.0.1"
PORT="43127"
URL="http://${HOST}:${PORT}"

if [ ! -f "$ROOT/package.json" ]; then
  echo "No Project Hub at $ROOT"
  exit 1
fi
if [ -z "$NODE" ]; then
  echo "node is not on PATH. Open a new Terminal and try again."
  exit 1
fi

cd "$ROOT"
mkdir -p "$ROOT/data" "$LOGDIR" "$HOME/Library/LaunchAgents"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  kill $(lsof -t -iTCP:"$PORT" -sTCP:LISTEN) 2>/dev/null || true
  sleep 1
fi

"$NPM" run build

cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE}</string>
    <string>${NEXT}</string>
    <string>start</string>
    <string>--hostname</string>
    <string>${HOST}</string>
    <string>--port</string>
    <string>${PORT}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOGDIR}/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOGDIR}/stderr.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>$(dirname "$NODE"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

cat >"$APP/Contents/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
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
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
EOF

cat >"$APP/Contents/MacOS/Project Hub" <<EOF
#!/bin/bash
export PATH="$(dirname "$NODE"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  curl -sf -o /dev/null "$URL" && break
  sleep 0.5
done
open -na "Google Chrome" --args --app=$URL 2>/dev/null || open "$URL"
EOF
chmod +x "$APP/Contents/MacOS/Project Hub"

launchctl bootout "gui/${UID_NUM}" "$PLIST" >/dev/null 2>&1 || true
launchctl unload "$PLIST" >/dev/null 2>&1 || true
if ! launchctl bootstrap "gui/${UID_NUM}" "$PLIST" 2>/dev/null; then
  launchctl load -w "$PLIST"
fi
launchctl enable "gui/${UID_NUM}/${LABEL}" >/dev/null 2>&1 || true
launchctl kickstart -k "gui/${UID_NUM}/${LABEL}" >/dev/null 2>&1 || true

echo "Pinned $ROOT"
echo "Boards: $ROOT/data/project-hub.json"
echo "Open Project Hub from Spotlight, or $URL"
echo "Leave this folder on the Desktop. Do not clone a second copy."

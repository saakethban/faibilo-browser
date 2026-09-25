# Faibilo Browser Component Breakdown 🔍

This guide provides a detailed, file-by-file breakdown of what every module in the Faibilo codebase does, how it is implemented, and how the components interface with each other.

---

## 1. Core Process Files

### 📁 `src/main.js` (Electron Main Process)
The central nervous system of the browser. It runs on Node.js and manages the application lifecycle.

#### Key Responsibilities:
- **Application Bootstrapping**:
  - Initializes single-instance locking via `app.requestSingleInstanceLock()`.
  - Configures App User Model ID (`com.faibilo.browser`) for Windows taskbar grouping and native notifications.
  - Loads early environment variables (`src/env.js`).
  - Launches `splashWindow` to show boot animations and perform update checks before showing the main window.
- **Window Management**:
  - Creates, positions, and controls the main browser windows (`createBrowserWindow`).
  - Tracks active windows in `browserWindows` and `incognitoWindows` sets.
  - Configures frameless window styling (`frame: false`), title bar overlays, custom minimum dimensions, and transparency.
- **Webview & Session Management**:
  - Implements session partitioning (`persist:faibilo` for normal browsing vs timestamped in-memory partitions for private incognito).
  - Configures `session.defaultSession.webRequest` filters for the ad blocker.
  - Injects `COSMETIC_AD_BLOCK_CSS` dynamically into guest webviews on DOM ready.
- **Permissions & Security Pipeline**:
  - Listens for `session.setPermissionRequestHandler` (microphone, camera, geolocation, notifications, midi).
  - Emits `permission-requested` to `renderer.js` to render interactive approval banners.
  - Manages whitelist in `permissions.json` (or memory for incognito).
- **WebRTC Screen Sharing**:
  - Coordinates `desktopCapturer.getSources()` with live video thumbnail previews.
  - Resolves streams for Google Meet, Discord Web, Zoom, and Teams.
- **External App Protocol Handler**:
  - Intercepts requests for custom schemes (`discord://`, `tg://`, `steam://`, `zoommtg://`, `spotify://`, `magnet:`).
  - Prompts the user before allowing OS execution.
- **Discord Rich Presence (RPC)**:
  - Connects to the local Discord client using Discord IPC (`discord-rpc`).
  - Updates activity status (e.g. "Browsing the Web", "Watching YouTube", active tab count).
- **System Tray & Native Menus**:
  - Creates system tray icon with shortcuts (New Tab, New Incognito Window, Settings, Quit).

---

### 📁 `src/renderer.js` (Browser UI & Frontend Controller)
Runs inside the main Chromium renderer window. Controls all user-facing browser UI elements.

#### Key Subsystems:
- **Tab Manager**:
  - `createTab(url, options)`: Instantiates a new tab item and corresponding `<webview>` element.
  - `switchTab(tabId)`: Toggles active CSS states, focuses the webview, and syncs URL/title to the omnibox.
  - `closeTab(tabId)`: Unmounts webview, handles tab closing animations, and cleans up memory.
  - `duplicateTab(tabId)` / `pinTab(tabId)` / `muteTab(tabId)`.
  - Tab drag-and-drop reordering.
- **Tab Hibernation (Sleep Engine)**:
  - Attaches idle timers to inactive tabs.
  - Frees RAM by suspending heavy background tabs while preserving tab headers and state for instant resume.
- **Omnibox & Search Engine**:
  - Smart URL detection: Automatically distinguishes between valid URLs, localhost/IP addresses, and search queries.
  - Search engine router (Google, DuckDuckGo, Bing, Brave, Ecosia).
  - Real-time dropdown suggestions with history and bookmark fuzzy matching.
- **Navigation Controls**:
  - Back, Forward, Reload, Home, and Hard Reload (`Ctrl+F5`).
  - SSL/Security badge indicator (displays HTTPS lock vs unencrypted alert vs local protocol).
  - Real-time loading progress bar.
- **Downloads Shelf**:
  - Floating bottom drawer showing active download progress, byte counts, speed, pause/resume, and "Show in Folder".
- **Settings & History & Bookmarks Modals**:
  - Complete management dialogs for clearing browsing data, configuring search engine, setting default download directory, customizing themes, and editing permissions.
- **Interactive Modals**:
  - Screen sharing source picker with live thumbnail grid.
  - App redirect confirmation dialog.
  - Web permission popup (Allow / Deny / Remember).
  - In-app update notification bar with progress bar.

---

### 📁 `src/preload.js` (Secure Context Bridge)
The security firewall between Node.js and the renderer.

- Uses Electron's `contextBridge.exposeInMainWorld('faibilo', { ... })`.
- Safely exposes IPC invocations:
  - Window operations: `minimize`, `maximize`, `close`, `toggleFullscreen`.
  - Settings: `getSettings`, `updateSettings`, `chooseDownloadPath`.
  - Permissions: `respondToPermission`, `listPermissions`, `forgetPermission`.
  - Screen Sharing: `respondToScreenShare`.
  - Updates: `checkForUpdates`, `installUpdate`, `installReadyUpdate`.
  - Ad Blocker: Synchronous cache queries via `isBlockedUrl`.

---

### 📁 `src/preload-webview.js` (Guest Webview Injected Script)
Injected into every `<webview>` guest page before any page scripts run.

#### Key Features:
- **HTML5 Fullscreen API Hooking**: Intercepts `element.requestFullscreen()` and communicates with `main.js` to trigger true borderless window fullscreen.
- **Notification API Polyfill**: Emulates the Web Notification API in sandboxed webviews and routes notifications to the host system.
- **PushManager Polyfill**: Provides standard PushManager interfaces to prevent modern web apps from throwing errors.
- **Keyboard Shortcuts Forwarding**: Traps keys like `F11` (Fullscreen), `F12` (DevTools), `Escape`, and `Ctrl+W` to ensure browser shortcuts work even when a webview has focus.
- **Custom Context Menu**: Extracts selected text, image URLs, and link targets on right-click to trigger the native browser context menu.

---

## 2. Utility & Service Modules

### 📁 `src/adblocker.js` (Ad & Tracker Blocker Engine)
- **`BLOCKED_DOMAINS` Set**: Contains thousands of curated domains covering Google Ads, DoubleClick, Amazon Ads, Criteo, Taboola, Outbrain, analytics, popups, and telemetry networks.
- **`isBlockedUrl(url, options)`**:
  - Extracts hostname and performs fast Set lookup.
  - Matches suffix domains (e.g. `*.doubleclick.net`).
  - Evaluates regex heuristics for tracking paths (`/ads/`, `/pixel.gif`, `/telemetry`).
- **`isPopupUrl(url, options)`**: Checks if a URL matches known intrusive pop-under / redirect patterns.
- **`COSMETIC_AD_BLOCK_CSS`**: Massive CSS ruleset targeting common ad containers (`.ad-container`, `iframe[id*='google_ads']`, `div[class*='sponsored']`) to ensure clean page layouts without blank white gaps.

---

### 📁 `src/updater.js` (Self-Updater Engine)
- **`checkForAppUpdate(currentVersion)`**:
  - Resolves update URL from `.env` (`FAIBILO_VERSION_URL` or `FAIBILO_UPDATE_REPO`).
  - Fetches and parses remote `version.txt`.
  - Compares semantic version tuples (`parseVersionParts`).
- **`downloadUpdateFile(downloadUrl, destinationPath, onProgress)`**:
  - Streams binary installer from GitHub Releases with automatic HTTP 3xx redirect following.
  - Throttles progress callbacks to prevent UI thread lockup.
- **`runUpdateInstaller(installerPath)`**:
  - Spawns the Windows NSIS installer detached using `cmd.exe /c start` so it can elevate UAC independently while closing the main browser.

---

### 📁 `src/env.js` (Lightweight Environment Parser)
A self-contained `.env` file loader without external dependencies.
- Parses `KEY=VALUE` pairs, ignoring comments (`#`) and trimming whitespace or quotes.
- Safely populates `process.env` without overriding existing system environment variables unless specified.

---

## 3. UI & Template Files

### 📁 `src/index.html` & `src/styles.css`
- **`src/index.html`**: The main browser DOM skeleton. Contains the custom titlebar, tab strip, navigation omnibox, sidebar navigation, bookmark bar, webview container, modals, and settings panes.
- **`src/styles.css`**: Complete design system with glassmorphic aesthetics, dark-mode color variables, custom scrollbars, micro-animations, and responsive layout classes.

### 📁 `src/start.html` & `src/start.css` (Speed Dial)
- The home page loaded on new tabs (`faibilo://start`).
- Features a customizable search bar, quick-access grid with preloaded shortcuts (YouTube, GitHub, Spotify, Discord, Reddit, etc.), and custom shortcut creation.

### 📁 `src/splash.html` & `src/splash-preload.js`
- Displays the animated Faibilo splash screen on launch.
- Communicates update checking status ("Checking for updates...", "Downloading update...", "Starting Faibilo...").

### 📁 `src/media.html` & `src/media.css`
- Floating media disk player overlay for media playback control.

---

## 4. Build & Distribution Scripts

### 📁 `build/installer.nsh` (NSIS Installer Script)
- Custom Nullsoft Scriptable Install System (NSIS) script.
- Replaces standard wizard headers with a modern custom UI.
- Registers Faibilo in Windows Registry as an internet browser:
  - `HKCU\Software\Clients\StartMenuInternet\Faibilo`
  - URL associations: `http`, `https`, `faibilo`
  - File associations: `.html`, `.htm`, `.xhtml`, `.mhtml`, `.svg`, `.pdf`
  - `HKCU\Software\RegisteredApplications`
- Embeds background tip rotator during installation.

### 📁 `build/rotate_tips.ps1`
- PowerShell script executed by the NSIS installer to rotate browser tips and community Discord links while files are copied.

### 📁 `package.json`
- Contains dependencies (`electron`, `discord-rpc`, `electron-builder`, `png-to-ico`).
- Build configuration for generating Windows x64 NSIS installers (`dist/FaibiloSetup.exe`).

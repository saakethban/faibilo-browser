# Faibilo Browser 🌐⚡

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build & Release](https://github.com/saakethban/faibilo-browser/actions/workflows/build.yml/badge.svg)](https://github.com/saakethban/faibilo-browser/actions/workflows/build.yml)
[![Privacy: Zero--Telemetry](https://img.shields.io/badge/Privacy-Zero--Telemetry-brightgreen.svg)](PRIVACY.md)
[![Electron](https://img.shields.io/badge/Electron-33.x-47848F?logo=electron&logoColor=white)](https://electronjs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&logoColor=white)](#)

**Faibilo** is a fast, sleek, privacy-first desktop web browser built on Electron and web standards. Engineered with modern aesthetics, smooth animations, tab resource management, built-in ad & cosmetic blocking, and customizable privacy features.

Developed by **GRSNSSS (Saaketh)** and published by **VenoxBhs**.

---

## ✨ Features

- 🚀 **Lightning Fast Performance**: Smart memory management and background tab suspension.
- 🛡️ **Built-in Ad & Tracker Blocker**: Blocks intrusive advertisements, trackers, and cleans up web clutter using customizable rules and cosmetic CSS injection.
- 🕵️ **Ephemeral Private Browsing**: Incognito sessions that keep cache, history, and permissions 100% temporary and in-memory—leaving zero traces on disk.
- 🖥️ **WebRTC Screen Sharing**: Interactive desktop capture & screen picker dialog for Discord, Google Meet, Zoom, and other web apps.
- 🔒 **Protocol & App Redirection Security**: Prompts users before launching external applications (e.g. Discord, Steam, Spotify).
- 🎮 **Discord Rich Presence**: Share what you're browsing or listening to with your friends on Discord.
- 📦 **Automated In-App Updater**: Background update checking and smooth NSIS installer upgrades via GitHub releases.
- 🎨 **Modern Glassmorphic UI**: Beautiful dark-mode design, smooth tab switching, custom splash screens, and responsive window controls.

---

## 📚 In-Depth Documentation

For detailed architectural diagrams, file-by-file explanations, and subsystem breakdowns, see the `docs/` directory:

- 📐 **[System Architecture & Design (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)**: Multi-process model, context isolation, memory lifecycle, WebRTC pipeline, and complete IPC channel table.
- 🔍 **[Component-by-Component Breakdown (docs/COMPONENTS.md)](docs/COMPONENTS.md)**: Comprehensive guide detailing every file, class, and function across Main, Preload, and Renderer.
- 🚀 **[Deep Dive Features Guide (docs/FEATURES.md)](docs/FEATURES.md)**: Detailed explanations of Adblocking, Incognito ephemeral storage, Screen Sharing picker, Protocol Security, and Discord RPC.
- 🛡️ **[Privacy Policy (PRIVACY.md)](PRIVACY.md)**: Zero telemetry, local storage details, and privacy commitments.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/saakethban/faibilo-browser.git
   cd faibilo-browser
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional):**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

4. **Launch the Browser in Development Mode:**
   ```bash
   npm start
   ```

---

## 🛠️ Scripts

- `npm start` – Launches the Electron browser in development mode.
- `npm run check` – Syntax checks all main, preload, renderer, and utility JavaScript files.
- `npm run pack` – Packages the app into an unpacked executable directory (`dist/`).
- `npm run build` – Performs syntax validation and builds the full NSIS Windows installer (`dist/FaibiloSetup.exe`).

---

## 📂 Project Structure

```
├── .env.example            # Sample update & repo configuration
├── .gitignore              # Git ignore rules for node_modules, cache, & secrets
├── build/
│   ├── installer.nsh       # Custom NSIS installer UI script
│   └── rotate_tips.ps1     # Installer interactive tips rotator
├── package.json            # Project manifest and electron-builder config
├── scripts/
│   └── start-electron.js   # Dev startup helper
├── src/
│   ├── assets/             # Icons and visual media assets
│   ├── adblocker.js        # Rule-based ad and cosmetic blocker
│   ├── env.js              # Lightweight .env parser
│   ├── index.html          # Main browser window shell
│   ├── main.js             # Electron main process (lifecycle, IPC, window management)
│   ├── media.css / .html   # Media player overlays
│   ├── preload.js          # Main window secure context bridge
│   ├── preload-webview.js  # Webview guest script injection
│   ├── renderer.js         # UI logic, tabs, omnibox, settings
│   ├── splash.html         # Animated startup & update checking window
│   ├── splash-preload.js   # Splash screen context bridge
│   ├── start.html / .css   # New tab / Home dashboard
│   ├── styles.css          # Core browser styling & themes
│   └── updater.js          # In-app update checker and installer runner
└── version.txt.example     # Template for hosting release version metadata
```

---

## 🔄 In-App Updater Setup

To configure self-updates from your own GitHub repository:
1. Create a `version.txt` file in your repository (see `version.txt.example`).
2. Add your repository URL in `.env`:
   ```env
   FAIBILO_UPDATE_REPO=https://github.com/saakethban/faibilo-browser
   FAIBILO_UPDATE_BRANCH=main
   ```
3. Whenever a new installer release is published on GitHub, bump the version number in `version.txt`. Faibilo will detect the update on launch and notify the user.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.

# Privacy Policy for Faibilo Browser 🛡️

**Last Updated:** September 25, 2026

**Faibilo Browser** is designed with a **privacy-first, zero-telemetry philosophy**. We believe that your browsing habits, history, passwords, and personal information belong entirely to you.

This Privacy Policy explains how Faibilo handles information when you use the browser.

---

## 1. Zero Telemetry & Data Collection

- **We do not collect, transmit, or sell your personal data.**
- Faibilo does not have analytics servers, user tracking scripts, device fingerprinting, or behavioral analytics embedded into the core browser.
- No personal identifiers, IP addresses, search queries, or visited URLs are sent to Faibilo or its developers.

---

## 2. Local Data Storage

All data generated during your normal browsing sessions remains strictly local to your machine:
- **Browsing History & Cache**: Stored locally in your user profile directory (`%APPDATA%\Faibilo` on Windows or `.faibilo-profile/` in development).
- **Bookmarks & Custom Speed Dial Shortcuts**: Stored locally in your user settings file.
- **Site Permissions**: Camera, microphone, geolocation, and notification permissions granted to websites are saved locally in `permissions.json`.
- **Download History**: Kept locally on your device.

You can clear all local browsing data, cache, cookies, and permissions at any time via **Settings ➔ Clear Browsing Data**.

---

## 3. Ephemeral Private Browsing (Incognito Mode)

When using Incognito / Private Browsing:
- Sessions run in temporary, in-memory partitions (`incognito:*`).
- Browsing history, cookies, cached media, local storage, and granted permissions are **never written to disk**.
- All in-memory session data is completely purged and destroyed immediately when you close the private window.

---

## 4. Built-in Ad & Tracker Blocker

Faibilo includes a built-in network and cosmetic ad blocker:
- Evaluates outgoing network requests locally on your machine against an internal blocklist.
- Blocks known trackers, analytics scripts, ad networks, and cryptominers before network connections are made.
- No network logging or reporting is dispatched to external servers.

---

## 5. Optional Features & Third-Party Interactions

- **Discord Rich Presence (RPC)**:
  - If enabled, Faibilo connects via local Inter-Process Communication (IPC) directly to your desktop Discord client to display active browser status (e.g. "Browsing the Web").
  - No data is sent over the internet by Faibilo; all RPC status updates stay on your local loopback interface.
  - Can be turned off anytime in Settings.
- **In-App Updater**:
  - The updater makes an HTTP GET request to check a static `version.txt` file hosted on GitHub (`https://github.com/saakethban/faibilo-browser`).
  - No user telemetry, hardware IDs, or personal telemetry are included in the request.
- **Third-Party Websites & Search Engines**:
  - When you visit websites or submit search queries (e.g. Google, DuckDuckGo, Bing), your interactions are governed by the respective privacy policies of those third-party providers.

---

## 6. Open Source Verification

Faibilo is open source under the MIT License. You can inspect the complete source code, network requests, and security implementations directly on GitHub:
👉 [https://github.com/saakethban/faibilo-browser](https://github.com/saakethban/faibilo-browser)

---

## 7. Contact & Security Reports

If you have questions, feedback, or security concerns regarding privacy in Faibilo, please open an issue on GitHub:
- **GitHub Issues**: [https://github.com/saakethban/faibilo-browser/issues](https://github.com/saakethban/faibilo-browser/issues)
- **Repository**: [https://github.com/saakethban/faibilo-browser](https://github.com/saakethban/faibilo-browser)

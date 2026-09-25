const { ipcRenderer, webFrame } = require('electron');

const isChallengeContext = () => {
  try {
    const loc = window.location;
    if (!loc) return false;
    const host = (loc.hostname || '').toLowerCase();
    const href = (loc.href || '').toLowerCase();
    const pathname = (loc.pathname || '').toLowerCase();
    return (
      host.includes('challenges.cloudflare.com') ||
      host.includes('cloudflarechallenges.com') ||
      host.includes('cloudflarestream.com') ||
      host.includes('cloudflareinsights.com') ||
      host.includes('hcaptcha.com') ||
      host.includes('recaptcha.net') ||
      host.includes('google.com/recaptcha') ||
      pathname.includes('/cdn-cgi/challenge-platform/') ||
      pathname.includes('/cdn-cgi/bm/') ||
      pathname.includes('/cdn-cgi/rum') ||
      href.includes('turnstile') ||
      href.includes('cf_chl_') ||
      href.includes('challenge-platform')
    );
  } catch {
    return false;
  }
};

if (isChallengeContext()) {
  // Never tamper with Cloudflare Turnstile verification frames
  return;
}

// We execute this script in the webpage's main context (main world) to bypass contextIsolation
const overrideScript = `
  (() => {
    if (window.__faibilo_notifications_initialized__) return;
    try {
      const host = (window.location?.hostname || '').toLowerCase();
      const href = (window.location?.href || '').toLowerCase();
      const pathname = (window.location?.pathname || '').toLowerCase();
      if (
        host.includes('challenges.cloudflare.com') ||
        host.includes('cloudflarechallenges.com') ||
        host.includes('cloudflarestream.com') ||
        host.includes('cloudflareinsights.com') ||
        host.includes('hcaptcha.com') ||
        host.includes('recaptcha.net') ||
        host.includes('google.com/recaptcha') ||
        pathname.includes('/cdn-cgi/challenge-platform/') ||
        pathname.includes('/cdn-cgi/bm/') ||
        pathname.includes('/cdn-cgi/rum') ||
        href.includes('turnstile') ||
        href.includes('cf_chl_') ||
        href.includes('challenge-platform')
      ) {
        return;
      }
    } catch {}
    window.__faibilo_notifications_initialized__ = true;

    let cachedPermission = 'default';
    const activeNotifications = new Map();
    const pendingRequests = new Map();

    // Listen for messages from the preload script (isolated world)
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data || !event.data.__faibilo__) return;
      const { action, status, reqId, payload, data } = event.data;

      if (action === 'perm-response') {
        if (status) {
          cachedPermission = status;
          if (document.documentElement) {
            document.documentElement.setAttribute('data-notification-permission', status);
          }
        }
        if (reqId && pendingRequests.has(reqId)) {
          const callbacks = pendingRequests.get(reqId);
          pendingRequests.delete(reqId);
          callbacks.forEach(cb => {
            try { cb(status); } catch (e) { console.error(e); }
          });
        }
      }

      if (action === 'notif-clicked') {
        const { id, tag } = data || {};
        let notif = activeNotifications.get(id);
        if (!notif && tag) {
          for (const item of activeNotifications.values()) {
            if (item.tag === tag) {
              notif = item;
              break;
            }
          }
        }
        if (notif) {
          const ev = new Event('click');
          notif.dispatchEvent(ev);
          if (typeof notif.onclick === 'function') {
            try { notif.onclick(ev); } catch (e) { console.error(e); }
          }
        }
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'NOTIFICATION_CLICK',
            notification: notif ? {
              title: notif.title,
              body: notif.body,
              tag: notif.tag,
              data: notif.data
            } : { id, tag }
          });
        }
      }

      if (action === 'notif-closed') {
        const { id, tag } = data || {};
        let notif = activeNotifications.get(id);
        if (notif) {
          activeNotifications.delete(id);
          const ev = new Event('close');
          notif.dispatchEvent(ev);
          if (typeof notif.onclose === 'function') {
            try { notif.onclose(ev); } catch (e) { console.error(e); }
          }
        }
      }
    });

    class WebviewNotification extends EventTarget {
      constructor(title, options = {}) {
        super();
        this.title = String(title ?? '');
        this.body = String(options.body ?? '');
        this.icon = String(options.icon ?? '');
        this.tag = String(options.tag ?? '');
        this.data = options.data;
        this.silent = Boolean(options.silent);
        this.dir = options.dir || 'auto';
        this.lang = options.lang || '';
        this.badge = options.badge || '';
        this.image = options.image || '';
        this.timestamp = options.timestamp || Date.now();
        this.requireInteraction = Boolean(options.requireInteraction);

        this.onclick = null;
        this.onshow = null;
        this.onerror = null;
        this.onclose = null;

        const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        this._id = id;
        activeNotifications.set(id, this);

        const perm = WebviewNotification.permission;
        if (perm === 'granted') {
          window.postMessage({
            __faibilo__: true,
            action: 'show-notif',
            origin: window.location.origin,
            payload: {
              id,
              title: this.title,
              options: {
                body: this.body,
                icon: this.icon,
                tag: this.tag,
                data: this.data,
                silent: this.silent,
                requireInteraction: this.requireInteraction
              }
            }
          }, '*');

          setTimeout(() => {
            const ev = new Event('show');
            this.dispatchEvent(ev);
            if (typeof this.onshow === 'function') {
              try { this.onshow(ev); } catch (e) { console.error(e); }
            }
          }, 30);
        } else {
          setTimeout(() => {
            const ev = new Event('error');
            this.dispatchEvent(ev);
            if (typeof this.onerror === 'function') {
              try { this.onerror(ev); } catch (e) { console.error(e); }
            }
          }, 10);
        }
      }

      close() {
        window.postMessage({
          __faibilo__: true,
          action: 'close-notif',
          payload: { id: this._id, tag: this.tag }
        }, '*');
        activeNotifications.delete(this._id);
        const ev = new Event('close');
        this.dispatchEvent(ev);
        if (typeof this.onclose === 'function') {
          try { this.onclose(ev); } catch (e) { console.error(e); }
        }
      }

      static requestPermission(callback) {
        return new Promise((resolve) => {
          const current = WebviewNotification.permission;
          if (current !== 'default') {
            if (typeof callback === 'function') callback(current);
            return resolve(current);
          }

          const reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2);
          if (!pendingRequests.has(reqId)) {
            pendingRequests.set(reqId, []);
          }
          pendingRequests.get(reqId).push((status) => {
            if (typeof callback === 'function') callback(status);
            resolve(status);
          });

          window.postMessage({
            __faibilo__: true,
            action: 'request-permission',
            reqId,
            origin: window.location.origin
          }, '*');
        });
      }

      static get permission() {
        const docPerm = document.documentElement ? document.documentElement.getAttribute('data-notification-permission') : null;
        if (docPerm && docPerm !== 'default') return docPerm;
        return cachedPermission || 'default';
      }

      static get permissionDefault() { return 'default'; }
      static get permissionGranted() { return 'granted'; }
      static get permissionDenied() { return 'denied'; }
      static get maxActions() { return 2; }
    }

    window.Notification = WebviewNotification;

    // ServiceWorker showNotification & getNotifications
    if (typeof window.ServiceWorkerRegistration !== 'undefined') {
      window.ServiceWorkerRegistration.prototype.showNotification = function(title, options = {}) {
        return new Promise((resolve, reject) => {
          const perm = WebviewNotification.permission;
          if (perm !== 'granted') {
            return reject(new TypeError('Notification permission is not granted'));
          }
          const id = 'sw_notif_' + Date.now() + '_' + Math.random().toString(36).slice(2);
          const fakeNotif = {
            title: String(title ?? ''),
            body: String(options.body ?? ''),
            icon: String(options.icon ?? ''),
            tag: String(options.tag ?? ''),
            data: options.data,
            silent: Boolean(options.silent),
            requireInteraction: Boolean(options.requireInteraction),
            close: function() {
              window.postMessage({
                __faibilo__: true,
                action: 'close-notif',
                payload: { id, tag: options.tag }
              }, '*');
              activeNotifications.delete(id);
            }
          };
          activeNotifications.set(id, fakeNotif);

          window.postMessage({
            __faibilo__: true,
            action: 'show-notif',
            payload: {
              id,
              title: fakeNotif.title,
              options: {
                body: fakeNotif.body,
                icon: fakeNotif.icon,
                tag: fakeNotif.tag,
                data: fakeNotif.data,
                silent: fakeNotif.silent,
                requireInteraction: fakeNotif.requireInteraction
              }
            }
          }, '*');
          resolve();
        });
      };

      window.ServiceWorkerRegistration.prototype.getNotifications = function(filter = {}) {
        return new Promise((resolve) => {
          const list = [];
          for (const notif of activeNotifications.values()) {
            if (!filter || !filter.tag || filter.tag === notif.tag) {
              list.push(notif);
            }
          }
          resolve(list);
        });
      };
    }

    // PushManager and PushSubscription mock implementation for full Web Push API compatibility
    class WebviewPushSubscription {
      constructor(options = {}) {
        this.endpoint = 'https://push.faibilo.internal/sub/' + Math.random().toString(36).slice(2);
        this.expirationTime = null;
        this.options = options;
      }
      getKey(name) {
        if (name === 'p256dh') {
          return new Uint8Array([4, 137, 226, 191, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 255, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]).buffer;
        }
        if (name === 'auth') {
          return new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]).buffer;
        }
        return null;
      }
      toJSON() {
        return {
          endpoint: this.endpoint,
          expirationTime: this.expirationTime,
          keys: {
            p256dh: 'BI7ivwoUHh4eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4_QA',
            auth: 'AQIDBAUGBwgJCgsMDQ4PEA'
          }
        };
      }
      unsubscribe() {
        return Promise.resolve(true);
      }
    }

    class WebviewPushManager {
      constructor() {
        this.supportedContentEncodings = ['aes128gcm', 'aesgcm'];
      }
      async permissionState() {
        const perm = WebviewNotification.permission;
        return perm === 'default' ? 'prompt' : perm;
      }
      async getSubscription() {
        const perm = WebviewNotification.permission;
        if (perm !== 'granted') return null;
        return new WebviewPushSubscription();
      }
      async subscribe(options) {
        const perm = await WebviewNotification.requestPermission();
        if (perm !== 'granted') {
          const err = new Error('Registration failed - permission denied');
          err.name = 'NotAllowedError';
          throw err;
        }
        return new WebviewPushSubscription(options);
      }
    }

    window.PushManager = WebviewPushManager;
    window.PushSubscription = WebviewPushSubscription;

    if (typeof window.ServiceWorkerRegistration !== 'undefined') {
      try {
        Object.defineProperty(window.ServiceWorkerRegistration.prototype, 'pushManager', {
          get() {
            if (!this._pushManager) {
              this._pushManager = new WebviewPushManager();
            }
            return this._pushManager;
          },
          enumerable: true,
          configurable: true
        });
      } catch (e) {}
    }


    // Intelligent popup and popunder blocker
    const originalWindowOpen = window.open;
    window.open = function(url, target, features) {
      const blockPopups = document.documentElement ? document.documentElement.getAttribute('data-block-popups') !== 'false' : true;
      if (blockPopups) {
        const featuresStr = String(features || '').toLowerCase();
        // Detect deceptive popunder geometry (hidden, off-screen, tiny 1x1)
        if (
          featuresStr.includes('width=1') ||
          featuresStr.includes('height=1') ||
          featuresStr.includes('top=9999') ||
          featuresStr.includes('left=9999') ||
          featuresStr.includes('top=-') ||
          featuresStr.includes('left=-')
        ) {
          console.warn('[Faibilo Shield] Blocked deceptive popunder');
          window.postMessage({ __faibilo__: true, action: 'popup-blocked', url: String(url || '') }, '*');
          return null;
        }

        // Detect known ad/popup network URL patterns in window.open
        if (url && typeof url === 'string') {
          const testUrl = url.toLowerCase();
          if (
            /popads|popcash|exoclick|propeller|adsterra|clickadu|hilltopads|juicyads|revenuehits|monetag|admaven|richads|trafficstars|onclickads|clksite|realsrv|deloton|rollerads|evadav|clickaine|ezmob|bidgear|trafficjunky|adclick|click_id=|aff_id=|campaign_id=|pop_id=|\/popunder|\/popup/i.test(testUrl)
          ) {
            console.warn('[Faibilo Shield] Blocked ad/tracker popup URL:', url);
            window.postMessage({ __faibilo__: true, action: 'popup-blocked', url }, '*');
            return null;
          }
        }
      }
      return originalWindowOpen.apply(this, arguments);
    };

    // Stealth cleanup of automation flags so verification challenges (Cloudflare Turnstile, CAPTCHAs) pass cleanly
    try {
      if (Object.prototype.hasOwnProperty.call(navigator, 'webdriver')) {
        delete navigator.webdriver;
      }
      const navProto = Object.getPrototypeOf(navigator);
      if (navProto && 'webdriver' in navProto) {
        delete navProto.webdriver;
      }
    } catch {}

    // Clean userAgentData brands to match genuine Chrome
    try {
      if (navigator.userAgentData && Array.isArray(navigator.userAgentData.brands)) {
        const rawBrands = navigator.userAgentData.brands;
        const cleanBrands = rawBrands
          .filter(b => !/electron|faibilo/i.test(b.brand))
          .map(b => b.brand.toLowerCase() === 'chromium' ? { brand: 'Chromium', version: b.version } : b);
        
        const hasChrome = cleanBrands.some(b => /chrome|google chrome/i.test(b.brand));
        if (!hasChrome) {
          const match = (navigator.userAgent || '').match(/Chrome\/([0-9]+)/);
          const ver = match ? match[1] : '130';
          cleanBrands.unshift({ brand: 'Google Chrome', version: ver });
        }

        const proto = Object.getPrototypeOf(navigator.userAgentData);
        if (proto) {
          Object.defineProperty(proto, 'brands', {
            get: () => cleanBrands,
            configurable: true,
            enumerable: true
          });
        }
      }
    } catch {}

    // Camouflage patched functions to return native [native code] signatures
    try {
      const nativeToString = Function.prototype.toString;
      const patchedFns = new WeakSet();
      if (window.open) patchedFns.add(window.open);
      if (window.Notification) patchedFns.add(window.Notification);

      const customToString = function() {
        if (patchedFns.has(this)) {
          const fnName = this.name || '';
          return 'function ' + fnName + '() { [native code] }';
        }
        return nativeToString.apply(this, arguments);
      };
      patchedFns.add(customToString);
      Function.prototype.toString = customToString;
    } catch {}
  })();
`;

// Inject into the main world context of the guest webview safely
try {
  webFrame.executeJavaScript(overrideScript).catch(() => {});
} catch {}

// Video ad auto-skip & fast-forward for video platforms (runs in isolated preload context)
function setupVideoAdSkipper() {
  if (isChallengeContext()) return;
  let siteConfig = null;
  try {
    siteConfig = ipcRenderer.sendSync('adblock:get-site-config', window.location.href);
  } catch {}

  if (siteConfig && (siteConfig.whitelisted || !siteConfig.blockAds || !siteConfig.autoSkipVideoAds)) {
    return; // Respect user whitelist and settings
  }

  const isYouTube = (window.location.hostname || '').includes('youtube.com');

  const skipSelectors = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button-slot button',
    'button.ytp-ad-skip-button-modern',
    'button.ytp-skip-ad-button',
    '.ytp-ad-overlay-close-button',
    '.ytp-ad-image-overlay .ytp-ad-overlay-close-button',
    '[id^="skip-button"]',
    '.videoAdUiSkipButton',
    '.ytp-ad-skip-button-container button',
    '.ytp-ad-preview-container',
    '.ytp-ad-survey__close-button'
  ];

  let wasAdShowing = false;
  let originalMuted = null;

  function dismissAds() {
    // 1. Click all skip button selectors immediately
    for (let i = 0; i < skipSelectors.length; i++) {
      const btn = document.querySelector(skipSelectors[i]);
      if (btn) {
        try { btn.click(); } catch {}
      }
    }

    // 2. YouTube native player API if present
    if (isYouTube) {
      try {
        const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (player && typeof player.skipAd === 'function') {
          player.skipAd();
        }
      } catch {}
    }

    // 3. Fast-forward and complete the video ad
    const player = document.querySelector('.html5-video-player, .video-player');
    const isAd = player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'));

    if (isAd) {
      const video = player.querySelector('video');
      if (video) {
        if (!wasAdShowing) {
          wasAdShowing = true;
          originalMuted = video.muted;
          video.muted = true; // Silence ad immediately
        }

        video.playbackRate = 16.0;

        // Jump directly to end so ad finishes cleanly without showing skip countdown button
        if (!isNaN(video.duration) && isFinite(video.duration) && video.duration > 0) {
          if (video.currentTime < video.duration) {
            try {
              video.currentTime = video.duration;
            } catch {}
          }
        }
      }
    } else if (wasAdShowing) {
      wasAdShowing = false;
      const video = player ? player.querySelector('video') : null;
      if (video && originalMuted !== null) {
        video.muted = originalMuted;
        originalMuted = null;
        if (video.playbackRate > 2.0) {
          video.playbackRate = 1.0;
        }
      }
    }
  }

  // Fast MutationObserver for 0ms response when ad classes enter DOM
  try {
    const observer = new MutationObserver(() => dismissAds());
    const root = document.documentElement || document.body;
    if (root) {
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'src']
      });
    }
  } catch {}

  setInterval(dismissAds, 250);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupVideoAdSkipper);
} else {
  setupVideoAdSkipper();
}

function getCleanOrigin() {
  try {
    return window.location.origin;
  } catch {
    return '';
  }
}

function syncPermissionToDom() {
  const origin = getCleanOrigin();
  if (!origin || origin === 'null') return;
  try {
    const permission = ipcRenderer.sendSync('webview:check-notification-permission', origin);
    if (document.documentElement) {
      document.documentElement.setAttribute('data-notification-permission', permission);
    }
    window.postMessage({
      __faibilo__: true,
      action: 'perm-response',
      status: permission
    }, '*');
  } catch {}
}

// Listen for messages from the page (main world)
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || !event.data.__faibilo__) return;
  const { action, payload, origin, reqId } = event.data;

  if (action === 'request-permission') {
    const targetOrigin = origin || getCleanOrigin();
    ipcRenderer.send('webview:request-notification-permission', { origin: targetOrigin, reqId });
  }

  if (action === 'show-notif' || action === 'show-notification') {
    const targetOrigin = origin || getCleanOrigin();
    let permission = 'default';
    try {
      permission = ipcRenderer.sendSync('webview:check-notification-permission', targetOrigin);
    } catch {}
    if (permission === 'granted') {
      ipcRenderer.send('webview:show-notification', payload);
    }
  }

  if (action === 'close-notif' || action === 'close-notification') {
    ipcRenderer.send('webview:close-notification', payload);
  }

  if (action === 'popup-blocked') {
    ipcRenderer.send('webview:popup-blocked', { url: event.data.url });
  }
});

ipcRenderer.on('webview:notification-permission-response', (_event, data) => {
  const status = typeof data === 'object' && data ? data.status : data;
  const reqId = typeof data === 'object' && data ? data.reqId : undefined;
  if (document.documentElement) {
    document.documentElement.setAttribute('data-notification-permission', status);
  }
  window.postMessage({
    __faibilo__: true,
    action: 'perm-response',
    status,
    reqId
  }, '*');
});

ipcRenderer.on('webview:notification-clicked', (_event, data) => {
  window.postMessage({
    __faibilo__: true,
    action: 'notif-clicked',
    data
  }, '*');
});

ipcRenderer.on('webview:notification-closed', (_event, data) => {
  window.postMessage({
    __faibilo__: true,
    action: 'notif-closed',
    data
  }, '*');
});

function injectCosmeticAdBlock() {
  try {
    if (isChallengeContext()) return;
    if (document.getElementById('__faibilo_adblock_styles__')) return;
    let css = '';
    try {
      const config = ipcRenderer.sendSync('adblock:get-site-config', window.location.href);
      if (config && (config.whitelisted || !config.blockAds || !config.cosmeticFiltering)) {
        return;
      }
      css = config?.cosmeticCss || ipcRenderer.sendSync('adblock:get-cosmetic-css');
    } catch {}
    if (!css) return;
    const style = document.createElement('style');
    style.id = '__faibilo_adblock_styles__';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  } catch {}
}

// Predictive In-Page Link Preloading on Hover
function initPredictiveLinkHover() {
  if (isChallengeContext()) return;
  const prefetchedUrls = new Set();
  let hoverTimer = null;
  let hoveredAnchor = null;

  document.addEventListener('mouseover', (e) => {
    const anchor = e.target.closest ? e.target.closest('a[href]') : null;
    if (!anchor || !anchor.href) return;
    const href = anchor.href;
    if (!href.startsWith('http://') && !href.startsWith('https://')) return;
    if (prefetchedUrls.has(href) || prefetchedUrls.size >= 15) return;

    try {
      const targetUrl = new URL(href);
      if (targetUrl.origin === window.location.origin && targetUrl.pathname === window.location.pathname && targetUrl.hash) {
        return;
      }
    } catch {
      return;
    }

    hoveredAnchor = anchor;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      if (hoveredAnchor !== anchor) return;
      prefetchedUrls.add(href);

      try {
        const head = document.head || document.documentElement;
        if (!head) return;
        const targetUrl = new URL(href);

        if (!document.querySelector(`link[rel="preconnect"][href^="${targetUrl.origin}"]`)) {
          const preconnect = document.createElement('link');
          preconnect.rel = 'preconnect';
          preconnect.href = targetUrl.origin;
          head.appendChild(preconnect);

          const dnsPrefetch = document.createElement('link');
          dnsPrefetch.rel = 'dns-prefetch';
          dnsPrefetch.href = targetUrl.origin;
          head.appendChild(dnsPrefetch);
        }

        const prefetch = document.createElement('link');
        prefetch.rel = 'prefetch';
        prefetch.href = href;
        prefetch.as = 'document';
        head.appendChild(prefetch);
      } catch {}
    }, 65);
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    if (hoveredAnchor && e.target.closest && e.target.closest('a[href]') === hoveredAnchor) {
      clearTimeout(hoverTimer);
      hoveredAnchor = null;
    }
  }, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    syncPermissionToDom();
    injectCosmeticAdBlock();
    initPredictiveLinkHover();
  });
} else {
  syncPermissionToDom();
  injectCosmeticAdBlock();
  initPredictiveLinkHover();
}

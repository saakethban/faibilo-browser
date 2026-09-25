const HOME_URL = 'faibilo://start';
const START_PAGE_URL = new URL('./start.html', window.location.href).href;
const SEARCH_URL = 'https://www.google.com/search?q=';

const TOGGLE_ACTIVE_MEDIA_JS = `
  (() => {
    const mediaElements = [
      ...Array.from(document.querySelectorAll('video')),
      ...Array.from(document.querySelectorAll('audio'))
    ];
    const isValid = (item) => item.readyState >= 2 && (item.tagName === 'AUDIO' || (item.videoWidth > 0 && item.videoHeight > 0));
    let el = mediaElements.find((item) => !item.paused && !item.ended && isValid(item));
    if (!el) {
      el = mediaElements.find((item) => item.paused && !item.ended && item.currentTime > 0 && isValid(item));
    }
    if (!el) return null;
    if (el.paused) {
      const playResult = el.play();
      if (playResult && typeof playResult.catch === 'function') playResult.catch(() => {});
    } else {
      el.pause();
    }
    return !el.paused;
  })()
`;
const INITIAL_URL = new URLSearchParams(window.location.search).get('url');
const IS_INCOGNITO = new URLSearchParams(window.location.search).get('incognito') === 'true';
const SETTINGS_TAB_ID = 'settings-tab';
const STORAGE_KEYS = {
  bookmarks: 'faibilo.bookmarks',
  history: 'faibilo.history',
  downloads: 'faibilo.downloads',
  settings: 'faibilo.settings',
  favorites: 'faibilo.favorites',
  quickLinks: 'faibilo.quickLinks'
};

const DEFAULT_APPEARANCE = {
  themePreset: 'forest',
  accentColor: '#00ff99',
  componentBgColor: '#15171e',
  borderColor: '#31502b'
};

const ICONS = {
  'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'bell': '<path d="M10.27 21a2 2 0 0 0 3.46 0"/><path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.86 18 12.33 18 8A6 6 0 0 0 6 8c0 4.33-1.41 5.86-2.74 7.33"/>',
  'camera': '<path d="M14.5 4 16 7h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4l1.5-3z"/><circle cx="12" cy="13" r="3"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-up': '<path d="m18 15-6-6-6 6"/>',
  'corner-down-left': '<path d="m9 10-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  'globe': '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 0 20"/><path d="M12 2a15.3 15.3 0 0 0 0 20"/>',
  'home': '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  'lock': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  'map-pin': '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  'mic': '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  'minus': '<path d="M5 12h14"/>',
  'panel-right': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  'plus': '<path d="M12 5v14"/><path d="M5 12h14"/>',
  'rotate-cw': '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v7h-7"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
  'shield': '<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/><path d="m9 12 2 2 4-4"/>',
  'shield-alert': '<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  'square': '<rect x="6" y="6" width="12" height="12" rx="1"/>',
  'screen': '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  'star': '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/>',
  'star-fill': '<path fill="currentColor" d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/>',
  'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  'more-vertical': '<circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/>',
  'printer': '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  'compass': '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  'disc': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>',
  'zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  'palette': '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C21.437 6.438 17.203 2 12 2Z"/>'
};

const $ = (selector) => document.querySelector(selector);
const tabsEl = $('#tabs');
const tabsOverflowButton = $('#tabsOverflow');
const tabsMenu = $('#tabsMenu');
const tabsMenuList = $('#tabsMenuList');
const browserArea = $('#browserArea');
const address = $('#address');
const security = $('#security');
const reloadButton = $('#reload');
const bookmarkButton = $('#bookmark');
const bookmarksPopover = $('#bookmarksPopover');
const settingsPage = $('#settingsPage');
const sidePanel = $('#sidePanel');
const findbar = $('#findbar');
const findText = $('#findText');
const permissionModal = $('#permissionModal');
const screenshareModal = $('#screenshareModal');
const screenshareGrid = $('#screenshareGrid');
const screenshareEmpty = $('#screenshareEmpty');
const screenshareShareBtn = $('#screenshareShareBtn');
const screenshareCancelBtn = $('#screenshareCancelBtn');
const screenshareTabScreens = $('#screenshareTabScreens');
const screenshareTabWindows = $('#screenshareTabWindows');
const screenshareCountScreens = $('#screenshareCountScreens');
const screenshareCountWindows = $('#screenshareCountWindows');
const screenshareAudioCheck = $('#screenshareAudioCheck');
const appRedirectModal = $('#appRedirectModal');
const appRedirectAppName = $('#appRedirectAppName');
const appRedirectAppHighlight = $('#appRedirectAppHighlight');
const appRedirectOrigin = $('#appRedirectOrigin');
const appRedirectUrlText = $('#appRedirectUrlText');
const appRedirectUrlBox = $('#appRedirectUrlBox');
const appRedirectRememberCheck = $('#appRedirectRememberCheck');
const appRedirectCancelBtn = $('#appRedirectCancelBtn');
const appRedirectOpenBtn = $('#appRedirectOpenBtn');
const ambientGlow = $('#ambientGlow');
const mediaDisc = $('#mediaDisc');
const mediaDiscThumb = $('#mediaDiscThumb');
const menuButton = $('#menuButton');
const menuPopover = $('#menuPopover');
const menuZoomVal = $('#menuZoomVal');

let tabs = [];
let activeTabId = null;
let tabCounter = 0;
let closedTabs = [];
let bookmarks = readStore(STORAGE_KEYS.bookmarks, []);
let historyItems = readStore(STORAGE_KEYS.history, []);
let downloads = readStore(STORAGE_KEYS.downloads, []);
const DEFAULT_FAVORITE_APPS = [
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', builtIn: true },
  { id: 'discord', name: 'Discord', url: 'https://discord.com/app', builtIn: true },
  { id: 'whatsapp', name: 'WhatsApp', url: 'https://web.whatsapp.com', builtIn: true },
  { id: 'spotify', name: 'Spotify', url: 'https://open.spotify.com', builtIn: true },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', builtIn: true },
  { id: 'github', name: 'GitHub', url: 'https://github.com', builtIn: true },
  { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com', builtIn: true },
  { id: 'reddit', name: 'Reddit', url: 'https://www.reddit.com', builtIn: true },
  { id: 'telegram', name: 'Telegram', url: 'https://web.telegram.org', builtIn: true },
  { id: 'notion', name: 'Notion', url: 'https://www.notion.so', builtIn: true },
  { id: 'twitter', name: 'X', url: 'https://x.com', builtIn: true }
];

let favoriteApps = readStore(STORAGE_KEYS.favorites, DEFAULT_FAVORITE_APPS);
if (!Array.isArray(favoriteApps) || favoriteApps.length === 0) {
  favoriteApps = [...DEFAULT_FAVORITE_APPS];
  writeStore(STORAGE_KEYS.favorites, favoriteApps);
}

const DEFAULT_QUICK_LINKS = [
  { id: 'google',    name: 'Google',    url: 'https://www.google.com' },
  { id: 'youtube',   name: 'YouTube',   url: 'https://www.youtube.com' },
  { id: 'github',    name: 'GitHub',    url: 'https://github.com' },
  { id: 'spotify',   name: 'Spotify',   url: 'https://open.spotify.com' },
  { id: 'whatsapp',  name: 'WhatsApp',  url: 'https://web.whatsapp.com' },
  { id: 'gmail',     name: 'Gmail',     url: 'https://mail.google.com' },
  { id: 'reddit',    name: 'Reddit',    url: 'https://www.reddit.com' },
  { id: 'notion',    name: 'Notion',    url: 'https://www.notion.so' }
];
let quickLinks = readStore(STORAGE_KEYS.quickLinks, DEFAULT_QUICK_LINKS);
let settings = {
  searchEngine: 'google',
  homeMode: 'start',
  customHome: '',
  ...DEFAULT_APPEARANCE,
  bookmarksNewTab: true,
  askDownloadLocation: false,
  blockAds: true,
  blockPopups: true,
  blockTrackers: true,
  autoSkipVideoAds: true,
  cosmeticFiltering: true,
  whitelistedDomains: [],
  customBlockRules: [],
  blockedCount: 0,
  fastMode: true,
  saveHistory: true,
  downloadPath: '',
  showSidebar: true,
  ambientVideoGlow: true,
  autoPageTheme: false,
  desktopMediaDisk: true,
  launchAtStartup: false,
  sleepingTabsEnabled: true,
  sleepingTabsTimeout: 15,
  efficiencyMode: false,
  predictivePreload: true,
  ...readStore(STORAGE_KEYS.settings, {})
};
let tabsRenderQueued = false;
let libraryRenderQueued = false;
let draggedTabId = null;
let activePermission = null;
let permissionQueue = [];
let rememberedPermissions = [];
let screenshareQueue = [];
let activeScreenshare = null;
let selectedScreenshareSourceId = null;
let currentScreenshareTab = 'screens';
let appRedirectQueue = [];
let activeAppRedirect = null;
let ambientSampleTimer = null;
let browserInBackground = false;
let pageThemeToken = 0;
let hiddenTabIds = [];
let currentMediaTabId = null;
let bootReadyPending = true;
let appReadySignaled = false;

function signalAppReadyOnce() {
  if (appReadySignaled) return;
  appReadySignaled = true;
  window.faibilo.notifyAppReady?.();
}

const DANGEROUS_SCHEMES = new Set(['file:', 'javascript:', 'data:', 'vbscript:', 'shell:', 'disk:']);
const WEB_SCHEMES = new Set(['http:', 'https:', 'about:', 'data:', 'blob:', 'faibilo:', 'file:', 'chrome:', 'javascript:', 'ws:', 'wss:']);

function isExternalAppUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const match = rawUrl.match(/^([a-z0-9+.-]+):/i);
  if (!match) return false;
  const protocol = match[1].toLowerCase() + ':';
  if (DANGEROUS_SCHEMES.has(protocol)) return false;
  return !WEB_SCHEMES.has(protocol);
}

function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.search}</svg>`;
}

function paintStaticIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((element) => {
    element.innerHTML = icon(element.dataset.icon);
  });
}

function readStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function queueStore(key, value) {
  const runWhenIdle = window.requestIdleCallback || ((callback) => setTimeout(callback, 1));
  runWhenIdle(() => writeStore(key, value), { timeout: 750 });
}

function sanitizeStoredPages() {
  bookmarks = bookmarks.filter((item) => item?.url?.startsWith('http'));
  historyItems = historyItems.filter((item) => item?.url?.startsWith('http'));
  writeStore(STORAGE_KEYS.bookmarks, bookmarks);
  writeStore(STORAGE_KEYS.history, historyItems);
}

function sanitizeFavoriteApps() {
  favoriteApps = favoriteApps
    .filter((app) => app?.name && app?.url?.startsWith('http'))
    .map((app, index) => ({
      ...app,
      id: app.id || `favorite-${Date.now()}-${index}`
    }));
  writeStore(STORAGE_KEYS.favorites, favoriteApps);
}

async function loadNativeSettings() {
  const nativeSettings = await window.faibilo.getSettings();
  settings = { ...settings, ...nativeSettings };
  writeStore(STORAGE_KEYS.settings, settings);
  applyAppearance();
  applySettingsToForm();
}

function persistSettings(nextSettings = {}) {
  settings = { ...settings, ...nextSettings };
  writeStore(STORAGE_KEYS.settings, settings);
  window.faibilo.updateSettings({
    downloadPath: settings.downloadPath,
    askDownloadLocation: settings.askDownloadLocation,
    blockAds: settings.blockAds,
    blockPopups: settings.blockPopups,
    blockTrackers: settings.blockTrackers,
    autoSkipVideoAds: settings.autoSkipVideoAds,
    cosmeticFiltering: settings.cosmeticFiltering,
    whitelistedDomains: settings.whitelistedDomains,
    customBlockRules: settings.customBlockRules,
    blockedCount: settings.blockedCount,
    desktopMediaDisk: settings.desktopMediaDisk,
    launchAtStartup: settings.launchAtStartup,
    themePreset: settings.themePreset,
    accentColor: settings.accentColor,
    componentBgColor: settings.componentBgColor,
    borderColor: settings.borderColor
  });
  applyAppearance();
  if (['themePreset', 'accentColor', 'componentBgColor', 'borderColor'].some((key) => key in nextSettings)) {
    refreshHomeTabsAppearance();
  }
  if ('ambientVideoGlow' in nextSettings) updateAmbientGlow();
  if ('autoPageTheme' in nextSettings || ['themePreset', 'accentColor', 'componentBgColor', 'borderColor'].some((key) => key in nextSettings)) {
    updatePageTheme();
  }
  updateSidebarVisibility();
}

async function samplePlayingMedia(tab) {
  if (!tab?.webview || tab.special === 'settings') return null;
  try {
    return await tab.webview.executeJavaScript(`
      (() => {
        const mediaElements = [
          ...Array.from(document.querySelectorAll('video')),
          ...Array.from(document.querySelectorAll('audio'))
        ];
        
        // Find playing media first
        let el = mediaElements.find((item) => !item.paused && !item.ended && item.readyState >= 2 && (item.tagName === 'AUDIO' || (item.videoWidth > 0 && item.videoHeight > 0)));
        let playing = true;
        
        // If not playing, find paused media that has been played (has progress)
        if (!el) {
          el = mediaElements.find((item) => item.paused && !item.ended && item.currentTime > 0 && item.readyState >= 2 && (item.tagName === 'AUDIO' || (item.videoWidth > 0 && item.videoHeight > 0)));
          playing = false;
        }
        
        if (!el) return null;
        
        let thumbnail = '';
        try {
          if (el.tagName === 'VIDEO' && el.videoWidth > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = 96;
            canvas.height = 96;
            const context = canvas.getContext('2d');
            context.drawImage(el, 0, 0, 96, 96);
            thumbnail = canvas.toDataURL('image/jpeg', 0.72);
          }
        } catch {
          thumbnail = '';
        }
        
        const ogImage = document.querySelector('meta[property="og:image"], meta[name="twitter:image"]')?.content || '';
        return {
          playing: playing,
          title: document.title || location.hostname,
          url: location.href,
          thumbnail: thumbnail || ogImage
        };
      })()
    `, true);
  } catch {
    return null;
  }
}

async function updateMediaDisc() {
  let activeMedia = null;
  let activeMediaTab = null;
  let needsRender = false;

  for (const tab of tabs) {
    if (tab.special) {
      if (tab.media !== null && tab.media !== undefined) {
        tab.media = null;
        needsRender = true;
      }
      continue;
    }
    const media = await samplePlayingMedia(tab);
    
    // Check if media state changed for this tab to prevent redundant DOM updates
    const oldMedia = tab.media;
    tab.media = media;

    if (!oldMedia && media) {
      needsRender = true;
    } else if (oldMedia && !media) {
      needsRender = true;
    } else if (oldMedia && media) {
      if (oldMedia.playing !== media.playing || oldMedia.title !== media.title || oldMedia.url !== media.url) {
        needsRender = true;
      }
    }

    if (media) {
      if (!activeMedia) {
        activeMedia = media;
        activeMediaTab = tab;
      } else if (media.playing && !activeMedia.playing) {
        activeMedia = media;
        activeMediaTab = tab;
      } else if (media.playing === activeMedia.playing && tab.id === activeTabId) {
        activeMedia = media;
        activeMediaTab = tab;
      }
    }
  }

  if (needsRender) {
    scheduleTabsRender();
  }

  if (activeMediaTab && activeMedia) {
    currentMediaTabId = activeMediaTab.id;
    mediaDisc.classList.remove('hidden');
    mediaDisc.title = `${activeMedia.playing ? 'Playing' : 'Paused'}: ${activeMedia.title}`;
    if (activeMedia.thumbnail) mediaDiscThumb.style.backgroundImage = `url("${activeMedia.thumbnail.replace(/"/g, '%22')}")`;
    else mediaDiscThumb.style.backgroundImage = activeMediaTab.favicon ? `url("${activeMediaTab.favicon}")` : '';

    if (activeMedia.playing) {
      window.faibilo.sendMediaState({
        playing: true,
        title: activeMedia.title,
        thumbnail: activeMedia.thumbnail || activeMediaTab.favicon || '',
        url: activeMedia.url || activeMediaTab.url || '',
        exists: true
      });
    } else {
      window.faibilo.sendMediaState({
        playing: false,
        title: activeMedia.title,
        thumbnail: activeMedia.thumbnail || activeMediaTab.favicon || '',
        url: activeMedia.url || activeMediaTab.url || '',
        exists: true
      });
    }
  } else {
    currentMediaTabId = null;
    mediaDisc.classList.add('hidden');

    window.faibilo.sendMediaState({
      playing: false,
      exists: false
    });
  }
}

function applyAppearance() {
  document.documentElement.dataset.theme = settings.themePreset || 'forest';
  document.documentElement.style.setProperty('--accent', sanitizeThemeColor(settings.accentColor, '#00ff99'));
  document.documentElement.style.setProperty('--component-bg', sanitizeThemeColor(settings.componentBgColor, '#15171e'));
  const border = sanitizeThemeColor(settings.borderColor, '#31502b');
  document.documentElement.style.setProperty('--border-color', border);
  document.documentElement.style.setProperty('--line', border);
  document.body.classList.toggle('efficiency-mode', Boolean(settings.efficiencyMode));

  if (window.faibilo?.sendMediaAppearance) {
    window.faibilo.sendMediaAppearance({
      themePreset: settings.themePreset || 'forest',
      accentColor: sanitizeThemeColor(settings.accentColor, '#00ff99'),
      componentBgColor: sanitizeThemeColor(settings.componentBgColor, '#15171e'),
      borderColor: border
    });
  }
}

function normalizeCssColor(value) {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return '';
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

function updatePageTheme() {
  applyAppearance();
}

function setAmbientState(active, color = settings.accentColor || '#00ff99') {
  ambientGlow.classList.toggle('active', Boolean(active && settings.ambientVideoGlow));
  ambientGlow.style.setProperty('--ambient-color', color);
}

async function sampleTabVideo(tab) {
  if (!tab?.webview || tab.special === 'settings') return null;
  try {
    return await tab.webview.executeJavaScript(`
      (() => {
        const videos = Array.from(document.querySelectorAll('video'));
        const video = videos.find((item) => !item.paused && !item.ended && item.readyState >= 2 && item.videoWidth > 0 && item.videoHeight > 0);
        if (!video) return null;
        let color = '';
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 12;
          canvas.height = 12;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(video, 0, 0, 12, 12);
          const data = context.getImageData(0, 0, 12, 12).data;
          let red = 0;
          let green = 0;
          let blue = 0;
          for (let index = 0; index < data.length; index += 4) {
            red += data[index];
            green += data[index + 1];
            blue += data[index + 2];
          }
          const pixels = data.length / 4;
          color = 'rgb(' + Math.round(red / pixels) + ', ' + Math.round(green / pixels) + ', ' + Math.round(blue / pixels) + ')';
        } catch {
          color = '';
        }
        return { color, time: video.currentTime };
      })()
    `, true);
  } catch {
    return null;
  }
}

async function updateAmbientGlow() {
  if (!settings.ambientVideoGlow) {
    setAmbientState(false);
    return;
  }
  const hasActiveMedia = tabs.some((t) => t.media?.playing);
  if (!hasActiveMedia) {
    setAmbientState(false);
    return;
  }
  const tabOrder = [
    activeTab(),
    ...tabs.filter((tab) => tab.id !== activeTabId && !tab.special)
  ];
  for (const tab of tabOrder) {
    if (!tab?.media?.playing) continue;
    const sample = await sampleTabVideo(tab);
    if (!sample) continue;
    setAmbientState(true, sample.color || settings.accentColor || '#00ff99');
    return;
  }
  setAmbientState(false);
}

function startAmbientSampler() {
  if (ambientSampleTimer) clearInterval(ambientSampleTimer);
  ambientSampleTimer = null;
  if (!settings.ambientVideoGlow || settings.efficiencyMode) {
    setAmbientState(false);
    return;
  }
  const hasActiveMedia = tabs.some((t) => t.media?.playing && !t.isSleeping);
  if (!hasActiveMedia) {
    setAmbientState(false);
    return;
  }
  const interval = browserInBackground ? 4500 : 1500;
  ambientSampleTimer = setInterval(() => {
    if (browserInBackground) {
      updateMediaDisc();
      return;
    }
    updateAmbientGlow();
    updateMediaDisc();
  }, interval);
}

function refreshHomeTabs() {
  tabs.forEach((tab) => refreshStartPage(tab));
}

async function refreshStartPage(tab) {
  if (!tab?.webview || tab.special || !isHomeUrl(tab.url)) return;
  try {
    const payload = {
      favorites: favoriteApps.slice(0, 8).map((item) => ({ name: item.name, url: item.url })),
      history: IS_INCOGNITO ? [] : historyItems.slice(0, 8).map((item) => ({ title: item.title, url: item.url })),
      searchEngine: settings.searchEngine || 'google',
      quickLinks: quickLinks.map((l) => ({ id: l.id, name: l.name, url: l.url }))
    };
    const encoded = JSON.stringify(payload).replace(/</g, '\\u003c');
    await tab.webview.executeJavaScript(`window.__faibiloStartApply && window.__faibiloStartApply(${encoded})`);
  } catch {
    // Start page not ready yet.
  }
}

// Poll home tabs every 800ms for quick link changes saved by the start page
setInterval(async () => {
  for (const tab of tabs) {
    if (!tab.webview || tab.special || !isHomeUrl(tab.url)) continue;
    try {
      const updated = await tab.webview.executeJavaScript(
        '(function(){ const v=window.__pendingQuickLinksUpdate; window.__pendingQuickLinksUpdate=null; return v||null; })()'
      );
      if (updated && Array.isArray(updated) && updated.length > 0) {
        quickLinks = updated.filter((l) => l?.url).map((l, i) => ({
          id: l.id || `ql-${Date.now()}-${i}`,
          name: String(l.name || '').trim() || (() => { try { return new URL(l.url).hostname.replace(/^www\./, ''); } catch { return l.url; } })(),
          url: l.url
        }));
        writeStore(STORAGE_KEYS.quickLinks, quickLinks);
      }
    } catch {
      // tab navigated away or not ready
    }
  }
}, 800);

function refreshHomeTabsAppearance() {
  tabs.forEach((tab) => {
    if (!tab.webview || !isHomeUrl(tab.url)) return;
    tab.webview.src = webviewUrl(HOME_URL);
  });
}

function activeTab() {
  return tabs.find((tab) => tab.id === activeTabId);
}

function isStartPageUrl(url) {
  if (!url || url === HOME_URL) return false;
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/\\/g, '/').endsWith('/start.html');
  } catch {
    return /start\.html(?:$|[?#])/i.test(String(url));
  }
}

function isHomeUrl(url) {
  return url === HOME_URL || url === START_PAGE_URL || isStartPageUrl(url);
}

function sanitizeThemeColor(value, fallback) {
  const raw = String(value || fallback || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toLowerCase()}`;
  return fallback;
}

function normalizeInput(value) {
  let input = value.trim();
  if (!input) return HOME_URL;
  input = input.replace(/^["']|["']$/g, '').trim();
  if (input === HOME_URL || input === START_PAGE_URL || isStartPageUrl(input)) return HOME_URL;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) return input;
  if (/^[a-zA-Z]:[\\/]/.test(input) || input.startsWith('\\\\')) {
    const formatted = input.replace(/\\/g, '/');
    return `file:///${formatted.startsWith('/') ? formatted.slice(1) : formatted}`;
  }
  if (/^(localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/i.test(input)) return `http://${input}`;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/i.test(input)) return `https://${input}`;
  return `${searchUrl()}${encodeURIComponent(input)}`;
}

function displayUrl(url) {
  return isHomeUrl(url) ? '' : url;
}

function appearanceParams() {
  if (IS_INCOGNITO) {
    const params = new URLSearchParams({
      theme: 'midnight',
      accent: '#c084fc',
      component: '#130f1a',
      border: '#2a1a3a',
      incognito: 'true'
    });
    return params.toString();
  }
  const params = new URLSearchParams({
    theme: settings.themePreset || 'forest',
    accent: sanitizeThemeColor(settings.accentColor, '#00ff99'),
    component: sanitizeThemeColor(settings.componentBgColor, '#15171e'),
    border: sanitizeThemeColor(settings.borderColor, '#31502b')
  });
  return params.toString();
}

function webviewUrl(url) {
  return url === HOME_URL ? `${START_PAGE_URL}?${appearanceParams()}` : url;
}

function newTabUrl() {
  if (settings.homeMode === 'blank') return 'about:blank';
  if (settings.homeMode === 'custom' && settings.customHome.trim()) return normalizeInput(settings.customHome);
  return HOME_URL;
}

function searchUrl() {
  if (settings.searchEngine === 'duckduckgo') return 'https://duckduckgo.com/?q=';
  if (settings.searchEngine === 'bing') return 'https://www.bing.com/search?q=';
  return SEARCH_URL;
}

function webviewPreferences() {
  return 'backgroundThrottling=no,webSecurity=yes,contextIsolation=yes,nodeIntegration=no';
}

function handleWebviewPermissionRequest(tab, e) {
  const supported = new Set(['notifications', 'media', 'geolocation', 'fullscreen', 'pointerLock', 'midiSysex', 'display-capture']);
  if (!supported.has(e.permission)) {
    e.request.deny();
    return;
  }

  if (e.permission === 'display-capture') {
    e.request.allow();
    return;
  }

  const url = tab.webview.getURL?.() || tab.url || '';
  window.faibilo.requestWebviewPermission({ permission: e.permission, url })
    .then((allowed) => {
      if (allowed) e.request.allow();
      else e.request.deny();
    })
    .catch(() => e.request.deny());
}

let prewarmedNewTab = null;

function ensurePrewarmedNewTab() {
  if (prewarmedNewTab || tabs.length >= 25) return;
  try {
    const defaultUrl = newTabUrl();
    const webview = document.createElement('webview');
    webview.className = 'webview'; // hidden
    webview.setAttribute('allowpopups', 'true');
    webview.setAttribute('allow', 'display-capture *; camera *; microphone *; geolocation *; clipboard-read *; clipboard-write *; screen-wake-lock *; autoplay *');
    webview.setAttribute('allowfullscreen', 'true');
    webview.setAttribute('partition', IS_INCOGNITO ? 'incognito' : 'persist:faibilo');
    webview.setAttribute('webpreferences', webviewPreferences());
    webview.setAttribute('preload', window.faibilo.webviewPreloadPath);
    if (window.faibilo.cleanUserAgent) {
      webview.setAttribute('useragent', window.faibilo.cleanUserAgent);
    }
    webview.src = webviewUrl(defaultUrl);
    browserArea.appendChild(webview);

    prewarmedNewTab = {
      url: defaultUrl,
      webview
    };
  } catch {}
}

const speculativePreload = {
  url: null,
  webview: null,
  timer: null,
  cleanupTimer: null
};

function startSpeculativePreload(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return;
  const targetUrl = normalizeInput(rawUrl);
  if (isExternalAppUrl(targetUrl)) return;

  predictivePreconnect(targetUrl);

  if (speculativePreload.url === targetUrl && speculativePreload.webview) return;
  cancelSpeculativePreload();

  speculativePreload.timer = setTimeout(() => {
    try {
      const webview = document.createElement('webview');
      webview.className = 'webview'; // hidden
      webview.setAttribute('allowpopups', 'true');
      webview.setAttribute('allow', 'display-capture *; camera *; microphone *; geolocation *; clipboard-read *; clipboard-write *; screen-wake-lock *; autoplay *');
      webview.setAttribute('allowfullscreen', 'true');
      webview.setAttribute('partition', IS_INCOGNITO ? 'incognito' : 'persist:faibilo');
      webview.setAttribute('webpreferences', webviewPreferences());
      webview.setAttribute('preload', window.faibilo.webviewPreloadPath);
      if (window.faibilo.cleanUserAgent) {
        webview.setAttribute('useragent', window.faibilo.cleanUserAgent);
      }
      webview.src = webviewUrl(targetUrl);
      browserArea.appendChild(webview);

      speculativePreload.url = targetUrl;
      speculativePreload.webview = webview;

      speculativePreload.cleanupTimer = setTimeout(() => {
        cancelSpeculativePreload();
      }, 20000);
    } catch {}
  }, 45);
}

function cancelSpeculativePreload() {
  if (speculativePreload.timer) {
    clearTimeout(speculativePreload.timer);
    speculativePreload.timer = null;
  }
  if (speculativePreload.cleanupTimer) {
    clearTimeout(speculativePreload.cleanupTimer);
    speculativePreload.cleanupTimer = null;
  }
  if (speculativePreload.webview) {
    try {
      speculativePreload.webview.remove();
    } catch {}
    speculativePreload.webview = null;
    speculativePreload.url = null;
  }
}

function consumeSpeculativePreload(rawUrl) {
  if (!rawUrl) return null;
  const targetUrl = normalizeInput(rawUrl);
  if (speculativePreload.url === targetUrl && speculativePreload.webview) {
    if (speculativePreload.cleanupTimer) clearTimeout(speculativePreload.cleanupTimer);
    const wv = speculativePreload.webview;
    speculativePreload.webview = null;
    speculativePreload.url = null;
    speculativePreload.timer = null;
    speculativePreload.cleanupTimer = null;
    return wv;
  }
  cancelSpeculativePreload();
  return null;
}

function attachWebviewToTab(tab, activate = false) {
  if (tab.webview) return tab.webview;

  // 1. Consume speculative background preloaded webview if available
  const speculative = consumeSpeculativePreload(tab.url);
  if (speculative) {
    speculative.className = `webview ${activate ? 'active' : ''}`;
    tab.webview = speculative;
    bindWebview(tab);
    return speculative;
  }

  // 2. Consume pre-warmed instant new tab webview if available
  if (isHomeUrl(tab.url) && prewarmedNewTab?.webview) {
    const prewarmed = prewarmedNewTab.webview;
    prewarmedNewTab = null;
    prewarmed.className = `webview ${activate ? 'active' : ''}`;
    tab.webview = prewarmed;
    bindWebview(tab);
    setTimeout(ensurePrewarmedNewTab, 150);
    return prewarmed;
  }

  const webview = document.createElement('webview');
  webview.className = `webview ${activate ? 'active' : ''}`;
  webview.setAttribute('allowpopups', 'true');
  webview.setAttribute('allow', 'display-capture *; camera *; microphone *; geolocation *; clipboard-read *; clipboard-write *; screen-wake-lock *; autoplay *');
  webview.setAttribute('allowfullscreen', 'true');
  webview.setAttribute('partition', IS_INCOGNITO ? 'incognito' : 'persist:faibilo');
  webview.setAttribute('webpreferences', webviewPreferences());
  webview.setAttribute('preload', window.faibilo.webviewPreloadPath);
  if (window.faibilo.cleanUserAgent) {
    webview.setAttribute('useragent', window.faibilo.cleanUserAgent);
  }
  webview.src = webviewUrl(tab.url);

  tab.webview = webview;
  browserArea.appendChild(webview);
  bindWebview(tab);

  if (isHomeUrl(tab.url)) {
    setTimeout(ensurePrewarmedNewTab, 200);
  }

  return webview;
}

async function sleepTab(tab) {
  if (!tab || tab.special || tab.isSleeping || tab.id === activeTabId) return;
  if (tab.media?.playing) return;
  // Keep webview static in memory so it never reloads on tab switch
  tab.isSleeping = true;
  scheduleTabsRender();
}

function wakeTab(tab) {
  if (!tab || !tab.isSleeping) return;
  tab.isSleeping = false;
  tab.lastActiveAt = Date.now();
  if (!tab.webview) {
    attachWebviewToTab(tab, true);
  } else {
    tab.webview.classList.add('active');
  }
  scheduleTabsRender();
}

function checkIdleTabsSweep() {
  if (!settings.sleepingTabsEnabled) return;
  const now = Date.now();
  let idleLimitMin = parseInt(settings.sleepingTabsTimeout, 10) || 15;
  const idleLimitMs = idleLimitMin * 60 * 1000;

  for (const tab of tabs) {
    if (tab.id === activeTabId || tab.special || tab.isSleeping) continue;
    if (tab.media?.playing) continue;
    if (now - (tab.lastActiveAt || 0) > idleLimitMs) {
      sleepTab(tab);
    }
  }
}

function createTab(url = newTabUrl(), activate = true) {
  if (isExternalAppUrl(url)) {
    window.faibilo.requestAppRedirect?.(url);
    return null;
  }
  updateEmptyStateVisibility();
  const id = `tab-${++tabCounter}`;

  const tab = {
    id,
    title: 'New tab',
    url,
    favicon: '',
    loading: false,
    loadError: false,
    lastErrorMessage: '',
    canGoBack: false,
    canGoForward: false,
    zoom: 1,
    lastActiveAt: Date.now(),
    isSleeping: false,
    savedScrollY: 0,
    webview: null
  };

  attachWebviewToTab(tab, activate);
  tabs.push(tab);
  if (activate) setActiveTab(id);
  scheduleTabsRender();

  return tab;
}

function createSettingsTab() {
  if (tabs.some((tab) => tab.id === SETTINGS_TAB_ID)) {
    setActiveTab(SETTINGS_TAB_ID);
    return;
  }

  const settingsTab = {
    id: SETTINGS_TAB_ID,
    title: 'Settings',
    icon: 'settings',
    special: 'settings',
    closing: false
  };

  tabs.push(settingsTab);
  applySettingsToForm();
  renderTabs();
  setActiveTab(SETTINGS_TAB_ID);
}

function bindWebview(tab) {
  if (tab.webviewBound) return;
  tab.webviewBound = true;

  tab.webview.addEventListener('permissionrequest', (e) => handleWebviewPermissionRequest(tab, e));

  tab.webview.addEventListener('did-start-loading', () => {
    tab.loading = true;
    tab.loadError = false;
    tab.lastErrorMessage = '';
    updateChrome();
    renderTabs();
  });

  tab.webview.addEventListener('did-stop-loading', () => {
    tab.loading = false;
    tab.canGoBack = tab.webview.canGoBack();
    tab.canGoForward = tab.webview.canGoForward();
    syncNavigation(tab);
    updateChrome();
    updateAmbientGlow();
    updatePageTheme();
    if (isHomeUrl(tab.url)) refreshStartPage(tab);
    renderTabs();
    if (bootReadyPending) {
      bootReadyPending = false;
      signalAppReadyOnce();
    }
  });

  tab.webview.addEventListener('did-fail-load', (event) => {
    if (event?.isMainFrame === false) return;
    const isAbort = event?.errorCode === -3 || /aborted/i.test(event?.errorDescription || '');
    if (isAbort) return;
    tab.loading = false;
    tab.loadError = true;
    tab.lastErrorMessage = event?.errorDescription || 'This page could not be loaded.';
    tab.title = 'Page unavailable';
    updateChrome();
    renderTabs();
  });

  tab.webview.addEventListener('page-title-updated', (event) => {
    tab.title = isHomeUrl(tab.url) ? 'Faibilo Start' : event.title || 'Untitled';
    scheduleTabsRender();
  });

  tab.webview.addEventListener('page-favicon-updated', (event) => {
    tab.favicon = event.favicons?.[0] || '';
    scheduleTabsRender();
  });

  tab.webview.addEventListener('did-navigate', () => syncNavigation(tab));
  tab.webview.addEventListener('did-navigate-in-page', () => syncNavigation(tab));
  tab.webview.addEventListener('will-navigate', (event) => {
    const url = event.url || '';
    if (isExternalAppUrl(url)) {
      event.preventDefault?.();
      let tabOrigin = '';
      try { tabOrigin = new URL(tab.url).origin; } catch {}
      window.faibilo.requestAppRedirect?.(url, tabOrigin);
    }
  });
  tab.webview.addEventListener('new-window', (event) => {
    event.preventDefault?.();
    const url = event.url || '';
    if (isExternalAppUrl(url)) {
      let tabOrigin = '';
      try { tabOrigin = new URL(tab.url).origin; } catch {}
      window.faibilo.requestAppRedirect?.(url, tabOrigin);
      return;
    }
    if (!url.startsWith('http') && !url.startsWith('file://')) return;

    if (settings.blockPopups !== false) {
      const blockOptions = {
        whitelistedDomains: settings.whitelistedDomains || [],
        customBlockRules: settings.customBlockRules || []
      };
      const isBlocked = (window.faibilo.isPopupUrl && window.faibilo.isPopupUrl(url, blockOptions)) ||
                        (window.faibilo.isBlockedUrl && window.faibilo.isBlockedUrl(url, blockOptions));
      if (isBlocked) {
        settings.blockedCount = (settings.blockedCount || 0) + 1;
        writeStore(STORAGE_KEYS.settings, settings);
        updateShieldsStats();
        showShieldToast('Popup Blocked', url);
        return;
      }
    }

    createTab(url);
  });
  tab.webview.addEventListener('before-input-event', (event, input) => {
    handleShortcutInput(input || event.input, event);
  });
  tab.webview.addEventListener('enter-html-full-screen', () => {
    window.faibilo.setFullscreen(true);
  });
  tab.webview.addEventListener('leave-html-full-screen', () => {
    window.faibilo.setFullscreen(false);
  });

  // Listen to native media state changes for instant, smooth updates
  tab.webview.addEventListener('media-started-playing', () => {
    updateMediaDisc();
  });
  tab.webview.addEventListener('media-paused', () => {
    updateMediaDisc();
  });
}

function syncNavigation(tab) {
  const current = tab.webview.getURL();
  tab.url = isStartPageUrl(current) ? HOME_URL : current;
  tab.canGoBack = tab.webview.canGoBack();
  tab.canGoForward = tab.webview.canGoForward();
  tab.loadError = false;
  tab.lastErrorMessage = '';
  addHistory(tab);
  updateChrome();
  if (tab.id === activeTabId) updatePageTheme();
  renderTabs();
}

function navigateTab(tab, url) {
  if (isExternalAppUrl(url)) {
    let tabOrigin = '';
    try { tabOrigin = new URL(tab?.url).origin; } catch {}
    window.faibilo.requestAppRedirect?.(url, tabOrigin);
    return;
  }
  if (!tab || tab.special === 'settings') {
    createTab(url);
    return;
  }

  const speculative = consumeSpeculativePreload(url);
  if (speculative) {
    if (tab.webview) {
      try { tab.webview.remove(); } catch {}
    }
    speculative.className = 'webview active';
    tab.webview = speculative;
    tab.url = url;
    tab.webviewBound = false;
    bindWebview(tab);
    updateChrome();
    renderTabs();
    return;
  }

  tab.url = url;
  tab.loadError = false;
  tab.lastErrorMessage = '';
  tab.webview.src = webviewUrl(url);
  updateChrome();
  renderTabs();
}

function updateActiveTabClass(id) {
  const tabElements = tabsEl.querySelectorAll('.tab');
  if (tabElements.length !== tabs.length) {
    renderTabs();
    return;
  }
  tabElements.forEach((tabBtn) => {
    const isCurrent = tabBtn.dataset.tabId === id;
    tabBtn.classList.toggle('active', isCurrent);
    if (isCurrent) {
      tabBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  });
}

function setActiveTab(id) {
  activeTabId = id;
  tabs.forEach((tab) => {
    if (tab.special === 'settings') return;
    if (tab.id === id) {
      tab.lastActiveAt = Date.now();
      if (tab.isSleeping) {
        wakeTab(tab);
      } else if (tab.webview) {
        tab.webview.classList.add('active');
      }
    } else {
      if (tab.webview) {
        tab.webview.classList.remove('active');
      }
    }
  });
  if (settingsPage) {
    settingsPage.classList.toggle('active', id === SETTINGS_TAB_ID);
    settingsPage.classList.toggle('hidden', id !== SETTINGS_TAB_ID);
  }
  updateActiveTabClass(id);
  updateChrome();
  updateAmbientGlow();
  updatePageTheme();
  updateZoomMenuLabel();
}

function reopenClosedTab() {
  const lastClosed = closedTabs.pop();
  if (!lastClosed) return false;
  const reopened = createTab(lastClosed.url || newTabUrl(), true);
  reopened.title = lastClosed.title || 'Recovered tab';
  reopened.favicon = lastClosed.favicon || '';
  reopened.url = lastClosed.url || HOME_URL;
  return true;
}

function closeTab(id) {
  const index = tabs.findIndex((tab) => tab.id === id);
  if (index === -1) return;
  const tab = tabs[index];
  if (tab.closing) return;
  tab.closing = true;
  scheduleTabsRender();

  const nextTab = activeTabId === id ? tabs[index + 1] || tabs[index - 1] : null;
  if (nextTab) {
    setActiveTab(nextTab.id);
  } else if (tabs.length === 1 && activeTabId === id) {
    activeTabId = null;
    updateEmptyStateVisibility();
  }

  setTimeout(() => {
    const removeIndex = tabs.findIndex((item) => item.id === id);
    if (removeIndex === -1) return;
    const [removed] = tabs.splice(removeIndex, 1);
    if (removed && !removed.special && !removed.closing) {
      closedTabs.push({
        id: removed.id,
        title: removed.title,
        url: removed.url,
        favicon: removed.favicon
      });
      closedTabs = closedTabs.slice(-8);
    }
    if (removed && removed.webview) {
      try {
        removed.webview.remove();
      } catch {}
      removed.webview = null;
    }
    if (!tabs.length) {
      activeTabId = null;
      updateEmptyStateVisibility();
      updateChrome();
      updateAmbientGlow();
      updateMediaDisc();
      scheduleTabsRender();
      return;
    }
    if (activeTabId === id) setActiveTab(tabs[Math.max(0, removeIndex - 1)].id);
    updateAmbientGlow();
    updateMediaDisc();
    scheduleTabsRender();
  }, 180);
}

function moveTab(dragId, targetId) {
  if (!dragId || !targetId || dragId === targetId) return;
  const fromIndex = tabs.findIndex((tab) => tab.id === dragId);
  const toIndex = tabs.findIndex((tab) => tab.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return;
  const [tab] = tabs.splice(fromIndex, 1);
  tabs.splice(toIndex, 0, tab);
  renderTabs();
}

function detachTab(id) {
  const tab = tabs.find((item) => item.id === id);
  if (!tab) return;
  window.faibilo.newBrowserWindow(isHomeUrl(tab.url) ? webviewUrl(HOME_URL) : tab.url);
  closeTab(id);
}

let tabsContainerBound = false;
function bindTabsContainerEvents() {
  if (tabsContainerBound) return;
  tabsContainerBound = true;

  tabsEl.addEventListener('click', (event) => {
    const closeBtn = event.target.closest('.tab-close');
    const tabBtn = event.target.closest('.tab');
    if (!tabBtn) return;
    const tabId = tabBtn.dataset.tabId;
    if (closeBtn) {
      event.stopPropagation();
      closeTab(tabId);
    } else {
      setActiveTab(tabId);
    }
  });

  tabsEl.addEventListener('dragstart', (event) => {
    const tabBtn = event.target.closest('.tab');
    if (!tabBtn) return;
    draggedTabId = tabBtn.dataset.tabId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedTabId);
    tabBtn.classList.add('dragging');
  });

  tabsEl.addEventListener('dragend', (event) => {
    const tabBtn = event.target.closest('.tab');
    if (tabBtn) tabBtn.classList.remove('dragging');
    if (draggedTabId && event.clientY > 120) detachTab(draggedTabId);
    draggedTabId = null;
  });

  tabsEl.addEventListener('dragover', (event) => {
    event.preventDefault();
    const tabBtn = event.target.closest('.tab');
    if (tabBtn) tabBtn.classList.add('drag-over');
  });

  tabsEl.addEventListener('dragleave', (event) => {
    const tabBtn = event.target.closest('.tab');
    if (tabBtn) tabBtn.classList.remove('drag-over');
  });

  tabsEl.addEventListener('drop', (event) => {
    event.preventDefault();
    const tabBtn = event.target.closest('.tab');
    if (tabBtn) {
      tabBtn.classList.remove('drag-over');
      const fromId = event.dataTransfer.getData('text/plain') || draggedTabId;
      moveTab(fromId, tabBtn.dataset.tabId);
    }
  });
}

function renderTabs() {
  tabsRenderQueued = false;
  const existingButtons = Array.from(tabsEl.querySelectorAll('.tab'));
  const existingMap = new Map();
  existingButtons.forEach((el) => existingMap.set(el.dataset.tabId, el));

  tabs.forEach((tab, index) => {
    const isTabPlaying = Boolean(tab.media && tab.media.playing);
    let button = existingMap.get(tab.id);

    if (!button) {
      button = document.createElement('button');
      button.className = 'tab';
      button.draggable = !tab.special;
      button.dataset.tabId = tab.id;
      button.innerHTML = `
        <span class="tab-icon"></span>
        <span class="tab-title"></span>
        <span class="tab-media-indicator-slot"></span>
        <span class="tab-close" title="Close">${icon('x')}</span>
      `;
      const refChild = tabsEl.children[index] || null;
      tabsEl.insertBefore(button, refChild);
    } else {
      existingMap.delete(tab.id);
      if (tabsEl.children[index] !== button) {
        tabsEl.insertBefore(button, tabsEl.children[index] || null);
      }
    }

    const targetClass = `tab ${tab.id === activeTabId ? 'active' : ''} ${tab.loading ? 'loading' : ''} ${tab.closing ? 'closing' : ''} ${isTabPlaying ? 'media-playing' : ''} ${tab.isSleeping ? 'is-sleeping' : ''}`.replace(/\s+/g, ' ').trim();
    if (button.className !== targetClass) {
      button.className = targetClass;
    }
    
    const fullTitle = tab.media ? `${tab.title} (${tab.media.playing ? 'Playing' : 'Paused'}: ${tab.media.title})` : tab.title;
    if (button.title !== fullTitle) button.title = fullTitle;

    const titleEl = button.querySelector('.tab-title');
    if (titleEl && titleEl.textContent !== tab.title) {
      titleEl.textContent = tab.title;
    }

    const iconKey = tab.favicon || tab.icon || (tab.loading ? 'loading' : 'globe');
    const iconEl = button.querySelector('.tab-icon');
    if (iconEl && iconEl.dataset.renderedIcon !== iconKey) {
      const tabIcon = tab.special ? icon(tab.icon) : tab.favicon ? `<img src="${tab.favicon}" alt="">` : icon(tab.loading ? 'rotate-cw' : 'globe');
      iconEl.innerHTML = tabIcon;
      iconEl.dataset.renderedIcon = iconKey;
    }

    const mediaSlot = button.querySelector('.tab-media-indicator-slot');
    if (mediaSlot) {
      const mediaKey = tab.media ? `${tab.media.playing ? 'p' : 's'}-${tab.media.title}` : '';
      if (mediaSlot.dataset.mediaKey !== mediaKey) {
        mediaSlot.dataset.mediaKey = mediaKey;
        if (tab.media) {
          const mediaTitleEsc = escapeHtml(tab.media.title);
          if (tab.media.playing) {
            mediaSlot.innerHTML = `
              <span class="tab-media-indicator playing" title="Playing: ${mediaTitleEsc}">
                <svg class="speaker-icon animate-waves" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path class="wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path class="wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </span>
            `;
          } else {
            mediaSlot.innerHTML = `
              <span class="tab-media-indicator paused" title="Paused: ${mediaTitleEsc}">
                <svg class="speaker-icon muted" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="22" y1="9" x2="16" y2="15"></line>
                  <line x1="16" y1="9" x2="22" y2="15"></line>
                </svg>
              </span>
            `;
          }
        } else {
          mediaSlot.innerHTML = '';
        }
      }
    }
  });

  existingMap.forEach((el) => el.remove());
  requestAnimationFrame(updateTabsOverflow);
}

function scheduleTabsRender() {
  if (tabsRenderQueued) return;
  tabsRenderQueued = true;
  requestAnimationFrame(renderTabs);
}

function updateTabsOverflow() {
  const availableWidth = tabsEl.clientWidth;
  const tabButtons = Array.from(tabsEl.querySelectorAll('.tab'));
  let usedWidth = 0;
  hiddenTabIds = [];

  tabButtons.forEach((button) => {
    const tabId = button.dataset.tabId;
    const gap = usedWidth ? 5 : 0;
    usedWidth += button.offsetWidth + gap;
    const isHidden = usedWidth > availableWidth;
    button.classList.toggle('overflowed', isHidden);
    if (isHidden) hiddenTabIds.push(tabId);
  });

  tabsOverflowButton.classList.toggle('hidden', !hiddenTabIds.length);
  if (!hiddenTabIds.length) tabsMenu.classList.add('hidden');
  renderTabsMenu();
}

function renderTabsMenu() {
  tabsMenuList.innerHTML = '';
  const hiddenTabs = tabs.filter((tab) => hiddenTabIds.includes(tab.id));
  if (!hiddenTabs.length) {
    tabsMenuList.textContent = 'No hidden tabs.';
    tabsMenuList.classList.add('empty-list');
    return;
  }
  tabsMenuList.classList.remove('empty-list');
  hiddenTabs.forEach((tab) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `tabs-menu-row ${tab.id === activeTabId ? 'active' : ''}`;
    row.innerHTML = `
      <span class="tab-icon">${tab.special ? icon(tab.icon) : tab.favicon ? `<img src="${tab.favicon}" alt="">` : icon(tab.loading ? 'rotate-cw' : 'globe')}</span>
      <span>${escapeHtml(tab.title)}</span>
      <small>${escapeHtml(displayUrl(tab.url) || 'Faibilo')}</small>
    `;
    row.addEventListener('click', () => {
      setActiveTab(tab.id);
      tabsMenu.classList.add('hidden');
    });
    tabsMenuList.appendChild(row);
  });
}

function setIcon(element, name) {
  if (element.dataset.icon === name && element.innerHTML) return;
  element.dataset.icon = name;
  element.innerHTML = icon(name);
}

function updateChrome() {
  const tab = activeTab();
  if (!tab) {
    address.value = '';
    setIcon(security, 'search');
    setIcon(reloadButton, 'rotate-cw');
    $('#back').disabled = true;
    $('#forward').disabled = true;
    setIcon(bookmarkButton, 'star');
    bookmarkButton.classList.remove('active');
    closeOmniboxSuggestions();
    updateEmptyStateVisibility();
    return;
  }
  updateEmptyStateVisibility();
  if (tab.special === 'settings') {
    address.value = '';
    setIcon(security, 'settings');
    setIcon(reloadButton, 'rotate-cw');
    $('#back').disabled = true;
    $('#forward').disabled = true;
    setIcon(bookmarkButton, 'star');
    bookmarkButton.classList.remove('active');
    closeOmniboxSuggestions();
    return;
  }
  address.value = displayUrl(tab.url);
  setIcon(security, tab.loadError ? 'x-circle' : tab.url.startsWith('https://') ? 'lock' : tab.url.startsWith('file://') ? 'file-text' : isHomeUrl(tab.url) ? 'search' : 'shield-alert');
  setIcon(reloadButton, tab.loading ? 'x' : 'rotate-cw');
  $('#back').disabled = !tab.canGoBack;
  $('#forward').disabled = !tab.canGoForward;
  const bookmarked = isBookmarked(tab.url);
  setIcon(bookmarkButton, bookmarked ? 'star-fill' : 'star');
  bookmarkButton.classList.toggle('active', bookmarked);
  // Close suggestions when navigating
  if (document.activeElement !== address) closeOmniboxSuggestions();
}

function addHistory(tab) {
  if (IS_INCOGNITO || !settings.saveHistory || !tab.url.startsWith('http')) return;
  historyItems = [
    { title: tab.title, url: tab.url, visitedAt: Date.now() },
    ...historyItems.filter((item) => item.url !== tab.url)
  ].slice(0, 120);
  queueStore(STORAGE_KEYS.history, historyItems);
  scheduleLibraryRender();
}

function isBookmarked(url) {
  return bookmarks.some((item) => item.url === url);
}

function toggleBookmark() {
  const tab = activeTab();
  if (!tab || !tab.url.startsWith('http')) return;
  if (isBookmarked(tab.url)) {
    bookmarks = bookmarks.filter((item) => item.url !== tab.url);
  } else {
    bookmarks.unshift({ title: tab.title, url: tab.url, createdAt: Date.now() });
  }
  writeStore(STORAGE_KEYS.bookmarks, bookmarks);
  scheduleLibraryRender();
  updateChrome();
}

function toggleBookmarksMenu() {
  renderBookmarksMenu();
  bookmarksPopover.classList.toggle('hidden');
}

function renderBookmarksMenu() {
  const tab = activeTab();
  const currentButton = $('#bookmarkCurrent');
  currentButton.textContent = tab?.url?.startsWith('http') && isBookmarked(tab.url) ? 'Remove current page' : 'Add current page';
  renderList($('#bookmarksMenuList'), bookmarks, 'No bookmarks yet.', true, true);
}

function favoriteIconUrl(url) {
  try {
    return `${new URL(url).origin}/favicon.ico`;
  } catch {
    return '';
  }
}

function setFavoriteImageFallback(image) {
  image.addEventListener('error', () => {
    const fallback = document.createElement('span');
    fallback.className = 'favorite-letter';
    fallback.textContent = image.alt.trim().charAt(0).toUpperCase() || 'F';
    image.replaceWith(fallback);
  }, { once: true });
}

let currentSidedAppUrl = null;

function updateActiveSidedAppIndicator() {
  document.querySelectorAll('.favorite-app').forEach((item) => {
    const isThisApp = currentSidedAppUrl && item.dataset.url === currentSidedAppUrl;
    item.classList.toggle('is-sided-active', Boolean(isThisApp));
  });
}

function restoreDefaultApps() {
  favoriteApps = [...DEFAULT_FAVORITE_APPS];
  writeStore(STORAGE_KEYS.favorites, favoriteApps);
  renderFavorites();
  refreshHomeTabs();
  renderFavoriteSuggestions();
}

function renderFavorites() {
  const container = $('#favoritesList');
  container.innerHTML = '';
  if (!favoriteApps.length) {
    container.innerHTML = `
      <div class="empty-favorites-prompt">
        <button type="button" class="sidebar-restore-defaults-btn" id="sidebarRestoreDefaultsBtn" title="Restore default apps">
          <span class="icon-slot" data-icon="rotate-cw"></span>
          <span>Defaults</span>
        </button>
      </div>
    `;
    container.classList.add('empty-list');
    container.querySelector('#sidebarRestoreDefaultsBtn')?.addEventListener('click', () => {
      restoreDefaultApps();
    });
    paintStaticIcons(container);
    return;
  }
  container.classList.remove('empty-list');
  favoriteApps.forEach((app) => {
    const item = document.createElement('div');
    item.className = 'favorite-app';
    item.dataset.url = app.url;
    if (currentSidedAppUrl && app.url === currentSidedAppUrl) {
      item.classList.add('is-sided-active');
    }
    item.innerHTML = `
      <button type="button" class="favorite-launch" title="${escapeHtml(app.name)} (Left-click: open tab • Right-click: open sided)" aria-label="${escapeHtml(app.name)}">
        <span class="favorite-icon"><img src="${favoriteIconUrl(app.url)}" alt="${escapeHtml(app.name)}"></span>
        <span class="app-active-pill" aria-hidden="true"></span>
      </button>
      <button type="button" class="favorite-remove icon-button" title="Remove ${escapeHtml(app.name)}" aria-label="Remove ${escapeHtml(app.name)}">${icon('x')}</button>
    `;
    const image = item.querySelector('img');
    setFavoriteImageFallback(image);
    const launchButton = item.querySelector('.favorite-launch');
    launchButton.addEventListener('click', () => createTab(app.url));
    launchButton.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      openSideWebPanel(app.name, app.url);
    });
    item.querySelector('.favorite-remove').addEventListener('click', () => {
      favoriteApps = favoriteApps.filter((favorite) => favorite.id !== app.id);
      writeStore(STORAGE_KEYS.favorites, favoriteApps);
      renderFavorites();
      refreshHomeTabs();
    });
    container.appendChild(item);
  });
}

let sideWebview = null;

function openSideWebPanel(name, url) {
  currentSidedAppUrl = url;
  const panel = $('#sideWebPanel');
  const title = $('#sideWebPanelTitle');
  const body = $('#sideWebPanelBody');
  const closeBtn = $('#closeSideWebPanelButton');

  title.textContent = name;

  body.innerHTML = '';
  if (sideWebview) {
    try {
      sideWebview.remove();
    } catch (e) {}
    sideWebview = null;
  }

  sideWebview = document.createElement('webview');
  sideWebview.className = 'side-webview';
  sideWebview.setAttribute('allowpopups', 'true');
  sideWebview.setAttribute('allow', 'display-capture *; camera *; microphone *; geolocation *; clipboard-read *; clipboard-write *; screen-wake-lock *; autoplay *');
  sideWebview.setAttribute('allowfullscreen', 'true');
  sideWebview.setAttribute('partition', IS_INCOGNITO ? 'incognito' : 'persist:faibilo');
  sideWebview.setAttribute('webpreferences', webviewPreferences());
  sideWebview.setAttribute('preload', window.faibilo.webviewPreloadPath);
  if (window.faibilo.cleanUserAgent) {
    sideWebview.setAttribute('useragent', window.faibilo.cleanUserAgent);
  }
  sideWebview.src = webviewUrl(url);
  sideWebview.addEventListener('will-navigate', (e) => {
    if (isExternalAppUrl(e.url)) {
      e.preventDefault?.();
      let origin = '';
      try { origin = new URL(url).origin; } catch {}
      window.faibilo.requestAppRedirect?.(e.url, origin);
    }
  });
  sideWebview.addEventListener('new-window', (e) => {
    if (isExternalAppUrl(e.url)) {
      e.preventDefault?.();
      let origin = '';
      try { origin = new URL(url).origin; } catch {}
      window.faibilo.requestAppRedirect?.(e.url, origin);
    }
  });
  sideWebview.addEventListener('permissionrequest', (e) => {
    handleWebviewPermissionRequest({ webview: sideWebview, url }, e);
  });

  body.appendChild(sideWebview);

  panel.classList.remove('hidden');
  requestAnimationFrame(() => {
    panel.classList.add('open');
  });
  closeBtn.classList.remove('hidden');

  updateActiveSidedAppIndicator();
  paintStaticIcons(panel);
  paintStaticIcons(closeBtn);
}

function closeSideWebPanel() {
  currentSidedAppUrl = null;
  const panel = $('#sideWebPanel');
  const closeBtn = $('#closeSideWebPanelButton');

  panel.classList.remove('open');
  closeBtn.classList.add('hidden');
  updateActiveSidedAppIndicator();

  setTimeout(() => {
    if (!panel.classList.contains('open')) {
      panel.classList.add('hidden');
      const body = $('#sideWebPanelBody');
      body.innerHTML = '';
      if (sideWebview) {
        try {
          sideWebview.remove();
        } catch (e) {}
        sideWebview = null;
      }
    }
  }, 250);
}

// Bind split panel actions
$('#sideWebPanelOpenTab')?.addEventListener('click', () => {
  if (sideWebview && sideWebview.src) {
    createTab(sideWebview.src);
    closeSideWebPanel();
  }
});
$('#sideWebPanelReload').addEventListener('click', () => {
  if (sideWebview) sideWebview.reload();
});
$('#sideWebPanelClose').addEventListener('click', closeSideWebPanel);
$('#closeSideWebPanelButton').addEventListener('click', closeSideWebPanel);

// --- Draggable Resize Handler for Side Web Panel ---
let isResizingSidePanel = false;
let startWidth = 0;
let startX = 0;

const resizeHandle = $('#sideWebPanelResizeHandle');
const sidePanelEl = $('#sideWebPanel');

resizeHandle.addEventListener('mousedown', (event) => {
  isResizingSidePanel = true;
  startX = event.clientX;
  startWidth = parseInt(document.defaultView.getComputedStyle(sidePanelEl).width, 10);
  resizeHandle.classList.add('resizing');
  
  if (sideWebview) {
    sideWebview.style.pointerEvents = 'none';
  }
  
  document.addEventListener('mousemove', handleSidePanelResize);
  document.addEventListener('mouseup', stopSidePanelResize);
  event.preventDefault();
});

function handleSidePanelResize(event) {
  if (!isResizingSidePanel) return;
  const dx = event.clientX - startX;
  let newWidth = startWidth + dx;
  
  const maxWidth = window.innerWidth * 0.8;
  if (newWidth < 250) newWidth = 250;
  if (newWidth > maxWidth) newWidth = maxWidth;
  
  sidePanelEl.style.width = `${newWidth}px`;
}

function stopSidePanelResize() {
  isResizingSidePanel = false;
  resizeHandle.classList.remove('resizing');
  
  if (sideWebview) {
    sideWebview.style.pointerEvents = 'auto';
  }
  
  document.removeEventListener('mousemove', handleSidePanelResize);
  document.removeEventListener('mouseup', stopSidePanelResize);
}

function renderFavoriteSuggestions() {
  const grid = $('#favoriteSuggestionsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  DEFAULT_FAVORITE_APPS.forEach((app) => {
    const isAdded = favoriteApps.some((fav) => fav.url === app.url);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `favorite-suggestion-chip ${isAdded ? 'is-added' : ''}`;
    chip.title = isAdded ? `${app.name} is in your sidebar` : `Add ${app.name} to sidebar`;
    chip.innerHTML = `
      <span class="suggestion-chip-icon"><img src="${favoriteIconUrl(app.url)}" alt="${escapeHtml(app.name)}"></span>
      <span class="suggestion-chip-name">${escapeHtml(app.name)}</span>
      <span class="suggestion-chip-action">${isAdded ? icon('check') : icon('plus')}</span>
    `;
    const img = chip.querySelector('img');
    setFavoriteImageFallback(img);

    chip.addEventListener('click', () => {
      if (isAdded) {
        $('#favoriteName').value = app.name;
        $('#favoriteUrl').value = app.url;
        updateFavoritePreview();
        return;
      }
      favoriteApps.push({
        id: `favorite-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: app.name,
        url: app.url,
        builtIn: true
      });
      writeStore(STORAGE_KEYS.favorites, favoriteApps);
      renderFavorites();
      refreshHomeTabs();
      renderFavoriteSuggestions();
      updateActiveSidedAppIndicator();
    });

    grid.appendChild(chip);
  });
}

function showFavoriteModal() {
  $('#favoriteForm').reset();
  $('#favoriteError').classList.add('hidden');
  $('#favoritePreview').innerHTML = icon('globe');
  renderFavoriteSuggestions();
  $('#favoriteModal').classList.remove('hidden');
  requestAnimationFrame(() => $('#favoriteName').focus());
}

function hideFavoriteModal() {
  $('#favoriteModal').classList.add('hidden');
}

function updateFavoritePreview() {
  const rawUrl = $('#favoriteUrl').value.trim();
  if (!rawUrl) {
    $('#favoritePreview').innerHTML = icon('globe');
    return;
  }
  const url = normalizeInput(rawUrl);
  const name = $('#favoriteName').value.trim() || 'App';
  $('#favoritePreview').innerHTML = `<img src="${favoriteIconUrl(url)}" alt="${escapeHtml(name)}">`;
  setFavoriteImageFallback($('#favoritePreview img'));
}

function updateSidebarVisibility() {
  sidePanel.classList.remove('hidden');
  if (settings.showSidebar) {
    sidePanel.classList.add('open');
  } else {
    sidePanel.classList.remove('open');
  }
}

let sidebarHoverBound = false;
function bindSidebarHover() {
  if (sidebarHoverBound) return;
  sidebarHoverBound = true;

  const trigger = $('#sidePanelTrigger');
  if (trigger) {
    trigger.addEventListener('mouseenter', () => {
      sidePanel.classList.add('hover-active');
    });
  }

  sidePanel.addEventListener('mouseleave', () => {
    sidePanel.classList.remove('hover-active');
  });
}

function renderHistoryList() {
  const container = $('#historyList');
  container.innerHTML = '';
  if (!historyItems.length) {
    container.textContent = 'No history yet.';
    container.classList.add('empty-list');
    return;
  }
  container.classList.remove('empty-list');
  historyItems.slice(0, 30).forEach((item) => {
    const row = document.createElement('div');
    row.className = 'panel-row panel-row-removable';
    row.innerHTML = `
      <button class="row-main" type="button">
        <span>${escapeHtml(item.title || item.url)}</span>
        <small>${escapeHtml(item.url)}</small>
      </button>
      <button class="row-remove icon-button" type="button" title="Remove from history" aria-label="Remove from history">${icon('x')}</button>
    `;
    row.querySelector('.row-main').addEventListener('click', () => createTab(item.url));
    row.querySelector('.row-remove').addEventListener('click', (event) => {
      event.stopPropagation();
      historyItems = historyItems.filter((entry) => entry.url !== item.url);
      writeStore(STORAGE_KEYS.history, historyItems);
      refreshHomeTabs();
      scheduleLibraryRender();
    });
    container.appendChild(row);
  });
}

function renderLibrary() {
  libraryRenderQueued = false;
  renderHistoryList();
  renderDownloads();
}

async function renderPermissions() {
  const container = $('#permissionsList');
  rememberedPermissions = await window.faibilo.listPermissions();
  container.innerHTML = '';
  if (!rememberedPermissions.length) {
    container.textContent = IS_INCOGNITO
      ? 'No temporary site permissions granted in this private session.'
      : 'No remembered site permissions yet.';
    container.classList.add('empty-list');
    return;
  }
  container.classList.remove('empty-list');
  rememberedPermissions.forEach((permission) => {
    const row = document.createElement('div');
    row.className = 'permission-row';
    row.innerHTML = `
      <div class="permission-row-main">
        <strong>${escapeHtml(permission.origin)}</strong>
        <span>${escapeHtml(permission.label || permission.permission)} - ${permission.allowed ? 'Allowed' : 'Blocked'}${IS_INCOGNITO ? ' (Private session only)' : ''}</span>
      </div>
      <button class="row-remove icon-button" title="Forget permission" aria-label="Forget permission">${icon('x')}</button>
    `;
    row.querySelector('button').addEventListener('click', async () => {
      rememberedPermissions = await window.faibilo.forgetPermission(permission.key);
      renderPermissions();
    });
    container.appendChild(row);
  });
}

function scheduleLibraryRender() {
  if (libraryRenderQueued) return;
  libraryRenderQueued = true;
  requestAnimationFrame(renderLibrary);
}

function renderList(container, items, emptyText, removable = false, useBookmarkSetting = false) {
  container.innerHTML = '';
  if (!items.length) {
    container.textContent = emptyText;
    container.classList.add('empty-list');
    return;
  }
  container.classList.remove('empty-list');
  items.slice(0, 30).forEach((item) => {
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.innerHTML = `
      <button class="row-main">
        <span>${escapeHtml(item.title || item.url)}</span>
        <small>${escapeHtml(item.url)}</small>
      </button>
      ${removable ? `<button class="row-remove icon-button" title="Remove">${icon('x')}</button>` : ''}
    `;
    row.querySelector('.row-main').addEventListener('click', () => {
      if (useBookmarkSetting && !settings.bookmarksNewTab) navigateTab(activeTab(), item.url);
      else createTab(item.url);
      bookmarksPopover.classList.add('hidden');
    });
    row.querySelector('.row-remove')?.addEventListener('click', () => {
      bookmarks = bookmarks.filter((bookmark) => bookmark.url !== item.url);
      writeStore(STORAGE_KEYS.bookmarks, bookmarks);
      scheduleLibraryRender();
      renderBookmarksMenu();
      updateChrome();
    });
    container.appendChild(row);
  });
}

function renderDownloads() {
  const container = $('#downloadsList');
  container.innerHTML = '';
  if (!downloads.length) {
    container.textContent = 'Downloads will appear here.';
    container.classList.add('empty-list');
    return;
  }
  container.classList.remove('empty-list');
  downloads.slice(0, 20).forEach((item) => {
    const total = item.totalBytes || 0;
    const pct = total ? Math.round((item.receivedBytes / total) * 100) : 0;
    const done = item.state === 'completed';
    const failed = item.state === 'interrupted' || item.state === 'cancelled';
    const inProgress = !done && !failed;
    const barWidth = Math.min(100, pct || (done ? 100 : (failed ? 100 : 8)));
    const stateLabel = done ? 'Complete — click to open' : failed ? item.state : pct ? `${pct}%` : 'Starting…';

    const row = document.createElement('div');
    row.className = `download-row ${done ? 'done' : ''} ${failed ? 'failed' : ''} ${inProgress ? 'in-progress' : ''}`;
    row.title = done ? 'Click to show in folder' : inProgress ? 'Downloading — will open when done' : '';
    row.innerHTML = `
      <div class="download-row-info">
        <strong class="download-name">${escapeHtml(item.filename || 'Download')}</strong>
        <span class="download-state">${escapeHtml(stateLabel)}</span>
      </div>
      <div class="meter"><span style="width:${barWidth}%"></span></div>
      <div class="download-row-tip">Will open in folder when download completes</div>
    `;

    row.addEventListener('click', () => {
      if (done && item.savePath) {
        window.faibilo.showItemInFolder(item.savePath);
      } else if (inProgress) {
        // Show tip then auto-hide
        row.classList.add('show-tip');
        setTimeout(() => row.classList.remove('show-tip'), 2800);
      }
    });

    container.appendChild(row);
  });
}

function updateDownload(item) {
  const isNew = !downloads.some((d) => d.id === item.id);
  downloads = [item, ...downloads.filter((download) => download.id !== item.id)].slice(0, 40);
  if (!IS_INCOGNITO) {
    queueStore(STORAGE_KEYS.downloads, downloads);
  }
  renderDownloads();
  if (isNew) {
    showDownloadToast(item);
  } else {
    updateToast(item);
  }
}

/* ── Download toast notification ── */
const activeToasts = new Map(); // id → { el, barEl, stateEl }

function showDownloadToast(item) {
  const container = getOrCreateToastContainer();
  const toast = document.createElement('div');
  toast.className = 'dl-toast dl-toast-enter';
  toast.dataset.downloadId = item.id;

  const name = escapeHtml(item.filename || 'Download');
  toast.innerHTML = `
    <div class="dl-toast-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 15V3"/><path d="m19 9-7 7-7-7"/><rect x="3" y="19" width="18" height="2" rx="1"/>
      </svg>
    </div>
    <div class="dl-toast-body">
      <div class="dl-toast-name">${name}</div>
      <div class="dl-toast-state">Starting download…</div>
      <div class="dl-toast-bar-wrap"><div class="dl-toast-bar"></div></div>
    </div>
    <div class="dl-toast-actions">
      <button class="dl-toast-folder" title="Show in folder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      <button class="dl-toast-close" title="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;

  const barEl   = toast.querySelector('.dl-toast-bar');
  const stateEl = toast.querySelector('.dl-toast-state');
  const folderBtn = toast.querySelector('.dl-toast-folder');
  const closeBtn  = toast.querySelector('.dl-toast-close');

  folderBtn.addEventListener('click', () => {
    const current = downloads.find((d) => d.id === item.id);
    const p = current?.savePath || item.savePath;
    if (p) window.faibilo.showItemInFolder(p);
  });

  closeBtn.addEventListener('click', () => dismissToast(item.id));

  container.appendChild(toast);
  // Force reflow then remove enter class to trigger CSS transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.remove('dl-toast-enter'));
  });

  activeToasts.set(item.id, { el: toast, barEl, stateEl, savePath: item.savePath });
  updateToast(item);
}

function updateToast(item) {
  const entry = activeToasts.get(item.id);
  if (!entry) return;

  const { barEl, stateEl, el } = entry;
  const total = item.totalBytes || 0;
  const pct   = total ? Math.round((item.receivedBytes / total) * 100) : 0;
  const done  = item.state === 'completed';
  const failed = item.state === 'interrupted' || item.state === 'cancelled';

  barEl.style.width = `${Math.min(100, pct || (done ? 100 : (failed ? 100 : 6)))}%`;

  if (done) {
    stateEl.textContent = 'Download complete';
    el.classList.add('dl-toast-done');
    barEl.parentElement.classList.add('done');
    if (item.savePath) entry.savePath = item.savePath;
    // Auto-dismiss after 6 s
    setTimeout(() => dismissToast(item.id), 6000);
  } else if (failed) {
    stateEl.textContent = `Failed: ${item.state}`;
    el.classList.add('dl-toast-failed');
    setTimeout(() => dismissToast(item.id), 5000);
  } else {
    stateEl.textContent = pct ? `${pct}% of ${formatBytes(total)}` : 'Downloading…';
  }
}

function dismissToast(id) {
  const entry = activeToasts.get(id);
  if (!entry) return;
  entry.el.classList.add('dl-toast-exit');
  entry.el.addEventListener('transitionend', () => entry.el.remove(), { once: true });
  activeToasts.delete(id);
}

function getOrCreateToastContainer() {
  let c = document.getElementById('dlToastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'dlToastContainer';
    document.body.appendChild(c);
  }
  return c;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Omnibox search suggestions ── */
const omniboxSuggestionsEl = document.getElementById('omniboxSuggestions');
let omniboxActiveIndex = -1;
let omniboxSuggestionItems = [];
let omniboxDebounceTimer = null;

function buildSuggestions(query) {
  const q = query.trim().toLowerCase();
  const results = [];

  if (!q) {
    // Show recent history when empty/focused
    const recent = historyItems.slice(0, 6);
    if (recent.length) {
      results.push({ type: 'label', text: 'Recent' });
      recent.forEach((h) => results.push({ type: 'history', title: h.title, url: h.url }));
    }
    return results;
  }

  // History matches
  const historyMatches = historyItems
    .filter((h) => h.url?.toLowerCase().includes(q) || h.title?.toLowerCase().includes(q))
    .slice(0, 4);
  if (historyMatches.length) {
    results.push({ type: 'label', text: 'History' });
    historyMatches.forEach((h) => results.push({ type: 'history', title: h.title, url: h.url, query: q }));
  }

  // Bookmark matches
  const bookmarkMatches = bookmarks
    .filter((b) => b.url?.toLowerCase().includes(q) || b.title?.toLowerCase().includes(q))
    .slice(0, 3);
  if (bookmarkMatches.length) {
    results.push({ type: 'label', text: 'Bookmarks' });
    bookmarkMatches.forEach((b) => results.push({ type: 'bookmark', title: b.title, url: b.url, query: q }));
  }

  // Search suggestions (inline predictive based on query shape)
  const isUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(q) || /^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/i.test(q);
  if (!isUrl) {
    results.push({ type: 'label', text: `Search ${settings.searchEngine || 'Google'}` });
    // Primary suggestion = exact query
    results.push({ type: 'search', title: query.trim(), query: query.trim() });
    // Predictive completions based on common suffixes
    const completions = generateSearchCompletions(query.trim());
    completions.forEach((c) => results.push({ type: 'search', title: c, query: c }));
  }

  return results;
}

function generateSearchCompletions(base) {
  if (!base || base.length < 2) return [];
  // Generate lightweight completions without network calls
  const q = base.toLowerCase();
  const completions = [];
  // Common action suffixes
  const actions = ['how to', 'what is', 'best', 'vs', 'tutorial', 'download', 'review'];
  for (const action of actions) {
    if (!q.startsWith(action) && !q.endsWith(action)) {
      if (completions.length < 3) completions.push(`${base} ${action}`);
    }
  }
  return completions.slice(0, 2);
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  const before = escapeHtml(text.slice(0, idx));
  const match  = escapeHtml(text.slice(idx, idx + query.length));
  const after  = escapeHtml(text.slice(idx + query.length));
  return `${before}<mark>${match}</mark>${after}`;
}

function faviconUrl(url) {
  try { return `${new URL(url).origin}/favicon.ico`; } catch { return ''; }
}

function renderOmniboxSuggestions(items) {
  omniboxSuggestionsEl.innerHTML = '';
  omniboxSuggestionItems = [];
  omniboxActiveIndex = -1;

  if (!items.length) return;

  items.forEach((item) => {
    if (item.type === 'label') {
      const el = document.createElement('div');
      el.className = 'suggestion-section-label';
      el.textContent = item.text;
      omniboxSuggestionsEl.appendChild(el);
      return;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suggestion-item';

    let iconHtml = '';
    if (item.type === 'search') {
      iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
    } else if (item.type === 'history') {
      iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    } else if (item.type === 'bookmark') {
      iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`;
    }

    const title = item.type === 'search'
      ? highlightMatch(item.title, item.query)
      : highlightMatch(item.title || item.url, item.query);
    const subtitle = item.url ? `<div class="suggestion-item-url">${escapeHtml(item.url)}</div>` : '';

    const fillArrow = `<svg class="suggestion-item-fill" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    btn.innerHTML = `
      <div class="suggestion-item-icon">${iconHtml}</div>
      <div class="suggestion-item-text">
        <div class="suggestion-item-title">${title}</div>
        ${subtitle}
      </div>
      ${fillArrow}
    `;

    // Tab key fills the address bar without navigating
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault(); // prevent blur on address input
      if (item.type === 'search') {
        const url = `${searchUrl()}${encodeURIComponent(item.query)}`;
        address.value = item.query;
        closeOmniboxSuggestions();
        navigateTab(activeTab(), url);
      } else {
        address.value = item.url;
        closeOmniboxSuggestions();
        navigateTab(activeTab(), item.url);
      }
    });

    omniboxSuggestionsEl.appendChild(btn);
    omniboxSuggestionItems.push(btn);
  });
}

function updateOmniboxSuggestions(query) {
  clearTimeout(omniboxDebounceTimer);
  omniboxDebounceTimer = setTimeout(() => {
    const items = buildSuggestions(query);
    renderOmniboxSuggestions(items);
  }, 60);
}

function closeOmniboxSuggestions() {
  omniboxSuggestionsEl.innerHTML = '';
  omniboxSuggestionItems = [];
  omniboxActiveIndex = -1;
}

function handleOmniboxKeyNav(e) {
  const count = omniboxSuggestionItems.length;
  if (!count) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    omniboxActiveIndex = (omniboxActiveIndex + 1) % count;
    highlightSuggestion(omniboxActiveIndex);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    omniboxActiveIndex = (omniboxActiveIndex - 1 + count) % count;
    highlightSuggestion(omniboxActiveIndex);
  } else if (e.key === 'Escape') {
    closeOmniboxSuggestions();
  } else if (e.key === 'Tab' && omniboxActiveIndex >= 0) {
    e.preventDefault();
    omniboxSuggestionItems[omniboxActiveIndex]?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  }
}

function highlightSuggestion(index) {
  omniboxSuggestionItems.forEach((el, i) => el.classList.toggle('active', i === index));
  omniboxSuggestionItems[index]?.scrollIntoView({ block: 'nearest' });
}

function setZoom(delta) {
  const tab = activeTab();
  if (!tab) return;
  tab.zoom = Math.min(3, Math.max(0.25, Number((tab.zoom + delta).toFixed(2))));
  tab.webview.setZoomFactor(tab.zoom);
}

function resetZoom() {
  const tab = activeTab();
  if (!tab) return;
  tab.zoom = 1;
  tab.webview.setZoomFactor(1);
}

function showFindbar() {
  findbar.classList.remove('hidden');
  findText.focus();
  findText.select();
}

function runBrowserCommand(command) {
  if (command === 'new-tab') createTab(newTabUrl());
  if (command === 'close-tab') closeTab(activeTabId);
  if (command === 'find') showFindbar();
  if (command === 'zoom-in') {
    setZoom(0.1);
    updateZoomMenuLabel();
  }
  if (command === 'zoom-out') {
    setZoom(-0.1);
    updateZoomMenuLabel();
  }
  if (command === 'zoom-reset') {
    resetZoom();
    updateZoomMenuLabel();
  }
  if (command === 'go-back') activeTab()?.webview?.goBack();
  if (command === 'go-forward') activeTab()?.webview?.goForward();
  if (command === 'reload') {
    const tab = activeTab();
    if (tab?.webview) {
      if (tab.loading) tab.webview.stop();
      else tab.webview.reload();
    }
  }
  if (command === 'print') activeTab()?.webview?.print();
  if (command === 'save-page') {
    const tab = activeTab();
    if (tab?.webview) {
      try {
        const wcId = tab.webview.getWebContentsId();
        window.faibilo.savePage(wcId);
      } catch (e) {
        console.error("Webview not ready yet", e);
      }
    }
  }

  // Widget integration: open search/query from desktop widget.
  // ipcMain sends: { type: 'widget-search', query }
  if (command && typeof command === 'object' && command.type === 'widget-search') {
    const q = String(command.query ?? '').trim();
    if (!q) return;
    const url = normalizeInput(q);
    // Open in a new tab (safer than navigating current tab)
    createTab(url);
  }
}


function handleShortcutInput(input, event) {
  const key = (input?.key || event?.key || '').toLowerCase();
  if (key === 'f11') {
    event.preventDefault();
    window.faibilo.toggleFullscreen();
    return true;
  }
  if (key === 'escape' && document.body.classList.contains('fullscreen')) {
    event.preventDefault();
    window.faibilo.setFullscreen(false);
    return true;
  }
  if (key === 'f12') {
    event.preventDefault();
    const tab = activeTab();
    if (tab?.webview?.openDevTools) tab.webview.openDevTools();
    else window.faibilo.toggleDevTools();
    return true;
  }
  if (!input?.control && !input?.meta && !event?.ctrlKey && !event?.metaKey) return false;
  if (key === 'l') {
    event.preventDefault();
    address.focus();
    address.select();
    return true;
  }
  if (key === 't') {
    event.preventDefault();
    if (input?.shift || event?.shiftKey) {
      reopenClosedTab();
    } else {
      createTab(newTabUrl());
    }
    return true;
  }
  if (key === 'w') {
    event.preventDefault();
    closeTab(activeTabId);
    return true;
  }
  if (key === 'f') {
    event.preventDefault();
    showFindbar();
    return true;
  }
  if (key === '+' || key === '=') {
    event.preventDefault();
    setZoom(0.1);
    updateZoomMenuLabel();
    return true;
  }
  if (key === '-') {
    event.preventDefault();
    setZoom(-0.1);
    updateZoomMenuLabel();
    return true;
  }
  if (key === '0') {
    event.preventDefault();
    resetZoom();
    updateZoomMenuLabel();
    return true;
  }
  if (key === 'p') {
    event.preventDefault();
    activeTab()?.webview?.print();
    return true;
  }
  if (key === 's') {
    event.preventDefault();
    try {
      const wcId = activeTab()?.webview?.getWebContentsId();
      if (wcId) window.faibilo.savePage(wcId);
    } catch (e) {
      console.error(e);
    }
    return true;
  }
  if (key === 'r') {
    event.preventDefault();
    const tab = activeTab();
    if (tab?.webview) {
      if (input?.shift || event?.shiftKey) {
        tab.webview.reloadIgnoringCache();
      } else {
        tab.webview.reload();
      }
    }
    return true;
  }
  if (key === 'n') {
    event.preventDefault();
    if (input?.shift || event?.shiftKey) {
      window.faibilo.newBrowserWindow('', { isIncognito: true });
    } else {
      window.faibilo.newBrowserWindow('');
    }
    return true;
  }
  return false;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function showNextPermission() {
  if (activePermission || !permissionQueue.length) return;
  activePermission = permissionQueue.shift();
  $('#permissionOrigin').textContent = activePermission.origin;
  $('#permissionLabel').textContent = activePermission.label;
  $('#permissionIcon').innerHTML = icon(activePermission.icon);
  permissionModal.classList.remove('hidden');
  $('#permissionBlock').focus();
}

async function answerPermission(allowed) {
  if (!activePermission) return;
  const request = activePermission;
  activePermission = null;
  permissionModal.classList.add('hidden');
  try {
    await window.faibilo.respondToPermission(request.requestId, allowed);
  } finally {
    showNextPermission();
  }
}

function cancelPermission(requestId) {
  if (activePermission?.requestId === requestId) {
    activePermission = null;
    permissionModal.classList.add('hidden');
    showNextPermission();
    return;
  }
  permissionQueue = permissionQueue.filter((request) => request.requestId !== requestId);
}

function showNextScreenshare() {
  if (activeScreenshare || !screenshareQueue.length) return;
  activeScreenshare = screenshareQueue.shift();
  selectedScreenshareSourceId = null;
  if (screenshareShareBtn) screenshareShareBtn.disabled = true;
  if (screenshareAudioCheck) screenshareAudioCheck.checked = false;

  const screens = (activeScreenshare.sources || []).filter((s) => s.isScreen);
  const windows = (activeScreenshare.sources || []).filter((s) => !s.isScreen);

  if (screenshareCountScreens) screenshareCountScreens.textContent = screens.length;
  if (screenshareCountWindows) screenshareCountWindows.textContent = windows.length;

  const originEl = $('#screenshareOrigin');
  if (originEl) originEl.textContent = activeScreenshare.origin || 'This site';

  switchScreenshareTab(screens.length > 0 ? 'screens' : 'windows');
  screenshareModal?.classList.remove('hidden');
}

function switchScreenshareTab(tabName) {
  currentScreenshareTab = tabName;
  if (tabName === 'screens') {
    screenshareTabScreens?.classList.add('active');
    screenshareTabScreens?.setAttribute('aria-selected', 'true');
    screenshareTabWindows?.classList.remove('active');
    screenshareTabWindows?.setAttribute('aria-selected', 'false');
  } else {
    screenshareTabWindows?.classList.add('active');
    screenshareTabWindows?.setAttribute('aria-selected', 'true');
    screenshareTabScreens?.classList.remove('active');
    screenshareTabScreens?.setAttribute('aria-selected', 'false');
  }
  renderScreenshareGrid();
}

function renderScreenshareGrid() {
  if (!activeScreenshare || !screenshareGrid) return;
  const isScreens = currentScreenshareTab === 'screens';
  const list = (activeScreenshare.sources || []).filter((s) => isScreens ? s.isScreen : !s.isScreen);

  screenshareGrid.innerHTML = '';

  if (!list.length) {
    screenshareEmpty?.classList.remove('hidden');
    screenshareGrid.classList.add('hidden');
    selectedScreenshareSourceId = null;
    if (screenshareShareBtn) screenshareShareBtn.disabled = true;
    return;
  }

  screenshareEmpty?.classList.add('hidden');
  screenshareGrid.classList.remove('hidden');

  list.forEach((source) => {
    const card = document.createElement('div');
    card.className = `screenshare-card${source.id === selectedScreenshareSourceId ? ' selected' : ''}`;
    card.setAttribute('role', 'option');
    card.setAttribute('tabindex', '0');
    card.dataset.sourceId = source.id;

    const preview = document.createElement('div');
    preview.className = 'screenshare-card-preview';
    if (source.thumbnail) {
      const img = document.createElement('img');
      img.src = source.thumbnail;
      img.alt = source.name || 'Preview';
      img.draggable = false;
      preview.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'preview-placeholder';
      ph.innerHTML = icon(isScreens ? 'screen' : 'square');
      preview.appendChild(ph);
    }

    const meta = document.createElement('div');
    meta.className = 'screenshare-card-meta';

    if (source.appIcon) {
      const iconImg = document.createElement('img');
      iconImg.className = 'screenshare-card-icon';
      iconImg.src = source.appIcon;
      iconImg.alt = '';
      meta.appendChild(iconImg);
    } else {
      const iconPh = document.createElement('span');
      iconPh.className = 'screenshare-card-icon-placeholder';
      iconPh.innerHTML = icon(isScreens ? 'screen' : 'square');
      meta.appendChild(iconPh);
    }

    const title = document.createElement('span');
    title.className = 'screenshare-card-title';
    title.textContent = source.name || (isScreens ? 'Screen' : 'Window');
    title.title = source.name || '';
    meta.appendChild(title);

    card.appendChild(preview);
    card.appendChild(meta);

    card.addEventListener('click', () => {
      selectScreenshareSource(source.id);
    });

    card.addEventListener('dblclick', () => {
      selectScreenshareSource(source.id);
      answerScreenshare(true);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectScreenshareSource(source.id);
      }
    });

    screenshareGrid.appendChild(card);
  });

  const existsInList = list.some((s) => s.id === selectedScreenshareSourceId);
  if (!existsInList && list.length > 0) {
    selectScreenshareSource(list[0].id);
  } else if (!existsInList) {
    selectedScreenshareSourceId = null;
    if (screenshareShareBtn) screenshareShareBtn.disabled = true;
  }
}

function selectScreenshareSource(sourceId) {
  selectedScreenshareSourceId = sourceId;
  screenshareGrid?.querySelectorAll('.screenshare-card').forEach((card) => {
    const isSelected = card.dataset.sourceId === sourceId;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
  if (screenshareShareBtn) screenshareShareBtn.disabled = !selectedScreenshareSourceId;
}

async function answerScreenshare(allowed) {
  if (!activeScreenshare) return;
  const request = activeScreenshare;
  const chosenSourceId = allowed ? selectedScreenshareSourceId : null;
  const shareAudio = allowed ? Boolean(screenshareAudioCheck?.checked) : false;

  activeScreenshare = null;
  selectedScreenshareSourceId = null;
  screenshareModal?.classList.add('hidden');

  try {
    await window.faibilo.respondToScreenShare({
      requestId: request.requestId,
      allowed: Boolean(allowed && chosenSourceId),
      sourceId: chosenSourceId,
      audio: shareAudio
    });
  } catch (err) {
    console.error('Error sending screenshare response:', err);
  } finally {
    showNextScreenshare();
  }
}

function cancelScreenshare(requestId) {
  if (activeScreenshare?.requestId === requestId) {
    activeScreenshare = null;
    selectedScreenshareSourceId = null;
    screenshareModal?.classList.add('hidden');
    showNextScreenshare();
    return;
  }
  screenshareQueue = screenshareQueue.filter((req) => req.requestId !== requestId);
}

function showNextAppRedirect() {
  if (activeAppRedirect || !appRedirectQueue.length) return;
  activeAppRedirect = appRedirectQueue.shift();
  if (appRedirectAppName) appRedirectAppName.textContent = activeAppRedirect.appName || 'Application';
  if (appRedirectAppHighlight) appRedirectAppHighlight.textContent = activeAppRedirect.appName || 'application';
  if (appRedirectOrigin) appRedirectOrigin.textContent = activeAppRedirect.origin || 'This site';
  if (appRedirectUrlText) appRedirectUrlText.textContent = activeAppRedirect.url || '';
  if (appRedirectUrlBox) appRedirectUrlBox.title = activeAppRedirect.url || '';
  if (appRedirectRememberCheck) appRedirectRememberCheck.checked = false;
  appRedirectModal?.classList.remove('hidden');
  appRedirectOpenBtn?.focus();
}

async function answerAppRedirect(allowed) {
  if (!activeAppRedirect) return;
  const request = activeAppRedirect;
  const remember = Boolean(appRedirectRememberCheck?.checked);
  activeAppRedirect = null;
  appRedirectModal?.classList.add('hidden');
  try {
    await window.faibilo.respondToAppRedirect({
      requestId: request.requestId,
      allowed,
      remember
    });
  } catch (err) {
    console.error('Error answering app redirect:', err);
  } finally {
    showNextAppRedirect();
  }
}

function cancelAppRedirect(requestId) {
  if (activeAppRedirect?.requestId === requestId) {
    activeAppRedirect = null;
    appRedirectModal?.classList.add('hidden');
    showNextAppRedirect();
    return;
  }
  appRedirectQueue = appRedirectQueue.filter((req) => req.requestId !== requestId);
}

$('#omniboxForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const val = address.value.trim();
  closeOmniboxSuggestions();
  navigateTab(activeTab(), normalizeInput(val));
});

let addressSelectAllPending = true;
address.addEventListener('focus', () => {
  if (addressSelectAllPending) {
    address.select();
    addressSelectAllPending = false;
  }
  updateOmniboxSuggestions(address.value);
});
address.addEventListener('blur', () => {
  addressSelectAllPending = true;
  // Delay so clicks on suggestions register first
  setTimeout(closeOmniboxSuggestions, 160);
});
address.addEventListener('click', () => {
  if (document.activeElement === address) address.select();
});
address.addEventListener('input', () => {
  updateOmniboxSuggestions(address.value);
});
address.addEventListener('keydown', (e) => {
  handleOmniboxKeyNav(e);
});

$('#newTab').addEventListener('click', () => createTab(newTabUrl()));
tabsOverflowButton.addEventListener('click', () => {
  updateTabsOverflow();
  tabsMenu.classList.toggle('hidden');
});
$('#back').addEventListener('click', () => activeTab()?.webview?.goBack());
$('#forward').addEventListener('click', () => activeTab()?.webview?.goForward());
$('#reload').addEventListener('click', () => {
  const tab = activeTab();
  if (!tab?.webview) return;
  if (tab.loading) tab.webview.stop();
  else tab.webview.reload();
});
$('#home').addEventListener('click', () => navigateTab(activeTab(), HOME_URL));
$('#go').addEventListener('click', () => navigateTab(activeTab(), normalizeInput(address.value)));
bookmarkButton.addEventListener('click', toggleBookmarksMenu);
$('#sidePanelToggle').addEventListener('click', () => sidePanel.classList.toggle('open'));
$('#settingsButton').addEventListener('click', () => {
  if ($('#settingsButton').classList.contains('update-ready')) {
    openSettings('about');
  } else {
    openSettings();
  }
});
$('#settingsClose').addEventListener('click', () => closeTab(SETTINGS_TAB_ID));
$('#bookmarksClose').addEventListener('click', () => bookmarksPopover.classList.add('hidden'));
$('#bookmarkCurrent').addEventListener('click', () => {
  toggleBookmark();
  renderBookmarksMenu();
});

$('#find').addEventListener('click', showFindbar);
$('#findClose').addEventListener('click', () => {
  activeTab()?.webview.stopFindInPage('clearSelection');
  findbar.classList.add('hidden');
});
$('#findNext').addEventListener('click', () => activeTab()?.webview.findInPage(findText.value));
$('#findPrev').addEventListener('click', () => activeTab()?.webview.findInPage(findText.value, { forward: false }));
findText.addEventListener('input', () => activeTab()?.webview.findInPage(findText.value));

findText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    activeTab()?.webview.findInPage(findText.value, { forward: !e.shiftKey });
  } else if (e.key === 'Escape') {
    e.preventDefault();
    activeTab()?.webview.stopFindInPage('clearSelection');
    findbar.classList.add('hidden');
  }
});

function toggleMenuPopover() {
  menuPopover.classList.toggle('hidden');
  bookmarksPopover.classList.add('hidden');
  tabsMenu.classList.add('hidden');
}

menuButton.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleMenuPopover();
});

$('#menuNewTab').addEventListener('click', () => {
  createTab(newTabUrl());
  menuPopover.classList.add('hidden');
});

$('#menuNewWindow').addEventListener('click', () => {
  window.faibilo.newBrowserWindow('');
  menuPopover.classList.add('hidden');
});

$('#menuNewIncognito').addEventListener('click', () => {
  window.faibilo.newBrowserWindow('', { isIncognito: true });
  menuPopover.classList.add('hidden');
});

$('#menuFind').addEventListener('click', () => {
  showFindbar();
  menuPopover.classList.add('hidden');
});

$('#menuPrint').addEventListener('click', () => {
  activeTab()?.webview?.print();
  menuPopover.classList.add('hidden');
});

$('#menuSave').addEventListener('click', () => {
  const tab = activeTab();
  if (tab?.webview) {
    try {
      const wcId = tab.webview.getWebContentsId();
      window.faibilo.savePage(wcId);
    } catch (e) {
      console.error(e);
    }
  }
  menuPopover.classList.add('hidden');
});

$('#menuZoomIn').addEventListener('click', (e) => {
  e.stopPropagation();
  setZoom(0.1);
  updateZoomMenuLabel();
});

$('#menuZoomOut').addEventListener('click', (e) => {
  e.stopPropagation();
  setZoom(-0.1);
  updateZoomMenuLabel();
});

function updateZoomMenuLabel() {
  const tab = activeTab();
  if (tab) {
    menuZoomVal.textContent = `${Math.round((tab.zoom || 1) * 100)}%`;
  }
}

$('#menuFullscreen').addEventListener('click', () => {
  window.faibilo.toggleFullscreen();
  menuPopover.classList.add('hidden');
});

$('#menuSettings').addEventListener('click', () => {
  openSettings();
  menuPopover.classList.add('hidden');
});

// Fullscreen IPC event handler
window.faibilo.onFullscreen((isFullscreen) => {
  if (isFullscreen) {
    document.body.classList.add('fullscreen');
  } else {
    document.body.classList.remove('fullscreen');
  }
});

window.faibilo.onBackgroundMode((inBackground) => {
  browserInBackground = Boolean(inBackground);
  startAmbientSampler();
  if (!browserInBackground) refreshHomeTabs();
});

// Close popovers on click outside
document.addEventListener('click', (event) => {
  if (!event.target.closest('#menuButton') && !event.target.closest('#menuPopover')) {
    menuPopover.classList.add('hidden');
  }
  if (!event.target.closest('#bookmark') && !event.target.closest('#bookmarksPopover')) {
    bookmarksPopover.classList.add('hidden');
  }
  if (!event.target.closest('#tabsOverflow') && !event.target.closest('#tabsMenu')) {
    tabsMenu.classList.add('hidden');
  }
});

$('#minimize').addEventListener('click', () => window.faibilo.minimize());
$('#maximize').addEventListener('click', () => window.faibilo.maximize());
$('#close').addEventListener('click', () => window.faibilo.close());
$('#permissionBlock').addEventListener('click', () => answerPermission(false));
$('#permissionAllow').addEventListener('click', () => answerPermission(true));

mediaDisc.addEventListener('click', () => {
  if (currentMediaTabId) setActiveTab(currentMediaTabId);
});

window.faibilo.onBrowserCommand(runBrowserCommand);

window.faibilo.onMediaControl(async (action) => {
  if (!currentMediaTabId) return;
  const tab = tabs.find((t) => t.id === currentMediaTabId);
  if (!tab || !tab.webview) return;

  if (action === 'play-pause') {
    try {
      await tab.webview.executeJavaScript(TOGGLE_ACTIVE_MEDIA_JS, true);
      setTimeout(updateMediaDisc, 120);
    } catch (err) {
      console.error('Failed to play/pause media in webview:', err);
    }
  } else if (action === 'next') {
    try {
      await tab.webview.executeJavaScript(`
        (() => {
          const ytNext = document.querySelector('.ytp-next-button');
          if (ytNext) { ytNext.click(); return true; }
          const spotNext = document.querySelector('[data-testid="control-button-skip-forward"]');
          if (spotNext) { spotNext.click(); return true; }
          const genericNext = document.querySelector('[aria-label="Next"], [title="Next"], .next-button, .control-next');
          if (genericNext) { genericNext.click(); return true; }
          return false;
        })()
      `);
      setTimeout(updateMediaDisc, 500);
    } catch (err) {
      console.error('Failed to trigger next in webview:', err);
    }
  } else if (action === 'prev') {
    try {
      await tab.webview.executeJavaScript(`
        (() => {
          const ytPrev = document.querySelector('.ytp-prev-button');
          if (ytPrev) { ytPrev.click(); return true; }
          const spotPrev = document.querySelector('[data-testid="control-button-skip-back"]');
          if (spotPrev) { spotPrev.click(); return true; }
          const genericPrev = document.querySelector('[aria-label="Previous"], [title="Previous"], .previous-button, .control-prev, .prev-button');
          if (genericPrev) { genericPrev.click(); return true; }
          return false;
        })()
      `);
      setTimeout(updateMediaDisc, 500);
    } catch (err) {
      console.error('Failed to trigger prev in webview:', err);
    }
  } else if (action === 'go-to-tab') {
    setActiveTab(currentMediaTabId);
  }
});

window.faibilo.onMediaSettingsChange((enabled) => {
  persistSettings({ desktopMediaDisk: enabled });
  applySettingsToForm();
});

window.faibilo.onPermissionRequested((request) => {
  permissionQueue.push(request);
  showNextPermission();
});
window.faibilo.onPermissionCancelled(cancelPermission);

screenshareTabScreens?.addEventListener('click', () => switchScreenshareTab('screens'));
screenshareTabWindows?.addEventListener('click', () => switchScreenshareTab('windows'));
screenshareCancelBtn?.addEventListener('click', () => answerScreenshare(false));
screenshareShareBtn?.addEventListener('click', () => answerScreenshare(true));

window.faibilo.onScreenShareRequested?.((request) => {
  screenshareQueue.push(request);
  showNextScreenshare();
});
window.faibilo.onScreenShareCancelled?.(cancelScreenshare);

appRedirectCancelBtn?.addEventListener('click', () => answerAppRedirect(false));
appRedirectOpenBtn?.addEventListener('click', () => answerAppRedirect(true));

window.faibilo.onAppRedirectRequested?.((request) => {
  appRedirectQueue.push(request);
  showNextAppRedirect();
});
window.faibilo.onAppRedirectCancelled?.(cancelAppRedirect);

if (window.faibilo.onNotificationClicked) {
  window.faibilo.onNotificationClicked(({ guestId }) => {
    if (!guestId) return;
    const targetTab = tabs.find((t) => {
      try {
        return t.webview && typeof t.webview.getWebContentsId === 'function' && t.webview.getWebContentsId() === guestId;
      } catch {
        return false;
      }
    });
    if (targetTab) {
      setActiveTab(targetTab.id);
      try { targetTab.webview.focus(); } catch {}
    }
  });
}
window.faibilo.onOpenUrlInTab((url) => createTab(url));
window.faibilo.onDownloadStarted(updateDownload);
window.faibilo.onDownloadUpdated(updateDownload);
window.faibilo.onDownloadDone(updateDownload);

window.addEventListener('keydown', (event) => handleShortcutInput(event, event));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeScreenshare) {
    answerScreenshare(false);
    return;
  }
  if (event.key === 'Escape' && activeAppRedirect) {
    answerAppRedirect(false);
    return;
  }
  if (event.key === 'Escape' && activePermission) {
    answerPermission(false);
    return;
  }
  if (event.key === 'Escape' && document.body.classList.contains('fullscreen')) {
    event.preventDefault();
    window.faibilo.setFullscreen(false);
  }
});
window.addEventListener('pointerdown', (event) => {
  if (!bookmarksPopover.classList.contains('hidden') && !bookmarksPopover.contains(event.target) && !bookmarkButton.contains(event.target)) {
    bookmarksPopover.classList.add('hidden');
  }
  if (!tabsMenu.classList.contains('hidden') && !tabsMenu.contains(event.target) && !tabsOverflowButton.contains(event.target)) {
    tabsMenu.classList.add('hidden');
  }
});
window.addEventListener('resize', updateTabsOverflow);

const SETTINGS_SECTION_COPY = {
  browsing: ['Browsing', 'Search, tabs, start page, and sidebar behavior.'],
  appearance: ['Appearance', 'Theme, color, and browser personality.'],
  shields: ['Shields & Ad Block', 'Block ads, popups, deceptive redirects, and telemetry trackers.'],
  downloads: ['Downloads', 'Download folder, save prompts, and recent files.'],
  privacy: ['Speed & Privacy', 'Fast mode, GPU acceleration, and history saving.'],
  permissions: ['Permissions', 'Review remembered site access and remove saved choices.'],
  history: ['History', 'Recently visited pages in one clean view.'],
  data: ['Data', 'Clear browser lists when you want a fresh start.'],
  widgets: ['Widgets', 'Desktop search and quick-access widgets.'],
  about: ['About', 'Faibilo version, support, and community links.']
};

function showSettingsSection(section) {
  const [title, subtitle] = SETTINGS_SECTION_COPY[section] || SETTINGS_SECTION_COPY.browsing;
  $('#settingsTitle').textContent = title;
  $('#settingsSubtitle').textContent = subtitle;
  document.querySelectorAll('.settings-nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.settingsSection === section);
  });
  document.querySelectorAll('.settings-section').forEach((page) => {
    page.classList.toggle('active', page.dataset.settingsPage === section);
  });
  if (section === 'browsing') {
    updateDefaultBrowserSettingsUI();
  }
  if (section === 'shields') {
    updateShieldsStats();
    renderShieldsCustomizations();
  }
  if (section === 'permissions') renderPermissions();
  if (section === 'about') loadAboutVersion();
}

async function updateDefaultBrowserSettingsUI() {
  const badge = $('#defaultBrowserBadge');
  const statusEl = $('#defaultBrowserStatus');
  const btn = $('#setDefaultBrowserBtn');
  if (!badge || !statusEl || !btn) return;

  try {
    const isDefault = await window.faibilo.isDefaultBrowser?.();
    if (isDefault) {
      badge.textContent = 'Default';
      badge.classList.add('is-default');
      statusEl.textContent = 'Faibilo is currently your default browser on this PC.';
      btn.textContent = 'Change default';
    } else {
      badge.textContent = 'Not Default';
      badge.classList.remove('is-default');
      statusEl.textContent = 'Faibilo is not set as your default browser.';
      btn.textContent = 'Set as default';
    }
  } catch {
    badge.textContent = 'Unknown';
    badge.classList.remove('is-default');
    statusEl.textContent = 'Could not determine default browser status.';
  }
}

function showDefaultBrowserBanner() {
  const banner = $('#defaultBrowserBanner');
  if (banner) banner.classList.remove('hidden');
}

function hideDefaultBrowserBanner() {
  const banner = $('#defaultBrowserBanner');
  if (banner) banner.classList.add('hidden');
}

async function initRandomDefaultBrowserPrompt() {
  if (IS_INCOGNITO) return;
  if (settings.dontAskDefaultBrowser || localStorage.getItem('faibilo_dont_ask_default') === 'true') {
    return;
  }

  const lastPrompt = parseInt(localStorage.getItem('faibilo_last_default_prompt_time') || '0', 10);
  const now = Date.now();
  const cooldownMs = 3 * 24 * 60 * 60 * 1000; // 72 hours cooldown
  if (now - lastPrompt < cooldownMs) {
    return;
  }

  // Very very random: wait 20-45s after startup, then roll a 15% probability
  const delaySec = 20 + Math.floor(Math.random() * 25);
  setTimeout(async () => {
    if (settings.dontAskDefaultBrowser || localStorage.getItem('faibilo_dont_ask_default') === 'true') return;

    if (Math.random() > 0.15) {
      return;
    }

    try {
      const isDefault = await window.faibilo.isDefaultBrowser?.();
      if (isDefault) return;

      localStorage.setItem('faibilo_last_default_prompt_time', Date.now().toString());
      showDefaultBrowserBanner();
    } catch {
      // Ignore
    }
  }, delaySec * 1000);
}

async function loadAboutVersion() {
  try {
    const version = await window.faibilo.getAppVersion();
    const aboutVersion = $('#aboutVersion');
    if (aboutVersion && version) aboutVersion.textContent = version;
  } catch {
    // Ignore version lookup errors.
  }
}

function showUpdateReadyUI(updateInfo) {
  if (!updateInfo) return;
  window.__pendingUpdate = updateInfo;

  // Update Settings button state with ready indicator
  const settingsBtn = $('#settingsButton');
  if (settingsBtn) {
    settingsBtn.classList.remove('downloading-update');
    settingsBtn.classList.add('update-ready');
    settingsBtn.style.removeProperty('--update-progress');
    settingsBtn.title = `Update v${updateInfo.version || ''} Ready: Click to install`;
  }

  // Show floating toast
  const toast = $('#updateReadyToast');
  if (toast) {
    const badge = $('#updateToastBadge');
    if (badge && updateInfo.version) {
      badge.textContent = `v${updateInfo.version}`;
    }
    paintStaticIcons(toast);
    toast.classList.remove('hidden');
  }

  // Update Settings page if open
  const statusEl = $('#updateStatus');
  const downloadBtn = $('#downloadUpdateBtn');
  const featBox = $('#settingsUpdateFeaturesBox');
  const featList = $('#settingsUpdateFeaturesList');
  const featVersion = $('#settingsUpdateVersion');
  const featNotes = $('#settingsUpdateNotes');

  if (statusEl && updateInfo.version) {
    statusEl.textContent = `Update v${updateInfo.version} has been silently downloaded and is ready to install!`;
  }
  if (downloadBtn && updateInfo.version) {
    downloadBtn.textContent = `Restart & install v${updateInfo.version}`;
    downloadBtn.classList.remove('hidden');
    downloadBtn.disabled = false;
  }
  const features = Array.isArray(updateInfo.features) ? updateInfo.features.filter(Boolean) : [];
  const notes = typeof updateInfo.notes === 'string' ? updateInfo.notes.trim() : '';
  if (featBox && (features.length > 0 || notes)) {
    if (featVersion) featVersion.textContent = updateInfo.version;
    if (featList) {
      featList.innerHTML = '';
      features.forEach((feat) => {
        const li = document.createElement('li');
        li.textContent = feat;
        featList.appendChild(li);
      });
    }
    if (featNotes) {
      if (notes && !features.includes(notes)) {
        featNotes.textContent = notes;
        featNotes.classList.remove('hidden');
      } else {
        featNotes.classList.add('hidden');
      }
    }
    featBox.classList.remove('hidden');
  }
}

function hideUpdateReadyToast() {
  const toast = $('#updateReadyToast');
  if (toast) toast.classList.add('hidden');
}

async function handleInstallReadyUpdate() {
  const settingsBtn = $('#settingsButton');
  const toastInstallBtn = $('#updateToastInstallBtn');
  const downloadBtn = $('#downloadUpdateBtn');
  const statusEl = $('#updateStatus');

  if (settingsBtn) {
    settingsBtn.title = 'Installing update and restarting...';
  }
  if (toastInstallBtn) {
    toastInstallBtn.disabled = true;
    toastInstallBtn.textContent = 'Restarting...';
  }
  if (downloadBtn) {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Restarting...';
  }
  if (statusEl) {
    statusEl.textContent = 'Launching update installer and restarting Faibilo...';
  }

  try {
    const result = await window.faibilo.installReadyUpdate();
    if (!result?.ok) {
      if (window.__pendingUpdate) {
        await window.faibilo.installUpdate(window.__pendingUpdate);
      } else {
        if (statusEl) statusEl.textContent = `Install failed: ${result.error || 'Unknown error'}`;
        if (toastInstallBtn) toastInstallBtn.disabled = false;
        if (downloadBtn) downloadBtn.disabled = false;
      }
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = `Install failed: ${err.message}`;
    if (toastInstallBtn) toastInstallBtn.disabled = false;
    if (downloadBtn) downloadBtn.disabled = false;
  }
}

async function handleCheckForUpdates() {
  const checkBtn = $('#checkUpdates');
  const statusEl = $('#updateStatus');
  const downloadBtn = $('#downloadUpdateBtn');
  if (!checkBtn || !statusEl) return;

  checkBtn.disabled = true;
  statusEl.textContent = 'Checking for updates...';
  downloadBtn?.classList.add('hidden');
  const featBox = $('#settingsUpdateFeaturesBox');
  featBox?.classList.add('hidden');
  if (downloadBtn) {
    delete downloadBtn.dataset.url;
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download & install';
  }
  window.__pendingUpdate = null;

  try {
    const result = await window.faibilo.checkForUpdates();
    if (result?.reason === 'no-config') {
      statusEl.textContent = 'Update source is not configured. Add FAIBILO_VERSION_URL to .env.';
    } else if (result?.reason === 'fetch-failed') {
      statusEl.textContent = `Could not reach the update server.${result.error ? ` (${result.error})` : ''}`;
    } else if (result?.reason === 'invalid-version-file') {
      statusEl.textContent = 'Update file was found, but the version or download link is missing.';
    } else if (result?.available) {
      if (result.downloaded) {
        showUpdateReadyUI(result);
      } else {
        const requiredNote = result.necessary ? ' This update is required on next launch.' : '';
        statusEl.textContent = `Update v${result.version} is available. You are on v${result.currentVersion}.${requiredNote}`;
        window.__pendingUpdate = result;

        const features = Array.isArray(result.features) ? result.features.filter(Boolean) : [];
        const notes = typeof result.notes === 'string' ? result.notes.trim() : '';
        const featList = $('#settingsUpdateFeaturesList');
        const featVersion = $('#settingsUpdateVersion');
        const featNotes = $('#settingsUpdateNotes');

        if (featBox && (features.length > 0 || notes)) {
          if (featVersion) featVersion.textContent = result.version;
          if (featList) {
            featList.innerHTML = '';
            features.forEach((feat) => {
              const li = document.createElement('li');
              li.textContent = feat;
              featList.appendChild(li);
            });
          }
          if (featNotes) {
            if (notes && !features.includes(notes)) {
              featNotes.textContent = notes;
              featNotes.classList.remove('hidden');
            } else {
              featNotes.classList.add('hidden');
            }
          }
          featBox.classList.remove('hidden');
        }

        if (downloadBtn && result.downloadUrl) {
          downloadBtn.textContent = `Download & install v${result.version}`;
          downloadBtn.classList.remove('hidden');
        }
      }
    } else {
      statusEl.textContent = `You're up to date (v${result?.currentVersion || 'unknown'}).`;
    }
  } catch {
    statusEl.textContent = 'Could not check for updates.';
  } finally {
    checkBtn.disabled = false;
  }
}

async function handleInstallPendingUpdate() {
  const downloadBtn = $('#downloadUpdateBtn');
  const statusEl = $('#updateStatus');
  const updateInfo = window.__pendingUpdate;
  if (!downloadBtn || !statusEl || !updateInfo?.downloadUrl) return;

  // If already downloaded, install ready update
  if (updateInfo?.downloaded || updateInfo?.installerPath) {
    return handleInstallReadyUpdate();
  }

  downloadBtn.disabled = true;
  statusEl.textContent = 'Downloading and installing update...';
  try {
    const result = await window.faibilo.installUpdate(updateInfo);
    if (!result?.ok) {
      statusEl.textContent = `Install failed: ${result.error || 'Unknown error'}`;
      downloadBtn.disabled = false;
    }
  } catch {
    statusEl.textContent = 'Install failed. Try again in a moment.';
    downloadBtn.disabled = false;
  }
}

function initUpdateSystem() {
  $('#updateToastInstallBtn')?.addEventListener('click', () => handleInstallReadyUpdate());
  $('#updateToastDismissBtn')?.addEventListener('click', () => hideUpdateReadyToast());

  window.faibilo?.onUpdateDownloaded?.((info) => {
    showUpdateReadyUI(info);
  });

  window.faibilo?.onUpdateDownloadProgress?.((progress) => {
    const percent = Math.max(0, Math.min(100, Number(progress?.percent) || 0));
    const settingsBtn = $('#settingsButton');
    if (settingsBtn) {
      settingsBtn.classList.remove('update-ready');
      settingsBtn.classList.add('downloading-update');
      settingsBtn.style.setProperty('--update-progress', percent);
      settingsBtn.title = `Downloading update: ${percent}%`;
    }
  });

  // Check if an update was already downloaded and is waiting
  window.faibilo?.getPendingUpdate?.().then((pending) => {
    if (pending) {
      showUpdateReadyUI(pending);
    }
  }).catch(() => {});
}

function appearancePreset() {
  return {
    app: 'Faibilo',
    type: 'appearance-preset',
    version: 1,
    themePreset: settings.themePreset,
    accentColor: settings.accentColor,
    componentBgColor: settings.componentBgColor,
    borderColor: settings.borderColor,
    ambientVideoGlow: settings.ambientVideoGlow,
    autoPageTheme: settings.autoPageTheme
  };
}

function exportAppearancePreset() {
  const blob = new Blob([JSON.stringify(appearancePreset(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'faibilo-appearance-preset.json';
  link.click();
  URL.revokeObjectURL(url);
}

function resetAppearanceDefaults() {
  persistSettings(DEFAULT_APPEARANCE);
  applySettingsToForm();
}

function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function importAppearancePreset(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const preset = JSON.parse(reader.result);
      const nextSettings = {};
      if (['forest', 'midnight', 'carbon', 'sunrise'].includes(preset.themePreset)) nextSettings.themePreset = preset.themePreset;
      if (isHexColor(preset.accentColor)) nextSettings.accentColor = preset.accentColor;
      if (isHexColor(preset.componentBgColor)) nextSettings.componentBgColor = preset.componentBgColor;
      if (isHexColor(preset.borderColor)) nextSettings.borderColor = preset.borderColor;
      if (typeof preset.ambientVideoGlow === 'boolean') nextSettings.ambientVideoGlow = preset.ambientVideoGlow;
      if (typeof preset.autoPageTheme === 'boolean') nextSettings.autoPageTheme = preset.autoPageTheme;
      if (!Object.keys(nextSettings).length) return;
      persistSettings(nextSettings);
      applySettingsToForm();
    } catch {
      alert('This preset file could not be imported.');
    }
  });
  reader.readAsText(file);
}

function updateShieldsStats() {
  const statBlocked = $('#statBlockedCount');
  if (statBlocked) {
    statBlocked.textContent = (settings.blockedCount || 0).toLocaleString();
  }
  const badge = $('#shieldsStatusBadge');
  if (badge) {
    const isMasterOn = settings.blockAds !== false || settings.blockPopups !== false || settings.blockTrackers !== false;
    if (isMasterOn) {
      badge.className = 'shields-status-badge active';
      badge.innerHTML = '<span class="pulse-dot"></span> Active Protection';
    } else {
      badge.className = 'shields-status-badge disabled';
      badge.innerHTML = '<span class="pulse-dot off"></span> Shields Paused';
    }
  }
  const trackerStat = $('#statTrackerCount');
  if (trackerStat) {
    trackerStat.textContent = settings.blockTrackers !== false ? 'Protected' : 'Paused';
    trackerStat.style.color = settings.blockTrackers !== false ? 'var(--accent)' : 'var(--muted)';
  }
  const videoStat = $('#statVideoAdCount');
  if (videoStat) {
    videoStat.textContent = settings.autoSkipVideoAds !== false ? 'Active' : 'Disabled';
    videoStat.style.color = settings.autoSkipVideoAds !== false ? 'var(--accent)' : 'var(--muted)';
  }
}

function renderShieldsCustomizations() {
  const whitelistList = $('#whitelistChips');
  if (whitelistList) {
    const whitelist = Array.isArray(settings.whitelistedDomains) ? settings.whitelistedDomains : [];
    if (!whitelist.length) {
      whitelistList.innerHTML = '<span class="empty-chips-hint">No sites whitelisted yet. All sites are protected.</span>';
    } else {
      whitelistList.innerHTML = whitelist.map((item, idx) => `
        <span class="shield-chip">
          <span>${escapeHtml(item)}</span>
          <button type="button" class="shield-chip-remove" data-remove-whitelist="${idx}" title="Remove domain">×</button>
        </span>
      `).join('');
    }
  }

  const customBlockList = $('#customBlockChips');
  if (customBlockList) {
    const customRules = Array.isArray(settings.customBlockRules) ? settings.customBlockRules : [];
    if (!customRules.length) {
      customBlockList.innerHTML = '<span class="empty-chips-hint">No custom block rules added.</span>';
    } else {
      customBlockList.innerHTML = customRules.map((item, idx) => `
        <span class="shield-chip custom-rule-chip">
          <span>${escapeHtml(item)}</span>
          <button type="button" class="shield-chip-remove" data-remove-custom="${idx}" title="Remove rule">×</button>
        </span>
      `).join('');
    }
  }
}

function showShieldToast(title, url) {
  let displayHost = '';
  try {
    displayHost = new URL(url).hostname;
  } catch {
    displayHost = url ? String(url).slice(0, 32) : '';
  }

  const container = getOrCreateToastContainer();
  const toast = document.createElement('div');
  toast.className = 'dl-toast shield-toast dl-toast-enter';

  toast.innerHTML = `
    <div class="dl-toast-icon shield-icon-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    </div>
    <div class="dl-toast-body">
      <div class="dl-toast-name">${escapeHtml(title)}</div>
      <div class="dl-toast-state">${escapeHtml(displayHost || 'Unwanted popup prevented')}</div>
    </div>
    <div class="dl-toast-actions">
      <button class="dl-toast-close" title="Dismiss">✕</button>
    </div>
  `;

  const closeBtn = toast.querySelector('.dl-toast-close');
  const dismiss = () => {
    toast.classList.add('dl-toast-exit');
    setTimeout(() => toast.remove(), 250);
  };
  closeBtn?.addEventListener('click', dismiss);
  setTimeout(dismiss, 3500);

  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.remove('dl-toast-enter'));
  });
}

function applySettingsToForm() {
  $('#searchEngine').value = settings.searchEngine;
  $('#homeMode').value = settings.homeMode;
  $('#customHome').value = settings.customHome;
  $('#themePreset').value = settings.themePreset;
  $('#accentColor').value = settings.accentColor;
  $('#componentBgColor').value = settings.componentBgColor;
  $('#borderColor').value = settings.borderColor;
  $('#ambientVideoGlow').checked = settings.ambientVideoGlow;
  $('#autoPageTheme').checked = settings.autoPageTheme;
  $('#desktopMediaDisk').checked = settings.desktopMediaDisk;

  $('#bookmarksNewTab').checked = settings.bookmarksNewTab;
  $('#downloadPath').value = settings.downloadPath;
  $('#askDownloadLocation').checked = settings.askDownloadLocation;
  $('#fastMode').checked = settings.fastMode !== false;
  $('#blockAds').checked = settings.blockAds !== false;
  $('#blockPopups').checked = settings.blockPopups !== false;
  $('#blockTrackers').checked = settings.blockTrackers !== false;
  $('#autoSkipVideoAds').checked = settings.autoSkipVideoAds !== false;
  $('#cosmeticFiltering').checked = settings.cosmeticFiltering !== false;
  $('#saveHistory').checked = settings.saveHistory !== false;
  $('#showSidebar').checked = settings.showSidebar;

  const sleepingTabs = $('#sleepingTabs');
  if (sleepingTabs) sleepingTabs.checked = settings.sleepingTabsEnabled !== false;
  const sleepingTimeout = $('#sleepingTabsTimeout');
  if (sleepingTimeout) sleepingTimeout.value = String(settings.sleepingTabsTimeout || 15);
  const efficiencyMode = $('#efficiencyMode');
  if (efficiencyMode) efficiencyMode.checked = Boolean(settings.efficiencyMode);
  const predictivePreload = $('#predictivePreload');
  if (predictivePreload) predictivePreload.checked = settings.predictivePreload !== false;

  updateShieldsStats();
  renderShieldsCustomizations();
}

function openSettings(section = 'browsing') {
  showSettingsSection(section);
  applySettingsToForm();
  createSettingsTab();
}

function bindSettingForm() {
  document.querySelectorAll('.settings-nav-item').forEach((button) => {
    button.addEventListener('click', () => showSettingsSection(button.dataset.settingsSection));
  });
  $('#searchEngine').addEventListener('change', (event) => persistSettings({ searchEngine: event.target.value }));
  $('#homeMode').addEventListener('change', (event) => persistSettings({ homeMode: event.target.value }));
  $('#customHome').addEventListener('change', (event) => persistSettings({ customHome: event.target.value }));
  $('#themePreset').addEventListener('change', (event) => persistSettings({ themePreset: event.target.value }));
  $('#accentColor').addEventListener('input', (event) => persistSettings({ accentColor: event.target.value }));
  $('#componentBgColor').addEventListener('input', (event) => persistSettings({ componentBgColor: event.target.value }));
  $('#borderColor').addEventListener('input', (event) => persistSettings({ borderColor: event.target.value }));
  $('#ambientVideoGlow').addEventListener('change', (event) => persistSettings({ ambientVideoGlow: event.target.checked }));
  $('#autoPageTheme').addEventListener('change', (event) => persistSettings({ autoPageTheme: event.target.checked }));
  $('#desktopMediaDisk').addEventListener('change', (event) => persistSettings({ desktopMediaDisk: event.target.checked }));

  $('#exportAppearancePreset').addEventListener('click', exportAppearancePreset);
  $('#importAppearancePreset').addEventListener('click', () => $('#appearancePresetFile').click());
  $('#resetAppearance').addEventListener('click', resetAppearanceDefaults);
  $('#appearancePresetFile').addEventListener('change', (event) => {
    importAppearancePreset(event.target.files?.[0]);
    event.target.value = '';
  });
  $('#bookmarksNewTab').addEventListener('change', (event) => persistSettings({ bookmarksNewTab: event.target.checked }));
  $('#askDownloadLocation').addEventListener('change', (event) => persistSettings({ askDownloadLocation: event.target.checked }));
  $('#fastMode').addEventListener('change', (event) => persistSettings({ fastMode: event.target.checked }));
  $('#predictivePreload')?.addEventListener('change', (event) => persistSettings({ predictivePreload: event.target.checked }));
  $('#sleepingTabs')?.addEventListener('change', (event) => persistSettings({ sleepingTabsEnabled: event.target.checked }));
  $('#sleepingTabsTimeout')?.addEventListener('change', (event) => persistSettings({ sleepingTabsTimeout: parseInt(event.target.value, 10) || 15 }));
  $('#efficiencyMode')?.addEventListener('change', (event) => {
    persistSettings({ efficiencyMode: event.target.checked });
    applyAppearance();
    startAmbientSampler();
  });
  $('#trimMemoryBtn')?.addEventListener('click', async () => {
    const btn = $('#trimMemoryBtn');
    const status = $('#memoryTrimStatus');
    if (btn) btn.disabled = true;
    if (status) status.textContent = 'Clearing working set cache and releasing RAM...';
    try {
      const res = await window.faibilo.trimMemory?.();
      if (res?.ok) {
        if (status) status.textContent = `Memory optimized! Current usage: ${res.rssMb} MB RSS (${res.heapUsedMb} MB Heap).`;
      } else {
        if (status) status.textContent = 'Working set trimmed.';
      }
    } catch {
      if (status) status.textContent = 'Cache cleared.';
    } finally {
      if (btn) btn.disabled = false;
    }
  });
  
  // Shields & Ad Blocker Controls
  $('#blockAds')?.addEventListener('change', (event) => {
    persistSettings({ blockAds: event.target.checked });
    updateShieldsStats();
  });
  $('#blockPopups')?.addEventListener('change', (event) => {
    persistSettings({ blockPopups: event.target.checked });
    updateShieldsStats();
  });
  $('#blockTrackers')?.addEventListener('change', (event) => {
    persistSettings({ blockTrackers: event.target.checked });
    updateShieldsStats();
  });
  $('#autoSkipVideoAds')?.addEventListener('change', (event) => {
    persistSettings({ autoSkipVideoAds: event.target.checked });
    updateShieldsStats();
  });
  $('#cosmeticFiltering')?.addEventListener('change', (event) => {
    persistSettings({ cosmeticFiltering: event.target.checked });
  });

  const handleAddWhitelist = () => {
    const input = $('#whitelistInput');
    if (!input) return;
    const val = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!val) return;
    const current = Array.isArray(settings.whitelistedDomains) ? [...settings.whitelistedDomains] : [];
    if (!current.includes(val)) {
      current.push(val);
      persistSettings({ whitelistedDomains: current });
      renderShieldsCustomizations();
    }
    input.value = '';
  };

  $('#addWhitelistBtn')?.addEventListener('click', handleAddWhitelist);
  $('#whitelistInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddWhitelist();
    }
  });

  const handleAddCustomBlock = () => {
    const input = $('#customBlockInput');
    if (!input) return;
    const val = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!val) return;
    const current = Array.isArray(settings.customBlockRules) ? [...settings.customBlockRules] : [];
    if (!current.includes(val)) {
      current.push(val);
      persistSettings({ customBlockRules: current });
      renderShieldsCustomizations();
    }
    input.value = '';
  };

  $('#addCustomBlockBtn')?.addEventListener('click', handleAddCustomBlock);
  $('#customBlockInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomBlock();
    }
  });

  $('#whitelistChips')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-whitelist]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.removeWhitelist, 10);
    const current = Array.isArray(settings.whitelistedDomains) ? [...settings.whitelistedDomains] : [];
    if (idx >= 0 && idx < current.length) {
      current.splice(idx, 1);
      persistSettings({ whitelistedDomains: current });
      renderShieldsCustomizations();
    }
  });

  $('#customBlockChips')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-custom]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.removeCustom, 10);
    const current = Array.isArray(settings.customBlockRules) ? [...settings.customBlockRules] : [];
    if (idx >= 0 && idx < current.length) {
      current.splice(idx, 1);
      persistSettings({ customBlockRules: current });
      renderShieldsCustomizations();
    }
  });

  $('#resetShieldStats')?.addEventListener('click', () => {
    persistSettings({ blockedCount: 0 });
    updateShieldsStats();
  });

  $('#goToShieldsBtn')?.addEventListener('click', () => {
    showSettingsSection('shields');
  });

  let persistBlockedTimeout = null;
  window.faibilo.onAdBlocked?.((data) => {
    const increment = Number(data?.count) || 1;
    settings.blockedCount = (settings.blockedCount || 0) + increment;
    updateShieldsStats();
    if (!persistBlockedTimeout) {
      persistBlockedTimeout = setTimeout(() => {
        writeStore(STORAGE_KEYS.settings, settings);
        persistBlockedTimeout = null;
      }, 1000);
    }
    if (data?.type === 'popup') {
      showShieldToast('Popup Blocked', data.url);
    }
  });

  $('#saveHistory').addEventListener('change', (event) => persistSettings({ saveHistory: event.target.checked }));
  $('#chooseDownloadPath').addEventListener('click', async () => {
    const nativeSettings = await window.faibilo.chooseDownloadPath();
    persistSettings(nativeSettings);
    applySettingsToForm();
  });
  $('#showSidebar').addEventListener('change', (event) => persistSettings({ showSidebar: event.target.checked }));
  $('#addFavoriteButton').addEventListener('click', showFavoriteModal);
  $('#favoriteModalClose').addEventListener('click', hideFavoriteModal);
  $('#favoriteCancel').addEventListener('click', hideFavoriteModal);
  $('#favoriteUrl').addEventListener('input', updateFavoritePreview);
  $('#favoriteName').addEventListener('input', updateFavoritePreview);
  $('#favoriteForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('#favoriteName').value.trim();
    const rawUrl = $('#favoriteUrl').value.trim();
    const url = normalizeInput(rawUrl);
    if (!name || !/^https?:\/\//i.test(url)) {
      $('#favoriteError').classList.remove('hidden');
      return;
    }
    favoriteApps.push({ id: `favorite-${Date.now()}`, name, url });
    writeStore(STORAGE_KEYS.favorites, favoriteApps);
    renderFavorites();
    refreshHomeTabs();
    hideFavoriteModal();
  });
  $('#clearHistory').addEventListener('click', () => {
    historyItems = [];
    writeStore(STORAGE_KEYS.history, historyItems);
    refreshHomeTabs();
    renderLibrary();
  });
  $('#clearDownloads').addEventListener('click', () => {
    downloads = [];
    writeStore(STORAGE_KEYS.downloads, downloads);
    renderDownloads();
  });
  $('#clearBookmarks').addEventListener('click', () => {
    bookmarks = [];
    writeStore(STORAGE_KEYS.bookmarks, bookmarks);
    renderLibrary();
    renderBookmarksMenu();
    updateChrome();
  });
  $('#clearPermissions').addEventListener('click', async () => {
    rememberedPermissions = await window.faibilo.clearPermissions();
    renderPermissions();
  });
  $('#joinDiscord').addEventListener('click', () => window.faibilo.openExternal('https://discord.gg/YRhcgEGVjN'));
  $('#checkUpdates')?.addEventListener('click', () => handleCheckForUpdates());
  $('#downloadUpdateBtn')?.addEventListener('click', () => handleInstallPendingUpdate());

  $('#setDefaultBrowserBtn')?.addEventListener('click', async () => {
    const btn = $('#setDefaultBrowserBtn');
    if (btn) btn.disabled = true;
    try {
      await window.faibilo.setDefaultBrowser?.();
      setTimeout(async () => {
        await updateDefaultBrowserSettingsUI();
        if (btn) btn.disabled = false;
      }, 1500);
    } catch {
      if (btn) btn.disabled = false;
    }
  });

  $('#restoreDefaultAppsBtn')?.addEventListener('click', () => {
    restoreDefaultApps();
  });

  $('#settingsRestoreDefaultAppsBtn')?.addEventListener('click', () => {
    restoreDefaultApps();
  });

  window.addEventListener('focus', () => {
    const settingsPage = $('#settingsPage');
    if (settingsPage && !settingsPage.classList.contains('hidden')) {
      updateDefaultBrowserSettingsUI();
    }
  });

  $('#defaultBannerSetBtn')?.addEventListener('click', async () => {
    hideDefaultBrowserBanner();
    try {
      await window.faibilo.setDefaultBrowser?.();
      await updateDefaultBrowserSettingsUI();
    } catch {}
  });

  $('#defaultBannerNotNowBtn')?.addEventListener('click', () => {
    hideDefaultBrowserBanner();
    try {
      localStorage.setItem('faibilo_last_default_prompt_time', Date.now().toString());
    } catch {}
  });

  $('#defaultBannerDismissBtn')?.addEventListener('click', () => {
    hideDefaultBrowserBanner();
    try {
      localStorage.setItem('faibilo_dont_ask_default', 'true');
    } catch {}
    persistSettings({ dontAskDefaultBrowser: true });
  });

  $('#startTourBtn')?.addEventListener('click', () => startTour(0));
}

const preconnectedDomains = new Set();

function predictivePreconnect(rawUrl) {
  if (settings.predictivePreload === false) return;
  if (!rawUrl || typeof rawUrl !== 'string') return;
  try {
    const parsed = new URL(normalizeInput(rawUrl));
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return;
    const origin = parsed.origin;
    if (preconnectedDomains.has(origin)) return;
    preconnectedDomains.add(origin);

    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = origin;
    document.head.appendChild(preconnect);

    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = origin;
    document.head.appendChild(dnsPrefetch);

    if (preconnectedDomains.size > 30) {
      const first = preconnectedDomains.values().next().value;
      preconnectedDomains.delete(first);
    }
  } catch {}
}

let predictiveHoverBound = false;
function bindPredictiveHover() {
  if (predictiveHoverBound) return;
  predictiveHoverBound = true;

  // New tab button hover pre-warming
  $('#newTab')?.addEventListener('mouseenter', () => {
    ensurePrewarmedNewTab();
    predictivePreconnect(newTabUrl());
  });

  // Home button hover
  $('#home')?.addEventListener('mouseenter', () => {
    ensurePrewarmedNewTab();
    startSpeculativePreload(newTabUrl());
  });
  $('#home')?.addEventListener('mouseleave', cancelSpeculativePreload);

  // Back & Forward navigation pre-warming
  $('#back')?.addEventListener('mouseenter', () => {
    const tab = activeTab();
    if (tab && tab.canGoBack && tab.url) predictivePreconnect(tab.url);
  });
  $('#forward')?.addEventListener('mouseenter', () => {
    const tab = activeTab();
    if (tab && tab.canGoForward && tab.url) predictivePreconnect(tab.url);
  });

  // Omnibox suggestions speculative background loading
  $('#omniboxSuggestions')?.addEventListener('mouseover', (e) => {
    const item = e.target.closest ? e.target.closest('.suggestion-item') : null;
    if (item && item.dataset.query) {
      startSpeculativePreload(`${searchUrl()}${encodeURIComponent(item.dataset.query)}`);
    }
  });
  $('#omniboxSuggestions')?.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest?.('.suggestion-item')) {
      cancelSpeculativePreload();
    }
  });

  // Sidebar Favorites dock speculative background loading
  $('#favoritesList')?.addEventListener('mouseover', (e) => {
    const fav = e.target.closest ? e.target.closest('.favorite-launch') : null;
    if (fav && fav.dataset.url) {
      startSpeculativePreload(fav.dataset.url);
    }
  });
  $('#favoritesList')?.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest?.('.favorite-launch')) {
      cancelSpeculativePreload();
    }
  });

  // Bookmarks menu items speculative background loading
  $('#bookmarksMenuList')?.addEventListener('mouseover', (e) => {
    const row = e.target.closest ? e.target.closest('.bookmark-row, .panel-item') : null;
    const url = row?.dataset?.url;
    if (url) startSpeculativePreload(url);
  });
  $('#bookmarksMenuList')?.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest?.('.bookmark-row, .panel-item')) {
      cancelSpeculativePreload();
    }
  });

  // History list items speculative background loading
  $('#historyList')?.addEventListener('mouseover', (e) => {
    const row = e.target.closest ? e.target.closest('.history-row, .panel-item') : null;
    const url = row?.dataset?.url;
    if (url) startSpeculativePreload(url);
  });
  $('#historyList')?.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest?.('.history-row, .panel-item')) {
      cancelSpeculativePreload();
    }
  });
}

// --- Empty Tabs State ---
function updateEmptyStateVisibility() {
  const emptyView = $('#emptyTabsView');
  if (!emptyView) return;
  const noTabs = tabs.length === 0;
  emptyView.classList.toggle('hidden', !noTabs);
  if (noTabs) {
    if (settingsPage) {
      settingsPage.classList.remove('active');
      settingsPage.classList.add('hidden');
    }
  }
}

function bindEmptyTabsView() {
  $('#emptyTabsNewTabBtn')?.addEventListener('click', () => createTab(newTabUrl(), true));
  $('#emptyTabsSettingsBtn')?.addEventListener('click', () => createSettingsTab());
}

// --- Interactive Onboarding Tour ---
const TOUR_STEPS = [
  {
    step: 1,
    tag: 'Step 1 of 4 • Welcome',
    icon: 'compass',
    headline: 'Welcome to Faibilo Browser',
    desc: 'Engineered for extreme speed, complete privacy, and audio-reactive aesthetics. Here is a quick 1-minute walkthrough of your browser superpowers.',
    features: [
      { icon: 'zap', title: '0ms Standby Tabs', text: 'Pre-warmed background tabs guarantee instant new tab loading with zero delay.' },
      { icon: 'shield-check', title: 'Built-in Ad & Popup Blocker', text: 'Blocks intrusive banner ads, video sponsorships, and popups out of the box.' },
      { icon: 'disc', title: 'Desktop Music Disc', text: 'A floating audio widget that follows your music and media anywhere on your desktop.' }
    ]
  },
  {
    step: 2,
    tag: 'Step 2 of 4 • Music Disc Widget',
    icon: 'disc',
    headline: 'Music Disc & Right-Click Desktop Search',
    desc: 'Control playing media from any tab right on your desktop, with an awesome hidden desktop search shortcut!',
    features: [
      {
        icon: 'settings',
        title: 'How to Enable',
        text: 'Go to Settings → Appearance → "Show desktop media disk" (or toggle it using the button below).'
      },
      {
        icon: 'rotate-cw',
        title: 'Left-Click & Drag',
        text: 'Drag the vinyl disc anywhere on your screen. Left-click to play/pause, skip tracks, or jump straight to the playing tab.'
      },
      {
        icon: 'search',
        title: 'Right-Click Secret Feature',
        text: 'Right-click the disc anytime to instantly pop open the Quick Search Workspace without switching windows! Right-click again to collapse.'
      }
    ],
    action: 'widget'
  },
  {
    step: 3,
    tag: 'Step 3 of 4 • Appearance & Colors',
    icon: 'palette',
    headline: 'Personalize Colors & Themes',
    desc: 'Customize luxury theme presets, neon accents, UI glass, and synchronized video ambient glow.',
    features: [
      {
        icon: 'palette',
        title: 'Curated Theme Presets',
        text: 'Choose between Forest (Emerald Glass), Midnight (Sapphire Neon), Carbon (Obsidian), or Sunrise (Warm Amber).'
      },
      {
        icon: 'star',
        title: 'Custom Color Pickers',
        text: 'In Settings → Appearance, pick exact custom hex colors for your accent color, UI background glass, and border glows.'
      },
      {
        icon: 'camera',
        title: 'Ambient Video Glow',
        text: 'Synchronizes soft ambient backlighting around your browser with YouTube and video playback!'
      }
    ],
    action: 'themes'
  },
  {
    step: 4,
    tag: 'Step 4 of 4 • Speed & Privacy',
    icon: 'zap',
    headline: 'Smart Tab Sleeping & Ephemeral Privacy',
    desc: 'Keep your PC lightning fast and your browsing sessions strictly isolated.',
    features: [
      {
        icon: 'minus',
        title: 'Inactive Tab Sleeping',
        text: 'Tabs that have been idle sleep automatically to save CPU & RAM, waking up in milliseconds when clicked.'
      },
      {
        icon: 'shield',
        title: 'Ephemeral Private Browsing',
        text: 'Permissions and browsing history in private windows are strictly in-memory and destroyed completely when closed.'
      },
      {
        icon: 'arrow-right',
        title: 'Predictive Hover Preloading',
        text: 'Hovering over navigation buttons speculatively pre-connects in the background for zero-latency clicks.'
      }
    ]
  }
];

let currentTourIndex = 0;

function startTour(stepIndex = 0) {
  const overlay = $('#tourOverlay');
  if (!overlay) return;

  if (activeTabId === SETTINGS_TAB_ID) {
    const browsingTab = tabs.find((t) => t.id !== SETTINGS_TAB_ID);
    if (browsingTab) {
      setActiveTab(browsingTab.id);
    } else {
      createTab(newTabUrl(), true);
    }
  }

  currentTourIndex = Math.max(0, Math.min(stepIndex, TOUR_STEPS.length - 1));
  renderTourStep(currentTourIndex);
  overlay.classList.remove('hidden');
}

window.startTour = startTour;
window.closeTour = closeTour;

function closeTour() {
  const overlay = $('#tourOverlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  writeStore('faibilo.tour_completed', true);
}

function renderTourStep(index) {
  const step = TOUR_STEPS[index];
  if (!step) return;

  $('#tourStepTag').textContent = step.tag;
  $('#tourProgressBar').style.width = `${((index + 1) / TOUR_STEPS.length) * 100}%`;

  const heroIconClass = step.icon === 'disc' ? 'tour-hero-icon rotating-disc' : 'tour-hero-icon';
  let actionHtml = '';

  if (step.action === 'widget') {
    const isWidgetOn = Boolean(settings.desktopMediaDisk);
    actionHtml = `
      <div class="tour-interactive-box">
        <div>
          <strong style="display:block; font-size:13px; color:var(--text); margin-bottom:2px;">Desktop Music Disc:</strong>
          <span style="font-size:12px; color:var(--muted);">${isWidgetOn ? 'Widget is currently visible on your desktop.' : 'Click to launch the floating disc right now.'}</span>
        </div>
        <button type="button" class="tour-action-btn ${isWidgetOn ? 'active-enabled' : ''}" id="tourToggleWidgetBtn">
          ${isWidgetOn ? '✔ Music Disc Enabled' : 'Enable Music Disc'}
        </button>
      </div>
    `;
  } else if (step.action === 'themes') {
    const currentTheme = settings.themePreset || 'forest';
    actionHtml = `
      <div class="tour-interactive-box">
        <span style="font-size:12px; color:var(--muted); font-weight:600;">Live Theme Preview:</span>
        <div class="tour-theme-chips">
          <button type="button" class="tour-theme-chip ${currentTheme === 'forest' ? 'active' : ''}" data-tour-theme="forest">
            <span class="tour-theme-dot" style="background:#00ff99;"></span> Forest
          </button>
          <button type="button" class="tour-theme-chip ${currentTheme === 'midnight' ? 'active' : ''}" data-tour-theme="midnight">
            <span class="tour-theme-dot" style="background:#7aa7ff;"></span> Midnight
          </button>
          <button type="button" class="tour-theme-chip ${currentTheme === 'carbon' ? 'active' : ''}" data-tour-theme="carbon">
            <span class="tour-theme-dot" style="background:#f5f7fa;"></span> Carbon
          </button>
          <button type="button" class="tour-theme-chip ${currentTheme === 'sunrise' ? 'active' : ''}" data-tour-theme="sunrise">
            <span class="tour-theme-dot" style="background:#ffb15d;"></span> Sunrise
          </button>
        </div>
      </div>
    `;
  }

  const featuresHtml = step.features.map((f) => `
    <div class="tour-feature-item">
      <div class="tour-feature-icon">${icon(f.icon)}</div>
      <div class="tour-feature-info">
        <strong>${f.title}</strong>
        <p>${f.text}</p>
      </div>
    </div>
  `).join('');

  $('#tourBody').innerHTML = `
    <div class="tour-hero">
      <div class="${heroIconClass}">${icon(step.icon)}</div>
      <div>
        <h3 class="tour-headline" id="tourTitle">${step.headline}</h3>
      </div>
    </div>
    <p class="tour-desc">${step.desc}</p>
    ${actionHtml}
    <div class="tour-features-grid">${featuresHtml}</div>
  `;

  // Bind interactive widget toggle if present
  const widgetBtn = $('#tourToggleWidgetBtn');
  if (widgetBtn) {
    widgetBtn.addEventListener('click', () => {
      const nextState = !settings.desktopMediaDisk;
      persistSettings({ desktopMediaDisk: nextState });
      applySettingsToForm();
      renderTourStep(index);
    });
  }

  // Bind interactive theme chips if present
  $('#tourBody').querySelectorAll('[data-tour-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.tourTheme;
      persistSettings({ themePreset: theme });
      applySettingsToForm();
      renderTourStep(index);
    });
  });

  // Render dots
  $('#tourDots').innerHTML = TOUR_STEPS.map((_, i) => `
    <span class="tour-dot ${i === index ? 'active' : ''}" data-tour-dot="${i}"></span>
  `).join('');

  $('#tourDots').querySelectorAll('[data-tour-dot]').forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetIndex = Number(dot.dataset.tourDot);
      currentTourIndex = targetIndex;
      renderTourStep(currentTourIndex);
    });
  });

  // Update navigation buttons
  $('#tourPrevBtn').disabled = index === 0;
  $('#tourNextBtn').textContent = index === TOUR_STEPS.length - 1 ? 'Finish & Start Browsing' : 'Next';
}

function nextTourStep() {
  if (currentTourIndex < TOUR_STEPS.length - 1) {
    currentTourIndex++;
    renderTourStep(currentTourIndex);
  } else {
    closeTour();
  }
}

function prevTourStep() {
  if (currentTourIndex > 0) {
    currentTourIndex--;
    renderTourStep(currentTourIndex);
  }
}

function initTour() {
  $('#tourCloseBtn')?.addEventListener('click', closeTour);
  $('#tourSkipBtn')?.addEventListener('click', closeTour);
  $('#tourNextBtn')?.addEventListener('click', nextTourStep);
  $('#tourPrevBtn')?.addEventListener('click', prevTourStep);
  $('#startTourBtn')?.addEventListener('click', () => startTour(0));
  $('#emptyTabsTourBtn')?.addEventListener('click', () => startTour(0));

  window.addEventListener('keydown', (e) => {
    const overlay = $('#tourOverlay');
    if (!overlay || overlay.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTour();
    } else if (e.key === 'ArrowRight' || (e.key === 'Enter' && e.target.tagName !== 'BUTTON')) {
      e.preventDefault();
      nextTourStep();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevTourStep();
    }
  });

  // First install check
  const tourCompleted = readStore('faibilo.tour_completed', false);
  if (!tourCompleted && !IS_INCOGNITO) {
    setTimeout(() => {
      startTour(0);
    }, 1200);
  }
}

function initApp() {
  paintStaticIcons();
  sanitizeStoredPages();
  sanitizeFavoriteApps();
  applyAppearance();
  renderLibrary();
  renderFavorites();
  bindSettingForm();
  bindTabsContainerEvents();
  bindPredictiveHover();
  loadNativeSettings();
  updateSidebarVisibility();
  bindSidebarHover();
  initRandomDefaultBrowserPrompt();
  setInterval(checkIdleTabsSweep, 45000);

  if (IS_INCOGNITO) {
    document.body.classList.add('incognito');
    const badge = document.createElement('span');
    badge.className = 'incognito-badge';
    badge.textContent = 'Private';
    document.querySelector('.brand').appendChild(badge);
  }

  createTab(INITIAL_URL || newTabUrl());
  startAmbientSampler();
  bindEmptyTabsView();
  initTour();
  initUpdateSystem();
}

initApp();


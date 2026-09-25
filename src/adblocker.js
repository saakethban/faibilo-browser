/**
 * Faibilo High-Performance Ad, Tracker & Malware Blocker Engine
 * Provides fast O(1) domain lookup, heuristic path filtering, cosmetic CSS rules, and video ad blocker
 */

// Comprehensive ad, tracker, analytics, telemetry, and pop-up network domains
const BLOCKED_DOMAINS = [
  // Google Ads, DoubleClick & Analytics
  'doubleclick.net',
  'googlesyndication.com',
  'google-analytics.com',
  'analytics.google.com',
  'googleadservices.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'pagead2.google.com',
  'partner.googleadservices.com',
  'tpc.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'pubads.g.doubleclick.net',
  'static.doubleclick.net',
  'stats.g.doubleclick.net',
  'ad.doubleclick.net',
  'cm.g.doubleclick.net',
  'fls.doubleclick.net',
  'm.doubleclick.net',
  'adservice.google.co.in',
  'adservice.google.co.uk',
  'adservice.google.ca',
  'adservice.google.de',
  'adservice.google.com.au',
  'googletagmanager.com',
  'googletagservices.com',
  'googleads.github.io',

  // Major Ad Exchanges & Networks
  'adnxs.com',
  'ib.adnxs.com',
  'secure.adnxs.com',
  'adsystem.com',
  'amazon-adsystem.com',
  'aax.amazon-adsystem.com',
  'c.amazon-adsystem.com',
  'fls-na.amazon-adsystem.com',
  'rcm-na.amazon-adsystem.com',
  'criteo.com',
  'criteo.net',
  'static.criteo.net',
  'bidder.criteo.com',
  'cas.criteo.com',
  'rubiconproject.com',
  'fastlane.rubiconproject.com',
  'optimized-by.rubiconproject.com',
  'pubmatic.com',
  'ads.pubmatic.com',
  'gads.pubmatic.com',
  'openx.net',
  'us-u.openx.net',
  'u.openx.net',
  'casalemedia.com',
  'advertising.com',
  'adroll.com',
  'd.adroll.com',
  'outbrain.com',
  'widgets.outbrain.com',
  'taboola.com',
  'trc.taboola.com',
  'cdn.taboola.com',
  'mgid.com',
  'jsc.mgid.com',
  'revcontent.com',
  'trends.revcontent.com',
  'inmobi.com',
  'moatads.com',
  'adform.net',
  'track.adform.net',
  'unityads.unity3d.com',
  'applovin.com',
  'chartboost.com',
  'vungle.com',
  'ironsrc.com',
  'adcolony.com',
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'exoclick.com',
  'main.exoclick.com',
  'trafficjunky.com',
  'juicyads.com',
  'adsterra.com',
  'zergnet.com',
  'bidswitch.net',
  'quantserve.com',
  'pixel.quantserve.com',
  'scorecardresearch.com',
  'sb.scorecardresearch.com',
  'b.scorecardresearch.com',
  'lijit.com',
  'sovrn.com',
  'smartadserver.com',
  'teads.tv',
  'media.net',
  'contextual.media.net',
  'exponential.com',
  'tribalfusion.com',
  'yieldmo.com',
  'ads.yieldmo.com',
  'sharethrough.com',
  'triplelift.com',
  'ib.3lift.com',
  'gumgum.com',
  'adblade.com',
  'undertone.com',
  'conversantmedia.com',
  'ad-delivery.net',
  'adlightning.com',
  'adpushup.com',
  'adrecover.com',
  'ezoic.net',
  'monetizemore.com',
  'indexexchange.com',
  'contextweb.com',
  'bidtheatre.com',
  'sonobi.com',
  'districtm.io',
  'smaato.net',
  'yieldlab.net',
  'spotxchange.com',
  'innovid.com',
  'tremorhub.com',
  'flashtalking.com',
  'serving-sys.com',
  'bs.serving-sys.com',
  'adtechus.com',
  'adbrite.com',
  'chango.com',
  'turn.com',
  'bluekai.com',
  'tags.bluekai.com',
  'krxd.net',
  'cdn.krxd.net',
  'eyeota.net',
  'demdex.net',
  'dpm.demdex.net',
  'agkn.com',
  'rlcdn.com',
  'adsrvr.org',
  'match.adsrvr.org',
  'adition.com',
  'ad-stir.com',
  'adkernel.com',
  'adsco.re',
  'clickadu.com',
  'hilltopads.com',
  'richaudience.com',
  'vi-serve.com',
  'streamrail.com',
  'aniview.com',
  'zedo.com',
  'admob.com',
  'buysellads.com',
  'carbonads.net',
  'srv.carbonads.net',
  'adzerk.net',
  'adview.com',
  'yieldpartner.com',
  'adnexus.net',
  'admarvel.com',
  'infolinks.com',
  'chitika.net',
  'bidvertiser.com',
  'clicksor.com',
  'adcash.com',
  'yllix.com',
  'trafficfactory.biz',
  'ero-advertising.com',
  'content.ad',
  'nativo.com',
  'plista.com',
  'fyber.com',
  'mintegral.com',
  'tapjoy.com',
  'adtrue.com',
  'adoperator.com',
  'propellerclick.com',
  'onclickads.net',
  'onclickpredictiv.com',
  'popmyads.com',
  'plugrush.com',
  'adbuffs.com',
  'adflex.io',
  'adpushup.net',

  // Telemetry, Trackers, Profilers & Beacons
  'hotjar.com',
  'static.hotjar.com',
  'script.hotjar.com',
  'segment.io',
  'cdn.segment.com',
  'api.segment.io',
  'segment.com',
  'facebook.net',
  'connect.facebook.net',
  'bat.bing.com',
  'mixpanel.com',
  'api.mixpanel.com',
  'amplitude.com',
  'api.amplitude.com',
  'fullstory.com',
  'rs.fullstory.com',
  'mouseflow.com',
  'crazyegg.com',
  'script.crazyegg.com',
  'clarity.ms',
  'www.clarity.ms',
  'c.clarity.ms',
  'newrelic.com',
  'nr-data.net',
  'heapanalytics.com',
  'optimizely.com',
  'luckyorange.com',
  'statcounter.com',
  'clicky.com',
  'mc.yandex.ru',
  'yandex.ru/metrika',
  'branch.io',
  'api.branch.io',
  'appsflyer.com',
  'adjust.com',
  'kochava.com',
  'singular.net',
  'bugsnag.com',
  'sentry.io',
  'telemetry.desktop.services.mozilla.com',
  'in.appcenter.ms',

  // Video Streaming Ad Servers
  'ad4m.at',
  'innovid.com',
  'brightroll.com',
  'smartclip.net',
  'videologygroup.com',
  'stickyads.tv',
  'springserve.com',
  'telaria.com',
  'unruly.co',
  'kargo.com',
  'loopme.com',
  'ogury.com',
  'vidoomy.com',

  // Crypto miners
  'coinhive.com',
  'coin-hive.com',
  'jsecoin.com',
  'crypto-loot.com',
  'webminepool.com'
];

// Pre-build Set for O(1) direct lookup
const BLOCKED_DOMAINS_SET = new Set(BLOCKED_DOMAINS.map(d => d.toLowerCase()));

// Heuristic keyword markers in hostnames
const AD_HOST_KEYWORDS = [
  'adserver',
  'adservice',
  'adsystem',
  'adnetwork',
  'doubleclick',
  'googlesyndication',
  'pagead',
  'adnxs',
  'adtech',
  'advertising',
  'trackers',
  'telemetry'
];

// Common ad URL path patterns & video ad markers
const BLOCKED_PATH_PATTERNS = [
  /\/pagead\//i,
  /\/googleads\//i,
  /\/adservice\//i,
  /\/ad_display\//i,
  /\/adserver\//i,
  /\/popunder/i,
  /\/banner_ads?\//i,
  /\/ad-banners?\//i,
  /\/api\/stats\/ads/i,
  /\/pagead\/parallel_playback/i,
  /\/get_midroll_info/i,
  /\/ptracking/i,
  /\/videoplayback\?.*adformat=/i,
  /\/videoplayback\?.*signatureads=/i,
  /partner\.googleadservices\.com/i,
  /doubleclick\.net\/pagead/i,
  /googleads\.g\.doubleclick\.net/i,
  /adclick\.g/i,
  /safeframe\.googlesyndication\.com/i
];

// Dedicated popup and popunder network domains
const POPUP_DOMAINS = [
  'popads.net',
  'serve.popads.net',
  'popcash.net',
  'propellerads.com',
  'propeller-tracking.com',
  'exoclick.com',
  'syndication.exoclick.com',
  'adsterra.com',
  'clickadu.com',
  'hilltopads.com',
  'juicyads.com',
  'revenuehits.com',
  'bidvertiser.com',
  'yllix.com',
  'monetag.com',
  'ad-maven.com',
  'admaven.com',
  'richads.com',
  'trafficstars.com',
  'adxad.com',
  'clicksor.com',
  'adcash.com',
  'infolinks.com',
  'popmyads.com',
  'onclickads.net',
  'onclickpredictiv.com',
  'onclickmega.com',
  'clksite.com',
  'realsrv.com',
  'syndication.realsrv.com',
  'plugrush.com',
  'adbuffs.com',
  'deloton.com',
  'galaksion.com',
  'rollerads.com',
  'evadav.com',
  'clickaine.com',
  'ezmob.com',
  'adtrue.com',
  'bidgear.com',
  'trafficjunky.com',
  'trafficfactory.biz'
];
const POPUP_DOMAINS_SET = new Set(POPUP_DOMAINS);

const POPUP_PATH_PATTERNS = [
  /\/popunder/i,
  /\/popup/i,
  /\bpop_?(up|under)\b/i,
  /\/click\.php\?/i,
  /\/jump\//i,
  /\/redirect\?/i,
  /\/trk\?/i,
  /\/track\?/i,
  /\/aff_c\?/i,
  /\/adclick/i,
  /[?&]click_id=/i,
  /[?&]aff_id=/i,
  /[?&]campaign_id=/i,
  /[?&]pop_id=/i,
  /[?&]traffic_source=/i
];

/**
 * Fast O(subdomains) lookup to check if a hostname is an ad/tracker domain
 */
function isBlockedHost(host) {
  if (!host) return false;
  const lower = host.toLowerCase();

  // Direct exact match O(1)
  if (BLOCKED_DOMAINS_SET.has(lower) || POPUP_DOMAINS_SET.has(lower)) return true;

  // Domain suffix lookup (e.g. "sub.doubleclick.net" -> "doubleclick.net")
  const parts = lower.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (BLOCKED_DOMAINS_SET.has(parent) || POPUP_DOMAINS_SET.has(parent)) {
      return true;
    }
  }

  // Heuristic subdomain/host keywords check
  for (let i = 0; i < AD_HOST_KEYWORDS.length; i++) {
    if (lower.includes(AD_HOST_KEYWORDS[i])) {
      return true;
    }
  }

  return false;
}

// High-speed URL check cache
const URL_RESULT_CACHE = new Map();
const MAX_CACHE_ENTRIES = 2000;

function fastExtractHostAndPath(url) {
  const protocolEnd = url.indexOf('://');
  if (protocolEnd === -1) return { host: '', pathAndQuery: '' };
  const start = protocolEnd + 3;
  let end = url.indexOf('/', start);
  let pathAndQuery = '';
  if (end === -1) {
    end = url.indexOf('?', start);
    if (end === -1) {
      end = url.indexOf('#', start);
      if (end === -1) end = url.length;
    }
  } else {
    pathAndQuery = url.slice(end);
  }
  let host = url.slice(start, end);
  const colon = host.indexOf(':');
  if (colon !== -1) host = host.slice(0, colon);
  return { host: host.toLowerCase(), pathAndQuery };
}

/**
 * Fast check if an entire URL matches ad rules (domain or path)
 * Supports whitelist domains, custom block rules, and high-speed in-memory caching
 */
function isBlockedUrl(url, options = {}) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;

  const hasCustomOptions = (options.whitelistedDomains && options.whitelistedDomains.length > 0) ||
                           (options.customBlockRules && options.customBlockRules.length > 0);

  if (!hasCustomOptions && URL_RESULT_CACHE.has(url)) {
    return URL_RESULT_CACHE.get(url);
  }

  const { host: lowerHost, pathAndQuery } = fastExtractHostAndPath(url);
  if (!lowerHost) return false;

  // Never block Cloudflare security challenge, Turnstile, or CAPTCHA verification resources
  if (
    lowerHost === 'challenges.cloudflare.com' ||
    lowerHost.endsWith('.challenges.cloudflare.com') ||
    lowerHost === 'cloudflarechallenges.com' ||
    lowerHost.endsWith('.cloudflarechallenges.com') ||
    lowerHost === 'static.cloudflareinsights.com' ||
    lowerHost === 'cloudflareinsights.com' ||
    lowerHost === 'hcaptcha.com' ||
    lowerHost.endsWith('.hcaptcha.com') ||
    lowerHost === 'recaptcha.net' ||
    lowerHost.endsWith('.recaptcha.net') ||
    lowerHost === 'arkoselabs.com' ||
    lowerHost.endsWith('.arkoselabs.com') ||
    lowerHost === 'funcaptcha.com' ||
    lowerHost.endsWith('.funcaptcha.com') ||
    lowerHost === 'geetest.com' ||
    lowerHost.endsWith('.geetest.com') ||
    (pathAndQuery && (
      pathAndQuery.includes('/cdn-cgi/challenge-platform/') ||
      pathAndQuery.includes('/cdn-cgi/bm/') ||
      pathAndQuery.includes('/cdn-cgi/rum') ||
      pathAndQuery.includes('/cdn-cgi/trace') ||
      pathAndQuery.includes('/cdn-cgi/zaraz/') ||
      pathAndQuery.includes('/recaptcha/')
    ))
  ) {
    return false;
  }

  // 0. Whitelist check (both target host and initiator host)
  if (Array.isArray(options.whitelistedDomains) && options.whitelistedDomains.length > 0) {
    let initiatorHost = '';
    if (options.initiator) {
      try {
        initiatorHost = new URL(options.initiator).hostname.toLowerCase();
      } catch {}
    }
    for (let i = 0; i < options.whitelistedDomains.length; i++) {
      const white = options.whitelistedDomains[i];
      if (white) {
        const w = white.toLowerCase();
        if (lowerHost === w || lowerHost.endsWith('.' + w)) {
          return false;
        }
        if (initiatorHost && (initiatorHost === w || initiatorHost.endsWith('.' + w))) {
          return false;
        }
      }
    }
  }

  // 1. Custom block rules check
  if (Array.isArray(options.customBlockRules) && options.customBlockRules.length > 0) {
    for (let i = 0; i < options.customBlockRules.length; i++) {
      const rule = options.customBlockRules[i];
      if (rule && (lowerHost.includes(rule) || url.toLowerCase().includes(rule))) {
        return true;
      }
    }
  }

  // 2. Check hostname against domain database & heuristics
  if (isBlockedHost(lowerHost)) {
    if (!hasCustomOptions) {
      if (URL_RESULT_CACHE.size >= MAX_CACHE_ENTRIES) URL_RESULT_CACHE.clear();
      URL_RESULT_CACHE.set(url, true);
    }
    return true;
  }

  // 3. Check path & query patterns
  if (pathAndQuery) {
    for (let i = 0; i < BLOCKED_PATH_PATTERNS.length; i++) {
      if (BLOCKED_PATH_PATTERNS[i].test(pathAndQuery)) {
        if (!hasCustomOptions) {
          if (URL_RESULT_CACHE.size >= MAX_CACHE_ENTRIES) URL_RESULT_CACHE.clear();
          URL_RESULT_CACHE.set(url, true);
        }
        return true;
      }
    }
  }

  if (!hasCustomOptions) {
    if (URL_RESULT_CACHE.size >= MAX_CACHE_ENTRIES) URL_RESULT_CACHE.clear();
    URL_RESULT_CACHE.set(url, false);
  }

  return false;
}

/**
 * Fast check if an unprompted/new-window URL is a popup, popunder, or click-jacking redirect
 */
function isPopupUrl(url, options = {}) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const lowerHost = parsed.hostname.toLowerCase();

  // Never block Cloudflare security challenge, Turnstile, or verification resources
  if (
    lowerHost === 'challenges.cloudflare.com' ||
    lowerHost.endsWith('.challenges.cloudflare.com') ||
    lowerHost === 'cloudflarechallenges.com' ||
    lowerHost.endsWith('.cloudflarechallenges.com') ||
    lowerHost === 'static.cloudflareinsights.com' ||
    lowerHost === 'cloudflareinsights.com' ||
    lowerHost === 'hcaptcha.com' ||
    lowerHost.endsWith('.hcaptcha.com') ||
    lowerHost === 'recaptcha.net' ||
    lowerHost.endsWith('.recaptcha.net') ||
    parsed.pathname.includes('/cdn-cgi/challenge-platform/') ||
    parsed.pathname.includes('/cdn-cgi/bm/') ||
    parsed.pathname.includes('/cdn-cgi/rum')
  ) {
    return false;
  }

  // Whitelist check
  if (Array.isArray(options.whitelistedDomains)) {
    for (const white of options.whitelistedDomains) {
      if (white && (lowerHost === white.toLowerCase() || lowerHost.endsWith('.' + white.toLowerCase()))) {
        return false;
      }
    }
  }

  // Custom block rules
  if (Array.isArray(options.customBlockRules)) {
    for (const rule of options.customBlockRules) {
      if (rule && (lowerHost.includes(rule.toLowerCase()) || parsed.href.toLowerCase().includes(rule.toLowerCase()))) {
        return true;
      }
    }
  }

  // Check popup domains directly
  if (POPUP_DOMAINS_SET.has(lowerHost)) return true;
  for (const domain of POPUP_DOMAINS_SET) {
    if (lowerHost.endsWith('.' + domain)) return true;
  }

  // Check against general adblock host
  if (isBlockedHost(lowerHost)) return true;

  // Check path and query patterns
  const pathAndQuery = parsed.pathname + parsed.search + parsed.hash;
  for (let i = 0; i < POPUP_PATH_PATTERNS.length; i++) {
    if (POPUP_PATH_PATTERNS[i].test(pathAndQuery)) {
      return true;
    }
  }

  return false;
}

/**
 * High-performance cosmetic stylesheet injected into guest webviews
 * Hides empty banner boxes, sponsored elements, and floating ad overlays
 */
const COSMETIC_AD_BLOCK_CSS = `
  /* Generic Ad Banners, Units and Placeholders */
  .adsbygoogle,
  [id^="google_ads_"],
  [id^="div-gpt-ad"],
  [id^="ad-banner-"],
  [id^="ad_banner_"],
  [id*="adserver"],
  [id*="ad_slot"],
  .ad-container,
  .ad-wrapper,
  .ad-slot,
  .ad-banner,
  .ad-box,
  .ad-unit,
  .ad-zone,
  .ad-placeholder,
  .advertisement,
  .advert,
  .ad_container,
  .ad_wrapper,
  .ad_banner,
  .sponsored-post,
  .sponsored-content,
  .sponsor-block,
  .promoted-tweet,
  .banner-ad,
  .adunit,
  .dfp-ad,
  .gpt-ad,
  .taboola-placeholder,
  .outbrain-placeholder,
  .mgid-ad,
  .revcontent-ad,
  iframe[src*="doubleclick"],
  iframe[src*="googlesyndication"],
  iframe[src*="adnxs"],
  iframe[src*="adsystem"],
  iframe[src*="criteo"],
  iframe[src*="taboola"],
  iframe[src*="outbrain"],
  iframe[src*="smartadserver"],
  iframe[src*="rubiconproject"],
  iframe[src*="yieldmo"],
  iframe[src*="pubmatic"],
  iframe[src*="openx"],
  iframe[id*="google_ads_frame"],
  div[data-ad],
  div[data-ad-unit],
  div[data-ad-slot],
  div[data-ad-name],
  div[data-ad-client],
  div[data-adzone],
  div[data-native-ad],

  /* YouTube Specific Banners & Companion Ads */
  ytd-promoted-sparkles-web-renderer,
  ytd-display-ad-renderer,
  ytd-in-feed-ad-layout-renderer,
  ytd-ad-slot-renderer,
  ytd-player-legacy-desktop-watch-ads-renderer,
  ytd-action-companion-ad-renderer,
  ytd-banner-promo-renderer,
  #masthead-ad,
  .ytd-statement-banner-renderer,
  .ytp-ad-image-overlay,
  .ytp-ad-text-overlay,

  /* Reddit / Twitter / Social Sponsored Items */
  shreddit-ad-post,
  [data-testid="placementTracking"],
  [data-adclicklocation],

  /* Anti-Adblock Overlays & Blockers */
  .adblock-overlay,
  #adblock-modal,
  .fc-ab-root,
  .sp_veil {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    min-height: 0 !important;
    max-height: 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    max-width: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
  }
`;

module.exports = {
  isBlockedHost,
  isBlockedUrl,
  isPopupUrl,
  COSMETIC_AD_BLOCK_CSS,
  BLOCKED_DOMAINS,
  POPUP_DOMAINS
};

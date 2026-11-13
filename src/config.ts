/**
 * App settings in one place. Change here, rebuild, redeploy.
 * Empty strings are allowed everywhere below: the matching button or feature is simply hidden
 * (or falls back to WhatsApp), so the app never shows a dead link.
 */
export const CONFIG = {
  /**
   * Developer WhatsApp number, international format without "+" or spaces (e.g. '201001234567').
   * Used by "ابعت رأيك" and "دردش معايا". Empty = WhatsApp opens and the user picks who to send to,
   * and the "chat with me directly" option is hidden. The number will be visible in the public code.
   */
  feedbackWhatsapp: '201093633697',
  /**
   * Google Apps Script web-app URL (ends with /exec) — see cloud/README.md.
   * Empty = sign-up stays on the phone only, and messages go through WhatsApp instead.
   */
  sheetsEndpoint:
    'https://script.google.com/macros/s/AKfycbyxs_IGBSHXBLXlswnGbgLooNDWTkhaOB8FvTC8zcoiVdkhUCg5d6uCwrrZz_h_EdYqfA/exec',
  /**
   * "ادخل بحساب Gmail": the *Web application* OAuth client ID from Google Cloud Console
   * (ends with .apps.googleusercontent.com) — the same ID works for the web and Android.
   * Steps in cloud/README.md. Empty = the Gmail button is hidden and sign-up stays as it is.
   */
  googleClientId: '',
  /**
   * "سوق طيور في بيتي". Products and their links live in src/data/affiliateProducts.ts.
   * The market shows up only when at least one product has a link (or WhatsApp ordering).
   */
  market: {
    /** WhatsApp number that receives orders. Empty = feedbackWhatsapp. */
    whatsapp: '',
    /** Discount code written in every WhatsApp order message. Empty = no code line. */
    discountCode: 'BEITY',
    /** "متابعة خاصة لطيور بيتك VIP" card (a WhatsApp request). */
    vip: true,
  },
  /** Public link of the web app (used in the share message). */
  appUrl: 'https://seniormohammed1995-hue.github.io/morabbi/',
  /** GitHub repository that builds the Android APK (owner/name). */
  githubRepo: 'seniormohammed1995-hue/morabbi',
  /**
   * Google Play page, once the app is published there (see PLAY_STORE.md). When set, the web
   * "download for Android" card opens Play instead of the GitHub APK. Empty = GitHub APK.
   */
  playStoreUrl: '',
  /** APK file name attached to each GitHub release by .github/workflows/build-android.yml. */
  apkName: 'morabbi-v3.apk',
  developer: {
    name: 'محمد علي',
    nameEn: 'Mohamed Ali',
    /** Full page links. Empty = the button is hidden. */
    facebook: '',
    youtube: '',
    github: 'https://github.com/seniormohammed1995-hue',
  },
  /** Shown in "إيه الجديد" once per version (major.minor). */
  releaseKey: '3.2',
} as const

export const APP_VERSION: string = __APP_VERSION__

/** Direct download of the newest APK (GitHub serves the latest release's asset at this stable URL). */
export const APK_URL = `https://github.com/${CONFIG.githubRepo}/releases/latest/download/${CONFIG.apkName}`
/** Privacy policy and data-deletion pages (served from public/, also linked on Google Play). */
export const PRIVACY_URL = `${CONFIG.appUrl}privacy.html`
export const DELETE_DATA_URL = `${CONFIG.appUrl}delete-data.html`
export const RELEASES_URL = `https://github.com/${CONFIG.githubRepo}/releases/latest`

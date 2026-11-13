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
  sheetsEndpoint: 'https://script.google.com/macros/s/AKfycbyxs_IGBSHXBLXlswnGbgLooNDWTkhaOB8FvTC8zcoiVdkhUCg5d6uCwrrZz_h_EdYqfA/exec',
  /** Public link of the web app (used in the share message). */
  appUrl: 'https://seniormohammed1995-hue.github.io/morabbi/',
  /** GitHub repository that builds the Android APK (owner/name). */
  githubRepo: 'seniormohammed1995-hue/morabbi',
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
  releaseKey: '3.0',
} as const

export const APP_VERSION: string = __APP_VERSION__

/** Direct download of the newest APK (GitHub serves the latest release's asset at this stable URL). */
export const APK_URL = `https://github.com/${CONFIG.githubRepo}/releases/latest/download/${CONFIG.apkName}`
export const RELEASES_URL = `https://github.com/${CONFIG.githubRepo}/releases/latest`

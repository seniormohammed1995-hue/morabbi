/**
 * Trial settings in one place. Change here, rebuild, redeploy.
 */
export const CONFIG = {
  /**
   * WhatsApp number that receives feedback, international format without "+" or spaces
   * (e.g. '201001234567'). Empty = WhatsApp opens and the tester picks who to send to.
   * The number will be visible in the public code.
   */
  feedbackWhatsapp: '',
  /** Shown in "إيه الجديد" once per version (major.minor). */
  releaseKey: '2.0',
} as const

export const APP_VERSION: string = __APP_VERSION__

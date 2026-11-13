import { Capacitor } from '@capacitor/core'

/**
 * Android (Capacitor) side of the platform layer. Plugins are imported lazily so the
 * web build never loads them.
 */

export const isNative = (): boolean => Capacitor.isNativePlatform()

export const platformName = (): 'web' | 'android' =>
  Capacitor.getPlatform() === 'android' ? 'android' : 'web'

const CHANNEL = 'reminders'

export interface DailyNotification {
  id: number
  title: string
  body: string
  hour: number
  minute: number
}

async function ln() {
  return (await import('@capacitor/local-notifications')).LocalNotifications
}

export const nativeNotifications = {
  async permission(): Promise<'granted' | 'denied' | 'default'> {
    const p = await (await ln()).checkPermissions()
    return p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'default'
  },
  async request(): Promise<'granted' | 'denied' | 'default'> {
    const p = await (await ln()).requestPermissions()
    return p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'default'
  },
  async ensureChannel(): Promise<void> {
    await (
      await ln()
    ).createChannel({
      id: CHANNEL,
      name: 'تذكيرات الطيور',
      description: 'المية والأكل وأخبار القطيع',
      importance: 4,
      visibility: 1,
      vibration: true,
    })
  },
  /** Shows one notification now. */
  async showNow(id: number, title: string, body: string): Promise<void> {
    await (
      await ln()
    ).schedule({
      notifications: [{ id, title, body, channelId: CHANNEL, schedule: { at: new Date(Date.now() + 1000) } }],
    })
  },
  /**
   * Replaces every repeating reminder with the given daily ones. They fire even when the
   * app is closed (AlarmManager), and survive reboots.
   */
  async replaceDaily(items: DailyNotification[], keepIds: (id: number) => boolean): Promise<void> {
    const plugin = await ln()
    const pending = await plugin.getPending()
    const stale = pending.notifications.filter((n) => keepIds(n.id))
    if (stale.length) await plugin.cancel({ notifications: stale.map((n) => ({ id: n.id })) })
    if (!items.length) return
    await plugin.schedule({
      notifications: items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        channelId: CHANNEL,
        schedule: { on: { hour: n.hour, minute: n.minute }, allowWhileIdle: true },
      })),
    })
  },
  /** Opens a route when the user taps a reminder. */
  async onTap(handler: (id: number) => void): Promise<void> {
    await (
      await ln()
    ).addListener('localNotificationActionPerformed', (e) => handler(e.notification.id))
  },
}

/** Android hardware back button: go back in the app, exit on the home screen. */
export async function wireBackButton(): Promise<void> {
  if (!isNative()) return
  const { App } = await import('@capacitor/app')
  await App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && window.location.hash && window.location.hash !== '#/') window.history.back()
    else void App.exitApp()
  })
}

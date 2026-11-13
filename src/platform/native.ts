import { Capacitor } from '@capacitor/core'

/**
 * Android (Capacitor) side of the platform layer. Plugins are imported lazily so the
 * web build never loads them.
 */

export const isNative = (): boolean => Capacitor.isNativePlatform()

export const platformName = (): 'web' | 'android' =>
  Capacitor.getPlatform() === 'android' ? 'android' : 'web'

const CHANNEL = 'reminders'
/** Action buttons on a reminder: "done" and "remind me later". */
const ACTIONS = 'care'

export interface DailyNotification {
  id: number
  title: string
  body: string
  hour: number
  minute: number
}

/** A notification that fires once at a given time. */
export interface TimedNotification {
  id: number
  title: string
  body: string
  at: Date
}

export type NotificationAction = 'tap' | 'done' | 'snooze'

export interface NotificationTap {
  id: number
  action: NotificationAction
  title: string
  body: string
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
  /** Channel and the two action buttons. `labels` are the button texts. */
  async ensureChannel(labels?: { done: string; snooze: string }): Promise<void> {
    const plugin = await ln()
    await plugin.createChannel({
      id: CHANNEL,
      name: 'تذكيرات الطيور',
      description: 'المية والأكل والحرارة ومتابعة الطيور',
      importance: 4,
      visibility: 1,
      vibration: true,
    })
    if (labels)
      await plugin.registerActionTypes({
        types: [
          {
            id: ACTIONS,
            actions: [
              { id: 'done', title: labels.done },
              { id: 'snooze', title: labels.snooze },
            ],
          },
        ],
      })
  },
  /** Shows one notification now. */
  async showNow(id: number, title: string, body: string): Promise<void> {
    await (
      await ln()
    ).schedule({
      notifications: [
        { id, title, body, channelId: CHANNEL, schedule: { at: new Date(Date.now() + 1000) } },
      ],
    })
  },
  /**
   * Replaces every notification the app scheduled (ids for which `ours` is true) with the given
   * daily repeating ones and one-off timed ones. They fire even when the app is closed
   * (AlarmManager) and survive reboots.
   */
  async replaceAll(
    daily: DailyNotification[],
    timed: TimedNotification[],
    ours: (id: number) => boolean,
  ): Promise<void> {
    const plugin = await ln()
    const pending = await plugin.getPending()
    const stale = pending.notifications.filter((n) => ours(n.id))
    if (stale.length) await plugin.cancel({ notifications: stale.map((n) => ({ id: n.id })) })
    const notifications = [
      ...daily.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        channelId: CHANNEL,
        actionTypeId: ACTIONS,
        schedule: { on: { hour: n.hour, minute: n.minute }, allowWhileIdle: true },
      })),
      ...timed.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        channelId: CHANNEL,
        schedule: { at: n.at, allowWhileIdle: true },
      })),
    ]
    if (notifications.length) await plugin.schedule({ notifications })
  },
  /** Schedules one extra notification (snooze) without touching the others. */
  async scheduleOne(n: TimedNotification, withActions: boolean): Promise<void> {
    await (
      await ln()
    ).schedule({
      notifications: [
        {
          id: n.id,
          title: n.title,
          body: n.body,
          channelId: CHANNEL,
          ...(withActions ? { actionTypeId: ACTIONS } : {}),
          schedule: { at: n.at, allowWhileIdle: true },
        },
      ],
    })
  },
  /** Runs `handler` when the user taps a reminder or one of its buttons. */
  async onTap(handler: (tap: NotificationTap) => void): Promise<void> {
    await (
      await ln()
    ).addListener('localNotificationActionPerformed', (e) =>
      handler({
        id: e.notification.id,
        action: e.actionId === 'done' || e.actionId === 'snooze' ? e.actionId : 'tap',
        title: e.notification.title,
        body: e.notification.body,
      }),
    )
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

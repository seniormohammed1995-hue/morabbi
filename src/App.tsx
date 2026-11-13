import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { BottomNav } from './ui/BottomNav'
import { ToastHost } from './ui/kit'
import { Icon } from './ui/Icon'
import { t } from './i18n'
import { HomeScreen } from './screens/Home'
import { runDailyReminder } from './screens/reminders'
import { ensureV2Setup, onboarding } from './db/birds'
import { runBroodReminders } from './db/broods'
import { refreshWeather } from './store/weather'
import { RULES } from './data/rules'
import { runWeatherAlerts } from './screens/weather/useWeather'
import { WhatsNew } from './screens/WhatsNew'
import { WhatsAppFab } from './screens/v3/parts'
import { flushOutbox, pingUser } from './cloud/client'
import { applyReminders, reminderRoute, webReminderTick } from './reminders'
import { isNative, notifications, wireBackButton } from './platform'

const Onboarding = lazy(() => import('./screens/Onboarding'))
const FlocksScreen = lazy(() => import('./screens/Flocks'))
const FlockDetail = lazy(() => import('./screens/FlockDetail'))
const LogForm = lazy(() => import('./screens/LogForm'))
const CycleScreen = lazy(() => import('./screens/Cycle'))
const Wizard = lazy(() => import('./screens/Wizard'))
const Planner = lazy(() => import('./screens/Planner'))
const Accounts = lazy(() => import('./screens/Accounts'))
const Feeds = lazy(() => import('./screens/Feeds'))
const Health = lazy(() => import('./screens/Health'))
const Library = lazy(() => import('./screens/Library'))
const SpeciesCard = lazy(() => import('./screens/SpeciesCard'))
const Sources = lazy(() => import('./screens/Sources'))
const Settings = lazy(() => import('./screens/Settings'))
const About = lazy(() => import('./screens/About'))
const NotFound = lazy(() => import('./screens/NotFound'))
const GroupDetail = lazy(() => import('./screens/groups/GroupDetail'))
const AddGroup = lazy(() => import('./screens/groups/AddGroup'))
const ProfileCard = lazy(() => import('./screens/groups/ProfileCard'))
const WeatherScreen = lazy(() => import('./screens/weather/WeatherScreen'))
const Tools = lazy(() => import('./screens/tools/Tools'))
const Sick = lazy(() => import('./screens/tools/Sick'))
const Scraps = lazy(() => import('./screens/tools/Scraps'))
const Eggs = lazy(() => import('./screens/tools/Eggs'))
const Brood = lazy(() => import('./screens/tools/Brood'))
const Contact = lazy(() => import('./screens/v3/Contact'))
const Join = lazy(() => import('./screens/v3/Join'))
const Reminders = lazy(() => import('./screens/v3/Reminders'))
const Journal = lazy(() => import('./screens/v3/Journal'))
const Nutrition = lazy(() => import('./screens/v3/Nutrition'))
const Android = lazy(() => import('./screens/v3/Android'))

function UpdateBanner() {
  // The Android app ships its files inside the APK; updates come with a new APK.
  if (isNative()) return null
  return <WebUpdateBanner />
}

function WebUpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div className="no-print fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 bg-ink px-4 py-2 text-bg">
      <span className="font-semibold">{t('update.ready')}</span>
      <button
        type="button"
        className="rounded-lg bg-accent px-3 py-1 font-bold text-ink"
        onClick={() => void updateServiceWorker(true)}
      >
        {t('update.reload')}
      </button>
    </div>
  )
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Loading() {
  return <div className="p-8 text-center text-muted">{t('common.loading')}</div>
}

/** Always-visible "sick bird" button (hidden on the sick screen itself). */
function SickFab() {
  const { pathname } = useLocation()
  if (pathname === '/sick') return null
  return (
    <Link
      to="/sick"
      className="no-print fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] start-3 z-30 flex min-h-12 items-center gap-2 rounded-full bg-danger px-4 font-bold text-white shadow-lg"
    >
      <Icon name="medkit" size={20} />
      {t('tools.sick')}
    </Link>
  )
}

/** Weather refresh on open, when the app comes back to the foreground, and every few hours. */
function useWeatherLoop() {
  useEffect(() => {
    const tick = () => void refreshWeather().then(() => runWeatherAlerts())
    tick()
    const timer = setInterval(tick, RULES.weatherRefreshHours * 3_600_000)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', tick)
    }
  }, [])
}

/**
 * v3: reminders (Android schedules them; the web checks every minute while open),
 * the cloud outbox (sent on start, when back online and every few minutes) and the back button.
 */
function useV3Loop() {
  const nav = useNavigate()
  useEffect(() => {
    void notifications.init().then(() => applyReminders())
    void wireBackButton()
    notifications.onTap((id) => nav(reminderRoute(id)))
    const sync = () => void pingUser().then(() => flushOutbox())
    sync()
    void webReminderTick()
    const minute = setInterval(() => void webReminderTick(), 60_000)
    const outbox = setInterval(sync, 5 * 60_000)
    window.addEventListener('online', sync)
    return () => {
      clearInterval(minute)
      clearInterval(outbox)
      window.removeEventListener('online', sync)
    }
  }, [nav])
}

function MainApp() {
  useWeatherLoop()
  useV3Loop()
  useEffect(() => {
    void runDailyReminder()
    void runBroodReminders()
  }, [])
  return (
    <>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/weather" element={<WeatherScreen />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/sick" element={<Sick />} />
          <Route path="/scraps" element={<Scraps />} />
          <Route path="/eggs" element={<Eggs />} />
          <Route path="/brood" element={<Brood />} />
          <Route path="/birds" element={<AddGroup />} />
          <Route path="/birds/profile/:id" element={<ProfileCard />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/flocks" element={<FlocksScreen />} />
          <Route path="/flocks/new" element={<Wizard />} />
          <Route path="/flocks/:id" element={<FlockDetail />} />
          <Route path="/flocks/:id/log" element={<LogForm />} />
          <Route path="/flocks/:id/cycle" element={<CycleScreen />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/feeds" element={<Feeds />} />
          <Route path="/health" element={<Health />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/species/:id" element={<SpeciesCard />} />
          <Route path="/library/sources" element={<Sources />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/join" element={<Join />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/android" element={<Android />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <SickFab />
      <WhatsAppFab />
      <BottomNav />
      <WhatsNew />
    </>
  )
}

export function App() {
  // null = checking; v1 users are migrated silently before deciding whether to show onboarding.
  const [onboarded, setOnboarded] = useState<boolean | null>(null)
  useEffect(() => {
    void ensureV2Setup().then(() => setOnboarded(onboarding.done()))
  }, [])
  return (
    <HashRouter>
      <ScrollTop />
      <UpdateBanner />
      {onboarded === null ? (
        <Loading />
      ) : onboarded ? (
        <MainApp />
      ) : (
        <Suspense fallback={<Loading />}>
          <Onboarding onDone={() => setOnboarded(true)} />
        </Suspense>
      )}
      <ToastHost />
    </HashRouter>
  )
}

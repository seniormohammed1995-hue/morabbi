import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { BottomNav } from './ui/BottomNav'
import { Button, Page, ToastHost } from './ui/kit'
import { Icon } from './ui/Icon'
import { t } from './i18n'
import { useUi } from './store/ui'
import { HomeScreen } from './screens/Home'
import { runDailyReminder } from './screens/reminders'

const FlocksScreen = lazy(() => import('./screens/Flocks'))
const FlockDetail = lazy(() => import('./screens/FlockDetail'))
const LogForm = lazy(() => import('./screens/LogForm'))
const CycleScreen = lazy(() => import('./screens/Cycle'))
const Wizard = lazy(() => import('./screens/Wizard'))
const Planner = lazy(() => import('./screens/Planner'))
const Accounts = lazy(() => import('./screens/Accounts'))
const Library = lazy(() => import('./screens/Library'))
const SpeciesCard = lazy(() => import('./screens/SpeciesCard'))
const Sources = lazy(() => import('./screens/Sources'))
const Settings = lazy(() => import('./screens/Settings'))
const NotFound = lazy(() => import('./screens/NotFound'))

function Disclaimer({ children }: { children: ReactNode }) {
  const accepted = useUi((s) => s.disclaimerAccepted)
  const accept = useUi((s) => s.acceptDisclaimer)
  if (accepted) return <>{children}</>
  return (
    <Page className="flex min-h-dvh flex-col justify-center">
      <div className="mx-auto mb-6 grid h-24 w-24 place-items-center overflow-hidden rounded-[28px] shadow-md">
        <img src="icons/icon-192.png" alt="" width={96} height={96} />
      </div>
      <h1 className="text-center text-3xl font-extrabold">{t('app.name')}</h1>
      <p className="mb-6 text-center text-muted">{t('app.tagline')}</p>
      <section className="rounded-2xl border border-warn/30 bg-warn-soft p-4">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-warn">
          <Icon name="alert" /> {t('disclaimer.title')} — {t('app.beta')}
        </h2>
        <p className="leading-relaxed">{t('disclaimer.body')}</p>
      </section>
      <Button className="mt-6" full onClick={accept}>
        {t('disclaimer.accept')}
      </Button>
    </Page>
  )
}

function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div className="no-print fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 bg-ink px-4 py-2 text-bg">
      <span className="font-semibold">{t('update.ready')}</span>
      <button type="button" className="rounded-lg bg-accent px-3 py-1 font-bold text-ink" onClick={() => void updateServiceWorker(true)}>
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

export function App() {
  useEffect(() => {
    void runDailyReminder()
  }, [])
  return (
    <HashRouter>
      <ScrollTop />
      <UpdateBanner />
      <Disclaimer>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/flocks" element={<FlocksScreen />} />
            <Route path="/flocks/new" element={<Wizard />} />
            <Route path="/flocks/:id" element={<FlockDetail />} />
            <Route path="/flocks/:id/log" element={<LogForm />} />
            <Route path="/flocks/:id/cycle" element={<CycleScreen />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/species/:id" element={<SpeciesCard />} />
            <Route path="/library/sources" element={<Sources />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <BottomNav />
      </Disclaimer>
      <ToastHost />
    </HashRouter>
  )
}

import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { t, type MsgKey } from '../i18n'
import { cx } from './kit'

const items: Array<{ to: string; icon: IconName; label: MsgKey; end?: boolean }> = [
  { to: '/', icon: 'home', label: 'nav.home', end: true },
  { to: '/flocks', icon: 'flock', label: 'nav.flocks' },
  { to: '/planner', icon: 'layout', label: 'nav.planner' },
  { to: '/accounts', icon: 'calc', label: 'nav.accounts' },
  { to: '/library', icon: 'book', label: 'nav.library' },
]

export function BottomNav() {
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="التنقل الرئيسي">
      <ul className="mx-auto flex max-w-xl">
        {items.map((it) => (
          <li key={it.to} className="flex-1">
            <NavLink
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cx('flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold', isActive ? 'text-primary' : 'text-muted')
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cx('grid h-8 w-14 place-items-center rounded-full transition', isActive && 'bg-primary-soft')}>
                    <Icon name={it.icon} size={24} />
                  </span>
                  {t(it.label)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

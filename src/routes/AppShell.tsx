import { NavLink, Outlet, useLocation } from 'react-router'
import { Map, CalendarCheck, LayoutDashboard } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { to: '/market-map', label: 'Market Map', icon: Map },
  { to: '/booking', label: 'Booking', icon: CalendarCheck },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function AppShell() {
  const location = useLocation()
  const currentPage = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))
  const { user } = useAuth()

  return (
    <div className="flex h-screen w-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="px-4 py-4 text-lg font-semibold text-slate-800">Market Stall Manager</div>
        <nav className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
          <span className="text-sm font-medium text-slate-700">{currentPage?.label ?? ''}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut(auth)}>
              Sign out
            </Button>
          </div>
        </header>
        <main className="min-h-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

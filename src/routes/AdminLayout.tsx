import { Outlet, NavLink, Link, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Users, PartyPopper,
  UtensilsCrossed, CreditCard, BarChart3, LogOut, ChevronRight, Armchair, UserCog, Image,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { cn, getInitials } from '@/lib/utils'

const navLinks = [
  { to: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.ADMIN.RESERVATIONS, label: 'Reservas', icon: Calendar },
  { to: ROUTES.ADMIN.TABLES, label: 'Mesas', icon: Armchair },
  { to: ROUTES.ADMIN.EMPLOYEES, label: 'Funcionarios', icon: UserCog },
  { to: ROUTES.ADMIN.CLIENTS, label: 'Clientes', icon: Users },
  { to: ROUTES.ADMIN.EVENTS, label: 'Eventos', icon: PartyPopper },
  { to: ROUTES.ADMIN.MENU, label: 'Cardápio', icon: UtensilsCrossed },
  { to: ROUTES.ADMIN.IMAGES, label: 'Imagens', icon: Image },
  { to: ROUTES.ADMIN.PAYMENTS, label: 'Pagamentos', icon: CreditCard },
  { to: ROUTES.ADMIN.REPORTS, label: 'Relatórios', icon: BarChart3 },
]

export function AdminLayout() {
  const { isAuthenticated, user, logout } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }
  if (user?.role !== 'admin') {
    return <Navigate to={ROUTES.CLIENT.DASHBOARD} replace />
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/40 bg-surface fixed inset-y-0">
        <div className="p-5 border-b border-border/40">
          <Link to={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-2">
            <span className="font-display text-lg text-primary">{APP_NAME}</span>
            <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded font-medium">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors group',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )
              }
            >
              <span className="flex items-center gap-3">
                <link.icon className="w-4 h-4" />
                {link.label}
              </span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
              {user ? getInitials(user.name) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Terminar sessão
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

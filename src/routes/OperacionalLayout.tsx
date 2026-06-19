import { Outlet, NavLink, Link, Navigate } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, Wine, Users, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { cn, getInitials } from '@/lib/utils'

const ROLES_OPERACIONAIS = ['chefe_sala', 'chefe_cozinha', 'bar']

const allNavLinks = [
    {
        to: ROUTES.OPERACIONAL.DASHBOARD,
        label: 'Dashboard',
        icon: LayoutDashboard,
        end: true,
        roles: ['chefe_sala', 'chefe_cozinha', 'bar'],
    },
    {
        to: ROUTES.OPERACIONAL.COZINHA,
        label: 'Fluxo Cozinha',
        icon: UtensilsCrossed,
        roles: ['chefe_sala', 'chefe_cozinha'],
    },
    {
        to: ROUTES.OPERACIONAL.BAR,
        label: 'Fluxo Bar',
        icon: Wine,
        roles: ['chefe_sala', 'bar'],
    },
    {
        to: ROUTES.OPERACIONAL.EQUIPA,
        label: 'Equipa',
        icon: Users,
        roles: ['chefe_sala', 'chefe_cozinha', 'bar'],
    },
]

export function OperacionalLayout() {
    const { isAuthenticated, user, logout } = useAuthStore()

    if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
    if (!ROLES_OPERACIONAIS.includes(user?.role ?? '')) {
        return <Navigate to={ROUTES.CLIENT.DASHBOARD} replace />
    }

    const navLinks = allNavLinks.filter((link) => link.roles.includes(user?.role ?? ''))

    return (
        <div className="min-h-screen flex bg-background text-foreground">
            <aside className="hidden lg:flex w-64 flex-col border-r border-border/40 bg-surface fixed inset-y-0">
                <div className="p-5 border-b border-border/40">
                    <Link to={ROUTES.OPERACIONAL.DASHBOARD} className="flex items-center gap-2">
                        <span className="font-display text-lg text-primary">{APP_NAME}</span>
                        <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded font-medium capitalize">
                            {user?.role?.replace('_', ' ')}
                        </span>
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
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                                    isActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                )
                            }
                        >
                            <link.icon className="w-4 h-4" />
                            {link.label}
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
                            <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
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

            <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
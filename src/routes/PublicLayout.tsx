import { Outlet, NavLink, Link } from 'react-router-dom'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { PalaceFooter } from '@/components/ui/palace-footer'

const navLinks = [
  { to: ROUTES.ABOUT, label: 'Sobre' },
  { to: ROUTES.MENU, label: 'Cardápio' },
  { to: '/eventos', label: 'Eventos' },
  { to: ROUTES.GALLERY, label: 'Galeria' },
  { to: ROUTES.CONTACTS, label: 'Contactos' },
]

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <span className="font-display text-xl text-primary tracking-wider">{APP_NAME}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'text-sm tracking-wide transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.LOGIN}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
            <Link
              to={ROUTES.CLIENT.RESERVATIONS}
              className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Reservar
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <PalaceFooter />
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'
import { mockAdminUser, mockClients, mockStaffUser } from '@/data'
import type { UserRole } from '@/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  function handleMockLogin(role: UserRole) {
    const user = role === 'admin' ? mockAdminUser : role === 'staff' ? mockStaffUser : mockClients[0]
    login(user, 'mock-token-' + role)
    navigate(role === 'admin' ? ROUTES.ADMIN.DASHBOARD : role === 'staff' ? ROUTES.SCANNER : ROUTES.CLIENT.DASHBOARD)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl text-primary">{APP_NAME}</h1>
          <p className="text-muted-foreground mt-2 text-sm">Aceda à sua conta</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          {/* Formulário real — Fase 1.4 */}
          <p className="text-xs text-center text-muted-foreground pb-2 border-b border-border">
            Acesso rápido (mock — desenvolvimento)
          </p>

          <button
            onClick={() => handleMockLogin('admin')}
            className="w-full py-2.5 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-medium"
          >
            Entrar como Administrador
          </button>

          <button
            onClick={() => handleMockLogin('client')}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Entrar como Cliente
          </button>

          <button
            onClick={() => handleMockLogin('staff')}
            className="w-full py-2.5 rounded-md border border-border bg-background text-foreground hover:bg-secondary transition-colors text-sm font-medium"
          >
            Entrar como Leitor QR
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to={ROUTES.REGISTER} className="text-primary hover:underline">
            Registar
          </Link>
        </p>
      </div>
    </div>
  )
}

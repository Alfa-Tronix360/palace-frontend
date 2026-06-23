import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'
import { mockAdminUser, mockClients, mockStaffUser } from '@/data'
import type { UserRole } from '@/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const roleRedirect: Record<string, string> = {
    admin: ROUTES.ADMIN.DASHBOARD,
    staff: ROUTES.SCANNER,
    chefe_sala: ROUTES.OPERACIONAL.DASHBOARD,
    chefe_cozinha: ROUTES.OPERACIONAL.COZINHA,
    bar: ROUTES.OPERACIONAL.BAR,
    rececionista: ROUTES.RECECIONISTA.DASHBOARD,
    client: ROUTES.CLIENT.DASHBOARD,
  }

  function handleMockLogin(role: UserRole) {
    const user = role === 'admin' ? mockAdminUser : role === 'staff' ? mockStaffUser : mockClients[0]
    login(user, 'mock-token-' + role)
    navigate(roleRedirect[role] ?? ROUTES.CLIENT.DASHBOARD)
  }

  async function handleRealLogin() {
    if (!email || !senha) return setErro('Preencha o email e a senha')
    setErro('')
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erro ao entrar')
      login(data.user, data.access_token)
      const role = data.user.role



      navigate(roleRedirect[role] ?? ROUTES.CLIENT.DASHBOARD)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl text-primary">{APP_NAME}</h1>
          <p className="text-muted-foreground mt-2 text-sm">Aceda à sua conta</p>
        </div>

        {/* Formulário real */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <p className="text-xs text-center text-muted-foreground pb-2 border-b border-border">
            Entrar com conta real
          </p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRealLogin()}
            className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
          />

          {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}

          <button
            onClick={handleRealLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </div>

        {/* Botões mock */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
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
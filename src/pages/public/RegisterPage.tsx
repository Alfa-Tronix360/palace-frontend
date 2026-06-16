import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react'
import { registerSchema, type RegisterInput } from '@/lib/validators'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { http } from '@/services/api/http'
import type { UserRole } from '@/types'
export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: RegisterInput) => {
    setServerError('')
    try {
      await http.post('/auth/register', {
        nome: data.name,
        email: data.email,
        telefone: data.phone,
        senha: data.password,
      })

      const loginRes = await http.post<unknown, {
        access_token: string
        refresh_token: string
        user: {
          id: string
          name: string
          email: string
          phone: string
          role: UserRole
          vip: boolean
          totalSpent: number
          reservationCount: number
          createdAt: string
        }
      }>('/auth/login', { email: data.email, senha: data.password })

      const user = {
        ...loginRes.user,
        createdAt: new Date(loginRes.user.createdAt),
      }

      login(user, loginRes.access_token)
      navigate(ROUTES.CLIENT.DASHBOARD)
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } }
      const detail = error?.response?.data?.detail
      if (error?.response?.status === 400 && detail) {
        setServerError(detail)
      } else {
        setServerError('Erro ao criar conta. Tente novamente.')
      }
    }
  }
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: '#B89A67' }}>
            Bem-vindo
          </p>
          <h1 className="font-display text-3xl text-primary">{APP_NAME}</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Crie a sua conta e comece a reservar
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            <Field label="Nome completo" error={errors.name?.message}>
              <input
                {...register('name')}
                placeholder="O seu nome"
                autoComplete="name"
                className={inputCls(!!errors.name)}
              />
            </Field>

            <Field label="Email" error={errors.email?.message}>
              <input
                {...register('email')}
                type="email"
                placeholder="email@exemplo.com"
                autoComplete="email"
                className={inputCls(!!errors.email)}
              />
            </Field>

            <Field label="Telefone" error={errors.phone?.message}>
              <input
                {...register('phone')}
                placeholder="+244 9XX XXX XXX"
                autoComplete="tel"
                className={inputCls(!!errors.phone)}
              />
            </Field>

            <Field label="Palavra-passe" error={errors.password?.message}>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className={cn(inputCls(!!errors.password), 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <Field label="Confirmar palavra-passe" error={errors.confirmPassword?.message}>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repita a palavra-passe"
                  autoComplete="new-password"
                  className={cn(inputCls(!!errors.confirmPassword), 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {/* Benefits */}
            <div className="rounded-lg border border-border/50 bg-background p-3 space-y-1.5">
              {['Reservas online em segundos', 'Histórico de visitas e avaliações', 'Programa de benefícios VIP'].map(b => (
                <div key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#3E8E63' }} />
                  {b}
                </div>
              ))}
            </div>

            {serverError && (
              <p className="text-sm text-danger text-center">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: '#D9D0B5', color: '#181818' }}
            >
              {isSubmitting
                ? <span className="w-4 h-4 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
                : <><UserPlus className="w-4 h-4" /> Criar Conta</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const inputCls = (hasError: boolean) => cn(
  'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground',
  'placeholder:text-muted-foreground/60 outline-none transition-colors',
  'focus:border-primary focus:ring-1 focus:ring-primary/30',
  hasError ? 'border-danger' : 'border-border'
)

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

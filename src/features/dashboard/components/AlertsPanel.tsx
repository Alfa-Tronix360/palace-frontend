import { Link } from 'react-router-dom'
import { AlertCircle, Clock, CreditCard } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { reservationsAdapter } from '@/services/adapters/reservations.adapter'
import { paymentsAdapter } from '@/services/adapters/payments.adapter'

export function AlertsPanel() {
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationsAdapter.getAll(),
  })

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsAdapter.getAll(),
  })

  const pending = reservations.filter(r => r.status === 'pending').slice(0, 3)
  const unpaid = payments.filter(p => p.status === 'pending').slice(0, 2)

  const total = pending.length + unpaid.length
  if (total === 0) return null

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-4 h-4 text-warning" />
        <p className="text-sm font-semibold text-foreground">
          {total} ite{total === 1 ? 'm' : 'ns'} a requerer atenção
        </p>
      </div>

      {pending.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Reservas Pendentes
          </p>
          {pending.map(r => (
            <div key={r.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-foreground">{r.clientName}</span>
              <span className="text-xs text-muted-foreground">{formatDate(r.date)} {r.time}</span>
            </div>
          ))}
          <Link to={ROUTES.ADMIN.RESERVATIONS} className="text-xs text-primary hover:underline mt-1 block">
            Gerir reservas →
          </Link>
        </div>
      )}

      {unpaid.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Pagamentos por Confirmar
          </p>
          {unpaid.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-foreground">{p.clientName}</span>
              <span className="text-xs text-accent font-medium">{(p.amount / 1000).toFixed(0)}K AOA</span>
            </div>
          ))}
          <Link to={ROUTES.ADMIN.PAYMENTS} className="text-xs text-primary hover:underline mt-1 block">
            Confirmar pagamentos →
          </Link>
        </div>
      )}
    </div>
  )
}
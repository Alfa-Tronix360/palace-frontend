import { Link } from 'react-router-dom'
import { Calendar, Clock, PartyPopper, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES, EVENT_STATUS_LABELS, RESERVATION_STATUS_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { useClientEvents, useClientReservations } from '@/features/client/hooks/useClientArea'

export default function ClientDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const reservations = useClientReservations(user?.id)
  const events = useClientEvents(user?.id)

  const nextReservation = reservations.data?.find((reservation) => {
    const today = new Date(new Date().toDateString())
    return reservation.status !== 'cancelled' && reservation.status !== 'completed' && new Date(reservation.date) >= today
  })
  const latestEvent = events.data?.[0]

  const actions = [
    { label: 'Reservar mesa', to: ROUTES.CLIENT.RESERVATIONS, icon: Plus, desc: 'Escolher data, horario e mesa' },
    { label: 'Meus eventos', to: ROUTES.CLIENT.EVENTS, icon: PartyPopper, desc: 'Solicitar ou acompanhar eventos' },
    { label: 'Perfil', to: ROUTES.CLIENT.PROFILE, icon: User, desc: 'Dados pessoais e beneficios' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary">
            Bem-vindo, {user?.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {user?.vip ? 'Cliente VIP. As suas experiencias Palace num so lugar.' : 'Gerir reservas, eventos e perfil.'}
          </p>
        </div>
        <Button asChild>
          <Link to={ROUTES.CLIENT.RESERVATIONS}>
            <Calendar className="h-4 w-4" />
            Nova reserva
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Proxima reserva</h2>
            <Link to={ROUTES.CLIENT.RESERVATIONS} className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>

          {reservations.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">A carregar reservas...</p>
          ) : nextReservation ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-medium">{formatDate(nextReservation.date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Horario</p>
                <p className="font-medium">{nextReservation.time}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="font-medium">{RESERVATION_STATUS_LABELS[nextReservation.status]}</p>
              </div>
              <div className="sm:col-span-3 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                Mesa {nextReservation.tableNumber} para {nextReservation.guests} pessoa(s)
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nao existem reservas futuras.</p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Resumo VIP</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reservas</span>
              <span className="font-medium">{user?.reservationCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoria</span>
              <span className="font-medium text-accent">{user?.vip ? 'VIP' : 'Cliente'}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Atendimento prioritario para pedidos especiais.
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/50"
          >
            <action.icon className="mb-3 h-6 w-6 text-primary" />
            <p className="font-medium text-foreground">{action.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{action.desc}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Evento recente</h2>
          <Link to={ROUTES.CLIENT.EVENTS} className="text-sm text-primary hover:underline">
            Ver eventos
          </Link>
        </div>

        {latestEvent ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4">
            <div>
              <p className="font-medium">{latestEvent.code}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(latestEvent.date)} | {latestEvent.guests} convidados
              </p>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {EVENT_STATUS_LABELS[latestEvent.status]}
            </span>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Nenhum pedido de evento recente.</p>
        )}
      </section>
    </div>
  )
}

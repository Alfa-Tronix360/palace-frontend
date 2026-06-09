import { Star, UserRound } from 'lucide-react'
import { mockReviews } from '@/data/mock-reviews'
import { useAuthStore } from '@/store/auth.store'
import { RESERVATION_STATUS_LABELS, VIP_THRESHOLD_AOA } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useClientReservations } from '@/features/client/hooks/useClientArea'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-accent">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={index < rating ? 'h-4 w-4 fill-current' : 'h-4 w-4 opacity-30'} />
      ))}
    </span>
  )
}

export default function ClientProfilePage() {
  const user = useAuthStore((state) => state.user)
  const reservations = useClientReservations(user?.id)
  const reviews = user ? mockReviews.filter((review) => review.clientId === user.id) : []
  const progress = user ? Math.min(100, Math.round((user.totalSpent / VIP_THRESHOLD_AOA) * 100)) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dados pessoais, beneficios e historico Palace.</p>
      </div>

      {user && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-xl border border-border bg-surface p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <UserRound className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {user.vip && (
                  <span className="ml-auto rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                    Cliente VIP
                  </span>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliente desde</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total gasto</p>
                  <p className="font-medium text-accent">{formatCurrency(user.totalSpent)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reservas registadas</p>
                  <p className="font-medium">{user.reservationCount}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-semibold">Historico de reservas</h2>
              <div className="mt-4 space-y-3">
                {reservations.isLoading ? (
                  <p className="text-sm text-muted-foreground">A carregar historico...</p>
                ) : reservations.data?.length ? (
                  reservations.data.slice(0, 5).map((reservation) => (
                    <div key={reservation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                      <div>
                        <p className="font-medium">{reservation.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(reservation.date)} | Mesa {reservation.tableNumber} | {reservation.guests} pessoa(s)
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">{RESERVATION_STATUS_LABELS[reservation.status]}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Ainda nao existem reservas na sua conta.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl border border-border bg-surface p-5">
              <h2 className="font-semibold">Beneficio VIP</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Clientes VIP recebem prioridade em mesas especiais, eventos privados e pedidos personalizados.
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-background">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Meta VIP: {formatCurrency(VIP_THRESHOLD_AOA)}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-surface p-5">
              <h2 className="font-semibold">Avaliacoes</h2>
              <div className="mt-4 space-y-3">
                {reviews.length ? (
                  reviews.map((review) => (
                    <article key={review.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Stars rating={review.rating} />
                        <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                      </div>
                      {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">As suas avaliacoes aparecerao aqui depois das visitas concluidas.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}

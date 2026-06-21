import { useMemo, useState } from 'react'
import { CalendarDays, Check, Clock, Car, Minus, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { http } from '@/services/api/http'
import { useReservationWizardStore } from '@/store/reservation-wizard.store'
import { TIME_SLOTS, RESERVATION_STATUS_LABELS, TABLE_LOCATION_LABELS } from '@/lib/constants'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import {
  useCancelClientReservation,
  useClientReservations,
  useCreateClientReservation,
} from '@/features/client/hooks/useClientArea'
import type { Reservation } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tablesAdapter } from '@/services/adapters/tables.adapter'
import { transfersAdapter, type CreateTransferDTO } from '@/services/adapters/transfers.adapter'
import { toast } from 'sonner'

/* ── Status badge ─────────────────────────────────────────────────────────── */
function statusClass(status: Reservation['status']) {
  const classes: Record<Reservation['status'], string> = {
    pending: 'bg-warning/15 text-warning border-warning/30',
    confirmed: 'bg-info/15 text-info border-info/30',
    in_service: 'bg-accent/15 text-accent border-accent/30',
    completed: 'bg-success/15 text-success border-success/30',
    cancelled: 'bg-danger/15 text-danger border-danger/30',
  }
  return classes[status]
}

/* ── Review Modal ─────────────────────────────────────────────────────────── */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" onClick={() => onChange(star)}
          className={cn('text-2xl transition-colors', star <= value ? 'text-yellow-400' : 'text-muted-foreground')}>
          ★
        </button>
      ))}
    </div>
  )
}

function ReviewModal({ reservation, onClose }: { reservation: Reservation; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [service, setService] = useState(5)
  const [atmosphere, setAtmosphere] = useState(5)
  const [food, setFood] = useState(5)
  const [drinks, setDrinks] = useState(5)
  const [comment, setComment] = useState('')

  const mutation = useMutation({
    mutationFn: () => http.post('/reviews', {
      reservationId: reservation.id,
      rating, service, atmosphere, food, drinks,
      comment: comment || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Avaliação enviada! Obrigado.')
      onClose()
    },
    onError: () => toast.error('Erro ao enviar avaliação.'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl text-primary">Avaliar visita</h2>
            <p className="text-sm text-muted-foreground">Mesa {reservation.tableNumber} — {formatDate(reservation.date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Avaliação geral', value: rating, onChange: setRating },
            { label: 'Serviço', value: service, onChange: setService },
            { label: 'Ambiente', value: atmosphere, onChange: setAtmosphere },
            { label: 'Comida', value: food, onChange: setFood },
            { label: 'Bebidas', value: drinks, onChange: setDrinks },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm font-medium">{label}</span>
              <StarRating value={value} onChange={onChange} />
            </div>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium">Comentário (opcional)</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
            placeholder="Partilhe a sua experiência..."
            className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-md text-sm border border-border hover:bg-secondary transition-colors">
            Cancelar
          </button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-md text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#D9D0B5', color: '#181818' }}>
            {mutation.isPending ? 'A enviar...' : 'Enviar avaliação'}
          </button>
        </div>
      </div>
    </div>
  )
}
/* ── Reservation card ─────────────────────────────────────────────────────── */
function ReservationCard({
  reservation,
  onCancel,
  isCancelling,
}: {
  reservation: Reservation
  onCancel: (id: string) => void
  isCancelling: boolean
}) {
  const canCancel = reservation.status === 'pending' || reservation.status === 'confirmed'
  const [showReview, setShowReview] = useState(false)

  return (
    <article className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{reservation.code}</p>
          <h3 className="font-medium text-foreground">
            Mesa {reservation.tableNumber} para {reservation.guests} pessoa(s)
          </h3>
        </div>
        <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', statusClass(reservation.status))}>
          {RESERVATION_STATUS_LABELS[reservation.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {formatDate(reservation.date)}
        </span>
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          {reservation.time}
        </span>
      </div>

      {reservation.notes && <p className="text-sm text-muted-foreground">{reservation.notes}</p>}

      {canCancel && (
        <Button type="button" variant="outline" size="sm"
          disabled={isCancelling} onClick={() => onCancel(reservation.id)}
          className="text-danger hover:text-danger">
          <X className="h-4 w-4" />
          Cancelar reserva
        </Button>
      )}

      {reservation.status === 'completed' && (
        <button onClick={() => setShowReview(true)}
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: '#B89A67' }}>
          ★ Avaliar visita
        </button>
      )}

      {showReview && (
        <ReviewModal reservation={reservation} onClose={() => setShowReview(false)} />
      )}
    </article>
  )
}

/* ── Step dot ─────────────────────────────────────────────────────────────── */
function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold',
          done
            ? 'border-primary bg-primary text-primary-foreground'
            : active
              ? 'border-primary text-primary'
              : 'border-border text-muted-foreground'
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" /> : label}
      </span>
    </div>
  )
}

/* ── Wizard de reserva ────────────────────────────────────────────────────── */
function ReservationWizard() {
  const user = useAuthStore((state) => state.user)
  const wizard = useReservationWizardStore()

  const { data: venueTables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesAdapter.getAll(),
  })

  const { data: availableTables = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ['tables-available', wizard.date, wizard.time, wizard.guests],
    queryFn: () =>
      tablesAdapter.getAvailable(
        wizard.date!.toISOString().slice(0, 10),
        wizard.time!,
        wizard.guests,
      ),
    enabled: wizard.step === 3 && !!wizard.date && !!wizard.time,
  })

  const createReservation = useCreateClientReservation()
  const selectedTable = venueTables.find((table) => table.id === wizard.tableId)
  const minDate = new Date().toISOString().slice(0, 10)

  const unavailableTables = useMemo(() => {
    const availableIds = new Set(availableTables.map((t) => t.id))
    return venueTables.filter(
      (t) => !availableIds.has(t.id) && t.capacity >= wizard.guests && t.status !== 'available'
    )
  }, [venueTables, availableTables, wizard.guests])

  function submitReservation() {
    if (!user || !wizard.date || !wizard.time || !wizard.tableId) return
    createReservation.mutate(
      {
        clientId: user.id,
        date: wizard.date,
        time: wizard.time,
        guests: wizard.guests,
        tableId: wizard.tableId,
        notes: wizard.notes || undefined,
      },
      { onSuccess: () => wizard.reset() }
    )
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-accent">Nova reserva</p>
        <h2 className="mt-1 font-display text-2xl text-primary">Faça a sua reserva</h2>
      </div>

      <div className="flex items-center gap-3">
        {[1, 2, 3, 4].map((step) => (
          <StepDot key={step} label={String(step)} active={wizard.step === step} done={wizard.step > step} />
        ))}
      </div>

      {/* Passo 1 — Data e número de lugares */}
      {wizard.step === 1 && (
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Data</span>
            <input
              type="date"
              min={minDate}
              value={wizard.date ? wizard.date.toISOString().slice(0, 10) : ''}
              onChange={(event) => {
                if (event.target.value) wizard.setDate(new Date(`${event.target.value}T12:00:00`))
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Número de lugares</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={wizard.guests <= 1}
                onClick={() => wizard.setGuests(wizard.guests - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex h-10 min-w-20 items-center justify-center rounded-md border border-border bg-background font-medium">
                {wizard.guests}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={wizard.guests >= 20}
                onClick={() => wizard.setGuests(wizard.guests + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </label>

          <Button type="button" disabled={!wizard.date} onClick={wizard.nextStep}>
            Continuar
          </Button>
        </div>
      )}

      {/* Passo 2 — Horário */}
      {wizard.step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => wizard.setTime(slot)}
                className={cn(
                  'h-10 rounded-md border text-sm transition-colors',
                  wizard.time === slot
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/50'
                )}
              >
                {slot}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={wizard.prevStep}>Voltar</Button>
            <Button type="button" disabled={!wizard.time} onClick={wizard.nextStep}>Continuar</Button>
          </div>
        </div>
      )}

      {/* Passo 3 — Mesas disponíveis (sem mapa, só cards) */}
      {wizard.step === 3 && (
        <div className="space-y-4">
          {loadingAvailable ? (
            <p className="text-sm text-muted-foreground">A verificar disponibilidade...</p>
          ) : availableTables.length ? (
            <>
              {unavailableTables.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  Lamentamos,{' '}
                  {unavailableTables.length === 1
                    ? `a Mesa ${unavailableTables[0].number} não está disponível`
                    : `as Mesas ${unavailableTables.map((t) => t.number).join(', ')} não estão disponíveis`}
                  {' '}para as {wizard.time}. Temos as seguintes disponíveis para si:
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                {availableTables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => wizard.setTable(table.id)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition-colors',
                      wizard.tableId === table.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:border-primary/50'
                    )}
                  >
                    <span className="block font-medium">Mesa {table.number}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {table.capacity} lugares | {TABLE_LOCATION_LABELS[table.location]}
                    </span>
                    {/* ADICIONA ISTO */}
                    {table.price && (
                      <span className="mt-2 block text-sm font-semibold" style={{ color: '#B89A67' }}>
                        {formatCurrency(table.price)}
                      </span>
                    )}
                    {table.description && (
                      <span className="mt-1 block text-xs text-muted-foreground">{table.description}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                Lamentamos, não há mesas disponíveis para {wizard.guests} pessoa(s) às {wizard.time} nesta data.
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Horários com disponibilidade:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS
                    .filter(slot => slot !== wizard.time)
                    .slice(0, 8)
                    .map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => wizard.setTime(slot)}
                        className="h-10 rounded-md border border-primary/40 bg-primary/5 text-sm text-primary hover:bg-primary/10 transition-colors"
                      >
                        {slot}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={wizard.prevStep}>Voltar</Button>
            <Button type="button" disabled={!wizard.tableId} onClick={wizard.nextStep}>Continuar</Button>
          </div>
        </div>
      )}

      {/* Passo 4 — Confirmação */}
      {wizard.step === 4 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-background p-4 space-y-2 text-sm">
            <p><span className="text-muted-foreground">Data:</span> {wizard.date ? formatDate(wizard.date) : '-'}</p>
            <p><span className="text-muted-foreground">Hora:</span> {wizard.time}</p>
            <p><span className="text-muted-foreground">Convidados:</span> {wizard.guests}</p>
            <p><span className="text-muted-foreground">Mesa:</span> {selectedTable ? `Mesa ${selectedTable.number}` : '-'}</p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Observações</span>
            <textarea
              value={wizard.notes}
              onChange={(event) => wizard.setNotes(event.target.value)}
              maxLength={300}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Preferências, alergias ou pedido especial"
            />
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={wizard.prevStep}>Voltar</Button>
            <Button type="button" disabled={createReservation.isPending} onClick={submitReservation}>
              {createReservation.isPending ? 'A confirmar...' : 'Confirmar reserva'}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

/* ── Transfer request ─────────────────────────────────────────────────────── */
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Van', 'Minibus', 'Limousine']

function TransferRequestForm() {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0])
  const [vehicleModel, setVehicleModel] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [notes, setNotes] = useState('')

  const minDate = new Date().toISOString().slice(0, 10)

  const mutation = useMutation({
    mutationFn: (data: CreateTransferDTO) => transfersAdapter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-transfers'] })
      toast.success('Pedido de transfer enviado com sucesso!')
      setVehicleType(VEHICLE_TYPES[0])
      setVehicleModel('')
      setDate('')
      setTime('')
      setPickupLocation('')
      setNotes('')
    },
    onError: () => toast.error('Erro ao enviar pedido de transfer.'),
  })

  function handleSubmit() {
    if (!user || !date || !time || !pickupLocation) return
    mutation.mutate({
      clientId: Number(user.id),
      vehicleType,
      vehicleModel: vehicleModel || undefined,
      date,
      time,
      pickupLocation,
      notes: notes || undefined,
    })
  }

  const { data: myTransfers = [] } = useQuery({
    queryKey: ['my-transfers', user?.id],
    queryFn: () => transfersAdapter.getMine(Number(user!.id)),
    enabled: !!user,
  })

  return (
    <section className="rounded-xl border border-border bg-surface p-5 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-accent">Serviço</p>
        <h2 className="mt-1 font-display text-2xl text-primary flex items-center gap-2">
          <Car className="h-5 w-5" />
          Pedido de Transfer
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Solicite uma viatura para o seu evento ou visita ao Palace Lounge.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Tipo de viatura</span>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Modelo (opcional)</span>
            <input
              type="text"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="Ex: Toyota Prado"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Data</span>
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Hora</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Local de partida *</span>
          <input
            type="text"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder="Ex: Hotel Presidente, Luanda"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Observações</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Número de passageiros, bagagem, outros pedidos..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <Button
          type="button"
          disabled={!date || !time || !pickupLocation || mutation.isPending}
          onClick={handleSubmit}
          className="w-full"
        >
          {mutation.isPending ? 'A enviar...' : 'Solicitar Transfer'}
        </Button>
      </div>

      {myTransfers.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-sm font-medium">Os meus pedidos</p>
          {myTransfers.map((transfer) => (
            <div key={transfer.id} className="rounded-lg border border-border bg-background p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {transfer.vehicleType}{transfer.vehicleModel ? ` — ${transfer.vehicleModel}` : ''}
                </span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  transfer.status === 'pending' ? 'bg-warning/15 text-warning' :
                    transfer.status === 'confirmed' ? 'bg-success/15 text-success' :
                      'bg-muted text-muted-foreground'
                )}>
                  {transfer.status === 'pending' ? 'Pendente' :
                    transfer.status === 'confirmed' ? 'Confirmado' : transfer.status}
                </span>
              </div>
              <p className="text-muted-foreground">{transfer.date.slice(0, 10)} às {transfer.time}</p>
              <p className="text-muted-foreground">{transfer.pickupLocation}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ── Página principal ─────────────────────────────────────────────────────── */
export default function ClientReservationsPage() {
  const user = useAuthStore((state) => state.user)
  const reservations = useClientReservations(user?.id)
  const cancelReservation = useCancelClientReservation()

  const { upcoming, history } = useMemo(() => {
    const now = new Date()
    const data = reservations.data ?? []
    return {
      upcoming: data.filter(
        (item) =>
          item.status !== 'completed' &&
          item.status !== 'cancelled' &&
          new Date(item.date) >= new Date(now.toDateString())
      ),
      history: data.filter(
        (item) =>
          item.status === 'completed' ||
          item.status === 'cancelled' ||
          new Date(item.date) < new Date(now.toDateString())
      ),
    }
  }, [reservations.data])

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-primary">Minhas Reservas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe as próximas visitas e consulte o seu histórico.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Próximas reservas</h2>
          {reservations.isLoading ? (
            <p className="text-sm text-muted-foreground">A carregar reservas...</p>
          ) : upcoming.length ? (
            <div className="grid gap-3">
              {upcoming.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  isCancelling={cancelReservation.isPending}
                  onCancel={(id) => cancelReservation.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
              Ainda não tem reservas futuras.
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Histórico</h2>
          {history.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {history.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  isCancelling={cancelReservation.isPending}
                  onCancel={(id) => cancelReservation.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
              O histórico aparece aqui depois das primeiras visitas.
            </div>
          )}
        </section>
      </div>

      <div className="space-y-6">
        <ReservationWizard />
        <TransferRequestForm />
      </div>
    </div>
  )
}

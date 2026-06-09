import { useMemo } from 'react'
import { CalendarDays, Check, Clock, Minus, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { useReservationWizardStore } from '@/store/reservation-wizard.store'
import { useVenueStore } from '@/store/venue.store'
import { TIME_SLOTS, RESERVATION_STATUS_LABELS, TABLE_LOCATION_LABELS } from '@/lib/constants'
import { cn, formatDate } from '@/lib/utils'
import {
  useCancelClientReservation,
  useClientReservations,
  useCreateClientReservation,
} from '@/features/client/hooks/useClientArea'
import type { Reservation, Table, VenueArea } from '@/types'

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
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isCancelling}
          onClick={() => onCancel(reservation.id)}
          className="text-danger hover:text-danger"
        >
          <X className="h-4 w-4" />
          Cancelar reserva
        </Button>
      )}
    </article>
  )
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold',
          done ? 'border-primary bg-primary text-primary-foreground' : active ? 'border-primary text-primary' : 'border-border text-muted-foreground'
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" /> : label}
      </span>
    </div>
  )
}

function TableOption({
  table,
  selected,
  onSelect,
}: {
  table: Table
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(table.id)}
      className={cn(
        'rounded-xl border p-4 text-left transition-colors',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/50'
      )}
    >
      <span className="block font-medium">Mesa {table.number}</span>
      <span className="mt-1 block text-sm text-muted-foreground">
        {table.capacity} lugares | {TABLE_LOCATION_LABELS[table.location]}
      </span>
      {table.description && <span className="mt-2 block text-xs text-muted-foreground">{table.description}</span>}
    </button>
  )
}

function ReservationMap({
  areas,
  tables,
  selectedId,
  onSelect,
}: {
  areas: VenueArea[]
  tables: Table[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-xl border border-border bg-[#1f1f1f]">
      <div className="absolute inset-x-8 top-5 h-14 rounded-b-3xl border border-accent/50 bg-accent/15 text-center">
        <p className="pt-4 text-xs uppercase tracking-[0.32em] text-accent">Palco / ambiente</p>
      </div>

      {areas.map((area) => (
        <div
          key={area.id}
          className={cn('absolute border border-dashed p-2 text-left', area.shape === 'circle' ? 'rounded-full' : 'rounded-2xl')}
          style={{
            left: `${area.x}%`,
            top: `${area.y}%`,
            width: `${area.width}%`,
            height: `${area.height}%`,
            borderColor: `${area.color}99`,
            backgroundColor: `${area.color}18`,
          }}
        >
          <span className="block text-[11px] font-medium" style={{ color: area.color }}>{area.name}</span>
        </div>
      ))}

      {tables.map((table) => {
        const disabled = table.status !== 'available'
        return (
          <button
            key={table.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(table.id)}
            className={cn(
              'absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition-transform',
              disabled ? 'cursor-not-allowed border-border bg-muted text-muted-foreground' : 'border-success bg-success text-white hover:scale-105',
              selectedId === table.id && 'ring-4 ring-primary/40'
            )}
            style={{ left: `${table.x ?? 20}%`, top: `${table.y ?? 40}%` }}
            title={`Mesa ${table.number}`}
          >
            {table.number}
          </button>
        )
      })}
    </div>
  )
}

function ReservationWizard() {
  const user = useAuthStore((state) => state.user)
  const wizard = useReservationWizardStore()
  const areas = useVenueStore((state) => state.areas)
  const venueTables = useVenueStore((state) => state.tables)
  const createReservation = useCreateClientReservation()

  const availableTables = venueTables.filter((table) => table.status === 'available' && table.capacity >= wizard.guests)
  const selectedTable = venueTables.find((table) => table.id === wizard.tableId)
  const minDate = new Date().toISOString().slice(0, 10)

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
      {
        onSuccess: () => wizard.reset(),
      }
    )
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-accent">Nova reserva</p>
        <h2 className="mt-1 font-display text-2xl text-primary">Escolha a sua mesa</h2>
      </div>

      <div className="flex items-center gap-3">
        {[1, 2, 3, 4].map((step) => (
          <StepDot key={step} label={String(step)} active={wizard.step === step} done={wizard.step > step} />
        ))}
      </div>

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
            <span className="text-sm font-medium">Convidados</span>
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
                  wizard.time === slot ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary/50'
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

      {wizard.step === 3 && (
        <div className="space-y-4">
          {availableTables.length ? (
            <>
              <ReservationMap areas={areas} tables={venueTables} selectedId={wizard.tableId} onSelect={wizard.setTable} />
              <div className="grid sm:grid-cols-2 gap-3">
                {availableTables.map((table) => (
                  <TableOption
                    key={table.id}
                    table={table}
                    selected={wizard.tableId === table.id}
                    onSelect={wizard.setTable}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
              Nao ha mesas disponiveis para este horario e numero de convidados.
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={wizard.prevStep}>Voltar</Button>
            <Button type="button" disabled={!wizard.tableId} onClick={wizard.nextStep}>Continuar</Button>
          </div>
        </div>
      )}

      {wizard.step === 4 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-background p-4 space-y-2 text-sm">
            <p><span className="text-muted-foreground">Data:</span> {wizard.date ? formatDate(wizard.date) : '-'}</p>
            <p><span className="text-muted-foreground">Hora:</span> {wizard.time}</p>
            <p><span className="text-muted-foreground">Convidados:</span> {wizard.guests}</p>
            <p><span className="text-muted-foreground">Mesa:</span> {selectedTable ? `Mesa ${selectedTable.number}` : '-'}</p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Observacoes</span>
            <textarea
              value={wizard.notes}
              onChange={(event) => wizard.setNotes(event.target.value)}
              maxLength={300}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Preferencias, alergias ou pedido especial"
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

export default function ClientReservationsPage() {
  const user = useAuthStore((state) => state.user)
  const reservations = useClientReservations(user?.id)
  const cancelReservation = useCancelClientReservation()

  const { upcoming, history } = useMemo(() => {
    const now = new Date()
    const data = reservations.data ?? []
    return {
      upcoming: data.filter((item) => item.status !== 'completed' && item.status !== 'cancelled' && new Date(item.date) >= new Date(now.toDateString())),
      history: data.filter((item) => item.status === 'completed' || item.status === 'cancelled' || new Date(item.date) < new Date(now.toDateString())),
    }
  }, [reservations.data])

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-primary">Minhas Reservas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe as proximas visitas e consulte o seu historico.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Proximas reservas</h2>
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
              Ainda nao tem reservas futuras.
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Historico</h2>
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
              O historico aparece aqui depois das primeiras visitas.
            </div>
          )}
        </section>
      </div>

      <ReservationWizard />
    </div>
  )
}

import { FormEvent, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Armchair, CheckCircle, LogOut, QrCode, Search, UserPlus, Users, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES, TABLE_STATUS_LABELS } from '@/lib/constants'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useVenueStore } from '@/store/venue.store'
import type { TableStatus } from '@/types'

const tableStatusClass: Record<TableStatus, string> = {
  available: 'border-danger bg-danger/15 text-danger',
  reserved: 'border-warning bg-warning/15 text-warning',
  occupied: 'border-success bg-success/15 text-success',
  maintenance: 'border-border bg-muted text-muted-foreground',
}

export default function ScannerPage() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const tickets = useVenueStore((state) => state.tickets)
  const events = useVenueStore((state) => state.publishedEvents)
  const tables = useVenueStore((state) => state.tables)
  const clients = useVenueStore((state) => state.walkInClients)
  const reservations = useVenueStore((state) => state.walkInReservations)
  const registerWalkInClient = useVenueStore((state) => state.registerWalkInClient)
  const reserveTableForWalkIn = useVenueStore((state) => state.reserveTableForWalkIn)
  const occupyTable = useVenueStore((state) => state.occupyTable)
  const releaseTable = useVenueStore((state) => state.releaseTable)
  const validateTicket = useVenueStore((state) => state.validateTicket)
  const [qrCode, setQrCode] = useState('')
  const [result, setResult] = useState<ReturnType<typeof validateTicket> | null>(null)
  const [selectedTableId, setSelectedTableId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [guests, setGuests] = useState(2)
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5))
  const [notes, setNotes] = useState('')

  const usedToday = useMemo(() => {
    const today = new Date().toDateString()
    return tickets.filter((ticket) => ticket.status === 'used' && ticket.usedAt && new Date(ticket.usedAt).toDateString() === today).length
  }, [tickets])
  const selectedTable = tables.find((table) => table.id === selectedTableId)
  const availableTables = tables.filter((table) => table.status === 'available')

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  if (user?.role !== 'staff' && user?.role !== 'admin') return <Navigate to={ROUTES.CLIENT.DASHBOARD} replace />

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!qrCode.trim()) return
    setResult(validateTicket(qrCode))
    setQrCode('')
  }

  function registerClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!clientName.trim() || !clientPhone.trim()) return
    const client = registerWalkInClient({
      name: clientName,
      phone: clientPhone,
      email: clientEmail || undefined,
    })
    setClientId(client.id)
    setClientName('')
    setClientPhone('')
    setClientEmail('')
  }

  function createReservation(occupyNow: boolean) {
    if (!clientId || !selectedTableId) return
    reserveTableForWalkIn({
      clientId,
      tableId: selectedTableId,
      guests,
      time,
      notes: notes || undefined,
      occupyNow,
    })
    setNotes('')
    setSelectedTableId('')
  }

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-accent">Operacao</p>
            <h1 className="font-display text-3xl text-primary">Operador Palace</h1>
            <p className="mt-1 text-sm text-muted-foreground">Mesas, clientes walk-in, reservas locais e validacao QR.</p>
          </div>
          <Button type="button" variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-5">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-bold text-primary">{tickets.length}</p>
            <p className="text-xs text-muted-foreground">Convites emitidos</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-bold text-success">{usedToday}</p>
            <p className="text-xs text-muted-foreground">Validados hoje</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-bold text-warning">{tickets.filter((ticket) => ticket.status === 'valid').length}</p>
            <p className="text-xs text-muted-foreground">Por validar</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-bold text-danger">{availableTables.length}</p>
            <p className="text-xs text-muted-foreground">Mesas vagas</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-bold text-success">{tables.filter((table) => table.status === 'occupied').length}</p>
            <p className="text-xs text-muted-foreground">Mesas ocupadas</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-2xl text-primary">Estado das mesas</h2>
              <p className="text-sm text-muted-foreground">Selecione uma mesa vaga para reservar ou marque ocupacao/libertacao.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => setSelectedTableId(table.id)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-colors hover:border-primary/60',
                    tableStatusClass[table.status],
                    selectedTableId === table.id && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">Mesa {table.number}</p>
                      <p className="mt-1 text-xs opacity-80">{table.capacity} lugares</p>
                    </div>
                    <Armchair className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-medium">{TABLE_STATUS_LABELS[table.status]}</p>
                </button>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <form onSubmit={registerClient} className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <div>
                <h2 className="flex items-center gap-2 font-semibold">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Cadastrar cliente
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Para clientes que chegaram ao local.</p>
              </div>
              <input
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Nome do cliente"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={clientPhone}
                onChange={(event) => setClientPhone(event.target.value)}
                placeholder="Telefone"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
                placeholder="Email opcional"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <Button type="submit" disabled={!clientName || !clientPhone} className="w-full">
                Guardar cliente
              </Button>
            </form>

            <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <div>
                <h2 className="flex items-center gap-2 font-semibold">
                  <Users className="h-4 w-4 text-primary" />
                  Reserva local
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mesa selecionada: {selectedTable ? `Mesa ${selectedTable.number} (${TABLE_STATUS_LABELS[selectedTable.status]})` : 'nenhuma'}
                </p>
              </div>
              <select
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Selecionar cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name} - {client.phone}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={guests}
                  onChange={(event) => setGuests(Number(event.target.value))}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                placeholder="Notas opcionais"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  disabled={!clientId || !selectedTable || selectedTable.status !== 'available'}
                  onClick={() => createReservation(false)}
                >
                  Reservar
                </Button>
                <Button
                  type="button"
                  disabled={!clientId || !selectedTable || selectedTable.status !== 'available'}
                  onClick={() => createReservation(true)}
                >
                  Ocupar agora
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedTable || selectedTable.status === 'available'}
                  onClick={() => selectedTable && occupyTable(selectedTable.id)}
                >
                  Marcar ocupada
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedTable || selectedTable.status === 'available'}
                  onClick={() => selectedTable && releaseTable(selectedTable.id)}
                >
                  Liberar mesa
                </Button>
              </div>
            </section>
          </aside>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <QrCode className="h-4 w-4 text-primary" />
              Codigo QR do convite
            </span>
            <input
              value={qrCode}
              onChange={(event) => setQrCode(event.target.value)}
              placeholder="PL-pe-...-mesa-..."
              className="h-12 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:border-primary"
            />
          </label>
          <Button type="submit" className="w-full">
            <Search className="h-4 w-4" />
            Validar entrada
          </Button>
        </form>

        {result && (
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              {result.ok ? (
                <CheckCircle className="mt-1 h-6 w-6 text-success" />
              ) : (
                <XCircle className="mt-1 h-6 w-6 text-danger" />
              )}
              <div>
                <h2 className={result.ok ? 'font-semibold text-success' : 'font-semibold text-danger'}>
                  {result.message}
                </h2>
                {result.ticket && (
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p><span className="text-foreground">Cliente:</span> {result.ticket.clientName}</p>
                    <p><span className="text-foreground">Mesa:</span> {result.ticket.tableNumber}</p>
                    <p><span className="text-foreground">Valor:</span> {formatCurrency(result.ticket.price)}</p>
                    <p><span className="text-foreground">Evento:</span> {result.event?.title ?? 'Evento Palace'}</p>
                    {result.event && <p><span className="text-foreground">Data:</span> {formatDate(result.event.date)}</p>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Reservas e ocupacoes locais</h2>
          <div className="mt-3 space-y-2">
            {reservations.slice(0, 6).map((reservation) => (
              <div key={reservation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 text-sm">
                <div>
                  <p className="font-medium">{reservation.clientName}</p>
                  <p className="text-xs text-muted-foreground">{reservation.code} | Mesa {reservation.tableNumber} | {reservation.guests} pessoa(s)</p>
                </div>
                <p className="text-muted-foreground">{reservation.time} | {reservation.status}</p>
              </div>
            ))}
            {reservations.length === 0 && <p className="text-sm text-muted-foreground">Ainda nao existem reservas locais.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Ultimos convites</h2>
          <div className="mt-3 space-y-2">
            {tickets.slice(0, 4).map((ticket) => {
              const event = events.find((item) => item.id === ticket.eventId)
              return (
                <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 text-sm">
                  <div>
                    <p className="font-medium">{ticket.clientName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{ticket.qrCode}</p>
                  </div>
                  <p className="text-muted-foreground">{event?.title ?? 'Evento Palace'} | Mesa {ticket.tableNumber}</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

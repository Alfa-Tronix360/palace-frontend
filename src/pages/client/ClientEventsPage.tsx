import { FormEvent, useState } from 'react'
import { CalendarDays, CreditCard, MessageCircle, PartyPopper, QrCode, Ticket, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '@/lib/constants'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useVenueStore } from '@/store/venue.store'
import { useClientEvents, useCreateClientEvent } from '@/features/client/hooks/useClientArea'
import type { DigitalTicket, Event, EventType, PublishedEvent, TicketSeat, VenueArea } from '@/types'
import { useQuery, useMutation } from '@tanstack/react-query'
import { http } from '@/services/api/http'

const eventTypes: EventType[] = ['birthday', 'wedding', 'corporate', 'private_dinner', 'themed']

function statusClass(status: Event['status']) {
  const classes: Record<Event['status'], string> = {
    pending: 'bg-warning/15 text-warning border-warning/30',
    approved: 'bg-info/15 text-info border-info/30',
    confirmed: 'bg-success/15 text-success border-success/30',
    completed: 'bg-accent/15 text-accent border-accent/30',
    cancelled: 'bg-danger/15 text-danger border-danger/30',
  }
  return classes[status]
}

function EventCard({ event }: { event: Event }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{event.code}</p>
          <h3 className="font-medium">{EVENT_TYPE_LABELS[event.type]}</h3>
        </div>
        <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', statusClass(event.status))}>
          {EVENT_STATUS_LABELS[event.status]}
        </span>
      </div>

      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {formatDate(event.date)}
        </span>
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {event.guests} convidados
        </span>
        {event.budget && (
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            {formatCurrency(event.budget)}
          </span>
        )}
        <span className={cn('flex items-center gap-2', event.depositPaid ? 'text-success' : 'text-warning')}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {event.depositPaid ? 'Entrada confirmada' : 'Entrada pendente'}
        </span>
      </div>

      {event.notes && <p className="text-sm text-muted-foreground">{event.notes}</p>}
    </article>
  )
}

function EventRequestForm() {
  const user = useAuthStore((state) => state.user)
  const createEvent = useCreateClientEvent()
  const minDate = new Date().toISOString().slice(0, 10)
  const [type, setType] = useState<EventType>('birthday')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState(20)
  const [notes, setNotes] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !date) return

    createEvent.mutate(
      {
        clientId: user.id,
        type,
        date: new Date(`${date}T12:00:00`),
        guests,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setType('birthday')
          setDate('')
          setGuests(20)
          setNotes('')
        },
      }
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-accent">Pedido privado</p>
        <h2 className="mt-1 font-display text-2xl text-primary">Solicitar evento</h2>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Tipo de evento</span>
        <select
          value={type}
          onChange={(event) => setType(event.target.value as EventType)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        >
          {eventTypes.map((item) => (
            <option key={item} value={item}>{EVENT_TYPE_LABELS[item]}</option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Data</span>
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Convidados</span>
          <input
            type="number"
            min={2}
            max={200}
            value={guests}
            onChange={(event) => setGuests(Number(event.target.value))}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Detalhes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          maxLength={500}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="Menu, decoracao, horario previsto ou necessidades especiais"
        />
      </label>

      <Button type="submit" disabled={!date || createEvent.isPending} className="w-full">
        <PartyPopper className="h-4 w-4" />
        {createEvent.isPending ? 'A enviar...' : 'Enviar pedido'}
      </Button>
    </form>
  )
}

function seatClass(status: TicketSeat['status']) {
  if (status === 'sold') return 'bg-danger/70 text-white border-danger cursor-not-allowed'
  if (status === 'blocked') return 'bg-muted text-muted-foreground border-border cursor-not-allowed'
  return 'bg-success text-white border-success hover:scale-105'
}

function TicketMap({
  areas,
  event,
  selectedSeatId,
  onSelect,
}: {
  areas: VenueArea[]
  event: PublishedEvent
  selectedSeatId?: string
  onSelect: (seat: TicketSeat) => void
}) {
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-xl border border-border bg-[#1f1f1f]">
      <div className="absolute inset-x-8 top-5 h-14 rounded-b-3xl border border-accent/50 bg-accent/15 text-center">
        <p className="pt-4 text-xs uppercase tracking-[0.32em] text-accent">{event.stageLabel}</p>
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

      {event.seats.map((seat) => (
        <button
          key={seat.id}
          type="button"
          disabled={seat.status !== 'available'}
          onClick={() => onSelect(seat)}
          className={cn(
            'absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition-transform',
            seatClass(seat.status),
            selectedSeatId === seat.id && 'ring-4 ring-primary/40'
          )}
          style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
          title={`Mesa ${seat.tableNumber} - ${formatCurrency(seat.price)}`}
        >
          {seat.tableNumber}
        </button>
      ))}
    </div>
  )
}

function TicketSales() {
  const user = useAuthStore((state) => state.user)
  const areas = useVenueStore((state) => state.areas)

  const { data: publishedEvents = [] } = useQuery({
    queryKey: ['published-events'],
    queryFn: () => http.get<unknown, any[]>('/published-events'),
  })

  const { data: myTickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const data = await http.get<unknown, any[]>('/tickets/my')
      console.log('tickets:', data)
      return data
    },
  })

  const buyTicketMutation = useMutation({
    mutationFn: ({ eventId, seatId }: { eventId: number; seatId: number }) =>
      http.post<unknown, any>('/tickets/purchase', { event_id: eventId, seat_id: seatId }),
    onSuccess: () => {
      refetchTickets()
      toast.success('Convite comprado com sucesso!')
      setSelectedSeat(null)
    },
    onError: () => toast.error('Este lugar ja nao esta disponivel.'),
  })

  const visibleEvents = publishedEvents.filter((e: any) => e.published)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(visibleEvents[0]?.id ?? null)
  const [selectedSeat, setSelectedSeat] = useState<any>(null)
  const selectedEvent = visibleEvents.find((e: any) => e.id === selectedEventId) ?? visibleEvents[0]

  function handleBuy() {
    if (!user || !selectedEvent || !selectedSeat) return
    buyTicketMutation.mutate({ eventId: selectedEvent.id, seatId: selectedSeat.id })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-primary">Comprar convites</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha a festa e selecione o lugar no mapa. O preco muda conforme a posicao em relacao ao palco.
        </p>
      </div>

      {visibleEvents.length ? (
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-3">
            {visibleEvents.map((event: any) => (
              <button key={event.id} type="button"
                onClick={() => { setSelectedEventId(event.id); setSelectedSeat(null) }}
                className={cn('w-full rounded-xl border p-4 text-left transition-colors',
                  selectedEvent?.id === event.id ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-primary/50')}>
                <p className="font-medium">{event.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(new Date(event.date))} | {event.time}</p>
              </button>
            ))}
          </div>

          {selectedEvent && (
            <div className="space-y-3">
              <TicketMap
                areas={areas}
                event={{
                  ...selectedEvent,
                  date: new Date(selectedEvent.date),
                  createdAt: new Date(selectedEvent.created_at),
                  seats: (selectedEvent.seats ?? []).map((s: any) => ({
                    id: String(s.id),
                    tableId: String(s.table_id),
                    tableNumber: s.table_number,
                    x: s.x ?? 20,
                    y: s.y ?? 40,
                    capacity: s.capacity,
                    location: s.location,
                    price: s.price,
                    status: s.status,
                  })),
                }}
                selectedSeatId={selectedSeat ? String(selectedSeat.id) : undefined}
                onSelect={(seat) => setSelectedSeat({ id: Number(seat.id), tableNumber: seat.tableNumber, price: seat.price })}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Lugar selecionado</p>
                  <p className="font-medium">
                    {selectedSeat ? `Mesa ${selectedSeat.tableNumber} - ${formatCurrency(selectedSeat.price)}` : 'Selecione uma mesa disponivel'}
                  </p>
                </div>
                <Button type="button" disabled={!selectedSeat || buyTicketMutation.isPending} onClick={handleBuy}>
                  <Ticket className="h-4 w-4" />
                  {buyTicketMutation.isPending ? 'A comprar...' : 'Comprar convite'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          Ainda nao existem festas publicadas para venda.
        </div>
      )}

      {myTickets.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Meus convites digitais</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {myTickets.map((ticket: any) => (
              <DigitalTicketCard
                key={ticket.id}
                ticket={{
                  id: String(ticket.id),
                  eventId: String(ticket.eventId),
                  clientId: String(ticket.clientId),
                  clientName: ticket.clientName,
                  clientPhone: ticket.clientPhone,
                  seatId: String(ticket.seatId),
                  tableNumber: ticket.tableNumber,
                  price: ticket.price,
                  qrCode: ticket.qrCode,
                  whatsappUrl: ticket.whatsappUrl,
                  deliveryStatus: ticket.deliveryStatus,
                  status: ticket.status,
                  purchasedAt: new Date(ticket.purchasedAt),
                }}
                events={visibleEvents.map((e: any) => ({
                  ...e,
                  id: String(e.id),
                  date: new Date(e.date),
                  createdAt: new Date(e.created_at),
                  seats: [],
                }))}
                phone={user?.phone}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function DigitalTicketCard({ ticket, events, phone }: { ticket: DigitalTicket; events: PublishedEvent[]; phone?: string }) {
  const event = events.find((item) => item.id === ticket.eventId)
  const digits = (phone || ticket.clientPhone || '').replace(/\D/g, '')
  const whatsappUrl = ticket.whatsappUrl || (digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent([
      'Convite digital Palace Lounge',
      event ? `Evento: ${event.title}` : undefined,
      `Mesa: ${ticket.tableNumber}`,
      `Codigo QR: ${ticket.qrCode}`,
    ].filter(Boolean).join('\n'))}`
    : undefined)

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{event?.title ?? 'Evento Palace'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Mesa {ticket.tableNumber} | {formatCurrency(ticket.price)}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background text-primary">
          <QrCode className="h-7 w-7" />
        </div>
      </div>
      <p className="mt-3 rounded-lg border border-border bg-background p-2 font-mono text-xs text-muted-foreground">
        {ticket.qrCode}
      </p>
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-success px-3 text-sm font-medium text-white transition-colors hover:bg-success/90"
        >
          <MessageCircle className="h-4 w-4" />
          Enviar QR pelo WhatsApp
        </a>
      )}
    </article>
  )
}







export default function ClientEventsPage() {
  const user = useAuthStore((state) => state.user)
  const events = useClientEvents(user?.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-primary">Meus Eventos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Solicite eventos privados ou compre convites para festas publicadas.</p>
      </div>

      <TicketSales />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl text-primary">Pedidos privados</h2>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhe pedidos, aprovacoes e entradas.</p>
          </div>
          {events.isLoading ? (
            <p className="text-sm text-muted-foreground">A carregar eventos...</p>
          ) : events.data?.length ? (
            <div className="grid gap-3">
              {events.data.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
              Ainda nao existem pedidos de evento para a sua conta.
            </div>
          )}
        </div>

        <EventRequestForm />
      </div>
    </div>
  )
}

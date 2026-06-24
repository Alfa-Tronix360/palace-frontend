import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Clock, Ticket, X } from 'lucide-react'
import { publishedEventsAdapter } from '@/services/adapters/published_events.adapter'
import { ticketsAdapter } from '@/services/adapters/tickets.adapter'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import type { PublishedEvent, TicketSeat } from '@/types'
import { cn } from '@/lib/utils'

function formatEventDate(date: Date) {
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
}

/* ── Modal de bilhetes ───────────────────────────────────────────────────── */
function TicketModal({ event, onClose }: { event: PublishedEvent; onClose: () => void }) {
    const user = useAuthStore(s => s.user)
    const navigate = useNavigate()

    const { data: seats = [], isLoading } = useQuery({
        queryKey: ['event-seats', event.id],
        queryFn: () => ticketsAdapter.getEventSeats(event.id),
    })

    const availableSeats = seats.filter((s: TicketSeat) => s.status === 'available')
    const soldSeats = seats.filter((s: TicketSeat) => s.status === 'sold')

    function handleBuy() {
        if (!user) {
            sessionStorage.setItem('pending_event_id', event.id)
            navigate(ROUTES.LOGIN)
            return
        }
        navigate(`/eventos/${event.id}`)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl min-h-screen bg-background shadow-xl"
            >
                {event.bannerUrl && (
                    <img src={event.bannerUrl} alt={event.title} className="w-full h-[50vh] object-cover" />
                )}
                <div className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-accent">{event.stageLabel}</p>
                            <h2 className="font-display text-2xl text-primary">{event.title}</h2>
                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />{formatEventDate(event.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />{event.time}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Disponibilidade de mesas */}
                    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                        <p className="text-sm font-medium">Disponibilidade</p>
                        <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-success" />
                                {availableSeats.length} mesas disponíveis
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-danger" />
                                {soldSeats.length} mesas vendidas
                            </span>
                        </div>
                        {isLoading ? (
                            <p className="text-sm text-muted-foreground">A carregar...</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {seats.sort((a: TicketSeat, b: TicketSeat) => a.tableNumber - b.tableNumber).map((seat: TicketSeat) => (
                                    <span key={seat.id} className={cn(
                                        'rounded-full px-2.5 py-1 text-xs font-medium border',
                                        seat.status === 'available'
                                            ? 'bg-success/15 text-success border-success/30'
                                            : 'bg-danger/15 text-danger border-danger/30'
                                    )}>
                                        Mesa {seat.tableNumber}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Preços */}
                    {[
                        { label: 'Individual', price: event.priceIndividual },
                        { label: 'Mesa s/ consumo', price: event.priceTable },
                        { label: 'Mesa c/ consumo', price: event.priceTableWithConsumption },
                        { label: 'Box s/ consumo', price: event.priceBox },
                        { label: 'Box c/ consumo', price: event.priceBoxWithConsumption },
                        { label: 'VIP Individual', price: event.priceVipIndividual },
                        { label: 'VIP Mesa', price: event.priceVipTable },
                        { label: 'VIP Box', price: event.priceVipBox },
                    ].filter(o => o.price > 0).length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Tabela de preços</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Individual', price: event.priceIndividual },
                                        { label: 'Mesa s/ consumo', price: event.priceTable },
                                        { label: 'Mesa c/ consumo', price: event.priceTableWithConsumption },
                                        { label: 'Box s/ consumo', price: event.priceBox },
                                        { label: 'Box c/ consumo', price: event.priceBoxWithConsumption },
                                        { label: 'VIP Individual', price: event.priceVipIndividual },
                                        { label: 'VIP Mesa', price: event.priceVipTable },
                                        { label: 'VIP Box', price: event.priceVipBox },
                                    ].filter(o => o.price > 0).map(option => (
                                        <div key={option.label} className="rounded-lg border border-border bg-surface p-3">
                                            <p className="text-xs text-muted-foreground">{option.label}</p>
                                            <p className="text-sm font-semibold mt-0.5" style={{ color: '#B89A67' }}>
                                                {formatCurrency(option.price)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* Botão */}
                    <button
                        onClick={handleBuy}
                        className="w-full py-3 rounded-md text-sm font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#D9D0B5', color: '#181818' }}
                    >
                        <Ticket className="w-4 h-4" />
                        {user ? 'Selecionar mesa e comprar' : 'Entrar para comprar'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

/* ── Página principal ────────────────────────────────────────────────────── */
export default function EventsPage() {
    const [selectedEvent, setSelectedEvent] = useState<PublishedEvent | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ['public-events'],
        queryFn: () => publishedEventsAdapter.getAll(),
    })

    const events = (data ?? []).filter(e => e.published)

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Palace Lounge</p>
                <h1 className="font-display text-4xl text-primary">Eventos</h1>
                <p className="mt-2 text-muted-foreground">Descubra os próximos eventos e garanta o seu lugar.</p>
            </motion.div>

            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-xl border border-border bg-surface h-64 animate-pulse" />
                    ))}
                </div>
            ) : events.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {events.map((event, i) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="rounded-xl border border-border bg-surface overflow-hidden hover:border-primary/40 transition-colors cursor-pointer"
                            onClick={() => setSelectedEvent(event)}
                        >
                            {event.bannerUrl ? (
                                <img src={event.bannerUrl} alt={event.title} className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-full h-48 bg-secondary flex items-center justify-center">
                                    <span className="text-muted-foreground text-sm">Clique para ver bilhetes</span>
                                </div>
                            )}

                            <div className="p-5 space-y-3">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-accent">{event.stageLabel}</p>
                                    <h2 className="font-display text-xl text-primary mt-0.5">{event.title}</h2>
                                </div>

                                <div className="space-y-1 text-sm text-muted-foreground">
                                    <p className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        {formatEventDate(event.date)}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        {event.time}
                                    </p>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                    <span className="text-sm font-semibold" style={{ color: '#B89A67' }}>
                                        A partir de {formatCurrency(event.basePrice)}
                                    </span>
                                    <button
                                        onClick={e => { e.stopPropagation(); setSelectedEvent(event) }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:opacity-90"
                                        style={{ backgroundColor: '#D9D0B5', color: '#181818' }}
                                    >
                                        <Ticket className="w-3.5 h-3.5" />
                                        Ver bilhetes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-surface p-12 text-center text-muted-foreground">
                    Não há eventos programados neste momento. Volte em breve!
                </div>
            )}

            {selectedEvent && (
                <TicketModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}
        </div>
    )
}
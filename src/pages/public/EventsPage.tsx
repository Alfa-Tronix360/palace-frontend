import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Clock, Ticket, X } from 'lucide-react'
import { publishedEventsAdapter } from '@/services/adapters/published_events.adapter'
import { ticketsAdapter } from '@/services/adapters/tickets.adapter'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import type { PublishedEvent, TicketSeat } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TABLE_LOCATION_LABELS } from '@/lib/constants'

function formatEventDate(date: Date) {
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
}

/* ── Modal de bilhetes ───────────────────────────────────────────────────── */
function TicketModal({ event, onClose }: { event: PublishedEvent; onClose: () => void }) {
    const user = useAuthStore(s => s.user)
    const navigate = useNavigate()
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null)

    const { data: seats = [], isLoading } = useQuery({
        queryKey: ['event-seats', event.id],
        queryFn: () => ticketsAdapter.getEventSeats(event.id),
    })

    const purchaseMutation = useMutation({
        mutationFn: () => ticketsAdapter.purchase(event.id, selectedSeat!),
        onSuccess: () => {
            toast.success('Bilhete comprado com sucesso!')
            onClose()
        },
        onError: () => toast.error('Erro ao comprar bilhete. Tente novamente.'),
    })

    function handlePurchase() {
        if (!user) {
            navigate(ROUTES.LOGIN)
            return
        }
        if (!selectedSeat) return
        purchaseMutation.mutate()
    }

    const availableSeats = seats.filter((s: TicketSeat) => s.status === 'available')

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl overflow-hidden"
            >
                {/* Header */}
                {event.bannerUrl && (
                    <img src={event.bannerUrl} alt={event.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-5 space-y-4">
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
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Lugares */}
                    <div>
                        <p className="text-sm font-medium mb-2">
                            Escolha o seu lugar <span className="text-muted-foreground">({availableSeats.length} disponíveis)</span>
                        </p>
                        {isLoading ? (
                            <p className="text-sm text-muted-foreground">A carregar lugares...</p>
                        ) : availableSeats.length ? (
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {availableSeats.map((seat: TicketSeat) => (
                                    <button
                                        key={seat.id}
                                        onClick={() => setSelectedSeat(seat.id)}
                                        className={cn(
                                            'rounded-lg border p-3 text-left transition-colors',
                                            selectedSeat === seat.id
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border bg-surface hover:border-primary/50'
                                        )}
                                    >
                                        <p className="text-sm font-medium">Mesa {seat.tableNumber}</p>
                                        <p className="text-xs text-muted-foreground">{seat.capacity} lugares | {TABLE_LOCATION_LABELS[seat.location]}</p>
                                        <p className="text-sm font-semibold mt-1" style={{ color: '#B89A67' }}>
                                            {formatCurrency(seat.price)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Sem lugares disponíveis para este evento.</p>
                        )}
                    </div>

                    {/* Botões */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-md text-sm border border-border hover:bg-secondary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handlePurchase}
                            disabled={!selectedSeat || purchaseMutation.isPending}
                            className="flex-1 py-2.5 rounded-md text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#D9D0B5', color: '#181818' }}
                        >
                            <Ticket className="w-4 h-4" />
                            {purchaseMutation.isPending ? 'A comprar...' : user ? 'Comprar bilhete' : 'Entrar para comprar'}
                        </button>
                    </div>
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
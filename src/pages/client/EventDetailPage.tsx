import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Clock, Ticket, ArrowLeft } from 'lucide-react'
import { publishedEventsAdapter } from '@/services/adapters/published_events.adapter'
import { ticketsAdapter } from '@/services/adapters/tickets.adapter'
import { formatCurrency, cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import type { TicketSeat } from '@/types'

function formatEventDate(date: Date) {
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const user = useAuthStore(s => s.user)

    const [selectedSeat, setSelectedSeat] = useState<TicketSeat | null>(null)
    const [selectedType, setSelectedType] = useState<string | null>(null)

    const { data: event, isLoading: loadingEvent } = useQuery({
        queryKey: ['event', id],
        queryFn: () => publishedEventsAdapter.getById(id!),
        enabled: !!id,
    })

    const { data: seats = [], isLoading: loadingSeats } = useQuery({
        queryKey: ['event-seats', id],
        queryFn: () => ticketsAdapter.getEventSeats(id!),
        enabled: !!id,
    })

    const purchaseMutation = useMutation({
        mutationFn: () => ticketsAdapter.purchase(id!, selectedSeat!.id),
        onSuccess: () => {
            toast.success('Bilhete comprado com sucesso!')
            navigate('/cliente/eventos')
        },
        onError: () => toast.error('Erro ao comprar bilhete.'),
    })

    if (loadingEvent) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (!event) return null

    const priceOptions = [
        { key: 'individual', label: 'Individual', price: event.priceIndividual },
        { key: 'mesa', label: 'Mesa s/ consumo', price: event.priceTable },
        { key: 'mesa_consumo', label: 'Mesa c/ consumo', price: event.priceTableWithConsumption },
        { key: 'box', label: 'Box s/ consumo', price: event.priceBox },
        { key: 'box_consumo', label: 'Box c/ consumo', price: event.priceBoxWithConsumption },
        { key: 'vip_individual', label: 'VIP Individual', price: event.priceVipIndividual },
        { key: 'vip_mesa', label: 'VIP Mesa', price: event.priceVipTable },
        { key: 'vip_box', label: 'VIP Box', price: event.priceVipBox },
    ].filter(o => o.price > 0)

    const selectedPrice = priceOptions.find(o => o.key === selectedType)?.price ?? selectedSeat?.price ?? 0

    return (
        <div className="min-h-screen bg-background">
            {/* Banner */}
            {event.bannerUrl && (
                <div className="relative h-[50vh]">
                    <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                </div>
            )}

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-xs uppercase tracking-widest text-accent">{event.stageLabel}</p>
                    <h1 className="font-display text-3xl text-primary mt-1">{event.title}</h1>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />{formatEventDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />{event.time}
                        </span>
                    </div>
                    <p className="mt-3 text-muted-foreground">{event.description}</p>
                </motion.div>

                {/* Mapa de mesas do evento */}
                <div className="space-y-3">
                    <h2 className="font-semibold">Mapa do evento — selecione uma mesa</h2>
                    <div className="relative min-h-[400px] rounded-xl border border-border bg-[#1f1f1f] overflow-hidden">
                        <div className="absolute inset-x-8 top-4 h-12 rounded-b-2xl border border-accent/50 bg-accent/15 text-center">
                            <p className="pt-3 text-xs uppercase tracking-widest text-accent">Palco / DJ</p>
                        </div>
                        {loadingSeats ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            seats.map((seat: TicketSeat) => (
                                <button
                                    key={seat.id}
                                    disabled={seat.status !== 'available'}
                                    onClick={() => {
                                        setSelectedSeat(seat)
                                        setSelectedType(null)
                                    }}
                                    className={cn(
                                        'absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition-transform',
                                        seat.status === 'available'
                                            ? 'bg-success text-white border-success hover:scale-110 cursor-pointer'
                                            : 'bg-danger text-white border-danger cursor-not-allowed opacity-60',
                                        selectedSeat?.id === seat.id && 'ring-4 ring-white/50 scale-110'
                                    )}
                                    style={{ left: `${seat.x ?? 20}%`, top: `${seat.y ?? 40}%` }}
                                    title={`Mesa ${seat.tableNumber}`}
                                >
                                    {seat.tableNumber}
                                </button>
                            ))
                        )}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-success" /> Disponível</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-danger" /> Vendida</span>
                    </div>
                </div>

                {/* Detalhes da mesa selecionada */}
                {selectedSeat && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
                        <h3 className="font-semibold">Mesa {selectedSeat.tableNumber} selecionada</h3>
                        <p className="text-sm text-muted-foreground">{selectedSeat.capacity} lugares</p>

                        {/* Tipos de entrada */}
                        {priceOptions.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Tipo de entrada</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {priceOptions.map(option => (
                                        <button
                                            key={option.key}
                                            onClick={() => setSelectedType(option.key)}
                                            className={cn(
                                                'rounded-lg border p-3 text-left transition-colors',
                                                selectedType === option.key
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border bg-surface hover:border-primary/50'
                                            )}
                                        >
                                            <p className="text-xs text-muted-foreground">{option.label}</p>
                                            <p className="text-sm font-semibold mt-0.5" style={{ color: '#B89A67' }}>
                                                {formatCurrency(option.price)}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resumo */}
                        {selectedType && (
                            <div className="rounded-lg border border-border bg-background p-4 space-y-2">
                                <p className="text-sm font-medium">Resumo da compra</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Mesa</span>
                                    <span>Mesa {selectedSeat.tableNumber}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tipo</span>
                                    <span>{priceOptions.find(o => o.key === selectedType)?.label}</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 mt-2">
                                    <span>Total</span>
                                    <span style={{ color: '#B89A67' }}>{formatCurrency(selectedPrice)}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => purchaseMutation.mutate()}
                            disabled={!selectedType || purchaseMutation.isPending}
                            className="w-full py-3 rounded-md text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#D9D0B5', color: '#181818' }}
                        >
                            <Ticket className="w-4 h-4" />
                            {purchaseMutation.isPending ? 'A comprar...' : 'Confirmar compra'}
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Plus, Calendar, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { reservationsAdapter } from '@/services/adapters/reservations.adapter'
import { tablesAdapter } from '@/services/adapters/tables.adapter'
import { http } from '@/services/api/http'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'


export default function RecepcionistaPage() {
    const queryClient = useQueryClient()
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [clientId, setClientId] = useState('')
    const [clientFound, setClientFound] = useState<any | null>(null)
    const [date, setDate] = useState('')
    const [time, setTime] = useState('19:00')
    const [guests, setGuests] = useState(2)
    const [tableId, setTableId] = useState('')
    const [notes, setNotes] = useState('')
    const logout = useAuthStore(s => s.logout)
    const navigate = useNavigate()
    const { data: reservations = [] } = useQuery({
        queryKey: ['reservations'],
        queryFn: () => reservationsAdapter.getAll(),
    })

    const { data: tables = [] } = useQuery({
        queryKey: ['tables'],
        queryFn: () => tablesAdapter.getAll(),
    })

    const findClientMutation = useMutation({
        mutationFn: () => http.post<unknown, any>('/clients/find-or-create', { name, phone }),
        onSuccess: (client) => {
            setClientId(client.id)
            setClientFound(client)
            toast.success(client.reservationCount > 0 ? `Cliente encontrado: ${client.name}` : `Novo cliente criado: ${client.name}`)
        },
        onError: () => toast.error('Erro ao verificar cliente.'),
    })

    const createMutation = useMutation({
        mutationFn: () => reservationsAdapter.create({
            clientId,
            tableId,
            date: new Date(date),
            time,
            guests,
            notes: notes ? `Reserva por telefone. ${notes}` : 'Reserva por telefone.',
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] })
            setName(''); setPhone(''); setDate(''); setTime('19:00')
            setGuests(2); setTableId(''); setNotes('')
            setClientId(''); setClientFound(null)
            toast.success('Reserva criada com sucesso!')
        },
        onError: () => toast.error('Erro ao criar reserva.'),
    })

    const todayReservations = reservations.filter(r => {
        const today = new Date()
        const rDate = new Date(r.date)
        return (
            rDate.getFullYear() === today.getFullYear() &&
            rDate.getMonth() === today.getMonth() &&
            rDate.getDate() === today.getDate()
        )
    })

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Receção</p>
                    <h1 className="font-display text-3xl text-primary">Painel do Rececionista</h1>
                    <p className="text-muted-foreground text-sm mt-1">Registe reservas por telefone e acompanhe as reservas do dia.</p>
                </div>
                <button onClick={() => { logout(); navigate('/login') }}
                    className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 transition-colors">
                    Terminar sessão
                </button>
            </motion.div>

            <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold">Nova Reserva por Telefone</h2>
                    </div>

                    {/* Passo 1 — Identificar cliente */}
                    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                        <p className="text-sm font-medium">1. Identificar cliente</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block space-y-2">
                                <span className="text-sm text-muted-foreground">Nome</span>
                                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva"
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-sm text-muted-foreground">Telefone</span>
                                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+244 9XX XXX XXX"
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                            </label>
                        </div>
                        <Button type="button" variant="outline" className="w-full"
                            onClick={() => findClientMutation.mutate()}
                            disabled={!name || !phone || findClientMutation.isPending}>
                            <Search className="h-4 w-4" />
                            {findClientMutation.isPending ? 'A verificar...' : 'Verificar cliente'}
                        </Button>
                        {clientFound && (
                            <div className="rounded-md bg-success/10 border border-success/30 p-3 text-sm">
                                <p className="font-medium text-success">✓ {clientFound.name}</p>
                                <p className="text-muted-foreground text-xs">{clientFound.phone} | {clientFound.reservationCount} reserva(s)</p>
                            </div>
                        )}
                    </div>

                    {/* Passo 2 — Detalhes da reserva */}
                    {clientFound && (
                        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                            <p className="text-sm font-medium">2. Detalhes da reserva</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="block space-y-2">
                                    <span className="text-sm text-muted-foreground">Data</span>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                                </label>
                                <label className="block space-y-2">
                                    <span className="text-sm text-muted-foreground">Hora</span>
                                    <input type="time" value={time} onChange={e => setTime(e.target.value)}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                                </label>
                                <label className="block space-y-2">
                                    <span className="text-sm text-muted-foreground">Nº de pessoas</span>
                                    <input type="number" min={1} max={20} value={guests} onChange={e => setGuests(Number(e.target.value))}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                                </label>
                                <label className="block space-y-2">
                                    <span className="text-sm text-muted-foreground">Mesa</span>
                                    <select value={tableId} onChange={e => setTableId(e.target.value)}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                                        <option value="">Selecionar mesa</option>
                                        {tables.filter(t => t.status === 'available').map(t => (
                                            <option key={t.id} value={t.id}>Mesa {t.number} ({t.capacity} lugares)</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label className="block space-y-2">
                                <span className="text-sm text-muted-foreground">Notas</span>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                    placeholder="Ex: aniversário, preferência de lugar..."
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                            </label>
                            <Button onClick={() => createMutation.mutate()}
                                disabled={!date || !tableId || createMutation.isPending}
                                className="w-full">
                                <Plus className="h-4 w-4" />
                                {createMutation.isPending ? 'A criar...' : 'Criar Reserva'}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold">Reservas de Hoje ({todayReservations.length})</h2>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {todayReservations.length ? todayReservations.map(r => (
                            <div key={r.id} className="rounded-lg border border-border bg-background p-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm">{r.clientName}</p>
                                    <span className="text-xs text-muted-foreground">{r.time}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">Mesa {r.tableNumber} | {r.guests} pessoas</p>
                                {r.notes && <p className="text-xs text-accent mt-0.5">{r.notes}</p>}
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground">Nenhuma reserva para hoje.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, Search, Calendar, Users, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { http } from '@/services/api/http'
import { reservationsAdapter } from '@/services/adapters/reservations.adapter'
import { PhoneReservation } from '@/components/forms/PhoneReservation'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

type Tab = 'dashboard' | 'reservas' | 'hospedes' | 'telefone'

export default function RecepcionistaPage() {
    const user = useAuthStore(s => s.user)
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: Calendar },
        { id: 'reservas', label: 'Reservas', icon: CheckCircle },
        { id: 'hospedes', label: 'Hóspedes', icon: Users },
        { id: 'telefone', label: 'Reserva Tel.', icon: Phone },
    ] as const

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Rececionista</p>
                <h1 className="font-display text-3xl text-primary">Bom trabalho, {user?.name?.split(' ')[0]}!</h1>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border overflow-x-auto pb-0">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                        className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                            activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'reservas' && <ReservasTab />}
            {activeTab === 'hospedes' && <HospedesTab />}
            {activeTab === 'telefone' && <TelefoneTab />}
        </div>
    )
}

function DashboardTab() {
    const { data: reservations = [] } = useQuery({
        queryKey: ['reservations'],
        queryFn: () => reservationsAdapter.getAll(),
    })

    const today = new Date().toDateString()
    const todayReservations = reservations.filter(r => new Date(r.date).toDateString() === today)
    const confirmed = todayReservations.filter(r => r.status === 'confirmed')
    const pending = todayReservations.filter(r => r.status === 'pending')
    const cancelled = todayReservations.filter(r => r.status === 'cancelled')

    const stats = [
        { label: 'Reservas hoje', value: todayReservations.length, color: 'text-primary' },
        { label: 'Confirmadas', value: confirmed.length, color: 'text-success' },
        { label: 'Pendentes', value: pending.length, color: 'text-warning' },
        { label: 'Canceladas', value: cancelled.length, color: 'text-danger' },
    ]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map(s => (
                    <div key={s.label} className="rounded-xl border border-border bg-surface p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="font-semibold mb-4">Reservas de hoje</h2>
                {todayReservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem reservas para hoje.</p>
                ) : (
                    <div className="space-y-2">
                        {todayReservations.map(r => (
                            <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                <div>
                                    <p className="text-sm font-medium">{r.clientName}</p>
                                    <p className="text-xs text-muted-foreground">{r.time} · {r.guests} pessoas · Mesa {r.tableNumber}</p>
                                </div>
                                <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                                    r.status === 'confirmed' ? 'bg-success/15 text-success' :
                                        r.status === 'pending' ? 'bg-warning/15 text-warning' :
                                            'bg-danger/15 text-danger')}>
                                    {r.status === 'confirmed' ? 'Confirmada' : r.status === 'pending' ? 'Pendente' : 'Cancelada'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function ReservasTab() {
    const queryClient = useQueryClient()
    const { data: reservations = [] } = useQuery({
        queryKey: ['reservations'],
        queryFn: () => reservationsAdapter.getAll(),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            http.patch(`/reservations/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] })
            toast.success('Reserva atualizada!')
        },
    })

    return (
        <div className="space-y-4">
            <h2 className="font-semibold">Todas as reservas</h2>
            {reservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem reservas.</p>
            ) : (
                <div className="space-y-2">
                    {reservations.map(r => (
                        <div key={r.id} className="rounded-xl border border-border bg-surface p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{r.clientName}</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(new Date(r.date))} · {r.time} · {r.guests} pessoas · Mesa {r.tableNumber}</p>
                                </div>
                                <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                                    r.status === 'confirmed' ? 'bg-success/15 text-success' :
                                        r.status === 'pending' ? 'bg-warning/15 text-warning' :
                                            'bg-danger/15 text-danger')}>
                                    {r.status === 'confirmed' ? 'Confirmada' : r.status === 'pending' ? 'Pendente' : 'Cancelada'}
                                </span>
                            </div>
                            {r.status === 'pending' && (
                                <div className="flex gap-2">
                                    <Button size="sm" className="flex-1"
                                        onClick={() => updateMutation.mutate({ id: r.id, status: 'confirmed' })}>
                                        <CheckCircle className="w-3 h-3" /> Confirmar
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1"
                                        onClick={() => updateMutation.mutate({ id: r.id, status: 'cancelled' })}>
                                        <XCircle className="w-3 h-3" /> Cancelar
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function HospedesTab() {
    const [search, setSearch] = useState('')
    const [phone, setPhone] = useState('')
    const [clientFound, setClientFound] = useState<any | null>(null)

    const findMutation = useMutation({
        mutationFn: () => http.post<unknown, any>('/clients/find-or-create', { name: search, phone }),
        onSuccess: (client) => {
            setClientFound(client)
            toast.success(`Cliente: ${client.name}`)
        },
        onError: () => toast.error('Cliente não encontrado.'),
    })

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <h2 className="font-semibold">Pesquisar hóspede</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefone"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
                <Button onClick={() => findMutation.mutate()} disabled={!search || !phone || findMutation.isPending} className="w-full">
                    <Search className="w-4 h-4" /> Pesquisar
                </Button>
                {clientFound && (
                    <div className="rounded-lg border border-success/30 bg-success/10 p-4 space-y-1">
                        <p className="font-medium text-success">✓ {clientFound.name}</p>
                        <p className="text-sm text-muted-foreground">{clientFound.phone}</p>
                        <p className="text-sm text-muted-foreground">{clientFound.reservationCount} reserva(s)</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function TelefoneTab() {

    return <PhoneReservation />
}
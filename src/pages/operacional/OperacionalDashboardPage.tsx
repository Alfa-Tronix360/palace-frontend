import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { http } from '@/services/api/http'
import { UtensilsCrossed, Wine, Users } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { Link } from 'react-router-dom'
import { PhoneReservation } from '@/components/forms/PhoneReservation'

export default function OperacionalDashboardPage() {
    const user = useAuthStore((state) => state.user)

    // DEPOIS
    const { data: equipaData } = useQuery({
        queryKey: ['operacional-equipa'],
        queryFn: () => http.get<unknown, any>('/operacional/equipa'),
    })
    const equipa = Array.isArray(equipaData) ? equipaData : []

    const roleLabel: Record<string, string> = {
        chefe_sala: 'Chefe de Sala',
        chefe_cozinha: 'Chefe de Cozinha',
        bar: 'Bar',
    }

    const cards = [
        { label: 'Equipa activa', value: equipa.length, icon: Users, color: 'text-accent' },
    ]

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>
                    {roleLabel[user?.role ?? ''] ?? 'Operacional'}
                </p>
                <h1 className="font-display text-3xl text-primary">Bom trabalho, {user?.name?.split(' ')[0]}!</h1>
                <p className="mt-1 text-sm text-muted-foreground">Visão geral do seu turno.</p>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-3">
                {cards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-border bg-surface p-4">
                        <div className="flex items-center gap-3">
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                            <p className="text-sm text-muted-foreground">{card.label}</p>
                        </div>
                        <p className={`text-2xl font-bold mt-2 ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {(user?.role === 'chefe_sala' || user?.role === 'chefe_cozinha') && (
                    <Link to={ROUTES.OPERACIONAL.COZINHA}
                        className="rounded-xl border border-border bg-surface p-5 hover:border-primary/40 transition-colors">
                        <UtensilsCrossed className="w-6 h-6 text-primary mb-2" />
                        <h2 className="font-semibold">Fluxo Cozinha</h2>
                        <p className="text-sm text-muted-foreground mt-1">Ver pedidos de pratos em curso.</p>
                    </Link>
                )}
                {(user?.role === 'chefe_sala' || user?.role === 'bar') && (
                    <Link to={ROUTES.OPERACIONAL.BAR}
                        className="rounded-xl border border-border bg-surface p-5 hover:border-primary/40 transition-colors">
                        <Wine className="w-6 h-6 text-primary mb-2" />
                        <h2 className="font-semibold">Fluxo Bar</h2>
                        <p className="text-sm text-muted-foreground mt-1">Ver pedidos de bebidas em curso.</p>
                    </Link>
                )}
                <Link to={ROUTES.OPERACIONAL.EQUIPA}
                    className="rounded-xl border border-border bg-surface p-5 hover:border-primary/40 transition-colors">
                    <Users className="w-6 h-6 text-primary mb-2" />
                    <h2 className="font-semibold">Equipa</h2>
                    <p className="text-sm text-muted-foreground mt-1">Ver e gerir a equipa do turno.</p>
                </Link>
            </div>
            {user?.role === 'chefe_sala' && (
                <PhoneReservation />
            )}
        </div>
    )
}
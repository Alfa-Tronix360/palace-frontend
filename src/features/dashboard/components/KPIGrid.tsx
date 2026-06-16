import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { tablesAdapter } from '@/services/adapters/tables.adapter'
import { reservationsAdapter } from '@/services/adapters/reservations.adapter'
import { clientsAdapter } from '@/services/adapters/clients.adapter'

export function KPIGrid() {
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: () => tablesAdapter.getAll() })
  const { data: reservations = [] } = useQuery({ queryKey: ['reservations'], queryFn: () => reservationsAdapter.getAll() })
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsAdapter.getAll() })

  const today = new Date().toDateString()
  const reservationsToday = reservations.filter(r => new Date(r.date).toDateString() === today).length
  const availableTables = tables.filter(t => t.status === 'available').length
  const occupiedTables = tables.filter(t => t.status === 'occupied').length
  const reservedTables = tables.filter(t => t.status === 'reserved').length
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length
  const vipClients = clients.filter(c => c.vip).length
  const pendingEvents = reservations.filter(r => r.status === 'pending').length
  const occupancyRate = tables.length > 0 ? Math.round(((occupiedTables + reservedTables) / tables.length) * 100) : 0

  const kpis = [
    { label: 'Reservas Hoje', value: String(reservationsToday), sub: 'reservas hoje', trend: 'up' as const, color: 'text-info' },
    { label: 'Clientes Registados', value: String(clients.length), sub: 'total de clientes', trend: 'up' as const, color: 'text-success' },
    { label: 'Eventos Agendados', value: String(pendingEvents), sub: 'reservas pendentes', trend: 'neutral' as const, color: 'text-warning' },
    { label: 'Total Reservas', value: String(reservations.length), sub: 'todas as reservas', trend: 'up' as const, color: 'text-primary' },
    { label: 'Taxa de Ocupação', value: `${occupancyRate}%`, sub: 'média das mesas', trend: 'up' as const, color: 'text-info' },
    { label: 'Cancelamentos', value: String(cancelledCount), sub: 'reservas canceladas', trend: 'down' as const, color: 'text-danger' },
    { label: 'Clientes VIP', value: String(vipClients), sub: 'clientes VIP', trend: 'up' as const, color: 'text-accent' },
    {
      label: 'Mesas',
      value: String(tables.length),
      sub: `${availableTables} vagas | ${occupiedTables} ocupadas | ${reservedTables} reservadas`,
      trend: 'neutral' as const,
      color: 'text-success',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          className="rounded-xl border border-border/40 bg-surface p-4 hover:border-primary/30 transition-colors space-y-1"
        >
          <p className="text-xs text-muted-foreground leading-tight">{kpi.label}</p>
          <p className={cn('text-xl font-bold', kpi.color)}>{kpi.value}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 text-success" />}
            {kpi.trend === 'down' && <TrendingDown className="w-3 h-3 text-danger" />}
            {kpi.trend === 'neutral' && <Minus className="w-3 h-3 text-warning" />}
            <span>{kpi.sub}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}